#!/usr/bin/env python3
"""根据 gkx 样例库元数据，在 TRS 中创建无数据的全量知识图谱本体。"""

from __future__ import annotations

import argparse
import os
import re
import time
from dataclasses import dataclass
from typing import Any

import pymysql

from build_trs_test_graphs import TrsGraphClient, gql_string


DEFAULT_SPACE = "gkx_full_ontology"
SCHEMA_WAIT_SECONDS = 22


@dataclass(frozen=True)
class SchemaDef:
    code: str
    sources: tuple[str, ...]
    comment: str


@dataclass(frozen=True)
class EdgeDef(SchemaDef):
    source_tag: str
    target_tag: str


TAGS: dict[str, SchemaDef] = {
    "企业": SchemaDef("company", (
        "dwd_corp_basic_info", "dwd_forg_base_info", "dwd_medical_company",
        "dwd_org_base_info", "dwd_special_aomen_company",
        "dwd_special_hongkong_company", "dwd_special_taiwan_company",
    ), "境内外企业及医疗企业"),
    "机构": SchemaDef("institution", (
        "dwd_forg_research_org_info", "dwd_forg_university_org_info", "dwd_heis_info",
        "dwd_org_heis_info", "dwd_research_institute_base_info", "dwd_zh_report_org",
    ), "高校、研究机构及其他组织"),
    "人物": SchemaDef("person", (
        "dwd_en_report_author", "dwd_forg_executive_info", "dwd_org_executive_info",
        "dwd_patent_inventors", "dwd_zh_author", "dwd_zh_report_author",
    ), "高管、学者、作者、发明人等自然人"),
    "学者": SchemaDef("scholar", ("dwd_scholar",), "科研学者"),
    "论文": SchemaDef("paper", (
        "dwd_scholar_papers", "dwd_zh_paper", "dwd_zh_paper_abstract",
        "dwd_zh_paper_classification", "dwd_zh_paper_title",
    ), "中英文科技论文及其内容属性"),
    "期刊": SchemaDef("journal", ("dwd_zh_journal",), "学术期刊"),
    "专利": SchemaDef("patent", (
        "dwd_patent", "dwd_patent_abstract", "dwd_patent_claim",
        "dwd_patent_description", "dwd_patent_legal", "dwd_patent_title",
    ), "专利及摘要、权利要求、法律状态"),
    "科研项目": SchemaDef("research_project", (
        "dwd_en_project", "dwd_en_project_output", "dwd_zh_project",
        "dwd_zh_project_output",
    ), "中英文科研项目及成果统计"),
    "研究报告": SchemaDef("research_report", (
        "dwd_en_report", "dwd_zh_report",
    ), "中英文研究报告"),
    "药物": SchemaDef("drug", ("dwd_drug", "dwd_drug_profile"), "药品及说明书"),
    "化合物": SchemaDef("substance", (
        "dwd_calculation", "dwd_drug_substance", "dwd_small_molecule_screening",
        "dwd_substance",
    ), "化学物质、药物成分及小分子"),
    "蛋白质": SchemaDef("protein", ("dwd_protein",), "蛋白质及序列"),
    "疾病": SchemaDef("disease", ("dwd_clinical",), "疾病、表型、基因和症状"),
    "临床试验": SchemaDef("clinical_trial", ("dwd_clinical_trial", "dwd_rd"), "临床试验与研发阶段"),
    "医疗器械": SchemaDef("medical_device", ("dwd_medical_device",), "医疗器械"),
    "药物安全报告": SchemaDef("drug_safety", ("dwd_safety",), "药物不良反应与安全报告"),
    "药物交易": SchemaDef("drug_deal", ("dwd_deal",), "药物许可交易"),
    "材料": SchemaDef("material", ("dwd_material_virtual_structure",), "材料虚拟结构"),
    "晶体结构": SchemaDef("crystal", ("dwd_crystal_structure",), "晶体结构及衍射属性"),
    "分子谱图": SchemaDef("spectrum", ("dwd_molecular_spectrum",), "分子质谱"),
    "化学反应": SchemaDef("reaction", ("dwd_react_detail",), "反应物、产物及反应条件"),
    "多组学数据": SchemaDef("multi_omics", ("dwd_multi_omics",), "基因组等多组学文件"),
    "企业产品": SchemaDef("product", (
        "dwd_forg_product_info", "dwd_org_industry_product_tags",
        "dwd_org_org_product_info",
    ), "企业产品及产业链产品"),
    "技术": SchemaDef("technology", ("dwd_org_tech_tag",), "企业技术标签"),
    "产业": SchemaDef("industry", (
        "dwd_industry_chain_info", "dwd_industry_code",
    ), "行业分类与产业链节点"),
    "产业分析文档": SchemaDef("industry_document", (
        "dwd_industry_analysis_documents",
    ), "产业分析文档"),
    "新闻": SchemaDef("news", (
        "dwd_industry_chain_news_info", "dwd_news_base",
        "dwd_org_important_news_info",
    ), "企业及产业新闻"),
    "资讯": SchemaDef("information", ("dwd_information",), "专题资讯"),
    "政策": SchemaDef("policy", (
        "dwd_global_policy_base", "dwd_policy_base",
    ), "境内外政策"),
    "事件": SchemaDef("event", ("dwd_event",), "专题事件"),
    "招聘职位": SchemaDef("job", ("dwd_job", "dwd_org_recruit_info"), "企业招聘职位"),
    "招标项目": SchemaDef("bid_project", ("dwd_bid_base_out",), "招标采购项目"),
    "招标标的": SchemaDef("bid_item", ("dwd_bid_target_item_out",), "招标项目标的物"),
    "基金": SchemaDef("fund", (
        "dwd_fund_basic_info", "dwd_fund_ope_status", "dwd_fund_scale_info",
    ), "证券投资基金"),
    "产业基金": SchemaDef("industrial_fund", (
        "dwd_industrial_fund_basic_info",
        "dwd_industrial_fund_investment_project_info",
    ), "产业投资基金"),
    "债券": SchemaDef("bond", (
        "dwd_high_tech_industry_bonds", "dwd_sci_tech_inno_bonds",
    ), "高技术与科技创新债券"),
    "证券": SchemaDef("security", (
        "dwd_org_stock_base", "dwd_sec_basic_info",
    ), "股票、债券等证券"),
    "期权": SchemaDef("option", ("dwd_option_basic_info",), "期权合约"),
    "证券行情": SchemaDef("security_quote", (
        "dwd_hk_sec_daily_quotation", "dwd_ls_stock_daily_quotation",
        "dwd_option_daily_quotation", "dwd_us_sec_daily_quotation",
    ), "证券与期权日行情时序快照"),
    "估值指标": SchemaDef("valuation", (
        "dwd_astock_val_indicators", "dwd_hk_stock_val_indicators",
        "dwd_us_stock_val_ind",
    ), "股票估值时序指标"),
    "企业财务快照": SchemaDef("financial_snapshot", (
        "dwd_foreign_org_annual_financial_info", "dwd_org_annual_financial_info",
        "dwd_org_stock_finance_info",
    ), "企业年度及报告期财务数据"),
    "企业年报": SchemaDef("annual_report", (
        "dwd_org_annual_report_asset", "dwd_org_annual_report_base",
    ), "企业年度报告"),
    "利润表": SchemaDef("income_statement", ("dwd_org_income_statement",), "企业利润表"),
    "主营构成": SchemaDef("business_composition", (
        "dwd_main_business_composition_area", "dwd_main_business_composition_industry",
        "dwd_main_business_composition_prod",
    ), "按地区、行业和产品划分的主营业务时序数据"),
    "融资事件": SchemaDef("financing", ("dwd_org_financing_info",), "企业融资轮次"),
    "行政区划": SchemaDef("admin_area", ("dwd_dim_admin_area",), "行政区划层级"),
    "宏观指标": SchemaDef("macro_index", (
        "dwd_dim_index_attribute", "dwd_macro_index_data",
    ), "宏观经济指标及观测值"),
    "指标计算方法": SchemaDef("index_calculation", ("dwd_dim_index_cal",), "指标计算方法维度"),
    "指标周期": SchemaDef("index_duration", ("dwd_dim_index_dur",), "指标周期维度"),
    "数据来源": SchemaDef("data_source", ("dwd_dim_source_code",), "数据来源维度"),
    "外汇指标": SchemaDef("foreign_exchange", ("dwd_foreign_exchange_info",), "外汇宏观指标"),
    "司法案件": SchemaDef("judicial_case", (
        "dwd_opt_judicial_case_detail", "dwd_org_opt_judicial_case",
    ), "企业相关司法案件"),
    "破产案件": SchemaDef("bankruptcy_case", ("dwd_org_bankruptcy_public_cases",), "破产公开案件"),
    "企业风险事件": SchemaDef("risk_event", (
        "dwd_org_company_abnormal", "dwd_org_company_illegal",
        "dwd_org_company_punish", "dwd_org_risk_shixin",
        "dwd_org_risk_tax_punish", "dwd_org_risk_zhixing",
    ), "经营异常、违法处罚、失信和执行风险"),
    "企业变更": SchemaDef("company_change", ("dwd_org_changerecord_info",), "企业工商变更记录"),
    "市场指标": SchemaDef("market", ("dwd_market",), "医药等市场规模与份额"),
}


