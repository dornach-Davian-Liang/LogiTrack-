# 🚀 LogiTrack 生产环境完整部署指南

> **从零到上线的完整部署流程文档**  
> 适用于全新的服务器环境，包含所有必要的步骤和配置

---

## 📋 目录

1. [系统要求](#系统要求)
2. [环境准备](#环境准备)
3. [安装依赖软件](#安装依赖软件)
4. [代码部署](#代码部署)
5. [数据库配置](#数据库配置)
6. [后端部署](#后端部署)
7. [前端部署](#前端部署)
8. [系统测试](#系统测试)
9. [生产环境优化](#生产环境优化)
10. [故障排查](#故障排查)

---

## 📦 系统要求

### 操作系统
- ✅ **推荐**: Ubuntu 20.04/22.04 LTS 或 CentOS 7/8
- ✅ **支持**: Debian, RHEL, macOS
- ⚠️ Windows 需要 WSL2 或 Docker 环境

### 硬件配置

| 环境 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| 开发环境 | 2核 | 2GB | 20GB |
| 测试环境 | 2核 | 4GB | 50GB |
| 生产环境 | 4核+ | 8GB+ | 100GB+ |

### 网络要求
- ✅ 开放端口: 3000 (前端), 8080 (后端), 3306 (MySQL)
- ✅ 互联网连接 (用于下载依赖包)

---

## 🔧 环境准备

### 1. 创建部署用户

```bash
# 创建专用部署用户
sudo useradd -m -s /bin/bash logitrack
sudo passwd logitrack

# 添加 sudo 权限 (可选)
sudo usermod -aG sudo logitrack

# 切换到部署用户
su - logitrack
```

### 2. 创建目录结构

```bash
# 创建应用目录
mkdir -p ~/apps/logitrack
mkdir -p ~/logs/logitrack
mkdir -p ~/backups/logitrack

# 设置环境变量
echo 'export LOGITRACK_HOME=~/apps/logitrack' >> ~/.bashrc
echo 'export LOGITRACK_LOGS=~/logs/logitrack' >> ~/.bashrc
source ~/.bashrc
```

---

## 📥 安装依赖软件

### 1. 安装 Java (OpenJDK 21)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y openjdk-21-jdk

# CentOS/RHEL
sudo yum install -y java-21-openjdk java-21-openjdk-devel

# 验证安装
java -version
# 应显示: openjdk version "21.x.x"
```

### 2. 安装 Maven

```bash
# Ubuntu/Debian
sudo apt install -y maven

# CentOS/RHEL
sudo yum install -y maven

# 或手动安装最新版本
cd /opt
sudo wget https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
sudo tar xzf apache-maven-3.9.6-bin.tar.gz
sudo ln -s apache-maven-3.9.6 maven

# 设置环境变量
echo 'export M2_HOME=/opt/maven' >> ~/.bashrc
echo 'export PATH=$M2_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 验证安装
mvn -version
```

### 3. 安装 Node.js 和 npm

```bash
# 方法1: 使用 NodeSource 仓库 (推荐)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 方法2: 使用 nvm (节点版本管理器)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 验证安装
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 4. 安装 MySQL 8.0

#### 方式 A: Docker 安装 (推荐)

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 启动 MySQL 容器
docker run -d \
  --name logitrack-mysql \
  --restart=always \
  -e MYSQL_ROOT_PASSWORD=your_secure_password \
  -e MYSQL_DATABASE=logitrack \
  -p 3306:3306 \
  -v ~/data/mysql:/var/lib/mysql \
  mysql:8.0

# 验证运行
docker ps | grep logitrack-mysql
```

#### 方式 B: 直接安装

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y mysql-server

# CentOS/RHEL
sudo yum install -y mysql-server

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 5. 安装 Git

```bash
sudo apt install -y git  # Ubuntu/Debian
sudo yum install -y git  # CentOS/RHEL

# 验证
git --version
```

### 6. 安装 Python (用于数据导入脚本)

```bash
sudo apt install -y python3 python3-pip
pip3 install pymysql pandas cryptography

# 验证
python3 --version
```

---

## 📦 代码部署

### 1. 克隆代码仓库

```bash
cd ~/apps
git clone https://github.com/dornach-Davian-Liang/LogiTrack-.git logitrack
cd logitrack

# 查看项目结构
ls -la
# 应该看到: backend/, logitrack-pro/, database/, README.md 等
```

### 2. 配置 Git (可选)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🗄️ 数据库配置

### 1. 创建数据库和用户

```bash
# 连接到 MySQL (Docker 环境)
docker exec -it logitrack-mysql mysql -uroot -p

# 或直接安装的 MySQL
mysql -uroot -p
```

在 MySQL 命令行中执行:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS logitrack 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建专用用户
CREATE USER IF NOT EXISTS 'logitrack_user'@'%' 
  IDENTIFIED BY 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON logitrack.* TO 'logitrack_user'@'%';
FLUSH PRIVILEGES;

-- 验证
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'logitrack_user';

-- 退出
EXIT;
```

### 2. 创建数据表

```bash
cd ~/apps/logitrack/database

# 使用 Python 脚本创建表
python3 create_table_pymysql.py

# 或手动执行 SQL
mysql -ulogitrack_user -p logitrack < schema.sql
```

### 3. 导入初始数据

```bash
# 确保 Test.csv 存在
ls -lh ../Test.csv

# 导入数据
python3 import_csv_pymysql.py

# 验证数据
mysql -ulogitrack_user -p -D logitrack -e "SELECT COUNT(*) as total FROM enquiry_records;"
# 应显示 5 条记录
```

### 4. 创建数据库索引 (性能优化)

```sql
-- 连接到数据库
mysql -ulogitrack_user -p logitrack

-- 创建索引
CREATE INDEX idx_reference_number ON enquiry_records(reference_number);
CREATE INDEX idx_status ON enquiry_records(status);
CREATE INDEX idx_sales_country ON enquiry_records(sales_country);
CREATE INDEX idx_booking_confirmed ON enquiry_records(booking_confirmed);
CREATE INDEX idx_enquiry_date ON enquiry_records(enquiry_received_date);
CREATE INDEX idx_product ON enquiry_records(product);
CREATE INDEX idx_pol_pod ON enquiry_records(pol, pod);
CREATE INDEX idx_created_at ON enquiry_records(created_at);

-- 查看索引
SHOW INDEX FROM enquiry_records;

EXIT;
```

---

## 🔨 后端部署

### 1. 配置数据库连接

编辑配置文件:

```bash
cd ~/apps/logitrack/backend
nano src/main/resources/application.properties
```

修改数据库配置:

```properties
# 数据库连接配置
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=logitrack_user
spring.datasource.password=your_secure_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate 配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# 连接池配置 (HikariCP)
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000

# 服务器配置
server.port=8080
server.address=0.0.0.0

# 日志配置
logging.level.com.logitrack=INFO
logging.file.name=~/logs/logitrack/backend.log
logging.file.max-size=10MB
logging.file.max-history=30
```

### 2. 编译后端

```bash
cd ~/apps/logitrack/backend

# 清理并编译
mvn clean package -DskipTests

# 验证 JAR 文件
ls -lh target/*.jar
# 应该看到: logitrack-backend-x.x.x.jar
```

### 3. 测试运行

```bash
# 前台运行测试
java -jar target/logitrack-backend-*.jar

# 验证启动成功 (新终端)
curl http://localhost:8080/api/enquiries
# 应返回 JSON 数据

# 停止测试 (Ctrl+C)
```

### 4. 创建启动脚本

```bash
cat > ~/apps/logitrack/backend/start.sh << 'EOF'
#!/bin/bash
# LogiTrack Backend 启动脚本

APP_HOME=~/apps/logitrack/backend
LOG_DIR=~/logs/logitrack
PID_FILE=$APP_HOME/app.pid

# 创建日志目录
mkdir -p $LOG_DIR

# 检查是否已运行
if [ -f $PID_FILE ]; then
  PID=$(cat $PID_FILE)
  if ps -p $PID > /dev/null 2>&1; then
    echo "Backend is already running (PID: $PID)"
    exit 1
  fi
fi

# 启动应用
cd $APP_HOME
nohup java -jar \
  -Xms512m -Xmx1024m \
  -Dspring.profiles.active=prod \
  target/logitrack-backend-*.jar \
  > $LOG_DIR/backend.log 2>&1 &

# 保存 PID
echo $! > $PID_FILE

echo "Backend started successfully!"
echo "PID: $(cat $PID_FILE)"
echo "Log: $LOG_DIR/backend.log"
EOF

chmod +x ~/apps/logitrack/backend/start.sh
```

### 5. 创建停止脚本

```bash
cat > ~/apps/logitrack/backend/stop.sh << 'EOF'
#!/bin/bash
# LogiTrack Backend 停止脚本

APP_HOME=~/apps/logitrack/backend
PID_FILE=$APP_HOME/app.pid

if [ ! -f $PID_FILE ]; then
  echo "PID file not found. Backend may not be running."
  exit 1
fi

PID=$(cat $PID_FILE)

if ps -p $PID > /dev/null 2>&1; then
  echo "Stopping backend (PID: $PID)..."
  kill $PID
  
  # 等待进程退出
  for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
      echo "Backend stopped successfully!"
      rm -f $PID_FILE
      exit 0
    fi
    sleep 1
  done
  
  # 强制停止
  echo "Force stopping backend..."
  kill -9 $PID
  rm -f $PID_FILE
  echo "Backend force stopped!"
else
  echo "Backend is not running (PID: $PID)"
  rm -f $PID_FILE
fi
EOF

chmod +x ~/apps/logitrack/backend/stop.sh
```

### 6. 配置为系统服务 (可选)

```bash
sudo nano /etc/systemd/system/logitrack-backend.service
```

添加以下内容:

```ini
[Unit]
Description=LogiTrack Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=logitrack
WorkingDirectory=/home/logitrack/apps/logitrack/backend
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m target/logitrack-backend-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=append:/home/logitrack/logs/logitrack/backend.log
StandardError=append:/home/logitrack/logs/logitrack/backend-error.log

[Install]
WantedBy=multi-user.target
```

启用服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable logitrack-backend
sudo systemctl start logitrack-backend
sudo systemctl status logitrack-backend
```

---

## 🎨 前端部署

### 1. 安装依赖

```bash
cd ~/apps/logitrack/logitrack-pro

# 安装 Node 依赖
npm install

# 验证
ls -la node_modules/
```

### 2. 配置 API 地址

编辑 `services/dataService.ts`:

```bash
nano services/dataService.ts
```

确认配置:

```typescript
// 开发环境使用相对路径 (通过 Vite 代理)
const API_BASE_URL = '/api/enquiries';

// 生产环境使用完整 URL
// const API_BASE_URL = 'http://your-domain.com:8080/api/enquiries';
```

### 3. 开发模式运行 (测试)

```bash
npm run dev

# 访问 http://localhost:3000
```

### 4. 生产环境构建

```bash
# 构建生产版本
npm run build

# 验证构建输出
ls -lh dist/
# 应该看到: index.html, assets/ 等
```

### 5. 使用 Nginx 部署

#### 安装 Nginx

```bash
sudo apt install -y nginx  # Ubuntu/Debian
sudo yum install -y nginx  # CentOS/RHEL

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/logitrack
```

添加配置:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为实际域名或 IP

    # 前端静态文件
    root /home/logitrack/apps/logitrack/logitrack-pro/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 日志
    access_log /var/log/nginx/logitrack-access.log;
    error_log /var/log/nginx/logitrack-error.log;
}
```

启用配置:

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/logitrack /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 6. 配置 SSL (HTTPS) - 可选但推荐

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🧪 系统测试

### 1. 健康检查脚本

```bash
cat > ~/apps/logitrack/health-check.sh << 'EOF'
#!/bin/bash
# LogiTrack 系统健康检查

echo "=== LogiTrack 系统健康检查 ==="
echo

# 检查 MySQL
echo "1. 检查 MySQL..."
if docker ps | grep -q logitrack-mysql; then
    echo "   ✓ MySQL 容器运行中"
    docker exec logitrack-mysql mysql -uroot -pyour_password -e "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✓ MySQL 数据库连接正常"
    else
        echo "   ✗ MySQL 数据库连接失败"
    fi
else
    echo "   ✗ MySQL 容器未运行"
fi

# 检查后端
echo
echo "2. 检查后端服务..."
if curl -s http://localhost:8080/api/enquiries > /dev/null; then
    echo "   ✓ 后端 API 响应正常"
    COUNT=$(curl -s http://localhost:8080/api/enquiries | grep -o '"id"' | wc -l)
    echo "   ✓ 数据库记录数: $COUNT"
else
    echo "   ✗ 后端 API 无响应"
fi

# 检查前端
echo
echo "3. 检查前端服务..."
if curl -s http://localhost > /dev/null; then
    echo "   ✓ 前端页面可访问"
else
    echo "   ✗ 前端页面无法访问"
fi

echo
echo "=== 检查完成 ==="
EOF

chmod +x ~/apps/logitrack/health-check.sh
```

### 2. 运行测试

```bash
# 执行健康检查
~/apps/logitrack/health-check.sh

# 测试 API
curl http://localhost:8080/api/enquiries | jq '.'

# 测试前端
curl http://localhost | grep -o '<title>.*</title>'
```

---

## ⚡ 生产环境优化

### 1. JVM 参数优化

编辑后端启动脚本,添加 JVM 参数:

```bash
java -jar \
  -server \
  -Xms1024m \
  -Xmx2048m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=~/logs/logitrack/heap-dump.hprof \
  target/logitrack-backend-*.jar
```

### 2. MySQL 性能优化

编辑 MySQL 配置:

```bash
# Docker 环境
docker exec -it logitrack-mysql bash
nano /etc/mysql/my.cnf

# 直接安装
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

添加配置:

```ini
[mysqld]
# 连接配置
max_connections = 200
connect_timeout = 10

# 缓冲池配置
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M

# 查询缓存
query_cache_type = 1
query_cache_size = 64M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

重启 MySQL:

```bash
docker restart logitrack-mysql
# 或
sudo systemctl restart mysql
```

### 3. 前端性能优化

在 `vite.config.ts` 中:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
});
```

### 4. 启用监控

安装 Prometheus + Grafana (可选):

```bash
# 后端添加 actuator 依赖
# 在 pom.xml 中添加:
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# 仅允许本地访问后端和数据库
sudo ufw deny 8080/tcp
sudo ufw deny 3306/tcp
```

### 2. 更改默认密码

```bash
# MySQL root 密码
docker exec -it logitrack-mysql mysql -uroot -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_secure_password';
```

### 3. 启用应用日志审计

在 `application.properties` 中:

```properties
# 审计日志
spring.jpa.properties.hibernate.session.events.log=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

---

## 🐛 故障排查

### 常见问题

#### 1. 后端无法连接数据库

```bash
# 检查 MySQL 是否运行
docker ps | grep mysql
sudo systemctl status mysql

# 检查网络连接
telnet localhost 3306

# 查看后端日志
tail -f ~/logs/logitrack/backend.log
```

#### 2. 前端 API 请求失败

```bash
# 检查 CORS 配置
curl -I http://localhost:8080/api/enquiries

# 检查 Nginx 代理
sudo nginx -t
sudo tail -f /var/log/nginx/logitrack-error.log
```

#### 3. 内存不足

```bash
# 查看内存使用
free -h

# 调整 JVM 堆大小
# 编辑启动脚本,减小 -Xmx 值
```

### 日志位置

| 组件 | 日志路径 |
|------|---------|
| 后端 | `~/logs/logitrack/backend.log` |
| Nginx | `/var/log/nginx/logitrack-*.log` |
| MySQL | `docker logs logitrack-mysql` |

---

## 📝 维护操作

### 数据备份

```bash
# 创建备份脚本
cat > ~/apps/logitrack/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups/logitrack
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker exec logitrack-mysql mysqldump \
  -uroot -pyour_password logitrack \
  > $BACKUP_DIR/db_backup_$DATE.sql

# 备份代码
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz \
  ~/apps/logitrack

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x ~/apps/logitrack/backup.sh

# 添加到 crontab (每天凌晨2点备份)
crontab -e
# 添加: 0 2 * * * ~/apps/logitrack/backup.sh
```

### 更新部署

```bash
cd ~/apps/logitrack

# 停止服务
~/apps/logitrack/backend/stop.sh

# 拉取最新代码
git pull origin main

# 重新编译后端
cd backend
mvn clean package -DskipTests

# 重新构建前端
cd ../logitrack-pro
npm install
npm run build

# 启动服务
~/apps/logitrack/backend/start.sh
sudo systemctl reload nginx
```

---

## ✅ 部署检查清单

部署完成后,请确认以下各项:

- [ ] Java 21+ 已安装
- [ ] Maven 3.6+ 已安装
- [ ] Node.js 20+ 已安装
- [ ] MySQL 8.0 运行正常
- [ ] 数据库已创建并导入数据
- [ ] 后端服务启动成功 (端口 8080)
- [ ] 前端构建完成并部署到 Nginx
- [ ] Nginx 配置正确并运行 (端口 80/443)
- [ ] API 可以正常访问
- [ ] 前端页面可以加载
- [ ] 数据可以正常显示和操作
- [ ] 日志目录已创建
- [ ] 备份脚本已配置
- [ ] 防火墙规则已设置
- [ ] SSL 证书已配置 (生产环境)
- [ ] 监控告警已配置 (可选)

---

## 📞 技术支持

如遇到问题,请查看:
- 📖 项目文档: `/workspaces/LogiTrack-/README.md`
- 🔧 快速启动: `/workspaces/LogiTrack-/QUICKSTART.md`
- 📋 迁移指南: `/workspaces/LogiTrack-/database/MIGRATION_GUIDE.md`
- 🐛 问题追踪: GitHub Issues

---

**祝部署顺利! 🚀**
