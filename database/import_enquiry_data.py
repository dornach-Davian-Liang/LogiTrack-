#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro - CSV 数据导入脚本
从 China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv 导入数据到 MySQL

使用方法:
    python import_enquiry_data.py

依赖:
    pip install pymysql python-dateutil
"""

import csv
import re
import os
import sys
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
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'ldf123'),
    'database': os.getenv('MYSQL_DATABASE', 'logitrack'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 
                        'China Pricing - Enquiry Record-working(Rate Enquiry Summary).csv')

# CSV 列索引（基于分析结果）
COL = {
    'enquiry_received_date': 0,
    'issue_date': 1,
    'reference_number': 2,
    'product': 3,
    'status': 4,
    'cn_pricing_admin': 5,
    'sales_country': 6,
    'sales_office': 7,
    'sales_pic': 8,
    'assigned_cn_offices': 9,
    'cargo_type': 10,
    'volume_cbm': 11,
    'quantity': 12,
    'quantity_unit': 13,
    'quantity_teu': 14,
    'commodity': 15,
    'haz_special_equipment': 16,
    'pol': 17,
    'pod': 18,
    'pod_country': 19,
    'core_non_core': 20,
    'category': 21,
    'cargo_ready_date': 22,
    'additional_requirement': 23,
    'first_quotation_sent': 24,
    'first_offer_ocean': 25,
    'first_offer_air': 26,
    'latest_offer_ocean': 27,
    'latest_offer_air': 28,
    'booking_confirmed': 29,
    'remark': 30,
    'rejected_reason': 31,
    'actual_reason': 32
}


# ============================================================
# 数据清洗工具函数
# ============================================================

def clean_string(val: str) -> str:
    """清洗字符串：去空格、统一空格"""
    if not val:
        return ''
    return re.sub(r'\s+', ' ', val.strip())


def normalize_upper(val: str) -> str:
    """规范化为大写"""
    return clean_string(val).upper()


def parse_date(val: str) -> Tuple[Optional[datetime], str]:
    """
    解析日期，返回 (解析后的日期, 原始文本)
    如果解析失败，返回 (None, 原始文本)
    """
    raw = clean_string(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', ''):
        return None, raw
    
    try:
        # 尝试解析常见格式
        dt = date_parser.parse(raw, dayfirst=True)
        return dt, raw
    except:
        return None, raw


def parse_number(val: str) -> Tuple[Optional[float], str]:
    """
    解析数字，返回 (数值, 原始文本)
    处理带逗号的数字如 "2,131.5"
    """
    raw = clean_string(val)
    if not raw or raw.upper() in ('TBA', '-', 'N/A', ''):
        return None, raw
    
    try:
        # 移除逗号
        cleaned = raw.replace(',', '')
        # 尝试提取数字
        match = re.search(r'[\d.]+', cleaned)
        if match:
            return float(match.group()), raw
    except:
        pass
    
    return None, raw


def parse_reference_number(ref: str) -> Dict[str, Any]:
    """
    解析 Reference Number，如 CN2401006-A1
    返回：reference_month, monthly_sequence, serial_number, product_abbr
    """
    result = {
        'reference_month': '',
        'monthly_sequence': 0,
        'serial_number': 0,
        'product_abbr': ''
    }
    
    ref = clean_string(ref)
    if not ref:
        return result
    
    # 匹配格式: CN2401006-A1 或 CN2401006-ARS
    match = re.match(r'CN(\d{4})(\d+)-([A-Z]+)(\d*)$', ref)
    if match:
        result['reference_month'] = match.group(1)
        result['monthly_sequence'] = int(match.group(2))
        result['product_abbr'] = match.group(3)
        result['serial_number'] = int(match.group(4)) if match.group(4) else 0
    
    return result


def normalize_status(val: str) -> str:
    """规范化 Status"""
    val = clean_string(val).lower()
    mapping = {
        'new': 'New',
        'quoted': 'Quoted',
        'cancelled': 'Cancelled',
        'canceled': 'Cancelled'
    }
    return mapping.get(val, 'New')


def normalize_booking_confirmed(val: str) -> str:
    """规范化 Booking Confirmed"""
    val = clean_string(val).lower()
    mapping = {
        'yes': 'Yes',
        'rejected': 'Rejected',
        'pending': 'Pending',
        'invalid': 'Invalid'
    }
    return mapping.get(val, 'Pending')


def normalize_core_flag(val: str) -> Optional[str]:
    """规范化 CORE/NON_CORE"""
    val = normalize_upper(val)
    if 'NON' in val:
        return 'NON_CORE'
    elif 'CORE' in val:
        return 'CORE'
    return None


def normalize_category(val: str) -> str:
    """规范化 Category 为大写"""
    return normalize_upper(val)


def get_offer_type(cargo_type: str) -> str:
    """根据 cargo_type 获取 offer_type"""
    cargo = normalize_upper(cargo_type)
    if cargo == 'AIR':
        return 'AIR'
    elif cargo in ('FCL', 'LCL', 'SEA'):
        return 'OCEAN'
    else:
        return 'OTHER'


# ============================================================
# 数据库操作
# ============================================================

class DataImporter:
    def __init__(self):
        self.conn = None
        self.cursor = None
        
        # 缓存：用于存储主数据的 ID 映射
        self.country_cache = {}  # country_code/name -> id
        self.port_cache = {}     # port_code -> id
        self.sales_office_cache = {}  # name_norm -> id
        self.category_cache = {}  # name_norm -> code
        
        # 统计
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'countries_created': 0,
            'ports_created': 0,
            'sales_offices_created': 0,
            'offers_created': 0
        }
        
        # 错误日志
        self.errors = []
    
    def connect(self):
        """连接数据库"""
        self.conn = pymysql.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        print(f"✅ 已连接到数据库: {DB_CONFIG['database']}")
    
    def close(self):
        """关闭连接"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ 数据库连接已关闭")
    
    def load_caches(self):
        """加载主数据缓存"""
        # 加载国家
        self.cursor.execute("SELECT id, country_code, country_name_en FROM country")
        for row in self.cursor.fetchall():
            self.country_cache[row['country_code']] = row['id']
            self.country_cache[normalize_upper(row['country_name_en'])] = row['id']
        print(f"  加载 {len(self.country_cache)//2} 个国家")
        
        # 加载港口
        self.cursor.execute("SELECT id, port_code FROM port")
        for row in self.cursor.fetchall():
            self.port_cache[row['port_code']] = row['id']
        print(f"  加载 {len(self.port_cache)} 个港口")
        
        # 加载销售办公室
        self.cursor.execute("SELECT id, name_norm FROM dict_sales_office")
        for row in self.cursor.fetchall():
            self.sales_office_cache[row['name_norm']] = row['id']
        print(f"  加载 {len(self.sales_office_cache)} 个销售办公室")
        
        # 加载分类
        self.cursor.execute("SELECT code, name_norm FROM dict_category")
        for row in self.cursor.fetchall():
            self.category_cache[row['name_norm']] = row['code']
        print(f"  加载 {len(self.category_cache)} 个分类")
    
    def get_or_create_country(self, name: str) -> int:
        """获取或创建国家，返回 ID"""
        name_norm = normalize_upper(name)
        if not name_norm:
            # 返回默认国家
            name_norm = 'UNKNOWN'
        
        if name_norm in self.country_cache:
            return self.country_cache[name_norm]
        
        # 创建新国家
        # 生成简单的 code（取前两个字符或使用名称）
        code = name_norm[:2] if len(name_norm) >= 2 else name_norm
        # 确保 code 唯一
        base_code = code
        counter = 1
        while True:
            self.cursor.execute("SELECT id FROM country WHERE country_code = %s", (code,))
            if not self.cursor.fetchone():
                break
            code = f"{base_code}{counter}"
            counter += 1
        
        self.cursor.execute("""
            INSERT INTO country (country_code, country_name_en)
            VALUES (%s, %s)
        """, (code, name))
        
        country_id = self.cursor.lastrowid
        self.country_cache[name_norm] = country_id
        self.country_cache[code] = country_id
        self.stats['countries_created'] += 1
        
        return country_id
    
    def get_or_create_port(self, port_code: str, country_id: Optional[int] = None) -> int:
        """获取或创建港口，返回 ID"""
        port_code = clean_string(port_code)
        if not port_code:
            port_code = 'UNKNOWN'
        
        # 规范化 port_code：移除特殊字符，保留字母数字
        port_code_norm = re.sub(r'[^A-Za-z0-9]', '', port_code).upper()
        if not port_code_norm:
            port_code_norm = 'UNKNOWN'
        
        if port_code_norm in self.port_cache:
            return self.port_cache[port_code_norm]
        
        # 创建新港口
        self.cursor.execute("""
            INSERT INTO port (port_code, port_name, country_id)
            VALUES (%s, %s, %s)
        """, (port_code_norm, port_code, country_id))
        
        port_id = self.cursor.lastrowid
        self.port_cache[port_code_norm] = port_id
        self.stats['ports_created'] += 1
        
        return port_id
    
    def get_or_create_sales_office(self, name: str) -> int:
        """获取或创建销售办公室，返回 ID"""
        name = clean_string(name)
        if not name or name in ('-', 'TBA'):
            name = 'UNKNOWN'
        
        name_norm = normalize_upper(name)
        
        if name_norm in self.sales_office_cache:
            return self.sales_office_cache[name_norm]
        
        # 创建新销售办公室
        self.cursor.execute("""
            INSERT INTO dict_sales_office (name, name_norm)
            VALUES (%s, %s)
        """, (name, name_norm))
        
        office_id = self.cursor.lastrowid
        self.sales_office_cache[name_norm] = office_id
        self.stats['sales_offices_created'] += 1
        
        return office_id
    
    def get_category_code(self, name: str) -> Optional[str]:
        """获取分类代码"""
        name_norm = normalize_category(name)
        if not name_norm:
            return None
        
        if name_norm in self.category_cache:
            return self.category_cache[name_norm]
        
        # 尝试模糊匹配
        for cached_norm, code in self.category_cache.items():
            if name_norm in cached_norm or cached_norm in name_norm:
                return code
        
        return None
    
    def import_row(self, row: List[str], row_num: int) -> bool:
        """导入一行数据"""
        try:
            # 获取字段值
            def get_col(col_name: str) -> str:
                idx = COL[col_name]
                return row[idx] if idx < len(row) else ''
            
            # 1. 解析 Reference Number
            reference_number = clean_string(get_col('reference_number'))
            if not reference_number:
                self.errors.append(f"行 {row_num}: reference_number 为空")
                return False
            
            ref_parts = parse_reference_number(reference_number)
            
            # 2. 解析日期
            enquiry_date, _ = parse_date(get_col('enquiry_received_date'))
            issue_date, _ = parse_date(get_col('issue_date'))
            
            if not enquiry_date or not issue_date:
                self.errors.append(f"行 {row_num}: 日期解析失败")
                return False
            
            # 3. 获取/创建关联数据
            sales_country = get_col('sales_country')
            sales_country_id = self.get_or_create_country(sales_country)
            
            pod_country = get_col('pod_country')
            pod_country_id = self.get_or_create_country(pod_country) if pod_country else sales_country_id
            
            sales_office_id = self.get_or_create_sales_office(get_col('sales_office'))
            
            pol = get_col('pol')
            pol_id = self.get_or_create_port(pol)
            
            pod = get_col('pod')
            pod_id = self.get_or_create_port(pod, pod_country_id)
            
            # 4. 解析其他字段
            product_code = normalize_upper(get_col('product'))
            if not product_code:
                product_code = 'AIR'  # 默认值
            
            cargo_type_code = normalize_upper(get_col('cargo_type'))
            if not cargo_type_code:
                cargo_type_code = 'AIR'  # 默认值
            
            # 体积和数量
            volume_cbm, volume_raw = parse_number(get_col('volume_cbm'))
            quantity, quantity_raw = parse_number(get_col('quantity'))
            quantity_teu, quantity_teu_raw = parse_number(get_col('quantity_teu'))
            
            # 货好日期
            cargo_ready_date, cargo_ready_raw = parse_date(get_col('cargo_ready_date'))
            
            # 分类
            category_code = self.get_category_code(get_col('category'))
            
            # 5. 插入 enquiry 记录
            enquiry_sql = """
                INSERT INTO enquiry (
                    reference_number, enquiry_received_date, issue_date,
                    reference_month, monthly_sequence, serial_number,
                    product_code, product_abbr, status,
                    cn_pricing_admin, sales_country_id, sales_office_id, sales_pic,
                    assigned_cn_office_code, cargo_type_code,
                    volume_cbm, volume_raw_text, quantity, quantity_raw_text,
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
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            # 获取 assigned_cn_office_code（确保存在）
            assigned_cn = normalize_upper(get_col('assigned_cn_offices'))
            if assigned_cn not in ('SHANGHAI', 'SHENZHEN', 'NINGBO', 'HONG KONG', 
                                   'TIANJIN', 'QINGDAO', 'XIAMEN', 'CN-MULTI'):
                assigned_cn = 'SHANGHAI'  # 默认
            
            # quantity_uom
            quantity_unit = clean_string(get_col('quantity_unit'))
            quantity_uom_code = None
            if quantity_unit.upper() == 'KG':
                quantity_uom_code = 'KG'
            elif quantity_unit.upper() in ('PCS', 'PIECES'):
                quantity_uom_code = 'PCS'
            elif quantity_unit.upper() in ('CTN', 'CARTONS'):
                quantity_uom_code = 'CTN'
            
            enquiry_values = (
                reference_number,
                enquiry_date.strftime('%Y-%m-%d'),
                issue_date.strftime('%Y-%m-%d'),
                ref_parts['reference_month'] or issue_date.strftime('%y%m'),
                ref_parts['monthly_sequence'] or 1,
                ref_parts['serial_number'],
                product_code,
                ref_parts['product_abbr'] or product_code[0],
                normalize_status(get_col('status')),
                clean_string(get_col('cn_pricing_admin')) or 'System',
                sales_country_id,
                sales_office_id,
                clean_string(get_col('sales_pic')) or None,
                assigned_cn,
                cargo_type_code,
                volume_cbm,
                volume_raw if volume_cbm is None else None,
                quantity,
                quantity_raw if quantity is None else None,
                quantity_uom_code,
                quantity_unit if not quantity_uom_code else None,
                quantity_teu,
                quantity_teu_raw if quantity_teu is None else None,
                clean_string(get_col('commodity')) or None,
                clean_string(get_col('haz_special_equipment')) or None,
                pol_id,
                pod_id,
                pod_country_id,
                normalize_core_flag(get_col('core_non_core')),
                category_code,
                cargo_ready_date.strftime('%Y-%m-%d') if cargo_ready_date else None,
                cargo_ready_raw if not cargo_ready_date else None,
                clean_string(get_col('additional_requirement')) or None,
                normalize_booking_confirmed(get_col('booking_confirmed')),
                clean_string(get_col('remark')) or None,
                clean_string(get_col('rejected_reason')) or None,
                clean_string(get_col('actual_reason')) or None,
                get_offer_type(cargo_type_code)
            )
            
            self.cursor.execute(enquiry_sql, enquiry_values)
            enquiry_id = self.cursor.lastrowid
            
            # 6. 插入 offer 记录
            offer_type = get_offer_type(cargo_type_code)
            
            # 1st Offer
            first_sent_date, first_sent_raw = parse_date(get_col('first_quotation_sent'))
            first_offer_text = None
            
            if offer_type == 'OCEAN':
                first_offer_text = clean_string(get_col('first_offer_ocean'))
            elif offer_type == 'AIR':
                first_offer_text = clean_string(get_col('first_offer_air'))
            
            if first_offer_text and first_offer_text != '-':
                # 尝试解析价格
                price, _ = parse_number(first_offer_text)
                
                self.cursor.execute("""
                    INSERT INTO offer (enquiry_id, offer_type, sequence_no, is_latest,
                                       sent_date, sent_date_raw_text, price, price_text)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    enquiry_id, offer_type, 1, 1,
                    first_sent_date.strftime('%Y-%m-%d') if first_sent_date else None,
                    first_sent_raw if not first_sent_date else None,
                    price,
                    first_offer_text
                ))
                self.stats['offers_created'] += 1
                
                # Latest Offer (如果存在)
                latest_offer_text = None
                if offer_type == 'OCEAN':
                    latest_offer_text = clean_string(get_col('latest_offer_ocean'))
                elif offer_type == 'AIR':
                    latest_offer_text = clean_string(get_col('latest_offer_air'))
                
                if latest_offer_text and latest_offer_text != '-':
                    # 更新第一个 offer 的 is_latest
                    self.cursor.execute("""
                        UPDATE offer SET is_latest = 0 
                        WHERE enquiry_id = %s AND sequence_no = 1
                    """, (enquiry_id,))
                    
                    price, _ = parse_number(latest_offer_text)
                    self.cursor.execute("""
                        INSERT INTO offer (enquiry_id, offer_type, sequence_no, is_latest,
                                           price, price_text)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (enquiry_id, offer_type, 2, 1, price, latest_offer_text))
                    self.stats['offers_created'] += 1
            
            return True
            
        except Exception as e:
            self.errors.append(f"行 {row_num}: {str(e)}")
            return False
    
    def run(self):
        """运行导入"""
        print("=" * 60)
        print("LogiTrack Pro - CSV 数据导入")
        print("=" * 60)
        
        # 连接数据库
        self.connect()
        
        try:
            # 加载缓存
            print("\n📦 加载主数据缓存...")
            self.load_caches()
            
            # 读取 CSV
            print(f"\n📂 读取 CSV 文件: {CSV_FILE}")
            
            with open(CSV_FILE, 'r', encoding='latin-1') as f:
                reader = csv.reader(f)
                rows = list(reader)
            
            # 跳过前两行（描述行和表头行）
            data_rows = rows[2:]
            total = len(data_rows)
            print(f"   共 {total} 条数据记录")
            
            # 导入数据
            print("\n🚀 开始导入数据...")
            
            for i, row in enumerate(data_rows):
                self.stats['total'] += 1
                
                if self.import_row(row, i + 3):  # 行号从3开始（跳过前两行）
                    self.stats['success'] += 1
                else:
                    self.stats['failed'] += 1
                
                # 每 1000 条提交一次
                if (i + 1) % 1000 == 0:
                    self.conn.commit()
                    print(f"   已处理 {i + 1}/{total} 条 ({(i+1)*100//total}%)")
            
            # 最后提交
            self.conn.commit()
            
            # 打印统计
            print("\n" + "=" * 60)
            print("📊 导入统计")
            print("=" * 60)
            print(f"   总记录数:         {self.stats['total']}")
            print(f"   成功导入:         {self.stats['success']}")
            print(f"   导入失败:         {self.stats['failed']}")
            print(f"   新建国家:         {self.stats['countries_created']}")
            print(f"   新建港口:         {self.stats['ports_created']}")
            print(f"   新建销售办公室:   {self.stats['sales_offices_created']}")
            print(f"   创建报价记录:     {self.stats['offers_created']}")
            
            # 打印错误（最多显示 20 条）
            if self.errors:
                print(f"\n⚠️  错误信息 (共 {len(self.errors)} 条，显示前 20 条):")
                for err in self.errors[:20]:
                    print(f"   {err}")
            
            print("\n✅ 导入完成!")
            
        except Exception as e:
            print(f"\n❌ 导入失败: {e}")
            self.conn.rollback()
            raise
        
        finally:
            self.close()


if __name__ == '__main__':
    importer = DataImporter()
    importer.run()
