# 演示页算法接口文档

本期已落地的 B0 / B1 / B3 / B4 演示接口，外加 B2 的时序关系、未来状态预测、跨域知识融合、局部学习事件标注、引擎接口与管理、GLM-4.6V 图片描述、关系语义提炼、材料领域核心元组抽取、结构化四元组抽取、基于模式的新实例抽取与置信度评估、属性名称翻译匹配、基于实例值的属性对齐、跨资源关系预测、相似度计算引擎、实体精准匹配、字符串 / 向量 / 邻居 / 路径匹配与特征工程、上下文语义分析、规则引擎执行与实例生成预览、三元组距离 / 语义打分函数、关系推理（Horn 规则 / PRA 路径 / 结果审核），以及事实变更监听的推理内核校验，共 **52 个页面、69 条路由**。其余 B2 延期，不注册空壳。

需求原文见 [`新增接口演示页算法需求.md`](./新增接口演示页算法需求.md)，联调夹具见 [`samples/api-demo/fixtures.json`](./samples/api-demo/fixtures.json)。

下面每条接口都给一条可直接复制执行的 curl。先在当前终端导出变量：

```bash
export BASE_URL="http://127.0.0.1:30080"
export TOKEN="dev-token"
```

---

## 1. 调用约定

| 项 | 约定 |
|---|---|
| 外部 Base | `http://{host}:30080` |
| 内部服务 | `127.0.0.1:18088`（不对外） |
| 鉴权 | `Authorization: Bearer <token>`，默认 `dev-token` |
| 请求头 | 建议带 `X-Request-Id`；写操作必须带 `Idempotency-Key` |
| 编码 | UTF-8 JSON，字段 **camelCase** |
| 时间 | ISO 8601 UTC |
| 分数 | `[0, 1]` |
| 文本偏移 | JS UTF-16 code unit，半开区间 `[start, end)` |
| 图像框 | 百分比 `x, y, w, h ∈ [0, 100]`，左上角原点 |
| 无结果 | HTTP 200 + 空数组 |
| 图空间 | `gkx_kg_rag` |
| 文件路径 | `filePath` / `imagePath` 等路径字段传 OSS object key，不读本地盘 |

统一成功响应：

```json
{
  "code": "OK",
  "message": "success",
  "requestId": "req_xxx",
  "data": {}
}
```

错误：

| HTTP | code | 含义 |
|---|---|---|
| 400 | `INVALID_ARGUMENT` | 参数不合法 |
| 404 | `NOT_FOUND` | 路由或审核记录不存在 |
| 424 | `INTERNAL_ERROR` | 依赖缺失（如 OCR） |
| 502 / 503 | `INTERNAL_ERROR` | 上游 LLM / TRSGraph 失败 |

推理类 `data` 必须含 `modelName`、`modelVersion`。`POST /api/v1/llm/chat/completions` 用 `model` 标识连通模型。

机器可读清单：

```bash
curl "$BASE_URL/openapi.json"

curl "$BASE_URL/api/v1/demo/metadata" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. 路由总表

| 批次 | pageId | 方法 | 路径 |
|---|---|---|---|
| B0 | `text-entity-localization` | POST | `/api/v1/mmkg/text/entities:locate` |
| B0 | `visual-entity-localization` | POST | `/api/v1/mmkg/vision/entities:locate` |
| B0 | `text-concept-localization` | POST | `/api/v1/mmkg/text/concepts:locate` |
| B0 | `visual-concept-localization` | POST | `/api/v1/mmkg/vision/concepts:locate` |
| B0 | `relation-localization` | POST | `/api/v1/mmkg/relations:locate` |
| B0 | `text-relation-localization` | POST | `/api/v1/mmkg/text/relations:locate` |
| B0 | `visual-relation-localization` | POST | `/api/v1/mmkg/vision/relations:locate` |
| B0 | `completion-result-review` | GET | `/api/v1/mmkg/completion-candidates` |
| B0 | `completion-result-review` | POST | `/api/v1/mmkg/completion-candidates/{id}:decide` |
| B1 | `time-entity-normalization` | POST | `/api/v1/temporal/entities:normalize` |
| B2 | `temporal-relation-audit` | POST | `/api/v1/temporal/relations:extract` |
| B2 | `temporal-relation-audit` | POST | `/api/v1/temporal/relations:analyze` |
| B2 | `future-state-prediction` | POST | `/api/v1/temporal/states:predict` |
| B1 | `entity-attr-api` | POST | `/api/v1/entities/attributes/query` |
| B1 | `entity-attr-api` | POST | `/api/v1/entities/attributes/extract-batch` |
| B1 | `standard-graph-api` | POST | `/api/v1/graph/query` |
| B1 | `standard-graph-api` | POST | `/api/v1/graph/path` |
| B1 | `standard-graph-api` | POST | `/api/v1/semantic/match` |
| B1 | `api-integration-inference` | POST | `/api/v1/rules/inference:run` |
| B2-live | `rule-instance-preview` | POST | `/api/v1/rules/instances:preview` |
| B1 | `knowledge-consistency-validation` | POST | `/api/v1/kg/consistency:validate` |
| B3 | `text-instance-matching` | POST | `/api/v1/matching/text:compare` |
| B3 | `string-instance-matching` | POST | `/api/v1/matching/string:compare` |
| B3 | `vector-instance-matching` | POST | `/api/v1/matching/vector:compare` |
| B3 | `similarity-engine` | POST | `/api/v1/matching/similarity:compute` |
| B3 | `precise-entity-matching` | POST | `/api/v1/matching/entities:precise-match` |
| B3 | `structure-instance-matching` | POST | `/api/v1/matching/structure:compare` |
| B3 | `neighbor-instance-matching` | POST | `/api/v1/matching/neighbors:compare` |
| B3 | `path-pattern-matching` | POST | `/api/v1/matching/paths:compare` |
| B3 | `instance-feature-engineering` | POST | `/api/v1/matching/features:extract` |
| B3 | `candidate-entity-generation` | POST | `/api/v1/linking/candidates:generate` |
| B3 | `entity-link-judgment` | POST | `/api/v1/linking/judgment:score` |
| B3 | `contextual-semantic-analysis` | POST | `/api/v1/linking/context:analyze` |
| B3 | `cross-lingual-instance-matching` | POST | `/api/v1/xling/instances:match` |
| B3 | `cross-lingual-query-fusion` | POST | `/api/v1/xling/query:fuse` |
| B3 | `cross-lingual-attribute-alignment` | POST | `/api/v1/xling/attributes:align` |
| B3 | `cross-lingual-kb-alignment` | POST | `/api/v1/xling/kb:align` |
| B3 | `entity-matching-disambiguation` | GET | `/api/v1/matching/disambiguation/candidates` |
| B3 | `entity-matching-disambiguation` | POST | `/api/v1/matching/disambiguation/candidates/{id}:decide` |
| B3 | `verified-knowledge-write` | POST | `/api/v1/kg/verified-triples:write` |
| B3 | `llm-api-integration` | POST | `/api/v1/llm/chat/completions` |
| B4 | `concept-cooccurrence-index` | POST | `/api/v1/concept/cooccurrence:index` |
| B4 | `hypernym-generation-audit` | POST | `/api/v1/taxonomy/hypernyms:generate` |
| B4 | `upper-intelligent-tools` | POST | `/api/v1/tools/analogy:search` |
| B4 | `upper-intelligent-tools` | POST | `/api/v1/tools/research-questions:generate` |
| B2-live | `cross-domain-knowledge-fusion` | POST | `/api/v1/fusion/patent:decompose` |
| B2-live | `cross-domain-knowledge-fusion` | POST | `/api/v1/fusion/literature:match` |
| B2-live | `cross-domain-knowledge-fusion` | POST | `/api/v1/fusion/cross-domain:run` |
| B2-live | `patent-literature-match` | GET | `/api/v1/cross-domain/graphs` |
| B2-live | `patent-literature-match` | POST | `/api/v1/cross-domain/patent-literature:match` |
| B2-live | `key-path-extract` | POST | `/api/v1/cross-domain/key-paths:extract` |
| B2-live | `theme-tech-research-market` | POST | `/api/v1/theme-tech/research-market-paths:analyze` |
| B2-live | `theme-tech-industry` | POST | `/api/v1/theme-tech/tech-industry:analyze` |
| B2-live | `local-learning-annotator` | POST | `/api/v1/events:recognize` |
| B2-live | `local-learning-annotator` | POST | `/api/v1/annotation/local-learning:bootstrap` |
| B2-live | `local-learning-annotator` | POST | `/api/v1/annotation/sentences:select` |
| B2-live | `engine-api-management` | POST | `/api/v1/engine/events:recognize` |
| B2-live | `engine-api-management` | POST | `/api/v1/engine/annotation:optimize` |
| B2-live | `event-annotation-mgmt` | GET/POST | `/api/v1/events/projects` |
| B2-live | `event-annotation-mgmt` | GET | `/api/v1/events/projects/{id}` |
| B2-live | `event-annotation-mgmt` | POST | `/api/v1/events/projects/{id}:assign` |
| B2-live | `event-annotation-mgmt` | POST | `/api/v1/events/projects/{id}/events:annotate` |
| B2-live | `event-annotation-mgmt` | POST | `/api/v1/events/projects/{id}/dataset:export` |
| B2-live | `event-annotation-mgmt` | GET | `/api/v1/events/models` |
| B2-live | `event-annotation-mgmt` | POST | `/api/v1/events/models:train` |
| B2-live | `event-ingest-workflow` | POST | `/api/v1/events/reviews:extract` |
| B2-live | `event-ingest-workflow` | GET | `/api/v1/events/reviews` |
| B2-live | `event-ingest-workflow` | POST | `/api/v1/events/reviews/{id}:decide` |
| B2-live | `event-ingest-workflow` | POST | `/api/v1/events/reviews:ingest` |
| B2-live | `visual-entity-localization` | POST | `/api/v1/mmkg/images:caption` |
| B2-live | `visual-entity-localization` | POST | `/api/v1/general/openclip/image-caption` |
| B2-live | `llm-semantic-refine` | POST | `/api/v1/nlp/semantic:refine` |
| B2-live | `sci-core-tuple-extract` | POST | `/api/v1/science/core-tuples:extract` |
| B2-live | `structured-ie` | POST | `/api/v1/extract/quadruples:extract` |
| B2-live | `new-instance-extraction` | POST | `/api/v1/extract/instances:extract` |
| B2-live | `attribute-name-translation-matching` | POST | `/api/v1/attributes/names:match` |
| B2-live | `instance-value-attribute-alignment` | POST | `/api/v1/attributes/values:align` |
| B2-live | `cross-resource-relation` | POST | `/api/v1/relations/cross-resource:predict` |
| B2-live | `distance-scoring` | POST | `/api/v1/score/distance:compute` |
| B2-live | `semantic-scoring` | POST | `/api/v1/score/semantic:compute` |
| B2-live | `relation-reasoning` | POST | `/api/v1/reason/rules:infer` |
| B2-live | `relation-reasoning` | POST | `/api/v1/reason/paths:infer` |
| B2-live | `relation-reasoning` | GET | `/api/v1/reason/results` |
| B2-live | `relation-reasoning` | POST | `/api/v1/reason/results:review` |
| B2-live | `fact-change-listening` | POST | `/api/v1/reason/fact-changes:validate` |

---

## 3. B0 知识定位与补全审核

### 3.1 文本实体定位

`POST /api/v1/mmkg/text/entities:locate`

`data.entities[]`：`{ text, type, start, end, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/text/entities:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-text-entity" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "清华大学张明教授在 ACL 2024 上发表了关于知识图谱与 GraphSAGE 嵌入的研究成果，合作单位包括北京大学与中科院计算所。",
    "lang": "zh",
    "entityTypes": ["ORG", "PER", "EVENT", "CONCEPT"]
  }'
