# TRS Graph 使用文档

> 基于 TRSGraph Database v10.0 官方手册整理，面向知识图谱引擎开发团队的核心参考文档。

---

## 1. 概述

TRSGraph 是一款**分布式、易扩展的原生图数据库**，基于 C++ 编写，支持数千亿个点和数万亿条边的超大规模数据集，提供毫秒级查询。

### 1.1 核心优势


| 特性            | 说明                         |
| ------------- | -------------------------- |
| 高性能           | C++ 实现，毫秒级查询，数据规模越大优势越明显   |
| 易扩展           | shared-nothing 架构，不停服扩缩容   |
| 强一致           | Raft 协议保证多副本一致性            |
| 高可靠           | 角色访问控制 + LDAP 外部认证         |
| 兼容 openCypher | nGQL 查询语言部分兼容 openCypher 9 |
| 面向 SSD        | 读写平衡，适合闪存设备                |


### 1.2 适用场景

- **知识图谱**：实体关系存储、语义解析、智能问答
- **欺诈检测**：交易网络关系分析
- **实时推荐**：用户行为图谱
- **社交网络**：人际关系分析

### 1.3 项目连接配置

```bash
# .env 配置（gkx-mis-api）
TRS_GRAPH_HOST=http://114.117.127.200:7001/
TRS_GRAPH_USER=root
TRS_GRAPH_PASSWORD=trsadmin
```

---

## 2. 基本概念

### 2.1 数据模型

TRSGraph 使用**有向属性图**模型，包含 6 种基本数据模型：


| 概念             | 说明                                                |
| -------------- | ------------------------------------------------- |
| 图空间（Space）     | 物理隔离的数据容器，可指定分片数、副本数、权限                           |
| 点（Vertex）      | 实体对象，由 VID 唯一标识，可有 0~N 个 Tag                      |
| 边（Edge）        | 有方向的关系，由四元组 `<起点VID, EdgeType, Rank, 终点VID>` 唯一标识 |
| 标签（Tag）        | 点的类型，预定义属性集合（类似关系型数据库的"点表结构"）                     |
| 边类型（Edge type） | 边的类型，预定义属性集合（类似"边表结构"）                            |
| 属性（Property）   | 键值对形式的附加信息                                        |


### 2.2 点 VID

- VID 类型：`FIXED_STRING(<N>)` 或 `INT64`，创建图空间时指定，不可修改
- 同一图空间内 VID 唯一，相同 VID 视为同一个点
- VID 需由应用端自行生成（无自增 ID）

**VID 生成建议：**

1. 优先使用有唯一性的主键直接作为 VID
2. 使用唯一属性组合生成
3. 使用 snowflake 等算法生成
4. 避免 `FIXED_STRING(<N>)` 的 N 设置过大

**性能提示：** 直接通过 VID 查询性能最高（如 `GO FROM "player100"`），通过属性索引查 VID 再操作会多一次随机读。

### 2.3 路径类型


| 类型    | 说明          | 对应语句                                 |
| ----- | ----------- | ------------------------------------ |
| walk  | 点和边均可重复，可无限 | `GO`                                 |
| trail | 边不重复，点可重复   | `MATCH`, `FIND PATH`, `GET SUBGRAPH` |
| path  | 点和边都不重复     | -                                    |


### 2.4 服务架构

TRSGraph 由三种服务构成（存储与计算分离）：

```
┌─────────────┐
│  Graph 服务  │  ← 处理查询请求（trsgraph-graphd）
├─────────────┤
│  Meta 服务   │  ← 管理元数据（trsgraph-metad）
├─────────────┤
│ Storage 服务 │  ← 存储数据（trsgraph-storaged）
└─────────────┘
```

- **Meta 服务**：管理用户账号、分片位置、Schema、TTL、作业
- **Graph 服务**：Parser → Validator → Planner → Executor
- **Storage 服务**：基于 RocksDB + Raft 的 KVStore，支持边分割

---

