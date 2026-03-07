#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Print all column headers with their indices"""
import csv

CSV_MAIN = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv'

with open(CSV_MAIN, 'r', encoding='utf-8-sig', errors='replace') as f:
    reader = csv.reader(f)
    desc_row = next(reader)  # row 0: descriptions
    header_row = next(reader)  # row 1: actual headers

print(f"Total columns: {len(header_row)}")
print()
for i, h in enumerate(header_row):
    clean = h.replace('\n', ' / ').strip()
    print(f"  Col {i:2d}: {clean}")
