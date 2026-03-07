import mysql.connector
import re

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack'
}

SQL_PATH = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\patch_missing_data.sql'

with open(SQL_PATH, encoding='utf-8') as f:
    content = f.read()

conn = mysql.connector.connect(**DB_CONFIG)
conn.autocommit = False
cur = conn.cursor()

# Split into statements (handle multi-line)
# Remove comments
content_no_comments = re.sub(r'--[^\n]*', '', content)
# Split by semicolons
raw_stmts = content_no_comments.split(';')
stmts = [s.strip() for s in raw_stmts if s.strip()]

print(f"共 {len(stmts)} 条 SQL 语句\n")

ok = 0
err = 0
for i, stmt in enumerate(stmts, 1):
    if not stmt:
        continue
    # Skip USE/SET that mysql.connector handles differently
    try:
        cur.execute(stmt)
        rows = cur.fetchall() if cur.description else []
        if rows:
            for r in rows:
                print(f"  ▶ {r}")
        ok += 1
    except Exception as e:
        print(f"❌ 语句 {i}: {e}")
        print(f"   SQL: {stmt[:120]}...")
        err += 1
        conn.rollback()
        break

if err == 0:
    conn.commit()
    print(f"\n✅ 全部执行成功 ({ok} 条语句)")
else:
    conn.rollback()
    print(f"\n❌ 发生错误，已回滚")

conn.close()
