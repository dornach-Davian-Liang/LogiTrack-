# 🚀 LogiTrack Pro - MySQL 版本部署文档

## 📦 系统要求

### 软件环境
- ☕ Java 17 或更高版本
- 📦 Maven 3.6+
- 🐬 MySQL 8.0+
- 📦 Node.js 16+
- 🔧 npm 或 yarn

### 硬件建议
- 💾 内存: 最低 2GB，推荐 4GB+
- 💿 磁盘: 最低 5GB 可用空间
- 🖥️ CPU: 双核及以上

---

## 🎯 快速部署

### 方式一：自动化脚本（推荐）

```bash
# 1. 克隆项目
cd /workspaces/LogiTrack-

# 2. 创建数据库和导入数据
./database/setup-mysql.sh

# 3. 启动后端
cd backend && ./start-backend.sh

# 4. 启动前端（新终端）
cd logitrack-pro && npm install && npm run dev
```

### 方式二：手动部署

#### 步骤 1: 安装 MySQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 步骤 2: 创建数据库
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'logitrack_user'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON logitrack.* TO 'logitrack_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
exit;
```

#### 步骤 3: 执行建表脚本
```bash
mysql -u root -p123456 logitrack < database/schema.sql
```

#### 步骤 4: 导入 CSV 数据
```bash
cd database
pip install pandas mysql-connector-python
python import_csv.py
```

#### 步骤 5: 配置后端
编辑 `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=123456
spring.jpa.hibernate.ddl-auto=update
```

#### 步骤 6: 构建并启动后端
```bash
cd backend
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

#### 步骤 7: 启动前端
```bash
cd logitrack-pro
npm install
npm run dev
```

---

## 🔍 验证部署

### 1. 检查 MySQL
```bash
# 测试连接
mysql -u root -p123456 -e "SELECT COUNT(*) FROM logitrack.enquiry_records;"

# 应该显示记录数（如 5 条）
```

### 2. 测试后端 API
```bash
# 健康检查
curl http://localhost:8080/api/enquiries

# 应该返回 JSON 数组
```

### 3. 访问前端
浏览器打开: http://localhost:3000

---

## 📂 项目结构

```
LogiTrack-/
├── backend/                      # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/.../
│   │       │   ├── entity/       # JPA 实体
│   │       │   ├── repository/   # 数据访问层
│   │       │   ├── service/      # 业务逻辑层
│   │       │   ├── controller/   # REST API
│   │       │   └── config/       # 配置类
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml
│   ├── start-backend.sh         # 启动脚本
│   └── test-mysql-connection.sh # MySQL 测试脚本
│
├── database/                     # 数据库脚本
│   ├── schema.sql               # 建表脚本
│   ├── import_csv.py            # CSV 导入脚本
│   ├── setup-mysql.sh           # 自动化部署脚本
│   └── MIGRATION_GUIDE.md       # 迁移指南
│
├── logitrack-pro/               # React 前端
│   ├── components/              # React 组件
│   ├── services/                # API 服务
│   ├── package.json
│   └── vite.config.ts
│
├── Test.csv                     # 原始数据文件
├── README.md                    # 项目说明
└── QUICKSTART.md               # 快速开始
```

---

## 🔧 配置详解

### MySQL 配置

**database/schema.sql**
- 表结构定义
- 索引创建
- 完全匹配 CSV 字段

**连接参数**:
```
主机: localhost
端口: 3306
数据库: logitrack
用户: root
密码: 123456
```

### Spring Boot 配置

**application.properties 核心配置**:
```properties
# 数据源
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect

# 服务器
server.port=8080

# 连接池
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
```

### 前端配置

**dataService.ts**:
```typescript
const API_BASE_URL = 'http://localhost:8080/api/enquiries';
const USE_MOCK_DATA = false; // 使用真实 API
```

**vite.config.ts**:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

---

## 🐛 故障排除

### 问题 1: 后端启动失败 - 连接被拒绝

**症状**:
```
Communications link failure
The last packet sent successfully to the server was 0 milliseconds ago
```

**解决方案**:
1. 检查 MySQL 是否运行: `sudo systemctl status mysql`
2. 测试连接: `mysql -u root -p123456 -e "SELECT 1"`
3. 检查端口: `sudo netstat -tlnp | grep 3306`
4. 检查防火墙: `sudo ufw allow 3306`

### 问题 2: 表不存在

**症状**:
```
Table 'logitrack.enquiry_records' doesn't exist
```

**解决方案**:
```bash
# 重新创建表
mysql -u root -p123456 logitrack < database/schema.sql

# 验证
mysql -u root -p123456 logitrack -e "SHOW TABLES;"
```

