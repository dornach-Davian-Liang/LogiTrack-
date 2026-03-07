#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""分析 chinese Pricing.csv 数据质量问题"""
import csv, re
from collections import Counter, defaultdict

CSV_FILE = r'chinese Pricing.csv'

# 容器类型标准代码映射
CONTAINER_MAP = {
    "20'gp": "20GP", "20gp": "20GP", "20'": "20GP",
    "40'gp": "40GP", "40gp": "40GP", "40'": "40GP",
    "40'hq": "40HQ", "40hq": "40HQ", "40'hc": "40HQ", "40hc": "40HQ",
    "45'hq": "45HQ", "45hq": "45HQ", "45'hc": "45HQ",
    "20'rf": "20RF", "20rf": "20RF",
    "40'rf": "40RF", "40rf": "40RF",
    "20'ot": "20OT", "20ot": "20OT",
    "40'ot": "40OT", "40ot": "40OT",
    "20'fr": "20FR", "20fr": "20FR", "20' flat rack": "20FR", "20'flat rack": "20FR",
    "40'fr": "40FR", "40fr": "40FR", "40' flat rack": "40FR", "40'flat rack": "40FR",
    "20' iso tank": "20TK", "20'iso tank": "20TK", "20' tank": "20TK",
    "20' iso tank container": "20TK",
    "40' iso tank": "40TK", "40'iso tank": "40TK",
    "20'tk": "20TK", "40'tk": "40TK",
}

CONTAINER_TEU = {"20GP": 1, "20RF": 1, "20OT": 1, "20FR": 1, "20TK": 1,
                  "40GP": 2, "40HQ": 2, "45HQ": 2, "40RF": 2, "40OT": 2, "40FR": 2, "40TK": 2}

VALID_UOMS = {"KG", "CBM"}

def clean(v): return v.strip().replace('\r\n', ' ').replace('\n', ' ')

def normalize_unit(raw):
    """尝试将 Quantity(Unit) 解析为标准代码或 KG/CBM"""
    v = raw.strip()
    low = v.lower().strip("'\"")
    low_norm = re.sub(r'\s+', ' ', low)
    
    if low_norm in ('kg',): return 'KG', None
    if low_norm in ('cbm',): return 'CBM', None
    
    # 单个容器类型
    key = low_norm.strip()
    if key in CONTAINER_MAP:
        return 'CONTAINER', [CONTAINER_MAP[key]]
    
    # 多容器（/ 分隔）
    if '/' in v:
        parts = [p.strip().lower() for p in v.split('/')]
        codes = []
        for p in parts:
            pk = p.strip("'\"")
            if pk in CONTAINER_MAP:
                codes.append(CONTAINER_MAP[pk])
            else:
                return 'UNKNOWN', v
        return 'MULTI_CONTAINER', codes
    
    return 'UNKNOWN', v

def is_numeric(v):
    try:
        float(v.strip())
        return True
    except:
        return False

with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace', newline='') as f:
    reader = csv.reader(f, delimiter='\t')
    header = next(reader)
    rows = list(reader)

print(f"Total rows: {len(rows)}")

qty_errors = []
unit_summary = Counter()
unit_unknown = []
multi_container_rows = []
tba_date_count = 0

for i, row in enumerate(rows):
    if len(row) < 20:
        continue
    ref = clean(row[2])
    cargo_type = clean(row[11]) if len(row) > 11 else ''
    qty_raw = clean(row[13]) if len(row) > 13 else ''
    unit_raw = clean(row[14]) if len(row) > 14 else ''
    teu_raw = clean(row[15]) if len(row) > 15 else ''
    cargo_ready = clean(row[23]) if len(row) > 23 else ''
    
    # Quantity 错误
    if qty_raw and not is_numeric(qty_raw):
        qty_errors.append((i+2, ref, qty_raw, unit_raw))
    
    # Unit 分析
    if unit_raw:
        uom_type, uom_val = normalize_unit(unit_raw)
        unit_summary[uom_type] += 1
        if uom_type == 'UNKNOWN':
            unit_unknown.append((i+2, ref, unit_raw, qty_raw, teu_raw))
        elif uom_type == 'MULTI_CONTAINER':
            multi_container_rows.append((i+2, ref, unit_raw, qty_raw, teu_raw, uom_val))
    
    # Cargo Ready Date TBA
    if cargo_ready.upper() == 'TBA' or cargo_ready == '-':
        tba_date_count += 1

print(f"\n=== Quantity 错误 ===")
print(f"非数字 Quantity: {len(qty_errors)} 行")
for r in qty_errors[:5]:
    print(f"  Row {r[0]}: ref={r[1]}, qty={repr(r[2])}, unit={repr(r[3])}")

print(f"\n=== Quantity(Unit) 分布 ===")
for k, v in unit_summary.most_common():
    print(f"  {k}: {v}")
print(f"未知单位: {len(unit_unknown)} 行")
for r in unit_unknown[:10]:
    print(f"  Row {r[0]}: ref={r[1]}, unit={repr(r[2])}, qty={repr(r[3])}, teu={repr(r[4])}")

print(f"\n=== 多容器类型 ===")
print(f"多柜型行数: {len(multi_container_rows)}")

print(f"\n=== Cargo Ready Date TBA ===")
print(f"TBA/- 日期: {tba_date_count} 行")