EDGES: dict[str, EdgeDef] = {
    "任职": EdgeDef("employment", ("dwd_forg_executive_info", "dwd_org_executive_info"), "人物在企业任职", "人物", "企业"),
    "所属机构": EdgeDef("affiliation", ("dwd_scholar_work_experience",), "学者所属或曾任职机构", "学者", "机构"),
    "教育经历": EdgeDef("education", ("dwd_scholar_education_background",), "学者教育经历", "学者", "机构"),
    "合作作者": EdgeDef("coauthor", ("dwd_scholar_coauthor",), "学者合作关系", "学者", "学者"),
    "研究方向": EdgeDef("research_direction", ("dwd_scholar_research_direction",), "学者研究方向", "学者", "技术"),
    "人才标签": EdgeDef("talent_flag", ("dwd_scholar_talent_flag",), "学者人才称号", "学者", "技术"),
    "撰写论文": EdgeDef("writes_paper", ("dwd_scholar_paper_relation", "dwd_zh_author"), "作者撰写论文", "人物", "论文"),
    "发表期刊": EdgeDef("published_in", ("dwd_zh_paper",), "论文发表于期刊", "论文", "期刊"),
    "引用论文": EdgeDef("paper_cites", ("dwd_zh_paper_citation",), "论文引用关系", "论文", "论文"),
    "参考文献": EdgeDef("paper_reference", ("dwd_zh_paper_reference", "dwd_zh_paper_reference_content"), "论文参考文献关系", "论文", "论文"),
    "相关论文": EdgeDef("related_paper", ("dwd_zh_paper_related",), "论文相关推荐", "论文", "论文"),
    "专利申请": EdgeDef("patent_applicant", ("dwd_patent_applicants",), "企业或机构申请专利", "机构", "专利"),
    "专利权属": EdgeDef("patent_assignee", ("dwd_patent_assignees",), "专利当前权属", "专利", "机构"),
    "发明专利": EdgeDef("patent_inventor", ("dwd_patent_inventors",), "发明人发明专利", "人物", "专利"),
    "专利引用": EdgeDef("patent_cites", ("dwd_patent_cited",), "专利引用关系", "专利", "专利"),
    "专利家族": EdgeDef("patent_family", ("dwd_patent_family",), "同族专利关系", "专利", "专利"),
    "优先权": EdgeDef("patent_priority", ("dwd_patent_priority_filings",), "专利优先权关系", "专利", "专利"),
    "专利转让": EdgeDef("patent_transfer", ("dwd_patent_transfer",), "专利权转让", "机构", "专利"),
    "物质关联论文": EdgeDef("substance_paper", ("dwd_substance_paper",), "化合物关联论文", "化合物", "论文"),
    "物质关联专利": EdgeDef("substance_patent", ("dwd_substance_patent",), "化合物关联专利", "化合物", "专利"),
    "相似物质": EdgeDef("similar_substance", ("dwd_similar_substance",), "化合物结构相似", "化合物", "化合物"),
    "反应物质": EdgeDef("reaction_substance", ("dwd_rel_reaction_substance",), "化学反应包含物质", "化学反应", "化合物"),
    "药物成分": EdgeDef("drug_substance", ("dwd_drug_substance",), "药物活性成分", "药物", "化合物"),
    "药物适应症": EdgeDef("drug_indication", ("dwd_drug_profile",), "药物治疗疾病", "药物", "疾病"),
    "试验疾病": EdgeDef("trial_disease", ("dwd_clinical_trial",), "临床试验研究疾病", "临床试验", "疾病"),
    "试验申办": EdgeDef("trial_sponsor", ("dwd_rd",), "企业或机构申办临床试验", "机构", "临床试验"),
    "器械生产": EdgeDef("device_company", ("dwd_medical_device",), "医疗企业生产器械", "企业", "医疗器械"),
    "药物许可": EdgeDef("drug_license", ("dwd_deal",), "药物许可方与被许可方交易", "企业", "企业"),
    "控股子公司": EdgeDef("subsidiary", ("dwd_agg_subsidiary_info", "dwd_org_subsidiary_info"), "企业控股子公司", "企业", "企业"),
    "股东持股": EdgeDef("shareholding", ("dwd_forg_shareholder_info", "dwd_org_shareholder_info"), "股东持有企业股权", "企业", "企业"),
    "企业投资": EdgeDef("company_investment", ("dwd_org_invest_info",), "企业对外投资", "企业", "企业"),
    "企业并购": EdgeDef("company_acquisition", ("dwd_org_merger_acquisition_info",), "企业并购另一企业", "企业", "企业"),
    "并购参与方": EdgeDef("ma_party", ("dwd_merger_acquisition_events_party_info",), "并购事件参与方", "企业", "融资事件"),
    "企业行业": EdgeDef("company_industry", (
        "dwd_corp_his_citic_ic", "dwd_corp_his_crsc_ic", "dwd_corp_his_sw_ic",
        "dwd_hk_corp_his_sw_ic", "dwd_org_industry_tags",
    ), "企业行业分类及历史变更", "企业", "产业"),
    "企业产品关系": EdgeDef("company_product", ("dwd_org_industry_product_tags", "dwd_org_org_product_info"), "企业拥有或生产产品", "企业", "企业产品"),
    "企业技术关系": EdgeDef("company_technology", ("dwd_org_tech_tag",), "企业技术布局", "企业", "技术"),
    "供应链关系": EdgeDef("supply_chain", ("dwd_org_sc_info",), "企业上下游供应链关系", "企业", "企业"),
    "企业证券": EdgeDef("company_security", ("dwd_org_stock_base", "dwd_sec_basic_info"), "企业发行证券", "企业", "证券"),
    "企业财务": EdgeDef("company_finance", (
        "dwd_foreign_org_annual_financial_info", "dwd_org_annual_financial_info",
        "dwd_org_stock_finance_info",
    ), "企业关联财务快照", "企业", "企业财务快照"),
    "企业年报关系": EdgeDef("company_annual_report", ("dwd_org_annual_report_base",), "企业发布年报", "企业", "企业年报"),
    "企业主营构成": EdgeDef("company_business", (
        "dwd_main_business_composition_area", "dwd_main_business_composition_industry",
        "dwd_main_business_composition_prod",
    ), "企业主营业务构成", "企业", "主营构成"),
    "企业融资关系": EdgeDef("company_financing", ("dwd_org_financing_info",), "企业发生融资", "企业", "融资事件"),
    "企业风险": EdgeDef("company_risk", (
        "dwd_org_company_abnormal", "dwd_org_company_illegal", "dwd_org_company_punish",
        "dwd_org_risk_shixin", "dwd_org_risk_tax_punish", "dwd_org_risk_zhixing",
    ), "企业关联风险事件", "企业", "企业风险事件"),
    "企业涉案": EdgeDef("company_case", ("dwd_org_opt_judicial_case",), "企业关联司法案件", "企业", "司法案件"),
    "破产当事方": EdgeDef("bankruptcy_party", ("dwd_org_bankruptcy_public_cases_list",), "企业参与破产案件", "企业", "破产案件"),
    "企业新闻": EdgeDef("company_news", ("dwd_org_important_news_info",), "企业关联新闻", "企业", "新闻"),
    "企业招聘": EdgeDef("company_job", ("dwd_job", "dwd_org_recruit_info"), "企业发布招聘职位", "企业", "招聘职位"),
    "基金管理": EdgeDef("fund_manager", ("dwd_fund_basic_info",), "机构管理基金", "机构", "基金"),
    "基金债券配置": EdgeDef("fund_bond", ("dwd_fund_bond_allocation",), "基金配置债券", "基金", "债券"),
    "基金行业配置": EdgeDef("fund_industry", ("dwd_fund_equity_sector_allocation",), "基金配置行业", "基金", "产业"),
    "产业基金策略": EdgeDef("industrial_fund_strategy", ("dwd_industrial_fund_investment_strategy",), "产业基金投资行业", "产业基金", "产业"),
    "产业基金出资": EdgeDef("industrial_fund_lp", ("dwd_industrial_fund_lp_info",), "机构作为产业基金有限合伙人", "机构", "产业基金"),
    "产业基金管理": EdgeDef("industrial_fund_gp", ("dwd_industrial_fund_management_institution",), "机构管理产业基金", "机构", "产业基金"),
    "招标代理": EdgeDef("bid_agency", ("dwd_bid_purchase_agency_out",), "企业代理招标项目", "企业", "招标项目"),
    "招标中标": EdgeDef("bid_winner", ("dwd_bid_win_candidate_out",), "企业成为中标候选人", "企业", "招标项目"),
    "招标包含标的": EdgeDef("bid_has_item", ("dwd_bid_target_item_out",), "招标项目包含标的", "招标项目", "招标标的"),
    "产业文档企业": EdgeDef("document_company", ("dwd_industry_analysis_companies",), "产业分析文档提及企业", "产业分析文档", "企业"),
    "产业文档内容类型": EdgeDef("document_content_type", ("dwd_industry_analysis_content_types",), "产业文档内容分类", "产业分析文档", "资讯"),
    "产业文档国家": EdgeDef("document_country", ("dwd_industry_analysis_countries",), "产业文档涉及国家", "产业分析文档", "行政区划"),
    "产业文档行业": EdgeDef("document_industry", ("dwd_industry_analysis_industries",), "产业文档涉及行业", "产业分析文档", "产业"),
    "产业文档主题": EdgeDef("document_topic", ("dwd_industry_analysis_topics",), "产业文档涉及主题", "产业分析文档", "技术"),
    "产业新闻关系": EdgeDef("industry_news", ("dwd_industry_chain_news_info",), "产业关联新闻", "产业", "新闻"),
    "报告作者": EdgeDef("report_author", ("dwd_en_report_author", "dwd_zh_report_author"), "研究报告作者", "研究报告", "人物"),
    "报告机构": EdgeDef("report_org", ("dwd_en_report_org",), "研究报告关联机构", "研究报告", "机构"),
    "报告论文": EdgeDef("report_paper", ("dwd_zh_report_paper",), "研究报告关联论文", "研究报告", "论文"),
    "报告项目": EdgeDef("report_project", ("dwd_zh_report_project",), "研究报告关联科研项目", "研究报告", "科研项目"),
    "行政区划层级": EdgeDef("area_parent", ("dwd_dim_admin_area",), "行政区划父子关系", "行政区划", "行政区划"),
    "宏观指标地区": EdgeDef("index_area", ("dwd_macro_index_data",), "宏观指标所属地区", "宏观指标", "行政区划"),
    "宏观指标来源": EdgeDef("index_source", ("dwd_macro_index_data",), "宏观指标数据来源", "宏观指标", "数据来源"),
    "证券行情关系": EdgeDef("security_quote_link", (
        "dwd_hk_sec_daily_quotation", "dwd_ls_stock_daily_quotation",
        "dwd_option_daily_quotation", "dwd_us_sec_daily_quotation",
    ), "证券关联日行情", "证券", "证券行情"),
    "证券估值关系": EdgeDef("security_valuation", (
        "dwd_astock_val_indicators", "dwd_hk_stock_val_indicators",
        "dwd_us_stock_val_ind",
    ), "证券关联估值指标", "证券", "估值指标"),
}


