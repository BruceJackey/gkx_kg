# TRS Graph 灵活读写 + curl 接口

> 配套脚本：`trs_flex.py`。在 `trs_test.py`（字段写死）基础上做成「自由字段」版本：
> 写点 / 写边只需传任意 JSON 属性，自动生成 nGQL、自动转义、可选自动建模；
> 并内置一个零依赖（仅标准库）的 HTTP 服务，用 curl + 自由 JSON 写点 / 写边 / 查询。

---

## 1. 两层能力


| 层                | 入口                        | 说明                                  |
| ---------------- | ------------------------- | ----------------------------------- |
| Python 工具 / CLI  | `trs_flex.py`             | 命令行写点 / 写边 / 批量 / 自动建模 / 查询         |
| curl 接口（自由 JSON） | `trs_flex.py serve`       | 本地 HTTP 服务，curl 用 JSON 写点 / 写边 / 查询 |
| 原生网关 curl        | TRSGraph Studio 网关（:7001） | 直接 curl 执行 nGQL（无需起本地服务）            |


传输通道（`--transport`）：

- `gateway`（默认）：走 Studio HTTP 网关（:7001），**仅依赖标准库**，适合无法直连 9669 的环境。
- `nebula`：走原生 nebula3 客户端（:9669），需 `pip install nebula3-python`。

---

## 2. 连接配置（环境变量，均有默认值）

```bash
export TRS_GRAPH_HOST=http://114.117.127.200:7001   # Studio HTTP 网关
export TRS_GRAPH_USER=root
export TRS_GRAPH_PASSWORD=trsadmin
export TRS_GRAPH_ADDR=127.0.0.1     # 网关内部连 graphd 的地址（网关与 graphd 同机用 127.0.0.1）
export TRS_GRAPH_PORT=9669
export TRS_SPACE=knowledge_graph
```

> 不设环境变量时，脚本内置默认值与上面一致。

---

## 3. CLI 用法（自由字段）

在 `gkx-mis-api` 目录下，用项目 venv 执行：

```bash
PY=.venv/bin/python

# 执行原始 nGQL
$PY docs/trs_flex.py exec  --gql "SHOW SPACES;"

# 在指定 space 查询并格式化输出
$PY docs/trs_flex.py query --space knowledge_graph --gql 'MATCH (v:entity) RETURN v LIMIT 5'

# 写入「任意字段」的点（--auto-schema 会自动建 TAG / 补字段）
$PY docs/trs_flex.py --space knowledge_graph vertex --auto-schema \
  --json '{"tag":"entity","vid":"e_ai","props":{"name":"人工智能","type":"技术领域","heat":0.97,"active":true,"tags":["AI","ML"]}}'

# 写入「任意字段」的边
$PY docs/trs_flex.py --space knowledge_graph edge --auto-schema \
  --json '{"edge":"relation","src":"e_ai","dst":"e_dl","rank":0,"props":{"name":"包含","weight":0.95}}'

# 批量写入（支持 --file / stdin）
$PY docs/trs_flex.py --space knowledge_graph batch --auto-schema --file data.json
# data.json: {"vertices":[{"tag":"entity","vid":"...","props":{...}}], "edges":[{"edge":"relation","src":"...","dst":"...","rank":0,"props":{...}}]}

# 仅确保 Schema（不写数据）
$PY docs/trs_flex.py --space knowledge_graph ensure-schema \
  --json '{"tags":{"entity":{"name":"s","type":"s","heat":0.0}}, "edges":{"relation":{"name":"s","weight":0.0}}}'
```

常用参数：

- `--auto-schema`：写入前自动 `CREATE`/`ALTER` 补齐字段（应对强 Schema 约束）。
- `--upsert`：用 `UPSERT` 代替 `INSERT`（存在则更新）。
- `--if-not-exists`：`INSERT ... IF NOT EXISTS`，不覆盖已有数据。

---

## 4. curl 接口（自由 JSON 写点 / 写边）

### 4.1 启动服务

```bash
.venv/bin/python docs/trs_flex.py --space knowledge_graph serve --host 127.0.0.1 --port 8080
# 可选：--token <字符串> 开启访问令牌（请求头 X-Auth-Token）
# 可选：--transport nebula 走原生 9669
```

路由一览：