## 3. 快速入门

### 3.1 安装与启动

```bash
# 解压安装
tar zxf trsgraph.tar.gz

# 启动所有服务
sudo /usr/local/trsgraph/scripts/trsgraph.service start all

# 查看服务状态
sudo /usr/local/trsgraph/scripts/trsgraph.service status all

# 停止服务（勿用 kill -9）
sudo /usr/local/trsgraph/scripts/trsgraph.service stop all
```

服务管理命令格式：

```bash
sudo /usr/local/trsgraph/scripts/trsgraph.service [-v] [-c <config_path>] \
  <start|stop|restart|kill|status> <metad|graphd|storaged|all>
```

### 3.2 连接 TRSGraph

```bash
# 使用 Console 连接
./trsgraph-console -addr <ip> -port <port> -u <username> -p <password>

# 常用参数
#   -addr    Graph 服务 IP（默认 127.0.0.1）
#   -port    Graph 服务端口（默认 9669）
#   -u       用户名（默认 root）
#   -p       密码
#   -t       超时时间（毫秒，默认 120）
#   -e       执行单条 nGQL 语句
#   -f       执行 nGQL 文件
```

### 3.3 注册 Storage 服务

首次连接后必须添加 Storage 主机：

```sql
-- 添加主机
ADD HOSTS 192.168.10.100:9779, 192.168.10.101:9779, 192.168.10.102:9779;

-- 检查主机状态
SHOW HOSTS;
```

---

## 4. 图空间与 Schema 管理

### 4.1 图空间操作

```sql
-- 创建图空间
CREATE SPACE IF NOT EXISTS my_space (
  partition_num = 15,
  replica_factor = 1,
  vid_type = FIXED_STRING(30)
) COMMENT = '知识图谱空间';

-- 查看所有图空间
SHOW SPACES;

-- 选择/切换图空间
USE my_space;

-- 查看图空间详情
DESCRIBE SPACE my_space;

-- 克隆图空间 Schema
CREATE SPACE new_space AS old_space;

-- 清空数据（保留 Schema）
CLEAR SPACE IF EXISTS my_space;

-- 删除图空间
DROP SPACE IF EXISTS my_space;
```

> **注意：** CREATE SPACE 等 Schema 操作是异步的，需等待 2 个心跳周期（默认 20 秒）后生效。

### 4.2 Tag 操作

```sql
-- 创建 Tag
CREATE TAG IF NOT EXISTS entity (
  name string NOT NULL COMMENT '实体名称',
  type string COMMENT '实体类型',
  source string COMMENT '数据来源',
  created_at timestamp DEFAULT timestamp() COMMENT '创建时间'
) COMMENT = '知识图谱实体';

-- 创建带 TTL 的 Tag
CREATE TAG temp_entity (
  name string,
  expire_time int
) TTL_DURATION = 86400, TTL_COL = "expire_time";

-- 修改 Tag（增删属性）
ALTER TAG entity ADD (description string);
ALTER TAG entity DROP (source);
ALTER TAG entity CHANGE (name string NOT NULL DEFAULT "");

-- 查看 Tag
SHOW TAGS;
DESCRIBE TAG entity;

-- 删除指定点上的 Tag
DELETE TAG entity FROM "vertex_id";

-- 删除 Tag 定义
DROP TAG IF EXISTS entity;
```

### 4.3 Edge Type 操作

```sql
-- 创建 Edge type
CREATE EDGE IF NOT EXISTS relation (
  name string NOT NULL COMMENT '关系名称',
  weight double DEFAULT 1.0 COMMENT '关系权重',
  source string COMMENT '来源',
  created_at timestamp DEFAULT timestamp() COMMENT '创建时间'
) COMMENT = '知识图谱关系';

-- 修改 Edge type
ALTER EDGE relation ADD (confidence double DEFAULT 0.0);

-- 查看
SHOW EDGES;
DESCRIBE EDGE relation;

-- 删除
DROP EDGE IF EXISTS relation;
```

