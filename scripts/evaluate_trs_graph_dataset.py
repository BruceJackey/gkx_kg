#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 TRS 图库读取图谱数据，计算「多模态数据集 / 数据集评估」页全部图指标。

对应前端 `DatasetEvaluation` / 接口文档
`POST /api/v1/mmkg/datasets/{datasetId}/evaluations`：

  统计特征：graphDensity / avgDegree / maxDegree / nodeCount / edgeCount
            degreeBins / relationDist
  质量报告：missingRate / inconsistencyRate / duplicateRate
            completenessScore / qualityScore / issues
  基准对比：benchmarks（当前行用本图结果填充）

图数据集约定：数据在 TRS 图空间中；连接与默认空间由环境变量 / 配置文件指定。

用法：
  # 用示例配置评估
  python scripts/evaluate_trs_graph_dataset.py \\
    --config scripts/configs/graph_dataset_eval.example.json

  # 覆盖图空间
  python scripts/evaluate_trs_graph_dataset.py --space prototype_science_topic_graph

  # 写出 JSON（可直接作为评估接口响应体）
  python scripts/evaluate_trs_graph_dataset.py --space demo -o /tmp/eval.json

环境变量（与 trs/client.py / TRS.md 对齐）：
  TRS_GRAPH_HOST / TRS_GRAPH_USER / TRS_GRAPH_PASSWORD
  TRS_GRAPH_ADDR / TRS_GRAPH_PORT / TRS_SPACE / TRS_TRANSPORT
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from trs.client import (  # noqa: E402
    GatewayTransport,
    TrsClient,
    TrsError,
    _ident,
    _safe_field,
    render_value,
)


# 与 trs/TRS.md / trs_flex.py 演示环境对齐的本地回退（配置/环境变量优先）
DEFAULT_TRS = {
    "host": "http://114.117.127.200:7001",
    "user": "root",
    "password": "trsadmin",
    "addr": "127.0.0.1",
    "port": 9669,
    "timeout": 120,
}

DEGREE_BIN_DEFS: List[Tuple[int, Optional[int], str]] = [
    (1, 2, "1–2"),
    (3, 5, "3–5"),
    (6, 10, "6–10"),
    (11, 20, "11–20"),
    (21, None, "21+"),
]

DEFAULT_SCORE_WEIGHTS = {
    "completenessMissing": 1.0,
    "completenessIsolate": 0.5,
    "qualityMissing": 0.6,
    "qualityInconsistency": 1.2,
    "qualityDuplicate": 0.8,
}