### 问题 3: CSV 导入失败

**症状**:
```
Date format error
Data truncated
```

**解决方案**:
1. 检查 CSV 编码: `file -i Test.csv` (应为 UTF-8)
2. 检查日期格式: 应为 "2-Jan-24" 格式
3. 使用 Python 脚本: `python database/import_csv.py`

### 问题 4: CORS 错误

**症状**:
```
Access to fetch at 'http://localhost:8080/api/enquiries' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决方案**:
检查 `WebConfig.java` 中的 CORS 配置:
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000", "http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowCredentials(true);
}
```

### 问题 5: 前端白屏

**症状**: 浏览器显示空白页面

**解决方案**:
1. 查看浏览器控制台错误
2. 检查后端是否运行: `curl http://localhost:8080/api/enquiries`
3. 检查 dataService.ts 中 `USE_MOCK_DATA = false`
4. 清除浏览器缓存并刷新

---

## 📊 监控和日志

### 后端日志
```bash
# 实时查看日志
tail -f /tmp/backend.log

# 搜索错误
grep ERROR /tmp/backend.log

# 查看启动日志
cat nohup.out
```

### MySQL 日志
```bash
# 错误日志
sudo tail -f /var/log/mysql/error.log

# 慢查询日志（如已启用）
sudo tail -f /var/log/mysql/slow-query.log
```

### 前端日志
```bash
# 开发服务器日志
tail -f /tmp/frontend.log
```

---

## 🔒 安全建议

### 生产环境配置

1. **修改默认密码**
```bash
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '强密码';
```

2. **创建专用数据库用户**
```sql
CREATE USER 'logitrack_user'@'localhost' IDENTIFIED BY '强密码';
GRANT SELECT, INSERT, UPDATE, DELETE ON logitrack.* TO 'logitrack_user'@'localhost';
```

3. **启用 SSL 连接**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack?useSSL=true
```

4. **配置文件加密**
使用 Spring Cloud Config 或 Jasypt 加密敏感信息

5. **限制远程访问**
```bash
# MySQL 配置文件
bind-address = 127.0.0.1
```

---

## 🚀 性能优化

### MySQL 优化

1. **调整缓冲池大小**
```ini
# /etc/mysql/my.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
```

2. **启用查询缓存**
```ini
query_cache_type = 1
query_cache_size = 64M
```

3. **定期优化表**
```bash
mysql -u root -p123456 logitrack -e "OPTIMIZE TABLE enquiry_records;"
```

### Spring Boot 优化

1. **调整连接池**
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=30000
```

2. **启用 JPA 查询缓存**
```properties
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
```

3. **配置 JVM 参数**
```bash
java -Xms512m -Xmx2g -jar backend-0.0.1-SNAPSHOT.jar
```

---

## 📈 扩展建议

### 1. 数据备份自动化
```bash
# 创建定时任务
crontab -e

# 每天凌晨 2 点备份
0 2 * * * mysqldump -u root -p123456 logitrack > /backup/logitrack_$(date +\%Y\%m\%d).sql
```

### 2. 读写分离
配置 MySQL 主从复制，使用 Spring Boot 多数据源

### 3. 缓存层
集成 Redis 缓存热点数据

### 4. API 文档
添加 Swagger/OpenAPI 文档

### 5. 监控告警
集成 Prometheus + Grafana

---

## ✅ 部署检查清单

**MySQL 环境**:
- [ ] MySQL 服务运行
- [ ] logitrack 数据库创建
- [ ] enquiry_records 表创建
- [ ] 索引创建完成
- [ ] CSV 数据导入成功
- [ ] 数据验证通过

**后端服务**:
- [ ] Java/Maven 环境正常
- [ ] application.properties 配置正确
- [ ] Maven 构建成功
- [ ] Spring Boot 启动成功
- [ ] API 端点响应正常

**前端服务**:
- [ ] Node.js 环境正常
- [ ] 依赖安装完成
- [ ] Vite 开发服务器启动
- [ ] 页面加载正常
- [ ] API 调用成功

**功能测试**:
- [ ] 登录功能
- [ ] 数据列表显示
- [ ] 创建记录
- [ ] 编辑记录
- [ ] 删除记录
- [ ] 搜索功能
- [ ] 统计数据显示

---

## 📞 获取帮助

遇到问题？
1. 查看 `database/MIGRATION_GUIDE.md` 详细迁移指南
2. 运行 `./backend/test-mysql-connection.sh` 测试连接
3. 检查日志文件排查错误
4. 参考本文档故障排除章节

---

**部署成功后，访问 http://localhost:3000 开始使用！** 🎉
