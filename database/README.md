# LogiTrack 数据库使用指南

## 📦 环境要求

- Docker
- Python 3.x
- MySQL 客户端（可选）

## 🚀 快速开始

### 1. 启动 MySQL 数据库

```bash
cd /workspaces/LogiTrack-/database
./start-mysql-docker.sh
```

说明：
- 默认会复用已存在的 `logitrack-mysql` 容器与数据卷（不会清空数据）。
- 如需“重置并清空数据库”，使用：

```bash
./start-mysql-docker.sh --reset
```

数据库连接信息：
- Host: localhost
- Port: 3306
- User: root
- Password: ldf123
- Database: logitrack

### 1.1 启动 Adminer（可视化界面）

> Adminer 是一个轻量的数据库管理页面，用于浏览 `enquiry/offer/port/country` 等表。

```bash
cd /workspaces/LogiTrack-/database
chmod +x start-adminer.sh
./start-adminer.sh
```

访问地址：
- 本机（Docker 所在机器）: http://localhost:8080
- Codespaces/远程 VS Code：需要在 VS Code 的 **Ports** 面板转发 `8080`，再用生成的 `https://<id>-8080.app.github.dev` 访问。

推荐登录信息：
- Server: db
- User: adminer
- Password: ldf123
- Database: logitrack

### 2. 创建表结构

```bash
docker exec -i logitrack-mysql mysql -uroot -pldf123 < schema.sql
```

### 3. 导入数据

```bash
# 安装 Python 依赖
pip install pymysql python-dateutil

# 运行导入脚本
python3 import_enquiry_data.py
```

导入完成后会自动创建：
- 14,039 条询价记录
- 13,172 条报价记录
- 206 个国家
- 1,269 个港口
- 195 个销售办公室

## 📊 数据查询

### 使用快速查询工具

```bash
# 基本统计
./query.sh stats

# 按状态统计
./query.sh status

# 最近10条询价
./query.sh recent

# 搜索询价
./query.sh search CN2401

# 查询报价
./query.sh offers CN2401006-A

# 完整验证
./query.sh verify

# 备份数据库
./query.sh backup
```

### 直接使用 MySQL

```bash
# 进入 MySQL 命令行
docker exec -it logitrack-mysql mysql -uroot -pldf123 logitrack

# 或执行 SQL 文件
docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack < your_query.sql
```

## 📋 常用查询示例

### 查询询价记录

```sql
-- 按Reference Number查询
SELECT * FROM enquiry WHERE reference_number = 'CN2401006-A';

-- 按日期范围查询
SELECT * FROM enquiry 
WHERE issue_date BETWEEN '2024-01-01' AND '2024-12-31';

-- 按状态查询
SELECT * FROM enquiry WHERE status = 'Quoted';

-- 带关联信息的查询
SELECT 
    e.reference_number,
    e.product_code,
    e.status,
    c.country_name_en as sales_country,
    so.name as sales_office,
    pol.port_name as pol,
    pod.port_name as pod
FROM enquiry e
LEFT JOIN country c ON e.sales_country_id = c.id
LEFT JOIN dict_sales_office so ON e.sales_office_id = so.id
LEFT JOIN port pol ON e.pol_id = pol.id
LEFT JOIN port pod ON e.pod_id = pod.id
WHERE e.reference_number LIKE 'CN2401%'
LIMIT 10;
```

### 查询报价记录

```sql
-- 查询某询价的所有报价
SELECT o.* 
FROM offer o
JOIN enquiry e ON o.enquiry_id = e.id
WHERE e.reference_number = 'CN2401006-A';

-- 查询最新报价
SELECT * FROM offer WHERE is_latest = 1;

-- 统计报价情况
SELECT 
    offer_type,
    COUNT(*) as total_offers,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM offer
WHERE price IS NOT NULL
GROUP BY offer_type;
```

### 统计查询

```sql
-- 按月统计询价量
SELECT 
    reference_month,
    COUNT(*) as count
FROM enquiry
GROUP BY reference_month
ORDER BY reference_month DESC;

-- 按产品统计
SELECT 
    product_code,
    COUNT(*) as count,
    ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM enquiry), 2) as percentage
FROM enquiry
GROUP BY product_code
ORDER BY count DESC;

-- 转化率统计
SELECT 
    COUNT(*) as total_enquiries,
    SUM(CASE WHEN booking_confirmed = 'Yes' THEN 1 ELSE 0 END) as confirmed,
    ROUND(SUM(CASE WHEN booking_confirmed = 'Yes' THEN 1 ELSE 0 END)*100.0/COUNT(*), 2) as conversion_rate
FROM enquiry;
```

## 🗂️ 数据库表结构

### 主要表

| 表名 | 说明 | 记录数 |
|------|------|--------|
| enquiry | 询价主表 | 14,039 |
| offer | 报价子表 | 13,172 |
| country | 国家表 | 206 |
| port | 港口表 | 1,269 |
| dict_sales_office | 销售办公室 | 195 |
| dict_cn_office | CN办公室字典 | 8 |
| dict_cargo_type | 运输类型字典 | 5 |
| dict_product | 产品字典 | 7 |
| dict_category | 分类字典 | 8 |
| dict_uom | 单位字典 | 5 |
| container_types | 箱型配置 | 11 |
| enquiry_container_line | 箱型明细 | 0 |

