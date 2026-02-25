#!/bin/bash
################################################################################
# LogiTrack 应用部署脚本（用于EC2）
# 前提：已运行 aws-setup-server.sh 完成环境准备
# 使用：./aws-deploy-app.sh
################################################################################

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_DIR="$HOME/logitrack"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/logitrack-pro"
DB_NAME="logitrack"
DB_USER="logitrack_user"

echo "=========================================="
echo "LogiTrack 应用部署"
echo "=========================================="
echo ""

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误：项目目录不存在: $PROJECT_DIR"
    echo "请先上传项目代码到此目录"
    exit 1
fi

# ============================================
# 1. 配置数据库
# ============================================
echo "[1/5] 配置数据库..."

# 提示输入数据库密码
echo "请为数据库用户 $DB_USER 设置密码："
read -s DB_PASSWORD
echo ""

# 创建数据库和用户
echo ">> 创建数据库和用户..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
echo "✓ 数据库创建完成"

# 导入schema
if [ -f "$PROJECT_DIR/database/schema.sql" ]; then
    echo ">> 导入数据库schema..."
    sudo mysql $DB_NAME < $PROJECT_DIR/database/schema.sql
    
    # 导入其他schema文件
    for schema_file in schema_rbac_audit.sql schema_multi_ports.sql; do
        if [ -f "$PROJECT_DIR/database/$schema_file" ]; then
            sudo mysql $DB_NAME < $PROJECT_DIR/database/$schema_file
        fi
    done
    
    # 导入demo数据
    if [ -f "$PROJECT_DIR/database/demo_data.sql" ]; then
        sudo mysql $DB_NAME < $PROJECT_DIR/database/demo_data.sql
    fi
    
    echo "✓ 数据库schema导入完成"
else
    echo "⚠ 警告：未找到schema.sql，请手动导入"
fi
echo ""

# ============================================
# 2. 配置后端
# ============================================
echo "[2/5] 配置并构建后端..."

cd $BACKEND_DIR

# 备份原配置
if [ -f "src/main/resources/application.properties" ]; then
    cp src/main/resources/application.properties src/main/resources/application.properties.backup
fi

# 更新配置文件
cat > src/main/resources/application.properties << EOF
# Server Configuration
server.port=8080
spring.application.name=logitrack-backend

# MySQL Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/$DB_NAME?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.username=$DB_USER
spring.datasource.password=$DB_PASSWORD
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# MySQL Configuration
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000

# Logging
logging.level.com.logitrack=INFO
logging.level.org.springframework.web=WARN
logging.level.org.hibernate.SQL=WARN

# File upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
EOF

echo "✓ 配置文件已更新"

# 构建后端
echo ">> 构建后端应用..."
mvn clean package -DskipTests -q
echo "✓ 后端构建完成"
echo ""

# ============================================
# 3. 创建systemd服务
# ============================================
echo "[3/5] 创建systemd服务..."

sudo tee /etc/systemd/system/logitrack-backend.service > /dev/null << EOF
[Unit]
Description=LogiTrack Backend Service
After=mysql.service
Requires=mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/java -jar -Xmx1024m -Xms512m $BACKEND_DIR/target/logitrack-backend-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=append:/var/log/logitrack-backend.log
StandardError=append:/var/log/logitrack-backend-error.log

Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
Environment="SPRING_PROFILES_ACTIVE=production"

[Install]
WantedBy=multi-user.target
EOF

# 创建日志文件
sudo touch /var/log/logitrack-backend.log
sudo touch /var/log/logitrack-backend-error.log
sudo chown $USER:$USER /var/log/logitrack-backend*.log

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable logitrack-backend
sudo systemctl start logitrack-backend

echo "✓ 后端服务已启动"
sleep 10  # 等待服务启动

# 检查服务状态
if sudo systemctl is-active --quiet logitrack-backend; then
    echo "✓ 后端服务运行正常"
else
    echo "⚠ 警告：后端服务可能未正常启动，请检查日志"
    sudo journalctl -u logitrack-backend -n 20 --no-pager
fi
echo ""

# ============================================
# 4. 构建前端
# ============================================
echo "[4/5] 构建前端..."

cd $FRONTEND_DIR

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_BASE_URL=http://localhost:8080
EOF

# 安装依赖并构建
echo ">> 安装前端依赖..."
npm install --production -s 2>&1 | grep -v "^npm WARN"
echo ">> 构建前端应用..."
npm run build

if [ ! -d "dist" ]; then
    echo "✗ 错误：前端构建失败"
    exit 1
fi

echo "✓ 前端构建完成"
echo ""

# ============================================
# 5. 配置Nginx
# ============================================
echo "[5/5] 配置Nginx..."

# 获取EC2实例的公网IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "your-server-ip")

sudo tee /etc/nginx/sites-available/logitrack > /dev/null << EOF
server {
    listen 80;
    server_name $PUBLIC_IP _;
    
    access_log /var/log/nginx/logitrack-access.log;
    error_log /var/log/nginx/logitrack-error.log;

    # Frontend
    location / {
        root $FRONTEND_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/logitrack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
echo "✓ Nginx配置完成"
echo ""

# ============================================
# 完成
# ============================================
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "服务状态："
echo "  MySQL:   $(sudo systemctl is-active mysql)"
echo "  Backend: $(sudo systemctl is-active logitrack-backend)"
echo "  Nginx:   $(sudo systemctl is-active nginx)"
echo ""
echo "访问地址："
echo "  http://$PUBLIC_IP"
echo ""
echo "默认管理员账户："
echo "  用户名: admin"
echo "  密码: admin123456"
echo "  ⚠ 请登录后立即修改密码！"
echo ""
echo "查看日志："
echo "  后端: sudo tail -f /var/log/logitrack-backend.log"
echo "  Nginx: sudo tail -f /var/log/nginx/logitrack-access.log"
echo ""
echo "管理命令："
echo "  重启服务: sudo systemctl restart logitrack-backend nginx"
echo "  查看状态: sudo systemctl status logitrack-backend"
echo "  查看日志: sudo journalctl -u logitrack-backend -f"
echo ""
