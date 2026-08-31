# 垂直领域知识图谱页面 Mock 与算法接口需求

> 本文只针对前端 `VerticalDomainGraph.tsx`（“垂直领域图谱”页面）。  
> 目标：算法开发机可根据本文访问开发数据和 TRS 图，返回与页面一致的数据结构；前端替换 `COMPANY_DATA` 等本地 Mock 后即可展示真实结果。  
> 机器可读样例：`samples/vertical-domain/company-dashboard.mock.json`。

---

## 1. 当前页面展示内容

页面以企业为中心，包含两个视图。

### 1.1 图谱视图

1. 企业下拉列表；
2. 左侧行业风险事件；
3. 中间企业关系图；
4. 底部多模态知识图谱推理：
   - 企业关联关系推理；
   - 行业趋势预测；
   - 市场机会发现；
5. 右侧企业信息：
   - 基本信息；
   - 财务概况；
   - 近期动态；
   - 关联方；
   - 舆情分析。

### 1.2 行业报告视图

页面使用同一份企业数据生成：

- 企业概况；
- 近年营收、净利润、研发投入；
- 图谱关系摘要；
- 风险事件；
- 舆情比例；
- 行业趋势；
- 市场机会；
- 竞争/合作等推理关系。

因此算法/聚合接口必须一次返回页面和报告所需的完整数据，不能只返回节点与边。

---

## 2. 重要的数据一致性说明

当前页面写死的企业是：

- 华为技术有限公司；
- 比亚迪股份有限公司；
- 腾讯控股有限公司；
- 宁德时代新能源科技股份有限公司；
- 小米集团。

但现有 TRS `prototype_enterprise_graph` 使用的是 `prototype_seed_20260828` 原型企业，**不包含上述 5 家页面 Mock 企业**。可直接用于联调的核心企业是：

| orgId | 企业 |
|---|---|
| `PROTO_ORG_MED001` | 华研精准医疗科技有限公司 |
| `PROTO_ORG_MED002` | 南方智药生物科技有限公司 |
| `PROTO_ORG_MED003` | 康图医学影像科技有限公司 |
| `PROTO_ORG_CHEM001` | 粤科先进材料有限公司 |
| `PROTO_ORG_CHEM002` | 华南绿色催化科技有限公司 |
| `PROTO_ORG_CHEM003` | 湾区高分子技术有限公司 |
| `PROTO_ORG_OCEAN001` | 蓝海智能装备有限公司 |
| `PROTO_ORG_OCEAN002` | 深湾海洋生物科技有限公司 |
| `PROTO_ORG_QUANT001` | 量芯计算科技有限公司 |
| `PROTO_ORG_QUANT002` | 粤港量子通信有限公司 |

联调时应优先把企业下拉列表改为接口返回的这 10 家。若必须展示华为、比亚迪等 5 家，需要先从样例 MySQL 抽取它们并重新构建对应 TRS 子图，不能把页面静态内容当作图中真实数据。

---

## 3. 开发数据与图地址

## 3.1 推荐联调数据源：测试 MySQL

| 配置 | 值 |
|---|---|
| Host | `139.199.45.106` |
| Port | `3306` |
| Database | `gkx` |
| 数据批次 | `prototype_seed_20260828` |
| 用途 | 页面接口开发、可控的企业全景数据联调 |

连接凭据不要写进代码或接口文档，使用：

```bash
export GKX_DB_HOST=139.199.45.106
export GKX_DB_PORT=3306
export GKX_DB_USER='<另行提供>'
export GKX_DB_PASSWORD='<另行提供>'
export GKX_DB_NAME=gkx
```

查询原型数据时必须带：

```sql
WHERE table_data_source = 'prototype_seed_20260828'
```

避免把原型记录与库内其他业务数据混在一起。

## 3.2 可选数据源：样例 MySQL

| 配置 | 值 |
|---|---|
| Host | `183.240.141.251` |
| Port | `3318` |
| Database | `gkx` |
| User | `gkx_reader_ss` |
| 权限 | 只读 |
| 用途 | 大规模样例表字段验证、扩展真实企业候选 |

密码另行通过安全方式提供，不提交仓库。该库数据量较大，算法开发阶段不要无条件全表扫描。

## 3.3 TRS / NebulaGraph

