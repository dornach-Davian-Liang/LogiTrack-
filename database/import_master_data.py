#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LogiTrack Pro - 主数据导入脚本
导入以下数据：
  1. country.csv → country 表
  2. AirportCode.csv → port 表 (port_type='AIR')
  3. SeaportCode.csv → port 表 (port_type='SEA')
  4. SALES.csv → dict_sales_office + sales_pic 表

用法:
  python import_master_data.py

依赖:
  pip install pymysql
"""

import os
import re
import csv
import pymysql
from collections import defaultdict

# ============================================================
# 配置
# ============================================================

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'ldf123',
    'database': 'logitrack',
    'charset': 'utf8mb4',
    'autocommit': False
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CSV_FILES = {
    'country': os.path.join(BASE_DIR, 'country.csv'),
    'airport': os.path.join(BASE_DIR, 'AirportCode.csv'),
    'seaport': os.path.join(BASE_DIR, 'SeaportCode.csv'),
    'sales': os.path.join(BASE_DIR, 'SALES.csv'),
}

# SALES.csv 中的特殊国家代码映射（非标准ISO）
SALES_COUNTRY_MAP = {
    'AGENTS': 'AGENTS',
    'OTHERS': 'OTHERS',
    'TBA': 'TBA',
    'FRANCE': 'FR',
    'UK': 'GB',
    'GERMANY': 'DE',
    'BELGIUM': 'BE',
    'NETHERLANDS': 'NL',
    'SWITZERLAND': 'CH',
    'CHINA': 'CN',
    'SOUTH_AFRICA': 'ZA',
    'MOROCCO': 'MA',
    'USA': 'US',
    'GREECE': 'GR',
    'POLAND': 'PL',
}

# 用于生成 office code 的国家前缀
COUNTRY_PREFIX = {
    'AGENTS': 'AG',
    'OTHERS': 'OT',
    'TBA': 'TB',
    'FRANCE': 'FR',
    'UK': 'GB',
    'GERMANY': 'DE',
    'BELGIUM': 'BE',
    'NETHERLANDS': 'NL',
    'SWITZERLAND': 'CH',
    'CHINA': 'CN',
    'SOUTH_AFRICA': 'ZA',
    'MOROCCO': 'MA',
    'USA': 'US',
    'GREECE': 'GR',
    'POLAND': 'PL',
}


class MasterDataImporter:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.stats = defaultdict(int)
        self.errors = []

        # 缓存
        self.country_codes = set()  # 已导入的国家代码
        self.port_codes = {}  # (port_code, port_type) → id
        self.office_codes = {}  # office_code → id
        self.office_name_to_id = {}  # name_norm → id
        self.pic_cache = {}  # (country_code, name_norm) → id

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

    def normalize(self, s):
        """规范化字符串：去首尾空格、转大写、多空格归一"""
        if not s:
            return ''
        s = str(s).strip().upper()
        s = re.sub(r'\s+', ' ', s)
        return s

    def generate_office_code(self, country, office_name, existing_codes):
        """
        生成销售办公室代码
        格式: {CountryPrefix}-{OfficeAbbr}
        如果重复，追加序号
        """
        prefix = COUNTRY_PREFIX.get(country, country[:2] if country else 'XX')

        # 生成办公室缩写（取首字母或前几个单词首字母）
        words = office_name.split()
        if len(words) == 1:
            abbr = words[0][:8].upper()
        else:
            # 取前3个单词的首字母
            abbr = ''.join(w[0] for w in words[:4]).upper()
            if len(abbr) < 2:
                abbr = words[0][:4].upper()

        base_code = f"{prefix}-{abbr}"
        code = base_code

        # 检查重复
        counter = 1
        while code in existing_codes:
            counter += 1
            code = f"{base_code}{counter}"

        return code

    # ============================================================
    # 1. 导入国家数据
    # ============================================================

    def import_countries(self):
        """从 country.csv 导入国家数据"""
        print("\n" + "=" * 60)
        print("📦 导入国家数据")
        print("=" * 60)

        filepath = CSV_FILES['country']
        if not os.path.exists(filepath):
            print(f"❌ 文件不存在: {filepath}")
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                code = row.get('Code', '').strip()
                name_en = row.get('Country', '').strip()
                name_cn = row.get('Country (Chinese)', '').strip()

                if not code or not name_en:
                    continue

                # 清理可能的引号
                code = code.replace('"', '').strip()
                name_en = name_en.replace('"', '').strip()

                if len(code) > 2:
                    # 跳过异常数据
                    continue

                try:
                    self.cursor.execute("""
                        INSERT INTO country (country_code, country_name_en, country_name_cn)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            country_name_en = VALUES(country_name_en),
                            country_name_cn = VALUES(country_name_cn)
                    """, (code, name_en, name_cn or None))
                    self.country_codes.add(code)
                    self.stats['countries'] += 1
                except Exception as e:
                    self.errors.append(f"国家 {code}: {e}")

        self.conn.commit()
        print(f"   导入 {self.stats['countries']} 个国家")

    # ============================================================
    # 2. 导入机场数据
    # ============================================================

    def import_airports(self):
        """从 AirportCode.csv 导入机场数据"""
        print("\n" + "=" * 60)
        print("✈️  导入机场数据")
        print("=" * 60)

        filepath = CSV_FILES['airport']
        if not os.path.exists(filepath):
            print(f"❌ 文件不存在: {filepath}")
            return

        # 国家名称到代码的映射
        country_name_to_code = {}
        self.cursor.execute("SELECT country_code, country_name_en FROM country")
        for row in self.cursor.fetchall():
            country_name_to_code[row[1].upper()] = row[0]

        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                country_name = row.get('Country', '').strip().replace('"', '').strip()
                city = row.get('City', '').strip()
                iata_code = row.get('IATA Code', '').strip()

                if not iata_code:
                    continue

                # 查找国家代码
                country_code = country_name_to_code.get(country_name.upper())

                port_name = f"{city} ({iata_code})" if city else iata_code

                try:
                    self.cursor.execute("""
                        INSERT INTO port (port_code, port_name, port_type, country_code, city)
                        VALUES (%s, %s, 'AIR', %s, %s)
                        ON DUPLICATE KEY UPDATE
                            port_name = VALUES(port_name),
                            country_code = VALUES(country_code),
                            city = VALUES(city)
                    """, (iata_code, port_name, country_code, city or None))
                    self.stats['airports'] += 1
                except Exception as e:
                    self.errors.append(f"机场 {iata_code}: {e}")

        self.conn.commit()
        print(f"   导入 {self.stats['airports']} 个机场")

    # ============================================================
    # 3. 导入海港数据
    # ============================================================

    def import_seaports(self):
        """从 SeaportCode.csv 导入海港数据（去重）"""
        print("\n" + "=" * 60)
        print("🚢 导入海港数据")
        print("=" * 60)

        filepath = CSV_FILES['seaport']
        if not os.path.exists(filepath):
            print(f"❌ 文件不存在: {filepath}")
            return

        # 先读取所有数据并去重
        unique_ports = {}  # port_code → (name, country_code)

        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                port_code = row.get('COD_SEAPORT', '').strip()
                port_name = row.get('NOM', '').strip()
                country_code = row.get('country code', '').strip()

                if not port_code:
                    continue

                # 只保留第一次出现的记录
                if port_code not in unique_ports:
                    # 验证国家代码长度
                    if len(country_code) > 2:
                        country_code = country_code[:2]
                    unique_ports[port_code] = (port_name, country_code)

        print(f"   发现 {len(unique_ports)} 个唯一海港代码")

        # 批量插入
        batch_size = 1000
        batch = []
        inserted = 0

        for port_code, (port_name, country_code) in unique_ports.items():
            # 检查国家是否存在
            if country_code and country_code not in self.country_codes:
                country_code = None

            batch.append((port_code, port_name, country_code))

            if len(batch) >= batch_size:
                self._insert_ports_batch(batch, 'SEA')
                inserted += len(batch)
                batch = []
                print(f"   已处理 {inserted}/{len(unique_ports)} 个海港...")

        # 处理剩余
        if batch:
            self._insert_ports_batch(batch, 'SEA')
            inserted += len(batch)

        self.conn.commit()
        self.stats['seaports'] = inserted
        print(f"   导入 {inserted} 个海港")

    def _insert_ports_batch(self, batch, port_type):
        """批量插入港口数据"""
        for port_code, port_name, country_code in batch:
            try:
                self.cursor.execute("""
                    INSERT INTO port (port_code, port_name, port_type, country_code)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        port_name = VALUES(port_name),
                        country_code = VALUES(country_code)
                """, (port_code, port_name, port_type, country_code))
            except Exception as e:
                self.errors.append(f"港口 {port_code}: {e}")

    # ============================================================
    # 4. 导入销售数据（Office + PIC）
    # ============================================================

    def import_sales(self):
        """从 SALES.csv 导入销售办公室和销售负责人"""
        print("\n" + "=" * 60)
        print("👥 导入销售数据")
        print("=" * 60)

        filepath = CSV_FILES['sales']
        if not os.path.exists(filepath):
            print(f"❌ 文件不存在: {filepath}")
            return

        # 第一遍：收集所有办公室
        offices = {}  # name_norm → (country, original_name)
        pics = []  # [(country, office_name, pic_name), ...]

        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')

            for row in reader:
                country = row.get('SALESCOUNTRY', '').strip()
                office = row.get('SALESOFFICE', '').strip()
                pic = row.get('SALESPIC', '').strip()

                if not office or office in ['-', 'TBA']:
                    continue

                office_norm = self.normalize(office)

                if office_norm and office_norm not in offices:
                    offices[office_norm] = (country, office)

                if pic and pic not in ['-', 'TBA']:
                    pics.append((country, office, pic))

        print(f"   发现 {len(offices)} 个唯一办公室")
        print(f"   发现 {len(pics)} 条销售人员记录")

        # 生成 office codes
        existing_codes = set()
        office_data = []  # [(code, name, name_norm, country_code), ...]

        for name_norm, (country, original_name) in offices.items():
            code = self.generate_office_code(country, original_name, existing_codes)
            existing_codes.add(code)

            # 获取国家代码（用于关联）
            country_code = SALES_COUNTRY_MAP.get(country, country)

            office_data.append((code, original_name, name_norm, country_code))

        # 插入办公室
        for code, name, name_norm, country_code in office_data:
            try:
                self.cursor.execute("""
                    INSERT INTO dict_sales_office (code, name, name_norm, country_code)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        code = VALUES(code),
                        name = VALUES(name),
                        country_code = VALUES(country_code)
                """, (code, name, name_norm, country_code))
                self.stats['offices'] += 1
            except Exception as e:
                self.errors.append(f"办公室 {name}: {e}")

        self.conn.commit()

        # 加载办公室 ID 缓存
        self.cursor.execute("SELECT id, name_norm FROM dict_sales_office")
        for row in self.cursor.fetchall():
            self.office_name_to_id[row[1]] = row[0]

        # 插入销售人员
        pic_seen = set()  # (country_code, name_norm) → 去重

        for country, office, pic in pics:
            country_code = SALES_COUNTRY_MAP.get(country, country)
            office_norm = self.normalize(office)
            pic_norm = self.normalize(pic)

            key = (country_code, pic_norm)
            if key in pic_seen:
                continue
            pic_seen.add(key)

            office_id = self.office_name_to_id.get(office_norm)
            if not office_id:
                continue

            try:
                self.cursor.execute("""
                    INSERT INTO sales_pic (name, name_norm, country_code, sales_office_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        sales_office_id = VALUES(sales_office_id)
                """, (pic, pic_norm, country_code, office_id))
                self.stats['pics'] += 1
            except Exception as e:
                self.errors.append(f"销售人员 {pic}: {e}")

        self.conn.commit()
        print(f"   导入 {self.stats['offices']} 个办公室")
        print(f"   导入 {self.stats['pics']} 个销售人员")

    # ============================================================
    # 运行
    # ============================================================

    def run(self):
        """执行完整导入"""
        print("=" * 60)
        print("LogiTrack Pro - 主数据导入")
        print("=" * 60)

        try:
            self.connect()

            # 按顺序导入
            self.import_countries()
            self.import_airports()
            self.import_seaports()
            self.import_sales()

            # 打印统计
            print("\n" + "=" * 60)
            print("📊 导入统计")
            print("=" * 60)
            print(f"   国家:       {self.stats['countries']}")
            print(f"   机场:       {self.stats['airports']}")
            print(f"   海港:       {self.stats['seaports']}")
            print(f"   销售办公室: {self.stats['offices']}")
            print(f"   销售人员:   {self.stats['pics']}")

            if self.errors:
                print(f"\n⚠️  错误信息 (共 {len(self.errors)} 条，显示前 20 条):")
                for err in self.errors[:20]:
                    print(f"   {err}")

            print("\n✅ 主数据导入完成!")

        finally:
            self.close()


if __name__ == '__main__':
    importer = MasterDataImporter()
    importer.run()
