#!/usr/bin/env python3
"""为原型功能生成可重复、可回滚的跨领域知识图谱测试数据。"""

from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import pymysql


SEED = "prototype_seed_20260828"
NOW = "2026-08-28 12:00:00"
CORE_TABLES = [
    "dwd_org_executive_info",
    "dwd_org_shareholder_info",
    "dwd_org_subsidiary_info",
    "dwd_org_invest_info",
    "dwd_org_merger_acquisition_info",
    "dwd_org_tech_tag",
    "dwd_corp_his_sw_ic",
    "dwd_org_important_news_info",
    "dwd_org_company_punish",
    "dwd_org_stock_finance_info",
    "dwd_org_annual_financial_info",
    "dwd_org_industry_product_tags",
    "dwd_org_industry_tags",
    "dwd_org_sc_info",
    "dwd_scholar_work_experience",
    "dwd_scholar_coauthor",
    "dwd_scholar_research_direction",
    "dwd_scholar_paper_relation",
    "dwd_scholar",
    "dwd_zh_author",
    "dwd_zh_paper_citation",
    "dwd_zh_paper_classification",
    "dwd_zh_paper",
    "dwd_zh_journal",
    "dwd_patent_title",
    "dwd_patent_abstract",
    "dwd_patent_applicants",
    "dwd_patent_assignees",
    "dwd_patent_inventors",
    "dwd_patent_legal",
    "dwd_substance_paper",
    "dwd_substance_patent",
    "dwd_patent",
    "dwd_drug_profile",
    "dwd_drug",
    "dwd_drug_substance",
    "dwd_clinical_trial",
    "dwd_clinical",
    "dwd_event",
    "dwd_org_base_info",
]

DOMAINS = {
    "medical": {
        "label": "医疗专题",
        "scope": "生物医学与健康",
        "topic": "精准诊疗",
        "methods": ["医学影像AI", "多组学分析", "临床决策支持"],
        "journal": ("PROTO_J_MED", "智慧医疗研究"),
        "companies": [
            ("MED001", "华研精准医疗科技有限公司", "精准医疗", "陈明远", "深圳市", "基因检测平台"),
            ("MED002", "南方智药生物科技有限公司", "创新药研发", "林若溪", "广州市", "靶向药物"),
            ("MED003", "康图医学影像科技有限公司", "医疗器械", "周启航", "珠海市", "医学影像诊断系统"),
        ],
    },
    "chemical": {
        "label": "化学专题",
        "scope": "化学与材料科学",
        "topic": "绿色化学",
        "methods": ["分子模拟", "绿色催化", "高通量筛选"],
        "journal": ("PROTO_J_CHEM", "先进化学材料"),
        "companies": [
            ("CHEM001", "粤科先进材料有限公司", "先进材料", "许博文", "佛山市", "高性能复合材料"),
            ("CHEM002", "华南绿色催化科技有限公司", "精细化工", "唐思源", "广州市", "低碳催化剂"),
            ("CHEM003", "湾区高分子技术有限公司", "高分子材料", "何嘉宁", "东莞市", "可降解高分子"),
        ],
    },
    "ocean": {
        "label": "海洋专题",
        "scope": "海洋科学与工程",
        "topic": "智慧海洋",
        "methods": ["水下机器人", "海洋遥感", "生态监测"],
        "journal": ("PROTO_J_OCEAN", "海洋科技前沿"),
        "companies": [
            ("OCEAN001", "蓝海智能装备有限公司", "海洋工程装备", "沈澜", "深圳市", "深海巡检机器人"),
            ("OCEAN002", "深湾海洋生物科技有限公司", "海洋生物", "梁海峰", "湛江市", "海洋活性物提取物"),
        ],
    },
    "quantum": {
        "label": "量子专题",
        "scope": "量子信息科学",
        "topic": "量子科技",
        "methods": ["量子计算", "量子通信", "量子精密测量"],
        "journal": ("PROTO_J_QUANT", "量子信息前沿"),
        "companies": [
            ("QUANT001", "量芯计算科技有限公司", "量子计算", "顾星河", "深圳市", "超导量子芯片"),
            ("QUANT002", "粤港量子通信有限公司", "量子通信", "叶知微", "广州市", "量子密钥分发设备"),
        ],
    },
}