| 配置 | 值 |
|---|---|
| Gateway | `http://114.117.127.200:7001` |
| User | `root` |
| Transport | `gateway` |
| Gateway 内部 Graph 地址 | `127.0.0.1:9669` |
| 页面主图空间 | `prototype_enterprise_graph` |
| 科研关联补充空间 | `prototype_science_topic_graph` |
| 全量本体空间 | `gkx_full_ontology` |

环境变量：

```bash
export TRS_GRAPH_HOST=http://114.117.127.200:7001
export TRS_GRAPH_USER=root
export TRS_GRAPH_PASSWORD='<另行提供>'
export TRS_GRAPH_ADDR=127.0.0.1
export TRS_GRAPH_PORT=9669
export TRS_TRANSPORT=gateway
export TRS_ENTERPRISE_SPACE=prototype_enterprise_graph
```

注意：

- 算法开发机连接的是 `TRS_GRAPH_HOST` 网关；
- `127.0.0.1:9669` 是网关请求中的 Graph 地址，不是让开发机直接连接本机 NebulaGraph；
- 网关调用可复用 `scripts/build_trs_test_graphs.py` 中的 `TrsGraphClient`；
- `gkx_full_ontology` 主要用于 Schema/本体，不是当前企业页面的首选数据图；
- 当前已构建的企业原型图约为 202 个节点、220 条边，科研专题图约为 164 个节点、272 条边。

网关使用的路径：

```text
POST /api-nebula/db/connect
POST /api-nebula/db/exec
POST /api-nebula/db/disconnect
```

## 3.4 `prototype_enterprise_graph` Schema

Tags：

| Tag | 页面节点类型 | 主要属性 |
|---|---|---|
| 企业 | `company` / `partner` | `name, legal_rep, org_type, registered_capital, city, credit_code, industry, org_size` |
| 人物 | `person` | `name, position` |
| 产品 | `product` | `name, industry_link` |
| 技术 | `technology` | `name, domain` |
| 事件 | 页面近期动态/风险候选 | `name, date, content` |
| 属性快照 | 财务趋势 | `year, operating_revenue, pure_profit, rd_amount, employees, total_assets, total_liabilities` |
| 行业分类 | 行业变化 | `name, start_date, end_date, is_current` |

Edges：

| Edge | 页面用途 |
|---|---|
| 任职 | 企业—人物 |
| 持股 | 股东—企业 |
| 控股 | 企业—子公司 |
| 投资 | 企业—被投企业 |
| 研发 | 企业—技术 |
| 推出 | 企业—产品 |
| 发生 | 企业—事件 |
| 具有快照 | 企业—年度财务快照 |
| 属于行业 | 企业—行业分类 |

---

## 4. 页面字段与 MySQL 表映射

| 页面数据 | 表 | 主要关联/字段 |
|---|---|---|
| 企业基本信息 | `dwd_org_base_info` | `org_id,name_cn,incorporation_year,lerep,org_type,address,city,external_id,industry` |
| 人物/职位 | `dwd_org_executive_info` | `org_id,executives_name,executives_position` |
| 股东 | `dwd_org_shareholder_info` | `org_id,inv_org_id,owners_name,ownership_percentage` |
| 子公司 | `dwd_org_subsidiary_info` | `org_id,sub_org_id,sub_name_cn` |
| 投资关系 | `dwd_org_invest_info` | `org_id,inv_org_id,inv_name,investment_ratio` |
| 并购关系 | `dwd_org_merger_acquisition_info` | `acquiring_org_id,acquired_org_id,ma_amount` |
| 技术 | `dwd_org_tech_tag` | `org_id,org_tag` |
| 产品 | `dwd_org_industry_product_tags` | `company_id,product_name,industry_name,industry_link_name` |
| 行业 | `dwd_corp_his_sw_ic`、`dwd_org_industry_tags` | `org_id/credit_code,industry_name,inclusion_date,lastest_symbol` |
| 上下游关联方 | `dwd_org_sc_info` | `credit_code,company_name,type,name,code` |
| 企业新闻 | `dwd_org_important_news_info` | `org_id,news_title,news_date,news_content,original_textlink` |
| 年度财务 | `dwd_org_annual_financial_info` | `org_id,year,operating_revenue,pure_profit,arch_development_am` |
| 风险事件 | `dwd_org_company_punish` 等风险表 | `org_id,penalty_date,violation_type,penalty_content` |
| 专利证据 | `dwd_patent*` 系列表 | 申请人名称/机构 ID 与企业对齐 |

