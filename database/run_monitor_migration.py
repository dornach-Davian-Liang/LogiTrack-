"""执行 migration_monitor.sql 建表脚本"""
import pymysql
import os

conn = pymysql.connect(
    host='localhost', user='root', password='ldf123',
    database='logitrack', charset='utf8mb4'
)
cur = conn.cursor()

sql_path = os.path.join(os.path.dirname(__file__), 'migration_monitor.sql')
with open(sql_path, encoding='utf-8') as f:
    sql = f.read()

# 逐条执行（跳过注释行和 USE 语句）
for stmt in sql.split(';'):
    stmt = stmt.strip()
    if not stmt:
        continue
    # 跳过纯注释块
    lines = [l for l in stmt.splitlines() if l.strip() and not l.strip().startswith('--')]
    clean = '\n'.join(lines).strip()
    if not clean or clean.upper().startswith('USE'):
        continue
    try:
        cur.execute(clean)
        print(f"OK: {clean[:60].replace(chr(10),' ')}")
    except Exception as e:
        print(f"ERR: {e}")

conn.commit()
conn.close()
print("\n=== Migration complete ===")