def parse_config(path: Path) -> dict[str, Any]:
    env_values = {
        "host": os.getenv("GKX_DB_HOST"),
        "port": os.getenv("GKX_DB_PORT"),
        "user": os.getenv("GKX_DB_USER"),
        "password": os.getenv("GKX_DB_PASSWORD"),
        "database": os.getenv("GKX_DB_NAME"),
    }
    if all(env_values.values()):
        return {
            "host": env_values["host"],
            "port": int(str(env_values["port"])),
            "user": env_values["user"],
            "password": env_values["password"],
            "database": env_values["database"],
        }
    result: dict[str, str] = {}
    pattern = re.compile(r"^\s*(Host|Port|User|Password|Database)\s*[:：]\s*(.+?)\s*$", re.I)
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = pattern.match(line)
        if match:
            result[match.group(1).lower()] = match.group(2)
    missing = {"host", "port", "user", "password", "database"} - result.keys()
    if missing:
        raise ValueError(f"连接配置缺少字段：{', '.join(sorted(missing))}")
    return {
        "host": result["host"],
        "port": int(result["port"]),
        "user": result["user"],
        "password": result["password"],
        "database": result["database"],
    }


def meta(data_source: bool = False) -> dict[str, Any]:
    result = {
        "created_time": NOW,
        "updated_time": NOW,
        "creater": SEED,
        "updater": SEED,
        "table_data_source": SEED,
        "operator_remarks": "原型功能测试数据",
        "is_deleted": 0,
        "insert_remark": 2,
    }
    if data_source:
        result["data_source"] = SEED
    return result


def org_id(code: str) -> str:
    return f"PROTO_ORG_{code}"


def credit(code: str) -> str:
    return f"PROTO20260828{code}"


