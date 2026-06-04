#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro - 数据迁移脚本 v3
源文件: chinese Pricing.csv (Tab分隔, 34列, 2025年数据, 9265行)

列映射:
  Col  0: Enquiry Received Date (= enquiry_received_date)
  Col  1: Issue Date
  Col  2: Reference Number
  Col  3: Product
  Col  4: Status
  Col  5: CN Pricing Admin
  Col  6: Sales Country
  Col  7: Sales office
  Col  8: Sales PIC
  Col  9: Assigned CN Offices
  Col 10: CN office Grouping  ← SKIP
  Col 11: Cargo Type
  Col 12: Volume (CBM)
  Col 13: Quantity
  Col 14: Quantity (Unit)
  Col 15: Quantity (TEU)
  Col 16: Commodity
  Col 17: Haz, Special Equipment
  Col 18: POL
  Col 19: POD
  Col 20: POD Country
  Col 21: CORE / NON CORE
  Col 22: Category
  Col 23: Cargo Ready Date
  Col 24: Additional Requirement
  Col 25: 1st Quotation Sent
  Col 26: 1st Offer: Ocean Frg
  Col 27: 1st Offer: Air Frg/KG
  Col 28: Latest Offer: Ocean Frg
  Col 29: Latest Offer: Air Frg/KG
  Col 30: Booking Confirmed
  Col 31: Remark
  Col 32: Rejected Reason
  Col 33: Actual Reason

数据质量规则:
  - Quantity: 去掉逗号后解析; 非数字 → NULL + raw_text
  - Quantity(Unit): 只有 KG 和容器类型有效; 其他 → NULL + raw_text
               容器类型 → enquiry_container_line
  - 智能引号: '  ' (U+2018/U+2019) → ASCII ' (U+0027)
  - qty/unit 字段互换检测: unit 是纯数字且 qty 是容器类型 → 自动交换
  - Cargo Ready Date: TBA / - / N/A → NULL (不写入 raw_text)
  - 多容器类型 (20'GP/40'HQ): TEU 分配算法解决

用法:
    python migrate_cn_pricing_v3.py [--dry-run] [--skip-errors]
