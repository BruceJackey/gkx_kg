#!/usr/bin/env python3
"""把 prototype_seed_20260828 数据构造成两个 TRS/NebulaGraph 测试图。"""

from __future__ import annotations

import argparse
import base64
import json
import os
import time
from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Iterable

import pymysql
import requests


SEED = "prototype_seed_20260828"
ENTERPRISE_SPACE = "prototype_enterprise_graph"
TOPIC_SPACE = "prototype_science_topic_graph"


@dataclass(frozen=True)
class Vertex:
    vid: str
    name: str
    entity_type: str
    domain: str = ""
    year: int = 0
    graph_id: str = ""
    properties: dict[str, Any] | None = None


@dataclass(frozen=True)
class Edge:
    src: str
    dst: str
    relation_type: str
    label: str
    year: int = 0
    weight: float = 1.0


def mysql_config() -> dict[str, Any]:
    required = {
        "host": "GKX_DB_HOST",
        "port": "GKX_DB_PORT",
        "user": "GKX_DB_USER",
        "password": "GKX_DB_PASSWORD",
        "database": "GKX_DB_NAME",
    }
    missing = [env for env in required.values() if not os.getenv(env)]
    if missing:
        raise RuntimeError(f"缺少 MySQL 环境变量：{', '.join(missing)}")
    return {
        "host": os.environ[required["host"]],
        "port": int(os.environ[required["port"]]),
        "user": os.environ[required["user"]],
        "password": os.environ[required["password"]],
        "database": os.environ[required["database"]],
    }


