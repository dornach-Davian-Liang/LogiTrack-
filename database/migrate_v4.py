#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro — Phase 1-3: 主数据迁移 (V4)
功能:
  1. 清空业务数据 (enquiry/offer 系列表)
  2. 加载 7 个 mapping 文件
  3. 逐行处理 chinese Pricing.csv → 写入数据库
  4. 生成迁移报告
"""

import csv
import os
import re
import sys
import traceback
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
DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root', 'password': 'ldf123',
    'database': 'logitrack', 'charset': 'utf8mb4',
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, 'chinese Pricing.csv')
DATA_DIR = r'C:\Users\Administrator\Desktop\data'

# 列索引 (34 列 Tab 分隔)
C_ENQUIRY_DATE       = 0   # Enquiry Received Date
C_ISSUE_DATE         = 1   # Issue Date
C_REFERENCE          = 2   # Reference Number
C_PRODUCT            = 3   # Product
C_STATUS             = 4   # Status
C_CN_ADMIN           = 5   # CN Pricing Admin
C_SALES_COUNTRY      = 6   # Sales Country
C_SALES_OFFICE       = 7   # Sales office
C_SALES_PIC          = 8   # Sales PIC
C_ASSIGNED_CN        = 9   # Assigned CN Offices
# C_CN_GROUPING      = 10  ← SKIP
C_CARGO_TYPE         = 11  # Cargo Type
C_VOLUME_CBM         = 12  # Volume (CBM)
C_QUANTITY           = 13  # Quantity
C_QTY_UNIT           = 14  # Quantity (Unit)
C_QTY_TEU            = 15  # Quantity (TEU)
C_COMMODITY          = 16  # Commodity
C_HAZ                = 17  # Haz, Special Equipment
C_POL                = 18  # POL
C_POD                = 19  # POD
C_POD_COUNTRY        = 20  # POD Country
C_CORE_FLAG          = 21  # CORE / NON CORE
C_CATEGORY           = 22  # Category
C_CARGO_READY        = 23  # Cargo Ready Date
C_ADDITIONAL_REQ     = 24  # Additional Requirement
C_FST_QUOT_SENT      = 25  # 1st Quotation Sent
C_FST_OFFER_OCEAN    = 26  # 1st Offer: Ocean Frg
C_FST_OFFER_AIR      = 27  # 1st Offer: Air Frg/KG
C_LATEST_OFFER_OCEAN = 28  # Latest Offer: Ocean Frg
C_LATEST_OFFER_AIR   = 29  # Latest Offer: Air Frg/KG
C_BOOKING_CONFIRMED  = 30  # Booking Confirmed
C_REMARK             = 31  # Remark
C_REJECTED_REASON    = 32  # Rejected Reason
C_ACTUAL_REASON      = 33  # Actual Reason

# 零宽/不可见字符
_INVISIBLE = re.compile(r'[\u200b\u200c\u200d\u200e\u200f\ufeff\u00ad\xa0]')

# ============================================================
# 容器类型规范化
# ============================================================
CONTAINER_NORMALIZE = {
    "20'GP": '20GP', "20GP": '20GP', "20'FT": '20GP', "20FT": '20GP',
    "20'DC": '20GP', "20'DV": '20GP', "20;GP": '20GP', "20'": '20GP',
    "40'GP": '40GP', "40GP": '40GP', "40'FT": '40GP', "40FT": '40GP',
    "40'HQ": '40HQ', "40HQ": '40HQ', "40'HC": '40HQ', "40HC": '40HQ',
    "40'HQ REEFER": '40RF',
    "45'HQ": '45HQ', "45HQ": '45HQ', "45'HC": '45HQ', "45HC": '45HQ',
    "45*HQ": '45HQ', "45'": '45HQ',
    "20'OT": '20OT', "20OT": '20OT', "20 FT OPEN TOP": '20OT',
    "20' OPEN TOP": '20OT', "20' OT": '20OT',
    "40'OT": '40OT', "40OT": '40OT', "40' OT": '40OT',
    "20'FR": '20FR', "20FR": '20FR', "20'FR OOG": '20FR', "20OOG": '20FR',
    "40'FR": '40FR', "40FR": '40FR', "40'FR (OOG)": '40FR', "40'FR OOG": '40FR',
    "40 FLAT RACK": '40FR', "40' FR (OW": '40FR',
    "20'RF": '20RF', "20RF": '20RF', "20'REEFER": '20RF', "20 REEFER": '20RF',
    "40'RF": '40RF', "40RF": '40RF', "40'RF (OOG)": '40RF',
    "40 REEFER": '40RF', "40 REFFER": '40RF', "40'REFFER": '40RF',
    "20'NOR": '20NOR', "20NOR": '20NOR',
    "40'NOR": '40NOR', "40NOR": '40NOR',
    "20' ISO TANK": '20TANK', "20'ISO TANK": '20TANK', "20'TANK": '20TANK',
    "20FT ISO TANK": '20TANK', "20TANK": '20TANK', "20'FLEXITANK": '20TANK',
    "40'FT SOC TANK": '40TANK', "40'TANK": '40TANK', "40TANK": '40TANK',
    "40FT EMPTY (NEW) ISOTANKS": '40TANK', "ITANK": '40TANK',
    "BULK CONTAINER": 'BULK', "BREAKBULK": 'BBK', "BBK SHIPEMENT": 'BBK',
    "BBK": 'BBK', "1 BREAKBULK": 'BBK',
    "20'HC": '20GP', "40' HC": '40HQ', "40''HQ": '40HQ', "40' HQ": '40HQ',
    "40-FOOT CONTAINER": '40GP', "40'JQ": '40HQ',
    "40' FAT OOG": '40FR', "40'OOG": '40FR', "40OOG": '40FR', "20'OOG": '20FR',
    "40'OT (IG)": '40OT', "HQ": '40HQ', "FT": '20GP',
    "20'ISO": '20TANK', "20FT SOC": '20GP', "40'": '40GP',
    "40' OOG": '20FR', "40' FR (OW , OH)": '40FR',
}

CONTAINER_TEU = {
    '20GP': 1.0, '20RF': 1.0, '20OT': 1.0, '20FR': 1.0, '20NOR': 1.0, '20TANK': 1.0,
    '40GP': 2.0, '40HQ': 2.0, '40RF': 2.0, '40OT': 2.0, '40FR': 2.0, '40NOR': 2.0,
    '40HC': 2.0, '40TANK': 2.0,
    '45HQ': 2.25,
    'BBK': 0.0, 'BULK': 0.0, 'BREAKBULK': 0.0,
}

# Sales country CSV → dict_sales_country.code
SALES_COUNTRY_MAP = {
    'AGENTS': 'AG', 'BELGIUM': 'BE', 'SWITZERLAND': 'CH', 'CHINA': 'CN',
    'GERMANY': 'DE', 'UK': 'GB', 'GREECE': 'GR', 'MOROCCO': 'MA',
    'NETHERLANDS': 'NL', 'OTHERS': 'OT', 'POLAND': 'PL', 'USA': 'US',
    'SOUTH AFRICA': 'ZA',
}

# Product code 映射
PRODUCT_MAP = {
    'SEA': ('SEA', 'S'), 'AIR': ('AIR', 'A'), 'RAIL': ('RAIL', 'R'),
    'RAIL-SEA': ('RAIL-SEA', 'RS'), 'RAIL-AIR': ('RAIL-AIR', 'RA'),
    'SEA-AIR': ('SEA-AIR', 'SA'), 'AIR-RAIL-SEA': ('AIR-RAIL-SEA', 'ARS'),
}


# ============================================================
# 工具函数
# ============================================================
def clean(val):
    if val is None:
        return ''
    s = str(val).replace('\r\n', ' ').replace('\n', ' ').strip()
    s = _INVISIBLE.sub('', s)
    s = s.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    return re.sub(r'\s+', ' ', s).strip()


def upper(val):
    return clean(val).upper()


def parse_date(val):
    raw = clean(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', 'NA', '/', '', 'NIL'):
        return None, raw
    try:
        dt = date_parser.parse(raw, dayfirst=True)
        return dt, raw
    except Exception:
        return None, raw


def parse_number_first_segment(val):
    """解析数值，取第一段（支持多段如 5.92/23.40）"""
    raw = clean(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', '', 'NIL'):
        return None, raw, None

    # 多段分隔
    extra = None
    if '/' in raw:
        parts = raw.split('/')
        first_part = parts[0].strip()
        extra = '/'.join(parts[1:]).strip()
    else:
        first_part = raw

    # 范围值: "6000 to 12000" 或 "15~20"
    m_range = re.match(r'([\d,.]+)\s*(?:to|~|-)\s*([\d,.]+)', first_part, re.IGNORECASE)
    if m_range:
        try:
            v = float(m_range.group(1).replace(',', ''))
            extra_text = f'Range: {first_part}'
            if extra:
                extra_text += f' / {extra}'
            return v, raw, extra_text
        except ValueError:
            pass

    # 普通数值
    try:
        cleaned = first_part.replace(',', '')
        m = re.search(r'[\d.]+', cleaned)
        if m:
            v = float(m.group())
            extra_text = f'Remaining segments: {extra}' if extra else None
            return v, raw, extra_text
    except ValueError:
        pass

    return None, raw, None


def parse_ref_number(ref):
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


def get_transport_mode(ref_number):
    """从 Reference Number 后缀判断运输模式: 'AIR' 或 'OCEAN'"""
    m = re.match(r'CN\d+-([A-Z]+)\d*$', ref_number, re.IGNORECASE)
    if m:
        suffix = m.group(1).upper()
        if suffix == 'A':
            return 'AIR'
    return 'OCEAN'


def normalize_container_token(raw):
    s = clean(raw).upper()
    s = s.replace('\u2019', "'").replace('\u2018', "'")
    return s


# ============================================================
# 主迁移类
# ============================================================
class MigratorV4:
    def __init__(self):
        self.conn = None
        self.cur = None

        # DB 缓存
        self.port_by_code = {}       # port_code.upper() → port_id
        self.port_by_name = {}       # port_name.upper() → port_id
        self.port_by_city = {}       # city.upper() → port_id
        self.port_by_display = {}    # display_name.upper() → port_id (from new CSV)
        self.office_by_name = {}     # name.upper() → office_id
        self.pic_by_name = {}        # name.upper() → pic_id
        self.container_by_code = {}  # container_code.upper() → container_type_id
        self.country_by_code = {}    # country_code → country_id
        self.na_pic_id = None

        # Mapping 文件数据
        self.map_container = {}      # CSV原始箱型值.upper() → container_code
        self.map_air_pol = {}        # CSV原始值.upper() → IATA code
        self.map_air_pod = {}        # CSV原始值.upper() → IATA code
        self.map_ocean_pol = {}      # CSV原始值.upper() → display_name text
        self.map_ocean_pod = {}      # CSV原始值.upper() → display_name text
        self.map_pic = {}            # CSV原始姓名.upper() → (action, correct_name, office_override)
        self.map_office = {}         # CSV原始办公室.upper() → target_office_name

        # 统计
        self.stats = defaultdict(int)
        self.errors = []
        self.warnings = []

    # ----------------------------------------------------------
    # DB 连接和缓存加载
    # ----------------------------------------------------------
    def connect(self):
        self.conn = pymysql.connect(**DB_CONFIG)
        self.cur = self.conn.cursor()
        print('✅ 数据库连接成功')

    def load_caches(self):
        print('\n📦 加载数据库缓存...')

        # 端口
        self.cur.execute('SELECT id, port_code, port_name, city FROM port')
        for pid, pcode, pname, city in self.cur.fetchall():
            if pcode:
                self.port_by_code[pcode.strip().upper()] = pid
            if pname:
                self.port_by_name[pname.strip().upper()] = pid
                # 也建 display_name 索引
                self.port_by_display[pname.strip().upper()] = pid
            if city:
                self.port_by_city[city.strip().upper()] = pid

        # 去空格/去标点索引
        self.port_by_name_ns = {}
        self.port_by_name_np = {}
        for name_u, pid in self.port_by_name.items():
            self.port_by_name_ns[re.sub(r'\s+', '', name_u)] = pid
            self.port_by_name_np[re.sub(r'[^A-Z0-9]', '', name_u)] = pid

        print(f'  端口: {len(self.port_by_code)} 条')

        # 办公室
        self.cur.execute('SELECT id, name FROM dict_sales_office')
        for oid, name in self.cur.fetchall():
            self.office_by_name[name.strip().upper()] = oid
            # 也加零宽字符清理版本
            cleaned = _INVISIBLE.sub('', name).strip().upper()
            self.office_by_name[cleaned] = oid
        print(f'  办公室: {len(self.office_by_name)} 条')

        # PIC
        self.cur.execute('SELECT id, name FROM dict_sales_pic')
        for pid, name in self.cur.fetchall():
            self.pic_by_name[name.strip().upper()] = pid
            cleaned = _INVISIBLE.sub('', name).strip().upper()
            self.pic_by_name[cleaned] = pid
            # 去多余空格版本
            collapsed = re.sub(r'\s+', ' ', cleaned)
            self.pic_by_name[collapsed] = pid
        print(f'  PIC: {len(self.pic_by_name)} 条')

        # NA PIC
        self.na_pic_id = self.pic_by_name.get('NA')
        if not self.na_pic_id:
            raise RuntimeError('NA PIC 不存在! 请先运行 setup_migration.py')
        print(f'  NA PIC: id={self.na_pic_id}')

        # 容器
        self.cur.execute('SELECT id, container_code FROM container_types')
        for cid, code in self.cur.fetchall():
            self.container_by_code[code.strip().upper()] = cid
        print(f'  箱型: {len(self.container_by_code)} 条')

        # 国家
        self.cur.execute('SELECT id, country_code FROM country')
        for cid, cc in self.cur.fetchall():
            self.country_by_code[cc] = cid
        print(f'  国家: {len(self.country_by_code)} 条')

    # ----------------------------------------------------------
    # 加载 mapping 文件
    # ----------------------------------------------------------
    def load_mappings(self):
        print('\n📂 加载 mapping 文件...')

        # 1. Container mapping
        self._load_csv_mapping(
            'unmapped_container_20260414.csv',
            key_col='CSV原始箱型值', val_col='mapping code',
            target=self.map_container, desc='Container')

        # 2. Air POL mapping
        f = self._find_file('unmapped_Air_pol_20260415.csv')
        if f:
            with open(f, 'r', encoding='utf-8-sig') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    key = row.get('CSV原始值', '').strip().upper()
                    val = row.get('POL - Air', '').strip()
                    if key and val:
                        self.map_air_pol[key] = val
            print(f'  Air POL: {len(self.map_air_pol)} 条')

        # 3. Air POD mapping
        f = self._find_file('unmapped_Air_pod_20260415.csv')
        if f:
            with open(f, 'r', encoding='utf-8-sig') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    key = row.get('CSV原始值', '').strip().upper()
                    # 找包含 "Air Port" 的列
                    val = ''
                    for col_name in reader.fieldnames:
                        if 'Air Port' in col_name or 'air port' in col_name.lower():
                            val = row.get(col_name, '').strip()
                            if val:
                                break
                    if key and val:
                        self.map_air_pod[key] = val
            print(f'  Air POD: {len(self.map_air_pod)} 条')

        # 4. Ocean POL mapping
        f = self._find_file('unmapped_Ocean_pol_20240415.csv') or self._find_file('unmapped_Ocean_pol_20260415.csv')
        if f:
            self._load_csv_mapping_from_file(f, 'CSV原始值', 'Map to Ocean Port Code', self.map_ocean_pol, 'Ocean POL')

        # 5. Ocean POD mapping
        f = self._find_file('unmapped_Ocean_pod_20260415.csv')
        if f:
            self._load_csv_mapping_from_file(f, 'CSV原始值', 'Map to Ocean Port Code', self.map_ocean_pod, 'Ocean POD')

        # 6. Sales PIC mapping
        f = self._find_file('unmapped_sales_pic_20260414.csv')
        if f:
            with open(f, 'r', encoding='utf-8-sig') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    csv_name = row.get('CSV原始姓名', '').strip()
                    mapping = row.get('Map to sales pic', '').strip()
                    if not csv_name or not mapping:
                        continue

                    key = csv_name.upper()
                    mapping_u = mapping.upper().strip()

                    # Parse office override
                    office_override = None
                    m_off = re.search(r'please\s+correct\s+sales\s+office\s+to\s+["\']?([^"\']+)', mapping, re.IGNORECASE)
                    if m_off:
                        office_override = m_off.group(1).strip().upper()
                        if office_override == 'ZIEGLER FRNACE':
                            office_override = 'ZIEGLER FRANCE'

                    # Extract name part
                    if m_off:
                        idx = mapping.lower().find('please')
                        name_part = mapping[:idx].strip() if idx > 0 else csv_name
                    else:
                        name_part = mapping

                    if mapping_u == 'NA' or (mapping_u.startswith('NA') and len(mapping_u) > 2 and mapping_u[2] in (' ', ',')):
                        # NA → use NA PIC
                        self.map_pic[key] = ('NA', None, office_override)
                    else:
                        # Name correction
                        correct_name = name_part.strip()
                        if not correct_name or correct_name.upper() == 'NA':
                            correct_name = csv_name
                        self.map_pic[key] = ('RENAME', correct_name, office_override)

            print(f'  Sales PIC: {len(self.map_pic)} 条')

        # 7. Sales Office mapping
        f = self._find_file('unmapped_sales_office_20260414.csv')
        if f:
            with open(f, 'r', encoding='utf-8-sig') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    csv_office = row.get('CSV原始办公室名称', '').strip()
                    mapping = row.get('mapping data', '').strip()
                    if not csv_office or not mapping:
                        continue
                    key = _INVISIBLE.sub('', csv_office).strip().upper()

                    # 特殊处理: "Please do not put" → 新增了但用于迁移
                    if 'do not put' in mapping.lower():
                        # ZIEGLER FRANCE / ZIEGLER XIAMEN — 使用原名
                        target = csv_office.strip().upper()
                    else:
                        target = mapping.strip().upper()

                    self.map_office[key] = target
            print(f'  Sales Office: {len(self.map_office)} 条')

    def _find_file(self, name):
        path = os.path.join(DATA_DIR, name)
        if os.path.exists(path):
            return path
        return None

    def _load_csv_mapping(self, filename, key_col, val_col, target, desc):
        f = self._find_file(filename)
        if not f:
            print(f'  ⚠️ 未找到 {filename}')
            return
        self._load_csv_mapping_from_file(f, key_col, val_col, target, desc)

    def _load_csv_mapping_from_file(self, filepath, key_col, val_col, target, desc):
        with open(filepath, 'r', encoding='utf-8-sig') as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                key = row.get(key_col, '').strip().upper()
                val = row.get(val_col, '').strip()
                if key and val:
                    target[key] = val
        print(f'  {desc}: {len(target)} 条')

    # ----------------------------------------------------------
    # Phase 1: 清空业务数据
    # ----------------------------------------------------------
    def clear_business_data(self):
        print('\n🗑️ Phase 1: 清空业务数据...')
        tables = [
            'offer_container_detail', 'offer_price_line', 'offer',
            'enquiry_route_group_pol', 'enquiry_route_group_pod', 'enquiry_route_group',
            'enquiry_pol', 'enquiry_pod', 'enquiry_container_line', 'enquiry',
        ]
        for t in tables:
            try:
                self.cur.execute(f'DELETE FROM {t}')
                cnt = self.cur.rowcount
                if cnt > 0:
                    print(f'  删除 {t}: {cnt} 行')
            except Exception as e:
                print(f'  ⚠️ {t}: {e}')
        self.conn.commit()
        print('  ✅ 业务数据已清空')

    # ----------------------------------------------------------
    # Phase 2: 主迁移
    # ----------------------------------------------------------
    def migrate(self):
        print('\n📊 Phase 2: 开始主迁移...')

        # 读取 CSV
        with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f, delimiter='\t')
            header = next(reader)
            rows = list(reader)

        print(f'  CSV 行数: {len(rows)}')

        seen_refs = set()
        duplicates = []
        batch_count = 0

        for row_idx, cols in enumerate(rows, start=2):
            self.stats['total'] += 1

            try:
                # 确保列数足够
                while len(cols) < 34:
                    cols.append('')

                ref_number = clean(cols[C_REFERENCE])
                if not ref_number:
                    self.errors.append((row_idx, ref_number, '空 Reference Number'))
                    self.stats['skip_empty_ref'] += 1
                    continue

                # 重复检查
                if ref_number in seen_refs:
                    duplicates.append((row_idx, ref_number))
                    self.stats['skip_duplicate'] += 1
                    continue
                seen_refs.add(ref_number)

                # 处理单行
                self._process_row(row_idx, cols, ref_number)
                batch_count += 1

                # 每 500 行提交一次
                if batch_count % 500 == 0:
                    self.conn.commit()
                    print(f'  ... 已处理 {self.stats["total"]} 行, 成功 {self.stats["success"]}')

            except Exception as e:
                self.errors.append((row_idx, ref_number if 'ref_number' in dir() else '?', str(e)))
                self.stats['error'] += 1

        self.conn.commit()

        # 保存重复记录
        if duplicates:
            dup_file = os.path.join(SCRIPT_DIR, 'migration_duplicate_refs.csv')
            with open(dup_file, 'w', encoding='utf-8', newline='') as f:
                w = csv.writer(f)
                w.writerow(['行号', 'Reference Number'])
                w.writerows(duplicates)
            print(f'  ⚠️ 重复记录: {len(duplicates)} 条 → {dup_file}')

    def _process_row(self, row_idx, cols, ref_number):
        """处理单行 CSV 数据"""

        # === 1. 日期 ===
        recv_dt, _ = parse_date(cols[C_ENQUIRY_DATE])
        issue_dt, _ = parse_date(cols[C_ISSUE_DATE])
        if not recv_dt:
            recv_dt = issue_dt or datetime.now()
        if not issue_dt:
            issue_dt = recv_dt

        # Cargo Ready Date
        cargo_ready_raw = clean(cols[C_CARGO_READY])
        has_specific_crd = 0
        cargo_ready_dt = None
        cargo_ready_details = None
        if cargo_ready_raw and cargo_ready_raw.upper() not in ('TBA', '-', 'N/A', 'NA', '', 'NIL'):
            crd, _ = parse_date(cargo_ready_raw)
            if crd:
                cargo_ready_dt = crd
                has_specific_crd = 1
            else:
                cargo_ready_details = cargo_ready_raw
        else:
            cargo_ready_details = cargo_ready_raw if cargo_ready_raw else None

        if not cargo_ready_dt:
            cargo_ready_dt = recv_dt  # 默认使用询价接收日期

        # === 2. Reference Number 解析 ===
        ref_info = parse_ref_number(ref_number)
        transport_mode = get_transport_mode(ref_number)

        # === 3. Product ===
        product_raw = upper(cols[C_PRODUCT])
        product_code, product_abbr = PRODUCT_MAP.get(product_raw, ('SEA', 'S'))
        if ref_info['product_abbr']:
            product_abbr = ref_info['product_abbr']

        # === 4. Status (决策一) ===
        status_raw = upper(cols[C_STATUS])
        booking_raw = upper(cols[C_BOOKING_CONFIRMED])

        if status_raw == 'CANCELLED' or status_raw == 'CANCELED':
            status = 'Cancelled'
        elif status_raw == 'QUOTED':
            if booking_raw == 'YES':
                status = 'Secured'
            elif booking_raw == 'REJECTED':
                status = 'Lost'
            elif booking_raw == 'INVALID':
                status = 'Cancelled'
            else:
                status = 'Quoted & Pending'
        else:
            status = 'New'

        # Lost / Cancelled 原因
        cancelled_reason = None
        cancelled_reason_text = None
        lost_reason = None
        lost_reason_text = None
        rejected_reason = clean(cols[C_REJECTED_REASON])
        actual_reason = clean(cols[C_ACTUAL_REASON])

        if status == 'Lost':
            lost_reason_text = rejected_reason or actual_reason or None
        elif status == 'Cancelled':
            cancelled_reason_text = rejected_reason or actual_reason or None

        # === 5. Cargo Type (决策二) ===
        cargo_type_raw = upper(cols[C_CARGO_TYPE])
        qty_unit_raw = upper(cols[C_QTY_UNIT])

        if cargo_type_raw == 'RAIL':
            if any(k in qty_unit_raw for k in ('CBM', 'KG', 'TON', 'MT', 'KILO', 'WEIGHT')):
                cargo_type = 'LCL'
            else:
                cargo_type = 'FCL'
            self.stats['rail_converted'] += 1
        elif cargo_type_raw in ('FCL', 'LCL', 'AIR', 'BUYER-CONSOL'):
            cargo_type = cargo_type_raw
        elif cargo_type_raw == 'OCEAN':
            cargo_type = 'FCL'
        else:
            cargo_type = 'FCL'  # default

        # Offer type
        if cargo_type == 'AIR':
            offer_type = 'AIR'
        elif cargo_type == 'BUYER-CONSOL':
            offer_type = 'BUYER-CONSOL'
        elif cargo_type == 'LCL':
            offer_type = 'LCL'
        else:
            offer_type = 'FCL'

        # === 6. Sales Country ===
        sc_raw = upper(cols[C_SALES_COUNTRY])
        sc_code = SALES_COUNTRY_MAP.get(sc_raw, 'OT')

        # === 7. Sales PIC (决策六) ===
        pic_raw = clean(cols[C_SALES_PIC])
        pic_key = _INVISIBLE.sub('', pic_raw).strip().upper()
        pic_key_collapsed = re.sub(r'\s+', ' ', pic_key)

        pic_id = (self.pic_by_name.get(pic_key) or
                  self.pic_by_name.get(pic_key_collapsed))

        office_override = None  # PIC mapping 中的 office 覆盖

        if pic_id is None:
            # 查 mapping
            mapping = self.map_pic.get(pic_key) or self.map_pic.get(pic_key_collapsed)
            if mapping:
                action, correct_name, off_override = mapping
                if action == 'NA':
                    pic_id = self.na_pic_id
                    office_override = off_override
                elif action == 'RENAME' and correct_name:
                    pic_id = self.pic_by_name.get(correct_name.upper())
                    office_override = off_override
                    if pic_id is None:
                        self.errors.append((row_idx, ref_number, f'PIC renamed to "{correct_name}" but not found in DB'))
                        self.stats['skip_pic'] += 1
                        return
            else:
                # 最后尝试: 也许是 NA 类（159 个 unmapped PIC 大部分映射为 NA）
                pic_id = self.na_pic_id
                self.warnings.append((row_idx, ref_number, f'PIC "{pic_raw}" not in mapping, defaulting to NA'))

        # === 8. Sales Office (决策七) ===
        office_raw = clean(cols[C_SALES_OFFICE])
        office_key = _INVISIBLE.sub('', office_raw).strip().upper()

        if office_override:
            # PIC mapping 有 office 覆盖
            office_id = self.office_by_name.get(office_override)
            if not office_id:
                self.errors.append((row_idx, ref_number, f'Office override "{office_override}" not found'))
                self.stats['skip_office'] += 1
                return
        else:
            # 跳过 TBA / dash / 空 office
            if office_key in ('TBA', '-', 'N/A', '', 'NIL'):
                self.errors.append((row_idx, ref_number, f'Office is "{office_raw}" (skipped)'))
                self.stats['skip_office'] += 1
                return

            office_id = self.office_by_name.get(office_key)
            if not office_id:
                # 查 mapping
                target = self.map_office.get(office_key)
                if target:
                    office_id = self.office_by_name.get(target)

                if not office_id:
                    # 可能是特殊映射 (Pls update...) 需要按 PIC 路由
                    office_id = self._route_office_by_pic(pic_raw, office_key)

                if not office_id:
                    self.errors.append((row_idx, ref_number, f'Office "{office_raw}" not found'))
                    self.stats['skip_office'] += 1
                    return

        # === 9. Volume CBM (决策八) ===
        vol_val, vol_raw, vol_extra = parse_number_first_segment(cols[C_VOLUME_CBM])

        # === 10. Quantity (决策十) ===
        qty_val, qty_raw, qty_extra = parse_number_first_segment(cols[C_QUANTITY])

        # === 11. 其他字段 ===
        assigned_cn = clean(cols[C_ASSIGNED_CN])
        commodity = clean(cols[C_COMMODITY])
        haz = clean(cols[C_HAZ])
        pod_country = clean(cols[C_POD_COUNTRY])

        core_raw = upper(cols[C_CORE_FLAG])
        core_val = None
        if 'NON' in core_raw:
            core_val = 'Non-Core'
        elif 'CORE' in core_raw:
            core_val = 'Core'

        category = clean(cols[C_CATEGORY])
        additional_req = clean(cols[C_ADDITIONAL_REQ])

        # Remark 拼接
        remark_parts = []
        original_remark = clean(cols[C_REMARK])
        if original_remark:
            remark_parts.append(original_remark)
        if cargo_type_raw == 'RAIL':
            remark_parts.append(f'[Migration] Original Cargo Type: RAIL → mapped to {cargo_type}')
        if vol_extra:
            remark_parts.append(f'[Migration] Volume: {vol_extra}')
        if qty_extra:
            remark_parts.append(f'[Migration] Quantity: {qty_extra}')
        if additional_req:
            remark_parts.append(f'[Additional Requirement] {additional_req}')
        remark = ' | '.join(remark_parts) if remark_parts else None

        uom = clean(cols[C_QTY_UNIT]) if not self._is_container_string(cols[C_QTY_UNIT]) else None
        if uom and len(uom) > 20:
            remark_parts.append(f'[Migration] UOM truncated: {uom}')
            uom = uom[:20]

        # === INSERT enquiry ===
        self.cur.execute('''INSERT INTO enquiry (
            ref_number, enquiry_received_date, enquiry_created_date,
            product_code, cargo_type_code, status,
            cancelled_reason, cancelled_reason_text,
            lost_reason, lost_reason_text,
            sales_country_code, sales_pic_id, sales_office_id,
            assigned_cn_office, commodity, hazardous_special_equipment,
            volume_cbm, quantity, uom,
            pol_country, pod_country, category,
            core_non_core,
            has_specific_cargo_ready_date, cargo_ready_date, cargo_ready_date_details,
            offer_type, remark,
            reference_month, monthly_sequence, serial_number, product_abbr,
            created_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s
        )''', (
            ref_number,
            recv_dt.strftime('%Y-%m-%d') if recv_dt else None,
            issue_dt.strftime('%Y-%m-%d %H:%M:%S') if issue_dt else None,
            product_code, cargo_type, status,
            cancelled_reason, cancelled_reason_text,
            lost_reason, lost_reason_text,
            sc_code, pic_id, office_id,
            assigned_cn, commodity, haz,
            vol_val, qty_val, uom,
            None, pod_country, category,
            core_val,
            has_specific_crd,
            cargo_ready_dt.strftime('%Y-%m-%d') if cargo_ready_dt else None,
            cargo_ready_details,
            offer_type, remark,
            ref_info['reference_month'], ref_info['monthly_sequence'],
            ref_info['serial_number'], product_abbr,
            'migration_v4',
        ))
        enquiry_id = self.cur.lastrowid

        # === POL/POD (决策三) ===
        pol_ids = self._resolve_ports(cols[C_POL], transport_mode, 'POL')
        pod_ids = self._resolve_ports(cols[C_POD], transport_mode, 'POD')

        # 更新 pol_country 冗余字段
        if pol_ids:
            first_pol = pol_ids[0]
            self.cur.execute('SELECT country_code FROM port WHERE id = %s', (first_pol,))
            r = self.cur.fetchone()
            if r and r[0]:
                self.cur.execute('UPDATE enquiry SET pol_country = %s WHERE id = %s',
                                 (r[0], enquiry_id))

        for pid in pol_ids:
            self.cur.execute('INSERT INTO enquiry_pol (enquiry_id, port_id) VALUES (%s, %s)',
                             (enquiry_id, pid))

        for pid in pod_ids:
            self.cur.execute('INSERT INTO enquiry_pod (enquiry_id, port_id) VALUES (%s, %s)',
                             (enquiry_id, pid))

        self.stats['pol_matched'] += len(pol_ids)
        self.stats['pod_matched'] += len(pod_ids)

        # === Container (决策九) ===
        self._process_containers(enquiry_id, cols, cargo_type)

        # === Offer (决策四) ===
        self._process_offer(enquiry_id, cols, status, offer_type, pol_ids, pod_ids)

        self.stats['success'] += 1

    # ----------------------------------------------------------
    # 端口匹配
    # ----------------------------------------------------------
    def _resolve_ports(self, raw_value, transport_mode, direction):
        """解析 POL/POD 字段，返回 port_id 列表"""
        raw = clean(raw_value)
        if not raw or raw.upper() in ('TBA', '-', 'N/A', 'NA', '', 'NIL'):
            return []

        # 分隔多端口
        tokens = re.split(r'[/;]', raw)
        port_ids = []

        for token in tokens:
            t = token.strip()
            if not t:
                continue
            pid = self._match_single_port(t, transport_mode, direction)
            if pid and pid not in port_ids:
                port_ids.append(pid)

        return port_ids

    def _match_single_port(self, token, transport_mode, direction):
        """匹配单个端口 token → port_id"""
        tu = token.strip().upper()
        if not tu or tu in ('-', 'TBA', 'N/A', ''):
            return None

        # 1. 精确匹配 port_code/name/city
        pid = (self.port_by_code.get(tu) or
               self.port_by_name.get(tu) or
               self.port_by_city.get(tu))
        if pid:
            return pid

        # 2. 去空格匹配
        tu_ns = re.sub(r'\s+', '', tu)
        pid = self.port_by_name_ns.get(tu_ns)
        if pid:
            return pid

        # 3. 去标点匹配
        tu_np = re.sub(r'[^A-Z0-9]', '', tu)
        pid = self.port_by_name_np.get(tu_np)
        if pid:
            return pid

        # 4. 去后缀
        for suffix in (' PORT', ' CITY', ' STATION', ' DISTRICT'):
            if tu.endswith(suffix):
                base = tu[:-len(suffix)].strip()
                pid = self.port_by_code.get(base) or self.port_by_name.get(base) or self.port_by_city.get(base)
                if pid:
                    return pid

        # 5. 逗号分隔取首段/尾段
        if ',' in tu:
            first = tu.split(',')[0].strip()
            pid = self.port_by_code.get(first) or self.port_by_name.get(first) or self.port_by_city.get(first)
            if pid:
                return pid
            last = tu.split(',')[-1].strip()
            if last != tu:
                pid = self.port_by_code.get(last) or self.port_by_name.get(last) or self.port_by_city.get(last)
                if pid:
                    return pid

        # 6. 查 mapping 文件
        mapping_dict = None
        if transport_mode == 'AIR':
            mapping_dict = self.map_air_pol if direction == 'POL' else self.map_air_pod
        else:
            mapping_dict = self.map_ocean_pol if direction == 'POL' else self.map_ocean_pod

        mapped_value = mapping_dict.get(tu)
        if mapped_value:
            # Air mapping 返回 IATA code → 直接查 port_code
            if transport_mode == 'AIR':
                mapped_upper = mapped_value.strip().upper()
                # 特殊值 "China Main Port"
                if 'CHINA MAIN PORT' in mapped_upper or mapped_upper == 'CMP':
                    return self.port_by_code.get('CMP')
                pid = self.port_by_code.get(mapped_upper)
                if pid:
                    return pid
            else:
                # Ocean mapping 返回 "City, Country" 描述文本 → 查 display_name
                mapped_upper = mapped_value.strip().upper()
                pid = self.port_by_display.get(mapped_upper)
                if pid:
                    return pid
                # 也尝试 port_name/city 匹配
                pid = self.port_by_name.get(mapped_upper) or self.port_by_city.get(mapped_upper)
                if pid:
                    return pid
                # 取逗号前的城市名
                city = mapped_upper.split(',')[0].strip()
                pid = self.port_by_city.get(city) or self.port_by_name.get(city)
                if pid:
                    return pid

        # 7. 未匹配
        self.stats[f'{direction.lower()}_unmatched'] += 1
        return None

    # ----------------------------------------------------------
    # 容器处理
    # ----------------------------------------------------------
    def _process_containers(self, enquiry_id, cols, cargo_type):
        """处理容器类型信息"""
        qty_raw = clean(cols[C_QUANTITY])
        unit_raw = clean(cols[C_QTY_UNIT])
        teu_raw = clean(cols[C_QTY_TEU])

        # 检测 qty/unit 互换
        if unit_raw and qty_raw:
            if self._is_numeric(unit_raw) and self._is_container_string(qty_raw):
                qty_raw, unit_raw = unit_raw, qty_raw
                self.stats['swap_fixed'] += 1

        if not unit_raw or not self._is_container_string(unit_raw):
            return

        # 解析容器类型
        container_codes = self._parse_container_types(unit_raw)
        if not container_codes:
            return

        # 解析数量
        try:
            qty_total = int(float(qty_raw.replace(',', ''))) if qty_raw and self._is_numeric(qty_raw) else 1
        except (ValueError, TypeError):
            qty_total = 1

        # 简单分配: 均分
        n = len(container_codes)
        per_type = max(1, qty_total // n)

        for code in container_codes:
            ct_id = self.container_by_code.get(code.upper())
            teu = CONTAINER_TEU.get(code, 2.0)

            # 确定 qty 字段
            q20 = q40 = q40hq = q45 = 0
            if code in ('20GP', '20RF', '20OT', '20FR', '20NOR', '20TANK'):
                q20 = per_type
            elif code in ('40GP', '40RF', '40OT', '40FR', '40NOR', '40TANK', '40HC'):
                q40 = per_type
            elif code in ('40HQ',):
                q40hq = per_type
            elif code in ('45HQ',):
                q45 = per_type
            else:
                # 非标准 (BBK, BULK) → raw_text
                self.cur.execute('''INSERT INTO enquiry_container_line
                    (enquiry_id, qty_20, qty_40, qty_40hq, qty_45, cntr_type_code, raw_text, line_teu)
                    VALUES (%s, 0, 0, 0, 0, %s, %s, 0)''',
                    (enquiry_id, code, unit_raw))
                self.stats['container_lines'] += 1
                continue

            line_teu = teu * per_type
            self.cur.execute('''INSERT INTO enquiry_container_line
                (enquiry_id, qty_20, qty_40, qty_40hq, qty_45, cntr_type_code, line_teu)
                VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                (enquiry_id, q20, q40, q40hq, q45, code, line_teu))
            self.stats['container_lines'] += 1

    def _parse_container_types(self, raw):
        """解析容器类型字符串 → 标准 code 列表"""
        raw_norm = normalize_container_token(raw)

        # 先查 mapping 文件
        mapped = self.map_container.get(raw_norm)
        if mapped:
            # mapped 可能含多个 (如 "20FR / 40FR")
            codes = []
            for part in re.split(r'[/+,]', mapped):
                p = part.strip().upper()
                if p and p in self.container_by_code:
                    codes.append(p)
            if codes:
                return codes

        # 查 CONTAINER_NORMALIZE
        code = CONTAINER_NORMALIZE.get(raw_norm)
        if code:
            return [code]

        # 多箱型分隔
        parts = re.split(r'[/+&,x*]', raw_norm)
        if len(parts) >= 2:
            codes = []
            for p in parts:
                p = p.strip()
                c = CONTAINER_NORMALIZE.get(p)
                if c:
                    codes.append(c)
            if codes:
                return codes

        return []

    def _is_container_string(self, s):
        s = normalize_container_token(s)
        if s in CONTAINER_NORMALIZE:
            return True
        if self.map_container.get(s):
            return True
        return False

    def _is_numeric(self, s):
        try:
            float(clean(s).replace(',', ''))
            return True
        except (ValueError, AttributeError):
            return False

    # ----------------------------------------------------------
    # Offer 处理 (决策四)
    # ----------------------------------------------------------
    def _process_offer(self, enquiry_id, cols, status, offer_type, pol_ids, pod_ids):
        """创建 Offer (仅当 status != New 且有报价数据)"""
        if status == 'New':
            return

        # 收集价格文本
        price_parts = []
        for idx, label in [
            (C_FST_OFFER_OCEAN, '1st Ocean'),
            (C_FST_OFFER_AIR, '1st Air'),
            (C_LATEST_OFFER_OCEAN, 'Latest Ocean'),
            (C_LATEST_OFFER_AIR, 'Latest Air'),
        ]:
            val = clean(cols[idx])
            if val and val.upper() not in ('TBA', '-', 'N/A', 'NA', '', 'NIL'):
                price_parts.append(f'{label}: {val}')

        if not price_parts:
            return

        price_text = ' | '.join(price_parts)
        if len(price_text) > 500:
            price_text = price_text[:497] + '...'

        # Offer date
        offer_dt, _ = parse_date(cols[C_FST_QUOT_SENT])

        # INSERT offer
        self.cur.execute('''INSERT INTO offer
            (enquiry_id, sequence_no, is_latest, offer_type, offer_date, remark)
            VALUES (%s, 1, 1, %s, %s, NULL)''',
            (enquiry_id, offer_type,
             offer_dt.strftime('%Y-%m-%d') if offer_dt else None))
        offer_id = self.cur.lastrowid

        # INSERT offer_price_line
        pol_id = pol_ids[0] if pol_ids else None
        pod_id = pod_ids[0] if pod_ids else None

        if pol_id and pod_id:
            self.cur.execute('''INSERT INTO offer_price_line
                (offer_id, pol_id, pod_id, price_text, sort_order)
                VALUES (%s, %s, %s, %s, 0)''',
                (offer_id, pol_id, pod_id, price_text))
            self.stats['offer_price_lines'] += 1
        elif price_text:
            # 无端口但有价格 → 存入 offer remark
            self.cur.execute('UPDATE offer SET remark = %s WHERE id = %s',
                             (f'[Price] {price_text}', offer_id))

        self.stats['offers_created'] += 1

    # ----------------------------------------------------------
    # Office 路由 (特殊行按 PIC 分配)
    # ----------------------------------------------------------
    def _route_office_by_pic(self, pic_name, office_key):
        """特殊 office 行 (如 'Pls update...' / 'SHENZHEN CENTER') 按 PIC 路由"""
        pic_upper = pic_name.strip().upper()

        # 预定义路由
        pic_office_routes = {
            'ELENA GHILOTTI': 'STARPOWER EUROPE AG',
            'SUSANA WONG': 'ZIEGLER HONG KONG',
            'SIMON KIBI': 'ZIEGLER JOHANNESBURG',
            'TIM SU': "SHENZHEN CENTER INT'L LOGISTICS CO.,LTD",
            'SELINA': "SHENZHEN CENTER INT'L LOGISTICS CO.,LTD",
        }

        target = pic_office_routes.get(pic_upper)
        if target:
            return self.office_by_name.get(target.upper())

        return None

    # ----------------------------------------------------------
    # Phase 3: 报告
    # ----------------------------------------------------------
    def report(self):
        print('\n' + '='*60)
        print('📋 Phase 3: 迁移报告')
        print('='*60)

        print(f'\n总处理行数: {self.stats["total"]}')
        print(f'成功导入:    {self.stats["success"]}')
        print(f'跳过-重复:   {self.stats["skip_duplicate"]}')
        print(f'跳过-空ref:  {self.stats["skip_empty_ref"]}')
        print(f'跳过-PIC:    {self.stats["skip_pic"]}')
        print(f'跳过-Office: {self.stats["skip_office"]}')
        print(f'错误:        {self.stats["error"]}')

        print(f'\nPOL 匹配:    {self.stats["pol_matched"]}')
        print(f'POD 匹配:    {self.stats["pod_matched"]}')
        print(f'POL 未匹配:  {self.stats["pol_unmatched"]}')
        print(f'POD 未匹配:  {self.stats["pod_unmatched"]}')

        print(f'\nRAIL 转换:   {self.stats["rail_converted"]}')
        print(f'QTY/Unit 互换: {self.stats["swap_fixed"]}')
        print(f'容器行:      {self.stats["container_lines"]}')
        print(f'Offer 创建:  {self.stats["offers_created"]}')
        print(f'价格行:      {self.stats["offer_price_lines"]}')

        # 状态分布
        self.cur.execute('SELECT status, COUNT(*) FROM enquiry GROUP BY status ORDER BY status')
        print('\n状态分布:')
        for r in self.cur.fetchall():
            print(f'  {r[0]}: {r[1]}')

        # Cargo type 分布
        self.cur.execute('SELECT cargo_type_code, COUNT(*) FROM enquiry GROUP BY cargo_type_code ORDER BY cargo_type_code')
        print('\nCargo Type 分布:')
        for r in self.cur.fetchall():
            print(f'  {r[0]}: {r[1]}')

        # 保存错误报告
        if self.errors:
            err_file = os.path.join(SCRIPT_DIR, 'migration_errors.csv')
            with open(err_file, 'w', encoding='utf-8', newline='') as f:
                w = csv.writer(f)
                w.writerow(['行号', 'Reference Number', '错误原因'])
                w.writerows(self.errors)
            print(f'\n⚠️ 错误详情: {len(self.errors)} 条 → {err_file}')

        if self.warnings:
            warn_file = os.path.join(SCRIPT_DIR, 'migration_warnings.csv')
            with open(warn_file, 'w', encoding='utf-8', newline='') as f:
                w = csv.writer(f)
                w.writerow(['行号', 'Reference Number', '警告信息'])
                w.writerows(self.warnings)
            print(f'⚠️ 警告详情: {len(self.warnings)} 条 → {warn_file}')

        # FK 完整性
        print('\nFK 完整性检查:')
        self.cur.execute('SELECT COUNT(*) FROM enquiry WHERE sales_pic_id NOT IN (SELECT id FROM dict_sales_pic)')
        print(f'  PIC 悬挂: {self.cur.fetchone()[0]}')
        self.cur.execute('SELECT COUNT(*) FROM enquiry WHERE sales_office_id NOT IN (SELECT id FROM dict_sales_office)')
        print(f'  Office 悬挂: {self.cur.fetchone()[0]}')

        # 端口关联率
        self.cur.execute('SELECT COUNT(DISTINCT enquiry_id) FROM enquiry_pol')
        with_pol = self.cur.fetchone()[0]
        self.cur.execute('SELECT COUNT(DISTINCT enquiry_id) FROM enquiry_pod')
        with_pod = self.cur.fetchone()[0]
        total = self.stats['success']
        print(f'\n端口关联率:')
        print(f'  有 POL: {with_pol}/{total} ({with_pol*100//max(total,1)}%)')
        print(f'  有 POD: {with_pod}/{total} ({with_pod*100//max(total,1)}%)')


# ============================================================
# Main
# ============================================================
def main():
    print('='*60)
    print('LogiTrack Pro — V4 数据迁移')
    print('='*60)

    migrator = MigratorV4()
    migrator.connect()

    try:
        migrator.load_caches()
        migrator.load_mappings()
        migrator.clear_business_data()
        migrator.migrate()
        migrator.report()
    except Exception as e:
        migrator.conn.rollback()
        print(f'\n❌ 致命错误: {e}')
        traceback.print_exc()
        raise
    finally:
        migrator.conn.close()

    print('\n✅ 迁移完成!')


if __name__ == '__main__':
    main()
