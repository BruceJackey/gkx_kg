import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Network, Building2, Users, ChevronDown,
  ChevronRight, Calendar, MapPin, Briefcase, Link2, Newspaper,
  ZoomIn, ZoomOut, RotateCcw, AlertTriangle, MessageSquare,
  Sparkles, ArrowUpRight, ArrowDownRight, Lightbulb, TrendingUp,
  FileText, Download, Printer, CheckSquare, Square, LayoutGrid,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'company' | 'person' | 'product' | 'technology' | 'partner';
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface CompanyData {
  name: string;
  industry: string;
  founded: string;
  type: string;
  location: string;
  legalRep: string;
  creditCode: string;
  financialSummary: string;
  news: { date: string; title: string }[];
  associates: { name: string; relation: string }[];
  riskEvents: { date: string; desc: string }[];
  sentiment: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  inference: {
    relations: { from: string; rel: string; to: string; confidence: number; basis: string }[];
    trends: { tech: string; direction: 'up' | 'down'; confidence: number; desc: string }[];
    opportunities: { title: string; tag: string; desc: string; score: number }[];
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const COMPANY_DATA: Record<string, CompanyData> = {
  '华为技术有限公司': {
    name: '华为技术有限公司',
    industry: '信息技术 / 通信设备',
    founded: '1987年',
    type: '有限责任公司（非上市）',
    location: '广东省深圳市龙岗区坂田华为总部',
    legalRep: '任正非',
    creditCode: '91440300279454742L',
    financialSummary: '2023年营业收入约7,042亿元，同比增长约9.4%；净利润约627亿元；研发投入约1,647亿元，占营收23.4%。',
    news: [
      { date: '2024-12-15', title: '华为发布新一代旗舰芯片麒麟9020，性能提升40%' },
      { date: '2024-12-10', title: '华为与多家运营商签署5G-A商用合作协议' },
      { date: '2024-12-05', title: '海外市场受部分地区政策限制影响持续' },
      { date: '2024-11-28', title: '华为公布三季报，营收稳步增长至5,621亿元' },
      { date: '2024-11-20', title: '鸿蒙生态应用数量突破5,000款，生态建设提速' },
    ],
    associates: [
      { name: '华为终端有限公司', relation: '全资子公司' },
      { name: '华为云计算技术有限公司', relation: '全资子公司' },
      { name: '海思半导体有限公司', relation: '全资子公司' },
      { name: '荣耀终端有限公司', relation: '战略持股' },
      { name: '中国移动通信集团', relation: '重要客户/合作方' },
      { name: '高通公司', relation: '专利交叉授权' },
    ],
    riskEvents: [
      { date: '2024-12-01', desc: '美国商务部拟扩大对华半导体出口限制范围，华为供应链存在进一步中断风险' },
      { date: '2024-11-18', desc: '欧盟部分成员国延续5G设备安全审查，相关项目交付进度受到影响' },
      { date: '2024-11-05', desc: '印度市场竞争格局发生变化，本土品牌持续加码，华为市场份额承压' },
      { date: '2024-10-22', desc: '英国宣布禁止在核心网络中使用华为设备，存量合同面临提前终止风险' },
      { date: '2024-10-10', desc: '麒麟芯片代工供应商多元化进展缓慢，先进制程产能仍受制于供应不足' },
      { date: '2024-09-15', desc: '与爱立信专利诉讼案进入关键审理阶段，诉讼结果存在不确定性' },
    ],
    sentiment: '整体舆情偏正面。2024年下半年，鸿蒙系统商用落地和麒麟芯片回归带动公众情绪明显回升，正面舆情占比约68%。制裁相关议题持续引发海外媒体关注，负面报道主要集中于供应链和市场准入层面，国内市场舆论整体稳定，消费者对华为品牌认同度持续提升。',
    nodes: [
      { id: 'center', label: '华为技术', type: 'company', x: 350, y: 240 },
      { id: 'p1', label: '任正非', type: 'person', x: 160, y: 120 },
      { id: 'p2', label: '孟晚舟', type: 'person', x: 540, y: 120 },
      { id: 'p3', label: '余承东', type: 'person', x: 160, y: 360 },
      { id: 'p4', label: '徐直军', type: 'person', x: 540, y: 360 },
      { id: 'prod1', label: '鸿蒙OS', type: 'product', x: 80, y: 240 },
      { id: 'prod2', label: 'Mate系列', type: 'product', x: 620, y: 240 },
      { id: 'tech1', label: '5G技术', type: 'technology', x: 260, y: 60 },
      { id: 'tech2', label: '麒麟芯片', type: 'technology', x: 440, y: 60 },
      { id: 'tech3', label: '华为云', type: 'technology', x: 350, y: 400 },
      { id: 'part1', label: '海思半导体', type: 'partner', x: 180, y: 430 },
      { id: 'part2', label: '中国移动', type: 'partner', x: 520, y: 430 },
    ],
    edges: [
      { from: 'center', to: 'p1', label: '创始人' },
      { from: 'center', to: 'p2', label: '轮值董事长' },
      { from: 'center', to: 'p3', label: '消费者BG CEO' },
      { from: 'center', to: 'p4', label: '轮值董事长' },
      { from: 'center', to: 'prod1', label: '自研产品' },
      { from: 'center', to: 'prod2', label: '旗舰产品线' },
      { from: 'center', to: 'tech1', label: '核心技术' },
      { from: 'center', to: 'tech2', label: '自研芯片' },
      { from: 'center', to: 'tech3', label: '云业务' },
      { from: 'center', to: 'part1', label: '全资子公司' },
      { from: 'center', to: 'part2', label: '战略合作' },
      { from: 'p3', to: 'prod2', label: '负责' },
      { from: 'tech2', to: 'prod2', label: '搭载' },
      { from: 'prod1', to: 'prod2', label: '系统支撑' },
    ],
    inference: {
      relations: [
        { from: '华为技术', rel: '潜在合作', to: '高通公司', confidence: 72, basis: '专利交叉授权协议及技术合作备忘录显示双方存在深度技术往来' },
        { from: '华为技术', rel: '竞争关系', to: '苹果公司', confidence: 95, basis: '全球智能手机及可穿戴市场份额直接争夺，产品线高度重叠' },
        { from: '华为技术', rel: '供应链依赖', to: '台积电', confidence: 88, basis: '历史芯片代工订单及先进制程产能分配记录分析' },
      ],
      trends: [
        { tech: '6G通信技术', direction: 'up', confidence: 85, desc: '预计2030年商用，华为已布局核心专利超3000项，技术领先优势明显' },
        { tech: '车载鸿蒙OS', direction: 'up', confidence: 78, desc: '车机系统市场渗透率持续提升，合作车企数量季度环比增长22%' },
        { tech: '传统基站硬件', direction: 'down', confidence: 65, desc: '受虚拟化与云化网络冲击，专用硬件份额逐步被软件定义网络替代' },
      ],
      opportunities: [
        { title: '工业互联网平台整合', tag: '跨行业', desc: '制造业数字化转型加速，华为云+5G组合方案可切入百亿级工业SaaS市场', score: 92 },
        { title: '医疗健康智能终端', tag: '跨行业', desc: '政策推动医疗信息化，穿戴式健康监测设备与华为智能硬件生态高度契合', score: 86 },
        { title: '智慧城市基础设施', tag: '政务', desc: '新型城镇化建设提速，华为ICT整体解决方案在智慧城市领域竞争优势突出', score: 88 },
      ],
    },
  },
  '比亚迪股份有限公司': {
    name: '比亚迪股份有限公司',
    industry: '新能源汽车 / 电池制造',
    founded: '1995年',
    type: '上市公司（A+H股）',
    location: '广东省深圳市坪山区比亚迪路3009号',
    legalRep: '王传福',
    creditCode: '91440300192061662P',
    financialSummary: '2023年营业收入约6,023亿元，同比增长约42%；净利润约300亿元；研发投入约408亿元，占营收6.8%。',
    news: [
      { date: '2024-12-12', title: '比亚迪单月销量突破50万辆，刷新历史记录' },
      { date: '2024-12-08', title: '第五代DM技术正式发布，油耗降至2.9L/百公里' },
      { date: '2024-11-30', title: '比亚迪海外工厂匈牙利生产线完成首批交付' },
      { date: '2024-11-20', title: '弗迪电池固态电池量产时间表披露，2027年小批量上车' },
      { date: '2024-11-10', title: '与多家主机厂谈判刀片电池外供合作取得新进展' },
    ],
    associates: [
      { name: '弗迪电池有限公司', relation: '全资子公司' },
      { name: '弗迪科技有限公司', relation: '全资子公司' },
      { name: '腾势汽车', relation: '合资品牌' },
      { name: '方程豹汽车', relation: '全资子品牌' },
      { name: '特斯拉中国', relation: '竞争关系' },
      { name: '宁德时代', relation: '竞争/合作' },
    ],
    riskEvents: [
      { date: '2024-12-05', desc: '欧盟对华电动车加征关税最高达35.3%，海外扩张成本大幅上升' },
      { date: '2024-11-22', desc: '国内价格战持续升级，毛利率面临下行压力，多款车型降价幅度超预期' },
      { date: '2024-10-30', desc: '匈牙利工厂建设遭遇当地环保组织抗议，工期存在延误风险' },
      { date: '2024-10-15', desc: '芯片自给率不足，部分核心功能芯片仍依赖境外供应商' },
      { date: '2024-09-20', desc: '海外部分市场出现电池安全相关投诉，品牌声誉管理面临挑战' },
    ],
    sentiment: '整体舆情以正面为主。销量屡创新高和技术突破带动大量积极报道，正面舆情占比约72%。价格战相关话题在行业媒体中引发较多讨论，部分消费者对降价持观望态度，海外关税政策为近期负面舆情的主要来源。',
    nodes: [
      { id: 'center', label: '比亚迪', type: 'company', x: 350, y: 240 },
      { id: 'p1', label: '王传福', type: 'person', x: 160, y: 120 },
      { id: 'p2', label: '何志奇', type: 'person', x: 540, y: 120 },
      { id: 'p3', label: '赵长江', type: 'person', x: 180, y: 360 },
      { id: 'prod1', label: '汉EV', type: 'product', x: 80, y: 240 },
      { id: 'prod2', label: '刀片电池', type: 'product', x: 620, y: 240 },
      { id: 'tech1', label: 'DM混动技术', type: 'technology', x: 260, y: 60 },
      { id: 'tech2', label: 'e平台3.0', type: 'technology', x: 440, y: 60 },
      { id: 'tech3', label: '弗迪电池', type: 'partner', x: 350, y: 410 },
      { id: 'part1', label: '腾势汽车', type: 'partner', x: 520, y: 380 },
    ],
    edges: [
      { from: 'center', to: 'p1', label: '创始人/董事长' },
      { from: 'center', to: 'p2', label: '高级副总裁' },
      { from: 'center', to: 'p3', label: '品牌总监' },
      { from: 'center', to: 'prod1', label: '旗舰车型' },
      { from: 'center', to: 'prod2', label: '核心产品' },
      { from: 'center', to: 'tech1', label: '核心技术' },
      { from: 'center', to: 'tech2', label: '底盘平台' },
      { from: 'center', to: 'tech3', label: '全资子公司' },
      { from: 'center', to: 'part1', label: '合资品牌' },
      { from: 'prod2', to: 'prod1', label: '装载' },
      { from: 'tech2', to: 'prod1', label: '支撑' },
    ],
    inference: {
      relations: [
        { from: '比亚迪', rel: '竞争关系', to: '特斯拉中国', confidence: 96, basis: '国内新能源乘用车市场直接竞争，销量数据及产品定位分析' },
        { from: '比亚迪', rel: '潜在合作', to: '大众汽车', confidence: 81, basis: '刀片电池外供谈判记录及大众平台电池规格需求匹配度分析' },
        { from: '比亚迪', rel: '上下游关系', to: '宁德时代', confidence: 74, basis: '部分车型存在混合采购可能，同时自产电池形成竞争' },
      ],
      trends: [
        { tech: '第五代DM混动', direction: 'up', confidence: 90, desc: '油耗降至2.9L/百公里，技术代差明显，预计带动插混市场份额快速扩张' },
        { tech: '固态电池量产', direction: 'up', confidence: 68, desc: '弗迪电池固态电池2027年小批量上车路线图清晰，产业化节点领先同行' },
        { tech: '燃油车业务', direction: 'down', confidence: 88, desc: '比亚迪已全面停售纯燃油车，传统燃油技术投入持续下降' },
      ],
      opportunities: [
        { title: '东南亚新能源市场开拓', tag: '出海', desc: '泰国、越南等市场新能源渗透率低，比亚迪先发布局可建立品牌壁垒', score: 89 },
        { title: '电池储能系统B端销售', tag: '跨行业', desc: '工商业储能需求爆发，刀片电池技术可平移至大规模储能场景', score: 84 },
        { title: '整车出口欧洲本土化', tag: '出海', desc: '匈牙利工厂投产可规避关税壁垒，本地化生产打开欧盟高端市场', score: 87 },
      ],
    },
  },
  '腾讯控股有限公司': {
    name: '腾讯控股有限公司',
    industry: '互联网 / 社交媒体 / 游戏',
    founded: '1998年',
    type: '上市公司（港股，代码0700）',
    location: '广东省深圳市南山区腾讯滨海大厦',
    legalRep: '马化腾',
    creditCode: '9144030077013142XG',
    financialSummary: '2023年营业收入约6,090亿元，同比增长约10%；净利润约1,579亿元；研发投入约624亿元，占营收10.2%。',
    news: [
      { date: '2024-12-14', title: '微信月活用户突破13.7亿，海外用户增长显著' },
      { date: '2024-12-09', title: '腾讯游戏《元梦之星》年流水超100亿，创新记录' },
      { date: '2024-12-03', title: '腾讯云推出混元大模型2.0，对标GPT-4性能' },
      { date: '2024-11-25', title: '腾讯音乐与各大唱片公司续签版权合作协议' },
      { date: '2024-11-18', title: '腾讯回购股票计划持续推进，年内回购额超千亿港元' },
    ],
    associates: [
      { name: '腾讯云计算（北京）有限公司', relation: '全资子公司' },
      { name: '腾讯音乐娱乐集团', relation: '控股子公司' },
      { name: '京东集团', relation: '参股（约17%）' },
      { name: '美团', relation: '参股（约17%）' },
      { name: '拼多多', relation: '早期投资方' },
      { name: 'Riot Games', relation: '全资收购' },
    ],
    riskEvents: [
      { date: '2024-12-02', desc: '国内游戏版号审批周期延长，部分新游上线时间面临不确定性' },
      { date: '2024-11-20', desc: '欧盟数字市场法案对超大平台监管力度加强，合规成本上升' },
      { date: '2024-10-28', desc: '广告市场竞争激烈，字节跳动持续抢占品牌广告份额' },
      { date: '2024-10-10', desc: '未成年人游戏保护相关政策可能进一步收紧，对流水产生影响' },
      { date: '2024-09-25', desc: '美国对腾讯部分云服务出口审查，涉及跨境数据安全合规' },
    ],
    sentiment: '整体舆情较为平稳。回购计划和大模型发布带动投资者情绪向好，港股机构投资者评价整体偏正面。国内监管政策走向仍是最主要的不确定性来源，游戏业务相关舆论持续受到未成年保护议题影响。',
    nodes: [
      { id: 'center', label: '腾讯控股', type: 'company', x: 350, y: 240 },
      { id: 'p1', label: '马化腾', type: 'person', x: 160, y: 120 },
      { id: 'p2', label: '刘炽平', type: 'person', x: 540, y: 120 },
      { id: 'p3', label: '张小龙', type: 'person', x: 180, y: 360 },
      { id: 'prod1', label: '微信', type: 'product', x: 80, y: 240 },
      { id: 'prod2', label: 'QQ', type: 'product', x: 620, y: 240 },
      { id: 'tech1', label: '混元大模型', type: 'technology', x: 260, y: 60 },
      { id: 'tech2', label: '腾讯云', type: 'technology', x: 440, y: 60 },
      { id: 'part1', label: 'Riot Games', type: 'partner', x: 350, y: 420 },
      { id: 'part2', label: '京东集团', type: 'partner', x: 520, y: 380 },
    ],
    edges: [
      { from: 'center', to: 'p1', label: '创始人/董事长' },
      { from: 'center', to: 'p2', label: 'CEO' },
      { from: 'center', to: 'p3', label: '微信事业群总裁' },
      { from: 'center', to: 'prod1', label: '核心产品' },
      { from: 'center', to: 'prod2', label: '核心产品' },
      { from: 'center', to: 'tech1', label: 'AI技术' },
      { from: 'center', to: 'tech2', label: '云业务' },
      { from: 'center', to: 'part1', label: '全资收购' },
      { from: 'center', to: 'part2', label: '战略参股' },
      { from: 'p3', to: 'prod1', label: '负责人' },
    ],
    inference: {
      relations: [
        { from: '腾讯', rel: '战略投资', to: '美团', confidence: 92, basis: '持股约17%，多轮参与融资，平台流量协同效应显著' },
        { from: '腾讯', rel: '竞争关系', to: '字节跳动', confidence: 97, basis: '短视频、直播、广告市场份额直接争夺，用户时长竞争激烈' },
        { from: '腾讯', rel: '潜在合作', to: '阿里巴巴', confidence: 63, basis: '监管政策推动平台互联互通，双方支付与电商场景存在整合空间' },
      ],
      trends: [
        { tech: 'AI大模型应用', direction: 'up', confidence: 88, desc: '混元大模型2.0加速商业化，对话、创作、搜索等场景渗透率快速提升' },
        { tech: '游戏出海增长', direction: 'up', confidence: 82, desc: 'Riot Games及TiMi工作室海外版权收入持续扩大，全球化战略成效显现' },
        { tech: '国内广告市场', direction: 'down', confidence: 58, desc: '字节系持续抢占品牌广告预算，腾讯广告收入增速面临压力' },
      ],
      opportunities: [
        { title: '企业微信SaaS深化', tag: '企业服务', desc: '国内企业数字化需求持续旺盛，企业微信生态可切入OA/CRM等高价值场景', score: 85 },
        { title: '腾讯云AI化转型', tag: '云计算', desc: 'AI+云融合趋势加速，混元大模型可驱动腾讯云差异化竞争', score: 91 },
        { title: '跨境游戏版权输出', tag: '出海', desc: '成熟IP全球化授权与本地化运营，可显著提升海外收入占比', score: 83 },
      ],
    },
  },
  '宁德时代新能源科技': {
    name: '宁德时代新能源科技股份有限公司',
    industry: '动力电池 / 储能',
    founded: '2011年',
    type: '上市公司（A股，创业板）',
    location: '福建省宁德市蕉城区车里湾新能源产业园',
    legalRep: '曾毓群',
    creditCode: '913509070327947C',
    financialSummary: '2023年营业收入约4,009亿元，同比增长约22%；净利润约441亿元；研发投入约184亿元，占营收4.6%。',
    news: [
      { date: '2024-12-11', title: '宁德时代凝聚态电池量产版本通过车规认证' },
      { date: '2024-12-06', title: '全球动力电池市场份额达38.1%，连续八年蝉联全球第一' },
      { date: '2024-11-28', title: '与大众汽车签署新一轮供货协议，合作规模扩大' },
      { date: '2024-11-15', title: '匈牙利超级工厂正式动工，欧洲本土化布局加速' },
      { date: '2024-11-08', title: '天行固态电池路线图披露，2027年具备量产能力' },
    ],
    associates: [
      { name: '时代新材料科技股份有限公司', relation: '参股子公司' },
      { name: '广汽集团', relation: '合资（因湃电池）' },
      { name: '特斯拉中国', relation: '重要供应客户' },
      { name: '大众汽车集团', relation: '长期战略客户' },
      { name: '比亚迪股份', relation: '竞争关系' },
    ],
    riskEvents: [
      { date: '2024-12-03', desc: '磷酸铁锂价格持续下行，电池原材料成本虽降但产品售价同步承压' },
      { date: '2024-11-25', desc: '比亚迪、中创新航等竞争对手产能加速扩张，价格竞争加剧' },
      { date: '2024-11-10', desc: '欧盟碳边境调节税落地时间临近，出口欧洲成本结构将发生变化' },
      { date: '2024-10-20', desc: '部分产线良率问题引发客户质量投诉，售后成本有所上升' },
    ],
    sentiment: '行业地位稳固，机构舆情整体积极。头部媒体对其技术领导力评价较高。价格战持续是主要隐忧，部分分析师对未来盈利能力趋势持谨慎态度。',
    nodes: [
      { id: 'center', label: '宁德时代', type: 'company', x: 350, y: 240 },
      { id: 'p1', label: '曾毓群', type: 'person', x: 160, y: 120 },
      { id: 'p2', label: '黄世霖', type: 'person', x: 540, y: 120 },
      { id: 'prod1', label: '麒麟电池', type: 'product', x: 80, y: 240 },
      { id: 'prod2', label: '凝聚态电池', type: 'product', x: 620, y: 240 },
      { id: 'tech1', label: 'CTP技术', type: 'technology', x: 260, y: 60 },
      { id: 'tech2', label: '固态电池', type: 'technology', x: 440, y: 60 },
      { id: 'part1', label: '特斯拉中国', type: 'partner', x: 200, y: 400 },
      { id: 'part2', label: '大众汽车', type: 'partner', x: 500, y: 400 },
    ],
    edges: [
      { from: 'center', to: 'p1', label: '创始人/董事长' },
      { from: 'center', to: 'p2', label: '首席制造官' },
      { from: 'center', to: 'prod1', label: '旗舰产品' },
      { from: 'center', to: 'prod2', label: '战略产品' },
      { from: 'center', to: 'tech1', label: '核心技术' },
      { from: 'center', to: 'tech2', label: '研发方向' },
      { from: 'center', to: 'part1', label: '战略供应' },
      { from: 'center', to: 'part2', label: '战略供应' },
      { from: 'tech1', to: 'prod1', label: '应用' },
    ],
    inference: {
      relations: [
        { from: '宁德时代', rel: '竞争关系', to: '比亚迪弗迪', confidence: 91, basis: '动力电池市场份额直接竞争，比亚迪自研电池对宁德供货形成替代' },
        { from: '宁德时代', rel: '战略供应', to: '特斯拉中国', confidence: 89, basis: '长期框架协议及工厂定制产线投入分析' },
        { from: '宁德时代', rel: '潜在投资', to: '上游锂矿企业', confidence: 76, basis: '原材料安全战略驱动，历史投资记录与矿资源谈判动态' },
      ],
      trends: [
        { tech: '固态电池量产', direction: 'up', confidence: 80, desc: '凝聚态电池为过渡方案，全固态2027年节点持续推进，量产节奏领先竞对' },
        { tech: '储能系统市场', direction: 'up', confidence: 93, desc: '全球储能装机规模年增超50%，宁德时代储能出货量持续扩张' },
        { tech: '碳酸锂价格', direction: 'down', confidence: 85, desc: '锂矿供给持续释放，碳酸锂价格中枢下移，电池成本红利逐步释放' },
      ],
      opportunities: [
        { title: '北美储能市场进入', tag: '出海', desc: '美国IRA法案驱动本土储能需求爆发，宁德时代可通过在地合作规避壁垒', score: 88 },
        { title: '电池回收循环产业', tag: '跨行业', desc: '退役电池规模快速增长，梯次利用与材料回收形成新的价值闭环', score: 82 },
        { title: '电动船舶动力电池', tag: '跨行业', desc: '航运脱碳政策驱动，宁德时代船用电池技术已进入商业验证阶段', score: 79 },
      ],
    },
  },
  '小米集团': {
    name: '小米集团',
    industry: '消费电子 / 智能硬件 / IoT',
    founded: '2010年',
    type: '上市公司（港股，代码1810）',
    location: '北京市海淀区小米科技园',
    legalRep: '雷军',
    creditCode: '91110108551385082J',
    financialSummary: '2023年营业收入约2,710亿元，同比增长约7%；净利润约193亿元（经调整）；研发投入约191亿元，占营收7.0%。',
    news: [
      { date: '2024-12-13', title: '小米SU7 Ultra正式发布，售价81.49万元冲击超豪华市场' },
      { date: '2024-12-07', title: '小米15系列首周预约量突破500万台，超越历史峰值' },
      { date: '2024-11-29', title: '小米汽车工厂二期规划获批，年产能目标提升至60万辆' },
      { date: '2024-11-20', title: '澎湃OS 2.0发布，全屋智能互联体验大幅升级' },
      { date: '2024-11-12', title: '小米全球IoT设备连接数量突破8.7亿，生态持续扩张' },
    ],
    associates: [
      { name: '小米汽车科技有限公司', relation: '全资子公司' },
      { name: '顺为资本', relation: '关联投资机构' },
      { name: '美的集团', relation: '战略合作' },
      { name: '高通公司', relation: '核心供应商' },
      { name: '华为终端', relation: '竞争关系' },
    ],
    riskEvents: [
      { date: '2024-12-04', desc: '汽车业务初期毛利率较低，规模效应尚未充分显现，对整体盈利能力形成短期拖累' },
      { date: '2024-11-18', desc: '手机市场高端化竞争激烈，苹果、华为双重挤压下高端份额提升难度加大' },
      { date: '2024-10-25', desc: '印度市场税务纠纷案件悬而未决，潜在罚款金额超40亿卢比' },
      { date: '2024-10-08', desc: '东南亚部分市场受当地品牌低价竞争，份额出现下滑' },
    ],
    sentiment: '整体舆情活跃且以正面为主。汽车业务进展持续引发广泛关注，SU7系列带动品牌热度大幅提升。部分消费者对汽车产品定价策略和交付能力持续关注，相关讨论在社交媒体上热度较高。',
    nodes: [
      { id: 'center', label: '小米集团', type: 'company', x: 350, y: 240 },
      { id: 'p1', label: '雷军', type: 'person', x: 160, y: 120 },
      { id: 'p2', label: '卢伟冰', type: 'person', x: 540, y: 120 },
      { id: 'p3', label: '李田原', type: 'person', x: 180, y: 370 },
      { id: 'prod1', label: '小米15', type: 'product', x: 80, y: 240 },
      { id: 'prod2', label: '小米SU7', type: 'product', x: 620, y: 240 },
      { id: 'tech1', label: '澎湃OS', type: 'technology', x: 260, y: 60 },
      { id: 'tech2', label: 'AIoT平台', type: 'technology', x: 440, y: 60 },
      { id: 'part1', label: '小米汽车', type: 'partner', x: 500, y: 390 },
      { id: 'part2', label: '顺为资本', type: 'partner', x: 350, y: 420 },
    ],
    edges: [
      { from: 'center', to: 'p1', label: '创始人/董事长' },
      { from: 'center', to: 'p2', label: '手机部总裁' },
      { from: 'center', to: 'p3', label: '汽车设计总监' },
      { from: 'center', to: 'prod1', label: '旗舰机型' },
      { from: 'center', to: 'prod2', label: '汽车产品' },
      { from: 'center', to: 'tech1', label: '操作系统' },
      { from: 'center', to: 'tech2', label: '生态技术' },
      { from: 'center', to: 'part1', label: '全资子公司' },
      { from: 'center', to: 'part2', label: '关联机构' },
      { from: 'p1', to: 'prod2', label: '亲自主导' },
      { from: 'tech1', to: 'prod1', label: '搭载' },
    ],
    inference: {
      relations: [
        { from: '小米集团', rel: '竞争关系', to: '苹果中国', confidence: 89, basis: '高端手机市场份额争夺，价格带与用户画像高度重叠' },
        { from: '小米集团', rel: '竞争关系', to: '华为终端', confidence: 94, basis: '国内中高端安卓市场直接竞争，Mate与小米数字旗舰系列正面对抗' },
        { from: '小米汽车', rel: '潜在合作', to: '宁德时代', confidence: 70, basis: '电池供应商多元化策略下，宁德为重要备选方案' },
      ],
      trends: [
        { tech: '小米汽车产能爬坡', direction: 'up', confidence: 85, desc: 'SU7系列供不应求，二期工厂获批后年产能将提升至60万辆，盈利拐点临近' },
        { tech: 'AIoT生态扩展', direction: 'up', confidence: 79, desc: '接入设备超8.7亿，澎湃OS跨设备互联能力持续强化，生态粘性显著提升' },
        { tech: '低端手机市场', direction: 'down', confidence: 72, desc: '战略主动收缩低价区间，品牌高端化推进中低端销量份额有所下滑' },
      ],
      opportunities: [
        { title: '汽车智能驾驶生态', tag: '跨行业', desc: '小米汽车与手机IoT生态打通，车家互联场景可形成独特用户体验壁垒', score: 90 },
        { title: '东南亚中高端手机', tag: '出海', desc: '东南亚消费升级趋势明显，小米品牌认知度高，中高端产品线扩张空间大', score: 84 },
        { title: '智能家居AI化升级', tag: '家居', desc: '大模型赋能家居控制与场景联动，澎湃OS可作为AI家居的核心入口', score: 87 },
      ],
    },
  },
};

// ─── Node visual config ───────────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<GraphNode['type'], { color: string; bg: string; border: string; label: string }> = {
  company:    { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', label: '企业' },
  person:     { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', label: '人物' },
  product:    { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', label: '产品' },
  technology: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: '技术' },
  partner:    { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: '关联方' },
};

const NODE_R = 30;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RightPanel({ data }: { data: CompanyData }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    basic: true, finance: true, news: true, associates: true, sentiment: false,
  });
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));

  const Section = ({ id, title, icon: Icon, children }: {
    id: string; title: string; icon: any; children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-700 flex-1">{title}</span>
        {open[id]
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open[id] && <div className="px-4 pb-3">{children}</div>}
    </div>
  );

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      {/* Company header */}
      <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {data.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{data.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{data.industry}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Basic info */}
        <Section id="basic" title="基本信息" icon={Building2}>
          <div className="flex flex-col gap-2">
            {[
              { icon: Briefcase, label: '成立', value: data.founded },
              { icon: Building2, label: '类型', value: data.type },
              { icon: MapPin, label: '地址', value: data.location },
              { icon: Users, label: '法人', value: data.legalRep },
              { icon: Link2, label: '信用代码', value: data.creditCode },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-2 text-[11px]">
                <Icon className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 flex-shrink-0">{label}：</span>
                <span className="text-gray-700 leading-tight">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Financial */}
        <Section id="finance" title="财务概况" icon={BarChart3Icon}>
          <p className="text-[11px] text-gray-600 leading-relaxed">{data.financialSummary}</p>
        </Section>

        {/* News */}
        <Section id="news" title="近期动态" icon={Newspaper}>
          <div className="flex flex-col gap-2.5">
            {data.news.map((n, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{n.date}</span>
                <p className="text-[11px] text-gray-700 leading-snug">{n.title}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Associates */}
        <Section id="associates" title="关联方" icon={Link2}>
          <div className="flex flex-col gap-2">
            {data.associates.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-gray-700 leading-tight flex-1">{a.name}</p>
                <span className="text-[10px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap">{a.relation}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Sentiment */}
        <Section id="sentiment" title="舆情分析" icon={MessageSquare}>
          <p className="text-[11px] text-gray-600 leading-relaxed">{data.sentiment}</p>
        </Section>
      </div>
    </div>
  );
}

function BarChart3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="18" y="3" width="4" height="18" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="2" y="13" width="4" height="8" rx="1" />
    </svg>
  );
}

function LeftPanel({ data }: { data: CompanyData }) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-900">行业风险监控</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">共 {data.riskEvents.length} 条风险事件</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {data.riskEvents.map((ev, i) => (
          <div key={i} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="text-[10px] text-orange-500">{ev.date}</span>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed">{ev.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphCanvas({ data, selectedNode, onSelectNode }: {
  data: CompanyData;
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const showLegend = true;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.graph-node')) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
    onSelectNode(null);
  }, [pan, onSelectNode]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panRef.current) return;
    setPan({ x: panRef.current.origX + e.clientX - panRef.current.startX, y: panRef.current.origY + e.clientY - panRef.current.startY });
  }, []);

  const handleSvgMouseUp = useCallback(() => { panRef.current = null; }, []);

  const posMap = Object.fromEntries(data.nodes.map(n => [n.id, { x: n.x, y: n.y }]));

  const selectedNodeData = data.nodes.find(n => n.id === selectedNode);
  const connectedEdges = selectedNode ? data.edges.filter(e => e.from === selectedNode || e.to === selectedNode) : [];
  const connectedIds = new Set(connectedEdges.flatMap(e => [e.from, e.to]));

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-50">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 shadow-sm">
          <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 shadow-sm">
          <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-7 h-7 bg-white border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 shadow-sm">
          <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Node detail tooltip */}
      {selectedNodeData && (
        <div className="absolute top-3 right-3 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_TYPE_CONFIG[selectedNodeData.type].bg, border: `1.5px solid ${NODE_TYPE_CONFIG[selectedNodeData.type].border}` }} />
            <span className="text-xs font-semibold text-gray-800">{selectedNodeData.label}</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: NODE_TYPE_CONFIG[selectedNodeData.type].bg, color: NODE_TYPE_CONFIG[selectedNodeData.type].color }}>
              {NODE_TYPE_CONFIG[selectedNodeData.type].label}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {connectedEdges.map((e, i) => {
              const other = data.nodes.find(n => n.id === (e.from === selectedNode ? e.to : e.from));
              return other ? (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-gray-400">{e.label}</span>
                  <span className="text-gray-700 font-medium">{other.label}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2">
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}` }} />
                <span className="text-[10px] text-gray-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#cbd5e1" />
          </marker>
          <marker id="arrow-highlight" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#2563eb" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {data.edges.map((edge, i) => {
            const src = posMap[edge.from];
            const tgt = posMap[edge.to];
            if (!src || !tgt) return null;
            const isHighlighted = selectedNode && connectedIds.has(edge.from) && connectedIds.has(edge.to);
            const dx = tgt.x - src.x, dy = tgt.y - src.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len, uy = dy / len;
            const x1 = src.x + ux * NODE_R, y1 = src.y + uy * NODE_R;
            const x2 = tgt.x - ux * (NODE_R + 6), y2 = tgt.y - uy * (NODE_R + 6);
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            return (
              <g key={i} opacity={selectedNode && !isHighlighted ? 0.2 : 1}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isHighlighted ? '#2563eb' : '#cbd5e1'}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  markerEnd={isHighlighted ? 'url(#arrow-highlight)' : 'url(#arrow)'}
                />
                <text x={mx} y={my - 4} textAnchor="middle" fontSize={9} fill={isHighlighted ? '#2563eb' : '#9ca3af'}>
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {data.nodes.map(node => {
            const cfg = NODE_TYPE_CONFIG[node.type];
            const isSelected = node.id === selectedNode;
            const isDimmed = selectedNode && !connectedIds.has(node.id) && node.id !== selectedNode;
            return (
              <g
                key={node.id}
                className="graph-node"
                style={{ cursor: 'pointer' }}
                opacity={isDimmed ? 0.25 : 1}
                onClick={e => { e.stopPropagation(); onSelectNode(isSelected ? null : node.id); }}
              >
                {isSelected && (
                  <circle cx={node.x} cy={node.y} r={NODE_R + 7} fill="none" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 2" />
                )}
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={cfg.bg}
                  stroke={isSelected ? '#2563eb' : cfg.border}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {node.type === 'company' && (
                  <circle cx={node.x} cy={node.y} r={NODE_R - 4} fill={cfg.color} opacity={0.12} />
                )}
                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={node.label.length > 4 ? 9 : 10} fontWeight="600" fill={cfg.color}>
                  {node.label.length > 5 ? node.label.slice(0, 5) : node.label}
                </text>
                <text x={node.x} y={node.y + NODE_R + 14} textAnchor="middle" fontSize={9} fill="#6b7280">
                  {node.label.length > 5 ? node.label : ''}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ─── Inference Panel ─────────────────────────────────────────────────────────

function InferencePanel({ data }: { data: CompanyData }) {
  const inf = data.inference;

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white" style={{ height: 200 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-gray-800">多模态知识图谱推理</span>
        <span className="text-[10px] text-gray-400 ml-1">基于图谱结构 · 新闻 · 财报 · 专利数据</span>
      </div>

      {/* 3 columns */}
      <div className="flex h-[calc(100%-33px)] divide-x divide-gray-100">

        {/* ① 企业关联关系推理 */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-3 py-2 gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Network className="w-3 h-3 text-blue-500" />
            <span className="text-[11px] font-semibold text-gray-700">企业关联关系推理</span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {inf.relations.map((r, i) => (
              <div key={i} className="bg-blue-50 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-[10px] mb-1">
                  <span className="font-medium text-blue-700 truncate max-w-[60px]">{r.from}</span>
                  <span className="bg-blue-200 text-blue-800 px-1 rounded font-medium flex-shrink-0">{r.rel}</span>
                  <span className="font-medium text-blue-700 truncate max-w-[60px]">{r.to}</span>
                  <span className="ml-auto flex-shrink-0 text-blue-500 font-semibold">{r.confidence}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.confidence}%` }} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{r.basis}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ② 行业趋势预测 */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-3 py-2 gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-[11px] font-semibold text-gray-700">行业趋势预测</span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {inf.trends.map((t, i) => (
              <div key={i} className={`rounded-lg px-2.5 py-1.5 ${t.direction === 'up' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {t.direction === 'up'
                    ? <ArrowUpRight className="w-3 h-3 text-green-500 flex-shrink-0" />
                    : <ArrowDownRight className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  <span className={`text-[11px] font-semibold truncate ${t.direction === 'up' ? 'text-green-700' : 'text-red-600'}`}>{t.tech}</span>
                  <span className={`ml-auto text-[10px] flex-shrink-0 font-medium ${t.direction === 'up' ? 'text-green-500' : 'text-red-400'}`}>{t.confidence}%</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ③ 市场机会发现 */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-3 py-2 gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span className="text-[11px] font-semibold text-gray-700">市场机会发现</span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {inf.opportunities.map((o, i) => (
              <div key={i} className="bg-amber-50 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-semibold text-amber-800 flex-1 truncate">{o.title}</span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 rounded flex-shrink-0">{o.tag}</span>
                  <span className="text-[10px] font-bold text-amber-600 flex-shrink-0 ml-1">{o.score}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Report data ─────────────────────────────────────────────────────────────

const REPORT_TEMPLATES = [
  { id: 'full',        name: '企业全景报告',  color: 'blue',   desc: '全面覆盖基本信息、财务、风险、市场机会', sections: ['overview', 'finance', 'graph', 'risk', 'sentiment', 'trends', 'opportunities', 'inference'] },
  { id: 'competitive', name: '竞争格局分析',  color: 'purple', desc: '聚焦竞争关系、市场定位与行业趋势',       sections: ['overview', 'graph', 'inference', 'trends'] },
  { id: 'risk',        name: '风险评估报告',  color: 'orange', desc: '深度风险识别、舆情监控与关联方风险',     sections: ['overview', 'risk', 'sentiment', 'inference'] },
  { id: 'investment',  name: '投资参考报告',  color: 'green',  desc: '市场机会与趋势预测综合分析',             sections: ['overview', 'finance', 'opportunities', 'trends', 'inference'] },
] as const;

type TemplateId = typeof REPORT_TEMPLATES[number]['id'];

const SECTION_CONFIG = [
  { id: 'overview',      label: '企业概况',     required: true  },
  { id: 'finance',       label: '财务概况',     required: false },
  { id: 'graph',         label: '图谱关系摘要', required: false },
  { id: 'risk',          label: '风险事件清单', required: false },
  { id: 'sentiment',     label: '舆情分析',     required: false },
  { id: 'trends',        label: '行业趋势预测', required: false },
  { id: 'opportunities', label: '市场机会分析', required: false },
  { id: 'inference',     label: '竞争关系推理', required: false },
] as const;

type SectionId = typeof SECTION_CONFIG[number]['id'];

const FINANCIAL_TREND: Record<string, { year: string; revenue: number; profit: number; rd: number }[]> = {
  '华为技术有限公司':       [{ year: '2021', revenue: 6368, profit: 564, rd: 1427 }, { year: '2022', revenue: 6423, profit: 356, rd: 1615 }, { year: '2023', revenue: 7042, profit: 627, rd: 1647 }],
  '比亚迪股份有限公司':     [{ year: '2021', revenue: 2161, profit: 30, rd: 106 }, { year: '2022', revenue: 4241, profit: 166, rd: 202 }, { year: '2023', revenue: 6023, profit: 300, rd: 408 }],
  '腾讯控股有限公司':       [{ year: '2021', revenue: 5601, profit: 2248, rd: 518 }, { year: '2022', revenue: 5546, profit: 1882, rd: 614 }, { year: '2023', revenue: 6090, profit: 1579, rd: 624 }],
  '宁德时代新能源科技':     [{ year: '2021', revenue: 1304, profit: 160, rd: 77 }, { year: '2022', revenue: 3286, profit: 307, rd: 155 }, { year: '2023', revenue: 4009, profit: 441, rd: 184 }],
  '小米集团':               [{ year: '2021', revenue: 3283, profit: 220, rd: 132 }, { year: '2022', revenue: 2800, profit: 85, rd: 160 }, { year: '2023', revenue: 2710, profit: 193, rd: 191 }],
};

const DEFAULT_FINANCIAL = [
  { year: '2021', revenue: 1200, profit: 80, rd: 60 },
  { year: '2022', revenue: 1800, profit: 140, rd: 95 },
  { year: '2023', revenue: 2400, profit: 200, rd: 130 },
];

// ─── ReportPreview ────────────────────────────────────────────────────────────

function ReportPreview({ data, sections }: { data: CompanyData; sections: Set<SectionId> }) {
  const financial = FINANCIAL_TREND[data.name] ?? DEFAULT_FINANCIAL;
  const latest = financial[financial.length - 1];
  const prev = financial[financial.length - 2];
  const revenueGrowth = prev ? (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : '–';

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const sentimentPos = data.name.includes('比亚迪') ? 72 : data.name.includes('腾讯') ? 61 : data.name.includes('华为') ? 68 : data.name.includes('宁德') ? 65 : 70;
  const sentimentNeg = 100 - sentimentPos - 8;

  const SectionHeading = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="flex items-baseline gap-3 mb-4">
      <div className="w-1 h-5 bg-blue-600 rounded-full flex-shrink-0 self-center" />
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
      <div className="flex-1 h-px bg-gray-100 ml-2" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* ── Report cover ── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-8 text-white">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-xs text-blue-200 mb-1 tracking-widest uppercase">Industry Analysis Report</div>
              <h1 className="text-2xl font-bold leading-tight">{data.name}</h1>
              <p className="text-blue-200 text-sm mt-1">{data.industry}</p>
            </div>
            <div className="text-right text-xs text-blue-200">
              <div>生成日期：{today}</div>
              <div className="mt-1">数据来源：垂直领域知识图谱</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '营业收入', value: `${latest.revenue.toLocaleString()} 亿元`, sub: `同比 +${revenueGrowth}%` },
              { label: '净利润', value: `${latest.profit.toLocaleString()} 亿元`, sub: `${latest.year}年` },
              { label: '研发投入', value: `${latest.rd.toLocaleString()} 亿元`, sub: `占营收 ${(latest.rd / latest.revenue * 100).toFixed(1)}%` },
            ].map((kpi, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="text-xs text-blue-200 mb-0.5">{kpi.label}</div>
                <div className="text-lg font-bold">{kpi.value}</div>
                <div className="text-xs text-blue-300 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* ── 企业概况 ── */}
          {sections.has('overview') && (
            <section>
              <SectionHeading title="企业概况" sub="基本信息与战略地位" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: '成立年份', value: data.founded },
                  { label: '企业类型', value: data.type },
                  { label: '注册地址', value: data.location },
                  { label: '法定代表人', value: data.legalRep },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                    <div className="text-sm font-medium text-gray-800 leading-snug">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-blue-700 mb-1">关联方概览</div>
                <div className="flex flex-wrap gap-2">
                  {data.associates.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-100 rounded-full text-xs text-gray-700">
                      <span>{a.name}</span>
                      <span className="text-blue-400">·</span>
                      <span className="text-blue-600">{a.relation}</span>
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 财务概况 ── */}
          {sections.has('finance') && (
            <section>
              <SectionHeading title="财务概况" sub="近三年营收、利润与研发投入（亿元）" />
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{data.financialSummary}</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={financial} barGap={4} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="亿" />
                    <Tooltip formatter={(v: number, name: string) => [`${v.toLocaleString()} 亿元`, name === 'revenue' ? '营业收入' : name === 'profit' ? '净利润' : '研发投入']} />
                    <Legend formatter={(v) => v === 'revenue' ? '营业收入' : v === 'profit' ? '净利润' : '研发投入'} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="profit"  fill="#22c55e" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="rd"      fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { label: '2023 营收增速', value: `+${revenueGrowth}%`, color: 'text-emerald-600' },
                  { label: '研发投入占比', value: `${(latest.rd / latest.revenue * 100).toFixed(1)}%`, color: 'text-blue-600' },
                  { label: '净利率', value: `${(latest.profit / latest.revenue * 100).toFixed(1)}%`, color: 'text-purple-600' },
                ].map((m, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 text-center">
                    <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 图谱关系摘要 ── */}
          {sections.has('graph') && (
            <section>
              <SectionHeading title="图谱关系摘要" sub="知识图谱节点与关系统计" />
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: '图谱节点', value: data.nodes.length },
                  { label: '关联边', value: data.edges.length },
                  { label: '关联方', value: data.associates.length },
                  { label: '推理关系', value: data.inference.relations.length },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">节点</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">类型</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">主要关联</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.nodes.slice(0, 6).map(n => {
                      const cfg = NODE_TYPE_CONFIG[n.type];
                      const edges = data.edges.filter(e => e.from === n.id || e.to === n.id);
                      return (
                        <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800 text-sm">{n.label}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{edges.map(e => e.label).slice(0, 2).join('、')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── 风险事件清单 ── */}
          {sections.has('risk') && (
            <section>
              <SectionHeading title="风险事件清单" sub={`共 ${data.riskEvents.length} 条已识别风险`} />
              <div className="space-y-2.5">
                {data.riskEvents.map((ev, i) => {
                  const severity = i < 2 ? { label: '高', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' }
                    : i < 4 ? { label: '中', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' }
                    : { label: '低', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${severity.bg} ${severity.border}`}>
                      <div className="flex-shrink-0 pt-0.5 flex flex-col items-center gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severity.badge}`}>{severity.label}</span>
                        <span className="text-[10px] text-gray-400">{ev.date.slice(5)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{ev.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 舆情分析 ── */}
          {sections.has('sentiment') && (
            <section>
              <SectionHeading title="舆情分析" sub="公众与媒体情绪监控" />
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.sentiment}</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 text-xs font-medium text-gray-600">
                  <span>正面舆情</span><span>中性</span><span>负面舆情</span>
                </div>
                <div className="h-5 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-400 transition-all" style={{ width: `${sentimentPos}%` }} />
                  <div className="bg-gray-200 transition-all" style={{ width: `${100 - sentimentPos - sentimentNeg}%` }} />
                  <div className="bg-red-300 transition-all" style={{ width: `${sentimentNeg}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span className="text-emerald-600 font-medium">{sentimentPos}%</span>
                  <span>{100 - sentimentPos - sentimentNeg}%</span>
                  <span className="text-red-500 font-medium">{sentimentNeg}%</span>
                </div>
              </div>
            </section>
          )}

          {/* ── 行业趋势预测 ── */}
          {sections.has('trends') && (
            <section>
              <SectionHeading title="行业趋势预测" sub="基于知识图谱推理的技术趋势判断" />
              <div className="space-y-3">
                {data.inference.trends.map((t, i) => (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${t.direction === 'up' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${t.direction === 'up' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {t.direction === 'up'
                        ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-sm ${t.direction === 'up' ? 'text-emerald-800' : 'text-red-700'}`}>{t.tech}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {t.direction === 'up' ? '↑ 上升趋势' : '↓ 下降趋势'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-2">{t.desc}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${t.direction === 'up' ? 'bg-emerald-400' : 'bg-red-300'}`} style={{ width: `${t.confidence}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium flex-shrink-0">置信度 {t.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 市场机会分析 ── */}
          {sections.has('opportunities') && (
            <section>
              <SectionHeading title="市场机会分析" sub="基于图谱推理发现的高价值机会" />
              <div className="space-y-3">
                {data.inference.opportunities.map((o, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-amber-600">{o.score}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{o.title}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{o.tag}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">{o.desc}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${o.score}%` }} />
                          </div>
                          <span className="text-xs text-amber-600 font-semibold flex-shrink-0">机会评分 {o.score}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 竞争关系推理 ── */}
          {sections.has('inference') && (
            <section>
              <SectionHeading title="竞争关系推理" sub="基于多源数据的隐性关系挖掘" />
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">实体</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">关系类型</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">对象</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600 text-xs">置信度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.inference.relations.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 text-xs">{r.from}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.rel.includes('竞争') ? 'bg-red-50 text-red-600' : r.rel.includes('合作') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{r.rel}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.to}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.confidence}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{r.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 leading-relaxed">
                  推理依据：综合知识图谱结构关系、新闻语料、财报披露及专利数据进行多模态推断，置信度反映证据充分程度。
                </p>
              </div>
            </section>
          )}

          {/* ── Footer ── */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-300">
            <span>垂直领域知识图谱系统 · 自动生成报告</span>
            <span>{today}</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── ReportView ───────────────────────────────────────────────────────────────

function ReportView({ data }: { data: CompanyData }) {
  const [templateId, setTemplateId] = useState<TemplateId>('full');
  const [enabledSections, setEnabledSections] = useState<Set<SectionId>>(
    new Set(REPORT_TEMPLATES[0].sections as unknown as SectionId[])
  );

  const applyTemplate = (tid: TemplateId) => {
    setTemplateId(tid);
    const tpl = REPORT_TEMPLATES.find(t => t.id === tid)!;
    setEnabledSections(new Set(tpl.sections as unknown as SectionId[]));
  };

  const toggleSection = (sid: SectionId, required: boolean) => {
    if (required) return;
    setEnabledSections(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const TEMPLATE_COLORS: Record<string, string> = {
    blue: 'border-blue-400 bg-blue-50 text-blue-800',
    purple: 'border-purple-400 bg-purple-50 text-purple-800',
    orange: 'border-orange-400 bg-orange-50 text-orange-800',
    green: 'border-emerald-400 bg-emerald-50 text-emerald-800',
  };

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`${data.name} 行业分析报告\n生成时间：${new Date().toLocaleString('zh-CN')}\n\n${data.financialSummary}`);
    a.download = `${data.name}_行业分析报告.txt`;
    a.click();
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      {/* ── Left config sidebar ── */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">报告配置</span>
          </div>
          <p className="text-xs text-gray-400">选择模板后快速生成图文报告</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Template selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">报告模板</p>
            <div className="space-y-1.5">
              {REPORT_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${templateId === tpl.id ? TEMPLATE_COLORS[tpl.color] + ' border-opacity-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-700'}`}>
                  <div className="font-medium text-sm leading-tight">{tpl.name}</div>
                  <div className="text-xs mt-0.5 opacity-70 leading-snug">{tpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section toggles */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">报告章节</p>
            <div className="space-y-1">
              {SECTION_CONFIG.map(sec => {
                const on = enabledSections.has(sec.id);
                return (
                  <button key={sec.id} onClick={() => toggleSection(sec.id, sec.required)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${sec.required ? 'cursor-default' : 'hover:bg-gray-50'} ${on ? 'text-gray-800' : 'text-gray-400'}`}>
                    {on
                      ? <CheckSquare className={`w-4 h-4 flex-shrink-0 ${sec.required ? 'text-gray-400' : 'text-blue-500'}`} />
                      : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />}
                    <span>{sec.label}</span>
                    {sec.required && <span className="ml-auto text-[10px] text-gray-400">必选</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <button onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />导出报告
          </button>
          <button onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />打印预览
          </button>
        </div>
      </div>

      {/* ── Right: report preview ── */}
      <ReportPreview data={data} sections={enabledSections} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const COMPANIES = Object.keys(COMPANY_DATA);

export default function VerticalDomainGraph() {
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'report'>('graph');

  const data = COMPANY_DATA[selectedCompany];

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    setSelectedNode(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <Network className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">垂直领域图谱</span>
        <div className="w-px h-4 bg-gray-200" />
        <select
          value={selectedCompany}
          onChange={e => handleCompanyChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:border-blue-400 min-w-48"
        >
          {COMPANIES.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-1">
          <button onClick={() => setView('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'graph' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <LayoutGrid className="w-3.5 h-3.5" />图谱视图
          </button>
          <button onClick={() => setView('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'report' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <FileText className="w-3.5 h-3.5" />行业报告
          </button>
        </div>

        {/* Legend (graph mode only) */}
        {view === 'graph' && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">点击节点查看关系详情</span>
            <div className="w-px h-4 bg-gray-200" />
            {Object.entries(NODE_TYPE_CONFIG).map(([, cfg]) => (
              <div key={cfg.label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}` }} />
                <span className="text-[11px] text-gray-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {view === 'graph' ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <LeftPanel data={data} />
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <GraphCanvas data={data} selectedNode={selectedNode} onSelectNode={setSelectedNode} />
            <InferencePanel data={data} />
          </div>
          <RightPanel data={data} />
        </div>
      ) : (
        <ReportView data={data} />
      )}
    </div>
  );
}
