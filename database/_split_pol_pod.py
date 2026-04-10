#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 unmapped_pol.csv / unmapped_pod.csv 按 Reference Number 中的产品类型
拆分为 Air 和 Ocean 四个文件。

分类规则（基于 Reference Number 后缀字母）：
  CN2501006-A   → 仅有 A → AIR
  CN2501006-A1  → 仅有 A（数字不算）→ AIR
  CN2501002-S   → 无 A → OCEAN
  CN2501044-R   → 无 A → OCEAN
  CN2501044-RS  → 无 A → OCEAN
  CN2510181-AS1 → A + S → OCEAN（混合运输含海运）
  CN2501044-RA  → R + A → OCEAN（混合运输含铁路）
  CN2501044-SA  → S + A → OCEAN（混合运输含海运）
  CN2501044-ARS → A + R + S → OCEAN（混合运输）
"""
import csv, re, os
from collections import defaultdict

# ── 读取原始 CSV 数据源，建立 ref_number → product_abbr 映射 ──
rows = []
with open('chinese Pricing.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f, delimiter='\t')
    next(reader)
    for row in reader:
        if len(row) < 10:
            continue
        if len(row) < 34:
            row = row + [''] * (34 - len(row))
        rows.append(row)

def extract_abbr(ref: str) -> str:
    """从 Reference Number 提取产品缩写字母"""
    m = re.match(r'^CN\d+-([A-Z]+)', ref.strip())
    return m.group(1) if m else ''

def classify(abbr: str) -> str:
    """
    仅有 A（无其他大写字母）→ AIR
    其他所有情况 → OCEAN
    """
    letters = set(abbr.upper())
    letters.discard('0'); letters.discard('1'); letters.discard('2')
    letters.discard('3'); letters.discard('4'); letters.discard('5')
    letters.discard('6'); letters.discard('7'); letters.discard('8'); letters.discard('9')
    if letters == {'A'}:
        return 'Air'
    return 'Ocean'

# 建立 ref → type 映射
ref_type_map = {}
for row in rows:
    ref = row[2].strip()
    abbr = extract_abbr(ref)
    ref_type_map[ref] = classify(abbr)

# 统计分布
type_counts = defaultdict(int)
for t in ref_type_map.values():
    type_counts[t] += 1
print(f"Reference Number 分类统计: Air={type_counts['Air']}, Ocean={type_counts['Ocean']}")

# ── 拆分 POL / POD 文件 ──
def split_file(input_file, output_air, output_ocean, label):
    """读取 unmapped 文件，按 ref 分类写入两个文件"""
    with open(input_file, encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader)
        all_rows = list(reader)

    # 找到 Reference Number 列的位置
    ref_col_idx = None
    for i, h in enumerate(header):
        if 'Reference' in h:
            ref_col_idx = i
            break

    if ref_col_idx is None:
        print(f"  ⚠️ {input_file}: 未找到 Reference Number 列，跳过")
        return

    air_rows = []
    ocean_rows = []

    for row in all_rows:
        refs_str = row[ref_col_idx] if ref_col_idx < len(row) else ''
        # 该列可能包含多个 ref（用 ; 分隔的前5个）
        refs = [r.strip() for r in refs_str.split(';') if r.strip()]

        # 根据所有 ref 判断类型
        has_air = False
        has_ocean = False
        for ref in refs:
            rtype = ref_type_map.get(ref, '')
            if rtype == 'Air':
                has_air = True
            elif rtype == 'Ocean':
                has_ocean = True

        # 如果混合出现，两边都放
        if has_air:
            air_rows.append(row)
        if has_ocean:
            ocean_rows.append(row)
        if not has_air and not has_ocean:
            # 兜底：无法判断的归入 Ocean
            ocean_rows.append(row)

    # 写 Air 文件
    with open(output_air, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in air_rows:
            w.writerow(r)

    # 写 Ocean 文件
    with open(output_ocean, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in ocean_rows:
            w.writerow(r)

    print(f"  ✅ {label}: Air={len(air_rows)}行 → {output_air},  Ocean={len(ocean_rows)}行 → {output_ocean}")

print("\n拆分 POL 文件:")
split_file('unmapped_pol.csv', 'unmapped_Air_pol.csv', 'unmapped_Ocean_pol.csv', 'POL')

print("\n拆分 POD 文件:")
split_file('unmapped_pod.csv', 'unmapped_Air_pod.csv', 'unmapped_Ocean_pod.csv', 'POD')

print("\n📄 生成文件:")
for fn in ['unmapped_Air_pol.csv', 'unmapped_Ocean_pol.csv', 'unmapped_Air_pod.csv', 'unmapped_Ocean_pod.csv']:
    size = os.path.getsize(fn)
    with open(fn, encoding='utf-8-sig') as f:
        lines = sum(1 for _ in f) - 1  # 减去表头
    print(f"  {fn}: {lines} 行, {size} bytes")
