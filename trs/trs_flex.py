"""
TRS Graph 灵活读写工具（节点 / 边自由字段，配套 curl 接口）。

设计目标
========
1. 不写死字段：写入点 / 边时，传入任意 dict 属性即可，自动生成 nGQL，
   自动做字符串转义、类型渲染；可选自动建模（CREATE / ALTER TAG/EDGE 补齐缺失字段）。
2. 提供 curl 接口：内置一个零依赖（仅标准库）的 HTTP 服务，
   用「自由 JSON」写入点 / 边、执行查询，方便 curl / 任意语言调用。
3. 双传输通道：
   - gateway（默认）：走 TRSGraph Studio 的 HTTP 网关（端口 7001），仅用标准库 urllib，
     无需安装 nebula3，适合无法直连 9669 的环境。
   - nebula（可选）：走原生 nebula3 客户端（端口 9669），需 `pip install nebula3-python`。

连接配置（环境变量，均有默认值，与 TRS.md / .env 对齐）
======================================================
  TRS_GRAPH_HOST      Studio HTTP 网关地址，默认 http://114.117.127.200:7001
  TRS_GRAPH_USER      用户名，默认 root
  TRS_GRAPH_PASSWORD  密码，默认 trsadmin
  TRS_GRAPH_ADDR      网关内部连接 graphd 的地址，默认 127.0.0.1（网关与 graphd 同机时用此值）
  TRS_GRAPH_PORT      graphd 端口，默认 9669
  TRS_SPACE           默认图空间，默认 knowledge_graph
  TRS_TRANSPORT       传输通道：gateway（默认）/ nebula

命令行用法（在 gkx-mis-api 目录下，用项目 venv 执行）
==================================================
  uv run docs/trs_flex.py exec   --gql "SHOW SPACES;"
  uv run docs/trs_flex.py query  --space knowledge_graph --gql "MATCH (v:entity) RETURN v LIMIT 5"

  # 写入「任意字段」的点（自由 JSON，--auto-schema 自动补齐 TAG 字段）
  uv run docs/trs_flex.py vertex --auto-schema \
      --json '{"tag":"entity","vid":"e_ai","props":{"name":"人工智能","type":"技术领域","heat":0.97,"tags":["AI","ML"]}}'

  # 写入「任意字段」的边
  uv run docs/trs_flex.py edge --auto-schema \
      --json '{"edge":"relation","src":"e_ai","dst":"e_dl","rank":0,"props":{"name":"包含","weight":0.95}}'

  # 批量写入：{"vertices":[...], "edges":[...]}，支持 --file / stdin
  uv run docs/trs_flex.py batch --auto-schema --file data.json

  # 启动 curl 接口（自由 JSON 写点 / 写边 / 查询）
  uv run docs/trs_flex.py serve --host 127.0.0.1 --port 8080

注意：TRSGraph 为强 Schema，写入前字段必须已存在于 TAG/EDGE 中。
      使用 --auto-schema（或接口 ensure_schema=true）可自动补齐，但 Schema 变更为异步，
      首次新增字段需等待约 2 个心跳周期（默认 20s）生效。
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

# ----------------------------------------------------------------------------
# 连接配置（环境变量覆盖默认值）
# ----------------------------------------------------------------------------
TRS_GRAPH_HOST = os.getenv("TRS_GRAPH_HOST", "http://114.117.127.200:7001").rstrip("/")
TRS_GRAPH_USER = os.getenv("TRS_GRAPH_USER", "root")
TRS_GRAPH_PASSWORD = os.getenv("TRS_GRAPH_PASSWORD", "trsadmin")
TRS_GRAPH_ADDR = os.getenv("TRS_GRAPH_ADDR", "127.0.0.1")
TRS_GRAPH_PORT = int(os.getenv("TRS_GRAPH_PORT", "9669"))
TRS_SPACE = os.getenv("TRS_SPACE", "knowledge_graph")
TRS_TRANSPORT = os.getenv("TRS_TRANSPORT", "gateway")

# Schema 异步生效等待秒数（文档建议约 2 个心跳周期 ≈ 20s）
SCHEMA_WAIT_SECONDS = int(os.getenv("TRS_SCHEMA_WAIT_SECONDS", "20"))
HTTP_TIMEOUT = int(os.getenv("TRS_HTTP_TIMEOUT", "30"))


class TrsError(RuntimeError):
    """TRS 执行错误（连接失败 / nGQL 报错统一抛出）。"""


# ----------------------------------------------------------------------------
# nGQL 值渲染与类型推断
# ----------------------------------------------------------------------------
class Raw:
    """原样写入的 nGQL 片段（如 timestamp()、date("2024-01-01")），渲染时不加引号。"""

    __slots__ = ("expr",)

    def __init__(self, expr: str) -> None:
        self.expr = str(expr)


def _quote(s: str) -> str:
    """字符串字面量转义，使用单引号包裹。"""
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

    - None            -> NULL
    - bool            -> true / false
    - int             -> 整数
    - float           -> 浮点
    - str             -> 单引号字符串（自动转义）
    - list/dict/tuple -> 序列化为 JSON 字符串后按字符串写入（实现「自由嵌套字段」）
    - Raw             -> 原样输出
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
    # 字符串、列表、字典、Raw、其它一律按 string 存储（嵌套结构存 JSON 字符串）
    return "string"


def _ident(name: str) -> str:
    """用反引号包裹标识符，避免与 nGQL 关键字冲突。"""
    return "`" + str(name).replace("`", "") + "`"


# ----------------------------------------------------------------------------
# nGQL 语句构造（点 / 边 / Schema）
# ----------------------------------------------------------------------------
def build_insert_vertex(tag: str, rows: Sequence[Tuple[Any, Dict[str, Any]]],
                        if_not_exists: bool = False) -> str:
    """构造 INSERT VERTEX 语句；rows 内各行必须拥有相同的属性键集合。

    rows: [(vid, props_dict), ...]
    """
    keys = list(rows[0][1].keys())
    cols = ", ".join(_ident(k) for k in keys)
    parts: List[str] = []
    for vid, props in rows:
        vals = ", ".join(render_value(props[k]) for k in keys)
        parts.append(f"{render_value(vid)}:({vals})")
    ine = "IF NOT EXISTS " if if_not_exists else ""
    return f"INSERT VERTEX {ine}{_ident(tag)}({cols}) VALUES " + ", ".join(parts)


def build_insert_edge(edge: str, rows: Sequence[Tuple[Any, Any, int, Dict[str, Any]]],
                      if_not_exists: bool = False) -> str:
    """构造 INSERT EDGE 语句；rows 内各行必须拥有相同的属性键集合。

    rows: [(src, dst, rank, props_dict), ...]
    """
    keys = list(rows[0][3].keys())
    cols = ", ".join(_ident(k) for k in keys)
    parts: List[str] = []
    for src, dst, rank, props in rows:
        vals = ", ".join(render_value(props[k]) for k in keys)
        parts.append(f"{render_value(src)} -> {render_value(dst)}@{int(rank)}:({vals})")
    ine = "IF NOT EXISTS " if if_not_exists else ""
    return f"INSERT EDGE {ine}{_ident(edge)}({cols}) VALUES " + ", ".join(parts)


def build_upsert_vertex(tag: str, vid: Any, props: Dict[str, Any]) -> str:
    """构造 UPSERT VERTEX（按属性逐个 SET，存在则更新、不存在则插入）。"""
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    return f"UPSERT VERTEX ON {_ident(tag)} {render_value(vid)} SET {sets}"


def build_upsert_edge(edge: str, src: Any, dst: Any, rank: int, props: Dict[str, Any]) -> str:
    """构造 UPSERT EDGE（按属性逐个 SET）。"""
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    return (f"UPSERT EDGE ON {_ident(edge)} {render_value(src)} -> {render_value(dst)}"
            f"@{int(rank)} SET {sets}")


def build_update_vertex(tag: str, vid: Any, props: Dict[str, Any]) -> str:
    """构造只修改既有点的 UPDATE VERTEX。"""
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    return f"UPDATE VERTEX ON {_ident(tag)} {render_value(vid)} SET {sets}"


def build_update_edge(edge: str, src: Any, dst: Any, rank: int,
                      props: Dict[str, Any]) -> str:
    """构造只修改既有边的 UPDATE EDGE。"""
    sets = ", ".join(f"{_ident(k)} = {render_value(v)}" for k, v in props.items())
    return (f"UPDATE EDGE ON {_ident(edge)} {render_value(src)} -> {render_value(dst)}"
            f"@{int(rank)} SET {sets}")


def build_fetch_props(tag: str, vids: Sequence[Any], fields: Sequence[str]) -> str:
    """构造返回稳定标量列的点属性查询。"""
    vids_csv = ", ".join(render_value(vid) for vid in vids)
    columns = ["id(vertex) AS vid"]
    columns.extend(f"{_ident(tag)}.{_ident(field)} AS {_ident(field)}" for field in fields)
    return f"FETCH PROP ON {_ident(tag)} {vids_csv} YIELD " + ", ".join(columns)


def build_fetch_edge(edge: str, src: Any, dst: Any, rank: int = 0,
                     fields: Sequence[str] = ()) -> str:
    """构造按边四元组精确读取属性的查询。"""
    columns = [
        "src(edge) AS src",
        "dst(edge) AS dst",
        "rank(edge) AS rank",
    ]
    if fields:
        columns.extend(f"{_ident(edge)}.{_ident(field)} AS {_ident(field)}" for field in fields)
    else:
        columns.append("properties(edge) AS properties")
    return (
        f"FETCH PROP ON {_ident(edge)} {render_value(src)} -> {render_value(dst)}"
        f"@{int(rank)} YIELD " + ", ".join(columns)
    )


def build_create_schema(kind: str, name: str, props: Dict[str, Any]) -> str:
    """构造 CREATE TAG / CREATE EDGE 语句。kind: 'TAG' | 'EDGE'。"""
    if props:
        cols = ", ".join(f"{_ident(k)} {infer_ngql_type(v)}" for k, v in props.items())
        return f"CREATE {kind} IF NOT EXISTS {_ident(name)} ({cols})"
    return f"CREATE {kind} IF NOT EXISTS {_ident(name)} ()"


def build_alter_add(kind: str, name: str, props: Dict[str, Any]) -> str:
    """构造 ALTER TAG / ALTER EDGE ADD 语句（补齐缺失字段）。"""
    cols = ", ".join(f"{_ident(k)} {infer_ngql_type(v)}" for k, v in props.items())
    return f"ALTER {kind} {_ident(name)} ADD ({cols})"


# ----------------------------------------------------------------------------
# 传输层：统一返回 {"headers": [...], "tables": [ {col: val}, ... ]}
# ----------------------------------------------------------------------------
class GatewayTransport:
    """TRSGraph Studio HTTP 网关传输（仅依赖标准库 urllib）。

    鉴权约定（实测）：
      Authorization: Bearer base64(JSON 数组 ["user","password"])
      POST /api-nebula/db/connect  body {"address","port"}  -> 下发 studio_token Cookie
      POST /api-nebula/db/exec     body {"gql"}             -> 返回 {code,data:{headers,tables},message}
    """

    def __init__(self, host: str = TRS_GRAPH_HOST, user: str = TRS_GRAPH_USER,
                 password: str = TRS_GRAPH_PASSWORD, addr: str = TRS_GRAPH_ADDR,
                 port: int = TRS_GRAPH_PORT, timeout: int = HTTP_TIMEOUT) -> None:
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

    def _post(self, path: str, payload: dict) -> Tuple[dict, Dict[str, str]]:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(self.host + path, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", self._auth_header())
        if self._cookie:
            req.add_header("Cookie", self._cookie)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                headers = {k: v for k, v in resp.getheaders()}
                # 抓取 studio_token Cookie 用于后续请求
                for k, v in resp.getheaders():
                    if k.lower() == "set-cookie" and v.startswith("studio_token="):
                        self._cookie = v.split(";", 1)[0]
                return body, headers
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "ignore")
            try:
                body = json.loads(raw)
                msg = body.get("message", raw)
            except json.JSONDecodeError:
                msg = raw or str(e)
            raise TrsError(f"网关请求失败 {path}: {msg}") from None
        except urllib.error.URLError as e:
            raise TrsError(f"网关连接失败 {self.host}{path}: {e}") from None

    def connect(self) -> None:
        """建立会话（获取 studio_token Cookie）。"""
        self._cookie = None
        body, _ = self._post("/api-nebula/db/connect",
                             {"address": self.addr, "port": self.port})
        if body.get("code") != 0:
            raise TrsError(f"连接 TRS 失败: {body.get('message')}")

    @staticmethod
    def _session_expired(message: str) -> bool:
        """判断报错是不是「会话不可用」。

        网关回收会话后报 `ErrSession::Get sessionId[...] failed: Session not existed!`；
        令牌本身失效时报 `ErrSession::that's not even a token`。两种都靠重建会话恢复，
        所以整个 ErrSession 族都算，另外兜住不带该前缀的 session not found 措辞。
        """
        text = str(message).lower()
        if "errsession" in text:
            return True
        return "session" in text and ("not existed" in text or "not found" in text)

    def execute(self, gql: str) -> dict:
        """执行 nGQL，返回 {headers, tables}。

        Cookie 对应服务端的一个会话，闲置超时或网关重启后会被回收。此时本地 Cookie
        仍在，若不重连则后续每一次请求都失败（只能靠重启进程恢复），所以识别到会话
        失效就重建一次会话再重试。
        """
        if self._cookie is None:
            self.connect()
        for attempt in (1, 2):
            try:
                body, _ = self._post("/api-nebula/db/exec", {"gql": gql})
            except TrsError as exc:
                if attempt == 2 or not self._session_expired(exc):
                    raise
                self.connect()
                continue
            if body.get("code") != 0:
                message = body.get("message", "执行失败")
                if attempt == 2 or not self._session_expired(message):
                    raise TrsError(message)
                self.connect()
                continue
            data = body.get("data") or {}
            return {"headers": data.get("headers") or [], "tables": data.get("tables") or []}
        raise TrsError("执行失败")  # pragma: no cover - 循环内必定 return 或 raise

    def close(self) -> None:
        self._cookie = None


class NebulaTransport:
    """原生 nebula3 客户端传输（端口 9669，需安装 nebula3-python）。"""

    def __init__(self, host: str = TRS_GRAPH_ADDR, port: int = TRS_GRAPH_PORT,
                 user: str = TRS_GRAPH_USER, password: str = TRS_GRAPH_PASSWORD) -> None:
        try:
            from nebula3.Config import Config
            from nebula3.gclient.net import ConnectionPool
        except ImportError as e:  # 缺依赖时给出清晰提示
            raise TrsError("未安装 nebula3-python，无法使用 nebula 通道：pip install nebula3-python") from e
        cfg = Config()
        cfg.max_connection_pool_size = 10
        self._pool = ConnectionPool()
        if not self._pool.init([(host, port)], cfg):
            raise TrsError(f"无法连接 TRS Graph: {host}:{port}")
        self._session = self._pool.get_session(user, password)

    @staticmethod
    def _unwrap(vw: Any) -> Any:
        """把 nebula3 ValueWrapper 转换为 Python 原生值（尽力而为）。"""
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
        except Exception:  # noqa: BLE001 复杂类型回退到字符串
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


def make_transport(kind: str = TRS_TRANSPORT):
    """根据类型创建传输通道。"""
    if kind == "nebula":
        return NebulaTransport()
    return GatewayTransport()


# ----------------------------------------------------------------------------
# 高层客户端：自由字段写点 / 写边 / 自动建模 / 查询
# ----------------------------------------------------------------------------
class TrsClient:
    """TRS 灵活读写客户端。"""

    def __init__(self, transport=None, default_space: str = TRS_SPACE,
                 schema_wait: int = SCHEMA_WAIT_SECONDS) -> None:
        self.t = transport or make_transport()
        self.default_space = default_space
        self.schema_wait = schema_wait
        # 记录已确认存在的字段集合，避免重复 DESCRIBE / ALTER
        self._schema_cache: Dict[Tuple[str, str, str], set] = {}
        # 串行化传输层访问，保证多线程 HTTP 服务下的并发安全
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
        """执行原始 nGQL，不自动 USE。"""
        with self._lock:
            return self.t.execute(gql)

    # ---- 自动建模 ----
    def ensure_schema(self, kind: str, name: str, props: Dict[str, Any],
                      space: Optional[str] = None) -> bool:
        """确保 TAG/EDGE 存在且包含 props 中的全部字段；返回是否发生了 Schema 变更。

        kind: 'TAG' | 'EDGE'
        """
        kind = kind.upper()
        space = space if space is not None else self.default_space
        cache_key = (space or "", kind, name)
        existing = self._schema_cache.get(cache_key)

        if existing is None:
            existing = self._describe_fields(kind, name, space)
            if existing is not None:
                self._schema_cache[cache_key] = existing

        changed = False
        if existing is None:
            # 不存在 -> 创建
            self.execute(build_create_schema(kind, name, props), space=space)
            self._schema_cache[cache_key] = set(props.keys())
            changed = True
        else:
            missing = {k: v for k, v in props.items() if k not in existing}
            if missing:
                self.execute(build_alter_add(kind, name, missing), space=space)
                existing |= set(missing.keys())
                self._schema_cache[cache_key] = existing
                changed = True

        if changed and self.schema_wait > 0:
            time.sleep(self.schema_wait)
        return changed

    def _describe_fields(self, kind: str, name: str, space: Optional[str]) -> Optional[set]:
        """DESCRIBE TAG/EDGE，返回字段名集合；不存在返回 None。"""
        try:
            res = self.execute(f"DESCRIBE {kind} {_ident(name)}", space=space)
        except TrsError:
            return None
        fields = set()
        for row in res["tables"]:
            # DESCRIBE 结果列名通常为 Field
            fname = row.get("Field") or row.get("field") or row.get("Name")
            if fname:
                fields.add(fname)
        return fields

    # ---- 读 ----
    def fetch_props(self, tag: str, vids: Sequence[Any], fields: Sequence[str],
                    space: Optional[str] = None) -> List[Dict[str, Any]]:
        """精确读取同一 Tag 的点属性；不存在的 VID 不返回行。"""
        if not vids:
            return []
        return self.execute(build_fetch_props(tag, vids, fields), space=space)["tables"]

    def fetch_vertex(self, tag: str, vid: Any, fields: Sequence[str],
                     space: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """按 (tag, vid) 读取一个点并返回 writer 可直接恢复的形态。"""
        rows = self.fetch_props(tag, [vid], fields, space=space)
        if not rows:
            return None
        row = rows[0]
        return {
            "kind": "vertex",
            "tag": tag,
            "vid": row.get("vid", vid),
            "properties": {field: row.get(field) for field in fields},
        }

    def fetch_edge(self, edge: str, src: Any, dst: Any, rank: int = 0,
                   space: Optional[str] = None,
                   fields: Sequence[str] = ()) -> Optional[Dict[str, Any]]:
        """按 (edge, src, dst, rank) 精确读取一条边。"""
        rows = self.execute(build_fetch_edge(edge, src, dst, rank, fields), space=space)["tables"]
        if not rows:
            return None
        row = rows[0]
        props = {field: row.get(field) for field in fields} if fields else row.get("properties")
        if isinstance(props, str):
            try:
                props = json.loads(props)
            except json.JSONDecodeError:
                pass
        return {
            "kind": "edge",
            "edge": edge,
            "src": row.get("src", src),
            "dst": row.get("dst", dst),
            "rank": int(row.get("rank", rank) or 0),
            "properties": dict(props) if isinstance(props, dict) else props,
        }

    def list_edges(self, edge: str, src: Any = None, dst: Any = None,
                   direction: str = "out", rank: Optional[int] = None,
                   page: int = 1, page_size: int = 100,
                   space: Optional[str] = None) -> List[Dict[str, Any]]:
        """分页读取边，供增量删除快照捕获关联边。"""
        page = max(int(page), 1)
        page_size = max(int(page_size), 1)
        offset = (page - 1) * page_size
        direction = str(direction or "out").lower()
        if src is not None:
            suffix = {"in": " REVERSELY", "bidirect": " BIDIRECT"}.get(direction, "")
            gql = (
                f"GO FROM {render_value(src)} OVER {_ident(edge)}{suffix} "
                "YIELD src(edge) AS srcId, dst(edge) AS dstId, rank(edge) AS rank, "
                f"properties(edge) AS properties | LIMIT {offset}, {page_size}"
            )
        elif dst is not None:
            suffix = " BIDIRECT" if direction == "bidirect" else " REVERSELY"
            gql = (
                f"GO FROM {render_value(dst)} OVER {_ident(edge)}{suffix} "
                "YIELD src(edge) AS srcId, dst(edge) AS dstId, rank(edge) AS rank, "
                f"properties(edge) AS properties | LIMIT {offset}, {page_size}"
            )
        else:
            clause = f" SKIP {offset} LIMIT {page_size}"
            gql = (
                f"MATCH (src)-[e:{_ident(edge)}]->(dst) "
                "RETURN id(src) AS srcId, id(dst) AS dstId, rank(e) AS rank, "
                f"properties(e) AS properties{clause}"
            )
        rows = self.execute(gql, space=space).get("tables") or []
        result = []
        for row in rows:
            props = row.get("properties")
            if isinstance(props, str):
                try:
                    props = json.loads(props)
                except json.JSONDecodeError:
                    props = {}
            result.append({**row, "properties": dict(props or {})})
        return result

    # ---- 写点 ----
    def insert_vertex(self, tag: str, vid: Any, props: Optional[Dict[str, Any]] = None,
                      if_not_exists: bool = False, auto_schema: bool = False,
                      space: Optional[str] = None) -> dict:
        """创建点；``if_not_exists`` 可用于幂等 create。"""
        return self.upsert_vertex(
            tag, vid, props, mode="insert", if_not_exists=if_not_exists,
            auto_schema=auto_schema, space=space,
        )

    def update_vertex(self, tag: str, vid: Any, props: Dict[str, Any],
                      auto_schema: bool = False, space: Optional[str] = None) -> dict:
        """只更新既有点，不把缺失点隐式创建出来。"""
        if not props:
            raise ValueError("UPDATE VERTEX 至少需要一个属性")
        if auto_schema:
            self.ensure_schema("TAG", tag, props, space=space)
        return self.execute(build_update_vertex(tag, vid, props), space=space)

    def delete_vertex(self, vid: Any, space: Optional[str] = None) -> dict:
        """删除点以及它的所有关联边。"""
        return self.execute(f"DELETE VERTEX {render_value(vid)} WITH EDGE", space=space)

    def upsert_vertex(self, tag: str, vid: Any, props: Optional[Dict[str, Any]] = None,
                      mode: str = "insert", if_not_exists: bool = False,
                      auto_schema: bool = False, space: Optional[str] = None) -> dict:
        """写入单个点。mode: insert（默认）/ upsert。auto_schema=True 时自动补齐字段。"""
        props = props or {}
        if auto_schema and props:
            self.ensure_schema("TAG", tag, props, space=space)
        if mode == "upsert":
            gql = build_upsert_vertex(tag, vid, props)
        else:
            gql = build_insert_vertex(tag, [(vid, props)], if_not_exists=if_not_exists)
        return self.execute(gql, space=space)

    def upsert_vertices(self, items: Sequence[Dict[str, Any]], if_not_exists: bool = False,
                        auto_schema: bool = False, space: Optional[str] = None) -> int:
        """批量 UPSERT 点；每项都使用 UPSERT 语义而非 INSERT 覆盖语义。"""
        statements: List[str] = []
        for it in items:
            tag = it["tag"]
            props = it.get("props") or {}
            if auto_schema and props:
                self.ensure_schema("TAG", tag, props, space=space)
            if not props:
                raise ValueError("UPSERT VERTEX 至少需要一个属性")
            statements.append(build_upsert_vertex(tag, it["vid"], props))
        for start in range(0, len(statements), 100):
            self.execute(";\n".join(statements[start:start + 100]), space=space)
        return len(items)

    # ---- 写边 ----
    def insert_edge(self, edge: str, src: Any, dst: Any,
                    props: Optional[Dict[str, Any]] = None, rank: int = 0,
                    if_not_exists: bool = False, auto_schema: bool = False,
                    space: Optional[str] = None) -> dict:
        """创建边；``if_not_exists`` 可用于幂等 create。"""
        return self.upsert_edge(
            edge, src, dst, props, rank=rank, mode="insert",
            if_not_exists=if_not_exists, auto_schema=auto_schema, space=space,
        )

    def update_edge(self, edge: str, src: Any, dst: Any, props: Dict[str, Any],
                    rank: int = 0, auto_schema: bool = False,
                    space: Optional[str] = None) -> dict:
        """只更新既有边，不把缺失边隐式创建出来。"""
        if not props:
            raise ValueError("UPDATE EDGE 至少需要一个属性")
        if auto_schema:
            self.ensure_schema("EDGE", edge, props, space=space)
        return self.execute(build_update_edge(edge, src, dst, rank, props), space=space)

    def delete_edge(self, edge: str, src: Any, dst: Any, rank: int = 0,
                    space: Optional[str] = None) -> dict:
        """按边四元组删除一条边。"""
        gql = f"DELETE EDGE {_ident(edge)} {render_value(src)} -> {render_value(dst)}@{int(rank)}"
        return self.execute(gql, space=space)

    def upsert_edge(self, edge: str, src: Any, dst: Any, props: Optional[Dict[str, Any]] = None,
                    rank: int = 0, mode: str = "insert", if_not_exists: bool = False,
                    auto_schema: bool = False, space: Optional[str] = None) -> dict:
        """写入单条边。mode: insert（默认）/ upsert。"""
        props = props or {}
        if auto_schema and props:
            self.ensure_schema("EDGE", edge, props, space=space)
        if mode == "upsert":
            gql = build_upsert_edge(edge, src, dst, rank, props)
        else:
            gql = build_insert_edge(edge, [(src, dst, rank, props)], if_not_exists=if_not_exists)
        return self.execute(gql, space=space)

    def upsert_edges(self, items: Sequence[Dict[str, Any]], if_not_exists: bool = False,
                     auto_schema: bool = False, space: Optional[str] = None) -> int:
        """批量 UPSERT 边；每项都使用 UPSERT 语义而非 INSERT 覆盖语义。"""
        statements: List[str] = []
        for it in items:
            edge = it["edge"]
            props = it.get("props") or {}
            if auto_schema and props:
                self.ensure_schema("EDGE", edge, props, space=space)
            if not props:
                raise ValueError("UPSERT EDGE 至少需要一个属性")
            statements.append(
                build_upsert_edge(edge, it["src"], it["dst"], int(it.get("rank", 0)), props)
            )
        for start in range(0, len(statements), 100):
            self.execute(";\n".join(statements[start:start + 100]), space=space)
        return len(items)

    def close(self) -> None:
        self.t.close()


# ----------------------------------------------------------------------------
# 内置 HTTP 服务：用「自由 JSON」写点 / 写边 / 查询（curl 接口）
# ----------------------------------------------------------------------------
def _ok(data: Any = None) -> dict:
    """统一成功响应（code/msg/data，与项目接口规范对齐）。"""
    return {"code": 0, "msg": "ok", "data": data}


def _err(msg: str) -> dict:
    """统一失败响应。"""
    return {"code": 1, "msg": msg, "data": None}


class _Handler(BaseHTTPRequestHandler):
    """自由 JSON 写点 / 写边 / 查询的 HTTP 处理器。"""

    server_version = "trs-flex/1.0"

    # 路由表在 do_POST/do_GET 中分发
    def _send(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw) if raw.strip() else {}

    def _check_token(self) -> bool:
        """可选的访问令牌校验（启动时 --token 指定）。"""
        token = getattr(self.server, "access_token", None)
        if not token:
            return True
        return self.headers.get("X-Auth-Token") == token

    def log_message(self, fmt: str, *args: Any) -> None:  # 静默默认访问日志
        sys.stderr.write("[trs-flex] %s - %s\n" % (self.address_string(), fmt % args))

    # ---- GET ----
    def do_GET(self) -> None:  # noqa: N802 标准库命名
        if self.path.rstrip("/") in ("/healthz", "/health"):
            self._send(_ok({"status": "up", "space": self.server.client.default_space}))
            return
        self._send(_err("not found"), status=404)

    # ---- POST ----
    def do_POST(self) -> None:  # noqa: N802 标准库命名
        if not self._check_token():
            self._send(_err("unauthorized"), status=401)
            return
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        try:
            payload = self._read_json()
        except json.JSONDecodeError as e:
            self._send(_err(f"invalid json: {e}"), status=400)
            return

        client: TrsClient = self.server.client
        try:
            if path == "/vertex":
                self._send(_ok(self._do_vertex(client, payload)))
            elif path == "/vertices":
                self._send(_ok(self._do_vertices(client, payload)))
            elif path == "/edge":
                self._send(_ok(self._do_edge(client, payload)))
            elif path == "/edges":
                self._send(_ok(self._do_edges(client, payload)))
            elif path == "/batch":
                self._send(_ok(self._do_batch(client, payload)))
            elif path == "/ensure_schema":
                self._send(_ok(self._do_ensure_schema(client, payload)))
            elif path in ("/query", "/exec"):
                self._send(_ok(self._do_query(client, payload)))
            else:
                self._send(_err("not found"), status=404)
        except TrsError as e:
            self._send(_err(str(e)), status=400)
        except (KeyError, ValueError) as e:
            self._send(_err(f"bad request: {e}"), status=400)
        except Exception as e:  # noqa: BLE001 兜底，避免服务崩溃
            self._send(_err(f"internal error: {e}"), status=500)

    # ---- 业务处理 ----
    @staticmethod
    def _do_vertex(client: TrsClient, p: dict) -> dict:
        client.upsert_vertex(
            tag=p["tag"], vid=p["vid"], props=p.get("props") or {},
            mode=p.get("mode", "insert"), if_not_exists=bool(p.get("if_not_exists")),
            auto_schema=bool(p.get("ensure_schema")), space=p.get("space"),
        )
        return {"written": 1}

    @staticmethod
    def _do_vertices(client: TrsClient, p: dict) -> dict:
        n = client.upsert_vertices(
            p["items"], if_not_exists=bool(p.get("if_not_exists")),
            auto_schema=bool(p.get("ensure_schema")), space=p.get("space"),
        )
        return {"written": n}

    @staticmethod
    def _do_edge(client: TrsClient, p: dict) -> dict:
        client.upsert_edge(
            edge=p["edge"], src=p["src"], dst=p["dst"], props=p.get("props") or {},
            rank=int(p.get("rank", 0)), mode=p.get("mode", "insert"),
            if_not_exists=bool(p.get("if_not_exists")),
            auto_schema=bool(p.get("ensure_schema")), space=p.get("space"),
        )
        return {"written": 1}

    @staticmethod
    def _do_edges(client: TrsClient, p: dict) -> dict:
        n = client.upsert_edges(
            p["items"], if_not_exists=bool(p.get("if_not_exists")),
            auto_schema=bool(p.get("ensure_schema")), space=p.get("space"),
        )
        return {"written": n}

    @staticmethod
    def _do_batch(client: TrsClient, p: dict) -> dict:
        auto = bool(p.get("ensure_schema"))
        ine = bool(p.get("if_not_exists"))
        space = p.get("space")
        nv = client.upsert_vertices(p.get("vertices") or [], if_not_exists=ine,
                                    auto_schema=auto, space=space) if p.get("vertices") else 0
        ne = client.upsert_edges(p.get("edges") or [], if_not_exists=ine,
                                 auto_schema=auto, space=space) if p.get("edges") else 0
        return {"vertices": nv, "edges": ne}

    @staticmethod
    def _do_ensure_schema(client: TrsClient, p: dict) -> dict:
        """body: {"space","tags":{tag:{field:sample}}, "edges":{edge:{field:sample}}}"""
        changed = []
        for name, fields in (p.get("tags") or {}).items():
            if client.ensure_schema("TAG", name, fields or {}, space=p.get("space")):
                changed.append(f"TAG:{name}")
        for name, fields in (p.get("edges") or {}).items():
            if client.ensure_schema("EDGE", name, fields or {}, space=p.get("space")):
                changed.append(f"EDGE:{name}")
        return {"changed": changed}

    @staticmethod
    def _do_query(client: TrsClient, p: dict) -> dict:
        gql = p.get("gql")
        if not gql:
            raise ValueError("缺少 gql")
        if p.get("raw"):
            return client.execute_raw(gql)
        return client.execute(gql, space=p.get("space"))


def serve(host: str, port: int, transport_kind: str, space: str,
          token: Optional[str] = None) -> None:
    """启动 curl 接口服务。"""
    client = TrsClient(transport=make_transport(transport_kind), default_space=space)
    httpd = ThreadingHTTPServer((host, port), _Handler)
    httpd.client = client          # 注入共享客户端
    httpd.access_token = token      # 注入可选令牌
    print(f"[trs-flex] 监听 http://{host}:{port}  transport={transport_kind} space={space}")
    print("[trs-flex] 路由: POST /vertex /vertices /edge /edges /batch /ensure_schema /query ; GET /healthz")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[trs-flex] 已停止")
    finally:
        httpd.server_close()
        client.close()


# ----------------------------------------------------------------------------
# 命令行入口
# ----------------------------------------------------------------------------
def _load_json_arg(args: argparse.Namespace) -> dict:
    """从 --json / --file / stdin 读取 JSON。"""
    if getattr(args, "json", None):
        return json.loads(args.json)
    if getattr(args, "file", None):
        with open(args.file, "r", encoding="utf-8") as f:
            return json.load(f)
    data = sys.stdin.read()
    if not data.strip():
        raise SystemExit("未提供 JSON（请用 --json / --file 或管道 stdin）")
    return json.loads(data)


def _print_result(res: dict) -> None:
    """格式化打印查询结果。"""
    tables = res.get("tables") or []
    if not tables:
        print("(无数据)" if not res.get("headers") else f"headers={res['headers']} 0 行")
        return
    print(json.dumps(tables, ensure_ascii=False, indent=2))
    print(f"-- {len(tables)} 行")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="TRS Graph 灵活读写工具（自由字段 + curl 接口）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--transport", default=TRS_TRANSPORT, choices=("gateway", "nebula"),
                        help="传输通道：gateway（HTTP 网关，默认）/ nebula（原生 9669）")
    parser.add_argument("--space", default=TRS_SPACE, help="默认图空间")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_exec = sub.add_parser("exec", help="执行原始 nGQL（不自动 USE）")
    p_exec.add_argument("--gql", required=True)

    p_query = sub.add_parser("query", help="在指定 space 执行查询并格式化输出")
    p_query.add_argument("--gql", required=True)

    p_vtx = sub.add_parser("vertex", help="写入单个点（自由 JSON）")
    p_vtx.add_argument("--json")
    p_vtx.add_argument("--file")
    p_vtx.add_argument("--auto-schema", action="store_true", help="自动补齐 TAG 字段")
    p_vtx.add_argument("--upsert", action="store_true", help="使用 UPSERT 而非 INSERT")
    p_vtx.add_argument("--if-not-exists", action="store_true")

    p_edge = sub.add_parser("edge", help="写入单条边（自由 JSON）")
    p_edge.add_argument("--json")
    p_edge.add_argument("--file")
    p_edge.add_argument("--auto-schema", action="store_true", help="自动补齐 EDGE 字段")
    p_edge.add_argument("--upsert", action="store_true")
    p_edge.add_argument("--if-not-exists", action="store_true")

    p_batch = sub.add_parser("batch", help="批量写入 {vertices:[...], edges:[...]}")
    p_batch.add_argument("--json")
    p_batch.add_argument("--file")
    p_batch.add_argument("--auto-schema", action="store_true")
    p_batch.add_argument("--if-not-exists", action="store_true")

    p_es = sub.add_parser("ensure-schema", help="确保 TAG/EDGE 字段存在 {tags:{},edges:{}}")
    p_es.add_argument("--json")
    p_es.add_argument("--file")

    p_serve = sub.add_parser("serve", help="启动 curl 接口服务")
    p_serve.add_argument("--host", default="127.0.0.1")
    p_serve.add_argument("--port", type=int, default=8080)
    p_serve.add_argument("--token", default=None, help="可选访问令牌（请求头 X-Auth-Token）")

    args = parser.parse_args()

    if args.cmd == "serve":
        serve(args.host, args.port, args.transport, args.space, args.token)
        return 0

    client = TrsClient(transport=make_transport(args.transport), default_space=args.space)
    try:
        if args.cmd == "exec":
            _print_result(client.execute_raw(args.gql))
        elif args.cmd == "query":
            _print_result(client.execute(args.gql, space=args.space))
        elif args.cmd == "vertex":
            p = _load_json_arg(args)
            client.upsert_vertex(
                tag=p["tag"], vid=p["vid"], props=p.get("props") or {},
                mode="upsert" if args.upsert else "insert",
                if_not_exists=args.if_not_exists, auto_schema=args.auto_schema,
                space=p.get("space", args.space),
            )
            print(f"OK 写入点 {p['vid']} (tag={p['tag']})")
        elif args.cmd == "edge":
            p = _load_json_arg(args)
            client.upsert_edge(
                edge=p["edge"], src=p["src"], dst=p["dst"], props=p.get("props") or {},
                rank=int(p.get("rank", 0)), mode="upsert" if args.upsert else "insert",
                if_not_exists=args.if_not_exists, auto_schema=args.auto_schema,
                space=p.get("space", args.space),
            )
            print(f"OK 写入边 {p['src']} -> {p['dst']} (edge={p['edge']})")
        elif args.cmd == "batch":
            p = _load_json_arg(args)
            nv = client.upsert_vertices(p.get("vertices") or [], if_not_exists=args.if_not_exists,
                                        auto_schema=args.auto_schema, space=args.space)
            ne = client.upsert_edges(p.get("edges") or [], if_not_exists=args.if_not_exists,
                                     auto_schema=args.auto_schema, space=args.space)
            print(f"OK 写入 {nv} 个点, {ne} 条边")
        elif args.cmd == "ensure-schema":
            p = _load_json_arg(args)
            changed = []
            for name, fields in (p.get("tags") or {}).items():
                if client.ensure_schema("TAG", name, fields or {}, space=args.space):
                    changed.append(f"TAG:{name}")
            for name, fields in (p.get("edges") or {}).items():
                if client.ensure_schema("EDGE", name, fields or {}, space=args.space):
                    changed.append(f"EDGE:{name}")
            print(f"OK Schema 变更: {changed or '无（已存在）'}")
        return 0
    except TrsError as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