```

### 3.2 视觉实体定位

`POST /api/v1/mmkg/vision/entities:locate`

`image.url` / `image.base64` / `imagePath` 三选一。`imagePath` 是 OSS object key，服务按 `/data/jichenxu/oss.py` 换签后下载。本地 OCR + GLM 识别区域。可选 `entityTypes` 限制实体类型，不传则由模型自选。`data.entities[]`：`{ id, label, type, x, y, w, h, score }`，框为百分比。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/vision/entities:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-vision-entity" \
  -H "Content-Type: application/json" \
  -d '{
    "image": {
      "url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=480&fit=crop"
    },
    "entityTypes": ["Person", "Organization", "Material"],
    "topK": 10
  }'
```

### 3.3 文本概念定位

`POST /api/v1/mmkg/text/concepts:locate`

`data.concepts[]`：`{ text, label, start, end, score }`。`label` 为归一化概念，例如「少样本」→「少样本学习」。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/text/concepts:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-text-concept" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "本研究提出一种基于元学习的少样本知识图谱补全框架。"
  }'
```

### 3.4 视觉概念定位

`POST /api/v1/mmkg/vision/concepts:locate`

`data`：`{ modelName, modelVersion, topLabel, scenes[{ label, score }] }`，`topLabel = scenes[0].label`。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/vision/concepts:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-vision-concept" \
  -H "Content-Type: application/json" \
  -d '{
    "image": {
      "url": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=640&h=480&fit=crop"
    },
    "topK": 4
  }'
```

### 3.5 关系定位

`POST /api/v1/mmkg/relations:locate`

`data.relations[]`：`{ head, headKind, relation, tail, tailKind, score }`，`headKind/tailKind ∈ {entity, concept}`。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/relations:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-relation" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "清华大学张明教授研究知识图谱补全，与北京大学合作开展 GraphSAGE 嵌入与关系推理方法对比实验。"
  }'
```

### 3.6 文本关系定位

`POST /api/v1/mmkg/text/relations:locate`

`data.relations[]`：`{ head, relation, tail, headStart, headEnd, tailStart, tailEnd, score }`。验收：`text.slice(headStart, headEnd) === head`，tail 同理。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/text/relations:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-text-relation" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "LiFePO₄ 正极材料在 3.4V 平台下可逆容量达 170 mAh/g，经 GraphSAGE 嵌入后可与电解液体系进行链接预测。"
  }'
```

### 3.7 视觉关系定位

`POST /api/v1/mmkg/vision/relations:locate`

`data.relations[]`：`{ id, subject, object, predicate, predicateZh, subjectBox, objectBox, score }`。框为百分比 `{ x, y, w, h }`。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/vision/relations:locate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-vision-relation" \
  -H "Content-Type: application/json" \
  -d '{
    "image": {
      "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=480&fit=crop"
    },
    "topK": 10
  }'
```

### 3.8 补全结果列表

`GET /api/v1/mmkg/completion-candidates`

初始 pending 共 6 条，ID 为 `t1`–`t6`，状态持久化在 TRSGraph。`data.items[]`：`{ id, head, relation, tail, status }`。

```bash
curl "$BASE_URL/api/v1/mmkg/completion-candidates?status=pending&page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-completion-list"
```

### 3.9 补全结果审核

`POST /api/v1/mmkg/completion-candidates/{id}:decide`

`decision` 仅允许 `approve` / `reject`。决策后该 id 不再出现在 pending。必须带 `Idempotency-Key`。会改图里的审核状态，重复执行请先换一个仍是 pending 的 id。

```bash
curl -X POST "$BASE_URL/api/v1/mmkg/completion-candidates/t1:decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-completion-decide" \
  -H "Idempotency-Key: completion-t1-approve" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approve"
  }'
```

### 3.10 图片描述（GLM-4.6V）

`POST /api/v1/general/openclip/image-caption`  
兼容路径：`POST /api/v1/mmkg/images:caption`

路径里虽带 openclip，实际只走 **GLM-4.6V**：从 OSS 下载图片后发给视觉模型，不加载 OpenCLIP 权重。`image_oss_key` / `imagePath` 是 OSS object key。

```bash
curl -X POST "$BASE_URL/api/v1/general/openclip/image-caption" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-image-caption" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "image-caption-demo",
    "parameters": {
      "prompt": "请准确描述图片中的主体、颜色、场景和重要细节。",
      "max_tokens": 256,
      "temperature": 0.2
    },
    "inputs": {
      "image_oss_key": "kg-dataset/multimodal-dataset/4376087/2/v1/coco_000318.jpg"
    },
    "options": {}
  }'
```

`data`：`{ caption, model, engine, imageSource, prompt }`，`engine` 固定为 `GLM-4.6V`。

### 3.11 关系语义提炼

`POST /api/v1/nlp/semantic:refine`

从长句或段落中用 GLM-5 提炼核心实体关系三元组。`head` / `tail` 必须能在原文落地。`tasks` 可含 `relationRefine`、`paragraphSummary`。

```bash
curl -X POST "$BASE_URL/api/v1/nlp/semantic:refine" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-semantic-refine" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "知识图谱补全旨在预测缺失的实体或关系。TransE 将实体和关系嵌入到同一向量空间，RotatE 则在复数空间中建模关系旋转。低资源长尾关系仍然是当前难点。",
    "tasks": ["paragraphSummary", "relationRefine"]
  }'
```

`data.relations[]`：`{ id, head, relation, tail, headStart, headEnd, tailStart, tailEnd, score }`。需要摘要时额外返回 `paragraphSummary`。

### 3.12 方法-材料-性能-机制抽取

`POST /api/v1/science/core-tuples:extract`

针对材料领域，用 GLM-5 抽出「使用某种方法作用于某种材料，得到某种性能，其内在机制是……」的核心知识元组。各槽位必须能在原文落地。`schema` 默认 `method/material/performance/mechanism`，`metric` 会归一成 `performance`。

```bash
curl -X POST "$BASE_URL/api/v1/science/core-tuples:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-core-tuples" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "采用化学气相沉积法在铜箔上制备石墨烯，获得了高导电性，其内在机制是连续的sp2碳网络提供高效载流子通道。",
    "schema": ["method", "material", "metric", "mechanism"],
    "domain": "materials"
  }'
```

`data.tuples[]`：`{ id, method, material, performance, mechanism, score, statement }`。每个槽位 `{ text, start, end, score }`。

### 3.13 结构化四元组抽取

`POST /api/v1/extract/quadruples:extract`

从文本或表格图片抽出「实体-关系-实体 + 属性」四元组。纯文本走 **GLM-5**；上传表格图（`image` / `imagePath` / `file` / `multipart`）时走 **GLM-4.6V**。Markdown 表格也可直接放在 `text` 里。`filePath` 是 OSS object key。

`data.quadruples[]`：`{ id, head, relation, tail, attribute, attributeValue, score, source }`，能在原文落地时带 `headStart/headEnd`、`tailStart/tailEnd`。

```bash
curl -X POST "$BASE_URL/api/v1/extract/quadruples:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-quadruples" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "TransE 用于知识图谱补全，提出年份为2013。RotatE 通过复数空间旋转建模对称与反对称关系。"
  }'