MYSQL_TO_NGQL = {
    "tinyint": "int", "smallint": "int", "mediumint": "int", "int": "int",
    "integer": "int", "bigint": "int", "float": "double", "double": "double",
    "decimal": "double", "numeric": "double", "date": "date", "datetime": "datetime",
    "timestamp": "datetime", "time": "time", "year": "int",
}
NAME_FIELDS = (
    "name", "name_cn", "name_en", "title", "zh_name", "en_name", "org_name_cn",
    "company_name", "fund_name", "bond_name", "drug_name", "disease_name",
    "protein_name", "material_name", "event_name", "project_name", "trial_title",
)
ID_FIELDS = (
    "org_id", "scholar_id", "id", "patent_id", "paper_id", "report_id",
    "publication_id", "project_number", "fund_code", "industrial_fund_id",
    "bond_code", "sec_id", "sec_code", "index_code", "u_id", "case_no", "dwd_id",
)
TIME_FIELDS = (
    "year", "occur_period_year", "approval_year", "pbdt_year", "pub_year",
    "publish_year", "incorporation_year", "dt", "td_date", "publish_date",
    "created_time",
)


def mysql_config() -> dict[str, Any]:
    names = {
        "host": "GKX_SAMPLE_HOST", "port": "GKX_SAMPLE_PORT", "user": "GKX_SAMPLE_USER",
        "password": "GKX_SAMPLE_PASSWORD", "database": "GKX_SAMPLE_DATABASE",
    }
    missing = [env for env in names.values() if not os.getenv(env)]
    if missing:
        raise RuntimeError(f"缺少样例库环境变量：{', '.join(missing)}")
    return {
        "host": os.environ[names["host"]], "port": int(os.environ[names["port"]]),
        "user": os.environ[names["user"]], "password": os.environ[names["password"]],
        "database": os.environ[names["database"]],
    }


