
### 可训练融合模型（BAN / MFB+GMU）

选择融合模型并对其本身训练与管理；推理必须带同一 `checkpoint_id`。

| `model_id` | 族 | 说明 |
| --- | --- | --- |
| `ban` | `co_attention` | Bilinear Attention Networks：图文协同注意力 + 双线性交互 |
| `mfb_gmu` | `gate_bilinear` | 因子分解双线性池化（MFB）+ 门控多模态单元（GMU） |

#### 训练数据格式（前端提交）

任务固定为图文匹配 `text_image_match`。每条 pair 至少要有 `text` + `label`；图像用 `image_hint`（演示）或 `image_base64`（真图）。**必须同时含 label=1 与 label=0**，最多 200 条。

```json
{
  "name": "demo-match-v1",
  "task": "text_image_match",
  "pairs": [
    {
      "id": "pos_1",
      "text": "多模态融合结合文本与视觉信息",
      "image_hint": "multimodal fusion text vision",
      "label": 1
    },
    {
      "id": "neg_1",
      "text": "多模态融合结合文本与视觉信息",
      "image_hint": "unrelated noise caption",
      "label": 0
    },
    {
      "id": "pos_img",
      "text": "知识图谱将实体与关系结构化表示",
      "image_base64": "<png_base64>",
      "image_mime": "image/png",
      "label": 1
    }
  ]
}
```

也可用 `image: {"hint":"..."}` 或 `image: {"base64":"...","mime":"image/png"}`。`label` 接受 `1/0`、`true/false`、`match/mismatch`。

提交方式三选一：

1. **训练时内联**（推荐演示页）：`POST models:train` 带 `dataset`
2. **先注册再训**：`POST /datasets` → 拿 `dataset_id` → train 只传 id
3. 兼容旧字段 `samples`（与 `pairs` 同构）

不传数据集时仍可用内置 demo 样本。

```bash
# 可选模型 + 数据 schema
curl -sS "$BASE/api/v1/mm-fusion/models" -H "Authorization: Bearer $TOKEN"

# 方式 A：训练时直接提交数据集
curl -sS -X POST "$BASE/api/v1/mm-fusion/models:train" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "ban",
    "epochs": 16,
    "dim": 32,
    "learning_rate": 0.08,
    "seed": 42,
    "dataset": {
      "name": "frontend-upload-v1",
      "task": "text_image_match",
      "pairs": [
        {"id":"p1","text":"多模态融合结合文本与视觉信息","image_hint":"multimodal fusion text vision","label":1},
        {"id":"n1","text":"多模态融合结合文本与视觉信息","image_hint":"unrelated noise","label":0},
        {"id":"p2","text":"知识图谱将实体与关系结构化表示","image_hint":"knowledge graph structure","label":1},
        {"id":"n2","text":"知识图谱将实体与关系结构化表示","image_hint":"random caption","label":0}
      ]
    }
  }'

# 方式 B：先注册数据集
curl -sS -X POST "$BASE/api/v1/mm-fusion/datasets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "frontend-upload-v1",
    "pairs": [
      {"text":"协同注意力让模态互相引导","image_hint":"co attention multimodal guidance","label":1},
      {"text":"协同注意力让模态互相引导","image_hint":"noise","label":0}
    ]
  }'

curl -sS -X POST "$BASE/api/v1/mm-fusion/models:train" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model_id":"mfb_gmu","dataset_id":"DATASET_ID","epochs":16,"dim":32,"factor":4}'

# checkpoint / dataset 管理
curl -sS "$BASE/api/v1/mm-fusion/datasets" -H "Authorization: Bearer $TOKEN"
curl -sS "$BASE/api/v1/mm-fusion/datasets/DATASET_ID" -H "Authorization: Bearer $TOKEN"
curl -sS "$BASE/api/v1/mm-fusion/checkpoints" -H "Authorization: Bearer $TOKEN"
curl -sS "$BASE/api/v1/mm-fusion/checkpoints/CHECKPOINT_ID" -H "Authorization: Bearer $TOKEN"

# 推理（image_hint 或 image_base64）
curl -sS -X POST "$BASE/api/v1/mm-fusion/models:infer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint_id": "CHECKPOINT_ID",
    "text": "多模态融合结合文本与视觉信息",
    "image_hint": "multimodal fusion text vision"
  }'
```

`checkpoint` / `dataset` TTL 均为 **4 小时**。