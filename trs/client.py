# -*- coding: utf-8 -*-
"""
TRS Graph 可导入客户端（从 docs/trs_flex.py 抽取核心逻辑，去掉 CLI / HTTP 服务部分）。

职责：
1. 连接 TRSGraph（gateway HTTP 网关，默认；或 nebula 原生通道）。
2. nGQL 值/标识符渲染与转义（防注入）。
3. 语句构造器：INSERT / UPSERT / UPDATE VERTEX、CREATE/ALTER TAG、CREATE SPACE/INDEX。
4. 高层 TrsClient：execute / 自动建模 / DESCRIBE / FETCH / UPDATE。

配置来源（优先 Django settings，缺省回退环境变量，再回退默认值）：
  TRS_GRAPH_HOST / TRS_GRAPH_USER / TRS_GRAPH_PASSWORD / TRS_GRAPH_ADDR / TRS_GRAPH_PORT
  TRS_SPACE / TRS_TRANSPORT / TRS_SCHEMA_WAIT_SECONDS / TRS_HTTP_TIMEOUT

注意：TRSGraph 为强 Schema，DDL（CREATE/ALTER SPACE/TAG/INDEX）异步生效，约 2 个心跳周期（默认 20s）。
"""
from __future__ import annotations

import base64
import json
import os
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Sequence, Tuple


class TrsError(RuntimeError):
    """TRS 执行错误（连接失败 / nGQL 报错统一抛出）。"""


def _is_schema_exists_error(err: TrsError) -> bool:
    """识别 TRS/Nebula 在 Schema 已存在时返回的兼容错误文案。"""
    msg = str(err).lower()
    return "schema with same name exists" in msg or "already exists" in msg


# ----------------------------------------------------------------------------
# 配置读取：优先 Django settings，其次环境变量，最后默认值
# ----------------------------------------------------------------------------
def _conf(name: str, default: Any) -> Any:
    """读取配置项：Django settings -> 环境变量 -> 默认值。"""
    try:
        from django.conf import settings as dj_settings  # 延迟导入，便于脱离 Django 使用
        if hasattr(dj_settings, name):
            val = getattr(dj_settings, name)
            if val not in (None, ""):
                return val
    except Exception:  # noqa: BLE001 未配置 Django 时回退
        pass
    env = os.getenv(name)
    return env if env not in (None, "") else default


# ----------------------------------------------------------------------------
# nGQL 值渲染与类型推断（防注入核心：所有写入值都经此转义）
# ----------------------------------------------------------------------------
class Raw:
    """原样写入的 nGQL 片段（如 timestamp()、date("2024-01-01")），渲染时不加引号。"""

    __slots__ = ("expr",)

    def __init__(self, expr: str) -> None:
        self.expr = str(expr)


def _quote(s: str) -> str:
    """字符串字面量转义，使用单引号包裹（防 nGQL 注入）。"""
    s = (
        s.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
    )
    return "'" + s + "'"


def render_value(v: Any) -> str:
    """把 Python 值渲染为 nGQL 字面量。

    None->NULL, bool->true/false, int/float 原样, str->单引号转义,
    list/dict/tuple->JSON 字符串后按字符串写入, Raw->原样。
    """
    if isinstance(v, Raw):
        return v.expr
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return repr(v)
    if isinstance(v, (dict, list, tuple)):
        return _quote(json.dumps(v, ensure_ascii=False, separators=(",", ":")))
    if isinstance(v, str):
        return _quote(v)
    return _quote(str(v))


def infer_ngql_type(v: Any) -> str:
    """根据 Python 值推断 nGQL 字段类型（用于自动建模）。"""
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, int):
        return "int"
    if isinstance(v, float):
        return "double"
    return "string"


def _ident(name: str) -> str:
    """反引号包裹标识符，避免与关键字冲突，并剔除反引号防注入。"""
    return "`" + str(name).replace("`", "") + "`"


def _safe_field(name: str) -> str:
    """校验并返回安全的裸字段名（仅允许字母/数字/下划线）。

    用于 properties(v).<field> 这类无法加反引号的点访问场景，杜绝 nGQL 注入。
    非法字段名直接抛错。
    """
    s = str(name)
    if not s or not all(c.isalnum() or c == "_" for c in s):
        raise TrsError(f"非法字段名: {name!r}")
    return s


# ----------------------------------------------------------------------------
# nGQL 语句构造器
# ----------------------------------------------------------------------------
def build_insert_vertex(tag: str, rows: Sequence[Tuple[Any, Dict[str, Any]]],
                        if_not_exists: bool = False) -> str:
    """构造 INSERT VERTEX；rows 内各行必须拥有相同的属性键集合。rows: [(vid, props), ...]"""
    keys = list(rows[0][1].keys())
    cols = ", ".join(_ident(k) for k in keys)
    parts: List[str] = []
    for vid, props in rows:
        vals = ", ".join(render_value(props[k]) for k in keys)
        parts.append(f"{render_value(vid)}:({vals})")
    ine = "IF NOT EXISTS " if if_not_exists else ""
    return f"INSERT VERTEX {ine}{_ident(tag)}({cols}) VALUES " + ", ".join(parts)


def build_upsert_vertex(tag: str, vid: Any, props: Dict[str, Any]) -> str:
    """构造 UPSERT VERTEX（存在则更新、不存在则插入）。"""
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    return f"UPSERT VERTEX ON {_ident(tag)} {render_value(vid)} SET {sets}"


def build_update_vertex(tag: str, vid: Any, props: Dict[str, Any],
                        when: Optional[str] = None) -> str:
    """构造 UPDATE VERTEX（点不存在会报错，保证"仅改不增"）。

    tag: 标签；vid: 点 VID；props: 待更新属性键值（值经 render_value 转义；Raw 原样）。
    when: 可选条件表达式（如 `name == 'x'`），用于条件更新/远期乐观锁。
    """
    if not props:
        raise ValueError("update 属性不能为空")
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    gql = f"UPDATE VERTEX ON {_ident(tag)} {render_value(vid)} SET {sets}"
    if when:
        gql += f" WHEN {when}"
    return gql