def build_rows() -> dict[str, list[dict[str, Any]]]:
    rows: dict[str, list[dict[str, Any]]] = {table: [] for table in CORE_TABLES}
    core_companies: list[dict[str, Any]] = []
    domain_papers: dict[str, list[int]] = {}
    domain_patents: dict[str, list[str]] = {}

    investor_defs = [
        ("INV001", "湾区科技产业投资有限公司", "产业投资"),
        ("INV002", "南方科创成果转化有限公司", "成果转化"),
        ("INV003", "粤港前沿技术基金管理有限公司", "股权投资"),
        ("INV004", "珠江创新资本有限公司", "创业投资"),
    ]
    for code, name, industry in investor_defs:
        rows["dwd_org_base_info"].append({
            "org_id": org_id(code), "name_cn": name, "incorporation_date": "2015-01-08",
            "lerep": "原型投资人", "org_type": "有限责任公司", "registration_org": "原型测试登记机关",
            "start_date": "2015-01-08", "end_date": "长期", "registered_capital_value": 500_000_000,
            "address": "广东省广州市南沙区科创大道", "province": "广东省", "city": "广州市",
            "external_id": credit(code), "reg_status": "存续", "incorporation_year": 2015,
            "industry": industry, "industry_l1_name": "金融业", "industry_l2_name": industry,
            "org_size": "100-499人", **meta(True),
        })

    company_index = 0
    for domain_key, domain in DOMAINS.items():
        journal_id, journal_name = domain["journal"]
        rows["dwd_zh_journal"].append({
            "pk_id": 9_000 + company_index, "publication_id": journal_id,
            "publication_type": "期刊", "country": "中国", "zh_name": journal_name,
            "en_name": f"Frontiers of {domain['scope']}", "issn": f"27{company_index:02d}-2026",
            "founding_time": 2018, "zh_description": f"{domain['label']}原型期刊",
            "impact_score": 8.2 + company_index / 10, "jn_zone": "Q1", "publication_cycle": "月刊",
            "paper_nums": 1200 + company_index * 10, **meta(),
        })

        paper_ids: list[int] = []
        patent_ids: list[str] = []
        scholars: list[tuple[str, str, str]] = []
        for local_idx, (code, name, industry, legal_rep, city, product) in enumerate(domain["companies"], 1):
            company_index += 1
            oid = org_id(code)
            core = {
                "code": code, "org_id": oid, "name": name, "industry": industry,
                "legal_rep": legal_rep, "city": city, "product": product,
                "domain": domain_key, "domain_label": domain["label"],
            }
            core_companies.append(core)
            founded_year = 2011 + company_index
            rows["dwd_org_base_info"].append({
                "org_id": oid, "name_cn": name, "incorporation_date": f"{founded_year}-05-18",
                "lerep": legal_rep, "org_type": "其他有限责任公司", "registration_org": f"{city}市场监督管理局",
                "start_date": f"{founded_year}-05-18", "end_date": "长期",
                "registered_capital_value": (80 + company_index * 12) * 1_000_000,
                "address": f"广东省{city}科技创新园{company_index}号", "province": "广东省", "city": city,
                "external_id": credit(code), "area": "高新区", "addr_lng": str(113.2 + company_index / 100),
                "addr_lat": str(22.5 + company_index / 100), "email": f"contact@{code.lower()}.example",
                "reg_status": "存续", "incorporation_year": founded_year, "listing_status": "未上市",
                "capital_currency": "CNY", "industry": industry, "industry_l1_name": "科学研究和技术服务业",
                "industry_l2_name": industry, "phone_num": f"0755-88{company_index:06d}",
                "org_size": "500-999人", **meta(True),
            })

            sub_code = f"{code}SUB"
            sub_name = f"{name[:-4]}应用技术有限公司"
            rows["dwd_org_base_info"].append({
                "org_id": org_id(sub_code), "name_cn": sub_name, "incorporation_date": "2021-06-01",
                "lerep": f"{legal_rep}团队", "org_type": "有限责任公司", "registration_org": f"{city}市场监督管理局",
                "start_date": "2021-06-01", "end_date": "长期", "registered_capital_value": 20_000_000,
                "address": f"广东省{city}科技创新园", "province": "广东省", "city": city,
                "external_id": credit(sub_code), "reg_status": "存续", "incorporation_year": 2021,
                "industry": industry, "industry_l1_name": "科学研究和技术服务业",
                "industry_l2_name": industry, "org_size": "100-499人", **meta(True),
            })

            for exec_idx, (person, position) in enumerate([
                (legal_rep, "董事长兼总经理"), (f"{domain['topic']}专家{company_index}", "首席科学家")
            ], 1):
                rows["dwd_org_executive_info"].append({
                    "org_id": oid, "name_cn": name, "external_id": credit(code),
                    "executives_name": person, "executives_position": position, **meta(True),
                })
                scholar_id = f"PROTO_S_{code}_{exec_idx}"
                scholars.append((scholar_id, person, oid))
                rows["dwd_scholar"].append({
                    "id": 80_000 + company_index * 10 + exec_idx, "scholar_id": scholar_id,
                    "name_en": f"Prototype Researcher {company_index}-{exec_idx}", "name_zh": person,
                    "scholar_org_name_zh": name, "scholar_department_name_zh": "研发中心",
                    "scholar_org_id": oid, "orc_id": f"0000-0002-{company_index:04d}-{exec_idx:04d}",
                    "bio_zh": f"{domain['label']}{domain['topic']}方向原型学者",
                    "paper_nums": 8 + exec_idx, "citation_nums": 120 + company_index * 7,
                    "h_index": 8 + exec_idx, "status": 1, "create_time": NOW, **meta(),
                })
                rows["dwd_scholar_research_direction"].append({
                    "id": 90_000 + company_index * 10 + exec_idx, "scholar_id": scholar_id,
                    "fields": json.dumps([domain["topic"], domain["methods"][exec_idx % 3]], ensure_ascii=False),
                    "create_time": NOW, **meta(),
                })
                rows["dwd_scholar_work_experience"].append({
                    "id": 100_000 + company_index * 10 + exec_idx, "scholar_id": scholar_id, "seq_no": 1,
                    "start_time": f"{2017 + exec_idx}-01", "end_time": "2021-12", "is_current": "0",
                    "org_name_zh": f"{domain['scope']}联合实验室", "department_name_zh": "研究部",
                    "position_zh": "研究员", "status": 1, "create_time": NOW, "update_time": NOW, **meta(),
                })
                rows["dwd_scholar_work_experience"].append({
                    "id": 110_000 + company_index * 10 + exec_idx, "scholar_id": scholar_id, "seq_no": 2,
                    "start_time": "2022-01", "end_time": None, "is_current": "1",
                    "org_name_zh": name, "department_name_zh": "研发中心",
                    "position_zh": position, "status": 1, "create_time": NOW, "update_time": NOW, **meta(),
                })

            investor = investor_defs[(company_index - 1) % len(investor_defs)]
            rows["dwd_org_shareholder_info"].append({
                "org_id": oid, "name_cn": name, "external_id": credit(code),
                "inv_org_id": org_id(investor[0]), "owners_name": investor[1],
                "owners_type": "企业法人", "ownership_percentage": 28 + local_idx, **meta(True),
            })
            rows["dwd_org_subsidiary_info"].append({
                "org_id": oid, "name_cn": name, "external_id": credit(code),
                "sub_org_id": org_id(sub_code), "sub_name_cn": sub_name,
                "sub_external_id": credit(sub_code), **meta(True),
            })
            rows["dwd_org_invest_info"].append({
                "org_id": oid, "name_cn": name, "external_id": credit(code),
                "inv_org_id": org_id(sub_code), "inv_name": sub_name, "inv_external_id": credit(sub_code),
                "investment_amount": (20 + company_index) * 1_000_000,
                "investment_ratio": 65 + local_idx, **meta(True),
            })
            rows["dwd_org_merger_acquisition_info"].append({
                "acquiring_org_id": oid, "acquiring_name": name,
                "acquired_org_id": org_id(sub_code), "acquired_name": sub_name,
                "ma_amount": (30 + company_index) * 1_000_000, "currency_code": "CNY",
                "acquiring_external_id": credit(code), "acquired_external_id": credit(sub_code), **meta(True),
            })

            for tag in [domain["label"], domain["topic"], domain["methods"][local_idx % 3]]:
                rows["dwd_org_tech_tag"].append({"org_id": oid, "org_tag": tag, **meta(True)})

            history = [
                (2018, f"{industry}基础研发", 0),
                (2021, f"{industry}技术服务", 0),
                (2024, industry, 1),
            ]
            for year, history_name, latest in history:
                rows["dwd_corp_his_sw_ic"].append({
                    "org_id": oid, "name_cn": name, "external_id": credit(code),
                    "industry_type": "申万行业", "industry_level": 3,
                    "inclusion_date": f"{year}-01-01",
                    "eliminate_date": None if latest else f"{year + 2}-12-31",
                    "industry_code": f"{domain_key.upper()}{year}", "industry_name": history_name,
                    "lastest_symbol": latest, **meta(True),
                })

            for news_idx, year in enumerate(range(2022, 2026), 1):
                rows["dwd_org_important_news_info"].append({
                    "org_id": oid, "name_cn": name, "external_id": credit(code),
                    "news_title": f"{name}{year}年{domain['methods'][news_idx % 3]}研发里程碑",
                    "news_date": f"{year}-{2 + news_idx:02d}-15",
                    "news_content": f"原型数据：{product}完成第{news_idx}阶段验证，展示企业技术演进时间轴。",
                    "original_textlink": f"https://prototype.example/{code}/news/{year}",
                    **meta(True),
                })

            rows["dwd_org_company_punish"].append({
                "org_id": oid, "name_cn": name, "external_id": credit(code),
                "penalty_id": f"PROTO_PENALTY_{code}", "decision_no": f"原型合规提示〔2025〕{company_index:03d}号",
                "violation_type": "原型模拟：研发项目资料归档不完整",
                "penalty_content": "原型模拟数据，仅用于风险面板展示，不代表真实处罚。",
                "decision_org": "原型测试机构", "penalty_date": "2025-03-20",
                "public_date": "2025-03-25", "penalty_type": "整改提示", "fine_amount": "0",
                **meta(True),
            })

            base_revenue = (8 + company_index * 2) * 100_000_000
            for year in range(2021, 2026):
                growth = 1 + (year - 2021) * 0.16
                revenue = round(base_revenue * growth)
                profit = round(revenue * (0.08 + company_index / 1000))
                employees = 260 + company_index * 35 + (year - 2021) * 28
                common_finance = {
                    "org_id": oid, "name_cn": name, "external_id": credit(code),
                    "total_assets": revenue * 1.65, "fixed_assets": revenue * 0.42,
                    "total_liabilities": revenue * 0.68, "operating_revenue": revenue,
                    "main_business_revenue": revenue * 0.92, "total_profit": profit * 1.12,
                    "pure_profit": profit, "total_tax_paid": profit * 0.12,
                    "owners_equity": revenue * 0.97, "employees_number": employees,
                }
                rows["dwd_org_annual_financial_info"].append({
                    **common_finance, "year": year, "arch_development_am": revenue * 0.18,
                    "development_employee": round(employees * 0.35), **meta(True),
                })
                rows["dwd_org_stock_finance_info"].append({
                    **common_finance, "stock_code": f"PROTO{company_index:04d}",
                    "occur_period": f"{year}-12-31", "oper_cash_flow": profit * 1.08,
                    "research_development_amount": revenue * 0.18, **meta(True),
                })

            for product_idx, product_name in enumerate([product, f"{domain['topic']}数据平台"], 1):
                rows["dwd_org_industry_product_tags"].append({
                    "id": f"PROTO_PRODUCT_{code}_{product_idx}",
                    "industry_link_code": f"{domain_key.upper()}-L{product_idx}",
                    "industry_link_name": "上游核心技术" if product_idx == 1 else "下游应用服务",
                    "industry_code": domain_key.upper(), "industry_name": domain["label"],
                    "company_id": oid, "company_name": name, "credit_code": credit(code),
                    "product_name": product_name, "product_top5": "1", **meta(),
                })
            rows["dwd_org_industry_tags"].append({
                "id": f"PROTO_IND_{code}", "industry_link_code": f"{domain_key.upper()}-CHAIN",
                "industry_link_name": f"{domain['topic']}产业链", "industry_code": domain_key.upper(),
                "industry_name": domain["label"], "company_name": name, "credit_code": credit(code), **meta(),
            })
            for sc_type, partner_idx in [("上游", 1), ("下游", 2)]:
                rows["dwd_org_sc_info"].append({
                    "id": f"PROTO_SC_{code}_{partner_idx}", "company_name": name,
                    "credit_code": credit(code), "type": sc_type,
                    "name": f"{domain['topic']}{sc_type}合作方{company_index}",
                    "code": f"{domain_key.upper()}-SC-{company_index:02d}-{partner_idx}", **meta(),
                })

            for patent_idx in range(1, 3):
                patent_id = f"PROTO_PAT_{code}_{patent_idx}"
                patent_ids.append(patent_id)
                year = 2021 + patent_idx + (company_index % 3)
                pn = f"CNPROTO{company_index:03d}{patent_idx}A"
                title = f"一种面向{domain['topic']}的{domain['methods'][(patent_idx - 1) % 3]}方法及系统"
                rows["dwd_patent"].append({
                    "patent_id": patent_id, "pn": pn, "publication_number": pn, "kind": "A",
                    "country_code": "CN", "country": "中国", "publication_reference_kind": "A",
                    "pbdt": int(f"{year}0615"), "pbdt_year": year, "pbdt_month": 6,
                    "apno": f"CNPROTOAPP{company_index:03d}{patent_idx}",
                    "application_country": "CN", "apdt": int(f"{year - 1}1010"),
                    "apdt_year": year - 1, "apdt_month": 10,
                    "first_applicant_name": name, "first_current_assignee_name": name,
                    "first_inventor_name": legal_rep, "main_classification_ipcr": f"G06N{company_index:02d}/00",
                    "technology_topic_data": json.dumps([domain["topic"], domain["methods"][patent_idx]], ensure_ascii=False),
                    "language": "zh", "granted_number": f"CNPROTOGRANT{company_index:03d}{patent_idx}",
                    "value": 70 + company_index, **meta(),
                })
                rows["dwd_patent_title"].append({
                    "patent_id": patent_id, "pn": pn,
                    "titles": json.dumps([{"lang": "zh", "text": title}], ensure_ascii=False),
                    "title_en": f"Prototype method for {domain['topic']}",
                    "title_trans_cn": title, **meta(),
                })
                rows["dwd_patent_abstract"].append({
                    "patent_id": patent_id, "pn": pn,
                    "abstracts": json.dumps([{"lang": "zh", "text": f"用于展示{domain['label']}技术链的原型专利摘要。"}], ensure_ascii=False),
                    "abstract_trans_cn": f"本发明构建从科研成果、核心技术、专利到产品的{domain['label']}转化路径。",
                    **meta(),
                })
                for table in ("dwd_patent_applicants", "dwd_patent_assignees"):
                    rows[table].append({
                        "patent_id": patent_id, "pn": pn, "sequence": 1, "name": name, **meta(),
                    })
                rows["dwd_patent_inventors"].append({
                    "patent_id": patent_id, "pn": pn, "sequence": 1, "name": legal_rep, **meta(),
                })

        domain_patents[domain_key] = patent_ids

        for paper_idx, year in enumerate(range(2019, 2026), 1):
            paper_id = 8_800_000 + len(domain_papers) * 100 + paper_idx
            paper_ids.append(paper_id)
            method = domain["methods"][(paper_idx - 1) % 3]
            title = f"{method}驱动的{domain['topic']}关键技术研究与应用"
            rows["dwd_zh_paper"].append({
                "pk_id": paper_id, "id": str(paper_id),
                "doi": f"10.2026/prototype.{domain_key}.{paper_idx}",
                "en_name": f"{method} for {domain['topic']}: prototype study {paper_idx}",
                "zh_name": title, "publication_id": journal_id, "paper_type": "期刊论文",
                "publication_type": "期刊", "publication_zh_name": journal_name,
                "issn": f"27{len(domain_papers):02d}-2026", "volume": str(year - 2018),
                "issue": str(paper_idx), "first_page": str(10 * paper_idx),
                "last_page": str(10 * paper_idx + 8), "cover_year_start": str(year),
                "cover_date_start": f"{year}-06-15", "language_classify": 1,
                "abstract_available": 1, "open_access": 1,
                "paper_url": f"https://prototype.example/paper/{paper_id}",
                "data_source": SEED, "download_num": 120 + paper_idx * 35,
                "author_info_list": json.dumps([s[1] for s in scholars[:2]], ensure_ascii=False),
                **meta(),
            })
            rows["dwd_zh_paper_classification"].append({
                "pk_id": paper_id, "id": str(paper_id), "scope": domain["scope"],
                "scope_zone": domain["topic"],
                "keywords": json.dumps([domain["topic"], method, domain["label"]], ensure_ascii=False), **meta(),
            })
            previous = paper_ids[:-1][-3:]
            rows["dwd_zh_paper_citation"].append({
                "pk_id": paper_id, "id": str(paper_id),
                "doi": f"10.2026/prototype.{domain_key}.{paper_idx}",
                "citation_num": 20 + paper_idx * 13,
                "citation_content": f"{title}的原型引用关系",
                "citation_id_list": json.dumps([str(p) for p in previous]), **meta(),
            })
            for author_idx, (scholar_id, scholar_name, scholar_org) in enumerate(scholars[:2], 1):
                rows["dwd_zh_author"].append({
                    "pk_id": paper_id * 10 + author_idx, "paper_id": str(paper_id),
                    "author_sequence": author_idx, "author_id": scholar_id,
                    "en_name": f"Prototype Author {author_idx}", "zh_name": scholar_name,
                    "correspond": 1 if author_idx == 1 else 0,
                    "institution": next(c["name"] for c in core_companies if c["org_id"] == scholar_org),
                    "affiliation": json.dumps([scholar_org]), **meta(),
                })
                rows["dwd_scholar_paper_relation"].append({
                    "id": paper_id * 10 + author_idx, "paper_id": paper_id,
                    "related_paper_id": paper_id, "year": year, "scholar_id": scholar_id,
                    "citations": 20 + paper_idx * 13, "publish_time": f"{year}-06-15 00:00:00",
                    "status": 1, "create_time": NOW, "update_time": NOW,
                    "publication_id": 9_000 + len(domain_papers), **meta(),
                })
        domain_papers[domain_key] = paper_ids

        for idx in range(0, max(0, len(scholars) - 1), 2):
            left, right = scholars[idx], scholars[idx + 1]
            rows["dwd_scholar_coauthor"].extend([
                {
                    "id": 120_000 + idx + len(rows["dwd_scholar_coauthor"]), "scholar_id": left[0],
                    "co_scholar_id": right[0], "co_scholar_name_zh": right[1],
                    "co_scholar_org_id": right[2], "co_paper_count": 3,
                    "status": 1, "create_time": NOW, "update_time": NOW, **meta(),
                },
                {
                    "id": 130_000 + idx + len(rows["dwd_scholar_coauthor"]), "scholar_id": right[0],
                    "co_scholar_id": left[0], "co_scholar_name_zh": left[1],
                    "co_scholar_org_id": left[2], "co_paper_count": 3,
                    "status": 1, "create_time": NOW, "update_time": NOW, **meta(),
                },
            ])

        for event_idx, year in enumerate((2020, 2023, 2026), 1):
            rows["dwd_event"].append({
                "id": f"PROTO_EVENT_{domain_key.upper()}_{event_idx}",
                "event_name": f"{domain['label']}{domain['topic']}第{event_idx}阶段成果发布",
                "organizer": domain["companies"][0][1],
                "start_date": f"{year}-08-01", "end_date": f"{year}-08-03",
                "event_url": f"https://prototype.example/{domain_key}/event/{event_idx}", **meta(),
            })

    medical_papers = domain_papers["medical"]
    medical_patents = domain_patents["medical"]
    substances = [
        ("PROTO_SUB_MET", "二甲双胍", "C4H11N5", "CN(C)C(=N)N=C(N)N"),
        ("PROTO_SUB_INS", "胰岛素类似物", "C257H383N65O77S6", "PROTEIN"),
        ("PROTO_SUB_CAS", "候选靶向分子PX-01", "C21H24N4O3", "CC1=NN(C)C(=O)C1"),
        ("PROTO_SUB_CAT", "低碳催化剂CAT-01", "Pt/CeO2", "[Pt].[O-][Ce+3]=O"),
        ("PROTO_SUB_POLY", "可降解聚合物单体", "C6H8O4", "O=C(O)CC=CC(=O)O"),
        ("PROTO_SUB_OCEAN", "海洋活性肽MBP-2", "C38H61N9O12", "PEPTIDE"),
    ]
    for idx, (sid, name, formula, smiles) in enumerate(substances, 1):
        rows["dwd_drug_substance"].append({
            "id": sid, "molecular_name": name, "formula": formula,
            "in_chi_key": f"PROTOINCHIKEY{idx:02d}", "in_chi": f"InChI=1S/{formula}",
            "std_smiles": smiles, **meta(),
        })
        rows["dwd_substance_paper"].append({
            "id": 200_000 + idx, "substance_id": sid,
            "paper_id": medical_papers[(idx - 1) % len(medical_papers)], **meta(),
        })
        rows["dwd_substance_patent"].append({
            "id": 210_000 + idx, "substance_id": sid,
            "patent_id": medical_patents[(idx - 1) % len(medical_patents)], **meta(),
        })

    diseases = [
        ("PROTO_DISEASE_01", "2型糖尿病", "多饮、多尿、疲劳", "胰岛素抵抗相关基因"),
        ("PROTO_DISEASE_02", "非小细胞肺癌", "咳嗽、胸痛", "EGFR,ALK"),
        ("PROTO_DISEASE_03", "阿尔茨海默病", "记忆减退、认知障碍", "APOE,TREM2"),
    ]
    for idx, (did, name, symptoms, genes) in enumerate(diseases, 1):
        rows["dwd_clinical"].append({
            "id": did, "disease_name": name, "phenotype_id": f"HP:PROTO{idx:04d}",
            "phenotype_name": symptoms.split("、")[0], "associated_gene": genes,
            "references": json.dumps([str(medical_papers[idx - 1])]),
            "disease_category": "慢性病" if idx != 2 else "肿瘤",
            "symptoms": symptoms, "related_disease": "原型关联疾病", **meta(),
        })
        rows["dwd_clinical_trial"].append({
            "id": f"PROTO_TRIAL_{idx:02d}", "trial_title": f"{name}智能分层诊疗原型研究",
            "disease_name": json.dumps([name], ensure_ascii=False), "nct_id": f"NCTPROTO{idx:04d}",
            "overall_status": "RECRUITING" if idx == 1 else "COMPLETED",
            "brief_summary": f"基于多模态数据评估{name}诊疗方案，仅用于原型展示。",
            "conditions": json.dumps([name, "精准诊疗"], ensure_ascii=False),
            "enrollment_count": 120 + idx * 40, "sex": "ALL", **meta(),
        })

    drugs = [
        ("PROTO_DRUG_01", "二甲双胍缓释片", "二甲双胍", "口服", "片剂", "华研精准医疗科技有限公司"),
        ("PROTO_DRUG_02", "PX-01靶向制剂", "候选靶向分子PX-01", "口服", "胶囊", "南方智药生物科技有限公司"),
        ("PROTO_DRUG_03", "神经保护候选药NP-2", "海洋活性肽MBP-2", "注射", "注射剂", "深湾海洋生物科技有限公司"),
    ]
    for idx, (drug_id, drug_name, ingredient, route, form, sponsor) in enumerate(drugs, 1):
        rows["dwd_drug"].append({
            "id": drug_id, "application_number": f"PROTOAPPDRUG{idx:03d}",
            "drug_name": drug_name, "brand_name": f"原型药品{idx}", "generic_name": drug_name,
            "active_ingredients": ingredient, "route": route, "dosage_form": form,
            "application_type": "原型新药申请", "sponsor_name": sponsor,
            "create_time": NOW, **meta(),
        })
        rows["dwd_drug_profile"].append({
            "id": drug_id, "brand_name": f"原型药品{idx}",
            "indications_and_usage": diseases[idx - 1][1],
            "dosage_and_administration": "仅用于原型展示，不构成医疗建议",
            "mechanism_of_action": f"通过{ingredient}相关通路发挥作用",
            "contraindications": "原型数据", "warnings_and_cautions": "原型数据",
            "adverse_reactions": "原型数据", "substance_name": ingredient,
            "created_at": NOW, **meta(),
        })

    return rows


