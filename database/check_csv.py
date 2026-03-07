#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv

CSV_MAIN = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv'
CSV_SRC = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\database\chinese Pricing.csv'

print("=== Main CSV ===")
with open(CSV_MAIN, 'r', encoding='utf-8-sig', errors='replace') as f:
    for i, line in enumerate(f):
        if i >= 6:
            break
        print(f"Row {i} (cols~{len(line.split(','))}): {repr(line[:200])}")

print()
print("=== chinese Pricing.csv ===")
import os
sz = os.path.getsize(CSV_SRC)
print(f"Size: {sz} bytes")
if sz > 0:
    with open(CSV_SRC, 'rb') as f:
        print(repr(f.read(500)))