def build_update_edge(edge: str, src: Any, dst: Any, props: Dict[str, Any],
                      rank: int = 0, when: Optional[str] = None) -> str:
    """构造 UPDATE EDGE（边不存在会报错，保证仅更新既有关系）。"""
    if not props:
        raise ValueError("update 属性不能为空")
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    gql = (
        f"UPDATE EDGE ON {_ident(edge)} {render_value(src)} -> {render_value(dst)}"
        f"@{int(rank)} SET {sets}"
    )
    if when:
        gql += f" WHEN {when}"
    return gql


def build_create_schema(kind: str, name: str, props: Dict[str, Any]) -> str:
    """构造 CREATE TAG / CREATE EDGE。kind: 'TAG' | 'EDGE'。"""
    if props:
        cols = ", ".join(f"{_ident(k)} {infer_ngql_type(v)}" for k, v in props.items())
        return f"CREATE {kind} IF NOT EXISTS {_ident(name)} ({cols})"
    return f"CREATE {kind} IF NOT EXISTS {_ident(name)} ()"


def build_alter_add(kind: str, name: str, props: Dict[str, Any]) -> str:
    """构造 ALTER TAG/EDGE ADD（补齐缺失字段）。"""
    cols = ", ".join(f"{_ident(k)} {infer_ngql_type(v)}" for k, v in props.items())
    return f"ALTER {kind} {_ident(name)} ADD ({cols})"


def _build_field_def(field: Dict[str, Any]) -> str:
    """构造 Tag/Edge 字段 DDL 片段，字段名和注释均做安全渲染。"""
    name = field["key"]
    ngql_type = field["ngql_type"]
    nullable = "NULL" if field.get("nullable", True) else "NOT NULL"
    default = field.get("default")
    comment = field.get("comment") or field.get("label")
    parts = [f"{_ident(name)} {ngql_type}", nullable]
    if default not in (None, ""):
        parts.append(f"DEFAULT {render_value(default)}")
    if comment:
        parts.append(f"COMMENT {render_value(comment)}")
    return " ".join(parts)


def build_create_tag(tag: str, fields: Sequence[Dict[str, Any]],
                     comment: Optional[str] = None) -> str:
    """构造 CREATE TAG，支持字段 COMMENT 和 Tag COMMENT。"""
    cols = ", ".join(_build_field_def(f) for f in fields)
    comment_sql = f" COMMENT = {render_value(comment)}" if comment else ""
    return f"CREATE TAG IF NOT EXISTS {_ident(tag)} ({cols}){comment_sql}"


def build_fetch_props(tag: str, vids: Sequence[Any], fields: Sequence[str]) -> str:
    """构造 FETCH PROP（显式 YIELD 各字段为扁平列，跨传输通道结果稳定）。

    返回列：`vid` + 各 field（均为标量）。
    """
    vids_csv = ", ".join(render_value(v) for v in vids)
    # 别名不能以下划线开头（nGQL 裸标识符规则），用 vid
    cols = ["id(vertex) AS vid"]
    cols += [f"{_ident(tag)}.{_ident(f)} AS {_ident(f)}" for f in fields]
    return f"FETCH PROP ON {_ident(tag)} {vids_csv} YIELD " + ", ".join(cols)


def build_insert_edge(edge: str, src: Any, dst: Any, props: Dict[str, Any],
                      rank: int = 0) -> str:
    """构造 INSERT EDGE（用于类型级关系边）。"""
    keys = list(props.keys())
    cols = ", ".join(_ident(k) for k in keys)
    vals = ", ".join(render_value(props[k]) for k in keys)
    return (
        f"INSERT EDGE {_ident(edge)}({cols}) VALUES "
        f"{render_value(src)} -> {render_value(dst)}@{int(rank)}:({vals})"
    )


def build_fetch_edge(edge: str, src: Any, dst: Any, rank: int = 0) -> str:
    """构造 FETCH EDGE，按边四元组精确读取一条关系。"""
    return (
        f"FETCH PROP ON {_ident(edge)} {render_value(src)} -> {render_value(dst)}"
        f"@{int(rank)} YIELD edge AS e"
    )


def _ngql_limit_pipe(offset: int, page_size: int) -> str:
    """构造原生 nGQL 管道分页子句；第一页不输出 offset 逗号，兼容 TRS 网关解析。"""
    if int(offset) > 0:
        return f" | LIMIT {int(offset)}, {int(page_size)}"
    return f" | LIMIT {int(page_size)}"


def _visualize_year_filter(alias: str, year: Optional[str]) -> str:
    """构造可视化年份过滤条件，仅匹配 year/time 两个受信字段。"""
    if not year:
        return ""
    y = render_value(str(year))
    return (
        f"(properties({alias}).{_ident('year')} == {y} OR "
        f"properties({alias}).{_ident('time')} == {y})"
    )


def _coerce_label_list(value: Any, fallback: Optional[str] = None) -> List[str]:
    """把 tags()/labels 返回值规范为标签列表。"""
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("["):
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed if x not in (None, "")]
            except json.JSONDecodeError:
                pass
        return [text] if text else ([fallback] if fallback else [])
    if isinstance(value, (list, tuple)):
        return [str(x) for x in value if x not in (None, "")]
    return [fallback] if fallback else []


def _row_properties(value: Any) -> Dict[str, Any]:
    """把 properties(v) 返回值规范为 dict。"""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("{"):
            try:
                parsed = json.loads(text)
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                return {}
    return {}


def _has_visualize_name(props: Dict[str, Any]) -> bool:
    """判断属性字典是否包含可用于展示的名称字段。"""
    for key in ("name", "title", "organization_name", "label"):
        if props.get(key) not in (None, ""):
            return True
    return False


