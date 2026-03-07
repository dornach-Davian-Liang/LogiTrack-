#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chinese Pricing CSV → MySQL 数据迁移脚本
数据源: China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv
目标: logitrack 数据库 (schema_v2)

用法: python migrate_chinese_pricing.py [--dry-run] [--limit N]
"""

import csv
import re
import json
import sys
import os
import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from collections import defaultdict

# ============================================================
# 配置
# ============================================================

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 
    'China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv')

LOG_FILE = os.path.join(os.path.dirname(__file__), 'migration_error_log.csv')

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'logitrack',
    'charset': 'utf8mb4',
}

DRY_RUN = '--dry-run' in sys.argv
LIMIT = None
for i, arg in enumerate(sys.argv):
    if arg == '--limit' and i + 1 < len(sys.argv):
        LIMIT = int(sys.argv[i + 1])

# ============================================================
# 日志配置
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'migration.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ============================================================
# 列索引常量（CSV 第2行为列标题）
# ============================================================

COL_ENQUIRY_RECEIVED_DATE = 0
COL_ISSUE_DATE = 1
COL_REFERENCE_NUMBER = 2
COL_PRODUCT = 3
COL_STATUS = 4
COL_CN_PRICING_ADMIN = 5
COL_SALES_COUNTRY = 6
COL_SALES_OFFICE = 7
COL_SALES_PIC = 8
COL_ASSIGNED_CN_OFFICES = 9
COL_CARGO_TYPE = 10
COL_VOLUME_CBM = 11
COL_QUANTITY = 12
COL_QUANTITY_UNIT = 13
COL_QUANTITY_TEU = 14
COL_COMMODITY = 15
COL_HAZ_SPECIAL = 16
COL_POL = 17
COL_POD = 18
COL_POD_COUNTRY = 19
COL_CORE_FLAG = 20
COL_CATEGORY = 21
COL_CARGO_READY_DATE = 22
COL_ADDITIONAL_REQUIREMENT = 23
COL_1ST_QUOTATION_SENT = 24
COL_1ST_OFFER_OCEAN = 25
COL_1ST_OFFER_AIR = 26
COL_LATEST_OFFER_OCEAN = 27
COL_LATEST_OFFER_AIR = 28
COL_BOOKING_CONFIRMED = 29
COL_REMARK = 30
COL_REJECTED_REASON = 31
COL_ACTUAL_REASON = 32

# ============================================================
# 映射字典
# ============================================================

# Sales Country → country_code
SALES_COUNTRY_MAP = {
    'AGENTS': 'AGENTS',
    'BELGIUM': 'BE',
    'CHINA': 'CN',
    'FRANCE': 'FR',
    'GERMANY': 'DE',
    'GREECE': 'GR',
    'MOROCCO': 'MA',
    'NETHERLANDS': 'NL',
    'OTHERS': 'OTHERS',
    'POLAND': 'PL',
    'SOUTH_AFRICA': 'ZA',
    'SWITZERLAND': 'CH',
    'UK': 'GB',
    'USA': 'US',
}

# Product → (code, abbr)
PRODUCT_MAP = {
    'AIR': ('AIR', 'A'),
    'SEA': ('SEA', 'S'),
    'SEA-AIR': ('SEA-AIR', 'SA'),
    'RAIL': ('RAIL', 'R'),
    'RAIL-SEA': ('RAIL-SEA', 'RS'),
    'RAIL-AIR': ('RAIL-AIR', 'RA'),
    'AIR-RAIL-SEA': ('AIR-RAIL-SEA', 'ARS'),
}

# Cargo Type → offer_type
CARGO_TO_OFFER_TYPE = {
    'AIR': 'AIR',
    'FCL': 'OCEAN',
    'LCL': 'OCEAN',
    'RAIL': 'OTHER',
    'SEA': 'OCEAN',
}

# Category 标准化映射
CATEGORY_MAP = {
    'ORIGIN CHARGES & EXW': 'ORIGIN_CHARGES_EXW',
    'OCEAN FREIGHT': 'OCEAN_FREIGHT',
    'AIR FREIGHT': 'AIR_FREIGHT',
    'AIR FREIGHT + ORIGIN CHARGE & EXW': 'AIR_FREIGHT_ORIGIN',
    'OCEAN FREIGHT + ORIGIN CHARGES & EXW': 'OCEAN_FREIGHT_ORIGIN',
    'LCL': 'LCL',
    'OCEAN FREIGHT + ORIGIN CHARGES & EXW + DEST. CHARGES': 'OCEAN_FREIGHT_ORIGIN_DEST',
    'DEST. CHARGES': 'DEST_CHARGES',
}

# Booking Confirmed 标准化
BOOKING_MAP = {
    'YES': 'Yes',
    'REJECTED': 'Rejected',
    'PENDING': 'Pending',
    'INVALID': 'Invalid',
}

# 柜型代码标准化
CONTAINER_CODE_NORMALIZE = {
    "20'GP": '20GP', "20GP": '20GP', "20'FT": '20GP', "20FT": '20GP',
    "20'DC": '20GP', "20'DV": '20GP', "20;GP": '20GP',
    "40'GP": '40GP', "40GP": '40GP', "40'FT": '40GP', "40FT": '40GP',
    "40'HQ": '40HQ', "40HQ": '40HQ', "40'HC": '40HQ', "40HC": '40HQ',
    "45'HQ": '45HQ', "45HQ": '45HQ', "45*HQ": '45HQ',
    "20'OT": '20OT', "20OT": '20OT', "20 FT OPEN TOP": '20OT', "20' open top": '20OT',
    "40'OT": '40OT', "40OT": '40OT', "40'FT OT": '40OT', "40 FT OOG": '40OT',
    "20'FR": '20FR', "20FR": '20FR', "20'FR OOG": '20FR',
    "40'FR": '40FR', "40FR": '40FR', "40 FLAT RACK": '40FR',
    "40'FR (OOG)": '40FR', "40'FR OOG": '40FR', "40' Flat Rack": '40FR',
    "20'RF": '20RF', "20'REEFER": '20RF', "20 REEFER": '20RF',
    "40'RF": '40RF', "40'RF (OOG)": '40RF', "40 REEFER": '40RF', "40 REFFER": '40RF',
    "40'HQ Reefer": '40RF',
    "40'NOR": '40NOR', "40NOR": '40NOR',
    "20'NOR": '20NOR',
    "20' ISO TANK": '20TANK', "20'ISO TANK": '20TANK', "20FT ISO Tank": '20TANK',
    "20'TANK": '20TANK', "20Tank": '20TANK', "20' ISO Tank Container": '20TANK',
    "40'FT SOC TANK": '40TANK',
    "20'Flexitank": '20TANK',
    "20OOG": '20FR',
    "BULK CONTAINER": 'BULK',
}

# ============================================================
# 工具函数
# ============================================================

def clean_text(val):
    """清洗文本：去除前后空格、NBSP、控制字符"""
    if not val:
        return ''
    # 替换 NBSP 和其他不可见字符
    val = val.replace('\xa0', ' ').replace('\u3000', ' ')
    val = re.sub(r'[\r\n]+', ' ', val)
    val = re.sub(r'\s+', ' ', val).strip()
    return val


def parse_date(val):
    """
    解析日期字符串，返回 (date_obj, raw_text)
    成功返回 (datetime.date, None)，失败返回 (None, raw_text)
    """
    val = clean_text(val)
    if not val or val.upper() in ('TBA', '-', 'N/A', ''):
        return None, val if val else None
    
    formats = [
        '%d %b %Y',      # 2 Jan 2024
        '%d %B %Y',      # 2 January 2024
        '%d/%m/%Y',      # 02/01/2024
        '%Y-%m-%d',      # 2024-01-02
        '%m/%d/%Y',      # 01/02/2024
        '%d-%b-%Y',      # 02-Jan-2024
        '%d-%m-%Y',      # 02-01-2024
        '%b %d, %Y',     # Jan 2, 2024
        '%d.%m.%Y',      # 02.01.2024
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(val, fmt)
            return dt.date(), None
        except ValueError:
            continue
    
    return None, val


def parse_decimal(val):
    """解析数值，返回 (Decimal, raw_text)"""
    val = clean_text(val)
    if not val or val.upper() in ('TBA', '-', 'N/A', ''):
        return None, val if val else None
    
    # 移除逗号
    cleaned = val.replace(',', '')
    try:
        d = Decimal(cleaned)
        return d, None
    except (InvalidOperation, ValueError):
        return None, val


def parse_reference_number(ref):
    """
    解析 reference_number，返回 (reference_month, monthly_sequence, serial_number, product_abbr)
    例如: CN2401006-A → (2401, 6, 0, A)
          CN2401017-S1 → (2401, 17, 1, S)
          CN2409404-ARS1 → (2409, 404, 1, ARS)
    """
    ref = clean_text(ref)
    # 匹配模式: CN + YYMM + sequence - abbr + serial
    m = re.match(r'^CN(\d{4})(\d+)-([A-Z]+)(\d*)$', ref)
    if m:
        ref_month = m.group(1)
        seq = int(m.group(2))
        abbr = m.group(3)
        serial = int(m.group(4)) if m.group(4) else 0
        return ref_month, seq, serial, abbr
    return None, None, None, None


def parse_price(val):
    """
    解析价格字符串，返回 (price_decimal, price_text)
    """
    val = clean_text(val)
    if not val or val in ('-', 'TBA', 'N/A', ''):
        return None, val if val else None
    
    # 尝试提取数值
    m = re.search(r'(?:USD|HKD|EUR|RMB|CNY|GBP)?\s*([0-9,]+\.?\d*)', val)
    if m:
        try:
            price = Decimal(m.group(1).replace(',', ''))
            return price, val
        except (InvalidOperation, ValueError):
            pass
    
    return None, val


def is_container_type(unit_val):
    """判断 Quantity(Unit) 是否为柜型"""
    if not unit_val:
        return False
    upper = unit_val.upper()
    container_keywords = [
        'GP', 'HQ', 'HC', 'OT', 'FR', 'RF', 'NOR', 'TANK', 'REEFER',
        'REFFER', 'FLAT', 'BULK', 'FT', 'DC', 'DV', 'OOG', 'SOC', 'ISO',
        "20'", "40'", "45'", "20FT", "40FT"
    ]
    return any(kw in upper for kw in container_keywords)


def parse_containers(unit_val, quantity_val):
    """
    解析柜型表达，返回 [(container_code, qty)] 列表
    """
    unit_val = clean_text(unit_val)
    if not unit_val:
        return []
    
    results = []
    
    # 替换特殊字符
    unit_val = unit_val.replace('\xa0', ' ').replace('　', ' ')
    
    # 模式C: 带数量前缀 (2*40HQ + 4*20GP) 或 (1x 40'HC + 1x 20'DC)
    pattern_c = re.findall(r'(\d+)\s*[x*×]\s*(\d{2}[\'\']?\s*\w+)', unit_val, re.IGNORECASE)
    if pattern_c:
        for qty_str, ct_raw in pattern_c:
            code = normalize_container_code(ct_raw.strip())
            if code:
                results.append((code, int(qty_str)))
        if results:
            return results
    
    # 模式B: 多柜型用 / 或 + 分隔，无数量前缀
    if '/' in unit_val or '+' in unit_val:
        parts = re.split(r'[/+]', unit_val)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            code = normalize_container_code(part)
            if code:
                # 默认数量为1
                results.append((code, 1))
        if results:
            return results
    
    # 模式A: 单一柜型
    code = normalize_container_code(unit_val)
    if code:
        qty = 1
        if quantity_val:
            try:
                qty = int(float(quantity_val.replace(',', '')))
            except (ValueError, TypeError):
                qty = 1
        results.append((code, qty))
    
    return results


def normalize_container_code(raw):
    """标准化柜型代码"""
    raw = raw.strip().replace('\xa0', ' ').replace('　', ' ')
    
    # 先在映射表中查找
    if raw in CONTAINER_CODE_NORMALIZE:
        return CONTAINER_CODE_NORMALIZE[raw]
    
    # 去除引号后再查
    cleaned = raw.replace("'", "'").replace("'", "'").replace("`", "'")
    if cleaned in CONTAINER_CODE_NORMALIZE:
        return CONTAINER_CODE_NORMALIZE[cleaned]
    
    # 正则提取 (20|40|45) + 类型
    m = re.match(r"(\d{2})['\s]*([A-Z]{2,})", raw.upper().replace("'", "'"))
    if m:
        size = m.group(1)
        typ = m.group(2)
        code = f"{size}{typ}"
        # 标准化常见变体
        code = code.replace('JQ', 'HQ')  # 40'JQ → 40HQ (typo)
        if code in ('20GP', '40GP', '40HQ', '45HQ', '20OT', '40OT', 
                     '20FR', '40FR', '20RF', '40RF', '20NOR', '40NOR'):
            return code
        # HC → HQ
        if code.endswith('HC'):
            return code[:-2] + 'HQ'
    
    return None


def parse_pol_pod_ports(val):
    """
    解析 POL/POD 值，返回端口代码列表
    支持: 单港口、多港口（/ 分隔）
    """
    val = clean_text(val)
    if not val or val in ('-', 'TBA', 'N/A'):
        return []
    
    # 按 / 分隔
    parts = [p.strip() for p in val.split('/') if p.strip()]
    return parts


# ============================================================
# 主迁移逻辑
# ============================================================

class MigrationContext:
    """迁移上下文：缓存字典数据、统计信息"""
    
    def __init__(self):
        self.stats = defaultdict(int)
        self.errors = []
        
        # 缓存（生产中从数据库加载）
        self.port_map = {}          # port_code → port_id
        self.sales_office_map = {}  # name_norm → id
        self.sales_pic_map = {}     # (country_code, name_norm) → id
        self.container_type_map = {} # container_code → id
        self.category_map = CATEGORY_MAP
    
    def log_error(self, row_num, reference_number, field, message):
        self.errors.append({
            'row': row_num,
            'reference_number': reference_number,
            'field': field,
            'message': message,
        })
        self.stats['errors'] += 1
    
    def print_summary(self):
        logger.info("=" * 60)
        logger.info("迁移摘要")
        logger.info("=" * 60)
        for key, val in sorted(self.stats.items()):
            logger.info(f"  {key}: {val}")
        logger.info(f"  错误总数: {len(self.errors)}")
        
        if self.errors:
            logger.info(f"\n前 20 条错误:")
            for err in self.errors[:20]:
                logger.info(f"  Row {err['row']} [{err['reference_number']}] "
                          f"{err['field']}: {err['message']}")
    
    def save_error_log(self):
        with open(LOG_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['row', 'reference_number', 'field', 'message'])
            writer.writeheader()
            writer.writerows(self.errors)


def process_row(row, row_num, ctx):
    """
    处理单行 CSV 数据，返回:
    {
        'enquiry': dict,           # enquiry 表数据
        'pol_ports': list,         # POL 端口列表
        'pod_ports': list,         # POD 端口列表
        'containers': list,        # [(container_code, qty, raw_text)]
        'offers': list,            # [offer_dict, ...]
    }
    """
    ref = clean_text(row[COL_REFERENCE_NUMBER]) if len(row) > COL_REFERENCE_NUMBER else ''
    if not ref:
        return None
    
    ctx.stats['total_rows'] += 1
    
    # ---- 解析 Reference Number ----
    ref_month, monthly_seq, serial_no, prod_abbr = parse_reference_number(ref)
    if not ref_month:
        ctx.log_error(row_num, ref, 'reference_number', f'无法解析: {ref}')
        ref_month = ''
        monthly_seq = 0
        serial_no = 0
        prod_abbr = ''
    
    # ---- 日期字段 ----
    recv_date, recv_raw = parse_date(row[COL_ENQUIRY_RECEIVED_DATE] if len(row) > COL_ENQUIRY_RECEIVED_DATE else '')
    issue_date, issue_raw = parse_date(row[COL_ISSUE_DATE] if len(row) > COL_ISSUE_DATE else '')
    
    if not recv_date:
        ctx.log_error(row_num, ref, 'enquiry_received_date', f'无法解析日期: {recv_raw}')
    if not issue_date:
        ctx.log_error(row_num, ref, 'issue_date', f'无法解析日期: {issue_raw}')
        # 用 reference_month 推导
        if ref_month:
            try:
                issue_date = datetime.strptime(f'20{ref_month[:2]}-{ref_month[2:]}-01', '%Y-%m-%d').date()
            except:
                pass
    
    # 如果有 issue_date 但没有手动解析的 ref_month，派生之
    if issue_date and not ref_month:
        ref_month = issue_date.strftime('%y%m')
    
    # ---- Product ----
    product_raw = clean_text(row[COL_PRODUCT] if len(row) > COL_PRODUCT else '')
    product_info = PRODUCT_MAP.get(product_raw.upper())
    product_code = product_info[0] if product_info else product_raw
    product_abbr_val = product_info[1] if product_info else prod_abbr
    
    if not product_info:
        ctx.log_error(row_num, ref, 'product_code', f'未知产品: {product_raw}')
    
    # ---- Status ----
    status_raw = clean_text(row[COL_STATUS] if len(row) > COL_STATUS else '')
    status = status_raw.strip().replace('\n', ' ')
    if status.upper() in ('NEW', 'QUOTED', 'CANCELLED'):
        status = status.capitalize()
    else:
        ctx.log_error(row_num, ref, 'status', f'未知状态: {status_raw}')
        status = 'New'
    
    # ---- CN Pricing Admin ----
    cn_admin = clean_text(row[COL_CN_PRICING_ADMIN] if len(row) > COL_CN_PRICING_ADMIN else '')
    
    # ---- Sales Country ----
    sales_country_raw = clean_text(row[COL_SALES_COUNTRY] if len(row) > COL_SALES_COUNTRY else '')
    sales_country_code = SALES_COUNTRY_MAP.get(sales_country_raw.upper(), sales_country_raw.upper())
    
    # ---- Sales Office ----
    sales_office_raw = clean_text(row[COL_SALES_OFFICE] if len(row) > COL_SALES_OFFICE else '')
    sales_office_norm = sales_office_raw.upper().strip()
    sales_office_id = ctx.sales_office_map.get(sales_office_norm)
    if not sales_office_id and sales_office_raw and sales_office_raw != '-':
        ctx.log_error(row_num, ref, 'sales_office', f'未找到办公室: {sales_office_raw}')
    
    # ---- Sales PIC ----
    sales_pic_raw = clean_text(row[COL_SALES_PIC] if len(row) > COL_SALES_PIC else '')
    sales_pic_id = ctx.sales_pic_map.get((sales_country_code, sales_pic_raw.upper()))
    
    # ---- Assigned CN Office ----
    cn_office_raw = clean_text(row[COL_ASSIGNED_CN_OFFICES] if len(row) > COL_ASSIGNED_CN_OFFICES else '')
    cn_office_code = cn_office_raw.upper().strip()
    
    # ---- Cargo Type ----
    cargo_type_raw = clean_text(row[COL_CARGO_TYPE] if len(row) > COL_CARGO_TYPE else '')
    cargo_type_code = cargo_type_raw.upper().strip()
    offer_type = CARGO_TO_OFFER_TYPE.get(cargo_type_code, 'OTHER')
    
    # ---- Volume ----
    vol_decimal, vol_raw = parse_decimal(row[COL_VOLUME_CBM] if len(row) > COL_VOLUME_CBM else '')
    
    # ---- Quantity ----
    qty_decimal, qty_raw = parse_decimal(row[COL_QUANTITY] if len(row) > COL_QUANTITY else '')
    
    # ---- Quantity (Unit) ----
    unit_raw = clean_text(row[COL_QUANTITY_UNIT] if len(row) > COL_QUANTITY_UNIT else '')
    quantity_uom_code = None
    if unit_raw.upper() == 'KG':
        quantity_uom_code = 'KG'
    
    # ---- Quantity (TEU) ----
    teu_decimal, teu_raw = parse_decimal(row[COL_QUANTITY_TEU] if len(row) > COL_QUANTITY_TEU else '')
    
    # ---- 文本字段 ----
    commodity = clean_text(row[COL_COMMODITY] if len(row) > COL_COMMODITY else '')
    haz_special = clean_text(row[COL_HAZ_SPECIAL] if len(row) > COL_HAZ_SPECIAL else '')
    additional_req = clean_text(row[COL_ADDITIONAL_REQUIREMENT] if len(row) > COL_ADDITIONAL_REQUIREMENT else '')
    remark = clean_text(row[COL_REMARK] if len(row) > COL_REMARK else '')
    rejected_reason = clean_text(row[COL_REJECTED_REASON] if len(row) > COL_REJECTED_REASON else '')
    actual_reason = clean_text(row[COL_ACTUAL_REASON] if len(row) > COL_ACTUAL_REASON else '')
    
    # ---- POD Country ----
    pod_country_raw = clean_text(row[COL_POD_COUNTRY] if len(row) > COL_POD_COUNTRY else '')
    # 复合国家取第一个
    pod_country = pod_country_raw.split('/')[0].strip() if pod_country_raw else ''
    
    # ---- Core Flag ----
    core_raw = clean_text(row[COL_CORE_FLAG] if len(row) > COL_CORE_FLAG else '')
    core_flag = None
    if core_raw.upper() == 'CORE':
        core_flag = 'CORE'
    elif 'NON' in core_raw.upper():
        core_flag = 'NON_CORE'
    
    # ---- Category ----
    category_raw = clean_text(row[COL_CATEGORY] if len(row) > COL_CATEGORY else '')
    category_code = CATEGORY_MAP.get(category_raw.upper().strip())
    if not category_code and category_raw:
        ctx.log_error(row_num, ref, 'category', f'未匹配分类: {category_raw}')
    
    # ---- Cargo Ready Date ----
    cargo_date, cargo_date_raw = parse_date(row[COL_CARGO_READY_DATE] if len(row) > COL_CARGO_READY_DATE else '')
    
    # ---- Booking Confirmed ----
    booking_raw = clean_text(row[COL_BOOKING_CONFIRMED] if len(row) > COL_BOOKING_CONFIRMED else '')
    booking = BOOKING_MAP.get(booking_raw.upper().strip(), 'Pending')
    
    # ======== 构建 enquiry 数据 ========
    enquiry = {
        'reference_number': ref,
        'enquiry_received_date': recv_date,
        'issue_date': issue_date,
        'reference_month': ref_month or '',
        'monthly_sequence': monthly_seq or 0,
        'serial_number': serial_no or 0,
        'product_code': product_code,
        'product_abbr': product_abbr_val or '',
        'status': status,
        'cn_pricing_admin': cn_admin,
        'sales_country_code': sales_country_code,
        'sales_office_id': sales_office_id,
        'sales_pic_id': sales_pic_id,
        'assigned_cn_office_code': cn_office_code,
        'cargo_type_code': cargo_type_code,
        'volume_cbm': vol_decimal,
        'volume_raw_text': vol_raw,
        'quantity': qty_decimal,
        'quantity_raw_text': qty_raw,
        'quantity_uom_code': quantity_uom_code,
        'quantity_uom_raw_text': unit_raw,
        'quantity_teu': teu_decimal,
        'quantity_teu_raw_text': teu_raw,
        'commodity': commodity or None,
        'haz_special_equipment': haz_special or None,
        'pod_country_code': pod_country or None,
        'core_flag': core_flag,
        'category_code': category_code,
        'cargo_ready_date': cargo_date,
        'cargo_ready_date_raw_text': cargo_date_raw,
        'additional_requirement': additional_req or None,
        'booking_confirmed': booking,
        'remark': remark or None,
        'rejected_reason': rejected_reason or None,
        'actual_reason': actual_reason or None,
        'enquiry_offer_type': offer_type,
    }
    
    # ======== POL/POD ========
    pol_raw = clean_text(row[COL_POL] if len(row) > COL_POL else '')
    pod_raw = clean_text(row[COL_POD] if len(row) > COL_POD else '')
    pol_ports = parse_pol_pod_ports(pol_raw)
    pod_ports = parse_pol_pod_ports(pod_raw)
    
    # ======== Container Lines ========
    containers = []
    if is_container_type(unit_raw):
        quantity_str = row[COL_QUANTITY].strip() if len(row) > COL_QUANTITY else ''
        containers = parse_containers(unit_raw, quantity_str)
        if containers:
            ctx.stats['container_lines'] += len(containers)
        else:
            ctx.log_error(row_num, ref, 'container', f'无法解析柜型: {unit_raw}')
    
    # ======== Offers ========
    offers = []
    
    # 1st Quotation Sent Date
    sent_date, sent_date_raw = parse_date(row[COL_1ST_QUOTATION_SENT] if len(row) > COL_1ST_QUOTATION_SENT else '')
    
    # 根据 offer_type 决定读取哪些列
    first_offer_val = ''
    latest_offer_val = ''
    
    if offer_type == 'AIR':
        first_offer_val = clean_text(row[COL_1ST_OFFER_AIR] if len(row) > COL_1ST_OFFER_AIR else '')
        latest_offer_val = clean_text(row[COL_LATEST_OFFER_AIR] if len(row) > COL_LATEST_OFFER_AIR else '')
    elif offer_type == 'OCEAN':
        first_offer_val = clean_text(row[COL_1ST_OFFER_OCEAN] if len(row) > COL_1ST_OFFER_OCEAN else '')
        latest_offer_val = clean_text(row[COL_LATEST_OFFER_OCEAN] if len(row) > COL_LATEST_OFFER_OCEAN else '')
    else:
        # OTHER (RAIL) - 检查两列，取有值的
        first_ocean = clean_text(row[COL_1ST_OFFER_OCEAN] if len(row) > COL_1ST_OFFER_OCEAN else '')
        first_air = clean_text(row[COL_1ST_OFFER_AIR] if len(row) > COL_1ST_OFFER_AIR else '')
        first_offer_val = first_ocean or first_air
        latest_ocean = clean_text(row[COL_LATEST_OFFER_OCEAN] if len(row) > COL_LATEST_OFFER_OCEAN else '')
        latest_air = clean_text(row[COL_LATEST_OFFER_AIR] if len(row) > COL_LATEST_OFFER_AIR else '')
        latest_offer_val = latest_ocean or latest_air
    
    has_latest = bool(latest_offer_val and latest_offer_val not in ('-', ''))
    
    if first_offer_val and first_offer_val not in ('-', ''):
        price, price_text = parse_price(first_offer_val)
        offers.append({
            'offer_type': offer_type,
            'sequence_no': 1,
            'is_latest': 0 if has_latest else 1,
            'sent_date': sent_date,
            'sent_date_raw_text': sent_date_raw,
            'price': price,
            'price_text': price_text,
        })
        ctx.stats['offers_1st'] += 1
    
    if has_latest:
        price, price_text = parse_price(latest_offer_val)
        offers.append({
            'offer_type': offer_type,
            'sequence_no': 2,
            'is_latest': 1,
            'sent_date': None,
            'sent_date_raw_text': None,
            'price': price,
            'price_text': price_text,
        })
        ctx.stats['offers_latest'] += 1
    
    return {
        'enquiry': enquiry,
        'pol_ports': pol_ports,
        'pod_ports': pod_ports,
        'containers': [(code, qty, unit_raw) for code, qty in containers],
        'offers': offers,
    }


def generate_insert_sql(result):
    """
    生成 SQL INSERT 语句（仅用于 dry-run 展示 / 调试）
    生产环境应使用参数化查询
    """
    e = result['enquiry']
    sqls = []
    
    # 1. INSERT enquiry
    cols = list(e.keys())
    vals = []
    for c in cols:
        v = e[c]
        if v is None:
            vals.append('NULL')
        elif isinstance(v, (int, float, Decimal)):
            vals.append(str(v))
        elif isinstance(v, datetime):
            vals.append(f"'{v.strftime('%Y-%m-%d')}'")
        elif hasattr(v, 'isoformat'):
            vals.append(f"'{v.isoformat()}'")
        else:
            escaped = str(v).replace("'", "''")
            vals.append(f"'{escaped}'")
    
    sqls.append(f"INSERT INTO enquiry ({', '.join(cols)}) VALUES ({', '.join(vals)});")
    
    # 2. INSERT enquiry_pol
    for i, port_code in enumerate(result['pol_ports'], 1):
        sqls.append(
            f"INSERT INTO enquiry_pol (enquiry_id, port_id, sequence) "
            f"VALUES (@enquiry_id, (SELECT id FROM port WHERE port_code='{port_code}' LIMIT 1), {i});"
        )
    
    # 3. INSERT enquiry_pod
    for i, port_code in enumerate(result['pod_ports'], 1):
        sqls.append(
            f"INSERT INTO enquiry_pod (enquiry_id, port_id, sequence) "
            f"VALUES (@enquiry_id, (SELECT id FROM port WHERE port_code='{port_code}' LIMIT 1), {i});"
        )
    
    # 4. INSERT enquiry_container_line
    for code, qty, raw in result['containers']:
        sqls.append(
            f"INSERT INTO enquiry_container_line (enquiry_id, container_type_id, container_qty, raw_text) "
            f"VALUES (@enquiry_id, (SELECT id FROM container_types WHERE container_code='{code}' LIMIT 1), "
            f"{qty}, '{raw.replace(chr(39), chr(39)+chr(39))}');"
        )
    
    # 5. INSERT offer
    for o in result['offers']:
        sent_date_sql = f"'{o['sent_date'].isoformat()}'" if o.get('sent_date') else 'NULL'
        sent_raw_sql = f"'{o['sent_date_raw_text']}'" if o.get('sent_date_raw_text') else 'NULL'
        price_sql = str(o['price']) if o.get('price') is not None else 'NULL'
        price_text_sql = f"'{o['price_text'].replace(chr(39), chr(39)+chr(39))}'" if o.get('price_text') else 'NULL'
        
        sqls.append(
            f"INSERT INTO offer (enquiry_id, offer_type, sequence_no, is_latest, "
            f"sent_date, sent_date_raw_text, price, price_text) "
            f"VALUES (@enquiry_id, '{o['offer_type']}', {o['sequence_no']}, {o['is_latest']}, "
            f"{sent_date_sql}, {sent_raw_sql}, {price_sql}, {price_text_sql});"
        )
    
    return sqls


def run_migration():
    """主迁移流程"""
    ctx = MigrationContext()
    
    logger.info(f"开始迁移 - CSV: {CSV_FILE}")
    logger.info(f"Dry Run: {DRY_RUN}, Limit: {LIMIT}")
    
    # 读取 CSV
    with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        next(reader)  # 跳过描述行
        next(reader)  # 跳过标题行
        
        all_results = []
        row_num = 2  # 从第3行开始（数据行）
        
        for row in reader:
            row_num += 1
            
            if len(row) < 3:
                continue
            
            result = process_row(row, row_num, ctx)
            if result:
                all_results.append(result)
            
            if LIMIT and len(all_results) >= LIMIT:
                break
    
    logger.info(f"CSV 解析完成: {len(all_results)} 条记录")
    
    if DRY_RUN:
        # 输出前 5 条 SQL 示例
        logger.info("\n=== DRY RUN: 前 5 条 SQL 示例 ===")
        for i, result in enumerate(all_results[:5]):
            logger.info(f"\n--- Record {i+1}: {result['enquiry']['reference_number']} ---")
            for sql in generate_insert_sql(result):
                logger.info(f"  {sql}")
    else:
        # 实际执行数据库写入
        try:
            import pymysql
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            for i, result in enumerate(all_results):
                try:
                    e = result['enquiry']
                    
                    # INSERT enquiry
                    cols = [k for k in e.keys()]
                    placeholders = [f'%({k})s' for k in cols]
                    sql = f"INSERT INTO enquiry ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
                    cursor.execute(sql, e)
                    enquiry_id = cursor.lastrowid
                    
                    # INSERT enquiry_pol
                    for seq, port_code in enumerate(result['pol_ports'], 1):
                        cursor.execute(
                            "INSERT INTO enquiry_pol (enquiry_id, port_id, sequence) "
                            "SELECT %s, id, %s FROM port WHERE port_code = %s LIMIT 1",
                            (enquiry_id, seq, port_code)
                        )
                    
                    # INSERT enquiry_pod
                    for seq, port_code in enumerate(result['pod_ports'], 1):
                        cursor.execute(
                            "INSERT INTO enquiry_pod (enquiry_id, port_id, sequence) "
                            "SELECT %s, id, %s FROM port WHERE port_code = %s LIMIT 1",
                            (enquiry_id, seq, port_code)
                        )
                    
                    # INSERT enquiry_container_line
                    for code, qty, raw in result['containers']:
                        cursor.execute(
                            "INSERT INTO enquiry_container_line "
                            "(enquiry_id, container_type_id, container_qty, raw_text) "
                            "SELECT %s, id, %s, %s FROM container_types "
                            "WHERE container_code = %s LIMIT 1",
                            (enquiry_id, qty, raw, code)
                        )
                    
                    # INSERT offer
                    for o in result['offers']:
                        cursor.execute(
                            "INSERT INTO offer "
                            "(enquiry_id, offer_type, sequence_no, is_latest, "
                            "sent_date, sent_date_raw_text, price, price_text) "
                            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                            (enquiry_id, o['offer_type'], o['sequence_no'],
                             o['is_latest'], o.get('sent_date'), o.get('sent_date_raw_text'),
                             o.get('price'), o.get('price_text'))
                        )
                    
                    if (i + 1) % 1000 == 0:
                        conn.commit()
                        logger.info(f"已提交 {i + 1} 条...")
                
                except Exception as ex:
                    ctx.log_error(0, result['enquiry']['reference_number'], 'db_insert', str(ex))
                    conn.rollback()
            
            conn.commit()
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            cursor.close()
            conn.close()
            
            logger.info(f"数据库写入完成: {len(all_results)} 条记录")
        
        except ImportError:
            logger.error("需要安装 pymysql: pip install pymysql")
        except Exception as ex:
            logger.error(f"数据库连接/写入失败: {ex}")
    
    ctx.stats['total_processed'] = len(all_results)
    ctx.print_summary()
    ctx.save_error_log()


if __name__ == '__main__':
    run_migration()