---

## 5. 数据 CRUD

### 5.1 插入数据

```sql
-- 插入点
INSERT VERTEX entity(name, type) VALUES
  "e001":("人工智能", "技术领域"),
  "e002":("深度学习", "技术方向"),
  "e003":("TRS", "公司");

-- 插入边
INSERT EDGE relation(name, weight) VALUES
  "e001" -> "e002"@0:("包含", 0.95),
  "e003" -> "e001"@0:("研发", 0.8);

-- IF NOT EXISTS：不覆盖已有数据
INSERT VERTEX IF NOT EXISTS entity(name) VALUES "e001":("人工智能");
```

### 5.2 查询数据

#### GO 语句（图遍历）

```sql
-- 从指定点出发，沿边遍历
GO FROM "e001" OVER relation YIELD dst(edge) AS target;

-- 多跳查询
GO 2 STEPS FROM "e001" OVER relation YIELD dst(edge);

-- 带条件过滤
GO FROM "e001" OVER relation
  WHERE properties(edge).weight > 0.5
  YIELD dst(edge) AS target, properties(edge).name AS rel_name;

-- 反向遍历
GO FROM "e002" OVER relation REVERSELY YIELD src(edge) AS source;

-- 双向遍历
GO FROM "e001" OVER relation BIDIRECT YIELD dst(edge);

-- 管道符组合查询
GO FROM "e001" OVER relation YIELD dst(edge) AS id |
  GO FROM $-.id OVER relation YIELD properties($$).name AS name;
```

#### MATCH 语句（模式匹配）

```sql
-- 匹配点
MATCH (v:entity{name:"人工智能"}) RETURN v;

-- 匹配关系
MATCH (v:entity{name:"人工智能"})-[e:relation]->(v2)
  RETURN v2.entity.name AS target, e.relation.name AS rel;

-- 通过 VID 匹配
MATCH (v) WHERE id(v) == "e001" RETURN v;

-- 变长路径（1~3 跳）
MATCH p=(v:entity{name:"人工智能"})-[e:relation*1..3]->(v2)
  RETURN v2.entity.name AS target;

-- 多 Edge type 匹配
MATCH (v:entity)-[e:relation|:belong]->(v2) RETURN e;

-- OPTIONAL MATCH（无匹配返回 NULL）
MATCH (m)-[]->(n) WHERE id(m)=="e001"
  OPTIONAL MATCH (n)-[]->(l) RETURN id(m), id(n), id(l);
```

#### LOOKUP 语句（基于索引）

```sql
-- 通过属性查找点
LOOKUP ON entity WHERE entity.name == "人工智能"
  YIELD id(vertex) AS vid, properties(vertex).type AS type;

-- 通过属性查找边
LOOKUP ON relation WHERE relation.weight > 0.8
  YIELD edge AS e;

-- 列出所有点/统计
LOOKUP ON entity YIELD id(vertex) | YIELD COUNT(*) AS total;
```

#### FETCH 语句（获取属性）

```sql
-- 获取点属性
FETCH PROP ON entity "e001" YIELD properties(vertex);
FETCH PROP ON entity "e001" YIELD entity.name AS name;

-- 获取多个点
FETCH PROP ON entity "e001", "e002" YIELD properties(vertex);

-- 获取边属性
FETCH PROP ON relation "e001" -> "e002" YIELD properties(edge);
```

#### 子图与路径

```sql
-- 获取子图
GET SUBGRAPH WITH PROP 2 STEPS FROM "e001"
  YIELD VERTICES AS nodes, EDGES AS relationships;

-- 最短路径
FIND SHORTEST PATH FROM "e001" TO "e003" OVER * YIELD path AS p;

-- 所有路径
FIND ALL PATH FROM "e001" TO "e003" OVER relation UPTO 5 STEPS YIELD path AS p;

-- 无环路径
FIND NOLOOP PATH FROM "e001" TO "e003" OVER relation UPTO 5 STEPS YIELD path AS p;
```