"""

import csv
import re
import os
import sys
import ast
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Optional, Tuple, Any

try:
    import pymysql
    from dateutil import parser as date_parser
except ImportError:
    print("请安装依赖: pip install pymysql python-dateutil")
    sys.exit(1)

# ============================================================
# 配置
# ============================================================

DRY_RUN = '--dry-run' in sys.argv
SKIP_ERRORS = '--skip-errors' in sys.argv

DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'ldf123'),
    'database': os.getenv('MYSQL_DATABASE', 'logitrack'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# CSV 文件路径（与脚本同目录）
CSV_FILE = os.path.join(os.path.dirname(__file__), 'chinese Pricing.csv')

# ============================================================
# 列索引（34列 Tab分隔）
# ============================================================
C_ENQUIRY_DATE       = 0
C_ISSUE_DATE         = 1
C_REFERENCE          = 2
C_PRODUCT            = 3
C_STATUS             = 4
C_CN_ADMIN           = 5
C_SALES_COUNTRY      = 6
C_SALES_OFFICE       = 7
C_SALES_PIC          = 8
C_ASSIGNED_CN        = 9
# C_CN_GROUPING      = 10  ← SKIP
C_CARGO_TYPE         = 11
C_VOLUME_CBM         = 12
C_QUANTITY           = 13
C_QTY_UNIT           = 14
C_QTY_TEU            = 15
C_COMMODITY          = 16
C_HAZ                = 17
C_POL                = 18
C_POD                = 19
C_POD_COUNTRY        = 20
C_CORE_FLAG          = 21
C_CATEGORY           = 22
C_CARGO_READY        = 23
C_ADDITIONAL_REQ     = 24
C_FST_QUOT_SENT      = 25
C_FST_OFFER_OCEAN    = 26
C_FST_OFFER_AIR      = 27
C_LATEST_OFFER_OCEAN = 28
C_LATEST_OFFER_AIR   = 29
C_BOOKING_CONFIRMED  = 30
C_REMARK             = 31
C_REJECTED_REASON    = 32
C_ACTUAL_REASON      = 33

# ============================================================
# 容器类型规范化
# ============================================================

CONTAINER_MAP: Dict[str, str] = {
    # 20' 系列
    "20gp": "20GP", "20'gp": "20GP", "20' gp": "20GP",
    "20": "20GP", "20'": "20GP", "20ft": "20GP", "20 ft": "20GP",
    # 40'GP 系列
    "40gp": "40GP", "40'gp": "40GP", "40' gp": "40GP",
    "40'": "40GP", "40ft": "40GP",
    # 40'HQ / 40'HC 系列
    "40hq": "40HQ", "40'hq": "40HQ", "40' hq": "40HQ",
    "40hc": "40HQ", "40'hc": "40HQ", "40' hc": "40HQ",
    "40'high cube": "40HQ",
    # 45'HQ 系列
    "45hq": "45HQ", "45'hq": "45HQ", "45' hq": "45HQ",
    "45hc": "45HQ", "45'hc": "45HQ",
    # Reefer
    "20rf": "20RF", "20'rf": "20RF",
    "40rf": "40RF", "40'rf": "40RF",
    # Open Top
    "20ot": "20OT", "20'ot": "20OT", "20' open top": "20OT",
    "40ot": "40OT", "40'ot": "40OT", "40' open top": "40OT",
    # Flat Rack
    "20fr": "20FR", "20'fr": "20FR",
    "20' flat rack": "20FR", "20'flat rack": "20FR",
    "20 flat rack": "20FR", "20ft flat rack": "20FR",
    "40fr": "40FR", "40'fr": "40FR",
    "40' flat rack": "40FR", "40'flat rack": "40FR",
    "40 flat rack": "40FR",
    # ISO Tank
    "20tk": "20GP", "20'tk": "20GP",  # fallback to 20GP if no tank code
    "20' iso tank": "20GP", "20'iso tank": "20GP",
    "20' iso tank container": "20GP",
    "20 iso tank": "20GP", "20' tank": "20GP",
    "40tk": "40GP", "40'tk": "40GP",
    "40' iso tank": "40GP",
    # 45' GP
    "45gp": "40GP",
}

CONTAINER_TEU: Dict[str, float] = {
    "20GP": 1.0, "20RF": 1.0, "20OT": 1.0, "20FR": 1.0,
    "40GP": 2.0, "40HQ": 2.0, "45HQ": 2.25, "40RF": 2.0, "40OT": 2.0, "40FR": 2.0,
}


def normalize_quotes(s: str) -> str:
    """将 Unicode 智能引号/撇号替换为 ASCII 单引号"""
    return s.replace('\u2019', "'").replace('\u2018', "'").replace('\u02bc', "'").replace('\uff07', "'")


def normalize_container_key(s: str) -> str:
    """规范化容器类型字符串为lookup key"""
    s = normalize_quotes(s)
    s = re.sub(r'\s+', ' ', s.strip().lower())
    return s


def parse_single_container(raw: str) -> Optional[str]:
    """尝试将单个字符串解析为容器类型代码, 失败返回 None"""
    key = normalize_container_key(raw)
    return CONTAINER_MAP.get(key)


def parse_multi_containers(raw: str) -> Optional[List[str]]:
    """解析多容器类型字符串 '20'GP/40'HQ' → ['20GP', '40HQ'], 失败返回 None"""
    raw_norm = normalize_quotes(raw)
    # 可能的分隔符: / + space comma
    parts = re.split(r'[/+,]', raw_norm)
    if len(parts) < 2:
        return None
    codes = []
    for p in parts:
        code = parse_single_container(p.strip())
        if code is None:
            return None  # 有一个解析失败就整体失败
        codes.append(code)
    return codes if len(set(codes)) == len(codes) or len(codes) >= 2 else codes


def resolve_container_qty(container_codes: List[str], qty_total, teu_total) -> List[Tuple[str, int]]:
    """
    多容器类型时，根据 TEU 解析各容器数量
    返回 [(container_code, qty), ...]
    """
    n = len(container_codes)
    if n == 1:
        qty = int(qty_total) if qty_total else 1
        return [(container_codes[0], qty)]

    teus = [CONTAINER_TEU.get(c, 2.0) for c in container_codes]

    # 尝试用 TEU 精确解算
    if qty_total and teu_total:
        try:
            qty = int(float(str(qty_total).replace(',', '')))
            teu = float(str(teu_total).replace(',', ''))

            # Method 1: exact — 尝试所有正整数分配, 满足 qty 和 teu 约束
            if qty <= 50:  # 防止组合爆炸
                from itertools import product as iproduct
                best = None
                for combo in iproduct(range(1, qty + 1), repeat=n):
                    if sum(combo) == qty:
                        teu_sum = sum(combo[i] * teus[i] for i in range(n))
                        if abs(teu_sum - teu) < 0.01:
                            best = list(combo)
                            break
                if best:
                    return list(zip(container_codes, best))

            # Method 2: equal — 均等分配
            if qty % n == 0:
                each = qty // n
                expected_teu = sum(each * t for t in teus)
                if abs(expected_teu - teu) < 0.01:
                    return [(c, each) for c in container_codes]

        except (ValueError, TypeError):
            pass

    # Method fallback: 每种 1 箱
    return [(c, 1) for c in container_codes]


def is_container_string(s: str) -> bool:
    """判断字符串是否看起来像容器类型"""
    key = normalize_container_key(s)
    if key in CONTAINER_MAP:
        return True
    # 多容器？
    if '/' in normalize_quotes(s):
        codes = parse_multi_containers(s)
        return codes is not None
    return False


def is_numeric_string(s: str) -> bool:
    """判断字符串（去逗号后）是否为数字"""
    try:
        float(s.strip().replace(',', ''))
        return True
    except (ValueError, AttributeError):
        return False


# ============================================================
# 数据清洗工具函数
# ============================================================

# 零宽字符和不可见字符正则
_INVISIBLE_CHARS = re.compile(r'[\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad]')

def clean(val: str) -> str:
    if not val:
        return ''
    s = str(val).replace('\r\n', ' ').replace('\n', ' ').strip()
    s = _INVISIBLE_CHARS.sub('', s)  # 去除零宽/不可见字符
    return re.sub(r'\s+', ' ', s).strip()


def upper(val: str) -> str:
    return clean(val).upper()


def parse_date(val: str) -> Tuple[Optional[datetime], str]:
    raw = clean(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', 'NA', '/', '\\', ''):
        return None, raw
    try:
        dt = date_parser.parse(raw, dayfirst=True)
        return dt, raw
    except Exception:
        return None, raw


def parse_number(val: str) -> Tuple[Optional[float], str]:
    raw = clean(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', ''):
        return None, raw
    try:
        cleaned = raw.replace(',', '')
        m = re.search(r'[\d.]+', cleaned)
        if m:
            return float(m.group()), raw
    except Exception:
        pass
    return None, raw


def parse_quantity_unit_pair(qty_raw: str, unit_raw: str) -> Tuple[str, str]:
    """
    处理 qty/unit 互换情况:
    - 如果 unit 是纯数字 且 qty 是容器类型字符串 → swap
    - 返回 (corrected_qty_str, corrected_unit_str)
    """
    qty_s = clean(qty_raw)
    unit_s = clean(unit_raw)

    # 检测互换
    if unit_s and qty_s:
        unit_is_num = is_numeric_string(unit_s)
        qty_is_container = is_container_string(qty_s)
        if unit_is_num and qty_is_container:
            # 需要互换
            return unit_s, qty_s

    return qty_s, unit_s


def parse_reference_number(ref: str) -> Dict[str, Any]:
    result = {'reference_month': '', 'monthly_sequence': 0, 'serial_number': 0, 'product_abbr': ''}
    ref = clean(ref)
    if not ref:
        return result
    m = re.match(r'CN(\d{4})(\d+)-([A-Z]+)(\d*)$', ref, re.IGNORECASE)
    if m:
        result['reference_month'] = m.group(1)
        result['monthly_sequence'] = int(m.group(2))
        result['product_abbr'] = m.group(3).upper()
        result['serial_number'] = int(m.group(4)) if m.group(4) else 0
    return result


def normalize_status(val: str) -> str:
    v = clean(val).lower()
    return {'new': 'New', 'quoted': 'Quoted', 'cancelled': 'Cancelled', 'canceled': 'Cancelled'}.get(v, 'New')


def normalize_booking(val: str) -> str:
    v = clean(val).lower()
    return {'yes': 'Yes', 'rejected': 'Rejected', 'pending': 'Pending', 'invalid': 'Invalid'}.get(v, 'Pending')


def normalize_core(val: str) -> Optional[str]:
    v = upper(val)
    if 'NON' in v:
        return 'NON_CORE'
    if 'CORE' in v:
        return 'CORE'
    return None


def get_offer_type(cargo_type: str) -> str:
    c = upper(cargo_type)
    if c == 'AIR':
        return 'AIR'
    if c in ('FCL', 'LCL', 'SEA', 'RAIL-SEA', 'SEA-AIR'):
        return 'OCEAN'
    return 'OTHER'


# ============================================================
# 主导入类
# ============================================================

class MigrationV3:
    def __init__(self):
        self.conn = None
        self.cursor = None

        # 主数据缓存
        self.country_cache: Dict[str, int] = {}   # norm_name/code → id
        self.port_cache: Dict[str, int] = {}       # port_code → id
        self.office_cache: Dict[str, int] = {}     # name_norm → id
        self.category_cache: Dict[str, str] = {}   # name_norm → code
        self.container_id_cache: Dict[str, int] = {}  # container_code → id

        self.stats = {
            'total': 0, 'success': 0, 'failed': 0,
            'containers_created': 0, 'offers_created': 0,
            'countries_auto': 0, 'ports_auto': 0, 'offices_auto': 0,
            'qty_null': 0, 'unit_unknown': 0, 'date_null': 0,
            'swap_fixed': 0, 'container_lines': 0
        }
        self.errors: List[str] = []
        self.warnings: List[str] = []

    # ----------------------------------------------------------
    # DB 连接
    # ----------------------------------------------------------
    def connect(self):
        self.conn = pymysql.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        print(f"✅ 连接数据库: {DB_CONFIG['database']}@{DB_CONFIG['host']}")

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

    # ----------------------------------------------------------
    # 主数据加载
    # ----------------------------------------------------------
    def load_caches(self):
        print("\n📦 加载主数据缓存...")

        # 国家
        self.cursor.execute("SELECT id, country_code, country_name_en FROM country")
        for r in self.cursor.fetchall():
            self.country_cache[r['country_code'].upper()] = r['id']
            self.country_cache[r['country_name_en'].upper()] = r['id']
        print(f"  国家: {len(self.country_cache)//2} 条")

        # 港口
        self.cursor.execute("SELECT id, port_code FROM port")
        for r in self.cursor.fetchall():
            self.port_cache[r['port_code'].upper()] = r['id']
        print(f"  港口: {len(self.port_cache)} 条")

        # 销售办公室
        self.cursor.execute("SELECT id, name_norm FROM dict_sales_office")
        for r in self.cursor.fetchall():
            self.office_cache[r['name_norm'].upper()] = r['id']
        print(f"  销售办公室: {len(self.office_cache)} 条")

        # 分类
        self.cursor.execute("SELECT code, name_norm FROM dict_category")
        for r in self.cursor.fetchall():
            self.category_cache[r['name_norm'].upper()] = r['code']
        print(f"  分类: {len(self.category_cache)} 条")

        # 容器类型
        self.cursor.execute("SELECT id, container_code FROM container_types")
        for r in self.cursor.fetchall():
            self.container_id_cache[r['container_code'].upper()] = r['id']
        print(f"  容器类型: {len(self.container_id_cache)} 条")

    # ----------------------------------------------------------
    # 主数据查找/创建
    # ----------------------------------------------------------
    def get_or_create_country(self, name: str) -> Optional[int]:
        name = clean(name)
        if not name or name.upper() in ('-', 'TBA', ''):
            return None
        key = name.upper()
        if key in self.country_cache:
            return self.country_cache[key]
        # 生成唯一code
        code = re.sub(r'[^A-Z]', '', key)[:6] or re.sub(r'[^A-Z0-9]', '', key)[:6]
        if not code:
            code = 'UNK'
        base = code
        i = 1
        while True:
            self.cursor.execute("SELECT id FROM country WHERE country_code=%s", (code,))
            if not self.cursor.fetchone():
                break
            code = f"{base}{i}"; i += 1
        try:
            self.cursor.execute("INSERT IGNORE INTO country (country_code, country_name_en) VALUES (%s,%s)", (code, name))
            if self.cursor.lastrowid:
                cid = self.cursor.lastrowid
            else:
                self.cursor.execute("SELECT id FROM country WHERE country_code=%s", (code,))
                row = self.cursor.fetchone()
                cid = row['id'] if row else None
        except Exception:
            self.cursor.execute("SELECT id FROM country WHERE country_name_en=%s", (name,))
            row = self.cursor.fetchone()
            cid = row['id'] if row else None
        if cid:
            self.country_cache[key] = cid
            self.country_cache[code] = cid
            self.stats['countries_auto'] += 1
        return cid

    def get_or_create_port(self, port_raw: str, country_id: Optional[int] = None) -> Optional[int]:
        port_raw = clean(port_raw)
        if not port_raw or port_raw.upper() in ('-', 'TBA', ''):
            return None
        code = re.sub(r'[^A-Za-z0-9]', '', port_raw).upper()
        if not code:
            return None
        if code in self.port_cache:
            return self.port_cache[code]
        try:
            self.cursor.execute(
                "INSERT IGNORE INTO port (port_code, port_name, country_id) VALUES (%s,%s,%s)",
                (code, port_raw, country_id)
            )
            if self.cursor.lastrowid:
                pid = self.cursor.lastrowid
            else:
                self.cursor.execute("SELECT id FROM port WHERE port_code=%s", (code,))
                row = self.cursor.fetchone()
                pid = row['id'] if row else None
        except Exception:
            self.cursor.execute("SELECT id FROM port WHERE port_code=%s", (code,))
            row = self.cursor.fetchone()
            pid = row['id'] if row else None
        if pid:
            self.port_cache[code] = pid
            self.stats['ports_auto'] += 1
        return pid

    def get_or_create_office(self, name: str) -> Optional[int]:
        name = clean(name)
        if not name or name.upper() in ('-', 'TBA', ''):
            return None
        key = name.upper()
        if key in self.office_cache:
            return self.office_cache[key]
        try:
            self.cursor.execute(
                "INSERT IGNORE INTO dict_sales_office (name, name_norm) VALUES (%s,%s)",
                (name, key)
            )
            if self.cursor.lastrowid:
                oid = self.cursor.lastrowid
            else:
                self.cursor.execute("SELECT id FROM dict_sales_office WHERE name_norm=%s", (key,))
                row = self.cursor.fetchone()
                oid = row['id'] if row else None
        except Exception:
            self.cursor.execute("SELECT id FROM dict_sales_office WHERE name_norm=%s", (key,))
            row = self.cursor.fetchone()
            oid = row['id'] if row else None
        if oid:
            self.office_cache[key] = oid
            self.stats['offices_auto'] += 1
        return oid

    def get_category_code(self, val: str) -> Optional[str]:
        if not val:
            return None
        key = upper(val)
        if key in self.category_cache:
            return self.category_cache[key]
        # 前缀数字匹配: "1. Freight" → search for "FREIGHT" or "1"
        for cached, code in self.category_cache.items():
            if key in cached or cached in key:
                return code
        # 提取数字编号匹配
        m = re.match(r'^(\d+)', key)
        if m:
            num = m.group(1)
            for cached, code in self.category_cache.items():
                if re.match(r'^' + num + r'[.\s]', cached):
                    return code
        return None

    def get_container_id(self, code: str) -> Optional[int]:
        return self.container_id_cache.get(code.upper())

    # ----------------------------------------------------------
    # 规范化 quantity/unit
    # ----------------------------------------------------------
    def process_qty_unit(self, row: List[str], row_num: int) -> Dict[str, Any]:
        """
        处理 Quantity + Quantity(Unit) + Quantity(TEU)
        返回: {
            quantity, quantity_raw_text,
            uom_code, uom_raw_text,
            teu, teu_raw_text,
            container_lines: [(code, qty)]  # 空表示非容器
        }
        """
        qty_raw = self._col(row, C_QUANTITY)
        unit_raw = self._col(row, C_QTY_UNIT)
        teu_raw = self._col(row, C_QTY_TEU)

        # Step 1: 智能引号规范化
        unit_raw = normalize_quotes(unit_raw)
        qty_raw_norm = normalize_quotes(qty_raw)

        # Step 2L: 互换检测
        qty_s, unit_s = parse_quantity_unit_pair(qty_raw_norm, unit_raw)
        if qty_s != qty_raw_norm or unit_s != unit_raw:
            self.stats['swap_fixed'] += 1
            self.warnings.append(f"行{row_num} [{self._col(row,C_REFERENCE)}] qty/unit 已自动交换")

        # Step 3: 解析 TEU
        teu, teu_raw_text = parse_number(teu_raw)

        # Step 4: 解析单位类型
        unit_s_up = unit_s.upper().strip()

        # KG
        if unit_s_up in ('KG', 'KGS', 'KILOGRAM', 'KILOGRAMS'):
            qty, qty_raw_text = parse_number(qty_s)
            if qty is None:
                self.stats['qty_null'] += 1
            return {
                'quantity': qty, 'quantity_raw_text': qty_raw_text if qty is None else None,
                'uom_code': 'KG', 'uom_raw_text': None,
                'teu': teu, 'teu_raw_text': teu_raw_text if teu is None else None,
                'container_lines': []
            }

        # 尝试解析为单/多容器类型
        single_code = parse_single_container(unit_s)
        if single_code:
            qty, qty_raw_text = parse_number(qty_s)
            container_qty = int(qty) if qty and qty > 0 else 1
            return {
                'quantity': qty, 'quantity_raw_text': None,
                'uom_code': None, 'uom_raw_text': unit_s,
                'teu': teu, 'teu_raw_text': None,
                'container_lines': [(single_code, container_qty)]
            }

        multi_codes = parse_multi_containers(unit_s)
        if multi_codes:
            qty, _ = parse_number(qty_s)
            resolution = resolve_container_qty(multi_codes, qty, teu)
            return {
                'quantity': qty, 'quantity_raw_text': None,
                'uom_code': None, 'uom_raw_text': unit_s,
                'teu': teu, 'teu_raw_text': None,
                'container_lines': resolution
            }

        # 未知单位
        if unit_s_up and unit_s_up not in ('-', 'N/A', 'TBA', ''):
            self.stats['unit_unknown'] += 1

        qty, qty_raw_text = parse_number(qty_s)
        if qty is None and qty_s:
            self.stats['qty_null'] += 1

        return {
            'quantity': qty, 'quantity_raw_text': qty_raw_text if qty is None else None,
            'uom_code': None, 'uom_raw_text': unit_s if unit_s else None,
            'teu': teu, 'teu_raw_text': teu_raw_text if teu is None else None,
            'container_lines': []
        }

    # ----------------------------------------------------------
    # 行导入
    # ----------------------------------------------------------
    def _col(self, row: List[str], idx: int) -> str:
        return clean(row[idx]) if idx < len(row) else ''

    def import_row(self, row: List[str], row_num: int) -> bool:
        try:
            reference = self._col(row, C_REFERENCE)
            if not reference:
                return False  # 静默跳过空行

            # --- 日期 ---
            enq_date, _ = parse_date(self._col(row, C_ENQUIRY_DATE))
            issue_date, _ = parse_date(self._col(row, C_ISSUE_DATE))

            # 日期兜底
            if not enq_date and issue_date:
                enq_date = issue_date
            if not issue_date and enq_date:
                issue_date = enq_date
            if not enq_date:
                # 从 reference 提取 YYMM
                m = re.match(r'CN(\d{2})(\d{2})', reference)
                if m:
                    try:
                        enq_date = issue_date = datetime(2000 + int(m.group(1)), int(m.group(2)), 1)
                    except Exception:
                        pass
            if not enq_date:
                self.errors.append(f"行{row_num} [{reference}]: 无法解析日期")
                return False

            ref_parts = parse_reference_number(reference)

            # --- 国家/端口/办公室 ---
            sales_country_id = self.get_or_create_country(self._col(row, C_SALES_COUNTRY))
            if sales_country_id is None:
                sales_country_id = self.get_or_create_country('UNKNOWN')

            pod_country_raw = self._col(row, C_POD_COUNTRY)
            pod_country_id = self.get_or_create_country(pod_country_raw)
            if pod_country_id is None:
                pod_country_id = sales_country_id

            sales_office_id = self.get_or_create_office(self._col(row, C_SALES_OFFICE))
            if sales_office_id is None:
                sales_office_id = self.get_or_create_office('UNKNOWN')

            pol_id = self.get_or_create_port(self._col(row, C_POL))
            pod_id = self.get_or_create_port(self._col(row, C_POD), pod_country_id)

            if pol_id is None:
                pol_id = self.get_or_create_port('UNKNOWN')
            if pod_id is None:
                pod_id = self.get_or_create_port('UNKNOWN')

            # --- 产品/货物类型 ---
            product_raw = upper(self._col(row, C_PRODUCT))
            product_code = product_raw if product_raw else 'SEA'

            cargo_type_raw = upper(self._col(row, C_CARGO_TYPE))
            cargo_type_code = cargo_type_raw if cargo_type_raw else 'FCL'

            # --- 量/单位/容器 ---
            qty_info = self.process_qty_unit(row, row_num)

            # --- 体积 ---
            volume_cbm, volume_raw_text = parse_number(self._col(row, C_VOLUME_CBM))

            # --- 货好日期 ---
            cargo_ready, cargo_ready_raw = parse_date(self._col(row, C_CARGO_READY))
            if cargo_ready is None:
                self.stats['date_null'] += 1
            # 按规则: TBA → NULL, raw_text 不保留
            # (parse_date 已处理 TBA → None, 但我们这里故意也不保存 raw_text)

            # --- 分配CN办公室 ---
            cn_raw = upper(self._col(row, C_ASSIGNED_CN))
            VALID_CN = {'SHANGHAI', 'SHENZHEN', 'NINGBO', 'HONG KONG', 'TIANJIN', 'QINGDAO', 'XIAMEN', 'CN-MULTI'}
            if cn_raw not in VALID_CN:
                # 模糊匹配
                for v in VALID_CN:
                    if v in cn_raw or cn_raw in v:
                        cn_raw = v
                        break
                else:
                    cn_raw = 'SHANGHAI'

            # --- 类别 ---
            category_code = self.get_category_code(self._col(row, C_CATEGORY))

            # --- 销售PIC ---
            sales_pic_raw = clean(self._col(row, C_SALES_PIC)) or None

            # --- 判断 offer_type ---
            offer_type = get_offer_type(cargo_type_code)

            # ========================================
            # INSERT enquiry
            # ========================================
            if not DRY_RUN:
                sql_enq = """
                INSERT INTO enquiry (
                    reference_number, enquiry_received_date, issue_date,
                    reference_month, monthly_sequence, serial_number,
                    product_code, product_abbr, status,
                    cn_pricing_admin, sales_country_id, sales_office_id, sales_pic,
                    assigned_cn_office_code, cargo_type_code,
                    volume_cbm, volume_raw_text,
                    quantity, quantity_raw_text,
                    quantity_uom_code, quantity_uom_raw_text,
                    quantity_teu, quantity_teu_raw_text,
                    commodity, haz_special_equipment,
                    pol_id, pod_id, pod_country_id,
                    core_flag, category_code,
                    cargo_ready_date, cargo_ready_date_raw_text,
                    additional_requirement, booking_confirmed,
                    remark, rejected_reason, actual_reason,
                    enquiry_offer_type
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s
                )
                """
                vals_enq = (
                    reference,
                    enq_date.strftime('%Y-%m-%d'),
                    issue_date.strftime('%Y-%m-%d'),
                    ref_parts['reference_month'] or issue_date.strftime('%y%m'),
                    ref_parts['monthly_sequence'] or 1,
                    ref_parts['serial_number'],
                    product_code,
                    ref_parts['product_abbr'] or product_code[0],
                    normalize_status(self._col(row, C_STATUS)),
                    clean(self._col(row, C_CN_ADMIN)) or 'System',
                    sales_country_id,
                    sales_office_id,
                    sales_pic_raw,
                    cn_raw,
                    cargo_type_code,
                    volume_cbm,
                    volume_raw_text if volume_cbm is None else None,
                    qty_info['quantity'],
                    qty_info['quantity_raw_text'],
                    qty_info['uom_code'],
                    qty_info['uom_raw_text'],
                    qty_info['teu'],
                    qty_info['teu_raw_text'],
                    clean(self._col(row, C_COMMODITY)) or None,
                    clean(self._col(row, C_HAZ)) or None,
                    pol_id,
                    pod_id,
                    pod_country_id,
                    normalize_core(self._col(row, C_CORE_FLAG)),
                    category_code,
                    cargo_ready.strftime('%Y-%m-%d') if cargo_ready else None,
                    None,  # cargo_ready_date_raw_text → 按要求: TBA 也写 NULL, 不保留 raw
                    clean(self._col(row, C_ADDITIONAL_REQ)) or None,
                    normalize_booking(self._col(row, C_BOOKING_CONFIRMED)),
                    clean(self._col(row, C_REMARK)) or None,
                    clean(self._col(row, C_REJECTED_REASON)) or None,
                    clean(self._col(row, C_ACTUAL_REASON)) or None,
                    offer_type,
                )
                self.cursor.execute(sql_enq, vals_enq)
                enquiry_id = self.cursor.lastrowid
            else:
                enquiry_id = 0

            # ========================================
            # INSERT enquiry_container_line (FCL/容器类型)
            # ========================================
            container_lines = qty_info['container_lines']
            if container_lines and not DRY_RUN:
                raw_unit_text = qty_info['uom_raw_text'] or ''
                for ctype_code, ctype_qty in container_lines:
                    ct_id = self.get_container_id(ctype_code)
                    if ct_id is None:
                        self.warnings.append(f"行{row_num} [{reference}]: 容器类型 {ctype_code} 不在 container_types 表")
                        continue
                    teu_val = CONTAINER_TEU.get(ctype_code, 2.0)
                    self.cursor.execute("""
                        INSERT INTO enquiry_container_line
                            (enquiry_id, container_type_id, container_qty, raw_text, container_code, teu_per_unit)
                        VALUES (%s,%s,%s,%s,%s,%s)
                    """, (enquiry_id, ct_id, ctype_qty, raw_unit_text[:200], ctype_code, teu_val))
                    self.stats['container_lines'] += 1

            # ========================================
            # INSERT offer
            # ========================================
            if not DRY_RUN:
                first_sent, first_sent_raw = parse_date(self._col(row, C_FST_QUOT_SENT))

                if offer_type == 'OCEAN':
                    first_price_text = clean(self._col(row, C_FST_OFFER_OCEAN))
                    latest_price_text = clean(self._col(row, C_LATEST_OFFER_OCEAN))
                elif offer_type == 'AIR':
                    first_price_text = clean(self._col(row, C_FST_OFFER_AIR))
                    latest_price_text = clean(self._col(row, C_LATEST_OFFER_AIR))
                else:
                    # OTHER: try ocean first, then air
                    first_price_text = clean(self._col(row, C_FST_OFFER_OCEAN)) or clean(self._col(row, C_FST_OFFER_AIR))
                    latest_price_text = clean(self._col(row, C_LATEST_OFFER_OCEAN)) or clean(self._col(row, C_LATEST_OFFER_AIR))

                def _insert_offer(seq, is_latest, sent_date, price_text):
                    if not price_text or price_text in ('-', 'N/A', 'TBA', ''):
                        return False
                    price, _ = parse_number(price_text)
                    self.cursor.execute("""
                        INSERT INTO offer (enquiry_id, offer_type, sequence_no, is_latest,
                                           sent_date, sent_date_raw_text, price, price_text)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (
                        enquiry_id, offer_type, seq, is_latest,
                        sent_date.strftime('%Y-%m-%d') if sent_date else None,
                        None,
                        price,
                        price_text[:500] if price_text else None
                    ))
                    self.stats['offers_created'] += 1
                    return True

                has_latest = latest_price_text and latest_price_text not in ('-', 'N/A', 'TBA', '')
                if has_latest:
                    # 1st offer: is_latest=0, latest: is_latest=1
                    _insert_offer(1, 0, first_sent, first_price_text)
                    _insert_offer(2, 1, None, latest_price_text)
                else:
                    _insert_offer(1, 1, first_sent, first_price_text)

            return True

        except Exception as e:
            import traceback
            self.errors.append(f"行{row_num} [{self._col(row, C_REFERENCE) if row else '?'}]: {e}")
            if not SKIP_ERRORS:
                traceback.print_exc()
            return False

    # ----------------------------------------------------------
    # 主流程
    # ----------------------------------------------------------
    def run(self):
        print("=" * 65)
        print("  LogiTrack Pro - 数据迁移 v3 (chinese Pricing.csv)")
        if DRY_RUN:
            print("  ⚠️  DRY-RUN 模式 (不写入数据库)")
        print("=" * 65)

        if not os.path.exists(CSV_FILE):
            print(f"❌ 找不到文件: {CSV_FILE}")
            sys.exit(1)

        self.connect()
        try:
            self.load_caches()

            print(f"\n📂 读取: {os.path.basename(CSV_FILE)}")
            with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace', newline='') as f:
                reader = csv.reader(f, delimiter='\t')
                header = next(reader)  # 跳过表头行
                print(f"  列数: {len(header)}")
                all_rows = list(reader)
            print(f"  数据行数: {len(all_rows)}")

            print("\n🚀 开始导入...")
            for i, row in enumerate(all_rows):
                self.stats['total'] += 1
                if self.import_row(row, i + 2):  # row_num 从2开始 (表头=1)
                    self.stats['success'] += 1
                else:
                    self.stats['failed'] += 1

                if (i + 1) % 1000 == 0:
                    progress = (i + 1) * 100 // len(all_rows)
                    print(f"  {i+1}/{len(all_rows)} ({progress}%) 成功={self.stats['success']} 失败={self.stats['failed']}")
                    if not DRY_RUN:
                        self.conn.commit()

            if not DRY_RUN:
                self.conn.commit()

            print("\n" + "=" * 65)
            print("📊 迁移统计")
            print("=" * 65)
            print(f"  总记录数:          {self.stats['total']}")
            print(f"  成功导入:          {self.stats['success']}")
            print(f"  跳过/失败:         {self.stats['failed']}")
            print(f"  容器明细行:        {self.stats['container_lines']}")
            print(f"  报价记录:          {self.stats['offers_created']}")
            print(f"  数量→NULL:         {self.stats['qty_null']}")
            print(f"  未知单位:          {self.stats['unit_unknown']}")
            print(f"  日期→NULL:         {self.stats['date_null']}")
            print(f"  qty/unit互换修复:  {self.stats['swap_fixed']}")
            print(f"  自动创建国家:      {self.stats['countries_auto']}")
            print(f"  自动创建港口:      {self.stats['ports_auto']}")
            print(f"  自动创建办公室:    {self.stats['offices_auto']}")

            if self.errors:
                print(f"\n⚠️  错误 (共 {len(self.errors)} 条, 显示前30条):")
                for e in self.errors[:30]:
                    print(f"  {e}")

            if self.warnings:
                print(f"\n📝 警告 (共 {len(self.warnings)} 条, 显示前20条):")
                for w in self.warnings[:20]:
                    print(f"  {w}")

            print("\n✅ 完成!")

        except Exception as e:
            import traceback
            print(f"\n❌ 迁移失败: {e}")
            traceback.print_exc()
            if not DRY_RUN:
                self.conn.rollback()
            raise
        finally:
            self.close()


if __name__ == '__main__':
    m = MigrationV3()
    m.run()
