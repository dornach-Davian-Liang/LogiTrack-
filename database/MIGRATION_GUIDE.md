# MySQL 数据库迁移指南

## 📋 迁移步骤

### 1️⃣ 准备 MySQL 环境

确保本地 MySQL 服务正在运行：
```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 如果未运行，启动 MySQL
sudo systemctl start mysql
```

### 2️⃣ 创建数据库和表

```bash
# 方式一：使用 SQL 脚本创建（推荐）
mysql -u root -p123456 < database/schema.sql

# 方式二：手动创建
mysql -u root -p123456
CREATE DATABASE IF NOT EXISTS logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logitrack;
SOURCE database/schema.sql;
```

### 3️⃣ 导入 CSV 数据

```bash
# 使用 Python 脚本导入
cd database
pip install pandas mysql-connector-python
python import_csv.py

# 或使用 MySQL LOAD DATA（需要 FILE 权限）
mysql -u root -p123456 logitrack < database/import_data.sql
```

### 4️⃣ 验证数据

```bash
# 检查表结构
mysql -u root -p123456 logitrack -e "DESCRIBE enquiry_records;"

# 检查数据条数
mysql -u root -p123456 logitrack -e "SELECT COUNT(*) FROM enquiry_records;"

# 查看前 5 条记录
mysql -u root -p123456 logitrack -e "SELECT reference_number, status, product FROM enquiry_records LIMIT 5;"
```

### 5️⃣ 测试 MySQL 连接

```bash
cd backend
./test-mysql-connection.sh
```

### 6️⃣ 启动后端服务

```bash
cd backend
./start-backend.sh
```

---

## 🔧 配置说明

### MySQL 连接信息
- **主机**: localhost
- **端口**: 3306
- **数据库**: logitrack
- **用户名**: root
- **密码**: 123456

### 修改连接信息
如需修改数据库连接，编辑 `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=root
spring.datasource.password=123456
```

---

## 📊 数据表结构

### enquiry_records 表

包含 33 个字段，完全匹配 CSV 文件结构：

**日期字段**:
- enquiry_received_date
- issue_date
- cargo_ready_date
- first_quotation_sent

**基本信息**:
- reference_number (主键索引)
- product
- status

**人员信息**:
- cn_pricing_admin
- sales_country
- sales_office
- sales_pic
- assigned_cn_offices

**货物信息**:
- cargo_type
- volume_cbm
- quantity
- quantity_unit
- quantity_teu
- commodity
- haz_special_equipment

**路线信息**:
- pol (起运港)
- pod (目的港)
- pod_country

**业务分类**:
- core_non_core
- category

**报价信息**:
- first_offer_ocean_frg
- first_offer_air_frg_kg
- latest_offer_ocean_frg
- latest_offer_air_frg_kg

**状态信息**:
- booking_confirmed
- rejected_reason
- actual_reason

**需求备注**:
- additional_requirement
- remark

**时间戳**:
- created_at
- updated_at

---

## 🔍 常见问题

### Q1: MySQL 连接失败？
**A**: 检查：
1. MySQL 服务是否运行: `sudo systemctl status mysql`
2. 用户名密码是否正确
3. 防火墙是否开放 3306 端口: `sudo ufw allow 3306`

### Q2: 表创建失败？
**A**: 
1. 确保 logitrack 数据库已创建
2. 检查 SQL 文件语法
3. 查看 MySQL 错误日志: `sudo tail -f /var/log/mysql/error.log`

### Q3: CSV 导入失败？
**A**:
1. 检查 CSV 文件编码（应为 UTF-8）
2. 确保日期格式正确（DD-Mon-YY，如 2-Jan-24）
3. 检查数值字段中的逗号分隔符

### Q4: Spring Boot 启动报错？
**A**:
1. 确认 MySQL 驱动已添加到 pom.xml
2. 验证 application.properties 配置正确
3. 检查 MySQL 用户权限: `GRANT ALL ON logitrack.* TO 'root'@'localhost';`

### Q5: 数据查询为空？
**A**:
1. 确认 CSV 已成功导入
2. 检查表名是否正确（enquiry_records）
3. 验证数据: `SELECT * FROM enquiry_records LIMIT 1;`

---

## 📝 数据维护

### 备份数据
```bash
# 备份整个数据库
mysqldump -u root -p123456 logitrack > backup_$(date +%Y%m%d).sql

# 仅备份数据（不含表结构）
mysqldump -u root -p123456 --no-create-info logitrack enquiry_records > data_backup.sql
```

### 恢复数据
```bash
mysql -u root -p123456 logitrack < backup_20241124.sql
```

### 清空数据
```bash
mysql -u root -p123456 logitrack -e "TRUNCATE TABLE enquiry_records;"
```

---

## 🚀 性能优化建议

1. **添加索引** - 已在 schema.sql 中包含常用字段索引
2. **开启慢查询日志** - 监控性能瓶颈
3. **调整连接池** - 在 application.properties 中配置 HikariCP
4. **定期维护** - 运行 `OPTIMIZE TABLE enquiry_records;`

---

## ✅ 迁移检查清单

- [ ] MySQL 服务运行正常
- [ ] logitrack 数据库已创建
- [ ] enquiry_records 表已创建
- [ ] CSV 数据已导入
- [ ] 索引已创建
- [ ] 后端配置已更新
- [ ] 连接测试通过
- [ ] 后端服务启动成功
- [ ] API 测试通过
- [ ] 前端可以正常访问数据

---

**迁移完成后，系统将使用 MySQL 持久化存储，数据不会因重启而丢失！**
