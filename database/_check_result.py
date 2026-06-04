#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证 unmapped POD/POL：增强匹配（忽略大小写+空格+标点+拼写）后还有多少真正匹配不上
"""
import csv, re, pymysql

conn = pymysql.connect(host='localhost', port=3306, user='root',
                       password='ldf123', database='logitrack', charset='utf8mb4')
cur = conn.cursor()

cur.execute("SELECT id, port_code, port_name, city, port_type, country_code FROM port ORDER BY port_code")
db_ports = cur.fetchall()

idx_code = {}; idx_name = {}; idx_city = {}
idx_name_ns = {}; idx_city_ns = {}

for pid, pcode, pname, city, ptype, ccode in db_ports:
    pc = (pcode or '').strip().upper()
    pn = (pname or '').strip().upper()
    ct = (city or '').strip().upper()
    if pc: idx_code[pc] = (pid, pcode, pname, city, ccode)
    if pn: idx_name[pn] = (pid, pcode, pname, city, ccode)
    if ct: idx_city[ct] = (pid, pcode, pname, city, ccode)
    if pn: idx_name_ns[re.sub(r'\s+','',pn)] = (pid, pcode, pname, city, ccode)
    if ct: idx_city_ns[re.sub(r'\s+','',ct)] = (pid, pcode, pname, city, ccode)

def enhanced_match(raw):
    t = raw.strip().upper()
    if t in idx_code or t in idx_name or t in idx_city:
        return 'ALREADY_MATCHED'
    t_ns = re.sub(r'\s+', '', t)
    if t_ns in idx_name_ns:
        return f"去空格name -> {idx_name_ns[t_ns][2]} [{idx_name_ns[t_ns][4]}]"
    if t_ns in idx_city_ns:
        return f"去空格city -> {idx_city_ns[t_ns][3]} [{idx_city_ns[t_ns][4]}]"
    t_cl = re.sub(r'[^A-Z0-9]', '', t)
    for pn, info in idx_name_ns.items():
        if re.sub(r'[^A-Z0-9]', '', pn) == t_cl:
            return f"去标点name -> {info[2]} [{info[4]}]"
    for ct, info in idx_city_ns.items():
        if re.sub(r'[^A-Z0-9]', '', ct) == t_cl:
            return f"去标点city -> {info[3]} [{info[4]}]"
    for sfx in [' PORT', ' CITY', ' STATION', ' DISTRICT']:
        if t.endswith(sfx):
            base = t[:-len(sfx)].strip()
            if base in idx_code: return f"去后缀code -> {idx_code[base][2]}"
            if base in idx_name: return f"去后缀name -> {idx_name[base][2]}"
            if base in idx_city: return f"去后缀city -> {idx_city[base][3]}"
    if len(t) > 4:
        def ed(a, b):
            if abs(len(a)-len(b)) > 2: return 99
            m,n=len(a),len(b); dp=list(range(n+1))
            for i in range(1,m+1):
                prev,dp[0]=dp[0],i
                for j in range(1,n+1):
                    prev,dp[j]=dp[j],prev if a[i-1]==b[j-1] else min(prev,dp[j],dp[j-1])+1
            return dp[n]
        best_d, best_info = 99, None
        for ct, info in idx_city.items():
            d = ed(t, ct)
            if d < best_d: best_d, best_info = d, info
        for pn, info in idx_name.items():
            d = ed(t, pn)
            if d < best_d: best_d, best_info = d, info
        if best_d <= 2 and best_info:
            return f"拼写近(d={best_d}) -> {best_info[2] or best_info[3]} [{best_info[4]}]"
    return None

for filename in ['unmapped_Ocean_pod.csv', 'unmapped_Air_pod.csv',
                 'unmapped_Ocean_pol.csv', 'unmapped_Air_pol.csv']:
    vals = []
    with open(filename, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            vals.append((row['CSV\u539f\u59cb\u503c'], int(row['\u51fa\u73b0\u6b21\u6570'])))
    print(f"\n{'='*60}")
    print(f"{filename}: {len(vals)} \u4e2a\u672a\u5339\u914d\u503c")
    print(f"{'='*60}")
    can_fix = 0; rows_fix = 0; still_miss = 0; rows_miss = 0
    for raw, count in vals:
        result = enhanced_match(raw)
        if result:
            can_fix += 1; rows_fix += count
            print(f"  FIX ({count:3d}x): {repr(raw):42s} -> {result}")
        else:
            still_miss += 1; rows_miss += count
    print(f"\n  >>> \u53ef\u4fee\u590d: {can_fix}/{len(vals)} \u4e2a\u503c ({rows_fix} \u6761\u8bb0\u5f55)")
    print(f"  >>> \u4ecd\u65e0\u6cd5\u5339\u914d: {still_miss}/{len(vals)} \u4e2a\u503c ({rows_miss} \u6761\u8bb0\u5f55)")

conn.close()