```

表格图：

```bash
curl -X POST "$BASE_URL/api/v1/extract/quadruples:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-quadruples-table" \
  -F "file=@table.png;type=image/png" \
  -F "text=下表给出方法与任务的对应关系"
```

### 3.13b 新实例抽取与置信度评估

`POST /api/v1/extract/instances:extract`

输入一组模式结构（模板 / 例句 / 质量分）和待匹配文本，用 **GLM-5** 抽出符合模式的新实体实例，并按「命中模式数量 + 模式质量分」计算置信度。

- 置信度主项为 noisy-OR：`1 - ∏(1 - quality_i)`，再与覆盖率、模型提示分加权融合（默认权重 `0.7 / 0.2 / 0.1`）。
- `patterns[]` 可传对象 `{ id, template, example, entityType, qualityScore|score }`，也兼容纯字符串模板（如 `"[INSTANCE]总部位于"`）。
- `threshold` / `confidenceThreshold` 过滤低分实例，默认 `0`。

`data.instances[]`：`{ id, text, type, start, end, score, confidence, matchedPatternIds, matchedPatternCount, patternQualityAvg, patternQualityMax, evidence, slots? }`。

```bash
curl -X POST "$BASE_URL/api/v1/extract/instances:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-new-instances" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "阿里巴巴总部位于杭州。腾讯总部位于深圳，字节跳动总部设在北京。百度是一家互联网公司。",
    "patterns": [
      {
        "id": "pat_hq",
        "template": "[INSTANCE]总部位于",
        "example": "阿里巴巴总部位于杭州",
        "entityType": "ORG",
        "qualityScore": 0.91
      },
      {
        "id": "pat_hq2",
        "template": "[INSTANCE]总部设在",
        "entityType": "ORG",
        "score": 0.82
      },
      {
        "id": "pat_company",
        "template": "[INSTANCE]是一家互联网公司",
        "entityType": "ORG",
        "qualityScore": 0.75
      }
    ],
    "entityTypes": ["ORG"],
    "threshold": 0.3
  }'
```

### 3.13c 属性名称翻译与匹配

`POST /api/v1/attributes/names:match`

用 **GLM-5** 把左侧属性名译到目标语言，再与右侧属性名做编辑距离 / Jaro-Winkler / token Jaccard 等字符串相似度匹配，融合得到对齐结果。一对一贪心选取。

`leftNames` / `rightNames` 为主字段；也兼容 `leftAttrs` / `rightAttrs`（数组或对象键）。`langs` 可代替 `sourceLang` / `targetLang`。

`data.alignments[]`：`{ leftName, rightName, translatedLeft, stringScore, translationScore, score, evidence, matched, scores }`。

```bash
curl -X POST "$BASE_URL/api/v1/attributes/names:match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-attr-names" \
  -H "Content-Type: application/json" \
  -d '{
    "leftNames": ["出生日期", "就职单位", "研究领域", "姓名"],
    "rightNames": ["birthDate", "affiliation", "researchField", "fullName", "age"],
    "sourceLang": "zh",
    "targetLang": "en",
    "threshold": 0.4
  }'
```

### 3.13d 基于实例值的属性对齐

`POST /api/v1/attributes/values:align`

比较两侧属性下的实例值重合度（Jaccard / containment），再用 **GLM-5** 判断属性是否等价。适合「属性名不同但取值高度重叠」的跨库对齐。

`leftAttributes` / `rightAttributes` 支持：
- 对象：`{ "birthYear": ["1947", "1950"], "affiliation": ["多伦多大学"] }`
- 数组：`[{ "name": "birthYear", "values": ["1947", "1950"] }]`

`data.alignments[]`：`{ leftName, rightName, overlapCount, jaccard, containment, overlapScore, glmScore, sharedValues, score, equivalent, evidence }`。

```bash
curl -X POST "$BASE_URL/api/v1/attributes/values:align" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-attr-values" \
  -H "Content-Type: application/json" \
  -d '{
    "leftAttributes": {
      "birthYear": ["1947", "1950", "1962", "1971"],
      "affiliation": ["多伦多大学", "剑桥大学", "Google"],
      "award": ["图灵奖", "ACM Fellow"]
    },
    "rightAttributes": {
      "出生年": ["1947", "1962", "1971", "1980"],
      "单位": ["多伦多大学", "MIT", "Google"],
      "荣誉": ["图灵奖", "菲尔兹奖"]
    },
    "threshold": 0.3
  }'
```

### 3.14 跨资源关系预测

`POST /api/v1/relations/cross-resource:predict`

基于文献与专利等跨资源共现，用 **GLM-5** 预测隐含关联；任一侧带表格图时改走 **GLM-4.6V**。可传 `literature` + `patent`，或 `resources[{ id, type, title, text, image }]`。

`data`：`{ resources[], sharedConcepts[], cooccurrence[], relations[] }`。`relations[]`：`{ head, headResource, relation, tail, tailResource, attribute, attributeValue, score, evidence }`。

```bash
curl -X POST "$BASE_URL/api/v1/relations/cross-resource:predict" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-cross-resource" \
  -H "Content-Type: application/json" \
  -d '{
    "literature": "结肠炎症与微生物群互作影响黏膜免疫，次级胆汁酸参与炎症调控。",
    "patent": "一种炎症检测装置，通过微生物群指标检测结肠炎症并给出干预方案。"
  }'
```

### 3.15 基于距离的打分函数

`POST /api/v1/score/distance:compute`

内置 **TransE / TransH / TransR**。输入三元组，用实体与关系向量计算平移距离，距离越小越合理，`score` 映射到 `[0, 1]`。可传 `embeddings` 指定向量；未传时用字符 n-gram 哈希向量（有 BGE 嵌入时优先用 BGE）。`model` 可取单个模型名或 `all`。

`data.results[]`：`{ head, relation, tail, score, rawScore, model, formula, plausible, scores, detail }`。

```bash
curl -X POST "$BASE_URL/api/v1/score/distance:compute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-score-distance" \
  -H "Content-Type: application/json" \
  -d '{
    "triples": [
      {"head": "清华大学", "relation": "位于", "tail": "北京"},
      {"head": "清华大学", "relation": "位于", "tail": "月球"}
    ],
    "model": "TransE",
    "pNorm": 1
  }'
```

### 3.16 基于语义相似度的打分函数

`POST /api/v1/score/semantic:compute`

内置 **DistMult / ComplEx**。用逐维乘积或复数双线性运算评估三元组语义一致性，`score` 在 `[0, 1]`。入参形状与距离打分相同。

```bash
curl -X POST "$BASE_URL/api/v1/score/semantic:compute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-score-semantic" \
  -H "Content-Type: application/json" \
  -d '{
    "triples": [
      {"head": "Geoffrey Hinton", "relation": "就职于", "tail": "多伦多大学"},
      {"head": "Geoffrey Hinton", "relation": "就职于", "tail": "月球"}
    ],
    "models": ["DistMult", "ComplEx"]
  }'
