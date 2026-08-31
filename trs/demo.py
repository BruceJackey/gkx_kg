import json
import time
from docs.trs_flex import TrsClient, TrsError

SPACE = 'demo'
client = TrsClient(default_space=SPACE)

vertices = [
    {"tag": "entity", "vid": "person_lisi", "props": {"name": "李四", "category": "人物", "shape": "circle", "color": "blue", "x": 140, "y": 130, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_zhangsan", "props": {"name": "张三", "category": "人物", "shape": "circle", "color": "blue", "x": 265, "y": 285, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_wangwu", "props": {"name": "王五", "category": "人物", "shape": "circle", "color": "blue", "x": 505, "y": 225, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "person_zhaoliu", "props": {"name": "赵六", "category": "人物", "shape": "circle", "color": "blue", "x": 935, "y": 210, "description": "示例人物节点"}},
    {"tag": "entity", "vid": "org_tsinghua", "props": {"name": "清华大学", "category": "机构", "shape": "square", "color": "purple", "x": 90, "y": 280, "description": "示例高校节点"}},
    {"tag": "entity", "vid": "org_peking", "props": {"name": "北京大学", "category": "机构", "shape": "square", "color": "purple", "x": 90, "y": 455, "description": "示例高校节点"}},
    {"tag": "entity", "vid": "paper_nips", "props": {"name": "NIPS论文", "category": "论文", "shape": "square", "color": "pink", "x": 435, "y": 50, "description": "示例论文节点"}},
    {"tag": "entity", "vid": "paper_attention", "props": {"name": "Attention论文", "category": "论文", "shape": "circle", "color": "green", "x": 785, "y": 280, "description": "示例论文节点"}},
    {"tag": "entity", "vid": "tech_deep_learning", "props": {"name": "深度学习", "category": "技术", "shape": "diamond", "color": "orange", "x": 555, "y": 420, "description": "示例技术节点"}},
    {"tag": "entity", "vid": "tech_machine_learning", "props": {"name": "机器学习", "category": "技术", "shape": "diamond", "color": "pink", "x": 780, "y": 70, "description": "示例技术节点"}},
]


edges = [
    {"edge": "relation", "src": "person_lisi", "dst": "paper_nips", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "李四研发NIPS论文"}},
    {"edge": "relation", "src": "paper_nips", "dst": "tech_machine_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "NIPS论文关联机器学习"}},
    {"edge": "relation", "src": "person_zhaoliu", "dst": "tech_machine_learning", "rank": 0, "props": {"name": "投资", "line_style": "dotted", "color": "pink", "weight": 1.0, "description": "赵六投资机器学习"}},
    {"edge": "relation", "src": "person_zhaoliu", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "赵六引用Attention论文"}},
    {"edge": "relation", "src": "person_wangwu", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "王五引用Attention论文"}},
    {"edge": "relation", "src": "tech_deep_learning", "dst": "paper_attention", "rank": 0, "props": {"name": "引用", "line_style": "dotted", "color": "green", "weight": 1.0, "description": "深度学习引用Attention论文"}},
    {"edge": "relation", "src": "person_wangwu", "dst": "tech_deep_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "王五研发深度学习"}},
    {"edge": "relation", "src": "person_zhangsan", "dst": "tech_deep_learning", "rank": 0, "props": {"name": "研发", "line_style": "solid", "color": "blue", "weight": 1.0, "description": "张三研发深度学习"}},
    {"edge": "relation", "src": "person_lisi", "dst": "person_zhangsan", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "李四与张三合作"}},
    {"edge": "relation", "src": "person_lisi", "dst": "person_wangwu", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "李四与王五合作"}},
    {"edge": "relation", "src": "person_lisi", "dst": "org_tsinghua", "rank": 0, "props": {"name": "隶属", "line_style": "solid", "color": "gray", "weight": 1.0, "description": "李四隶属清华大学"}},
    {"edge": "relation", "src": "person_zhangsan", "dst": "org_tsinghua", "rank": 0, "props": {"name": "隶属", "line_style": "solid", "color": "gray", "weight": 1.0, "description": "张三隶属清华大学"}},
    {"edge": "relation", "src": "org_tsinghua", "dst": "org_peking", "rank": 0, "props": {"name": "合作", "line_style": "solid", "color": "orange", "weight": 1.0, "description": "清华大学与北京大学合作"}},
]

print('>>> create space demo')
client.execute_raw("CREATE SPACE IF NOT EXISTS demo (partition_num = 10, replica_factor = 1, vid_type = FIXED_STRING(64)) COMMENT = '演示知识图谱空间';")
print('等待图空间生效 22s ...')
time.sleep(22)

print('>>> ensure schema + write vertices/edges')
# 使用 upsert 可重复运行，避免重复写入同一 VID/边 rank 时报错或产生脏数据。
for item in vertices:
    client.upsert_vertex(item['tag'], item['vid'], item['props'], mode='upsert', auto_schema=True, space=SPACE)
for item in edges:
    client.upsert_edge(item['edge'], item['src'], item['dst'], item['props'], rank=item.get('rank', 0), mode='upsert', auto_schema=True, space=SPACE)

print('>>> verify vertices')
print(json.dumps(client.execute('LOOKUP ON entity YIELD id(vertex) AS vid, properties(vertex).name AS name, properties(vertex).category AS category', space=SPACE), ensure_ascii=False, indent=2))
print('>>> verify edges from 李四 and 王五')
print(json.dumps(client.execute('GO FROM "person_lisi", "person_wangwu" OVER relation YIELD src(edge) AS src, dst(edge) AS dst, properties(edge).name AS rel', space=SPACE), ensure_ascii=False, indent=2))
client.close()