| 方法   | 路径                  | 作用                                     |
| ---- | ------------------- | -------------------------------------- |
| GET  | `/healthz`          | 健康检查                                   |
| POST | `/vertex`           | 写入单个点                                  |
| POST | `/vertices`         | 批量写点 `{"items":[...]}`                 |
| POST | `/edge`             | 写入单条边                                  |
| POST | `/edges`            | 批量写边 `{"items":[...]}`                 |
| POST | `/batch`            | 同时写 `{"vertices":[...],"edges":[...]}` |
| POST | `/ensure_schema`    | 建模 `{"tags":{...},"edges":{...}}`      |
| POST | `/query`(或 `/exec`) | 执行 nGQL `{"gql":"...","space":"..."}`  |


通用响应：`{"code":0,"msg":"ok","data":...}`，出错 `code!=0`。
通用可选字段：`space`（覆盖默认图空间）、`ensure_schema`（true 时自动补字段）、`if_not_exists`、`mode`（insert/upsert）。

### 4.2 curl 示例（自由字段）

```bash
# 写点：props 里随便写字段，嵌套对象 / 数组会以 JSON 字符串落库
curl -s -X POST http://127.0.0.1:8080/vertex -H "Content-Type: application/json" -d '{
  "tag": "entity",
  "vid": "e_ai",
  "ensure_schema": true,
  "props": {"name":"人工智能","type":"技术领域","heat":0.97,"active":true,"count":3,"meta":{"aliases":["AI","ML"],"lang":"zh"}}
}'

# 写边
curl -s -X POST http://127.0.0.1:8080/edge -H "Content-Type: application/json" -d '{
  "edge": "relation",
  "src": "e_ai", "dst": "e_dl", "rank": 0,
  "ensure_schema": true,
  "props": {"name":"包含","weight":0.95}
}'

# 批量
curl -s -X POST http://127.0.0.1:8080/batch -H "Content-Type: application/json" -d '{
  "space":"TEST",
  "ensure_schema": true,
  "vertices": [
    {"tag": "entity", "vid": "person_lisi", "props": {"name": "李四", "category": "人物", "shape": "circle", "color": "blue", "x": 140, "y": 130, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_zhangsan", "props": {"name": "张三", "category": "人物", "shape": "circle", "color": "blue", "x": 265, "y": 285, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_wangwu", "props": {"name": "王五", "category": "人物", "shape": "circle", "color": "blue", "x": 505, "y": 225, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_zhaoliu", "props": {"name": "赵六", "category": "人物", "shape": "circle", "color": "blue", "x": 935, "y": 210, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "org_tsinghua", "props": {"name": "清华大学", "category": "机构", "shape": "square", "color": "purple", "x": 90, "y": 280, "description": "示例高校节点"}},
    {"tag": "entity", "vid": "org_peking", "props": {"name": "北京大学", "category": "机构", "shape": "square", "color": "purple", "x": 90, "y": 455, "description": "示例高校节点"}},
    {"tag": "entity", "vid": "paper_nips", "props": {"name": "NIPS论文", "category": "论文", "shape": "square", "color": "pink", "x": 435, "y": 50, "description": "示例论文节点"}},
    {"tag": "entity", "vid": "paper_attention", "props": {"name": "Attention论文", "category": "论文", "shape": "circle", "color": "green", "x": 785, "y": 280, "description": "示例论文节点"}},
    {"tag": "entity", "vid": "tech_deep_learning", "props": {"name": "深度学习", "category": "技术", "shape": "diamond", "color": "orange", "x": 555, "y": 420, "description": "示例技术节点"}},
    {"tag": "entity", "vid": "tech_machine_learning", "props": {"name": "机器学习", "category": "技术", "shape": "diamond", "color": "pink", "x": 780, "y": 70, "description": "示例技术节点"}},
  ],
  "edges": [
    {"edge": "relation", "src": "person_lisi", "dst": "paper_nips", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "李四研发NIPS论文"}},
    {"edge": "relation", "src": "paper_nips", "dst": "tech_machine_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "NIPS论文关联机器学习"}},
    {"edge": "relation", "src": "person_zhaoliu", "dst": "tech_machine_learning", "rank": 0, "props": {"name": "投资", "line_style": "dotted", "color": "pink", "weight": 1.0, "description": "赵六投资机器学习"}},
    {"edge": "relation", "src": "person_zhaoliu", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "赵六引用Attention论文"}},
    {"edge": "relation", "src": "person_wangwu", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "王五引用Attention论文"}},
    {"edge": "relation", "src": "tech_deep_learning", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "深度学习引用Attention论文"}},
    {"edge": "relation", "src": "person_wangwu", "dst": "tech_deep_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "王五研发深度学习"}},
    {"edge": "relation", "src": "person_zhangsan", "dst": "tech_deep_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "张三研发深度学习"}},
    {"edge": "relation", "src": "person_lisi", "dst": "person_zhangsan", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "李四与张三合作"}},
    {"edge": "relation", "src": "person_lisi", "dst": "person_wangwu", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "李四与王五合作"}},
    {"edge": "relation", "src": "person_lisi", "dst": "org_tsinghua", "rank": 0, "props": {"name": "隶属", "line_style": "solid", "color": "gray", "weight": 1.0, "description": "李四隶属清华大学"}},
    {"edge": "relation", "src": "person_zhangsan", "dst": "org_tsinghua", "rank": 0, "props": {"name": "隶属", "line_style": "solid", "color": "gray", "weight": 1.0, "description": "张三隶属清华大学"}},
    {"edge": "relation", "src": "org_tsinghua", "dst": "org_peking", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "清华大学与北京大学合作"}},
  ]
}'

# 查询
curl -s -X POST http://127.0.0.1:8080/query -H "Content-Type: application/json" -d '{
  "space": "knowledge_graph",
  "gql": "GO FROM \"e_ai\" OVER relation YIELD dst(edge) AS dst, properties(edge).name AS rel, properties(edge).weight AS w"
}'


```