def table_columns(cur: Any, table: str) -> set[str]:
    cur.execute(f"SHOW COLUMNS FROM `{table}`")
    return {row["Field"] for row in cur.fetchall()}


def insert_rows(cur: Any, table: str, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0
    columns = table_columns(cur, table)
    filtered = [{key: value for key, value in row.items() if key in columns} for row in rows]
    keys = sorted(set().union(*(row.keys() for row in filtered)))
    placeholders = ", ".join(["%s"] * len(keys))
    sql = f"INSERT INTO `{table}` ({', '.join(f'`{key}`' for key in keys)}) VALUES ({placeholders})"
    cur.executemany(sql, [[row.get(key) for key in keys] for row in filtered])
    return len(filtered)


def remove_seed(cur: Any) -> dict[str, int]:
    removed: dict[str, int] = {}
    for table in CORE_TABLES:
        columns = table_columns(cur, table)
        if "table_data_source" not in columns:
            continue
        cur.execute(f"DELETE FROM `{table}` WHERE `table_data_source`=%s", (SEED,))
        removed[table] = cur.rowcount
    return removed


def verify(cur: Any) -> None:
    print("\n验收结果")
    checks = [
        ("标杆企业数", """
            SELECT COUNT(*) AS value FROM dwd_org_base_info o
            WHERE o.table_data_source=%s
              AND o.org_id LIKE 'PROTO_ORG_%%'
              AND o.org_id NOT LIKE '%%SUB'
              AND EXISTS(SELECT 1 FROM dwd_org_executive_info e WHERE BINARY e.org_id=BINARY o.org_id AND e.table_data_source=%s)
              AND EXISTS(SELECT 1 FROM dwd_org_shareholder_info s WHERE BINARY s.org_id=BINARY o.org_id AND s.table_data_source=%s)
              AND EXISTS(SELECT 1 FROM dwd_org_subsidiary_info s WHERE BINARY s.org_id=BINARY o.org_id AND s.table_data_source=%s)
              AND EXISTS(SELECT 1 FROM dwd_org_important_news_info n WHERE BINARY n.org_id=BINARY o.org_id AND n.table_data_source=%s)
              AND EXISTS(SELECT 1 FROM dwd_org_annual_financial_info f WHERE BINARY f.org_id=BINARY o.org_id AND f.table_data_source=%s)
        """, (SEED,) * 6),
        ("领域数", "SELECT COUNT(DISTINCT scope) AS value FROM dwd_zh_paper_classification WHERE table_data_source=%s", (SEED,)),
        ("论文数", "SELECT COUNT(*) AS value FROM dwd_zh_paper WHERE table_data_source=%s", (SEED,)),
        ("学者数", "SELECT COUNT(*) AS value FROM dwd_scholar WHERE table_data_source=%s", (SEED,)),
        ("专利数", "SELECT COUNT(*) AS value FROM dwd_patent WHERE table_data_source=%s", (SEED,)),
        ("企业年度时序点", "SELECT COUNT(*) AS value FROM dwd_org_annual_financial_info WHERE table_data_source=%s", (SEED,)),
        ("行业演变记录", "SELECT COUNT(*) AS value FROM dwd_corp_his_sw_ic WHERE table_data_source=%s", (SEED,)),
        ("领域事件时间轴", "SELECT COUNT(*) AS value FROM dwd_event WHERE table_data_source=%s", (SEED,)),
    ]
    for label, sql, params in checks:
        cur.execute(sql, params)
        print(f"  {label}: {cur.fetchone()['value']}")

    cur.execute("""
        SELECT COUNT(*) AS broken
        FROM dwd_org_executive_info e
        LEFT JOIN dwd_org_base_info o ON BINARY e.org_id=BINARY o.org_id
        WHERE e.table_data_source=%s AND o.org_id IS NULL
    """, (SEED,))
    print(f"  企业—高管悬空边: {cur.fetchone()['broken']}")
    cur.execute("""
        SELECT COUNT(*) AS broken
        FROM dwd_scholar_paper_relation r
        LEFT JOIN dwd_scholar s ON BINARY r.scholar_id=BINARY s.scholar_id
        LEFT JOIN dwd_zh_paper p ON BINARY CAST(r.paper_id AS CHAR)=BINARY p.id
        WHERE r.table_data_source=%s AND (s.scholar_id IS NULL OR p.id IS NULL)
    """, (SEED,))
    print(f"  学者—论文悬空边: {cur.fetchone()['broken']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="test.sh", help="数据库连接配置文件")
    parser.add_argument("--apply", action="store_true", help="写入测试数据")
    parser.add_argument("--rollback", action="store_true", help="仅删除本脚本生成的数据")
    parser.add_argument("--dry-run", action="store_true", help="只展示计划写入数量")
    args = parser.parse_args()
    if sum([args.apply, args.rollback, args.dry_run]) != 1:
        parser.error("--apply、--rollback、--dry-run 必须且只能指定一个")

    rows = build_rows()
    if args.dry_run:
        print(f"数据批次：{SEED}")
        for table, table_rows in rows.items():
            if table_rows:
                print(f"{table}: {len(table_rows)}")
        print(f"合计：{sum(map(len, rows.values()))}")
        return

    config = parse_config(Path(args.config))
    conn = pymysql.connect(
        **config, charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=15, read_timeout=180, write_timeout=180, autocommit=False,
    )
    try:
        with conn.cursor() as cur:
            removed = remove_seed(cur)
            if args.rollback:
                conn.commit()
                print(f"已回滚批次 {SEED}，删除 {sum(removed.values())} 行")
                return
            total = 0
            for table in reversed(CORE_TABLES):
                count = insert_rows(cur, table, rows[table])
                if count:
                    print(f"{table}: 写入 {count} 行")
                    total += count
            verify(cur)
            conn.commit()
            print(f"\n批次 {SEED} 写入完成，共 {total} 行。")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
