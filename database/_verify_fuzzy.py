#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv

print('=== Sales PIC - 有模糊匹配建议的条目 ===')
count = 0
with open('unmapped_sales_pic.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        fuzzy = row.get('系统可能匹配（模糊）', '')
        if fuzzy:
            count += 1
            print(f"  [{count:3d}] CSV: {repr(row['CSV原始姓名']):40s} -> {repr(fuzzy)}  [{row['匹配原因']}]  ({row['出现次数']}次)")
print(f"共 {count} 条有模糊匹配建议\n")

print('=== Sales Office - 全部 ===')
with open('unmapped_sales_office.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        fuzzy = row.get('系统可能匹配（模糊）', '')
        flag = f' -> {repr(fuzzy)} [{row.get("匹配原因","")}]' if fuzzy else ''
        print(f"  CSV: {repr(row['CSV原始办公室名称']):45s}  {row['出现次数']:4s}次{flag}")
        print(f"       {row['建议操作']}")