def load_mysql_schema() -> dict[str, dict[str, str]]:
    connection = pymysql.connect(
        **mysql_config(), charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=20, read_timeout=120,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE FROM information_schema.columns "
                "WHERE table_schema=%s ORDER BY TABLE_NAME,ORDINAL_POSITION",
                (mysql_config()["database"],),
            )
            result: dict[str, dict[str, str]] = {}
            for row in cursor.fetchall():
                values = list(row.values())
                result.setdefault(str(values[0]), {})[str(values[1])] = str(values[2])
            return result
    finally:
        connection.close()


def merge_type(left: str | None, right: str) -> str:
    mapped = MYSQL_TO_NGQL.get(right.lower(), "string")
    if left is None or left == mapped:
        return mapped
    if {left, mapped} <= {"int", "double"}:
        return "double"
    return "string"


def merge_source_fields(
    source_tables: tuple[str, ...], mysql_schema: dict[str, dict[str, str]],
) -> dict[str, str]:
    fields: dict[str, str] = {}
    for table in source_tables:
        if table not in mysql_schema:
            raise RuntimeError(f"样例库缺少源表：{table}")
        for field, mysql_type in mysql_schema[table].items():
            fields[field] = merge_type(fields.get(field), mysql_type)
    return fields


def mapped_tables() -> set[str]:
    return {
        table
        for definition in [*TAGS.values(), *EDGES.values()]
        for table in definition.sources
    }


