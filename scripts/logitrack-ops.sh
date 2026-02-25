#!/bin/bash
################################################################################
# LogiTrack 运维管理脚本
# 功能：提供日常运维操作的快捷命令
# 使用：./logitrack-ops.sh [command]
################################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：显示帮助
show_help() {
    echo "LogiTrack 运维管理工具"
    echo ""
    echo "使用方法: $0 [command]"
    echo ""
    echo "可用命令："
    echo "  status      - 查看所有服务状态"
    echo "  start       - 启动所有服务"
    echo "  stop        - 停止所有服务"
    echo "  restart     - 重启所有服务"
    echo "  logs        - 查看应用日志"
    echo "  logs-live   - 实时查看日志"
    echo "  health      - 健康检查"
    echo "  backup      - 备份数据库"
    echo "  update      - 更新应用"
    echo "  monitor     - 系统资源监控"
    echo ""
}

# 函数：服务状态
show_status() {
    echo -e "${BLUE}=== 服务状态 ===${NC}"
    echo ""
    echo -n "MySQL:   "
    if sudo systemctl is-active --quiet mysql; then
        echo -e "${GREEN}运行中${NC}"
    else
        echo -e "${RED}已停止${NC}"
    fi
    
    echo -n "Backend: "
    if sudo systemctl is-active --quiet logitrack-backend; then
        echo -e "${GREEN}运行中${NC}"
    else
        echo -e "${RED}已停止${NC}"
    fi
    
    echo -n "Nginx:   "
    if sudo systemctl is-active --quiet nginx; then
        echo -e "${GREEN}运行中${NC}"
    else
        echo -e "${RED}已停止${NC}"
    fi
    echo ""
}

# 函数：启动服务
start_services() {
    echo -e "${BLUE}=== 启动服务 ===${NC}"
    sudo systemctl start mysql
    echo "✓ MySQL 已启动"
    sleep 2
    sudo systemctl start logitrack-backend
    echo "✓ Backend 已启动"
    sudo systemctl start nginx
    echo "✓ Nginx 已启动"
    echo ""
    show_status
}

# 函数：停止服务
stop_services() {
    echo -e "${BLUE}=== 停止服务 ===${NC}"
    sudo systemctl stop nginx
    echo "✓ Nginx 已停止"
    sudo systemctl stop logitrack-backend
    echo "✓ Backend 已停止"
    echo ""
    echo -e "${YELLOW}注意：MySQL 保持运行${NC}"
    show_status
}

# 函数：重启服务
restart_services() {
    echo -e "${BLUE}=== 重启服务 ===${NC}"
    sudo systemctl restart logitrack-backend
    echo "✓ Backend 已重启"
    sudo systemctl restart nginx
    echo "✓ Nginx 已重启"
    echo ""
    show_status
}

# 函数：查看日志
show_logs() {
    echo -e "${BLUE}=== 应用日志 ===${NC}"
    echo ""
    echo -e "${YELLOW}[Backend Application Log - 最后50行]${NC}"
    sudo tail -n 50 /var/log/logitrack-backend.log
    echo ""
    echo -e "${YELLOW}[Backend Error Log - 最后20行]${NC}"
    sudo tail -n 20 /var/log/logitrack-backend-error.log
    echo ""
    echo -e "${YELLOW}[Nginx Access Log - 最后20行]${NC}"
    sudo tail -n 20 /var/log/nginx/logitrack-access.log
}

# 函数：实时日志
show_logs_live() {
    echo -e "${BLUE}=== 实时日志 (Ctrl+C 退出) ===${NC}"
    sudo tail -f /var/log/logitrack-backend.log
}

