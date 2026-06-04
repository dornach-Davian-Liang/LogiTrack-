# 🚀 LogiTrack Pro - AWS EC2 部署方案

> **适用场景**：10人规模小团队，本地数据库，简单运维  
> **部署模式**：单实例全栈部署（MySQL + Spring Boot + Nginx）  
> **预计部署时间**：30-45分钟

---

## 📋 目录
- [架构概览](#架构概览)
- [AWS资源配置](#aws资源配置)
- [服务器环境准备](#服务器环境准备)
- [应用部署](#应用部署)
- [运维管理](#运维管理)
- [成本估算](#成本估算)

---

## 🏗️ 架构概览

### 部署架构图
```
                    Internet
                       │
                       ↓
              [AWS Security Group]
               - Port 80 (HTTP)
               - Port 443 (HTTPS)
               - Port 22 (SSH - 限制IP)
                       │
                       ↓
            ┌──────────────────────┐
            │   EC2 Instance       │
            │   (t3.small/medium)  │
            │                      │
            │  ┌─────────────┐    │
            │  │   Nginx     │    │←── 前端静态文件 + 反向代理
            │  │   :80/443   │    │
            │  └──────┬──────┘    │
            │         │            │
            │  ┌──────┴──────┐    │
            │  │ Spring Boot │    │←── 业务逻辑
            │  │   :8080     │    │
            │  └──────┬──────┘    │
            │         │            │
            │  ┌──────┴──────┐    │
            │  │   MySQL     │    │←── 数据存储
            │  │   :3306     │    │
            │  └─────────────┘    │
            │                      │
            │  [定时备份任务]      │
            └──────────────────────┘
```

### 技术栈总览
- **操作系统**: Ubuntu 22.04 LTS
- **Web服务器**: Nginx 1.18+
- **应用服务器**: Spring Boot 3.2 (Java 17)
- **数据库**: MySQL 8.0
- **进程管理**: systemd
- **反向代理**: Nginx → Spring Boot

---

## ☁️ AWS资源配置

### 1. EC2实例选择

#### 推荐配置（10人使用）
```
实例类型: t3.small
- vCPU: 2核
- 内存: 2GB
- 存储: 30GB gp3 EBS
- 网络: 中等带宽
- 月成本: ~$15-20
```

#### 备选配置（如需更好性能）
```
实例类型: t3.medium
- vCPU: 2核
- 内存: 4GB
- 存储: 30GB gp3 EBS
- 月成本: ~$30-35
```

### 2. 创建EC2实例步骤

#### 2.1 登录AWS控制台
```
1. 访问 https://console.aws.amazon.com/
2. 选择区域（建议：亚太东京 ap-northeast-1 或新加坡 ap-southeast-1）
3. 进入 EC2 控制面板
```

#### 2.2 启动实例
```bash
# 在 EC2 控制台点击 "Launch Instance"

# 配置项：
名称: logitrack-production
AMI: Ubuntu 22.04 LTS (ami-ubuntu-22.04-xxx)
实例类型: t3.small
密钥对: 创建新密钥对 "logitrack-key.pem" 并下载保存
```

#### 2.3 网络配置
```yaml
VPC: 使用默认VPC
子网: 选择任意可用区的公有子网
自动分配公有IP: 启用
```

#### 2.4 存储配置
```
根卷: 30 GiB gp3
加密: 可选（建议启用）
```

### 3. 配置Security Group（安全组）

创建名为 `logitrack-sg` 的安全组：

```bash
# 入站规则
Type            Protocol    Port    Source                  Description
HTTP            TCP         80      0.0.0.0/0              公网访问
HTTPS           TCP         443     0.0.0.0/0              公网访问(可选)
SSH             TCP         22      你的IP/32              SSH管理访问
Custom TCP      TCP         8080    127.0.0.1/32           本地后端(内部)

# 出站规则
All traffic     All         All     0.0.0.0/0              允许所有出站
```

**⚠️ 安全建议**：
- SSH端口仅开放给你的办公室IP或VPN
- 不要对外开放3306（MySQL）和8080（后端）
- 定期更新安全组规则

### 4. 弹性IP（可选但推荐）

```bash
# 分配弹性IP避免实例重启后IP变化
1. EC2控制台 → Elastic IPs → Allocate Elastic IP
2. 关联到 logitrack-production 实例
3. 记录下这个固定IP地址
```

---

## 🔧 服务器环境准备

### 1. 连接到EC2实例

#### Windows用户
```powershell
# 使用PowerShell
ssh -i "C:\path\to\logitrack-key.pem" ubuntu@<EC2-Public-IP>

# 或使用 PuTTY（需先转换pem为ppk格式）
```

#### macOS/Linux用户
```bash
# 设置密钥权限
chmod 400 logitrack-key.pem

# 连接
ssh -i logitrack-key.pem ubuntu@<EC2-Public-IP>
```

### 2. 系统初始化

#### 2.1 更新系统
```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget vim ufw
```

#### 2.2 配置防火墙
```bash
# 启用UFW防火墙
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 开放必要端口
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS (optional)'

# 查看状态
sudo ufw status verbose
```

#### 2.3 配置时区
```bash
# 设置为中国时区
sudo timedatectl set-timezone Asia/Shanghai

# 验证
timedatectl
```

### 3. 安装必要软件

#### 3.1 安装Java 17
```bash
# 安装OpenJDK 17
sudo apt install -y openjdk-17-jdk

# 验证安装
java -version      # 应显示 17.x.x
javac -version

# 设置JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' | sudo tee -a /etc/environment
source /etc/environment
```

#### 3.2 安装Maven
```bash
# 安装Maven
sudo apt install -y maven

# 验证
mvn -version       # 应显示 3.6.x 或更高
```

#### 3.3 安装MySQL 8.0
```bash
# 安装MySQL服务器
sudo apt install -y mysql-server

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全初始化
sudo mysql_secure_installation
# 设置root密码（建议使用强密码）
# 其他选项根据提示选择 Y

# 验证安装
sudo systemctl status mysql
```

#### 3.4 安装Nginx
```bash
# 安装Nginx
sudo apt install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证
sudo systemctl status nginx
curl http://localhost     # 应看到Nginx欢迎页面
```

#### 3.5 安装Node.js（用于构建前端）
```bash
# 安装Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node -v      # 应显示 v18.x.x
npm -v       # 应显示 9.x.x
```

---

## 📦 应用部署

### 1. 上传项目代码

#### 方式一：从本地上传（推荐）

**在本地Windows机器上：**
```powershell
# 1. 打包整个项目（排除不必要的文件）
cd C:\logitrack\LogiTrack--update-status-report-20260126023903

# 2. 使用SCP上传（Windows PowerShell）
scp -i "C:\path\to\logitrack-key.pem" -r `
    backend/ logitrack-pro/ database/ *.csv `
    ubuntu@<EC2-IP>:/home/ubuntu/logitrack/

# 或使用 WinSCP 图形界面工具上传
```

#### 方式二：从Git仓库拉取
```bash
# 在EC2上执行
cd /home/ubuntu
git clone <your-git-repo-url> logitrack
cd logitrack
```

### 2. 配置数据库

#### 2.1 创建数据库和用户
```bash
# 登录MySQL
sudo mysql -u root -p

# 在MySQL命令行中执行：
```
```sql
-- 创建数据库
CREATE DATABASE logitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用专用用户
CREATE USER 'logitrack_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- 授权
GRANT ALL PRIVILEGES ON logitrack.* TO 'logitrack_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

#### 2.2 导入数据库schema
```bash
cd /home/ubuntu/logitrack/database

# 导入表结构
sudo mysql -u root -p logitrack < schema.sql

# 如果需要导入其他schema
sudo mysql -u root -p logitrack < schema_rbac_audit.sql
sudo mysql -u root -p logitrack < schema_multi_ports.sql

# 导入初始数据
sudo mysql -u root -p logitrack < demo_data.sql
```

#### 2.3 导入CSV数据（如有需要）
```bash
# 安装Python依赖
sudo apt install -y python3-pip python3-pymysql
pip3 install pymysql

# 导入CSV数据
cd /home/ubuntu/logitrack/database
python3 import_csv_pymysql.py
```

### 3. 配置后端应用

#### 3.1 修改配置文件
```bash
cd /home/ubuntu/logitrack/backend/src/main/resources

# 备份原配置
cp application.properties application.properties.backup

# 编辑配置
vim application.properties
```

修改以下内容：
```properties
# 数据库连接（使用刚创建的用户）
spring.datasource.url=jdbc:mysql://localhost:3306/logitrack?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.username=logitrack_user
spring.datasource.password=your_strong_password_here

# 生产环境配置
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# 连接池优化
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# 日志级别
logging.level.com.logitrack=INFO
logging.level.org.springframework.web=WARN
logging.level.org.hibernate.SQL=WARN
```

#### 3.2 构建后端
```bash
cd /home/ubuntu/logitrack/backend

# 清理并构建
mvn clean package -DskipTests

# 验证JAR文件生成
ls -lh target/logitrack-backend-1.0.0.jar
```

#### 3.3 创建systemd服务
```bash
# 创建服务文件
sudo vim /etc/systemd/system/logitrack-backend.service
```

添加以下内容：
```ini
[Unit]
Description=LogiTrack Backend Service
After=mysql.service
Requires=mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/logitrack/backend
ExecStart=/usr/bin/java -jar -Xmx1024m -Xms512m /home/ubuntu/logitrack/backend/target/logitrack-backend-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=append:/var/log/logitrack-backend.log
StandardError=append:/var/log/logitrack-backend-error.log

# 环境变量
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="SPRING_PROFILES_ACTIVE=production"

[Install]
WantedBy=multi-user.target
```

#### 3.4 启动后端服务
```bash
# 创建日志文件
sudo touch /var/log/logitrack-backend.log
sudo touch /var/log/logitrack-backend-error.log
sudo chown ubuntu:ubuntu /var/log/logitrack-backend*.log

# 重载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start logitrack-backend

# 设置开机自启
sudo systemctl enable logitrack-backend

# 查看状态
sudo systemctl status logitrack-backend

# 查看日志
sudo tail -f /var/log/logitrack-backend.log
```

#### 3.5 验证后端运行
```bash
# 等待30秒让应用完全启动
sleep 30

# 测试健康检查
curl http://localhost:8080/api/statistics/dashboard

# 应该返回JSON数据
```

### 4. 配置前端应用

#### 4.1 配置API地址
```bash
cd /home/ubuntu/logitrack/logitrack-pro/src

# 查找API配置文件
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "http://localhost:8080"
```

创建环境配置文件：
```bash
vim /home/ubuntu/logitrack/logitrack-pro/.env.production
```

添加内容：
```env
VITE_API_BASE_URL=http://localhost:8080
```

#### 4.2 构建前端
```bash
cd /home/ubuntu/logitrack/logitrack-pro

# 安装依赖
npm install --production

# 构建生产版本
npm run build

# 验证构建产物
ls -lh dist/
```

#### 4.3 配置Nginx
```bash
# 创建Nginx配置
sudo vim /etc/nginx/sites-available/logitrack
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name <你的域名或EC2公网IP>;
    
    # 访问日志
    access_log /var/log/nginx/logitrack-access.log;
    error_log /var/log/nginx/logitrack-error.log;

    # 前端静态文件
    location / {
        root /home/ubuntu/logitrack/logitrack-pro/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 反向代理后端API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

#### 4.4 启用Nginx配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/logitrack /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 5. 验证完整部署

```bash
# 1. 检查所有服务状态
sudo systemctl status mysql
sudo systemctl status logitrack-backend
sudo systemctl status nginx

# 2. 检查端口监听
sudo netstat -tlnp | grep -E '(3306|8080|80)'

# 3. 测试后端API
curl http://localhost:8080/api/statistics/dashboard

# 4. 测试Nginx反向代理
curl http://localhost/api/statistics/dashboard

# 5. 从外网访问（在本地浏览器）
# http://<EC2-Public-IP>
```

---

## 🔒 安全加固（可选）

### 1. 配置HTTPS（推荐）

使用Let's Encrypt免费SSL证书：

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（需要有域名）
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 2. 配置防火墙规则

```bash
# 禁止直接访问后端端口
sudo ufw deny 8080/tcp

# 查看规则
sudo ufw status numbered
```

### 3. MySQL安全加固

```bash
# 编辑MySQL配置
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加/修改以下配置
[mysqld]
bind-address = 127.0.0.1
skip-name-resolve = 1
max_connections = 50
```

重启MySQL：
```bash
sudo systemctl restart mysql
```

---

## 🛠️ 运维管理

### 1. 日常运维脚本

创建管理脚本目录：
```bash
mkdir -p /home/ubuntu/scripts
cd /home/ubuntu/scripts
```

#### 1.1 启动脚本
```bash
vim start-all.sh
```
```bash
#!/bin/bash
echo "Starting LogiTrack services..."
sudo systemctl start mysql
sudo systemctl start logitrack-backend
sudo systemctl start nginx
echo "All services started!"
systemctl status mysql logitrack-backend nginx --no-pager
```

#### 1.2 停止脚本
```bash
vim stop-all.sh
```
```bash
#!/bin/bash
echo "Stopping LogiTrack services..."
sudo systemctl stop nginx
sudo systemctl stop logitrack-backend
echo "Services stopped!"
```

#### 1.3 重启脚本
```bash
vim restart-all.sh
```
```bash
#!/bin/bash
echo "Restarting LogiTrack services..."
sudo systemctl restart logitrack-backend
sudo systemctl restart nginx
echo "Services restarted!"
systemctl status logitrack-backend nginx --no-pager
```

#### 1.4 查看日志脚本
```bash
vim view-logs.sh
```
```bash
#!/bin/bash
echo "=== Backend Application Log (last 50 lines) ==="
sudo tail -n 50 /var/log/logitrack-backend.log
echo ""
echo "=== Backend Error Log (last 20 lines) ==="
sudo tail -n 20 /var/log/logitrack-backend-error.log
echo ""
echo "=== Nginx Access Log (last 20 lines) ==="
sudo tail -n 20 /var/log/nginx/logitrack-access.log
```

#### 1.5 健康检查脚本
```bash
vim health-check.sh
```
```bash
#!/bin/bash
echo "=== LogiTrack Health Check ==="
echo ""

# MySQL
echo "1. MySQL Status:"
sudo systemctl is-active mysql
mysql -u logitrack_user -p'your_password' -e "SELECT 1" logitrack &>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ MySQL is healthy"
else
    echo "   ✗ MySQL connection failed"
fi
echo ""

# Backend
echo "2. Backend Status:"
sudo systemctl is-active logitrack-backend
curl -s http://localhost:8080/api/statistics/dashboard > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Backend API is responding"
else
    echo "   ✗ Backend API is not responding"
fi
echo ""

# Nginx
echo "3. Nginx Status:"
sudo systemctl is-active nginx
curl -s http://localhost > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Nginx is serving content"
else
    echo "   ✗ Nginx is not responding"
fi
echo ""

# Disk Space
echo "4. Disk Usage:"
df -h / | tail -1
echo ""

# Memory
echo "5. Memory Usage:"
free -h | grep Mem
```

添加执行权限：
```bash
chmod +x /home/ubuntu/scripts/*.sh
```

### 2. 数据库备份

#### 2.1 创建备份脚本
```bash
vim /home/ubuntu/scripts/backup-database.sh
```
```bash
#!/bin/bash

# 配置
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="logitrack"
DB_USER="logitrack_user"
DB_PASS="your_strong_password_here"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/logitrack_backup_$DATE.sql.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "Starting database backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Backup completed: $BACKUP_FILE"
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "  Backup size: $SIZE"
    
    # 删除7天前的备份
    find $BACKUP_DIR -name "logitrack_backup_*.sql.gz" -mtime +7 -delete
    echo "  Old backups cleaned up"
else
    echo "✗ Backup failed!"
    exit 1
fi
```

添加执行权限：
```bash
chmod +x /home/ubuntu/scripts/backup-database.sh
```

#### 2.2 配置定时备份
```bash
# 编辑crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /home/ubuntu/scripts/backup-database.sh >> /var/log/logitrack-backup.log 2>&1
```

#### 2.3 手动恢复备份
```bash
# 解压并恢复
gunzip < /home/ubuntu/backups/logitrack_backup_20260219_020000.sql.gz | \
mysql -u logitrack_user -p logitrack
```

### 3. 应用更新流程

#### 3.1 更新后端
```bash
cd /home/ubuntu/logitrack/backend

# 1. 停止服务
sudo systemctl stop logitrack-backend

# 2. 备份当前版本
cp target/logitrack-backend-1.0.0.jar target/logitrack-backend-1.0.0.jar.backup

# 3. 拉取新代码（如果用Git）
git pull

# 4. 重新构建
mvn clean package -DskipTests

# 5. 启动服务
sudo systemctl start logitrack-backend

# 6. 验证
sleep 20
curl http://localhost:8080/api/statistics/dashboard
```

#### 3.2 更新前端
```bash
cd /home/ubuntu/logitrack/logitrack-pro

# 1. 备份当前版本
cp -r dist dist.backup

# 2. 拉取新代码
git pull

# 3. 重新构建
npm install
npm run build

# 4. 重启Nginx
sudo systemctl restart nginx

# 5. 验证（浏览器访问）
```

### 4. 监控和告警

#### 4.1 简单监控脚本
```bash
vim /home/ubuntu/scripts/monitor.sh
```
```bash
#!/bin/bash

# 检查服务并自动重启
check_and_restart() {
    SERVICE=$1
    if ! systemctl is-active --quiet $SERVICE; then
        echo "$(date): $SERVICE is down, attempting restart..."
        sudo systemctl restart $SERVICE
        sleep 10
        if systemctl is-active --quiet $SERVICE; then
            echo "$(date): $SERVICE restarted successfully"
        else
            echo "$(date): Failed to restart $SERVICE - ALERT!"
            # 这里可以添加邮件或短信告警
        fi
    fi
}

check_and_restart mysql
check_and_restart logitrack-backend
check_and_restart nginx
```

添加到crontab（每5分钟检查一次）：
```bash
crontab -e
*/5 * * * * /home/ubuntu/scripts/monitor.sh >> /var/log/logitrack-monitor.log 2>&1
```

#### 4.2 磁盘空间监控
```bash
vim /home/ubuntu/scripts/check-disk.sh
```
```bash
#!/bin/bash
THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "$(date): WARNING! Disk usage is at ${USAGE}%"
    # 这里可以添加告警逻辑
fi
```

### 5. 日志管理

#### 5.1 配置日志轮转
```bash
sudo vim /etc/logrotate.d/logitrack
```
```
/var/log/logitrack-backend.log
/var/log/logitrack-backend-error.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
```

---

## 💰 成本估算

### 月度费用明细（美元）

```
EC2 实例 (t3.small):
- 按需实例: $15.18/月
- 预留实例(1年): $9.13/月
- 预留实例(3年): $5.48/月

EBS 存储 (30GB gp3):
- $2.40/月

弹性IP (关联时免费):
- $0/月

数据传输:
- 入站: 免费
- 出站 (估算5GB/月): $0.45/月

总计:
- 按需模式: ~$18/月
- 预留1年: ~$12/月
- 预留3年: ~$8/月
```

### 节省成本建议
1. **使用预留实例**：承诺1年可节省40%
2. **在非工作时间关闭实例**：如果仅工作日使用，可节省60%
3. **使用AWS Budgets**：设置预算告警

---

## 🎯 快速部署清单

打印此清单，逐项完成：

### 阶段1：AWS准备
- [ ] 创建EC2实例（t3.small, Ubuntu 22.04）
- [ ] 配置Security Group（80, 443, 22端口）
- [ ] 分配并关联弹性IP
- [ ] 下载并保存密钥对 (.pem文件)
- [ ] 测试SSH连接

### 阶段2：服务器环境
- [ ] 更新系统：`sudo apt update && upgrade`
- [ ] 配置UFW防火墙
- [ ] 安装Java 17
- [ ] 安装Maven
- [ ] 安装MySQL 8.0
- [ ] 安装Nginx
- [ ] 安装Node.js 18

### 阶段3：数据库
- [ ] 运行MySQL安全初始化
- [ ] 创建logitrack数据库
- [ ] 创建logitrack_user用户
- [ ] 导入schema.sql
- [ ] 导入初始数据
- [ ] 测试数据库连接

### 阶段4：后端部署
- [ ] 上传项目代码到服务器
- [ ] 修改application.properties配置
- [ ] 构建JAR包：`mvn clean package`
- [ ] 创建systemd服务文件
- [ ] 启动backend服务
- [ ] 测试API：`curl localhost:8080/api/...`

### 阶段5：前端部署
- [ ] 配置.env.production
- [ ] 构建前端：`npm run build`
- [ ] 配置Nginx站点配置
- [ ] 启用Nginx配置
- [ ] 测试Nginx反向代理

### 阶段6：验证和运维
- [ ] 从外网浏览器访问系统
- [ ] 测试登录功能
- [ ] 测试主要业务功能
- [ ] 创建运维脚本
- [ ] 配置数据库备份定时任务
- [ ] 配置监控脚本
- [ ] 记录所有密码和IP到安全位置

---

## 📞 故障排查

### 1. 后端服务无法启动

```bash
# 查看详细日志
sudo journalctl -u logitrack-backend -n 100 --no-pager

# 常见问题：
# 1. 端口被占用
sudo lsof -i :8080

# 2. 数据库连接失败
mysql -u logitrack_user -p -e "SELECT 1" logitrack

# 3. 内存不足
free -h
```

### 2. 前端无法访问

```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/logitrack-error.log

# 检查文件权限
ls -la /home/ubuntu/logitrack/logitrack-pro/dist/
```

### 3. MySQL连接问题

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# 测试连接
mysql -u logitrack_user -p logitrack
```

### 4. API请求504超时

```bash
# 检查后端健康
curl http://localhost:8080/api/statistics/dashboard

# 增加Nginx超时时间
sudo vim /etc/nginx/sites-available/logitrack
# 在location /api/ 块中添加：
# proxy_read_timeout 300s;
```

---

## 📚 附录

### A. 常用命令速查

```bash
# 服务管理
sudo systemctl start|stop|restart|status logitrack-backend
sudo systemctl start|stop|restart|status nginx
sudo systemctl start|stop|restart|status mysql

# 查看日志
sudo tail -f /var/log/logitrack-backend.log
sudo tail -f /var/log/nginx/logitrack-access.log
sudo journalctl -u logitrack-backend -f

# 数据库操作
mysql -u logitrack_user -p logitrack
mysqldump -u logitrack_user -p logitrack > backup.sql

# 查看系统资源
htop
df -h
free -h
sudo netstat -tlnp
```

### B. 重要文件路径

```
应用代码: /home/ubuntu/logitrack/
后端JAR: /home/ubuntu/logitrack/backend/target/logitrack-backend-1.0.0.jar
前端构建: /home/ubuntu/logitrack/logitrack-pro/dist/
运维脚本: /home/ubuntu/scripts/
数据备份: /home/ubuntu/backups/

配置文件:
- 后端: /home/ubuntu/logitrack/backend/src/main/resources/application.properties
- Nginx: /etc/nginx/sites-available/logitrack
- MySQL: /etc/mysql/mysql.conf.d/mysqld.cnf
- Systemd: /etc/systemd/system/logitrack-backend.service

日志文件:
- 后端: /var/log/logitrack-backend.log
- Nginx: /var/log/nginx/logitrack-*.log
- MySQL: /var/log/mysql/error.log
```

### C. 安全检查清单

- [ ] SSH仅允许密钥认证（禁用密码登录）
- [ ] UFW防火墙已启用
- [ ] MySQL仅监听127.0.0.1
- [ ] 数据库使用强密码
- [ ] 后端端口(8080)不对外开放
- [ ] 定期更新系统补丁：`sudo apt update && upgrade`
- [ ] 定期备份数据库
- [ ] 配置HTTPS（推荐）

---

## ✅ 部署完成后

恭喜！您的LogiTrack系统已成功部署到AWS EC2。

### 下一步：
1. **测试所有功能**：确保系统正常运行
2. **记录信息**：将EC2 IP、数据库密码等信息安全保存
3. **设置监控**：配置AWS CloudWatch或使用运维脚本
4. **培训用户**：告知团队新的访问地址
5. **建立SOP**：基于本文档创建运维操作手册

### 访问地址：
```
系统地址: http://<你的EC2弹性IP>
或使用域名: http://yourdomain.com (如果已配置)

默认管理员账户（请及时修改密码）：
用户名: admin
密码: admin123456
```

### 获取支持：
- 技术文档：查看项目中的 DEPLOYMENT.md
- 问题排查：参考本文档的「故障排查」章节
- AWS支持：https://console.aws.amazon.com/support/

---

**文档版本**: v1.0  
**最后更新**: 2026-02-19  
**适用于**: LogiTrack Pro (Spring Boot 3.2 + React)