单位要求：

- MySQL 财务金额为原始货币金额；
- 页面 `financialTrend` 统一转换为“亿元”；
- 比例统一返回 `0～100` 的百分点；
- 日期统一 `YYYY-MM-DD`。

---

## 5. 页面 Mock API

## 5.1 企业下拉列表

```http
GET /api/v1/vertical-domain/companies?page=1&pageSize=50&keyword=&domain=
```

响应：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "items": [
      {
        "id": "PROTO_ORG_MED001",
        "name": "华研精准医疗科技有限公司",
        "industry": "精准医疗",
        "domain": "医疗专题"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 10
  }
}
```

## 5.2 企业页面完整数据

```http
GET /api/v1/vertical-domain/companies/{orgId}/dashboard
```

查询参数：

| 参数 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `graphSpace` | 否 | `prototype_enterprise_graph` | 默认企业原型图 |
| `asOf` | 否 | `2026-08-30` | 数据截止时间 |
| `includeInference` | 否 | `true` | 是否返回底部推理结果 |

成功响应：

```json
{
  "code": "OK",
  "message": "success",
  "requestId": "req_vertical_001",
  "data": {
    "id": "PROTO_ORG_MED001",
    "name": "华研精准医疗科技有限公司",
    "industry": "精准医疗",
    "founded": "2012年",
    "type": "其他有限责任公司",
    "location": "广东省深圳市科技创新园1号",
    "legalRep": "陈明远",
    "creditCode": "PROTO20260828MED001",
    "financialSummary": "2025年营业收入16.40亿元，净利润1.33亿元，研发投入2.95亿元。",
    "financialTrend": [
      {
        "year": "2025",
        "revenue": 16.4,
        "profit": 1.33,
        "rd": 2.95
      }
    ],
    "news": [],
    "associates": [],
    "riskEvents": [],
    "sentiment": "依据近期公开资讯生成的舆情摘要。",
    "sentimentStats": {
      "positive": 60,
      "neutral": 30,
      "negative": 10
    },
    "nodes": [],
    "edges": [],
    "inference": {
      "relations": [],
      "trends": [],
      "opportunities": []
    },
    "meta": {
      "graphSpace": "prototype_enterprise_graph",
      "dataBatch": "prototype_seed_20260828",
      "asOf": "2026-08-30",
      "modelName": "vertical-domain-mock",
      "modelVersion": "mock-v1"
    }
  }
}
```

完整机器可读示例见 `samples/vertical-domain/company-dashboard.mock.json`。

---

## 6. 精确字段定义

## 6.1 根对象

| 字段 | 类型 | 必填 | 页面用途 |
|---|---|---:|---|
| `id` | string | 是 | 企业 `org_id` |
| `name` | string | 是 | 企业名称和下拉展示 |
| `industry` | string | 是 | 企业名称下副标题 |
| `founded` | string | 是 | 基本信息 |
| `type` | string | 是 | 企业类型 |
| `location` | string | 是 | 地址 |
| `legalRep` | string | 是 | 法定代表人 |
| `creditCode` | string | 是 | 统一信用代码/原型代码 |
| `financialSummary` | string | 是 | 右侧财务概况 |
| `financialTrend` | array | 是 | 报告中的年度柱状图 |
| `news` | array | 是 | 近期动态 |
| `associates` | array | 是 | 关联方 |
| `riskEvents` | array | 是 | 左侧风险监控 |
| `sentiment` | string | 是 | 舆情摘要 |
| `sentimentStats` | object | 是 | 报告舆情比例 |
| `nodes` | array | 是 | 中间图谱节点 |
| `edges` | array | 是 | 中间图谱边 |
| `inference` | object | 是 | 底部三类推理结果 |
| `meta` | object | 是 | 数据、图、模型溯源 |

数组无数据时返回 `[]`，字符串无数据时返回空字符串；不要省略字段或返回 `null`。

## 6.2 财务趋势

```ts
interface FinancialPoint {
  year: string;
  revenue: number; // 亿元
  profit: number;  // 亿元
  rd: number;      // 亿元
}
```

至少按年份升序返回最近 3 年；不足 3 年则返回实际数据，不得补造。

## 6.3 新闻、关联方、风险、舆情

```ts
interface CompanyNews {
  id: string;
  date: string;
  title: string;
  content?: string;
  sourceUrl?: string;
}