### 5.3 更新数据

```sql
-- 更新点属性
UPDATE VERTEX ON entity "e001" SET name = "人工智能技术"
  WHEN name == "人工智能" YIELD name AS new_name;

-- 更新边属性
UPDATE EDGE ON relation "e001" -> "e002"@0 SET weight = 0.99;

-- UPSERT（不存在则插入）
UPSERT VERTEX ON entity "e004" SET name = "NLP", type = "技术方向";
UPSERT EDGE ON relation "e001" -> "e004"@0 SET name = "包含", weight = 0.9;
```

### 5.4 删除数据

```sql
-- 删除点（同时删除关联的出边和入边）
DELETE VERTEX "e004";

-- 删除边
DELETE EDGE relation "e001" -> "e002"@0;
```

---

## 6. 索引

### 6.1 原生索引

索引配合 `LOOKUP` 和 `MATCH` 使用，**会导致写性能降低**。

```sql
-- 创建 Tag 索引
CREATE TAG INDEX IF NOT EXISTS idx_entity_name ON entity(name(64));
CREATE TAG INDEX IF NOT EXISTS idx_entity_type ON entity(type(32));

-- 创建 Edge 索引
CREATE EDGE INDEX IF NOT EXISTS idx_relation_name ON relation(name(64));

-- 创建复合索引
CREATE TAG INDEX IF NOT EXISTS idx_entity_composite ON entity(name(64), type(32));

-- 重建索引（对已有数据生效）
REBUILD TAG INDEX idx_entity_name;
REBUILD EDGE INDEX idx_relation_name;

-- 查看索引状态
SHOW TAG INDEX STATUS;
SHOW EDGE INDEX STATUS;

-- 查看所有索引
SHOW TAG INDEXES;
SHOW EDGE INDEXES;

-- 删除索引
DROP TAG INDEX IF EXISTS idx_entity_name;
```

> **注意：** 变量属性（如 string）创建索引时需指定长度。UTF-8 中一个中文字符占 3 字节，10 个汉字需设长度为 30。

### 6.2 全文索引

基于 Elasticsearch 实现：

```sql
-- 登录 ES 客户端
SIGN IN TEXT SERVICE (127.0.0.1:9200);

-- 创建全文索引
CREATE FULLTEXT TAG INDEX ft_entity_name ON entity(name);

-- 重建全文索引
REBUILD FULLTEXT INDEX;

-- 全文搜索
LOOKUP ON entity WHERE ES_QUERY(ft_entity_name, "人工智能")
  YIELD id(vertex);

-- 查看全文索引
SHOW FULLTEXT INDEXES;
```

---

## 7. 常用函数

### 7.1 Schema 相关函数


| 函数                                | 说明             |
| --------------------------------- | -------------- |
| `id(vertex)`                      | 返回点 VID        |
| `properties(vertex)`              | 返回点的所有属性       |
| `properties(edge)`                | 返回边的所有属性       |
| `type(edge)`                      | 返回边的 Edge type |
| `src(edge)`                       | 返回边的起始点 VID    |
| `dst(edge)`                       | 返回边的目的点 VID    |
| `rank(edge)`                      | 返回边的 rank      |
| `tags(vertex)` / `labels(vertex)` | 返回点的 Tag 列表    |
| `keys(expr)`                      | 返回所有属性名列表      |
| `nodes(path)`                     | 返回路径中所有点       |
| `relationships(path)`             | 返回路径中所有边       |
| `length(path)`                    | 返回路径长度         |


### 7.2 聚合函数


| 函数                         | 说明            |
| -------------------------- | ------------- |
| `count(*)` / `count(expr)` | 计数（含/不含 NULL） |
| `sum(expr)`                | 求和            |
| `avg(expr)`                | 平均值           |
| `max(expr)`                | 最大值           |
| `min(expr)`                | 最小值           |
| `collect(expr)`            | 聚合为列表         |
| `std(expr)`                | 标准差           |