# ----------------------------------------------------------------------------
# 传输层
# ----------------------------------------------------------------------------
class GatewayTransport:
    """TRSGraph Studio HTTP 网关传输（仅依赖标准库 urllib）。"""

    def __init__(self, host: str, user: str, password: str, addr: str,
                 port: int, timeout: int) -> None:
        self.host = host.rstrip("/")
        self.user = user
        self.password = password
        self.addr = addr
        self.port = port
        self.timeout = timeout
        self._cookie: Optional[str] = None

    def _auth_header(self) -> str:
        token = base64.b64encode(
            json.dumps([self.user, self.password], separators=(",", ":")).encode("utf-8")
        ).decode("ascii")
        return "Bearer " + token

    def _post(self, path: str, payload: dict) -> dict:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(self.host + path, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", self._auth_header())
        if self._cookie:
            req.add_header("Cookie", self._cookie)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                for k, v in resp.getheaders():
                    if k.lower() == "set-cookie" and v.startswith("studio_token="):
                        self._cookie = v.split(";", 1)[0]
                return body
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "ignore")
            try:
                msg = json.loads(raw).get("message", raw)
            except json.JSONDecodeError:
                msg = raw or str(e)
            raise TrsError(f"网关请求失败 {path}: {msg}") from None
        except urllib.error.URLError as e:
            raise TrsError(f"网关连接失败 {self.host}{path}: {e}") from None

    def connect(self) -> None:
        body = self._post("/api-nebula/db/connect", {"address": self.addr, "port": self.port})
        if body.get("code") != 0:
            raise TrsError(f"连接 TRS 失败: {body.get('message')}")

    def execute(self, gql: str) -> dict:
        if self._cookie is None:
            self.connect()
        body = self._post("/api-nebula/db/exec", {"gql": gql})
        if body.get("code") != 0:
            raise TrsError(body.get("message", "执行失败"))
        data = body.get("data") or {}
        return {"headers": data.get("headers") or [], "tables": data.get("tables") or []}

    def close(self) -> None:
        self._cookie = None


class NebulaTransport:
    """原生 nebula3 客户端传输（端口 9669，需安装 nebula3-python）。"""

    def __init__(self, addr: str, port: int, user: str, password: str) -> None:
        try:
            from nebula3.Config import Config
            from nebula3.gclient.net import ConnectionPool
        except ImportError as e:
            raise TrsError("未安装 nebula3-python，无法使用 nebula 通道") from e
        cfg = Config()
        cfg.max_connection_pool_size = 10
        self._pool = ConnectionPool()
        if not self._pool.init([(addr, port)], cfg):
            raise TrsError(f"无法连接 TRS Graph: {addr}:{port}")
        self._session = self._pool.get_session(user, password)

    @staticmethod
    def _unwrap(vw: Any) -> Any:
        try:
            if vw.is_null() or vw.is_empty():
                return None
            if vw.is_bool():
                return vw.as_bool()
            if vw.is_int():
                return vw.as_int()
            if vw.is_double():
                return vw.as_double()
            if vw.is_string():
                return vw.as_string()
        except Exception:  # noqa: BLE001 复杂类型回退字符串
            pass
        return str(vw)

    def execute(self, gql: str) -> dict:
        result = self._session.execute(gql)
        if not result.is_succeeded():
            raise TrsError(result.error_msg())
        keys = result.keys()
        tables: List[Dict[str, Any]] = []
        for i in range(result.row_size()):
            vals = result.row_values(i)
            tables.append({keys[j]: self._unwrap(vals[j]) for j in range(len(keys))})
        return {"headers": keys, "tables": tables}

    def close(self) -> None:
        try:
            self._session.release()
        finally:
            self._pool.close()


