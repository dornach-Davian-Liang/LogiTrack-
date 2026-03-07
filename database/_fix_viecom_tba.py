# -*- coding: utf-8 -*-
"""修复 VIECOM(OT) 和 TBA 的 PIC 归属"""
import mysql.connector, re, unicodedata

def normalize(s):
    s = s.replace('\xa0', ' ')
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', s).strip().upper()

conn = mysql.connector.connect(host='localhost', port=3306, user='root',
                               password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

# 1) 查找现有的 VIECOM 和 TBA office
cur.execute("SELECT id, code, name, country_code FROM dict_sales_office WHERE name_norm IN ('VIECOM','TBA')")
rows = cur.fetchall()
print("匹配到的 offices:")
for r in rows:
    print(f"  id={r[0]}, code={r[1]}, name={r[2]}, country={r[3]}")

# 2) 找 AGENTS 的 VIECOM office（用于 OT VIECOM PIC）
# 和 TBA office（用于 TBA PICs）
viecom_id = None
tba_id = None
for r in rows:
    if normalize(r[2]) == 'VIECOM':
        viecom_id = r[0]
    if normalize(r[2]) == 'TBA' and r[3] == 'TBA':
        tba_id = r[0]

print(f"\nviecom_id={viecom_id}, tba_id={tba_id}")

# 3) 插入缺失的 PICs
# OTHERS/VIECOM -> VINCE CURRO (已跳过，因为 office 未找到)
# TBA/TBA -> 17个 PICs

tba_pics = [
    'ABBY HUANG', 'ADITHYA RANJITH', 'ARIELA', 'ASAD ISLAM',
    'DIANA PAOLA CIRO GIRALDO', 'FADY ABIKARAM', 'HARRISON', 'HELEEMA ASIF',
    'ILKER', 'IRENE WONG', 'KC HO', 'LEE TYRER', 'LIKER USTUNDAG',
    'PRAJWOL AMATYA', 'R SURESH', 'RENATO TRUST', 'SA REHMAN', 'SIJY JACOB'
]

inserted = 0
skipped = 0

# Insert TBA PICs
if tba_id:
    cur.execute("SELECT name_norm FROM sales_pic WHERE sales_office_id=%s", (tba_id,))
    existing_norms = {r[0] for r in cur.fetchall()}
    for pic_name in tba_pics:
        norm = normalize(pic_name)
        if norm not in existing_norms:
            try:
                cur.execute(
                    "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id) VALUES (%s, %s, %s, %s)",
                    (pic_name, norm, 'TBA', tba_id)
                )
                inserted += 1
                existing_norms.add(norm)
            except mysql.connector.errors.IntegrityError as e:
                print(f"  [SKIP] {pic_name}: {e}")
                skipped += 1
        else:
            skipped += 1

# Insert VIECOM VINCE CURRO under existing VIECOM office
if viecom_id:
    cur.execute("SELECT name_norm FROM sales_pic WHERE sales_office_id=%s", (viecom_id,))
    existing_norms = {r[0] for r in cur.fetchall()}
    if normalize('VINCE CURRO') not in existing_norms:
        try:
            cur.execute(
                "INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id) VALUES (%s, %s, %s, %s)",
                ('VINCE CURRO', normalize('VINCE CURRO'), 'AG', viecom_id)
            )
            inserted += 1
        except mysql.connector.errors.IntegrityError as e:
            print(f"  [SKIP] VINCE CURRO: {e}")
            skipped += 1

conn.commit()
print(f"\n插入 {inserted} 条，跳过 {skipped} 条")

cur.execute("SELECT COUNT(*) FROM sales_pic")
print(f"sales_pic 总数: {cur.fetchone()[0]}")
cur.close()
conn.close()