### 7.3 字符串函数


| 函数                                  | 说明           |
| ----------------------------------- | ------------ |
| `lower(a)` / `upper(a)`             | 大小写转换        |
| `length(a)`                         | 字符串字节长度      |
| `trim(a)` / `ltrim(a)` / `rtrim(a)` | 去空格          |
| `left(a, n)` / `right(a, n)`        | 截取左/右 n 个字符  |
| `substr(a, pos, count)`             | 子字符串         |
| `replace(a, b, c)`                  | 替换           |
| `split(a, b)`                       | 分割为列表        |
| `concat(s1, s2, ...)`               | 拼接           |
| `extract(a, regex)`                 | 正则提取         |
| `json_extract(json_str)`            | JSON 解析为 map |


### 7.4 类型转换函数


| 函数               | 说明   |
| ---------------- | ---- |
| `toBoolean(str)` | 转布尔  |
| `toFloat(x)`     | 转浮点  |
| `toInteger(x)`   | 转整数  |
| `toString(x)`    | 转字符串 |
| `toSet(list)`    | 转集合  |
| `hash(x)`        | 哈希值  |


### 7.5 谓词函数

```sql
-- exists：属性是否存在
WHERE exists(v.entity.description)

-- any/all/none/single：列表条件判断
WHERE any(x IN nodes(p) WHERE x.entity.type == "技术")
WHERE all(x IN collect(v.age) WHERE x > 20)
```

---

## 8. 子句与选项

### 8.1 核心子句


| 子句         | 说明              | 示例                                |
| ---------- | --------------- | --------------------------------- |
| `WHERE`    | 条件过滤            | `WHERE v.entity.name == "AI"`     |
| `YIELD`    | 指定原生 nGQL 返回列   | `YIELD dst(edge) AS target`       |
| `RETURN`   | openCypher 方式返回 | `RETURN v.entity.name`            |
| `ORDER BY` | 排序              | `ORDER BY $-.age DESC`            |
| `LIMIT`    | 限制行数            | `LIMIT 10` 或 `LIMIT 5, 10`（偏移）    |
| `SKIP`     | 跳过行             | `SKIP 5`                          |
| `GROUP BY` | 分组聚合            | `GROUP BY $-.type YIELD count(*)` |
| `WITH`     | 中间结果传递          | `WITH nodes(p) AS n`              |
| `UNWIND`   | 拆分列表            | `UNWIND list AS item`             |
| `SAMPLE`   | 随机采样            | `SAMPLE [1,2,3]`                  |


### 8.2 特殊符号


| 符号      | 说明         |
| ------- | ---------- |
| `$$`    | 边的终点       |
| `$^`    | 边的起点       |
| `$-`    | 管道符前的输出结果  |
| `|`     | 管道符，组合多个查询 |
| `\`     | 换行继续输入     |
| `@rank` | 边的 rank 值  |


---

## 9. 查询调优

### 9.1 执行计划分析

```sql
-- 查看执行计划（不执行）
EXPLAIN format="row" GO FROM "e001" OVER relation;

-- 执行并查看计划 + 概要
PROFILE format="row" GO FROM "e001" OVER relation;
```

### 9.2 性能建议

1. **优先使用 VID 直接查询**：`GO FROM "vid"` > `LOOKUP | GO`
2. **合理使用索引**：只为高频查询字段创建索引
3. **避免全局扫描**：确保 MATCH/LOOKUP 有索引可用
4. **控制路径深度**：变长路径设置合理的 maxHop
5. **使用 LIMIT 限制结果集**：避免返回过多数据
6. **管道符代替子查询**：减少网络往返

---

## 10. 运维管理

### 10.1 作业管理

```sql
-- 触发 Compact
SUBMIT JOB COMPACT;

-- 刷盘
SUBMIT JOB FLUSH;

-- 统计信息
SUBMIT JOB STATS;
SHOW STATS;