# 函数：健康检查
health_check() {
    echo -e "${BLUE}=== 健康检查 ===${NC}"
    echo ""
    
    # MySQL
    echo -n "1. MySQL: "
    if mysql -u logitrack_user -p$(grep 'spring.datasource.password' ~/logitrack/backend/src/main/resources/application.properties | cut -d'=' -f2) -e "SELECT 1" logitrack &>/dev/null; then
        echo -e "${GREEN}健康${NC}"
    else
        echo -e "${RED}异常${NC}"
    fi
    
    # Backend API
    echo -n "2. Backend API: "
    if curl -s http://localhost:8080/api/statistics/dashboard > /dev/null 2>&1; then
        echo -e "${GREEN}响应正常${NC}"
    else
        echo -e "${RED}无响应${NC}"
    fi
    
    # Nginx
    echo -n "3. Nginx: "
    if curl -s http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}服务正常${NC}"
    else
        echo -e "${RED}服务异常${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}=== 系统资源 ===${NC}"
    echo ""
    echo "磁盘使用："
    df -h / | tail -1
    echo ""
    echo "内存使用："
    free -h | grep Mem
    echo ""
}

# 函数：备份数据库
backup_database() {
    echo -e "${BLUE}=== 数据库备份 ===${NC}"
    
    BACKUP_DIR="$HOME/backups"
    mkdir -p $BACKUP_DIR
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/logitrack_backup_$DATE.sql.gz"
    
    echo ">> 开始备份..."
    DB_PASSWORD=$(grep 'spring.datasource.password' ~/logitrack/backend/src/main/resources/application.properties | cut -d'=' -f2)
    
    mysqldump -u logitrack_user -p$DB_PASSWORD logitrack | gzip > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h $BACKUP_FILE | cut -f1)
        echo -e "${GREEN}✓ 备份完成${NC}"
        echo "  文件: $BACKUP_FILE"
        echo "  大小: $SIZE"
        
        # 清理7天前的备份
        find $BACKUP_DIR -name "logitrack_backup_*.sql.gz" -mtime +7 -delete
        echo "  旧备份已清理"
    else
        echo -e "${RED}✗ 备份失败${NC}"
        exit 1
    fi
    echo ""
}

# 函数：更新应用
update_app() {
    echo -e "${BLUE}=== 更新应用 ===${NC}"
    echo ""
    
    cd ~/logitrack
    
    # 备份当前版本
    echo ">> 备份当前版本..."
    if [ -f "backend/target/logitrack-backend-1.0.0.jar" ]; then
        cp backend/target/logitrack-backend-1.0.0.jar backend/target/logitrack-backend-1.0.0.jar.backup
    fi
    
    # 拉取代码
    echo ">> 拉取最新代码..."
    read -p "是否从Git拉取？(y/n): " use_git
    if [ "$use_git" = "y" ]; then
        git pull
    else
        echo "跳过Git拉取，请确保已手动上传新代码"
    fi
    
    # 停止服务
    echo ">> 停止后端服务..."
    sudo systemctl stop logitrack-backend
    
    # 重新构建后端
    echo ">> 构建后端..."
    cd backend
    mvn clean package -DskipTests -q
    
    # 重新构建前端
    echo ">> 构建前端..."
    cd ../logitrack-pro
    npm run build
    
    # 启动服务
    echo ">> 启动服务..."
    sudo systemctl start logitrack-backend
    sleep 10
    sudo systemctl restart nginx
    
    echo -e "${GREEN}✓ 更新完成${NC}"
    echo ""
    show_status
}

# 函数：系统监控
monitor_system() {
    echo -e "${BLUE}=== 系统监控 ===${NC}"
    echo ""
    
    echo "CPU和内存："
    top -bn1 | head -15
    echo ""
    
    echo "磁盘使用："
    df -h
    echo ""
    
    echo "网络连接："
    sudo netstat -tuln | grep -E '(3306|8080|80|443)'
    echo ""
}

# 主程序
case "$1" in
    status)
        show_status
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    logs-live)
        show_logs_live
        ;;
    health)
        health_check
        ;;
    backup)
        backup_database
        ;;
    update)
        update_app
        ;;
    monitor)
        monitor_system
        ;;
    *)
        show_help
        exit 1
        ;;
esac

exit 0
