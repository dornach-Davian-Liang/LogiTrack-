#!/bin/bash
################################################################################
# LogiTrack EC2 服务器初始化脚本
# 功能：在全新的Ubuntu 22.04 EC2实例上安装所有必要的软件
# 使用：sudo ./aws-setup-server.sh
################################################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "LogiTrack EC2 服务器环境初始化"
echo "=========================================="
echo ""

# 检查是否为root权限
if [ "$EUID" -ne 0 ]; then 
    echo "错误：请使用 sudo 运行此脚本"
    exit 1
fi

# 获取实际用户名（即使通过sudo运行）
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo ">> 当前用户: $ACTUAL_USER"
echo ">> 用户目录: $USER_HOME"
echo ""

# ============================================
# 1. 系统更新
# ============================================
echo "[1/8] 更新系统软件包..."
apt update -qq
DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq
echo "✓ 系统更新完成"
echo ""

# ============================================
# 2. 安装基础工具
# ============================================
echo "[2/8] 安装基础工具..."
apt install -y -qq \
    git \
    curl \
    wget \
    vim \
    ufw \
    net-tools \
    htop \
    unzip \
    software-properties-common
echo "✓ 基础工具安装完成"
echo ""

# ============================================
# 3. 配置防火墙
# ============================================
echo "[3/8] 配置UFW防火墙..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
echo "✓ 防火墙配置完成"
ufw status verbose
echo ""

# ============================================
# 4. 安装Java 17
# ============================================
echo "[4/8] 安装Java 17..."
apt install -y -qq openjdk-17-jdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> /etc/environment
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
java -version
echo "✓ Java 17 安装完成"
echo ""

# ============================================
# 5. 安装Maven
# ============================================
echo "[5/8] 安装Maven..."
apt install -y -qq maven
mvn -version
echo "✓ Maven 安装完成"
echo ""

# ============================================
# 6. 安装MySQL 8.0
# ============================================
echo "[6/8] 安装MySQL 8.0..."
DEBIAN_FRONTEND=noninteractive apt install -y -qq mysql-server

# 启动MySQL
systemctl start mysql
systemctl enable mysql

echo "✓ MySQL 安装完成"
echo ""

# ============================================
# 7. 安装Nginx
# ============================================
echo "[7/8] 安装Nginx..."
apt install -y -qq nginx
systemctl start nginx
systemctl enable nginx
echo "✓ Nginx 安装完成"
echo ""

# ============================================
# 8. 安装Node.js 18
# ============================================
echo "[8/8] 安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
apt install -y -qq nodejs
node -v
npm -v
echo "✓ Node.js 安装完成"
echo ""

# ============================================
# 配置时区
# ============================================
echo ">> 配置时区为 Asia/Shanghai..."
timedatectl set-timezone Asia/Shanghai
timedatectl
echo ""

# ============================================
# 创建必要的目录
# ============================================
echo ">> 创建项目目录..."
mkdir -p $USER_HOME/logitrack
mkdir -p $USER_HOME/scripts
mkdir -p $USER_HOME/backups
chown -R $ACTUAL_USER:$ACTUAL_USER $USER_HOME/logitrack
chown -R $ACTUAL_USER:$ACTUAL_USER $USER_HOME/scripts
chown -R $ACTUAL_USER:$ACTUAL_USER $USER_HOME/backups
echo "✓ 目录创建完成"
echo ""

# ============================================
# 完成
# ============================================
echo "=========================================="
echo "✅ 服务器环境初始化完成！"
echo "=========================================="
echo ""
echo "已安装的软件："
echo "  - Java: $(java -version 2>&1 | head -n 1)"
echo "  - Maven: $(mvn -version | head -n 1)"
echo "  - MySQL: $(mysql --version)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - Node.js: $(node -v)"
echo "  - NPM: $(npm -v)"
echo ""
echo "下一步："
echo "1. 配置MySQL安全设置: sudo mysql_secure_installation"
echo "2. 上传项目代码到: $USER_HOME/logitrack/"
echo "3. 运行部署脚本: ./aws-deploy-app.sh"
echo ""