def validate_coverage(mysql_schema: dict[str, dict[str, str]]) -> None:
    missing = set(mysql_schema) - mapped_tables()
    if missing:
        raise RuntimeError(f"存在未纳入本体的源表：{', '.join(sorted(missing))}")
    for name, edge in EDGES.items():
        if edge.source_tag not in TAGS or edge.target_tag not in TAGS:
            raise RuntimeError(f"关系 {name} 的起止实体不存在")


def choose_indexes(fields: dict[str, str]) -> list[str]:
    selected: list[str] = []
    for candidates in (ID_FIELDS, NAME_FIELDS, TIME_FIELDS):
        field = next((candidate for candidate in candidates if candidate in fields), None)
        if field and field not in selected:
            selected.append(field)
    return selected


def index_field(field: str, field_type: str) -> str:
    return f"`{field}`(128)" if field_type == "string" else f"`{field}`"


def sample_value(field: str, field_type: str, label: str, code: str, source: str) -> str:
    if field_type == "date":
        return 'date("2026-08-28")'
    if field_type == "datetime":
        return 'datetime("2026-08-28T17:30:00")'
    if field_type == "time":
        return 'time("17:30:00")'
    if field_type == "int":
        return "0" if field.startswith("is_") else "1"
    if field_type == "double":
        return "1.0"
    if field in NAME_FIELDS or "name" in field or field in {"title", "bt"}:
        return gql_string(f"{label}模拟数据")
    if field == "source_table":
        return gql_string(source)
    if field in {"table_data_source", "data_source", "source"}:
        return gql_string("ontology_sample_20260828")
    if field in ID_FIELDS or field.endswith("_id") or field.endswith("_code"):
        return gql_string(f"SAMPLE_{code.upper()}_{field.upper()}")
    if field in {"url", "link"} or field.endswith("_url") or field.endswith("_link"):
        return gql_string("https://prototype.example/ontology-sample")
    return gql_string("模拟值")


