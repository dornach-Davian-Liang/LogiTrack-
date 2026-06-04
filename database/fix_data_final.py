import mysql.connector
conn = mysql.connector.connect(host='localhost',port=3306,user='root',password='ldf123',database='logitrack')
conn.autocommit = False
cur = conn.cursor()

# 删除错误插入的记录（指向 PAKISTAN CARGO SERVICE 而非 PCS）
cur.execute("DELETE FROM sales_pic WHERE id IN (796, 797, 798)")
print(f"Deleted wrong PCS PICs: {cur.rowcount} rows")

# 修正原始记录的 country_code AGENTS -> AG
cur.execute("""
    UPDATE sales_pic SET country_code = 'AG', updated_at = CURRENT_TIMESTAMP
    WHERE id IN (208, 209, 210) AND country_code = 'AGENTS'
""")
print(f"Fixed PCS PICs country_code: {cur.rowcount} rows updated")

# 也修正 AG-PCS2 office 中其他可能遗漏的 country_code=AGENTS PICs
cur.execute("""
    UPDATE sales_pic sp
    JOIN dict_sales_office so ON so.id = sp.sales_office_id
    SET sp.country_code = 'AG', sp.updated_at = CURRENT_TIMESTAMP
    WHERE so.code = 'AG-PCS2' AND sp.country_code = 'AGENTS'
""")
print(f"Fixed remaining AGENTS PICs in AG-PCS2: {cur.rowcount} rows")

conn.commit()
print("\nPhase 1 committed!")

# Fix non-breaking spaces in names (using Python to detect and fix)
cur.execute("SELECT id, name, name_norm FROM sales_pic")
pic_rows = cur.fetchall()
fixed_pics = 0
for pid, name, name_norm in pic_rows:
    new_name = name.replace('\xa0', ' ').strip()
    new_norm = name_norm.replace('\xa0', ' ').strip()
    if new_name != name or new_norm != name_norm:
        cur.execute("UPDATE sales_pic SET name=%s, name_norm=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s",
                    (new_name, new_norm, pid))
        fixed_pics += 1
print(f"Fixed non-breaking spaces in PICs: {fixed_pics} rows")

cur.execute("SELECT id, name, name_norm FROM dict_sales_office")
off_rows = cur.fetchall()
fixed_offs = 0
for oid, name, name_norm in off_rows:
    new_name = name.replace('\xa0', ' ').strip()
    new_norm = name_norm.replace('\xa0', ' ').strip()
    if new_name != name or new_norm != name_norm:
        cur.execute("UPDATE dict_sales_office SET name=%s, name_norm=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s",
                    (new_name, new_norm, oid))
        fixed_offs += 1
print(f"Fixed non-breaking spaces in offices: {fixed_offs} rows")

conn.commit()
print("\nAll fixes committed successfully!")
conn.close()