def query(cur: Any, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cur.execute(sql, params)
    return list(cur.fetchall())


def clean_properties(values: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in values.items():
        if value is None:
            continue
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        result[key] = value
    return result


def domain_from_id(value: str) -> str:
    parts = value.split("_")
    code = parts[2] if len(parts) > 2 else value
    if code.startswith("MED"):
        return "医疗专题"
    if code.startswith("CHEM"):
        return "化学专题"
    if code.startswith("OCEAN"):
        return "海洋专题"
    if code.startswith("QUANT"):
        return "量子专题"
    return "企业服务"


def vertex_map(vertices: Iterable[Vertex]) -> list[Vertex]:
    result: dict[str, Vertex] = {}
    for vertex in vertices:
        result[vertex.vid] = vertex
    return list(result.values())


def build_enterprise_graph(cur: Any) -> tuple[list[Vertex], list[Edge]]:
    vertices: list[Vertex] = []
    edges: list[Edge] = []
    base_rows = query(
        cur,
        """SELECT org_id,name_cn,incorporation_year,lerep,org_type,registered_capital_value,
                  city,external_id,industry,org_size
           FROM dwd_org_base_info WHERE table_data_source=%s ORDER BY org_id""",
        (SEED,),
    )
    company_names = {row["org_id"]: row["name_cn"] for row in base_rows}
    for row in base_rows:
        vertices.append(Vertex(
            row["org_id"], row["name_cn"], "企业", domain_from_id(row["org_id"]),
            int(row["incorporation_year"] or 0), "enterprise_graph",
            clean_properties({
                "legal_rep": row["lerep"], "org_type": row["org_type"],
                "registered_capital": row["registered_capital_value"], "city": row["city"],
                "credit_code": row["external_id"], "industry": row["industry"],
                "org_size": row["org_size"],
            }),
        ))

    for row in query(
        cur,
        """SELECT org_id,executives_name,executives_position
           FROM dwd_org_executive_info WHERE table_data_source=%s ORDER BY org_id,executives_name""",
        (SEED,),
    ):
        vid = f"PERSON::{row['org_id']}::{row['executives_name']}"
        vertices.append(Vertex(
            vid, row["executives_name"], "人物", domain_from_id(row["org_id"]), 0,
            "enterprise_graph", {"position": row["executives_position"]},
        ))
        edges.append(Edge(row["org_id"], vid, "任职", row["executives_position"] or "高管"))

    for row in query(
        cur,
        """SELECT org_id,inv_org_id,owners_name,owners_type,ownership_percentage
           FROM dwd_org_shareholder_info WHERE table_data_source=%s ORDER BY org_id,inv_org_id""",
        (SEED,),
    ):
        if row["inv_org_id"] not in company_names:
            vertices.append(Vertex(
                row["inv_org_id"], row["owners_name"], "股东", "企业服务", 0,
                "enterprise_graph", {"owners_type": row["owners_type"]},
            ))
        edges.append(Edge(
            row["inv_org_id"], row["org_id"], "持股", "股东",
            weight=float(row["ownership_percentage"] or 0) / 100,
        ))

    for row in query(
        cur,
        """SELECT org_id,sub_org_id,sub_name_cn FROM dwd_org_subsidiary_info
           WHERE table_data_source=%s ORDER BY org_id,sub_org_id""",
        (SEED,),
    ):
        if row["sub_org_id"] not in company_names:
            vertices.append(Vertex(
                row["sub_org_id"], row["sub_name_cn"], "企业",
                domain_from_id(row["org_id"]), 2021, "enterprise_graph",
            ))
        edges.append(Edge(row["org_id"], row["sub_org_id"], "控股", "子公司", 2021))

    for row in query(
        cur,
        """SELECT org_id,inv_org_id,inv_name,investment_amount,investment_ratio
           FROM dwd_org_invest_info WHERE table_data_source=%s ORDER BY org_id,inv_org_id""",
        (SEED,),
    ):
        edges.append(Edge(
            row["org_id"], row["inv_org_id"], "投资", "对外投资", 2021,
            float(row["investment_ratio"] or 0) / 100,
        ))

    for row in query(
        cur,
        """SELECT org_id,org_tag FROM dwd_org_tech_tag
           WHERE table_data_source=%s ORDER BY org_id,org_tag""",
        (SEED,),
    ):
        vid = f"TECH::{row['org_tag']}"
        vertices.append(Vertex(
            vid, row["org_tag"], "技术", domain_from_id(row["org_id"]), 0,
            "enterprise_graph",
        ))
        edges.append(Edge(row["org_id"], vid, "研发", "技术布局"))

    for row in query(
        cur,
        """SELECT company_id,product_name,industry_name,industry_link_name
           FROM dwd_org_industry_product_tags
           WHERE table_data_source=%s ORDER BY company_id,product_name""",
        (SEED,),
    ):
        vid = f"PRODUCT::{row['company_id']}::{row['product_name']}"
        vertices.append(Vertex(
            vid, row["product_name"], "产品", row["industry_name"] or "", 0,
            "enterprise_graph", {"industry_link": row["industry_link_name"]},
        ))
        edges.append(Edge(row["company_id"], vid, "推出", "企业产品", 2024))

    for row in query(
        cur,
        """SELECT org_id,news_title,news_date,news_content
           FROM dwd_org_important_news_info
           WHERE table_data_source=%s ORDER BY org_id,news_date""",
        (SEED,),
    ):
        year = int(row["news_date"].year)
        vid = f"NEWS::{row['org_id']}::{row['news_date'].isoformat()}"
        vertices.append(Vertex(
            vid, row["news_title"], "事件", domain_from_id(row["org_id"]), year,
            "enterprise_graph", {"date": row["news_date"], "content": row["news_content"]},
        ))
        edges.append(Edge(row["org_id"], vid, "发生", "企业动态", year))

    for row in query(
        cur,
        """SELECT org_id,year,operating_revenue,pure_profit,arch_development_am,
                  employees_number,total_assets,total_liabilities
           FROM dwd_org_annual_financial_info
           WHERE table_data_source=%s ORDER BY org_id,year""",
        (SEED,),
    ):
        year = int(row["year"])
        vid = f"SNAPSHOT::{row['org_id']}::{year}"
        vertices.append(Vertex(
            vid, f"{company_names.get(row['org_id'], row['org_id'])}{year}年度快照",
            "属性快照", domain_from_id(row["org_id"]), year, "enterprise_graph",
            clean_properties({
                "operating_revenue": row["operating_revenue"],
                "pure_profit": row["pure_profit"],
                "rd_amount": row["arch_development_am"],
                "employees": row["employees_number"],
                "total_assets": row["total_assets"],
                "total_liabilities": row["total_liabilities"],
            }),
        ))
        edges.append(Edge(row["org_id"], vid, "具有快照", "年度属性", year))

    for row in query(
        cur,
        """SELECT org_id,industry_name,inclusion_date,eliminate_date,lastest_symbol
           FROM dwd_corp_his_sw_ic WHERE table_data_source=%s
           ORDER BY org_id,inclusion_date""",
        (SEED,),
    ):
        year = int(row["inclusion_date"].year)
        vid = f"INDUSTRY::{row['org_id']}::{year}"
        vertices.append(Vertex(
            vid, row["industry_name"], "行业分类", domain_from_id(row["org_id"]),
            year, "enterprise_graph",
            clean_properties({
                "start_date": row["inclusion_date"], "end_date": row["eliminate_date"],
                "is_current": int(row["lastest_symbol"] or 0),
            }),
        ))
        edges.append(Edge(row["org_id"], vid, "属于行业", "行业演变", year))

    return vertex_map(vertices), edges


def build_topic_graph(cur: Any) -> tuple[list[Vertex], list[Edge]]:
    vertices: list[Vertex] = []
    edges: list[Edge] = []
    company_rows = query(
        cur,
        """SELECT org_id,name_cn,incorporation_year,industry,city
           FROM dwd_org_base_info
           WHERE table_data_source=%s AND org_id REGEXP '^PROTO_ORG_(MED|CHEM|OCEAN|QUANT)'
           ORDER BY org_id""",
        (SEED,),
    )
    for row in company_rows:
        vertices.append(Vertex(
            row["org_id"], row["name_cn"], "企业", domain_from_id(row["org_id"]),
            int(row["incorporation_year"] or 0), "science_topic_graph",
            {"industry": row["industry"], "city": row["city"]},
        ))

    scholars = query(
        cur,
        """SELECT scholar_id,name_zh,scholar_org_id,h_index,citation_nums,fields
           FROM dwd_scholar WHERE table_data_source=%s ORDER BY scholar_id""",
        (SEED,),
    )
    scholar_names = {row["scholar_id"]: row["name_zh"] for row in scholars}
    for row in scholars:
        domain = domain_from_id(row["scholar_org_id"] or "")
        vertices.append(Vertex(
            row["scholar_id"], row["name_zh"], "学者", domain, 0,
            "science_topic_graph",
            clean_properties({
                "org_id": row["scholar_org_id"], "h_index": row["h_index"],
                "citation_count": row["citation_nums"], "fields": row["fields"],
            }),
        ))
        if row["scholar_org_id"]:
            edges.append(Edge(row["scholar_id"], row["scholar_org_id"], "任职于", "所属机构", 2022))

    journals = query(
        cur,
        """SELECT publication_id,zh_name,founding_time,impact_score,jn_zone
           FROM dwd_zh_journal WHERE table_data_source=%s ORDER BY publication_id""",
        (SEED,),
    )
    journal_names = {row["publication_id"]: row["zh_name"] for row in journals}
    journal_domains = {
        "PROTO_J_MED": "医疗专题", "PROTO_J_CHEM": "化学专题",
        "PROTO_J_OCEAN": "海洋专题", "PROTO_J_QUANT": "量子专题",
    }
    for row in journals:
        vertices.append(Vertex(
            row["publication_id"], row["zh_name"], "期刊",
            journal_domains.get(row["publication_id"], ""), int(row["founding_time"] or 0),
            "science_topic_graph",
            {"impact_score": row["impact_score"], "zone": row["jn_zone"]},
        ))

    classifications = {
        row["id"]: row
        for row in query(
            cur,
            """SELECT id,scope,scope_zone,keywords FROM dwd_zh_paper_classification
               WHERE table_data_source=%s ORDER BY id""",
            (SEED,),
        )
    }
    papers = query(
        cur,
        """SELECT id,zh_name,doi,publication_id,cover_year_start,download_num
           FROM dwd_zh_paper WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    )
    for row in papers:
        classification = classifications.get(row["id"], {})
        year = int(row["cover_year_start"] or 0)
        vertices.append(Vertex(
            f"PAPER::{row['id']}", row["zh_name"], "论文",
            classification.get("scope_zone", ""), year, "science_topic_graph",
            clean_properties({
                "paper_id": row["id"], "doi": row["doi"],
                "scope": classification.get("scope"), "keywords": classification.get("keywords"),
                "download_count": row["download_num"],
            }),
        ))
        if row["publication_id"] in journal_names:
            edges.append(Edge(
                f"PAPER::{row['id']}", row["publication_id"], "发表于", "出版", year,
            ))

    for row in query(
        cur,
        """SELECT paper_id,author_id,author_sequence FROM dwd_zh_author
           WHERE table_data_source=%s ORDER BY paper_id,author_sequence""",
        (SEED,),
    ):
        if row["author_id"] in scholar_names:
            edges.append(Edge(
                row["author_id"], f"PAPER::{row['paper_id']}", "撰写", "作者",
                weight=1.0 if row["author_sequence"] == 1 else 0.8,
            ))

    for row in query(
        cur,
        """SELECT id,citation_id_list FROM dwd_zh_paper_citation
           WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    ):
        try:
            cited_ids = json.loads(row["citation_id_list"] or "[]")
        except json.JSONDecodeError:
            cited_ids = []
        for cited_id in cited_ids:
            edges.append(Edge(f"PAPER::{row['id']}", f"PAPER::{cited_id}", "引用", "论文引用"))

    patent_rows = query(
        cur,
        """SELECT patent_id,pn,pbdt_year,first_applicant_name,first_inventor_name,
                  main_classification_ipcr,technology_topic_data
           FROM dwd_patent WHERE table_data_source=%s ORDER BY patent_id""",
        (SEED,),
    )
    company_by_name = {row["name_cn"]: row["org_id"] for row in company_rows}
    for row in patent_rows:
        domain = domain_from_id(row["patent_id"].replace("PROTO_PAT_", "PROTO_ORG_"))
        year = int(row["pbdt_year"] or 0)
        vid = f"PATENT::{row['patent_id']}"
        vertices.append(Vertex(
            vid, row["pn"], "专利", domain, year, "science_topic_graph",
            clean_properties({
                "patent_id": row["patent_id"], "ipc": row["main_classification_ipcr"],
                "technology_topics": row["technology_topic_data"],
                "applicant": row["first_applicant_name"], "inventor": row["first_inventor_name"],
            }),
        ))
        applicant_id = company_by_name.get(row["first_applicant_name"])
        if applicant_id:
            edges.append(Edge(applicant_id, vid, "申请", "企业专利", year))
        inventor_vid = f"INVENTOR::{row['first_inventor_name']}"
        vertices.append(Vertex(
            inventor_vid, row["first_inventor_name"], "发明人", domain, 0,
            "science_topic_graph",
        ))
        edges.append(Edge(inventor_vid, vid, "发明", "专利发明人", year))

    for row in query(
        cur,
        """SELECT company_id,company_name,product_name,industry_name
           FROM dwd_org_industry_product_tags
           WHERE table_data_source=%s ORDER BY company_id,product_name""",
        (SEED,),
    ):
        vid = f"PRODUCT::{row['company_id']}::{row['product_name']}"
        domain = row["industry_name"] or domain_from_id(row["company_id"])
        vertices.append(Vertex(
            vid, row["product_name"], "产品", domain, 2024,
            "science_topic_graph", {"company_name": row["company_name"]},
        ))
        edges.append(Edge(row["company_id"], vid, "产品化", "科技成果转化", 2024))

    for row in query(
        cur,
        """SELECT org_id,org_tag FROM dwd_org_tech_tag
           WHERE table_data_source=%s ORDER BY org_id,org_tag""",
        (SEED,),
    ):
        vid = f"TECH::{row['org_tag']}"
        vertices.append(Vertex(
            vid, row["org_tag"], "技术", domain_from_id(row["org_id"]), 2020,
            "science_topic_graph",
        ))
        edges.append(Edge(row["org_id"], vid, "研发", "技术布局", 2020))

    for row in query(
        cur,
        """SELECT id,disease_name,phenotype_name,associated_gene,symptoms
           FROM dwd_clinical WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    ):
        vertices.append(Vertex(
            f"DISEASE::{row['id']}", row["disease_name"], "疾病", "医疗专题", 0,
            "science_topic_graph",
            clean_properties({
                "phenotype": row["phenotype_name"], "genes": row["associated_gene"],
                "symptoms": row["symptoms"],
            }),
        ))

    for row in query(
        cur,
        """SELECT id,drug_name,active_ingredients,route,dosage_form,sponsor_name
           FROM dwd_drug WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    ):
        vid = f"DRUG::{row['id']}"
        vertices.append(Vertex(
            vid, row["drug_name"], "药物", "医疗专题", 2024,
            "science_topic_graph",
            clean_properties({
                "ingredient": row["active_ingredients"], "route": row["route"],
                "dosage_form": row["dosage_form"], "sponsor": row["sponsor_name"],
            }),
        ))
        sponsor_id = company_by_name.get(row["sponsor_name"])
        if sponsor_id:
            edges.append(Edge(sponsor_id, vid, "研发", "候选药物", 2024))

    substances = query(
        cur,
        """SELECT id,molecular_name,formula,in_chi_key,std_smiles
           FROM dwd_drug_substance WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    )
    for row in substances:
        domain = "化学专题" if "CAT" in row["id"] or "POLY" in row["id"] else "医疗专题"
        vertices.append(Vertex(
            f"SUBSTANCE::{row['id']}", row["molecular_name"], "化合物", domain, 0,
            "science_topic_graph",
            clean_properties({
                "formula": row["formula"], "inchi_key": row["in_chi_key"],
                "smiles": row["std_smiles"],
            }),
        ))

    for row in query(
        cur,
        """SELECT id,event_name,organizer,start_date,end_date
           FROM dwd_event WHERE table_data_source=%s ORDER BY id""",
        (SEED,),
    ):
        domain_code = row["id"].split("_")[2] if len(row["id"].split("_")) > 2 else ""
        domain = {
            "MEDICAL": "医疗专题", "CHEMICAL": "化学专题",
            "OCEAN": "海洋专题", "QUANTUM": "量子专题",
        }.get(domain_code, "")
        year = int(row["start_date"].year)
        vid = f"EVENT::{row['id']}"
        vertices.append(Vertex(
            vid, row["event_name"], "事件", domain, year, "science_topic_graph",
            clean_properties({"organizer": row["organizer"], "start": row["start_date"], "end": row["end_date"]}),
        ))
        organizer_id = company_by_name.get(row["organizer"])
        if organizer_id:
            edges.append(Edge(organizer_id, vid, "发布", "里程碑事件", year))

    medical_diseases = ["PROTO_DISEASE_01", "PROTO_DISEASE_02", "PROTO_DISEASE_03"]
    medical_drugs = ["PROTO_DRUG_01", "PROTO_DRUG_02", "PROTO_DRUG_03"]
    for index, (disease, drug) in enumerate(zip(medical_diseases, medical_drugs), 1):
        edges.append(Edge(
            f"DRUG::{drug}", f"DISEASE::{disease}", "治疗", "适应症", 2023 + index,
        ))

    return vertex_map(vertices), edges


def gql_string(value: Any) -> str:
    if value is None:
        return "NULL"
    if hasattr(value, "isoformat"):
        value = value.isoformat()
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


class TrsGraphClient:
    def __init__(self, host: str, username: str, password: str, address: str, port: int):
        self.host = host.rstrip("/")
        self.session = requests.Session()
        auth = base64.b64encode(
            json.dumps([username, password], separators=(",", ":")).encode()
        ).decode()
        self.headers = {"Authorization": f"Bearer {auth}"}
        response = self.session.post(
            f"{self.host}/api-nebula/db/connect",
            json={"address": address, "port": port},
            headers=self.headers,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("code") != 0:
            raise RuntimeError(f"TRS 登录失败：{payload.get('message')}")

    def execute(self, gql: str) -> dict[str, Any]:
        response = self.session.post(
            f"{self.host}/api-nebula/db/exec",
            json={"gql": gql}, headers=self.headers, timeout=120,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("code") != 0:
            raise RuntimeError(f"nGQL 执行失败：{payload.get('message')}\nSQL: {gql[:500]}")
        return payload

    def close(self) -> None:
        try:
            self.session.post(
                f"{self.host}/api-nebula/db/disconnect",
                headers=self.headers, timeout=10,
            )
        finally:
            self.session.close()


def chunks(values: list[Any], size: int) -> Iterable[list[Any]]:
    for index in range(0, len(values), size):
        yield values[index:index + size]


SCHEMA_CODES = {
    "企业": "company", "人物": "person", "股东": "shareholder", "产品": "product",
    "技术": "technology", "事件": "event", "属性快照": "snapshot", "行业分类": "industry",
    "学者": "scholar", "论文": "paper", "期刊": "journal", "专利": "patent",
    "发明人": "inventor", "疾病": "disease", "药物": "drug", "化合物": "substance",
    "任职": "employment", "持股": "shareholding", "控股": "subsidiary",
    "投资": "investment", "研发": "research", "推出": "launch", "发生": "event_link",
    "具有快照": "has_snapshot", "属于行业": "belongs_industry", "任职于": "affiliated_with",
    "发表于": "published_in", "撰写": "authored", "引用": "cites", "申请": "applies",
    "发明": "invented", "产品化": "productized", "发布": "released", "治疗": "treats",
}

COMMON_VERTEX_SCHEMA = {
    "name": "string", "domain": "string", "year": "int",
    "graph_id": "string", "seed_batch": "string",
}
ENTERPRISE_TAG_SCHEMAS = {
    "企业": {
        **COMMON_VERTEX_SCHEMA, "legal_rep": "string", "org_type": "string",
        "registered_capital": "double", "city": "string", "credit_code": "string",
        "industry": "string", "org_size": "string",
    },
    "人物": {**COMMON_VERTEX_SCHEMA, "position": "string"},
    "产品": {**COMMON_VERTEX_SCHEMA, "industry_link": "string"},
    "技术": {**COMMON_VERTEX_SCHEMA},
    "事件": {**COMMON_VERTEX_SCHEMA, "date": "string", "content": "string"},
    "属性快照": {
        **COMMON_VERTEX_SCHEMA, "operating_revenue": "double", "pure_profit": "double",
        "rd_amount": "double", "employees": "int", "total_assets": "double",
        "total_liabilities": "double",
    },
    "行业分类": {
        **COMMON_VERTEX_SCHEMA, "start_date": "string", "end_date": "string",
        "is_current": "int",
    },
}
TOPIC_TAG_SCHEMAS = {
    "企业": {**COMMON_VERTEX_SCHEMA, "industry": "string", "city": "string"},
    "学者": {
        **COMMON_VERTEX_SCHEMA, "org_id": "string", "h_index": "int",
        "citation_count": "int", "fields": "string",
    },
    "论文": {
        **COMMON_VERTEX_SCHEMA, "paper_id": "string", "doi": "string", "scope": "string",
        "keywords": "string", "download_count": "int",
    },
    "期刊": {**COMMON_VERTEX_SCHEMA, "impact_score": "double", "zone": "string"},
    "专利": {
        **COMMON_VERTEX_SCHEMA, "patent_id": "string", "ipc": "string",
        "technology_topics": "string", "applicant": "string", "inventor": "string",
    },
    "发明人": {**COMMON_VERTEX_SCHEMA},
    "产品": {**COMMON_VERTEX_SCHEMA, "company_name": "string"},
    "技术": {**COMMON_VERTEX_SCHEMA},
    "疾病": {
        **COMMON_VERTEX_SCHEMA, "phenotype": "string", "genes": "string",
        "symptoms": "string",
    },
    "药物": {
        **COMMON_VERTEX_SCHEMA, "ingredient": "string", "route": "string",
        "dosage_form": "string", "sponsor": "string",
    },
    "化合物": {
        **COMMON_VERTEX_SCHEMA, "formula": "string", "inchi_key": "string",
        "smiles": "string",
    },
    "事件": {
        **COMMON_VERTEX_SCHEMA, "organizer": "string", "start": "string", "end": "string",
    },
}
EDGE_SCHEMA = {
    "label": "string", "year": "int", "weight": "double", "seed_batch": "string",
}


def schema_code(name: str) -> str:
    if name not in SCHEMA_CODES:
        raise ValueError(f"缺少 Schema 英文编码：{name}")
    return SCHEMA_CODES[name]


def vertex_properties(vertex: Vertex) -> dict[str, Any]:
    props = {
        "name": vertex.name, "domain": vertex.domain, "year": int(vertex.year),
        "graph_id": vertex.graph_id, "seed_batch": SEED,
    }
    props.update(clean_properties(vertex.properties or {}))
    return props


def recreate_space(client: TrsGraphClient, space: str) -> None:
    client.execute(f"DROP SPACE IF EXISTS `{space}`;")
    for _ in range(60):
        result = client.execute("SHOW SPACES;")
        names = {row["Name"] for row in result.get("data", {}).get("tables", [])}
        if space not in names:
            break
        time.sleep(1)
    else:
        raise RuntimeError(f"空间 {space} 删除超时")
    client.execute(
        f"CREATE SPACE IF NOT EXISTS `{space}` "
        f"(partition_num=10, replica_factor=1, vid_type=FIXED_STRING(128)) "
        f"COMMENT={gql_string('原型测试图谱，批次 ' + SEED)};"
    )
    for _ in range(60):
        try:
            client.execute(f"USE `{space}`;")
            break
        except RuntimeError as error:
            if "SpaceNotFound" not in str(error):
                raise
            time.sleep(1)
    else:
        raise RuntimeError(f"空间 {space} 创建或传播超时")


def validate_explicit_schema(space: str, vertices: list[Vertex]) -> dict[str, dict[str, str]]:
    schemas = ENTERPRISE_TAG_SCHEMAS if space == ENTERPRISE_SPACE else TOPIC_TAG_SCHEMAS
    actual_tags = {vertex.entity_type for vertex in vertices}
    if actual_tags != set(schemas):
        raise RuntimeError(
            f"{space} Tag Schema 与数据不一致，缺少={actual_tags - set(schemas)}，"
            f"多余={set(schemas) - actual_tags}"
        )
    for vertex in vertices:
        unknown = set(vertex_properties(vertex)) - set(schemas[vertex.entity_type])
        if unknown:
            raise RuntimeError(f"{vertex.entity_type} 存在未建模字段：{sorted(unknown)}")
    return schemas


def create_explicit_schema(
    client: TrsGraphClient, space: str, vertices: list[Vertex], edges: list[Edge],
) -> tuple[dict[str, list[str]], list[str], list[str]]:
    schemas = validate_explicit_schema(space, vertices)
    edge_types = sorted({edge.relation_type for edge in edges})
    index_names: list[str] = []
    edge_index_names: list[str] = []
    tag_fields: dict[str, list[str]] = {}

    for tag in sorted(schemas):
        fields = schemas[tag]
        tag_fields[tag] = list(fields)
        definitions = ", ".join(f"`{name}` {field_type}" for name, field_type in fields.items())
        client.execute(
            f"USE `{space}`; CREATE TAG IF NOT EXISTS `{tag}` ({definitions}) "
            f"COMMENT={gql_string(tag + '节点')};"
        )
    for edge_type in edge_types:
        definitions = ", ".join(
            f"`{name}` {field_type}" for name, field_type in EDGE_SCHEMA.items()
        )
        client.execute(
            f"USE `{space}`; CREATE EDGE IF NOT EXISTS `{edge_type}` ({definitions}) "
            f"COMMENT={gql_string(edge_type + '关系')};"
        )
    time.sleep(22)

    for tag, fields in tag_fields.items():
        code = schema_code(tag)
        for field, length in (("name", 128), ("domain", 64)):
            if field not in fields:
                continue
            index = f"idx_{code}_{field}"
            client.execute(
                f"USE `{space}`; CREATE TAG INDEX IF NOT EXISTS `{index}` "
                f"ON `{tag}`(`{field}`({length}));"
            )
            index_names.append(index)
        if "year" in fields:
            index = f"idx_{code}_year"
            client.execute(
                f"USE `{space}`; CREATE TAG INDEX IF NOT EXISTS `{index}` ON `{tag}`(`year`);"
            )
            index_names.append(index)
    for edge_type in edge_types:
        index = f"idx_edge_{schema_code(edge_type)}_year"
        client.execute(
            f"USE `{space}`; CREATE EDGE INDEX IF NOT EXISTS `{index}` "
            f"ON `{edge_type}`(`year`);"
        )
        edge_index_names.append(index)
    time.sleep(22)
    return tag_fields, index_names, edge_index_names


def insert_graph(
    client: TrsGraphClient, space: str, vertices: list[Vertex], edges: list[Edge],
) -> None:
    recreate_space(client, space)
    tag_fields, index_names, edge_index_names = create_explicit_schema(
        client, space, vertices, edges,
    )
    grouped_vertices: dict[str, list[Vertex]] = defaultdict(list)
    for vertex in vertices:
        grouped_vertices[vertex.entity_type].append(vertex)
    for tag, tag_vertices in grouped_vertices.items():
        fields = tag_fields[tag]
        for batch in chunks(tag_vertices, 40):
            values = []
            for vertex in batch:
                props = vertex_properties(vertex)
                values.append(
                    f"{gql_string(vertex.vid)}:("
                    + ",".join(gql_string(props.get(field)) for field in fields) + ")"
                )
            client.execute(
                f"USE `{space}`; INSERT VERTEX `{tag}`("
                + ",".join(f"`{field}`" for field in fields)
                + ") VALUES " + ",".join(values) + ";"
            )
    ranks: defaultdict[tuple[str, str, str], int] = defaultdict(int)
    ranked_edges: list[tuple[Edge, int]] = []
    for edge in edges:
        key = (edge.relation_type, edge.src, edge.dst)
        rank = ranks[key]
        ranks[key] += 1
        ranked_edges.append((edge, rank))
    grouped_edges: dict[str, list[tuple[Edge, int]]] = defaultdict(list)
    for edge, rank in ranked_edges:
        grouped_edges[edge.relation_type].append((edge, rank))
    for edge_type, type_edges in grouped_edges.items():
        for batch in chunks(type_edges, 40):
            values = []
            for edge, rank in batch:
                values.append(
                    f"{gql_string(edge.src)}->{gql_string(edge.dst)}@{rank}:("
                    f"{gql_string(edge.label)},{int(edge.year)},"
                    f"{float(edge.weight)},{gql_string(SEED)})"
                )
            client.execute(
                f"USE `{space}`; INSERT EDGE `{edge_type}`("
                "`label`,`year`,`weight`,`seed_batch`) VALUES "
                + ",".join(values) + ";"
            )
    stats_job = client.execute(f"USE `{space}`; SUBMIT JOB STATS;")
    print(
        f"{space}: {len(vertices)} 个节点，{len(edges)} 条边，"
        f"{len(tag_fields)} 类节点，{len(grouped_edges)} 类关系，"
        f"{len(index_names)} 个点索引，{len(edge_index_names)} 个边索引"
    )
    if stats_job.get("data", {}).get("tables"):
        time.sleep(5)


def verify_graph(
    client: TrsGraphClient, space: str, anchor_vid: str, expected_edges: int,
) -> None:
    vertex = client.execute(
        f"USE `{space}`; FETCH PROP ON `企业` {gql_string(anchor_vid)} "
        "YIELD properties(vertex);"
    )
    tables = vertex.get("data", {}).get("tables", [])
    if not tables:
        raise RuntimeError(f"{space} 验收失败：锚点 {anchor_vid} 不存在")
    adjacency = client.execute(
        f"USE `{space}`; GO FROM {gql_string(anchor_vid)} OVER * "
        "YIELD type(edge) AS relation_type, dst(edge) AS target;"
    )
    actual_edges = len(adjacency.get("data", {}).get("tables", []))
    if actual_edges < expected_edges:
        raise RuntimeError(
            f"{space} 验收失败：锚点出边 {actual_edges}，期望至少 {expected_edges}"
        )
    tags = client.execute(f"USE `{space}`; SHOW TAGS;")
    edge_types = client.execute(f"USE `{space}`; SHOW EDGES;")
    tag_indexes = client.execute(f"USE `{space}`; SHOW TAG INDEXES;")
    edge_indexes = client.execute(f"USE `{space}`; SHOW EDGE INDEXES;")
    tag_count = len(tags.get("data", {}).get("tables", []))
    edge_type_count = len(edge_types.get("data", {}).get("tables", []))
    tag_index_count = len(tag_indexes.get("data", {}).get("tables", []))
    edge_index_count = len(edge_indexes.get("data", {}).get("tables", []))
    if not tag_index_count or not edge_index_count:
        raise RuntimeError(f"{space} 验收失败：索引为空")
    print(
        f"{space}: 锚点出边 {actual_edges}，Tag {tag_count}，Edge Type {edge_type_count}，"
        f"Tag Index {tag_index_count}，Edge Index {edge_index_count}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="实际写入 TRS")
    parser.add_argument("--dry-run", action="store_true", help="仅统计待写入图数据")
    args = parser.parse_args()
    if args.apply == args.dry_run:
        parser.error("--apply 和 --dry-run 必须且只能指定一个")

    mysql = pymysql.connect(
        **mysql_config(), charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor, connect_timeout=15, read_timeout=180,
    )
    try:
        with mysql.cursor() as cur:
            enterprise_vertices, enterprise_edges = build_enterprise_graph(cur)
            topic_vertices, topic_edges = build_topic_graph(cur)
    finally:
        mysql.close()

    for schema_name in {
        *(vertex.entity_type for vertex in enterprise_vertices + topic_vertices),
        *(edge.relation_type for edge in enterprise_edges + topic_edges),
    }:
        schema_code(schema_name)
    validate_explicit_schema(ENTERPRISE_SPACE, enterprise_vertices)
    validate_explicit_schema(TOPIC_SPACE, topic_vertices)
    print(f"{ENTERPRISE_SPACE}: 待写入 {len(enterprise_vertices)} 节点/{len(enterprise_edges)} 边")
    print(f"{TOPIC_SPACE}: 待写入 {len(topic_vertices)} 节点/{len(topic_edges)} 边")
    if args.dry_run:
        return

    trs_password = os.getenv("TRS_GRAPH_PASSWORD")
    if not trs_password:
        raise RuntimeError("缺少 TRS_GRAPH_PASSWORD")
    client = TrsGraphClient(
        os.getenv("TRS_GRAPH_HOST", "http://114.117.127.200:7001"),
        os.getenv("TRS_GRAPH_USER", "root"),
        trs_password,
        os.getenv("TRS_GRAPH_ADDR", "127.0.0.1"),
        int(os.getenv("TRS_GRAPH_PORT", "9669")),
    )
    try:
        insert_graph(client, ENTERPRISE_SPACE, enterprise_vertices, enterprise_edges)
        insert_graph(client, TOPIC_SPACE, topic_vertices, topic_edges)
        verify_graph(client, ENTERPRISE_SPACE, "PROTO_ORG_MED001", 10)
        verify_graph(client, TOPIC_SPACE, "PROTO_ORG_MED001", 4)
    finally:
        client.close()


if __name__ == "__main__":
    main()
