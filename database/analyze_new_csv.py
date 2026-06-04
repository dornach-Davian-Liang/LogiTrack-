#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analyze chinese Pricing.csv structure"""
import csv, os

CSV_FILE = r'chinese Pricing.csv'

with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace', newline='') as f:
    reader = csv.reader(f, delimiter='\t')
    header = next(reader)
    print(f"Total columns: {len(header)}")
    print("\nColumn mapping:")
    for i, h in enumerate(header):
        clean = h.replace('\r\n', ' / ').replace('\n', ' / ').strip()
        print(f"  Col {i:2d}: {clean}")
    
    rows = list(reader)
    print(f"\nTotal data rows: {len(rows)}")
    print("\nFirst data row (first 12 fields):")
    if rows:
        for i, v in enumerate(rows[0][:15]):
            clean = header[i].replace('\r\n',' ').replace('\n',' ').strip()[:30]
            print(f"  [{i}] {clean}: {repr(v[:50])}")
