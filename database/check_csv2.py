#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check CSV structure - find header row and data rows"""
import csv, os

CSV_MAIN = r'c:\logitrack\LogiTrack--update-status-report-20260126023903\China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv'

print("=== Main CSV - First 6 logical rows ===")
with open(CSV_MAIN, 'r', encoding='utf-8-sig', errors='replace') as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if i >= 6:
            break
        print(f"Logical row {i} (cols={len(row)}): first fields = {row[:5]}")
        if len(row) > 30:
            print(f"  Total cols: {len(row)}")