```

### 3.17 关系推理（Horn 规则 / PRA 路径 / 结果审核）

对应原型页 `relation-reasoning`。默认事实与规则来自页面种子：张明 / 李华 / 王磊、四条 Horn 子句、四条 PRA 路径。空请求体即跑默认样例。

这组接口按页面合同返回 `{ id, subject, predicate, object, confidence, source, sourceDetail, status }`，与 `/api/v1/general/relation-reasoning/*` 的 `source/relation/target` + `?x` 原子不是同一契约。

规则推理：`POST /api/v1/reason/rules:infer`

解析 `就职于(X,A) ∧ 就职于(Y,A) ∧ X≠Y → 同事(X,Y)` 这类 Horn 字符串（也接受 `body/head` 对象）。大写拉丁标识符视为变量，支持 `X≠Y` / `X!=Y`。`同事` / `同领域` 按字典序收成一条对称三元组。默认启用 r1–r3，关闭「合作者对称性」。

默认样例会推出：张明-同事-李华，张明 / 李华-工作地-北京。张明与李华研究方向不同，故「同领域」不会命中。

```bash
curl -X POST "$BASE_URL/api/v1/reason/rules:infer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-reason-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "facts": [
      {"subject": "张明", "predicate": "就职于", "object": "清华大学"},
      {"subject": "李华", "predicate": "就职于", "object": "清华大学"},
      {"subject": "清华大学", "predicate": "位于", "object": "北京"},
      {"subject": "王磊", "predicate": "合作者", "object": "张明"}
    ],
    "rules": [
      {
        "id": "r1",
        "name": "同机构同事推断",
        "clause": "就职于(X,A) ∧ 就职于(Y,A) ∧ X≠Y → 同事(X,Y)",
        "enabled": true
      },
      {
        "id": "r3",
        "name": "机构地理归属",
        "clause": "就职于(X,A) ∧ 位于(A,L) → 工作地(X,L)",
        "enabled": true
      }
    ]
  }'
```

路径推理：`POST /api/v1/reason/paths:infer`

PRA 模式 `就职于 → 就职于 → 同事` 表示 `relPath` 走完后预测最后一跳。两条相同关系按「共同邻居 join」解释（X-就职于-A←就职于-Y）；不同关系按有向路径走。默认选中页面上的 p1、p3。

```bash
curl -X POST "$BASE_URL/api/v1/reason/paths:infer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-reason-paths" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedPatternIds": ["p1", "p3", "p4"]
  }'
```

审核队列：推理默认 `enqueue: true`，写入进程内队列。

- `GET /api/v1/reason/results?status=pending`
- `POST /api/v1/reason/results:review`，`decision` 为 `approve` / `reject`，传 `id` 或 `ids[]`

```bash
curl "$BASE_URL/api/v1/reason/results?status=pending" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-reason-list"

curl -X POST "$BASE_URL/api/v1/reason/results:review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-reason-review" \
  -H "Content-Type: application/json" \
  -d '{"id": "inf_replace_me", "decision": "approve"}'
```

`data.inferences[]` / `data.items[]`：`{ id, subject, predicate, object, confidence, source, sourceDetail, status }`。`source` 为 `rule` 或 `path`。

### 3.18 事实变更监听 · 推理内核校验

对应原型页 `fact-change-listening`。把属性管理式增删改的 **原数据 / 过程 / 最终数据** 送入轻量 Rete 增量内核，按页面五条规则判断本次修改是否有问题；默认再让 GLM-5 补一层语义质检。与 `/api/v1/general/forward-rule-engine/run` 的 `fact_events` 前向链不是同一契约。

`POST /api/v1/reason/fact-changes:validate`

内置规则：`R001` 人物实体质量、`R010` 必填非空、`R012` 类型与取值范围、`R020` 关系端点存在、`R021` 互斥关系冲突。空请求体使用页面种子：把李明的 H 指数改成 `999`，应检出 R012。`useLlm` 默认 `true`，失败时仍返回内核结果。

`data.issues[]`：`{ id, severity, ruleId, ruleName, message, relatedOpId, source, confidence }`。`source` 为 `kernel` 或 `llm`。另有 `passed`（无 error）、`clean`（无任何问题）、`reteStats`。

```bash
curl -X POST "$BASE_URL/api/v1/reason/fact-changes:validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fact-change" \
  -H "Content-Type: application/json" \
  -d '{
    "ruleIds": ["R001", "R010", "R012"],
    "useLlm": true,
    "latestOnly": true,
    "entities": [
      {
        "id": "E001",
        "name": "李明",
        "type": "人物",
        "description": "知名人工智能研究员，专注于自然语言处理领域。",
        "properties": [
          {"key": "affiliation", "label": "所属机构", "value": "清华大学", "type": "string"},
          {"key": "h_index", "label": "H指数", "value": "999", "type": "number"}
        ]
      }
    ],
    "relations": [
      {
        "id": "R1",
        "sourceId": "E001",
        "sourceName": "李明",
        "relationType": "就职于",
        "targetId": "E002",
        "targetName": "北京人工智能研究院"
      }
    ],
    "changes": [
      {
        "id": "chg_hindex",
        "op": "update_property",
        "opLabel": "修改属性 H指数",
        "process": "实体 李明(E001) 属性 h_index: \"42\" → \"999\"",
        "before": {
          "id": "E001",
          "name": "李明",
          "type": "人物",
          "properties": [{"key": "h_index", "label": "H指数", "value": "42", "type": "number"}]
        },
        "after": {
          "id": "E001",
          "name": "李明",
          "type": "人物",
          "description": "知名人工智能研究员，专注于自然语言处理领域。",
          "properties": [
            {"key": "affiliation", "label": "所属机构", "value": "清华大学", "type": "string"},
            {"key": "h_index", "label": "H指数", "value": "999", "type": "number"}
          ]
        }
      }
    ]
  }'
```

`op`：`update_property` / `add_entity` / `delete_entity` / `add_relation` / `delete_relation`。`latestOnly` 默认只校验最近一条变更，与页面按钮一致。

---

## 4. B1 时间 / 属性 / 图谱 / 推理 / 一致性

### 4.1 时间实体识别与标准化

`POST /api/v1/temporal/entities:normalize`

`outputFormat`：`iso8601` | `date` | `datetime` | `unix` | `rfc3339`。`data.entities[]`：`{ rawSpan, normalized, type, start, end, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/temporal/entities:normalize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-temporal" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "会议定于下周三下午两点半举行，苹果公司于2024年3月15日在北京发布了新款芯片。",
    "outputFormat": "iso8601",
    "referenceTime": "2026-09-01T15:00:00+08:00"
  }'
```

### 4.2 时序关系抽取

`POST /api/v1/temporal/relations:extract`

从文本中抽取明确的时序关系，默认 `before` / `after` / `during`，也可用 `relationTypes` 限定。`head` / `tail` 必须是原文子串。`data.relations[]`：`{ head, relation, tail, cue, headStart, headEnd, tailStart, tailEnd, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/temporal/relations:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-temporal-extract" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "项目立项之后启动了数据采集，数据采集期间同步开展标注，标注完成以后才开始模型训练。",
    "lang": "zh",
    "relationTypes": ["before", "after", "during"]
  }'
```

### 4.3 时序依赖分析

`POST /api/v1/temporal/relations:analyze`

根据事件时间戳挖掘隐含的概率依赖，例如「事件 A 发生后，事件 B 有很高概率在 3 天内发生」。先统计再交给 GLM 写解释。

`windowDays` 默认 `7`，`minSupport` 默认 `2`，`minConfidence` 默认 `0.5`。每条事件至少要有 `type`（或 `name`）和 `timestamp`。

`data.patterns[]`：`{ antecedent, consequent, relation, windowDays, typicalLagDays, support, confidence, explanation, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/temporal/relations:analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-temporal-analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"eventId": "e1", "type": "投稿", "timestamp": "2024-01-02T09:00:00Z"},
      {"eventId": "e2", "type": "审稿", "timestamp": "2024-01-04T11:00:00Z"},
      {"eventId": "e3", "type": "投稿", "timestamp": "2024-02-01T09:00:00Z"},
      {"eventId": "e4", "type": "审稿", "timestamp": "2024-02-03T10:00:00Z"},
      {"eventId": "e5", "type": "录用", "timestamp": "2024-02-20T10:00:00Z"},
      {"eventId": "e6", "type": "投稿", "timestamp": "2024-03-01T09:00:00Z"},
      {"eventId": "e7", "type": "审稿", "timestamp": "2024-03-02T08:00:00Z"},
      {"eventId": "e8", "type": "录用", "timestamp": "2024-03-25T08:00:00Z"}
    ],
    "windowDays": 7,
    "minSupport": 2,
    "minConfidence": 0.5
  }'
```

### 4.4 未来状态预测

`POST /api/v1/temporal/states:predict`

基于历史快照和时序依赖，用线性趋势外推数值属性，再用 GLM 预测未来某个时间点的属性值和关系。`predictAt` 必须晚于最后一条历史记录。`targets` 默认同时预测 `attributes` 和 `relations`。`dependencies` 可直接接上一条依赖分析的 `patterns`。

`data`：`{ entity, predictAt, horizonDays, historyCount, attributes[{ name, value, baseline, score, method }], relations[{ predicate, object, status, score }], explanation }`。

```bash
curl -X POST "$BASE_URL/api/v1/temporal/states:predict" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-future-state" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "知识图谱实验室",
    "predictAt": "2026-12-01T00:00:00Z",
    "targets": ["attributes", "relations"],
    "history": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "attributes": {"paperCount": 12, "grantAmount": 80, "status": "组建中"},
        "relations": [{"predicate": "合作", "object": "清华大学"}]
      },
      {
        "timestamp": "2024-07-01T00:00:00Z",
        "attributes": {"paperCount": 18, "grantAmount": 120, "status": "在研"},
        "relations": [
          {"predicate": "合作", "object": "清华大学"},
          {"predicate": "承担", "object": "国家重点研发计划"}
        ]
      },
      {
        "timestamp": "2025-01-01T00:00:00Z",
        "attributes": {"paperCount": 25, "grantAmount": 160, "status": "在研"},
        "relations": [
          {"predicate": "合作", "object": "清华大学"},
          {"predicate": "承担", "object": "国家重点研发计划"}
        ]
      },
      {
        "timestamp": "2025-07-01T00:00:00Z",
        "attributes": {"paperCount": 31, "grantAmount": 200, "status": "在研"},
        "relations": [{"predicate": "合作", "object": "北京大学"}]
      }
    ],
    "dependencies": [
      {
        "antecedent": "获得基金",
        "consequent": "论文增长",
        "typicalLagDays": 180,
        "confidence": 0.85
      }
    ]
  }'
```

### 4.5 单实体属性查询

`POST /api/v1/entities/attributes/query`

输入一个实体和一段文本，用 GLM-5 抽取该实体在文本中被描述的属性，再用规则补齐常见句式（出生于、就职于、曾获、创立了等）。只保留能在原文落地的值。

`data`：`{ modelName, modelVersion, entity, text, attributeCount, attributes }`。属性键常见为 `affiliation`、`birthYear`、`researchField`、`award`、`founded`、`position`；每项 `{ value, span, start, end, score }`，偏移为 UTF-16。可选 `attributeKeys` 限定要抽的键。

```bash
curl -X POST "$BASE_URL/api/v1/entities/attributes/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-attr-query" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "Geoffrey Hinton",
    "text": "Geoffrey Hinton 就职于多伦多大学，出生于1947年，长期从事深度学习研究，曾获图灵奖。",
    "lang": "auto"
  }'
```

### 4.6 批量文档属性抽取

`POST /api/v1/entities/attributes/extract-batch`

输入一批文档，用 GLM-5 抽出每篇里的实体及其被提及的属性，规则补齐常见句式。`maxEntities` 限制每篇文档的实体数。

`data.documents[]`：`{ docId, text, entityCount, entities[{ name, type, start, end, attributeCount, attributes }] }`，按文档分组。属性项同 4.5。

```bash
curl -X POST "$BASE_URL/api/v1/entities/attributes/extract-batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-attr-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "docId": "doc-001",
        "text": "Geoffrey Hinton 就职于多伦多大学，出生于1947年，长期从事深度学习研究。"
      },
      {
        "docId": "doc-002",
        "text": "Yoshua Bengio 创立了 MILA。"
      }
    ],
    "maxEntities": 50
  }'
```

### 4.7 图谱查询

`POST /api/v1/graph/query`

只读查询，直连 `gkx_kg_rag`。禁止 `CREATE` / `DROP` / `DELETE` / `INSERT` / `UPDATE` / `UPSERT` / `ALTER` / `REBUILD`。`data`：`{ columns[], rows[], rowCount }`。

```bash
curl -X POST "$BASE_URL/api/v1/graph/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-graph-query" \
  -H "Content-Type: application/json" \
  -d '{
    "space": "gkx_kg_rag",
    "language": "cypher",
    "query": "MATCH (v) RETURN id(v) AS id LIMIT 5",
    "limit": 5
  }'
```

### 4.8 路径检索

`POST /api/v1/graph/path`

`source` / `target` 使用图中真实 VID。`data.paths[]`：`{ nodes[], edges[], length, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/graph/path" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-graph-path" \
  -H "Content-Type: application/json" \
  -d '{
    "space": "gkx_kg_rag",
    "source": "scholar:zhibin_wang",
    "target": "patent:cn-102752445-a",
    "maxHops": 3,
    "relationFilter": []
  }'
```

### 4.9 语义匹配

`POST /api/v1/semantic/match`

`candidates` 为空时从 TRSGraph 取样，再用 BGE 或字面相似度打分。`data.matches[]`：`{ id, name, score, reason }`。

```bash
curl -X POST "$BASE_URL/api/v1/semantic/match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-semantic-match" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "mixed",
    "query": "图神经网络",
    "candidates": [],
    "topK": 5
  }'
```

### 4.10 API 集成推理

`POST /api/v1/rules/inference:run`

页面可选规则：`coauthor_relation_infer`、`R005`、`R001`、`R006`。合著者规则会推出张三↔李四等。`data.inferences[]`：`{ ruleId, ruleName, action, subject, predicate, object, score, evidence }`。

```bash
curl -X POST "$BASE_URL/api/v1/rules/inference:run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-rule-infer" \
  -H "Content-Type: application/json" \
  -d '{
    "facts": [
      {
        "subject": "作者:张三",
        "predicate": "WRITTEN_BY",
        "object": "论文:深度学习新进展",
        "properties": { "order": 1 }
      },
      {
        "subject": "作者:李四",
        "predicate": "WRITTEN_BY",
        "object": "论文:深度学习新进展",
        "properties": { "order": 2 }
      }
    ],
    "ruleIds": ["coauthor_relation_infer"]
  }'
```

### 4.10b 规则引擎执行与实例生成预览

`POST /api/v1/rules/instances:preview`

输入一段文本，引用一条或几条规则，用 `kg_core.rules.RuleEngine` 做匹配，返回候选实例预览，**不写图、不进审核队列**。`ruleIds` / `ruleKeys` 优先从 kg_core 规则中心（MySQL `kg_rule`）按 `rule_key` 加载；也接受请求体 `rules[]` 内联规则（kg_core `when/then` 或通用 `if/conditions` 模板）。未引用规则时使用内置文本抽取规则：`demo.text.material_is_a`、`demo.text.affiliation`、`demo.text.authored`。

现网规则中心里可直接引用例如 `rel_map.person.institution.affiliated_with.employee`（任职关系 → `AFFILIATED_WITH`）、`demo.rel_map.author` / `rel_map.person.paper.authored`（作者关系 → `AUTHORED`）。引擎会把「就职于 / 任职于 / 发表了」等表面词投影成规则所需的 `raw_relation` 事实后再匹配。

`data`：`{ preview, written, usedRules[], missingRuleIds[], instances[{ id, name, type, subject, predicate, object, score, start, end, evidence, ruleId }], instanceCount }`。

```bash
curl -X POST "$BASE_URL/api/v1/rules/instances:preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-rule-preview" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "BaTiO3 是一种铁电材料。Geoffrey Hinton 就职于多伦多大学，并发表了深度学习论文。",
    "ruleIds": [
      "demo.text.material_is_a",
      "rel_map.person.institution.affiliated_with.employee",
      "demo.rel_map.author"
    ],
    "graphSpace": "gkx_kg_rag"
  }'
```

### 4.11 知识一致性校验

`POST /api/v1/kg/consistency:validate`

`data.violations[]`：`{ id, severity, rule, message, entityId, entityName, locateHint }`。无违规返回空数组。

```bash
curl -X POST "$BASE_URL/api/v1/kg/consistency:validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-consistency" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpaceId": "gkx_kg_rag",
    "graphSpaceName": "科研知识图谱"
  }'
```

---

## 5. B3 匹配 / 链接 / 跨语言 / 消歧 / 写入 / LLM

### 5.1 文本实例匹配

`POST /api/v1/matching/text:compare`

融合字符串相似度与 BGE 向量余弦，判断两个实例是否同一实体。`methods` 可选 `string` / `vector`。

`data`：`{ stringScore, vectorScore, fusedScore, vectorSource }`。可换测试对：清华/Tsinghua、北大/Peking、腾讯/Alibaba。

```bash
curl -X POST "$BASE_URL/api/v1/matching/text:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-text-match" \
  -H "Content-Type: application/json" \
  -d '{
    "left": "清华大学",
    "right": "Tsinghua University",
    "methods": ["string", "vector"]
  }'
```

### 5.1a 字符串相似度匹配

`POST /api/v1/matching/string:compare`

用编辑距离、Jaro-Winkler、token Jaccard、序列比判断两个实例是否指向同一实体。支持 `aliases[]`、`query` + `candidates[]`、`pairs[]`。默认阈值 `0.8`。

`data`：`{ score, matched, sameEntity, scores, bestAlgorithm }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/string:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-string-match" \
  -H "Content-Type: application/json" \
  -d '{
    "left": {"name": "清华大学", "aliases": ["清华", "Tsinghua"]},
    "right": "清华大学院",
    "threshold": 0.8
  }'
```

### 5.1b 文本向量相似度匹配

`POST /api/v1/matching/vector:compare`

用 BGE-M3 余弦相似度判断语义是否指向同一实体。跨语言对（如中英术语）走远程 `/api/v1/bge/similarity`。默认阈值 `0.5`。

`data`：`{ score, matched, sameEntity, scoreType, vectorSource }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/vector:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-vector-match" \
  -H "Content-Type: application/json" \
  -d '{
    "text_a": "钛酸钡陶瓷介电性能",
    "text_b": "BaTiO3 ceramics dielectric properties"
  }'
```

### 5.1c 相似度计算引擎

`POST /api/v1/matching/similarity:compute`

一个接口内用 `algorithm` 选择算法：`editDistance`（Levenshtein 归一化相似度）、`jaroWinkler`、`cosine`（优先调用远程 BGE-M3 `/api/v1/bge/similarity`，其次本地 `/embed`，再失败时退回字符袋余弦）。`algorithm` / `algorithms` 可传单个、数组或 `all`。

入参任选其一：`left` + `right`（可用 `text_a` / `text_b`）、`query` + `candidates[]`，或 `pairs[]`。可选自带 `leftEmbedding` / `rightEmbedding`。余弦默认走 `BGE_SIMILARITY_URL`（`http://60.165.238.47:8000/api/v1/bge/similarity`）。

`data`：`{ algorithm, score, scores, detail }`；多对时为 `pairs[]` 或 `matches[]`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/similarity:compute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-similarity" \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "all",
    "left": "清华大学",
    "right": "清华大学院"
  }'
```

### 5.1d 实体精准匹配

`POST /api/v1/matching/entities:precise-match`

输入文本、文献、专利或数据库字段，先抽出实体，再综合 **文献引证**（`CITES` / `CITED_IN` / `CITES_PATENT`）、**专利同族**（`family_id`）和 **数据库字段**（DOI、姓名、公开号等）做高精度匹配。

`data.entities[]`：`{ mention, type, start, end, entityId, name, score, clues[], evidence, candidates[] }`。`clues[].type` 为 `citation` / `patentFamily` / `databaseField`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/entities:precise-match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-precise-match" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "A. Klegeris 研究了结肠炎症，相关专利公开号 AU-1190692-A。",
    "literature": {"doi": "10.1152/ajpgi.00511.2009", "title": "结肠炎症"},
    "patent": {"publicationNumber": "AU-1190692-A", "familyId": "24567599"},
    "fields": {"name": "A. Klegeris"}
  }'
```

### 5.2 结构实例匹配

`POST /api/v1/matching/structure:compare`

融合邻居重合与关系路径模式。邻居和路径从 TRSGraph 读取。

`data`：`{ neighborOverlap, commonNeighborCount, pathSimilarity, patternOverlap, fusedScore, commonNeighbors[], sharedPatterns[] }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/structure:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-struct-match" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpace": "gkx_kg_rag",
    "leftEntityId": "scholar:zhibin_wang",
    "rightEntityId": "patent:cn-102752445-a"
  }'
```

### 5.2a 邻居节点相似性分析

`POST /api/v1/matching/neighbors:compare`

比较两个实例的邻居重合度、关系类型重合和邻居名称相似度。也可直接传 `leftNeighbors` / `rightNeighbors`。

`data`：`{ neighborOverlap, relationOverlap, neighborNameSimilarity, commonNeighbors[], score, matched }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/neighbors:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-neighbor-match" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpace": "gkx_kg_rag",
    "leftEntityId": "scholar:zhibin_wang",
    "rightEntityId": "patent:cn-102752445-a"
  }'
```

### 5.2b 关系路径模式匹配

`POST /api/v1/matching/paths:compare`

找连接两个实例的路径，并比较各自出发的关系类型模式。路径中含 `SAME_AS` / 等同时直接判为同一实体。

`data`：`{ paths[], leftPatterns[], rightPatterns[], sharedPatterns[], patternOverlap, score, matched }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/paths:compare" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-path-match" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpace": "gkx_kg_rag",
    "leftEntityId": "scholar:zhibin_wang",
    "rightEntityId": "patent:cn-102752445-a",
    "maxHops": 3
  }'
```

### 5.3 实例特征工程

`POST /api/v1/matching/features:extract`

从实例对自动抽取文本、结构、数值特征。文本：名称 / 编辑距离 / Jaro-Winkler / token Jaccard / BGE 语义；结构：邻居重合、路径相似度、度数比（传 `leftEntityId` / `rightEntityId` 时读图）；数值：公共数值属性相对差。

`data`：`{ features, vector, groups{text,structure,numeric}, explanations[] }`。

```bash
curl -X POST "$BASE_URL/api/v1/matching/features:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-features" \
  -H "Content-Type: application/json" \
  -d '{
    "left": "清华大学",
    "right": "Tsinghua University",
    "leftAttrs": {"type": "大学", "year": 1911},
    "rightAttrs": {"type": "university", "year": 1911},
    "leftEntityId": "scholar:zhibin_wang",
    "rightEntityId": "patent:cn-102752445-a"
  }'
```

### 5.4 候选实体生成

`POST /api/v1/linking/candidates:generate`

候选来自图谱实体 + 语义打分。`data.candidates[]`：`{ entityId, name, score, evidence }`。

```bash
curl -X POST "$BASE_URL/api/v1/linking/candidates:generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-link-candidates" \
  -H "Content-Type: application/json" \
  -d '{
    "mention": "图神经网络",
    "context": "用于节点分类",
    "topK": 5
  }'
```

### 5.5 实体链接判断

`POST /api/v1/linking/judgment:score`

`data`：`{ candidates[{ ..., linkScore }], bestId }`。

```bash
curl -X POST "$BASE_URL/api/v1/linking/judgment:score" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-link-judge" \
  -H "Content-Type: application/json" \
  -d '{
    "mention": "苹果",
    "context": "发布新款芯片",
    "candidates": [
      { "entityId": "Apple_Inc", "name": "苹果公司" },
      { "entityId": "Apple_fruit", "name": "苹果" }
    ]
  }'
```

### 5.5b 上下文语义分析

`POST /api/v1/linking/context:analyze`

用提及 + 上下文理解实体指向，并对候选消歧。页面上的「无监督联合表示 / 多任务联合优化 / 联合表示链接」只作为 `availableModels` 介绍返回，**实际打分由 GLM-5 完成**；候选会按名称/ID 到 `gkx_kg_rag` 上取标签、属性和邻居作为图谱证据。

入参：`mention`、`context`，以及 `candidates[]`（对象或 `名称 | 描述 | 类型` 行）。未传候选时从图谱召回。`model` 只决定回显哪个内置模型介绍。

`data`：`{ best, candidates[{ rank, name, type, description, confidence, contextCooccurrence, mentionAlignment, evidence, graphEvidence }], clues[], selectedModel, availableModels, engine }`。

```bash
curl -X POST "$BASE_URL/api/v1/linking/context:analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-context-analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "mention": "多伦多大学",
    "context": "作者 Geoffrey Hinton 就职于多伦多大学计算机系，长期从事深度学习与表示学习研究，并与 Bengio、LeCun 共同获得图灵奖。",
    "model": "unsupervisedJointRepresentation",
    "candidates": [
      "University of Toronto | 加拿大综合研究型大学 | 机构",
      "多伦多都会大学 | 加拿大应用型大学 | 机构",
      "多伦多市 | 加拿大安大略省城市 | 地点"
    ]
  }'
```

### 5.6 跨语言实例匹配

`POST /api/v1/xling/instances:match`

`data`：`{ score, matched, evidence[] }`。

```bash
curl -X POST "$BASE_URL/api/v1/xling/instances:match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-xling-instance" \
  -H "Content-Type: application/json" \
  -d '{
    "zh": "清华大学",
    "en": "Tsinghua University"
  }'
```

### 5.7 查询驱动融合

`POST /api/v1/xling/query:fuse`

`data`：`{ translatedQuery, candidates[] }`，候选形状同语义匹配。

```bash
curl -X POST "$BASE_URL/api/v1/xling/query:fuse" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-xling-fuse" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "图神经网络",
    "sourceLang": "zh",
    "targetKb": "gkx_kg_rag",
    "topK": 5
  }'
```

### 5.8 跨语言属性对齐

`POST /api/v1/xling/attributes:align`

`data.alignments[]`：`{ leftKey, rightKey, leftValue, rightValue, score, evidence }`。

```bash
curl -X POST "$BASE_URL/api/v1/xling/attributes:align" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-xling-attr" \
  -H "Content-Type: application/json" \
  -d '{
    "leftAttrs": { "名称": "清华大学" },
    "rightAttrs": { "name": "Tsinghua University" },
    "langs": ["zh", "en"]
  }'
```

### 5.9 跨语言知识库对齐

`POST /api/v1/xling/kb:align`

当前同步返回 `status=completed`。`data`：`{ taskId, status, sourceKb, targetKb, strategy, sampledEntities, alignments[] }`。

```bash
curl -X POST "$BASE_URL/api/v1/xling/kb:align" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-xling-kb" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceKb": "zh-demo",
    "targetKb": "gkx_kg_rag",
    "strategy": "mixed",
    "sampleSize": 10
  }'
```

### 5.10 实体匹配消歧列表

`GET /api/v1/matching/disambiguation/candidates`

默认种子 `d1`（「苹果」）。`data.items[]`：`{ id, mention, context, candidates[], status }`。

```bash
curl "$BASE_URL/api/v1/matching/disambiguation/candidates?status=pending&page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-disamb-list"
```

### 5.11 实体匹配消歧审核

`POST /api/v1/matching/disambiguation/candidates/{id}:decide`

必须带 `Idempotency-Key`。会改审核状态，重复执行请先确认该 id 仍是 pending。

```bash
curl -X POST "$BASE_URL/api/v1/matching/disambiguation/candidates/d1:decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-disamb-decide" \
  -H "Idempotency-Key: disamb-d1-approve" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approve",
    "chosenEntityId": "Apple_Inc"
  }'
```

### 5.12 已验证知识写入

`POST /api/v1/kg/verified-triples:write`

每行格式：`<subject> <predicate> <object>`。必须带 `Idempotency-Key`。下面这条设了 `validateOnly: true`，只校验不落库；要真实写入把该字段改成 `false`。

```bash
curl -X POST "$BASE_URL/api/v1/kg/verified-triples:write" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-verified-write" \
  -H "Idempotency-Key: demo-write-001" \
  -H "Content-Type: application/json" \
  -d '{
    "triplesText": "<Geoffrey Hinton> <就职于> <多伦多大学>",
    "graphSpace": "gkx_kg_rag",
    "validateOnly": true
  }'
```

### 5.13 多模型连通测试

`POST /api/v1/llm/chat/completions`

仅允许已配置别名：`gpt-4o` / `glm-5` → GLM-5，`glm-4.6v` → 视觉模型。可用 `DEMO_LLM_ALIASES` 扩展。`data`：`{ content, latencyMs, model, modelName, modelVersion }`。

```bash
curl -X POST "$BASE_URL/api/v1/llm/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-llm-ping" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Only reply pong" }
    ],
    "maxTokens": 16
  }'
```

---

## 6. B4 共现 / 上下位 / 智能工具

### 6.1 概念对共现索引

`POST /api/v1/concept/cooccurrence:index`

`data.pairs[]`：`{ conceptA, conceptB, count, score }`。

```bash
curl -X POST "$BASE_URL/api/v1/concept/cooccurrence:index" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-cooccur" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "知识图谱和图神经网络用于链接预测，知识图谱补全也依赖链接预测。",
    "window": 5,
    "topK": 20
  }'
```

### 6.2 上下位关系生成

`POST /api/v1/taxonomy/hypernyms:generate`

`threshold` 是置信度阈值，范围 `[0, 1]`，默认 `0`（不过滤）。只返回 `score >= threshold` 的边。也兼容字段名 `confidenceThreshold`。

`data`：`{ threshold, edges[{ hyponym, hypernym, score }] }`。

```bash
curl -X POST "$BASE_URL/api/v1/taxonomy/hypernyms:generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-hypernym" \
  -H "Content-Type: application/json" \
  -d '{
    "terms": ["卷积神经网络", "LSTM"],
    "corpusHint": "机器学习",
    "threshold": 0.6
  }'
```

### 6.3 图谱类比查询

`POST /api/v1/tools/analogy:search`

用 **GLM-5** 回答「A对于B，相当于C对于？」；候选实体与解释路径来自 TRSGraph。

请求任选其一：

- `a` / `b` / `c`（或 `source` / `target` / `probe`）
- `query`：自然语言，如 `TransE对于知识图谱补全，相当于RotatE对于？`
- 兼容旧字段：`source` + `relation` + `target`（A 通过某关系关联 B，补全类比）

`data`：`{ analogQuery, a, b, c, relation, answerId, answer, score, explanation, alternatives[], graphEvidence, paths[] }`。

```bash
curl -X POST "$BASE_URL/api/v1/tools/analogy:search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-analogy" \
  -H "Content-Type: application/json" \
  -d '{
    "a": "TransE",
    "b": "知识图谱补全",
    "c": "RotatE"
  }'
```

### 6.4 科研问题生成

`POST /api/v1/tools/research-questions:generate`

先从 TRSGraph 收集与主题相关的已知节点、稀疏节点和文献，再由 **GLM-5** 针对空白或薄弱环节生成可检验问题。

`data.questions[]`：`{ question, gapType, rationale, novelty, feasibility, relatedEntities[] }`。`gapType` 为 `missing_relation` / `sparse_evidence` / `weak_mechanism` / `open_evaluation`。`data.graphEvidence` 含 `knownEntities`、`sparseEntities`、`papers`。

```bash
curl -X POST "$BASE_URL/api/v1/tools/research-questions:generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-research-q" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "知识图谱补全",
    "literature": "少样本关系是当前难点",
    "count": 3
  }'
```

---

## 7. 跨域知识融合

将专利技术方案拆成可复用功能模块，再按关键词到 **已选定的 TRS 图** 里已有 `Paper` 节点上匹配理论模型或实验数据。拆解走 **GLM-4.6V**；文献检索图空间别名 `gkx_rag` 实际 `USE gkx_kg_rag`。支持 JSON 里的 `markdown` / `file.base64` / `filePath` / `url`，或 `multipart/form-data` 上传 PDF、Markdown。`filePath` 是 OSS object key，不是本地磁盘路径。

`graphSpace` / `graph_id` / `graph_space` 可写 `gkx_rag` / `gkx-rag` / `gkx_kg_rag`。响应同时返回调用方传入的 `requestedSpace`/`graphId` 与实际查询用的 `graphSpace`。原型页「专利-文献自动匹配」**必须先选图**。

### 7.1 技术方案模块化拆解

`POST /api/v1/fusion/patent:decompose`

`data`：`{ fileName, format, title, problem, modules[{ id, name, function, keywords, inputs, outputs, reusable }], keywords, theoryAnchors, experimentNeeds }`。`matchLiterature: true` 时额外返回文献匹配结果。

```bash
curl -X POST "$BASE_URL/api/v1/fusion/patent:decompose" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fusion-decompose" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 一种炎症调控方法及装置\n\n本发明检测结肠炎症指标，并结合微生物群干预降低炎症反应。模块包括炎症检测、指标量化与实验验证。",
    "fileName": "inflammation-patent.md",
    "matchLiterature": false
  }'
```

上传 PDF 或 Markdown 文件：

```bash
curl -X POST "$BASE_URL/api/v1/fusion/patent:decompose" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fusion-decompose-file" \
  -F "file=@/data/jichenxu/algorithm_gateway/samples/api-demo/patent-inflammation.md" \
  -F "graphSpace=gkx_rag"
```

### 7.2 列出可选 TRS 图

`GET /api/v1/cross-domain/graphs`

从 TRS `SHOW SPACES` 列出当前可查询的图。`gkx_kg_rag` 等推荐空间排在前面，并带上别名 `gkx_rag`。

`data`：`{ defaultGraphId, defaultGraphSpace, graphs[{ graphId, graphSpace, recommended, alias }] }`。

```bash
curl -sS "$BASE_URL/api/v1/cross-domain/graphs" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.3 专利-文献自动匹配（原型页，必须选图）

`POST /api/v1/cross-domain/patent-literature:match`

对应审计目录「专利知识建模 / 跨域知识融合 / 专利-文献自动匹配」。**必须**传 `graphSpace` 或 `graph_id`，在该图已有文献上匹配，不存在的图返回 `404`。

入参：

| 字段 | 必填 | 说明 |
|---|---|---|
| `graphSpace` / `graph_id` / `graph_space` | 是 | TRS 图名或别名，如 `gkx_rag`、`gkx_kg_rag` |
| `modules` | 与 keywords 至少有一 | 模块化拆解结果，数组或 JSON 字符串 |
| `keywords` | 与 modules 至少有一 | 数组或逗号分隔字符串 |
| `topK` | 否 | 1–50，默认 10 |
| `patentText` / `text` | 否 | 从专利原文再抽一批检索词 |

`data`：`{ graphId, requestedSpace, graphSpace, keywords, matchCount, matches[{ id, paperId, title, authors, year, matchType, matchedModule, matchedKeywords, score, evidence, conversionHint }], bottleneck, bottlenecks, transferPath }`。

`matchType` 为 `理论模型` / `实验数据` / `方法框架`。`evidence` 为字符串。`bottleneck` 为页面级转化瓶颈说明。

```bash
curl -X POST "$BASE_URL/api/v1/cross-domain/patent-literature:match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-patent-lit-match" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpace": "gkx_rag",
    "topK": 10,
    "keywords": "炎症, inflammation",
    "modules": [
      {
        "id": "M1",
        "name": "炎症检测模块",
        "function": "检测结肠炎症指标",
        "keywords": ["炎症", "inflammation"]
      }
    ]
  }'
```

### 7.4 关键路径抽取

`POST /api/v1/cross-domain/key-paths:extract`

从指定 TRS 图随机抽取最多 3 条同时包含文献（`Paper`）和专利（`Patent`）的转化路径，补上实验侧邻居（`Outcome` / `Technique` / `Material` 等），再把节点路径交给大模型归纳「文献理论-专利技术-实验数据」。返回的 `nodes` / `edges` 可直接画在图上；`graph` 是 3 条路径的并集，节点带 `pathIds` 便于高亮。

图里若没有文献-专利结构边（例如 `gkx_kg_rag` 两类资源未连通），会用 `SEMANTIC_TRANSFER` 虚边按标题/术语重叠拼出可展示路径，`connected=false`。

**必须**传 `graphSpace` / `graph_id` / `graph_space`，图不存在返回 `404`。

入参：

| 字段 | 必填 | 说明 |
|---|---|---|
| `graphSpace` / `graph_id` / `graph_space` | 是 | TRS 图名或别名，如 `gkx_rag`、`gkx_kg_rag` |
| `pathCount` | 否 | 1–8，默认 3 |
| `seed` | 否 | 随机种子，便于复现抽样 |

`data`：`{ graphId, requestedSpace, graphSpace, pathCount, overview, paths[{ pathId, hops, connected, bridge, nodeIds, nodes[{ id, label, name, role, roleLabel, properties }], edges[{ id, source, target, relation, virtual }], roles, summary[{ literatureTheory, patentTechnology, experimentData, narrative }] }], graph[{ nodes, edges }] }`。

`role` 为 `literatureTheory` / `patentTechnology` / `experimentData` / `context`。

```bash
curl -X POST "$BASE_URL/api/v1/cross-domain/key-paths:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-key-paths" \
  -H "Content-Type: application/json" \
  -d '{"graphSpace":"gkx_rag","pathCount":3}'
```

### 7.5 专利-文献自动匹配（兼容接口）

`POST /api/v1/fusion/literature:match`

与 7.3 同一套检索，但 `graphSpace` 可省略（默认 `gkx_rag` → `gkx_kg_rag`）。需要 `modules` 和/或 `keywords`。在 `Paper` 上按 `HAS_TERM`、标题、摘要、`USES_TECHNIQUE` 检索，再用 BGE 对标题重排。

`data`：`{ requestedSpace, graphSpace, keywords, matchCount, matches[{ paperId, title, authors, year, doi, abstract, score, matchedKeywords, moduleIds, evidence, kind }], transferPath, bottlenecks }`。

```bash
curl -X POST "$BASE_URL/api/v1/fusion/literature:match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fusion-match" \
  -H "Content-Type: application/json" \
  -d '{
    "graphSpace": "gkx_rag",
    "topK": 8,
    "keywords": ["炎症", "inflammation"],
    "modules": [
      {
        "id": "M1",
        "name": "炎症检测模块",
        "function": "检测结肠炎症指标",
        "keywords": ["炎症", "inflammation"]
      }
    ]
  }'
```

### 7.6 主题科技：科研-市场转化路径 / 技术-产业关联

对应审计目录「主题科技知识图谱分析应用」。图用筛选节点类型体现：`literature` / `technology` / `patent` / `product` / `industry` / `company`，边类型对齐原型（引用、专利化、产品化、催生、研发、转化、应用）。**必须**传 `graphSpace`。

`POST /api/v1/theme-tech/research-market-paths:analyze`

本模式下的关键路径分析：文献 → 技术 → 专利 → 企业/初创 → 产品 → 产业。`topic` 可选，用来收窄主题。

```bash
curl -X POST "$BASE_URL/api/v1/theme-tech/research-market-paths:analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"graphSpace":"gkx_rag","topic":"炎症","pathCount":3}'
```

`data`：`{ topic, mode, nodeTypes, overview, paths[{ pathId, name, description, narrative, stages, nodeIds, edgeIds, nodes, edges }], graph }`。

`POST /api/v1/theme-tech/tech-industry:analyze`

分析特定技术在不同产业中的应用情况与成熟度（`实验室` / `中试` / `产业化` / `规模应用`）。

```bash
curl -X POST "$BASE_URL/api/v1/theme-tech/tech-industry:analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"graphSpace":"gkx_rag","technology":"粪便菌群移植","topK":6}'
```

`data`：`{ items[{ technology, industry, application, maturity, maturityScore, paperCount, patentCount, companies }], graph }`。

### 7.7 拆解并匹配（一条链路）

`POST /api/v1/fusion/cross-domain:run`

上传专利 PDF 或 Markdown，一条链路完成拆解 + 文献匹配。入参与 `patent:decompose` 相同：`multipart/form-data` 的 `file`、JSON 的 `file.base64` / `filePath`（OSS object key）/ `url`。`graphSpace`、`topK` 可随表单字段一起传。

```bash
curl -X POST "$BASE_URL/api/v1/fusion/cross-domain:run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fusion-run" \
  -F "file=@/data/jichenxu/algorithm_gateway/samples/api-demo/patent-inflammation.md" \
  -F "graphSpace=gkx_rag" \
  -F "topK=8"
```

OSS 对象：

```bash
curl -X POST "$BASE_URL/api/v1/fusion/cross-domain:run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-fusion-run-oss" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "demo/inflammation-patent.md",
    "fileName": "inflammation-patent.md",
    "graphSpace": "gkx_rag",
    "topK": 8
  }'
```

---

## 8. 局部学习事件标注

用少量已标注样本做 GLM-5 上下文学习，再去标真实事件文本。`engines` 可组合 `icl`（少样本）、`schema`（事件类型约束）。

### 8.1 事件识别

`POST /api/v1/events:recognize`

`examples` 是上下文学习样本，`text` 是待标注的真实事件。`data.events[]`：`{ id, trigger, type, start, end, arguments[{ role, text, start, end, score }], score }`，偏移为 UTF-16。

```bash
curl -X POST "$BASE_URL/api/v1/events:recognize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-event-recognize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "张三于2024年3月加入清华大学知识图谱实验室，随后在 ACL 2024 发表了关于 GraphSAGE 的论文。",
    "eventTypes": ["Personnel.StartPosition", "Publish"],
    "engines": ["icl", "schema"],
    "examples": [
      {
        "text": "李四昨日从北京大学离职，并入职阿里巴巴。",
        "events": [
          {
            "trigger": "离职",
            "type": "Personnel.EndPosition",
            "arguments": [
              {"role": "Person", "text": "李四"},
              {"role": "Organization", "text": "北京大学"}
            ]
          },
          {
            "trigger": "入职",
            "type": "Personnel.StartPosition",
            "arguments": [
              {"role": "Person", "text": "李四"},
              {"role": "Organization", "text": "阿里巴巴"}
            ]
          }
        ]
      }
    ]
  }'
```

### 8.2 局部学习标注

`POST /api/v1/annotation/local-learning:bootstrap`

`seeds` 是当前文档上的少量种子标注，`examples` 可选作额外上下文。返回扩写后的 `spans` 和 `annotatedText`。

```bash
curl -X POST "$BASE_URL/api/v1/annotation/local-learning:bootstrap" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-local-learn" \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "d1",
    "text": "张三加入清华大学，并与北京大学合作发表论文。",
    "labels": ["PER", "ORG", "EVENT"],
    "seeds": [{"text": "张三", "label": "PER"}],
    "examples": [
      {
        "text": "李四从北京大学离职。",
        "spans": [
          {"text": "李四", "label": "PER"},
          {"text": "北京大学", "label": "ORG"},
          {"text": "离职", "label": "EVENT"}
        ]
      }
    ]
  }'
```

### 8.3 标注句子优选

`POST /api/v1/annotation/sentences:select`

从候选句池里挑出最值得继续标注的句子。

```bash
curl -X POST "$BASE_URL/api/v1/annotation/sentences:select" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-sentence-select" \
  -H "Content-Type: application/json" \
  -d '{
    "topK": 2,
    "query": "人事变动与论文发表",
    "examples": [
      {
        "text": "李四从北京大学离职。",
        "events": [{"trigger": "离职", "type": "Personnel.EndPosition"}]
      }
    ],
    "sentences": [
      "张三加入清华大学知识图谱实验室。",
      "实验室订了新的打印机。",
      "李华在 ACL 2024 发表了 GraphSAGE 论文。"
    ]
  }'
```

### 8.4 引擎接口与管理

把事件识别和标注优化封装成标准引擎 API，方便工作流直接调用。底层仍是 GLM-5。

事件识别：`POST /api/v1/engine/events:recognize`，入参只要 `text`，返回结构化 `events[]`。

```bash
curl -X POST "$BASE_URL/api/v1/engine/events:recognize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-engine-events" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "张三于2024年3月加入清华大学知识图谱实验室，随后在 ACL 2024 发表了关于 GraphSAGE 的论文。",
    "eventTypes": ["Personnel.StartPosition", "Publish"]
  }'
```

标注优化：`POST /api/v1/engine/annotation:optimize`，接收未标注长文本或文档，先切句再由句子选择器给出优先标注列表。

```bash
curl -X POST "$BASE_URL/api/v1/engine/annotation:optimize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-Id: req-engine-optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "unlabeled": "张三加入清华大学知识图谱实验室。实验室订了新的打印机。李华在 ACL 2024 发表了 GraphSAGE 论文。",
    "query": "人事变动与论文发表",
    "topK": 2
  }'
```

`data.sentences[]`：`{ id, text, score, reason, selected }`，并带 `candidateCount`、`selectedCount`。

### 8.5 事件识别管理（标注项目 / GLM 上下文训练 / 审核入库）

审计目录「事件标注项目管理」「模型训练与迭代」「审核与入库工作流」。标注的是用户自定义**类**（如 `投融资`、`产品发布`）。训练不跑传统参数更新，而是把标注自动划分训练/测试，用 **GLM 上下文学习（ICL）** 当模型，再在测试集上算 P/R/F1 并出版本。至少 2 条已标注才能训练；缺 `name`、不足 2 条、或 `decision` 非法返回 400。入库时 `gkx_rag` 会映射到 TRS 空间 `gkx_kg_rag`。

#### 标注项目

`POST /api/v1/events/projects` 创建；`GET /api/v1/events/projects` 列表；`GET /api/v1/events/projects/{id}` 详情。  
`POST /api/v1/events/projects/{id}:assign` 分配标注员。  
`POST /api/v1/events/projects/{id}/events:annotate` 写入自定义类。  
`POST /api/v1/events/projects/{id}/dataset:export` 导出已标注数据集。

```bash
curl -X POST "$BASE_URL/api/v1/events/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "产品发布事件标注",
    "assignees": ["张三", "王研"],
    "eventsJsonl": "{\"event_id\":\"evt-001\",\"doc_id\":\"doc-001\",\"text\":\"2024年3月，该公司完成了A轮融资，融资金额5000万元。\"}\n{\"event_id\":\"evt-002\",\"doc_id\":\"doc-001\",\"text\":\"同年6月正式发布了首款产品。\"}"
  }'

curl -X POST "$BASE_URL/api/v1/events/projects/P001/events:annotate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "annotations": [
      {"eventId":"evt-001","eventType":"投融资","trigger":"融资","arguments":{"金额":"5000万元"}},
      {"eventId":"evt-002","eventType":"产品发布","trigger":"发布","arguments":{"产品":"首款产品"}}
    ]
  }'
```

#### 模型训练与迭代（原型页 `POST /api/v1/events/models:train`）

`GET /api/v1/events/models` 列出版本。训练至少 2 条已标注，默认 `testRatio=0.3`。

```bash
curl -X POST "$BASE_URL/api/v1/events/models:train" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"P001","seed":42}'
```

`data`：`{ modelId, version, engine: "glm-icl", classes, trainCount, testCount, metrics{ precision, recall, f1, accuracy }, predictions[] }`。

#### 审核与入库

`POST /api/v1/events/reviews:extract` 用已发布 ICL 模型（或项目已标注类）抽事件进入审核队列。  
`GET /api/v1/events/reviews?status=pending`  
`POST /api/v1/events/reviews/{id}:decide`，`decision=accept|reject`。  
`POST /api/v1/events/reviews:ingest` 将已接受事件写成三元组；可带 `graphSpace` 写入 TRS。

```bash
curl -X POST "$BASE_URL/api/v1/events/reviews:extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"P001","modelId":"evm_xxx","texts":["张三加入清华大学。"]}'

curl -X POST "$BASE_URL/api/v1/events/reviews/rev_xxx:decide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"accept"}'

curl -X POST "$BASE_URL/api/v1/events/reviews:ingest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"graphSpace":"gkx_rag"}'
```

---

## 9. B2 延期（不注册）

| pageId | 建议接口 |
|---|---|
| `literature-multidim-parse` | `POST /api/v1/literature/multidim:parse` |
| `patent-technical-parse` | `POST /api/v1/patent/technical-elements:parse` |
| `text-highlight-seed` | `POST /api/v1/annotation/seed-highlights:extract` |
| `mapping-transform-fn` | `POST /api/v1/mapping/transforms:apply` |
| `attribute-precise-extract` | `POST /api/v1/entities/attributes:precise-extract` |
| `multi-format-lit-parse` | `POST /api/v1/literature/formats:parse` |
| `multimodal-content-transcribe` | `POST /api/v1/mmkg/content:transcribe` |

清单以 `GET /api/v1/demo/metadata` 的 `deferredB2` 为准。

---

## 10. 启动与烟测

```bash
cd /data/jichenxu/algorithm_gateway
bash scripts/start_all.sh
```

演示服务由 `scripts/start_demo_api.sh` 拉起，随 `start_all.sh` / `stop_all.sh` 一起管理。外部端口保持 `30080`。

全量 55 条烟测：

```bash
python scripts/smoke_test_demo_api.py
```

最近一次实测响应写在 [`samples/api-demo/latest-smoke-responses.json`](./samples/api-demo/latest-smoke-responses.json)。
