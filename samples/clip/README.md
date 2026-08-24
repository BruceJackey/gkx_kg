# CLIP 图文训练样例

多模态数据集模块**只服务 CLIP 图文对比训练**（image encoder + text encoder + 对称 InfoNCE）。  
本目录给后端接入时对照：一条记录 = 一张图 + 一条 caption。

## 约定

| 项 | 说明 |
|----|------|
| 模态 | 仅 `image` + `text`，无音频/视频 |
| 主格式 | JSONL，一行一条 |
| 备选格式 | CSV（`tags` 用 `;` 分隔） |
| 图像存储 | `s3://kg-mm/{dataset_id}/{split}/{id}.png` 或可访问 URL |
| 文本长度 | caption 建议 ≤ 77 tokens（CLIP tokenizer） |
| 划分 | `train` 进对比损失；`val` 做图文检索 Recall；`test` 仅评测 |
| 过滤 | 可选 `clip_score`（预训练 CLIP cosine），建议 train 侧 > 0.25 |

字段定义见 [`schema.json`](./schema.json)，与前端 `ImageTextPairSchema` v1.1 一致。

## 样例数据集

| 文件 | 用途 | 规模示意 |
|------|------|----------|
| [`manifest.json`](./manifest.json) | 数据集清单（对接列表接口） | 3 个 |
| [`scipaper-clip.train.jsonl`](./scipaper-clip.train.jsonl) | 科技论文附图–图注 | 8 条 |
| [`scipaper-clip.val.jsonl`](./scipaper-clip.val.jsonl) | 同上验证集 | 2 条 |
| [`medimage-clip.train.jsonl`](./medimage-clip.train.jsonl) | 医学影像–报告 | 6 条 |
| [`patentfig-clip.train.jsonl`](./patentfig-clip.train.jsonl) | 专利附图–权利要求 | 6 条 |
| [`pairs.csv`](./pairs.csv) | 同一 Schema 的 CSV 形态 | 4 条 |

## 训练侧最小读取示例

```python
import json

def load_clip_jsonl(path):
    pairs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            assert rec["image"] and rec["caption"]
            if rec.get("split", "train") != "train":
                continue
            pairs.append((rec["image"], rec["caption"]))
    return pairs
```

损失函数按 OpenCLIP 惯例：batch 内图像特征与文本特征做对称交叉熵。