# ─── 工具 ────────────────────────────────────────────────────────────────────

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _pct(part: float, whole: float, ndigits: int = 1) -> float:
    if whole <= 0:
        return 0.0
    return round(100.0 * part / whole, ndigits)


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def _row_get(row: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in row and row[key] is not None:
            return row[key]
    return default


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_config(path: Optional[str]) -> Dict[str, Any]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise SystemExit(f"配置文件必须是 JSON 对象: {path}")
    return data


def _cfg_get(config: Dict[str, Any], *keys: str, env: str = "", default: Any = "") -> Any:
    trs = config.get("trs") if isinstance(config.get("trs"), dict) else {}
    for key in keys:
        if key in config and config[key] not in (None, ""):
            return config[key]
        if key in trs and trs[key] not in (None, ""):
            return trs[key]
    if env:
        val = os.getenv(env)
        if val not in (None, ""):
            return val
    return default


def make_client(config: Dict[str, Any]) -> TrsClient:
    """用配置/环境变量/默认值建连；不依赖 Django settings。"""
    host = str(_cfg_get(config, "host", env="TRS_GRAPH_HOST", default=DEFAULT_TRS["host"])).rstrip("/")
    user = str(_cfg_get(config, "user", env="TRS_GRAPH_USER", default=DEFAULT_TRS["user"]))
    password = str(_cfg_get(config, "password", env="TRS_GRAPH_PASSWORD", default=DEFAULT_TRS["password"]))
    addr = str(_cfg_get(config, "addr", env="TRS_GRAPH_ADDR", default=DEFAULT_TRS["addr"]))
    port = int(_cfg_get(config, "port", env="TRS_GRAPH_PORT", default=DEFAULT_TRS["port"]))
    timeout = int(_cfg_get(config, "timeout", env="TRS_HTTP_TIMEOUT", default=DEFAULT_TRS["timeout"]))
    transport = GatewayTransport(
        host=host, user=user, password=password, addr=addr, port=port, timeout=timeout,
    )
    return TrsClient(transport=transport)


# ─── TRS 读取 ────────────────────────────────────────────────────────────────

def ensure_space(client: TrsClient, space: str) -> None:
    spaces = client.execute_raw("SHOW SPACES;")
    names = {
        str(_row_get(r, "Name", "name", default=""))
        for r in spaces.get("tables") or []
    }
    if space not in names:
        raise SystemExit(f"TRS 图空间不存在: {space}（可用: {sorted(n for n in names if n)}）")


def refresh_stats_if_needed(client: TrsClient, space: str, refresh: bool) -> None:
    if not refresh:
        return
    job_id = client.submit_job_stats(space)
    print(f"[info] SUBMIT JOB STATS -> job={job_id}（快照异步，本次仍用 MATCH 实算）", file=sys.stderr)


def fetch_node_edge_counts(client: TrsClient, space: str) -> Tuple[int, int]:
    """优先 SHOW STATS；为空则 MATCH 实算。"""
    stats = client.show_stats(space)
    node_count = int(stats.get("vertex_total") or 0)
    edge_count = int(stats.get("edge_total") or 0)
    if node_count > 0 or edge_count > 0:
        return node_count, edge_count

    vres = client.execute("MATCH (v) RETURN count(*) AS total", space=space)
    eres = client.execute("MATCH ()-[e]->() RETURN count(*) AS total", space=space)
    node_count = int(_row_get((vres.get("tables") or [{}])[0], "total", default=0) or 0)
    edge_count = int(_row_get((eres.get("tables") or [{}])[0], "total", default=0) or 0)
    return node_count, edge_count


def fetch_degree_map(client: TrsClient, space: str) -> Dict[str, int]:
    """无向度数：出边+入边。度=0 的点不会出现在结果中。"""
    gql = "MATCH (v)-[e]-() RETURN id(v) AS vid, count(e) AS deg"
    res = client.execute(gql, space=space)
    degrees: Dict[str, int] = {}
    for row in res.get("tables") or []:
        vid = _row_get(row, "vid")
        if vid is None:
            continue
        degrees[str(vid)] = int(_row_get(row, "deg", default=0) or 0)
    return degrees


def fetch_relation_counts(client: TrsClient, space: str) -> Dict[str, int]:
    return client.count_edges_by_type(space)


def show_tags(client: TrsClient, space: str) -> List[str]:
    return client.show_tags(space)


def show_edges(client: TrsClient, space: str) -> List[str]:
    res = client.execute("SHOW EDGES", space=space)
    names: List[str] = []
    for row in res.get("tables") or []:
        n = _row_get(row, "Name", "name")
        if n:
            names.append(str(n))
    return names


def required_props_for(mapping: Dict[str, Any], type_name: str) -> List[str]:
    specific = mapping.get(type_name)
    wildcard = mapping.get("*") or mapping.get("default") or []
    if specific is None:
        return list(wildcard)
    return list(specific)


def count_missing_vertex_props(
    client: TrsClient,
    space: str,
    tags: Sequence[str],
    required_map: Dict[str, Any],
) -> Tuple[int, int, List[Dict[str, Any]]]:
    """返回 (缺失槽位数, 总检查槽位数, 明细)。"""
    missing_slots = 0
    total_slots = 0
    details: List[Dict[str, Any]] = []

    for tag in tags:
        fields = required_props_for(required_map, tag)
        if not fields:
            continue
        tag_count = client.count_vertices_of_tag(space, tag)
        if tag_count <= 0:
            continue
        for field in fields:
            prop = _safe_field(field)
            total_slots += tag_count
            # 空串 / NULL 视为缺失；字段不存在时 properties 访问通常也得到空
            gql = (
                f"MATCH (v) WHERE {render_value(tag)} IN tags(v) AND "
                f"(properties(v).{prop} IS NULL OR properties(v).{prop} == '') "
                f"RETURN count(*) AS cnt"
            )
            try:
                res = client.execute(gql, space=space)
                cnt = int(_row_get((res.get("tables") or [{}])[0], "cnt", default=0) or 0)
            except TrsError as err:
                # 字段未建模时整列视为缺失
                if "UnknownProp" in str(err) or "doesn't exist" in str(err).lower():
                    cnt = tag_count
                else:
                    raise
            if cnt > 0:
                missing_slots += cnt
                details.append({
                    "tag": tag,
                    "field": field,
                    "missing": cnt,
                    "total": tag_count,
                })
    return missing_slots, total_slots, details


def count_missing_edge_props(
    client: TrsClient,
    space: str,
    edges: Sequence[str],
    required_map: Dict[str, Any],
    edge_counts: Dict[str, int],
) -> Tuple[int, int, List[Dict[str, Any]]]:
    missing_slots = 0
    total_slots = 0
    details: List[Dict[str, Any]] = []

    for edge in edges:
        fields = required_props_for(required_map, edge)
        if not fields:
            continue
        edge_total = int(edge_counts.get(edge) or 0)
        if edge_total <= 0:
            continue
        for field in fields:
            prop = _safe_field(field)
            total_slots += edge_total
            gql = (
                f"MATCH ()-[e:{_ident(edge)}]->() WHERE "
                f"(properties(e).{prop} IS NULL OR properties(e).{prop} == '') "
                f"RETURN count(*) AS cnt"
            )
            try:
                res = client.execute(gql, space=space)
                cnt = int(_row_get((res.get("tables") or [{}])[0], "cnt", default=0) or 0)
            except TrsError as err:
                if "UnknownProp" in str(err) or "doesn't exist" in str(err).lower():
                    cnt = edge_total
                else:
                    raise
            if cnt > 0:
                missing_slots += cnt
                details.append({
                    "edge": edge,
                    "field": field,
                    "missing": cnt,
                    "total": edge_total,
                })
    return missing_slots, total_slots, details


def count_duplicate_vertices(
    client: TrsClient,
    space: str,
    name_field: str,
) -> Tuple[int, int]:
    """同 tag + 同 name 的多余点数；返回 (多余点数, 出现重复的分组数)。"""
    prop = _safe_field(name_field)
    gql = (
        f"MATCH (v) RETURN tags(v)[0] AS etype, properties(v).{prop} AS name, "
        f"count(*) AS cnt"
    )
    res = client.execute(gql, space=space)
    extra = 0
    groups = 0
    for row in res.get("tables") or []:
        name = _row_get(row, "name")
        if _is_empty(name):
            continue
        cnt = int(_row_get(row, "cnt", default=0) or 0)
        if cnt > 1:
            groups += 1
            extra += cnt - 1
    return extra, groups


def count_name_tag_conflicts(
    client: TrsClient,
    space: str,
    name_field: str,
) -> Tuple[int, int]:
    """同一 name 出现在多个 tag 下的点数；返回 (涉及点数, 冲突 name 数)。"""
    prop = _safe_field(name_field)
    gql = (
        f"MATCH (v) RETURN properties(v).{prop} AS name, "
        f"count(DISTINCT tags(v)[0]) AS tag_cnt, count(*) AS cnt"
    )
    res = client.execute(gql, space=space)
    involved = 0
    names = 0
    for row in res.get("tables") or []:
        name = _row_get(row, "name")
        if _is_empty(name):
            continue
        tag_cnt = int(_row_get(row, "tag_cnt", default=0) or 0)
        cnt = int(_row_get(row, "cnt", default=0) or 0)
        if tag_cnt > 1:
            names += 1
            involved += cnt
    return involved, names


def count_duplicate_edges(client: TrsClient, space: str) -> Tuple[int, int]:
    """同 src+type+dst 多条边（不同 rank）的多余边数。"""
    gql = (
        "MATCH (a)-[e]->(b) "
        "RETURN id(a) AS src, type(e) AS etype, id(b) AS dst, count(*) AS cnt"
    )
    res = client.execute(gql, space=space)
    extra = 0
    groups = 0
    for row in res.get("tables") or []:
        cnt = int(_row_get(row, "cnt", default=0) or 0)
        if cnt > 1:
            groups += 1
            extra += cnt - 1
    return extra, groups


def count_self_loops(client: TrsClient, space: str) -> int:
    gql = "MATCH (a)-[e]->(b) WHERE id(a) == id(b) RETURN count(*) AS cnt"
    res = client.execute(gql, space=space)
    return int(_row_get((res.get("tables") or [{}])[0], "cnt", default=0) or 0)


# ─── 指标计算 ────────────────────────────────────────────────────────────────

def compute_degree_metrics(
    node_count: int,
    edge_count: int,
    degree_map: Dict[str, int],
) -> Dict[str, Any]:
    connected = len(degree_map)
    isolate_count = max(0, node_count - connected)
    degrees = list(degree_map.values())
    max_degree = max(degrees) if degrees else 0
    # 与页面 Mock 一致：把边当作无向统计，平均度 = 2E/N
    avg_degree = round((2.0 * edge_count / node_count), 1) if node_count else 0.0
    # 有向图密度 E / (N*(N-1))；N<2 时为 0
    if node_count >= 2:
        graph_density = round(edge_count / (node_count * (node_count - 1)), 6)
    else:
        graph_density = 0.0

    # 分箱百分比：按「全部节点」计，度 0 不进五档（记入孤立节点问题）
    # 为与页面「五档合计约 100%」对齐，对度≥1 的节点归一化
    bin_counts = [0] * len(DEGREE_BIN_DEFS)
    for deg in degrees:
        for i, (lo, hi, _) in enumerate(DEGREE_BIN_DEFS):
            if deg < lo:
                continue
            if hi is None or deg <= hi:
                bin_counts[i] += 1
                break

    denom = max(1, connected)  # 无连接点时 bins 全 0
    degree_bins = []
    for i, (_, _, label) in enumerate(DEGREE_BIN_DEFS):
        value = int(round(100.0 * bin_counts[i] / denom)) if connected else 0
        degree_bins.append({"label": label, "value": value})
    # 校正四舍五入使合计为 100（仅当有连接点）
    if connected and degree_bins:
        drift = 100 - sum(b["value"] for b in degree_bins)
        if drift != 0:
            # 加到最大的一档
            idx = max(range(len(degree_bins)), key=lambda i: degree_bins[i]["value"])
            degree_bins[idx]["value"] = int(_clamp(degree_bins[idx]["value"] + drift, 0, 100))

    return {
        "graphDensity": graph_density,
        "avgDegree": avg_degree,
        "maxDegree": max_degree,
        "isolateCount": isolate_count,
        "degreeBins": degree_bins,
    }


def compute_relation_dist(
    relation_counts: Dict[str, int],
    top_n: int,
) -> List[Dict[str, Any]]:
    if not relation_counts:
        return []
    total = sum(relation_counts.values())
    ranked = sorted(relation_counts.items(), key=lambda x: (-x[1], x[0]))
    if top_n <= 0 or len(ranked) <= top_n:
        selected = ranked
        other_count = 0
    else:
        selected = ranked[: top_n - 1]
        other_count = sum(c for _, c in ranked[top_n - 1 :])

    dist: List[Dict[str, Any]] = []
    for etype, count in selected:
        dist.append({
            "type": etype,
            "count": count,
            "pct": _pct(count, total, 1),
        })
    if other_count > 0:
        dist.append({
            "type": "OTHER",
            "count": other_count,
            "pct": _pct(other_count, total, 1),
        })
    # 校正 pct 合计
    if dist:
        drift = round(100.0 - sum(d["pct"] for d in dist), 1)
        if abs(drift) >= 0.1:
            dist[-1]["pct"] = round(dist[-1]["pct"] + drift, 1)
    return dist


def build_issues(
    missing_vertex_details: List[Dict[str, Any]],
    missing_edge_details: List[Dict[str, Any]],
    missing_slots: int,
    isolate_count: int,
    name_conflict_nodes: int,
    name_conflict_names: int,
    self_loops: int,
    dup_vertex_extra: int,
    dup_vertex_groups: int,
    dup_edge_extra: int,
    dup_edge_groups: int,
) -> List[Dict[str, Any]]:
    issues: List[Dict[str, Any]] = []
    issue_id = 1

    def add(severity: str, category: str, count: int, detail: str) -> None:
        nonlocal issue_id
        if count <= 0:
            return
        issues.append({
            "id": f"q{issue_id}",
            "severity": severity,
            "category": category,
            "count": count,
            "detail": detail,
        })
        issue_id += 1

    if missing_slots > 0:
        parts = []
        for d in missing_vertex_details[:5]:
            parts.append(f"{d['tag']}.{d['field']}={d['missing']}")
        for d in missing_edge_details[:3]:
            parts.append(f"边:{d['edge']}.{d['field']}={d['missing']}")
        detail = "必填属性为空或未建模"
        if parts:
            detail += "（" + ", ".join(parts) + ("…" if len(missing_vertex_details) + len(missing_edge_details) > 8 else "") + "）"
        add("high", "缺失值", missing_slots, detail)

    inconsist_count = name_conflict_nodes + self_loops
    if inconsist_count > 0:
        bits = []
        if name_conflict_names:
            bits.append(f"{name_conflict_names} 个名称跨多种实体类型（涉及 {name_conflict_nodes} 点）")
        if self_loops:
            bits.append(f"{self_loops} 条自环边")
        add("medium", "不一致", inconsist_count, "；".join(bits))

    dup_count = dup_vertex_extra + dup_edge_extra
    if dup_count > 0:
        bits = []
        if dup_vertex_groups:
            bits.append(f"{dup_vertex_groups} 组同名同类型节点（多余 {dup_vertex_extra}）")
        if dup_edge_groups:
            bits.append(f"{dup_edge_groups} 组重复边 src-type-dst（多余 {dup_edge_extra}）")
        add("medium", "重复", dup_count, "；".join(bits))

    if isolate_count > 0:
        add("low", "孤立节点", isolate_count, "度为 0 的节点（无任何入边/出边）")

    return issues


def compute_scores(
    missing_rate: float,
    inconsistency_rate: float,
    duplicate_rate: float,
    isolate_rate: float,
    weights: Dict[str, float],
) -> Tuple[int, int]:
    w = {**DEFAULT_SCORE_WEIGHTS, **(weights or {})}
    completeness = 100.0 - missing_rate * float(w["completenessMissing"]) - isolate_rate * float(w["completenessIsolate"])
    quality = (
        100.0
        - missing_rate * float(w["qualityMissing"])
        - inconsistency_rate * float(w["qualityInconsistency"])
        - duplicate_rate * float(w["qualityDuplicate"])
    )
    return int(round(_clamp(completeness, 0, 100))), int(round(_clamp(quality, 0, 100)))


def build_benchmarks(
    config_benchmarks: Optional[Sequence[Dict[str, Any]]],
    dataset_name: str,
    density: float,
    avg_degree: float,
    completeness: int,
    quality: int,
) -> List[Dict[str, Any]]:
    current = {
        "name": f"{dataset_name}（当前）",
        "density": density,
        "avgDegree": avg_degree,
        "completeness": completeness,
        "quality": quality,
        "isCurrent": True,
    }
    rows = [current]
    for b in config_benchmarks or []:
        rows.append({
            "name": b.get("name", "benchmark"),
            "density": float(b.get("density", 0)),
            "avgDegree": float(b.get("avgDegree", 0)),
            "completeness": int(b.get("completeness", 0)),
            "quality": int(b.get("quality", 0)),
            "isCurrent": False,
        })
    return rows


def evaluate_space(client: TrsClient, space: str, config: Dict[str, Any]) -> Dict[str, Any]:
    dataset_id = str(config.get("datasetId") or space)
    dataset_name = str(config.get("datasetName") or space)
    name_field = str(config.get("nameField") or "name")
    top_n = int(config.get("topRelationTypes") or 5)
    required_vertex = dict(config.get("requiredVertexProps") or {"*": ["name"]})
    required_edge = dict(config.get("requiredEdgeProps") or {"*": []})
    weights = dict(config.get("scoreWeights") or {})

    ensure_space(client, space)
    refresh_stats_if_needed(client, space, bool(config.get("refreshStats")))

    print(f"[info] space={space} 拉取节点/边规模…", file=sys.stderr)
    node_count, edge_count = fetch_node_edge_counts(client, space)

    print(f"[info] 计算度数分布（nodes={node_count}, edges={edge_count}）…", file=sys.stderr)
    degree_map = fetch_degree_map(client, space)
    degree_metrics = compute_degree_metrics(node_count, edge_count, degree_map)

    print("[info] 关系类型分布…", file=sys.stderr)
    relation_counts = fetch_relation_counts(client, space)
    relation_dist = compute_relation_dist(relation_counts, top_n)

    tags = show_tags(client, space)
    edges = show_edges(client, space)

    print("[info] 缺失属性检查…", file=sys.stderr)
    mv_slots, mv_total, mv_details = count_missing_vertex_props(
        client, space, tags, required_vertex,
    )
    me_slots, me_total, me_details = count_missing_edge_props(
        client, space, edges, required_edge, relation_counts,
    )
    missing_slots = mv_slots + me_slots
    missing_total = mv_total + me_total
    missing_rate = _pct(missing_slots, missing_total) if missing_total else 0.0

    print("[info] 不一致 / 重复检查…", file=sys.stderr)
    try:
        conflict_nodes, conflict_names = count_name_tag_conflicts(client, space, name_field)
    except TrsError as err:
        print(f"[warn] 名称冲突检查跳过: {err}", file=sys.stderr)
        conflict_nodes, conflict_names = 0, 0
    self_loops = count_self_loops(client, space)
    inconsist_count = conflict_nodes + self_loops
    inconsist_denom = max(node_count + edge_count, 1)
    inconsistency_rate = _pct(inconsist_count, inconsist_denom)

    try:
        dup_v_extra, dup_v_groups = count_duplicate_vertices(client, space, name_field)
    except TrsError as err:
        print(f"[warn] 节点重复检查跳过: {err}", file=sys.stderr)
        dup_v_extra, dup_v_groups = 0, 0
    dup_e_extra, dup_e_groups = count_duplicate_edges(client, space)
    dup_count = dup_v_extra + dup_e_extra
    duplicate_rate = _pct(dup_count, inconsist_denom)

    isolate_count = int(degree_metrics["isolateCount"])
    isolate_rate = _pct(isolate_count, max(node_count, 1))

    completeness_score, quality_score = compute_scores(
        missing_rate, inconsistency_rate, duplicate_rate, isolate_rate, weights,
    )

    issues = build_issues(
        mv_details, me_details, missing_slots,
        isolate_count, conflict_nodes, conflict_names, self_loops,
        dup_v_extra, dup_v_groups, dup_e_extra, dup_e_groups,
    )

    evaluation: Dict[str, Any] = {
        "datasetId": dataset_id,
        "datasetName": dataset_name,
        "graphSpace": space,
        "graphDensity": degree_metrics["graphDensity"],
        "avgDegree": degree_metrics["avgDegree"],
        "maxDegree": degree_metrics["maxDegree"],
        "nodeCount": node_count,
        "edgeCount": edge_count,
        "degreeBins": degree_metrics["degreeBins"],
        "relationDist": relation_dist,
        "missingRate": missing_rate,
        "inconsistencyRate": inconsistency_rate,
        "duplicateRate": duplicate_rate,
        "completenessScore": completeness_score,
        "qualityScore": quality_score,
        "issues": issues,
        "lastEvaluatedAt": _now_iso(),
        "meta": {
            "isolateCount": isolate_count,
            "missingSlots": missing_slots,
            "missingCheckedSlots": missing_total,
            "duplicateVertexExtra": dup_v_extra,
            "duplicateEdgeExtra": dup_e_extra,
            "selfLoops": self_loops,
            "nameConflictNames": conflict_names,
            "tagCount": len(tags),
            "edgeTypeCount": len(edges),
            "formulas": {
                "avgDegree": "2 * edgeCount / nodeCount",
                "graphDensity": "edgeCount / (nodeCount * (nodeCount - 1))",
                "missingRate": "empty_required_slots / checked_slots * 100",
                "inconsistencyRate": "(name_cross_tag_nodes + self_loops) / (nodes + edges) * 100",
                "duplicateRate": "(extra_same_name_nodes + extra_parallel_edges) / (nodes + edges) * 100",
            },
        },
        "benchmarks": build_benchmarks(
            config.get("benchmarks"),
            dataset_name,
            degree_metrics["graphDensity"],
            degree_metrics["avgDegree"],
            completeness_score,
            quality_score,
        ),
    }
    return evaluation


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="从 TRS 图空间计算多模态数据集评估页全部图指标",
    )
    parser.add_argument(
        "--config",
        default=str(ROOT / "scripts/configs/graph_dataset_eval.example.json"),
        help="评估配置 JSON（含 space、必填属性、基准等）",
    )
    parser.add_argument("--space", default=None, help="覆盖配置中的 TRS 图空间名")
    parser.add_argument("--dataset-id", default=None, help="覆盖 datasetId")
    parser.add_argument("--dataset-name", default=None, help="覆盖 datasetName")
    parser.add_argument(
        "--refresh-stats",
        action="store_true",
        help="评估前 SUBMIT JOB STATS（结果异步，本轮仍 MATCH 实算）",
    )
    parser.add_argument("--host", default=None, help="TRS Studio 网关，覆盖 TRS_GRAPH_HOST")
    parser.add_argument("--user", default=None, help="覆盖 TRS_GRAPH_USER")
    parser.add_argument("--password", default=None, help="覆盖 TRS_GRAPH_PASSWORD")
    parser.add_argument("--addr", default=None, help="graphd 地址，覆盖 TRS_GRAPH_ADDR")
    parser.add_argument("--port", type=int, default=None, help="graphd 端口，覆盖 TRS_GRAPH_PORT")
    parser.add_argument("-o", "--output", default=None, help="写出评估 JSON 路径（默认 stdout）")
    parser.add_argument("--pretty", action="store_true", help="缩进格式化输出")
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    config = load_config(args.config if Path(args.config).exists() else None)
    if args.space:
        config["space"] = args.space
    if args.dataset_id:
        config["datasetId"] = args.dataset_id
    if args.dataset_name:
        config["datasetName"] = args.dataset_name
    if args.refresh_stats:
        config["refreshStats"] = True
    trs_cfg = dict(config.get("trs") or {})
    if args.host:
        trs_cfg["host"] = args.host
    if args.user:
        trs_cfg["user"] = args.user
    if args.password:
        trs_cfg["password"] = args.password
    if args.addr:
        trs_cfg["addr"] = args.addr
    if args.port is not None:
        trs_cfg["port"] = args.port
    config["trs"] = trs_cfg

    space = str(config.get("space") or os.getenv("TRS_SPACE") or "").strip()
    if not space:
        raise SystemExit("未指定图空间：请在 --config 中设 space，或传 --space / 环境变量 TRS_SPACE")

    client = make_client(config)
    try:
        result = evaluate_space(client, space, config)
    finally:
        try:
            client.close()
        except Exception:  # noqa: BLE001
            pass

    text = json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")
        print(f"[ok] wrote {args.output}", file=sys.stderr)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