# ----------------------------------------------------------------------------
# 高层客户端
# ----------------------------------------------------------------------------
class TrsClient:
    """TRS 灵活读写客户端（线程安全；默认走 gateway 通道）。"""

    def __init__(self, transport=None, default_space: str = "",
                 schema_wait: int = 20) -> None:
        self.t = transport or make_transport()
        self.default_space = default_space or str(_conf("TRS_SPACE", "") or "")
        self.schema_wait = schema_wait
        self._lock = threading.Lock()

    # ---- 基础执行 ----
    def execute(self, gql: str, space: Optional[str] = None) -> dict:
        """执行 nGQL；指定 space 时自动前置 USE。"""
        space = space if space is not None else self.default_space
        if space:
            gql = f"USE {_ident(space)}; {gql}"
        with self._lock:
            return self.t.execute(gql)

    def execute_raw(self, gql: str) -> dict:
        with self._lock:
            return self.t.execute(gql)

    # ---- Schema ----
    def _describe_schema(self, kind: str, name: str, space: Optional[str] = None) -> List[Dict[str, Any]]:
        """DESCRIBE TAG/EDGE，返回原始字段行。"""
        kind = kind.upper()
        res = self.execute(f"DESCRIBE {kind} {_ident(name)}", space=space)
        return res["tables"]

    def describe_fields(self, tag: str, space: Optional[str] = None) -> List[str]:
        """DESCRIBE TAG，返回字段名有序列表；不存在抛 TrsError。"""
        fields: List[str] = []
        for row in self._describe_schema("TAG", tag, space=space):
            fname = row.get("Field") or row.get("field") or row.get("Name")
            if fname:
                fields.append(fname)
        return fields

    def describe_fields_full(self, tag: str, space: Optional[str] = None) -> Dict[str, str]:
        """DESCRIBE TAG，返回 {字段名: Comment}。

        用于把动态新增属性的 label 持久化在列 COMMENT，并在 detail 中读回。
        """
        comments: Dict[str, str] = {}
        for row in self._describe_schema("TAG", tag, space=space):
            fname = row.get("Field") or row.get("field") or row.get("Name")
            if fname:
                comments[fname] = row.get("Comment") or row.get("comment") or ""
        return comments

    def describe_fields_meta(self, tag: str, space: Optional[str] = None) -> List[Dict[str, Any]]:
        """DESCRIBE TAG，返回字段定义原始行，供业务层读取类型/注释/默认值。"""
        return self._describe_schema("TAG", tag, space=space)

    def describe_edge(self, edge: str, space: Optional[str] = None) -> List[Dict[str, Any]]:
        """DESCRIBE EDGE，返回 Edge type 字段定义行。"""
        return self._describe_schema("EDGE", edge, space=space)

    def describe_edge_fields(self, edge: str, space: Optional[str] = None) -> List[str]:
        """DESCRIBE EDGE，返回 Edge type 字段名有序列表。"""
        fields: List[str] = []
        for row in self.describe_edge(edge, space=space):
            fname = row.get("Field") or row.get("field") or row.get("Name")
            if fname:
                fields.append(fname)
        return fields

    def describe_edge_fields_full(self, edge: str, space: Optional[str] = None) -> Dict[str, str]:
        """DESCRIBE EDGE，返回 {字段名: Comment}。"""
        comments: Dict[str, str] = {}
        for row in self.describe_edge(edge, space=space):
            fname = row.get("Field") or row.get("field") or row.get("Name")
            if fname:
                comments[fname] = row.get("Comment") or row.get("comment") or ""
        return comments

    def ensure_schema(self, kind: str, name: str, props: Dict[str, Any],
                      space: Optional[str] = None) -> bool:
        """确保 TAG/EDGE 存在且含 props 全部字段；返回是否发生变更。"""
        kind = kind.upper()
        try:
            if kind == "EDGE":
                existing = set(self.describe_edge_fields(name, space=space))
            else:
                existing = set(self.describe_fields(name, space=space))
        except TrsError:
            existing = None
        changed = False
        if existing is None:
            self.execute(build_create_schema(kind, name, props), space=space)
            changed = True
        else:
            missing = {k: v for k, v in props.items() if k not in existing}
            if missing:
                self.execute(build_alter_add(kind, name, missing), space=space)
                changed = True
        if changed and self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return changed

    # ---- 读 ----
    def fetch_props(self, tag: str, vids: Sequence[Any], fields: Sequence[str],
                    space: Optional[str] = None) -> List[Dict[str, Any]]:
        """FETCH PROP，返回行列表（每行含 `vid` 与各 field）。空 vids 返回 []。"""
        if not vids:
            return []
        res = self.execute(build_fetch_props(tag, vids, fields), space=space)
        return res["tables"]

    # ---- 写 ----
    def insert_vertex(self, tag: str, vid: Any, props: Dict[str, Any],
                      if_not_exists: bool = False, space: Optional[str] = None) -> dict:
        return self.execute(build_insert_vertex(tag, [(vid, props)], if_not_exists=if_not_exists),
                            space=space)

    def update_vertex(self, tag: str, vid: Any, props: Dict[str, Any],
                      when: Optional[str] = None, space: Optional[str] = None) -> dict:
        """UPDATE VERTEX（点不存在报错）。"""
        return self.execute(build_update_vertex(tag, vid, props, when=when), space=space)

    def delete_vertex(self, vid: Any, space: Optional[str] = None) -> dict:
        """DELETE VERTEX（同时删除关联出/入边）。vid 经 render_value 转义防注入。"""
        return self.execute(f"DELETE VERTEX {render_value(vid)} WITH EDGE", space=space)

    def ping(self) -> bool:
        """连通性探测：执行轻量 nGQL（SHOW SPACES）验证连接+鉴权；失败抛 TrsError。"""
        self.execute_raw("SHOW SPACES")
        return True

    def show_spaces(self) -> List[str]:
        """SHOW SPACES，返回图空间名称列表。"""
        res = self.execute_raw("SHOW SPACES")
        names: List[str] = []
        for row in res["tables"]:
            n = row.get("Name") or row.get("name")
            if n:
                names.append(n)
        return names

    def ensure_space(self, space: str, comment: str = "图谱属性管理空间") -> bool:
        """确保图空间存在；镜像服务启动或首次请求时自动初始化，不依赖额外脚本。"""
        if not space:
            return False
        if space in set(self.show_spaces()):
            return False
        gql = (
            f"CREATE SPACE IF NOT EXISTS {_ident(space)} "
            "(partition_num = 10, replica_factor = 1, vid_type = FIXED_STRING(64)) "
            f"COMMENT = {render_value(comment)}"
        )
        self.execute_raw(gql)
        if self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return True

    def show_tags(self, space: Optional[str] = None) -> List[str]:
        """SHOW TAGS，返回当前图空间内全部 Tag 名称。"""
        res = self.execute("SHOW TAGS", space=space)
        names: List[str] = []
        for row in res["tables"]:
            n = row.get("Name") or row.get("name")
            if n:
                names.append(n)
        return names

    @staticmethod
    def _extract_schema_comment(row: Dict[str, Any]) -> str:
        """从 SHOW CREATE TAG/EDGE 返回行中解析 schema 自身 COMMENT。"""
        ddl = ""
        for key, val in row.items():
            if "create" in str(key).lower():
                ddl = str(val)
                break
        if not ddl:
            return ""
        marker = "COMMENT ="
        idx = ddl.upper().rfind(marker)
        if idx < 0:
            return ""
        raw = ddl[idx + len(marker):].strip().rstrip(";")
        if not raw:
            return ""
        if raw[0] in ("'", '"', "`"):
            quote = raw[0]
            end = raw.find(quote, 1)
            return raw[1:end] if end > 0 else raw.strip(quote)
        return raw.split()[0]

    def tag_comment(self, tag: str, space: Optional[str] = None) -> str:
        """读取 Tag 自身 COMMENT；读取失败时返回空串，避免影响列表展示。"""
        try:
            res = self.execute(f"SHOW CREATE TAG {_ident(tag)}", space=space)
            return self._extract_schema_comment(res["tables"][0]) if res["tables"] else ""
        except TrsError:
            return ""

    def edge_comment(self, edge: str, space: Optional[str] = None) -> str:
        """读取 Edge type 自身 COMMENT；读取失败时返回空串。"""
        try:
            res = self.execute(f"SHOW CREATE EDGE {_ident(edge)}", space=space)
            return self._extract_schema_comment(res["tables"][0]) if res["tables"] else ""
        except TrsError:
            return ""

    def describe_space(self, name: str) -> Dict[str, Any]:
        """DESCRIBE SPACE，返回首行信息（含 Comment / Vid Type 等）；不存在抛 TrsError。"""
        res = self.execute_raw(f"DESCRIBE SPACE {_ident(name)}")
        return res["tables"][0] if res["tables"] else {}

    def count_tag_vertices(self, space: str, tag: str) -> int:
        """统计某 space 内某 tag 的顶点数（LOOKUP + COUNT，需该 tag 有索引）。"""
        gql = f"LOOKUP ON {_ident(tag)} YIELD id(vertex) AS vid | YIELD COUNT(*) AS total"
        res = self.execute(gql, space=space)
        return int(res["tables"][0].get("total") or 0) if res["tables"] else 0

    def show_tags(self, space: Optional[str] = None) -> List[str]:
        """SHOW TAGS，返回 tag 名称列表。"""
        res = self.execute("SHOW TAGS", space=space)
        names: List[str] = []
        for row in res["tables"]:
            n = row.get("Name") or row.get("name")
            if n:
                names.append(n)
        return names

    def vertex_stats_by_tag(self, space: str, since_field: Optional[str] = None,
                            since_ts: Optional[int] = None) -> List[Dict[str, Any]]:
        """一次全量扫描按 tag 统计顶点数（可同时统计 since_field >= since_ts 的最近新增数）。

        返回 [{"tag": str, "count": int, "recent": int}, ...]。
        - 用 MATCH (v) + tags() 分组（本图库下 MATCH (v:tag)/LOOKUP 计数返回为空，故用全量扫描）。
        - 别名不可用保留字 `tag`，此处用 `etype`。
        - 给定 since_field/since_ts 时，用 sum(CASE WHEN ...) 在同一次扫描内算出最近新增；
          since_field 仅取受信常量（create_time），since_ts 强制 int，避免 nGQL 注入。
        """
        if since_field and since_ts is not None:
            recent_expr = (f"sum(CASE WHEN properties(v).{_safe_field(since_field)} >= "
                           f"{int(since_ts)} THEN 1 ELSE 0 END)")
        else:
            recent_expr = "0"
        gql = (f"MATCH (v) RETURN tags(v)[0] AS etype, count(*) AS cnt, "
               f"{recent_expr} AS recent")
        res = self.execute(gql, space=space)
        out: List[Dict[str, Any]] = []
        for row in res["tables"]:
            tag = row.get("etype")
            if tag in (None, ""):
                continue
            out.append({
                "tag": str(tag),
                "count": int(row.get("cnt") or 0),
                "recent": int(row.get("recent") or 0),
            })
        return out

    def count_vertices_of_tag(self, space: str, tag: str) -> int:
        """直接统计某个 tag 的顶点数（不分组全部 tag）。

        用 MATCH (v) WHERE <tag> IN tags(v) 定向计数（本图库下 MATCH (v:tag)/LOOKUP 计数返回空）。
        tag 经 render_value 转义为字符串字面量，避免 nGQL 注入。
        """
        gql = f"MATCH (v) WHERE {render_value(tag)} IN tags(v) RETURN count(v) AS total"
        res = self.execute(gql, space=space)
        return int(res["tables"][0].get("total") or 0) if res["tables"] else 0

    def vertex_exists(self, space: str, vid: Any) -> bool:
        """判断顶点是否真实存在（按 vid 精确查，跨所有 tag）。

        用 FETCH PROP ON * 精确定位：真实顶点返回一行，悬挂 id（无 tag）返回空。
        vid 经 render_value 转义，避免 nGQL 注入。
        """
        gql = f"FETCH PROP ON * {render_value(vid)} YIELD id(vertex) AS vid"
        res = self.execute(gql, space=space)
        return bool(res["tables"])

    def count_vertex_edges(self, space: str, vid: Any) -> int:
        """统计某顶点的关联边数（出边 + 入边）。

        用于 DELETE VERTEX ... WITH EDGE 前统计将被连带删除的边数量。
        vid 经 render_value 转义，避免 nGQL 注入。
        """
        gql = (f"MATCH (v)-[e]-() WHERE id(v) == {render_value(vid)} "
               f"RETURN count(e) AS total")
        res = self.execute(gql, space=space)
        return int(res["tables"][0].get("total") or 0) if res["tables"] else 0

    def count_edges_by_type(self, space: str) -> Dict[str, int]:
        """一次全量扫描按 edge type 统计边数，返回 {edge: count}。

        用 MATCH ()-[e]->() + type(e) 分组，替代逐 edge type 多次 count_edge（减少往返）。
        """
        gql = "MATCH ()-[e]->() RETURN type(e) AS etype, count(*) AS cnt"
        res = self.execute(gql, space=space)
        out: Dict[str, int] = {}
        for row in res["tables"]:
            et = row.get("etype")
            if et in (None, ""):
                continue
            out[str(et)] = out.get(str(et), 0) + int(row.get("cnt") or 0)
        return out

    def count_recent_vertices(self, space: str, field: str, since_ts: int) -> int:
        """统计 field(时间戳列) >= since_ts 的顶点数（跨所有 tag，单次 MATCH 扫描）。

        用于"最近新增实体"统计（SHOW STATS 无时间维度，故仍需一次扫描）。
        field 仅取受信常量（create_time）、since_ts 强制 int，避免 nGQL 注入。
        """
        prop = f"properties(v).{_safe_field(field)}"
        gql = f"MATCH (v) WHERE {prop} >= {int(since_ts)} RETURN count(*) AS total"
        res = self.execute(gql, space=space)
        return int(res["tables"][0].get("total") or 0) if res["tables"] else 0

    def submit_job_stats(self, space: str) -> Any:
        """提交 SUBMIT JOB STATS 异步统计任务，返回 job id。

        用于定时刷新 SHOW STATS 快照（统计为异步、分钟级延迟）。
        """
        res = self.execute("SUBMIT JOB STATS", space=space)
        row = res["tables"][0] if res["tables"] else {}
        return row.get("New Job Id") or row.get("New Job ID") or row.get("Job Id")

    def show_stats(self, space: str) -> Dict[str, Any]:
        """读取 SHOW STATS 统计快照（秒级返回，数据为上次 SUBMIT JOB STATS 的结果）。

        返回 {"tags": {tag: count}, "edges": {edge: count},
              "vertex_total": int, "edge_total": int}。
        从未执行过 SUBMIT JOB STATS 时各项为空/0（上层据此回退到 MATCH 扫描）。
        """
        res = self.execute("SHOW STATS", space=space)
        tags: Dict[str, int] = {}
        edges: Dict[str, int] = {}
        vertex_total = 0
        edge_total = 0
        for row in res["tables"]:
            typ = row.get("Type") or row.get("type") or ""
            name = row.get("Name") or row.get("name")
            cnt = int(row.get("Count") or row.get("count") or 0)
            if typ == "Tag" and name:
                tags[str(name)] = cnt
            elif typ == "Edge" and name:
                edges[str(name)] = cnt
            elif typ == "Space" and name == "vertices":
                vertex_total = cnt
            elif typ == "Space" and name == "edges":
                edge_total = cnt
        return {"tags": tags, "edges": edges,
                "vertex_total": vertex_total, "edge_total": edge_total}

    def ensure_field(self, tag: str, field: str, ngql_type: str,
                     comment: Optional[str] = None,
                     space: Optional[str] = None) -> bool:
        """确保 tag 含 field 列：不存在则 ALTER TAG ADD（指定类型+COMMENT）并等待生效。返回是否新增。

        tag 不存在时 DESCRIBE 抛 TrsError，交由上层归类（Schema 不存在）。
        """
        existing = set(self.describe_fields(tag, space=space))
        if field in existing:
            return False
        comment_sql = f" COMMENT {render_value(comment)}" if comment else ""
        self.execute(
            f"ALTER TAG {_ident(tag)} ADD ({_ident(field)} {ngql_type}{comment_sql})",
            space=space,
        )
        if self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return True

    def create_tag(self, tag: str, fields: Sequence[Dict[str, Any]],
                   comment: Optional[str] = None,
                   space: Optional[str] = None) -> dict:
        """创建实体类型 Tag；字段定义由业务层校验后传入。"""
        res = self.execute(build_create_tag(tag, fields, comment=comment), space=space)
        if self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return res

    def drop_tag(self, tag: str, space: Optional[str] = None) -> dict:
        """删除实体类型 Tag；这是 Schema 级删除，会移除该 Tag 下的数据。"""
        return self.execute(f"DROP TAG IF EXISTS {_ident(tag)}", space=space)

    # ---- 关系边 / Edge type ----
    def show_edges(self, space: Optional[str] = None) -> List[str]:
        """SHOW EDGES，返回 edge type 名称列表。"""
        res = self.execute("SHOW EDGES", space=space)
        names: List[str] = []
        for row in res["tables"]:
            n = row.get("Name") or row.get("name")
            if n:
                names.append(n)
        return names

    def edge_exists(self, edge: str, space: Optional[str] = None) -> bool:
        """判断 edge type 是否存在。"""
        return edge in set(self.show_edges(space=space))

    def drop_edge(self, edge: str, space: Optional[str] = None) -> dict:
        """删除 Edge type；这是 Schema 级删除，会移除该 Edge type 下的边数据。"""
        return self.execute(f"DROP EDGE IF EXISTS {_ident(edge)}", space=space)

    def ensure_edge_type(self, edge: str, comment: Optional[str] = None,
                         space: Optional[str] = None,
                         props: Optional[Dict[str, Any]] = None) -> bool:
        """确保 edge type 存在；不存在则 CREATE EDGE，并把 label/comment JSON 写入 COMMENT。

        props 用于关系 CRUD 动态建模，传入示例值后按类型推断 Edge 属性字段。
        """
        try:
            existing = set(self.describe_edge_fields(edge, space=space))
        except TrsError:
            existing = None
        if existing is not None:
            if not props:
                return False
            missing = {k: v for k, v in props.items() if k not in existing}
            if not missing:
                return False
            self.execute(build_alter_add("EDGE", edge, missing), space=space)
            if self.schema_wait > 0:
                time.sleep(self.schema_wait)
            return True
        if self.edge_exists(edge, space=space):
            if props:
                return self.ensure_schema("EDGE", edge, props, space=space)
            return False
        comment_sql = f" COMMENT = {render_value(comment)}" if comment else ""
        if props:
            cols = ", ".join(f"{_ident(k)} {infer_ngql_type(v)}" for k, v in props.items())
        else:
            cols = (
                f"{_ident('created_at')} timestamp DEFAULT timestamp(), "
                f"{_ident('updated_at')} timestamp DEFAULT timestamp()"
            )
        gql = (
            f"CREATE EDGE IF NOT EXISTS {_ident(edge)} "
            f"({cols})"
            f"{comment_sql}"
        )
        try:
            self.execute(gql, space=space)
        except TrsError as e:
            if not _is_schema_exists_error(e):
                raise
            if props:
                return self.ensure_schema("EDGE", edge, props, space=space)
            return False
        if self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return True

    def insert_edge(self, edge: str, src: Any, dst: Any, rank: int = 0,
                    space: Optional[str] = None,
                    props: Optional[Dict[str, Any]] = None) -> dict:
        """INSERT EDGE：创建有向关系边，支持传入任意 Edge 属性。"""
        edge_props = props or {"created_at": Raw("timestamp()"), "updated_at": Raw("timestamp()")}
        return self.execute(build_insert_edge(edge, src, dst, edge_props, rank=rank), space=space)

    def update_edge(self, edge: str, src: Any, dst: Any, props: Dict[str, Any],
                    rank: int = 0, when: Optional[str] = None,
                    space: Optional[str] = None) -> dict:
        """UPDATE EDGE：按 <src, edge, rank, dst> 修改既有关系属性。"""
        return self.execute(build_update_edge(edge, src, dst, props, rank=rank, when=when),
                            space=space)

    def fetch_edge(self, edge: str, src: Any, dst: Any, rank: int = 0,
                   space: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """FETCH EDGE：按边四元组精确读取一条关系；不存在返回 None。"""
        res = self.execute(build_fetch_edge(edge, src, dst, rank=rank), space=space)
        return res["tables"][0] if res["tables"] else None

    def list_edges(self, edge: str, src: Any = None, dst: Any = None,
                   direction: str = "out", rank: Optional[int] = None,
                   page: int = 1, page_size: int = 100,
                   space: Optional[str] = None) -> List[Dict[str, Any]]:
        """分页查询关系边。

        优先用已知 VID 做 GO 遍历；没有 VID 时退化为 MATCH + SKIP/LIMIT，调用方需避免大图全扫。
        """
        page = max(int(page), 1)
        page_size = max(int(page_size), 1)
        offset = (page - 1) * page_size
        direction = (direction or "out").lower()
        yield_cols = (
            "src(edge) AS srcId, dst(edge) AS dstId, rank(edge) AS rank, "
            "properties(edge) AS properties"
        )
        if src is not None and dst is not None and rank is not None:
            row = self.fetch_edge(edge, src, dst, rank=rank, space=space)
            return [row] if row else []
        if src is not None:
            suffix = {"in": " REVERSELY", "bidirect": " BIDIRECT"}.get(direction, "")
            gql = (
                f"GO FROM {render_value(src)} OVER {_ident(edge)}{suffix} "
                f"YIELD {yield_cols}{_ngql_limit_pipe(offset, page_size)}"
            )
        elif dst is not None:
            suffix = "" if direction == "out" else " REVERSELY"
            if direction == "bidirect":
                suffix = " BIDIRECT"
            gql = (
                f"GO FROM {render_value(dst)} OVER {_ident(edge)}{suffix} "
                f"YIELD {yield_cols}{_ngql_limit_pipe(offset, page_size)}"
            )
        else:
            page_clause = f" SKIP {offset} LIMIT {page_size}" if offset > 0 else f" LIMIT {page_size}"
            gql = (
                f"MATCH (src)-[e:{_ident(edge)}]->(dst) "
                f"RETURN id(src) AS srcId, id(dst) AS dstId, rank(e) AS rank, "
                f"properties(e) AS properties{page_clause}"
            )
        res = self.execute(gql, space=space)
        return res["tables"]

    # ---- 可视化只读查询 ----
    def list_vertices_for_visualize(self, entity_type: Optional[str] = None,
                                    year: Optional[str] = None,
                                    offset: int = 0, limit: int = 100,
                                    space: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
        """查询可视化节点数据，返回 (rows, total)。

        total 为当前页返回数量，避免在亿级图谱上每次执行昂贵 count；
        上层按分页窗口展示。
        """
        pattern = f"(v:{_ident(entity_type)})" if entity_type else "(v)"
        where = _visualize_year_filter("v", year)
        where_sql = f" WHERE {where}" if where else ""
        gql = (
            f"MATCH {pattern}{where_sql} "
            "RETURN id(v) AS id, tags(v) AS labels, properties(v) AS properties "
            f"ORDER BY id SKIP {int(offset)} LIMIT {int(limit)}"
        )
        rows = self.execute(gql, space=space)["tables"]
        hydrated: List[Dict[str, Any]] = []
        for row in rows:
            props = _row_properties(row.get("properties"))
            if not _has_visualize_name(props):
                labels = _coerce_label_list(row.get("labels") or row.get("tags"), fallback=entity_type)
                detail = self.fetch_vertex_any_tag(
                    row.get("id") or row.get("vid"),
                    entity_type=labels[0] if labels else entity_type,
                    space=space,
                )
                if detail:
                    row = detail
                    props = _row_properties(detail.get("properties"))
            row["properties"] = props
            hydrated.append(row)
        return hydrated, len(rows)

    def list_edges_for_visualize(self, edge_type: Optional[str] = None,
                                 year: Optional[str] = None,
                                 offset: int = 0, limit: int = 100,
                                 space: Optional[str] = None) -> List[Dict[str, Any]]:
        """查询可视化边数据，返回 rows。"""
        edge_pattern = f"[e:{_ident(edge_type)}]" if edge_type else "[e]"
        where = _visualize_year_filter("e", year)
        where_sql = f" WHERE {where}" if where else ""
        gql = (
            f"MATCH ()-{edge_pattern}->(){where_sql} "
            "RETURN src(e) AS source, dst(e) AS target, type(e) AS edgeType, "
            "rank(e) AS edgeRank, properties(e) AS properties "
            f"ORDER BY source, edgeType, edgeRank, target SKIP {int(offset)} LIMIT {int(limit)}"
        )
        return self.execute(gql, space=space)["tables"]

    def fetch_vertex_any_tag(self, vid: Any, entity_type: Optional[str] = None,
                             space: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """按 VID 查询节点；给定 entity_type 时限定 Tag。"""
        pattern = f"(v:{_ident(entity_type)})" if entity_type else "(v)"
        gql = (
            f"MATCH {pattern} WHERE id(v) == {render_value(vid)} "
            "RETURN id(v) AS id, tags(v) AS labels, properties(v) AS properties "
            "LIMIT 1"
        )
        rows = self.execute(gql, space=space)["tables"]
        row = rows[0] if rows else None
        labels = _coerce_label_list(
            (row or {}).get("labels") or (row or {}).get("tags"),
            fallback=entity_type,
        )
        schema: Dict[str, Dict[str, str]] = {}
        fields_by_tag: Dict[str, List[str]] = {}
        for tag in labels:
            if not tag:
                continue
            try:
                metas = self.describe_fields_meta(str(tag), space=space)
                fields_by_tag[str(tag)] = []
                for meta in metas:
                    fname = meta.get("Field") or meta.get("field") or meta.get("Name")
                    if fname:
                        fields_by_tag[str(tag)].append(fname)
                        schema[fname] = {
                            "label": meta.get("Comment") or meta.get("comment") or fname,
                            "type": meta.get("Type") or meta.get("type") or "",
                        }
            except TrsError:
                continue
        props = _row_properties((row or {}).get("properties"))
        if not props:
            for tag, fields in fields_by_tag.items():
                fetched = self.fetch_props(tag, [vid], fields, space=space)
                if not fetched:
                    continue
                fetched_row = fetched[0]
                props = {
                    k: v for k, v in fetched_row.items()
                    if k != "vid" and v not in (None, "", "NULL", "__NULL__")
                }
                row = {
                    "id": fetched_row.get("vid") or vid,
                    "labels": [tag],
                    "properties": props,
                }
                break
        if row is None:
            return None
        row["labels"] = labels or row.get("labels") or []
        row["properties"] = props
        row["schema"] = schema
        return row

    def list_related_vertices(self, vid: Any, limit: int = 100,
                              space: Optional[str] = None) -> List[Dict[str, Any]]:
        """查询节点一跳关联实体摘要。"""
        gql = (
            f"MATCH (v)-[e]-(n) WHERE id(v) == {render_value(vid)} "
            "RETURN id(n) AS id, tags(n) AS labels, properties(n) AS properties "
            f"LIMIT {int(limit)}"
        )
        rows = self.execute(gql, space=space)["tables"]
        hydrated: List[Dict[str, Any]] = []
        for row in rows:
            props = _row_properties(row.get("properties"))
            if not _has_visualize_name(props):
                labels = _coerce_label_list(row.get("labels") or row.get("tags"))
                detail = self.fetch_vertex_any_tag(
                    row.get("id") or row.get("vid"),
                    entity_type=labels[0] if labels else None,
                    space=space,
                )
                if detail:
                    row = detail
                    props = _row_properties(detail.get("properties"))
            row["properties"] = props
            hydrated.append(row)
        return hydrated

    def find_paths(self, source: Any, target: Any, all_paths: bool = False,
                   max_steps: int = 10, limit: int = 20,
                   space: Optional[str] = None) -> List[Dict[str, Any]]:
        """查询起终点路径，默认最短路径；全部路径必须限制步数和返回数量。"""
        kind = "ALL" if all_paths else "SHORTEST"
        steps = max(1, min(int(max_steps), 10))
        row_limit = max(1, min(int(limit), 20))
        gql = (
            f"FIND {kind} PATH WITH PROP FROM {render_value(source)} "
            f"TO {render_value(target)} OVER * BIDIRECT UPTO {steps} STEPS "
            f"YIELD path AS p | LIMIT {row_limit}"
        )
        return self.execute(gql, space=space)["tables"]

    def delete_edge(self, edge: str, src: Any, dst: Any, rank: int = 0,
                    space: Optional[str] = None) -> dict:
        """DELETE EDGE：删除类型级关系边。"""
        gql = f"DELETE EDGE {_ident(edge)} {render_value(src)} -> {render_value(dst)}@{int(rank)}"
        return self.execute(gql, space=space)

    def count_edge(self, space: str, edge: str) -> int:
        """统计某 space 内某 edge type 的边数量（MATCH 不依赖 Edge 索引；失败由上层兜底）。"""
        gql = f"MATCH ()-[e:{_ident(edge)}]->() RETURN count(e) AS total"
        res = self.execute(gql, space=space)
        return int(res["tables"][0].get("total") or 0) if res["tables"] else 0

    def close(self) -> None:
        try:
            self.t.close()
        except Exception:  # noqa: BLE001 关闭失败不影响主流程
            pass


def make_transport(kind: Optional[str] = None, timeout: Optional[int] = None):
    """根据配置创建传输通道（gateway 默认 / nebula 可选）。

    连接参数全部读取 Django settings / 环境变量（TRS_GRAPH_*），**不在此硬编码 host/账号**。
    默认值由 settings（如 DEV.py 用 os.getenv 提供），缺失时报清晰错误。timeout 可覆盖 HTTP 超时。
    """
    kind = kind or str(_conf("TRS_TRANSPORT", "gateway") or "gateway")
    host = str(_conf("TRS_GRAPH_HOST", "") or "")
    user = str(_conf("TRS_GRAPH_USER", "") or "")
    password = str(_conf("TRS_GRAPH_PASSWORD", "") or "")
    addr = str(_conf("TRS_GRAPH_ADDR", "") or "")
    port = int(_conf("TRS_GRAPH_PORT", 9669) or 9669)
    timeout = int(timeout) if timeout is not None else int(_conf("TRS_HTTP_TIMEOUT", 30) or 30)
    if kind == "nebula":
        if not addr:
            raise TrsError("未配置 TRS_GRAPH_ADDR，请在环境变量/settings 中设置（参考 env-api.sh）")
        return NebulaTransport(addr=addr, port=port, user=user, password=password)
    if not host:
        raise TrsError("未配置 TRS_GRAPH_HOST，请在环境变量/settings 中设置（参考 env-api.sh）")
    return GatewayTransport(host=host, user=user, password=password, addr=addr or "127.0.0.1",
                            port=port, timeout=timeout)


def get_client(space: Optional[str] = None, timeout: Optional[int] = None) -> TrsClient:
    """依据配置构建 TrsClient（每次新建，适配无状态请求）。timeout 可覆盖 HTTP 超时（启动探测用短超时）。"""
    schema_wait = int(_conf("TRS_SCHEMA_WAIT_SECONDS", 20) or 20)
    return TrsClient(transport=make_transport(timeout=timeout),
                     default_space=space or str(_conf("TRS_SPACE", "") or ""),
                     schema_wait=schema_wait)