def sample_properties(
    fields: dict[str, str], label: str, code: str, source: str,
) -> tuple[str, str]:
    columns = ",".join(f"`{field}`" for field in fields)
    values = ",".join(
        sample_value(field, field_type, label, code, source)
        for field, field_type in fields.items()
    )
    return columns, values


def wait_for_space(client: TrsGraphClient, space: str) -> None:
    for _ in range(60):
        try:
            client.execute(f"USE `{space}`;")
            return
        except Exception:
            # Studio HTTP 网关在 Space 元数据传播期间可能直接返回 HTTP 500。
            time.sleep(1)
    raise RuntimeError(f"空间 {space} 创建超时")


def create_ontology(
    client: TrsGraphClient, space: str, mysql_schema: dict[str, dict[str, str]],
    recreate: bool,
) -> None:
    spaces = {
        row["Name"]
        for row in client.execute("SHOW SPACES;").get("data", {}).get("tables", [])
    }
    if space in spaces and not recreate:
        raise RuntimeError(f"空间 {space} 已存在；如确认重建请使用 --recreate")
    if space in spaces:
        client.execute(f"DROP SPACE IF EXISTS `{space}`;")
        for _ in range(60):
            current = {
                row["Name"]
                for row in client.execute("SHOW SPACES;").get("data", {}).get("tables", [])
            }
            if space not in current:
                break
            time.sleep(1)
        else:
            raise RuntimeError(f"空间 {space} 删除超时")
    client.execute(
        f"CREATE SPACE `{space}` (partition_num=20, replica_factor=1, "
        "vid_type=FIXED_STRING(256)) "
        f"COMMENT={gql_string('gkx 全量知识图谱空本体，来源 168 张样例表')};"
    )
    wait_for_space(client, space)

    tag_fields: dict[str, dict[str, str]] = {}
    edge_fields: dict[str, dict[str, str]] = {}
    for tag, definition in TAGS.items():
        fields = merge_source_fields(definition.sources, mysql_schema)
        tag_fields[tag] = fields
        columns = ", ".join(f"`{name}` {ngql_type}" for name, ngql_type in fields.items())
        comment = f"{definition.comment} | 来源表: {','.join(definition.sources)}"
        client.execute(
            f"USE `{space}`; CREATE TAG `{tag}` ({columns}) COMMENT={gql_string(comment)};"
        )
    for edge, definition in EDGES.items():
        fields = merge_source_fields(definition.sources, mysql_schema)
        edge_fields[edge] = fields
        columns = ", ".join(f"`{name}` {ngql_type}" for name, ngql_type in fields.items())
        comment = (
            f"{definition.source_tag}->{definition.target_tag} | {definition.comment} | "
            f"来源表: {','.join(definition.sources)}"
        )
        client.execute(
            f"USE `{space}`; CREATE EDGE `{edge}` ({columns}) COMMENT={gql_string(comment)};"
        )
    time.sleep(SCHEMA_WAIT_SECONDS)

    tag_index_count = 0
    edge_index_count = 0
    for tag, definition in TAGS.items():
        for field in choose_indexes(tag_fields[tag]):
            index_name = f"idx_t_{definition.code}_{field}"[:63]
            client.execute(
                f"USE `{space}`; CREATE TAG INDEX `{index_name}` ON `{tag}`"
                f"({index_field(field, tag_fields[tag][field])});"
            )
            tag_index_count += 1
    for edge, definition in EDGES.items():
        selected = choose_indexes(edge_fields[edge])[:2]
        if not selected:
            continue
        for field in selected:
            index_name = f"idx_e_{definition.code}_{field}"[:63]
            client.execute(
                f"USE `{space}`; CREATE EDGE INDEX `{index_name}` ON `{edge}`"
                f"({index_field(field, edge_fields[edge][field])});"
            )
            edge_index_count += 1
    time.sleep(SCHEMA_WAIT_SECONDS)

    actual_tags = client.execute(f"USE `{space}`; SHOW TAGS;").get("data", {}).get("tables", [])
    actual_edges = client.execute(f"USE `{space}`; SHOW EDGES;").get("data", {}).get("tables", [])
    tag_indexes = client.execute(
        f"USE `{space}`; SHOW TAG INDEXES;"
    ).get("data", {}).get("tables", [])
    edge_indexes = client.execute(
        f"USE `{space}`; SHOW EDGE INDEXES;"
    ).get("data", {}).get("tables", [])
    if len(actual_tags) != len(TAGS) or len(actual_edges) != len(EDGES):
        raise RuntimeError("TRS Schema 数量验收失败")
    if len(tag_indexes) != tag_index_count or len(edge_indexes) != edge_index_count:
        raise RuntimeError("TRS 索引数量验收失败")
    print(
        f"{space}: 已创建 {len(actual_tags)} 个实体类型、{len(actual_edges)} 个关系类型、"
        f"{len(tag_indexes)} 个实体索引、{len(edge_indexes)} 个关系索引；未写入任何数据。"
    )