---

## 5. 原生网关 curl（直接执行 nGQL，无需起本地服务）

TRSGraph Studio 在 `:7001` 暴露 HTTP 网关，鉴权与调用约定（已实测）：

- 鉴权头：`Authorization: Bearer <base64(JSON 数组 ["user","password"])>`
- 连接：`POST /api-nebula/db/connect`，body `{"address":"127.0.0.1","port":9669}`，成功后下发 `studio_token` Cookie
- 执行：`POST /api-nebula/db/exec`，body `{"gql":"..."}`，返回 `{code,data:{headers,tables},message}`

```bash
HOST=http://114.117.127.200:7001
TOK=$(printf '["root","trsadmin"]' | base64)      # 鉴权 token

# 1) 连接并保存 Cookie（studio_token）
curl -s -c trs.cookie -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -X POST "$HOST/api-nebula/db/connect" -d '{"address":"127.0.0.1","port":9669}'

# 2) 携带 Cookie 执行 nGQL（自由字段的点：直接写 nGQL）
curl -s -b trs.cookie -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -X POST "$HOST/api-nebula/db/exec" \
  -d '{"gql":"USE knowledge_graph; INSERT VERTEX `entity`(`name`,`type`) VALUES \"e_ai\":(\"人工智能\",\"技术领域\");"}'

# 3) 查询
curl -s -b trs.cookie -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  -X POST "$HOST/api-nebula/db/exec" \
  -d '{"gql":"USE knowledge_graph; MATCH (v:entity) RETURN v LIMIT 5;"}'
```

> 网关执行 `{"gql":"..."}` 走的是 nGQL 字符串；若想用「结构化自由 JSON」写点 / 写边，请用第 4 节的本地服务（它把 JSON 自动转成 nGQL）。

---

## 6. 值类型映射（Python / JSON → nGQL）


| 输入                   | 落库类型       | 说明                            |
| -------------------- | ---------- | ----------------------------- |
| `null`               | NULL       |                               |
| `bool`               | bool       | `true` / `false`              |
| 整数                   | int(int64) |                               |
| 浮点                   | double     |                               |
| 字符串                  | string     | 自动单引号转义                       |
| 数组 / 对象              | string     | 序列化为 JSON 字符串存储（实现自由嵌套字段）     |
| `Raw("timestamp()")` | 原样         | Python 侧用 `Raw` 包裹原始 nGQL 表达式 |


读取嵌套字段：用 nGQL `json_extract(<json字符串字段>)` 解析回 map。

---

## 7. 强 Schema 注意事项

1. TRSGraph 为**强 Schema**：写入前字段必须已存在于 TAG/EDGE。`--auto-schema` / `ensure_schema=true` 会自动建模。
2. Schema 变更（CREATE/ALTER）**异步生效**，需等约 2 个心跳周期（默认 20s）。脚本在变更后已自动 `sleep`（`TRS_SCHEMA_WAIT_SECONDS` 可调）。
3. 高频写入建议：**先一次性 `ensure-schema` 固化字段**，之后写入不再带 `--auto-schema`，避免每次写都触发 ALTER + 等待。
4. 自动建模的字符串字段默认无长度限制；如需 `LOOKUP`/`MATCH` 按属性检索，请按 `TRS.md` 第 6 节单独建索引并 `REBUILD`。
5. VID 由应用端生成，需在目标 space 的 `vid_type` 长度内（如 `FIXED_STRING(64)`）。