-- Leader 负载均衡
SUBMIT JOB BALANCE LEADER;

-- 查看作业
SHOW JOBS;
SHOW JOB <job_id>;

-- 停止/恢复作业
STOP JOB <job_id>;
RECOVER JOB;
```

### 10.2 会话与查询管理

```sql
-- 查看所有会话
SHOW SESSIONS;

-- 终止查询
KILL QUERY(SESSION=<session_id>, PLAN=<plan_id>);

-- 终止会话
KILL SESSION <session_id>;

-- 终止所有会话
SHOW SESSIONS | KILL SESSIONS $-.SessionId;
```

### 10.3 用户权限

```sql
-- 创建用户
CREATE USER user1 WITH PASSWORD 'password';

-- 授予角色
GRANT ROLE ADMIN ON my_space TO user1;

-- 查看角色
SHOW ROLES IN my_space;

-- 查看用户
SHOW USERS;
```

---

## 11. 数据导入导出

### 11.1 TRSGraph Importer

批量导入工具，支持 CSV 格式数据文件导入图数据库。

### 11.2 导入注意事项

- 导入前确保 Schema 已创建且等待心跳周期生效
- 大批量导入建议先关闭索引，导入完成后重建
- VID 必须在数据文件中预先确定

---

## 12. 最佳实践

### 12.1 图建模设计

1. **合理选择 VID 类型**：知识图谱场景推荐 `FIXED_STRING`，便于使用实体唯一标识作为 VID
2. **Tag 设计原则**：按实体类型划分，属性控制在合理数量
3. **Edge Type 设计**：按关系语义划分，避免过度细分
4. **Rank 使用**：同类型起终点间有多条边时使用 rank 区分

### 12.2 系统设计建议

1. **分片数**：设置为集群硬盘数的 5 倍（提前规划扩容）
2. **副本数**：生产环境建议 3 副本
3. **超级顶点处理**：对度数极高的点（如 > 10 万边）做截断或分页查询
4. **TTL 利用**：对临时数据设置 TTL，自动过期清理

### 12.3 知识图谱场景建议

```sql
-- 知识图谱典型 Schema 示例
CREATE SPACE IF NOT EXISTS knowledge_graph (
  partition_num = 100,
  replica_factor = 3,
  vid_type = FIXED_STRING(64)
) COMMENT = '知识图谱';

USE knowledge_graph;

-- 实体 Tag
CREATE TAG IF NOT EXISTS entity (
  name string NOT NULL,
  type string NOT NULL,
  aliases string,
  description string,
  source string,
  confidence double DEFAULT 1.0,
  created_at timestamp DEFAULT timestamp(),
  updated_at timestamp DEFAULT timestamp()
);

-- 关系 Edge Type
CREATE EDGE IF NOT EXISTS relation (
  name string NOT NULL,
  weight double DEFAULT 1.0,
  confidence double DEFAULT 1.0,
  source string,
  properties string,
  created_at timestamp DEFAULT timestamp()
);

-- 必要索引
CREATE TAG INDEX idx_entity_name ON entity(name(128));
CREATE TAG INDEX idx_entity_type ON entity(type(64));
CREATE EDGE INDEX idx_relation_name ON relation(name(128));
REBUILD TAG INDEX idx_entity_name;
REBUILD TAG INDEX idx_entity_type;
REBUILD EDGE INDEX idx_relation_name;
```

---

## 13. 客户端

TRSGraph 支持以下客户端：


| 客户端              | 说明         |
| ---------------- | ---------- |
| TRSGraph Console | 原生命令行客户端   |
| TRSGraph Studio  | 可视化界面客户端   |
| TRSGraph Java    | Java 客户端   |
| TRSGraph Python  | Python 客户端 |
| TRSGraph CPP     | C++ 客户端    |


### 13.1 Python 客户端示例

```python
from nebula3.gclient.net import ConnectionPool
from nebula3.Config import Config

config = Config()
config.max_connection_pool_size = 10