def seed_schema_samples(
    client: TrsGraphClient, space: str, mysql_schema: dict[str, dict[str, str]],
) -> None:
    spaces = {
        row["Name"]
        for row in client.execute("SHOW SPACES;").get("data", {}).get("tables", [])
    }
    if space not in spaces:
        raise RuntimeError(f"空间 {space} 不存在，请先执行 --apply")

    sample_vids = {
        tag: f"ONTOLOGY_SAMPLE::{definition.code}" for tag, definition in TAGS.items()
    }
    for tag, definition in TAGS.items():
        fields = merge_source_fields(definition.sources, mysql_schema)
        columns, values = sample_properties(
            fields, tag, definition.code, definition.sources[0],
        )
        client.execute(
            f"USE `{space}`; INSERT VERTEX `{tag}`({columns}) VALUES "
            f"{gql_string(sample_vids[tag])}:({values});"
        )

    for edge, definition in EDGES.items():
        fields = merge_source_fields(definition.sources, mysql_schema)
        columns, values = sample_properties(
            fields, edge, definition.code, definition.sources[0],
        )
        client.execute(
            f"USE `{space}`; INSERT EDGE `{edge}`({columns}) VALUES "
            f"{gql_string(sample_vids[definition.source_tag])}->"
            f"{gql_string(sample_vids[definition.target_tag])}@0:({values});"
        )

    client.execute(f"USE `{space}`; SUBMIT JOB STATS;")
    time.sleep(5)
    sample_id_list = ",".join(gql_string(vid) for vid in sample_vids.values())
    vertex_rows = client.execute(
        f"USE `{space}`; MATCH (v) WHERE id(v) IN [{sample_id_list}] "
        "RETURN count(v) AS total;"
    ).get("data", {}).get("tables", [])
    edge_rows = client.execute(
        f"USE `{space}`; MATCH ()-[e]->() RETURN count(e) AS total;"
    ).get("data", {}).get("tables", [])
    vertex_count = int(vertex_rows[0]["total"]) if vertex_rows else 0
    edge_count = int(edge_rows[0]["total"]) if edge_rows else 0
    if vertex_count != len(TAGS) or edge_count < len(EDGES):
        raise RuntimeError(
            f"模拟数据验收失败：节点 {vertex_count}/{len(TAGS)}，"
            f"边 {edge_count}/{len(EDGES)}"
        )
    print(f"{space}: 已写入 {vertex_count} 个示例节点、{len(EDGES)} 条示例边。")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--space", default=DEFAULT_SPACE)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--seed-samples", action="store_true")
    parser.add_argument("--recreate", action="store_true")
    args = parser.parse_args()
    if sum((args.apply, args.dry_run, args.seed_samples)) != 1:
        parser.error("--apply、--dry-run 和 --seed-samples 必须且只能指定一个")

    mysql_schema = load_mysql_schema()
    validate_coverage(mysql_schema)
    tag_fields = {
        tag: merge_source_fields(definition.sources, mysql_schema)
        for tag, definition in TAGS.items()
    }
    edge_fields = {
        edge: merge_source_fields(definition.sources, mysql_schema)
        for edge, definition in EDGES.items()
    }
    print(
        f"源表 {len(mysql_schema)} 张；计划实体类型 {len(TAGS)} 个/"
        f"{sum(map(len, tag_fields.values()))} 个字段；关系类型 {len(EDGES)} 个/"
        f"{sum(map(len, edge_fields.values()))} 个字段。"
    )
    if args.dry_run:
        return

    password = os.getenv("TRS_GRAPH_PASSWORD")
    if not password:
        raise RuntimeError("缺少 TRS_GRAPH_PASSWORD")
    client = TrsGraphClient(
        os.getenv("TRS_GRAPH_HOST", "http://114.117.127.200:7001"),
        os.getenv("TRS_GRAPH_USER", "root"), password,
        os.getenv("TRS_GRAPH_ADDR", "127.0.0.1"),
        int(os.getenv("TRS_GRAPH_PORT", "9669")),
    )
    try:
        if args.seed_samples:
            seed_schema_samples(client, args.space, mysql_schema)
        else:
            create_ontology(client, args.space, mysql_schema, args.recreate)
    finally:
        client.close()


if __name__ == "__main__":
    main()