### ER 关系

```
country 1 --- n enquiry (sales_country)
country 1 --- n enquiry (pod_country)
country 1 --- n port

port 1 --- n enquiry (POL)
port 1 --- n enquiry (POD)

dict_sales_office 1 --- n enquiry

enquiry 1 --- n offer
enquiry 1 --- n enquiry_container_line

container_types 1 --- n enquiry_container_line
```

## 🔧 数据库管理

### 备份数据库

```bash
# 备份整个数据库
docker exec logitrack-mysql mysqldump -uroot -pldf123 logitrack > backup.sql

# 只备份表结构
docker exec logitrack-mysql mysqldump -uroot -pldf123 --no-data logitrack > schema_only.sql

# 只备份数据
docker exec logitrack-mysql mysqldump -uroot -pldf123 --no-create-info logitrack > data_only.sql
```

## 🧯 常见问题排查（Adminer / Codespaces）

### 1) 页面提示“当前无法使用此页面” / `...app.github.dev` 打不开

这通常不是 Adminer 程序报错，而是“端口不可达”：
- 容器已退出（MySQL/Adminer 不在运行）
- Codespaces 端口没有转发或不可见（Private/未打开）

快速自检：

```bash
docker ps -a | grep -E 'adminer|logitrack-mysql' || true
curl -I http://127.0.0.1:8080 || true
```

恢复：

```bash
cd /workspaces/LogiTrack-/database
./start-mysql-docker.sh
./start-adminer.sh
```

### 2) 登录报错：`php_network_getaddresses: getaddrinfo for db failed`

原因：Adminer 容器里解析不到 `db` 这个主机名（MySQL 与 Adminer 不在同一 Docker 网络，或未设置别名）。

解决：直接运行：

```bash
cd /workspaces/LogiTrack-/database
./start-adminer.sh
```

### 3) 登录报错：`Access denied for user ...`

原因通常是账号/密码不匹配，或用 `root` 在某些 Host 策略下被拒绝。

推荐用专用账号（已在容器内创建）：
- User: adminer
- Password: ldf123

如果需要手动重建该账号：

```bash
docker exec -i logitrack-mysql mysql -uroot -pldf123 -e "CREATE USER IF NOT EXISTS 'adminer'@'%' IDENTIFIED BY 'ldf123'; GRANT ALL PRIVILEGES ON logitrack.* TO 'adminer'@'%'; FLUSH PRIVILEGES;"
```

### 恢复数据库

```bash
# 恢复数据库
docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack < backup.sql
```

### 查看日志

```bash
# 查看 MySQL 日志
docker logs logitrack-mysql

# 实时查看日志
docker logs -f logitrack-mysql
```

### 停止/启动容器

```bash
# 停止容器
docker stop logitrack-mysql

# 启动容器
docker start logitrack-mysql

# 重启容器
docker restart logitrack-mysql

# 删除容器
docker rm logitrack-mysql
```

## 📝 重要文件

| 文件 | 说明 |
|------|------|
| `schema.sql` | 数据库表结构定义 |
| `import_enquiry_data.py` | CSV 数据导入脚本 |
| `verify_import.sql` | 数据验证查询 |
| `query.sh` | 快速查询工具 |
| `IMPORT_REPORT.md` | 导入完成报告 |
| `start-mysql-docker.sh` | MySQL 启动脚本 |

## ⚠️ 注意事项

1. **端口占用**: 确保 3306 端口未被占用
2. **数据持久化**: 数据存储在 Docker volume 中，删除容器不会丢失数据
3. **字符编码**: 使用 utf8mb4，支持所有 Unicode 字符
4. **时区**: 容器默认使用 UTC 时区
5. **性能优化**: 大量数据查询时建议添加索引

## 🐛 常见问题

### 1. 容器启动失败

```bash
# 检查端口占用
lsof -i :3306

# 删除旧容器重新启动
docker rm -f logitrack-mysql
./start-mysql-docker.sh
```

### 2. 导入数据失败

```bash
# 检查连接
docker exec -i logitrack-mysql mysql -uroot -pldf123 -e "SELECT 1"

# 检查表是否存在
docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack -e "SHOW TABLES"
```

### 3. 查询性能慢

```sql
-- 添加索引
CREATE INDEX idx_custom ON enquiry(your_column);

-- 分析查询
EXPLAIN SELECT ...;

-- 查看慢查询
SHOW PROCESSLIST;
```

## 📚 相关文档

- [数据库设计文档](../enquiry_mysql_design_spec.md)
- [导入完成报告](IMPORT_REPORT.md)
- [项目 README](../README.md)

## 🤝 支持

如有问题，请参考：
1. 查看日志: `docker logs logitrack-mysql`
2. 运行验证: `./query.sh verify`
3. 检查报告: `cat IMPORT_REPORT.md`