connection_pool = ConnectionPool()
connection_pool.init([('114.117.127.200', 9669)], config)

session = connection_pool.get_session('root', 'trsadmin')

session.execute('USE knowledge_graph')

result = session.execute(
    'MATCH (v:entity{name:"人工智能"})-[e:relation]->(v2) '
    'RETURN v2.entity.name AS target, e.relation.name AS rel'
)

if result.is_succeeded():
    for row in result.rows():
        print(row.values)

session.release()
connection_pool.close()
```

---

## 14. 常见问题

### Q: Schema 操作后立即查询报错？

A: Schema 创建/修改是异步的，需等待 2 个心跳周期（默认 20 秒）。

### Q: 如何避免全局扫描？

A: 确保查询语句有 start VID 或索引可用。MATCH 必须能通过索引或 VID 定位起始点。

### Q: LOOKUP 查询无结果？

A: 检查是否已创建并重建索引（`REBUILD TAG/EDGE INDEX`）。

### Q: VID 使用 string 还是 int64？

A: 知识图谱场景推荐 `FIXED_STRING`，可直接使用实体唯一标识符（如 UUID）。INT64 性能更好但需额外映射。

### Q: 如何处理超级顶点（度数极高的点）？

A: 使用 `LIMIT` 限制返回边数，或通过 `SAMPLE` 随机采样，避免一次查询返回过多边。

### Q: nGQL 与 openCypher 的主要差异？

A: 强 Schema（需先建 Tag/Edge）、相等用 `==`、无 `MERGE` 语句、换行用 `\`、无事务。

---

## 15. 参考

- 官方文档：TRSGraph Database v10.0 手册
- 默认端口：Meta 9559 / Graph 9669 / Storage 9779
- 配置路径：`/usr/local/trsgraph/etc/`
- 日志路径：`/usr/local/trsgraph/logs/`

## 16. TRS Graph 灵活读写工具

TRS Graph 灵活读写工具（节点 / 边自由字段，配套 curl 接口）。

### 16.1 设计目标

1. 不写死字段：写入点 / 边时，传入任意 dict 属性即可，自动生成 nGQL，
  自动做字符串转义、类型渲染；可选自动建模（CREATE / ALTER TAG/EDGE 补齐缺失字段）。
2. 提供 curl 接口：内置一个零依赖（仅标准库）的 HTTP 服务，
  用「自由 JSON」写入点 / 边、执行查询，方便 curl / 任意语言调用。
3. 双传输通道：
  - gateway（默认）：走 TRSGraph Studio 的 HTTP 网关（端口 7001），仅用标准库 urllib，
   无需安装 nebula3，适合无法直连 9669 的环境。
  - nebula（可选）：走原生 nebula3 客户端（端口 9669），需 `pip install nebula3-python`。

## 16.2 连接配置（环境变量，均有默认值，与 TRS.md / .env 对齐）

```bash
  TRS_GRAPH_HOST      Studio HTTP 网关地址，默认 http://114.117.127.200:7001
  TRS_GRAPH_USER      用户名，默认 root
  TRS_GRAPH_PASSWORD  密码，默认 trsadmin
  TRS_GRAPH_ADDR      网关内部连接 graphd 的地址，默认 127.0.0.1（网关与 graphd 同机时用此值）
  TRS_GRAPH_PORT      graphd 端口，默认 9669
  TRS_SPACE           默认图空间，默认 knowledge_graph
  TRS_TRANSPORT       传输通道：gateway（默认）/ nebula
```

## 16.3 命令行用法（在 gkx-mis-api 目录下，用项目 uv 执行）

```bash
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
```

## 16.4 注意事项

注意：TRSGraph 为强 Schema，写入前字段必须已存在于 TAG/EDGE 中。
   使用 --auto-schema（或接口 ensure_schema=true）可自动补齐，但 Schema 变更为异步，
   首次新增字段需等待约 2 个心跳周期（默认 20s）生效。