"""
TRS Graph 连接与 Schema 初始化脚本。

用法（在 gkx-mis-api 目录下）：
  .venv/bin/python docs/trs_test.py init      # 执行注释中的 Schema DDL
  .venv/bin/python docs/trs_test.py query     # 运行示例 MATCH 查询
"""
import argparse
import sys
import time

from nebula3.Config import Config
from nebula3.gclient.net import ConnectionPool

# TRS Graph 连接配置（与 .env / TRS.md 一致）
TRS_HOST = '114.117.127.200'
TRS_PORT = 9669
TRS_USER = 'root'
TRS_PASSWORD = 'trsadmin'
TRS_SPACE = 'knowledge_graph'

# Schema 异步生效等待秒数（文档建议约 2 个心跳周期 ≈ 20s）
SCHEMA_WAIT_SECONDS = 22
INDEX_REBUILD_WAIT_SECONDS = 10

# 知识图谱典型 Schema（nGQL DDL，按顺序执行）
SCHEMA_STATEMENTS = [
    """
    CREATE SPACE IF NOT EXISTS knowledge_graph (
      partition_num = 100,
      replica_factor = 3,
      vid_type = FIXED_STRING(64)
    ) COMMENT = '知识图谱'
    """,
    'USE knowledge_graph',
    """
    CREATE TAG IF NOT EXISTS entity (
      name string NOT NULL,
      type string NOT NULL,
      aliases string,
      description string,
      source string,
      confidence double DEFAULT 1.0,
      created_at timestamp DEFAULT timestamp(),
      updated_at timestamp DEFAULT timestamp()
    )
    """,
    """
    CREATE EDGE IF NOT EXISTS relation (
      name string NOT NULL,
      weight double DEFAULT 1.0,
      confidence double DEFAULT 1.0,
      source string,
      properties string,
      created_at timestamp DEFAULT timestamp()
    )
    """,
    'CREATE TAG INDEX IF NOT EXISTS idx_entity_name ON entity(name(128))',
    'CREATE TAG INDEX IF NOT EXISTS idx_entity_type ON entity(type(64))',
    'CREATE EDGE INDEX IF NOT EXISTS idx_relation_name ON relation(name(128))',
    'REBUILD TAG INDEX idx_entity_name',
    'REBUILD TAG INDEX idx_entity_type',
    'REBUILD EDGE INDEX idx_relation_name',
]


def get_session():
    """创建连接池并返回会话。"""
    config = Config()
    config.max_connection_pool_size = 10
    pool = ConnectionPool()
    if not pool.init([(TRS_HOST, TRS_PORT)], config):
        raise RuntimeError(f'无法连接 TRS Graph: {TRS_HOST}:{TRS_PORT}')
    session = pool.get_session(TRS_USER, TRS_PASSWORD)
    return pool, session


def execute_stmt(session, stmt: str, label: str = '') -> bool:
    """执行单条 nGQL，打印结果。"""
    stmt = ' '.join(stmt.split())  # 压缩空白，便于单行执行
    print(f'\n>>> {label or stmt[:80]}')
    result = session.execute(stmt)
    if result.is_succeeded():
        if result.row_size() > 0:
            for row in result.rows():
                print(' ', row.values)
        else:
            print('  OK')
        return True
    print(f'  FAIL: {result.error_msg()}')
    return False


def init_knowledge_graph_schema() -> int:
    """执行知识图谱 Schema 初始化 DDL。"""
    pool, session = get_session()
    failed = 0
    try:
        for i, stmt in enumerate(SCHEMA_STATEMENTS):
            ok = execute_stmt(session, stmt, f'[{i + 1}/{len(SCHEMA_STATEMENTS)}]')
            if not ok:
                failed += 1
            # CREATE SPACE 后需等待异步生效
            if 'CREATE SPACE' in stmt.upper():
                print(f'\n... 等待图空间生效 {SCHEMA_WAIT_SECONDS}s ...')
                time.sleep(SCHEMA_WAIT_SECONDS)
            # REBUILD INDEX 后稍等
            if 'REBUILD' in stmt.upper():
                print(f'... 等待索引重建 {INDEX_REBUILD_WAIT_SECONDS}s ...')
                time.sleep(INDEX_REBUILD_WAIT_SECONDS)

        print('\n--- 验证 Schema ---')
        for verify in ('SHOW SPACES', f'USE {TRS_SPACE}', 'SHOW TAGS', 'SHOW EDGES',
                       'SHOW TAG INDEXES', 'SHOW EDGE INDEXES'):
            execute_stmt(session, verify)
    finally:
        session.release()
        pool.close()

    if failed:
        print(f'\n完成，{failed} 条语句失败')
        return 1
    print('\nSchema 初始化完成')
    return 0


def run_sample_query() -> int:
    """运行示例 MATCH 查询。"""
    pool, session = get_session()
    try:
        execute_stmt(session, f'USE {TRS_SPACE}')
        result = session.execute(
            'MATCH (v:entity{name:"人工智能"})-[e:relation]->(v2) '
            'RETURN v2.entity.name AS target, e.relation.name AS rel'
        )
        if result.is_succeeded():
            rows = list(result.rows())
            if not rows:
                print('查询成功，无匹配结果（可先 INSERT 测试数据）')
            else:
                for row in rows:
                    print(row.values)
            return 0
        print(f'查询失败: {result.error_msg()}')
        return 1
    finally:
        session.release()
        pool.close()


def main():
    parser = argparse.ArgumentParser(description='TRS Graph 测试脚本')
    parser.add_argument(
        'action',
        choices=('init', 'query'),
        help='init=执行 Schema DDL；query=运行示例查询',
    )
    args = parser.parse_args()
    if args.action == 'init':
        sys.exit(init_knowledge_graph_schema())
    sys.exit(run_sample_query())


if __name__ == '__main__':
    main()