interface Associate {
  id: string;
  name: string;
  relation: string;
  weight?: number; // 0～1
}

interface RiskEvent {
  id: string;
  date: string;
  desc: string;
  severity: 'high' | 'medium' | 'low';
  sourceUrl?: string;
}

interface SentimentStats {
  positive: number; // 0～100
  neutral: number;
  negative: number;
}
```

`positive + neutral + negative` 必须等于 100。风险等级必须由数据/规则返回，不能像当前 Mock 一样按列表顺序猜测。

## 6.4 图节点

```ts
interface GraphNode {
  id: string;
  label: string;
  type: 'company' | 'person' | 'product' | 'technology' | 'partner';
  x: number;
  y: number;
  properties?: Record<string, string | number | boolean>;
}
```

- 当前 SVG 直接读取 `x/y`，接口应返回完成布局后的坐标；
- 画布参考范围：`x: 50～650`，`y: 40～440`；
- 中心企业建议位于 `(350, 240)`；
- `id` 必须与 TRS VID 一致或提供稳定映射；
- 不把颜色、图标等展示属性返回算法接口。

TRS Tag 映射：

| TRS Tag | `type` |
|---|---|
| 企业（中心企业） | `company` |
| 企业（子公司、股东、上下游） | `partner` |
| 人物 | `person` |
| 产品 | `product` |
| 技术 | `technology` |

事件、财务快照、行业分类用于侧栏和报告，不要求画为当前五类节点。

## 6.5 图边

```ts
interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  relationType: string;
  weight?: number;
  inferred: boolean;
}
```

- `from/to` 必须引用 `nodes[].id`；
- 页面主图优先返回已验证边，`inferred: true` 的边需使用不同样式后再展示；
- 边方向与 TRS 一致；
- `weight` 范围 `[0,1]`。

## 6.6 企业关联关系推理

```ts
interface InferredRelation {
  id: string;
  from: string;
  fromId: string;
  rel: string;
  relationType: string;
  to: string;
  toId: string;
  confidence: number; // 当前页面要求 0～100
  basis: string;
  evidence: Evidence[];
}
```

## 6.7 行业趋势

```ts
interface IndustryTrend {
  id: string;
  tech: string;
  technologyId?: string;
  direction: 'up' | 'down';
  confidence: number; // 当前页面要求 0～100
  desc: string;
  horizonMonths: number;
  evidence: Evidence[];
}
```

当前页面只支持 `up/down`；如算法需要 `stable`，必须先改前端枚举。

## 6.8 市场机会

```ts
interface MarketOpportunity {
  id: string;
  title: string;
  tag: string;
  desc: string;
  score: number; // 当前页面要求 0～100
  evidence: Evidence[];
}
```

## 6.9 推理证据

```ts
interface Evidence {
  modality: 'graph' | 'news' | 'financial' | 'patent' | 'industry';
  sourceId: string;
  sourceName?: string;
  sourceUrl?: string;
  eventTime?: string;
  snippet: string;
  score?: number; // 0～1
}
```

证据目前未直接显示，但必须返回，后续点击推理卡片时展示。`basis` 是证据摘要，不能代替结构化 `evidence`。

---

## 7. 算法接口

Mock 阶段可由第 5.2 节聚合接口直接返回 `inference`。真实算法建议拆为独立接口。

```http
POST /api/v1/vertical-domain/companies/{orgId}/infer
```

请求：

```json
{
  "graphSpace": "prototype_enterprise_graph",
  "asOf": "2026-08-30",
  "tasks": ["relation", "trend", "opportunity", "risk", "sentiment"],
  "evidenceSources": ["graph", "news", "financial", "patent", "industry"],
  "topK": 10,
  "threshold": 0.6,
  "trendHorizonMonths": 12
}
```

响应：

```json
{
  "code": "OK",
  "message": "success",
  "requestId": "req_infer_001",
  "data": {
    "relations": [],
    "trends": [],
    "opportunities": [],
    "riskEvents": [],
    "sentiment": "",
    "sentimentStats": {
      "positive": 0,
      "neutral": 100,
      "negative": 0
    },
    "asOf": "2026-08-30",
    "modelName": "vertical-domain-reasoner",
    "modelVersion": "1.0.0"
  }
}
```

---

## 8. 算法需求

## 8.1 企业子图聚合

输入：`orgId + graphSpace + asOf`。  
输出：中心企业一跳/二跳子图、基本属性、人物、产品、技术、关联企业、事件、财务。

要求：

- 默认一跳，每类节点设置上限，避免页面过密；
- 页面建议最多 25 个节点、40 条边；
- 同一实体按稳定 ID 去重；
- 显式 TRS 边与推断边必须区分；
- 对超限候选按业务权重、时间新鲜度排序。

## 8.2 企业关联关系推理

候选关系包括：

- 控股/投资/持股；
- 上下游；
- 合作；
- 竞争；
- 技术相似；
- 潜在合作。

可用特征：

- TRS 邻居和共同邻居；
- 产品、行业、技术标签相似度；
- 供应链方向；
- 专利 IPC/关键词重合；
- 新闻共现；
- 历史投资、并购和股权关系。

要求：

- 已存在显式关系不得再次作为“推断关系”返回；
- 每条结果至少一条证据；
- `confidence` 必须校准为 `0～100`；
- 无证据不得生成“潜在合作/竞争”结论。

## 8.3 行业趋势预测

输入特征：

- 企业技术标签及年份；
- 专利申请/公开时间序列；
- 新闻主题热度时间序列；
- 产品发布；
- 行业分类变化；
- 财务研发投入。

输出必须包含技术、方向、置信度、预测期和证据。训练/回测必须按时间切分，禁止使用 `asOf` 之后的数据。

## 8.4 市场机会发现

建议根据行业增长、技术热度、企业能力、产品空白、供应链缺口和政策/风险生成候选，并进行排序。

要求：

- 返回机会类型 `tag`；
- 描述必须说明企业能力与市场信号的对应关系；
- 评分为 `0～100`；
- 每条机会至少包含两类证据，否则仅作为低置信候选。

## 8.5 风险与舆情

- 风险抽取需返回发生日期、严重度和来源；
- 舆情统计按同一时间窗口计算；
- 没有足够样本时返回中性结果并在 `basis`/日志中说明，不能编造正负面比例；
- 原型处罚数据明确标注“模拟”，不能作为企业真实负面事实对外展示。

---

## 9. Mock 实现要求

算法服务尚未完成时，Mock 服务也必须按正式契约提供 HTTP 响应，而不是在 React 组件中继续写死数据。

建议：

```text
GET /api/v1/vertical-domain/companies
GET /api/v1/vertical-domain/companies/PROTO_ORG_MED001/dashboard
```

Mock 要求：

1. 使用 `samples/vertical-domain/company-dashboard.mock.json`；
2. 支持至少 3 家不同企业，而不是无论 ID 都返回同一对象；
3. 不使用随机数，确保视觉回归稳定；
4. 不模拟不存在的华为/比亚迪 TRS 节点；
5. 空数组、404、500 各提供一个可测试场景；
6. Mock 与正式服务共用同一个 OpenAPI Schema。

---

## 10. 前端最小改动

当前页面需要：

1. 将 `COMPANIES` 替换为企业列表接口；
2. 将 `COMPANY_DATA[selectedCompany]` 替换为 dashboard 接口；
3. 将 `FINANCIAL_TREND` 替换为 `data.financialTrend`；
4. 将按企业名称猜测的舆情比例替换为 `data.sentimentStats`；
5. 风险等级使用 `riskEvents[].severity`；
6. 图边 key 使用 `edge.id`；
7. 推理卡片后续增加证据详情；
8. 保留页面本地的缩放、平移、模板选择和打印逻辑。

如果接口严格遵守本文字段，图谱、侧栏、推理面板和行业报告均可共用一份 dashboard 响应。

---

## 11. 验收标准

- 企业列表来源于接口且能切换；
- 页面显示企业与 TRS `orgId/VID` 一致；
- 节点和边引用完整，不出现悬空边；
- 财务单位正确，图表至少显示实际可用年份；
- 风险、新闻、关联方均有稳定 ID 和来源；
- 推理结果有置信度、依据和结构化证据；
- 推理不使用截止时间之后的数据；
- 页面刷新后仍能从接口恢复；
- Mock 与正式接口返回结构完全一致；
- 开发凭据均来自环境变量，不提交密码。
