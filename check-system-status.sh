#!/bin/bash

# LogiTrack 系统状态检查脚本
# 用于验证所有服务是否正常运行

echo "======================================"
echo "LogiTrack 系统状态检查"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_service() {
    local service_name=$1
    local check_command=$2
    local expected_result=$3
    
    echo -n "检查 $service_name ... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 运行中${NC}"
        return 0
    else
        echo -e "${RED}✗ 未运行${NC}"
        return 1
    fi
}

# 1. 检查后端服务
echo "【1】后端服务 (Spring Boot)"
if ps aux | grep -v grep | grep "java -jar.*logitrack" > /dev/null; then
    PID=$(ps aux | grep -v grep | grep "java -jar.*logitrack" | awk '{print $2}')
    echo -e "${GREEN}✓ 运行中${NC} (PID: $PID)"
    
    # 检查健康端点
    echo -n "   检查健康端点 ... "
    if curl -s http://localhost:8888/actuator/health | grep -q "UP"; then
        echo -e "${GREEN}✓ 健康${NC}"
    else
        echo -e "${YELLOW}⚠ 端点无响应${NC}"
    fi
else
    echo -e "${RED}✗ 未运行${NC}"
    echo "   启动命令: cd /workspaces/LogiTrack-/backend && java -jar target/logitrack-backend-1.0.0.jar --spring.profiles.active=mysql"
fi
echo ""

# 2. 检查前端服务
echo "【2】前端服务 (Vite)"
if ps aux | grep -v grep | grep "vite" > /dev/null; then
    PID=$(ps aux | grep -v grep | grep "vite" | awk 'NR==1{print $2}')
    echo -e "${GREEN}✓ 运行中${NC} (PID: $PID)"
    
    # 检查端口
    echo -n "   检查端口3000 ... "
    if curl -s http://localhost:3000 | head -1 | grep -q "<!DOCTYPE html>"; then
        echo -e "${GREEN}✓ 可访问${NC}"
    else
        echo -e "${YELLOW}⚠ 无响应${NC}"
    fi
else
    echo -e "${RED}✗ 未运行${NC}"
    echo "   启动命令: cd /workspaces/LogiTrack-/logitrack-pro && npm run dev"
fi
echo ""

# 3. 检查数据库
echo "【3】数据库 (MySQL)"
if docker ps | grep -q "logitrack-mysql"; then
    echo -e "${GREEN}✓ 容器运行中${NC}"
    
    # 检查连接
    echo -n "   检查连接 ... "
    if docker exec logitrack-mysql mysqladmin -uroot -pldf123 ping 2>/dev/null | grep -q "alive"; then
        echo -e "${GREEN}✓ 可连接${NC}"
    else
        echo -e "${RED}✗ 连接失败${NC}"
    fi
    
    # 检查数据
    echo -n "   检查enquiry表 ... "
    COUNT=$(docker exec logitrack-mysql mysql -uroot -pldf123 logitrack -se "SELECT COUNT(*) FROM enquiry;" 2>/dev/null)
    if [ ! -z "$COUNT" ]; then
        echo -e "${GREEN}✓ $COUNT 条记录${NC}"
    else
        echo -e "${RED}✗ 查询失败${NC}"
    fi
else
    echo -e "${RED}✗ 容器未运行${NC}"
    echo "   启动命令: cd /workspaces/LogiTrack-/database && ./start-mysql-docker.sh"
fi
echo ""

# 4. 检查API功能
echo "【4】API功能测试"
echo -n "   GET /api/enquiries ... "
if curl -s "http://localhost:8888/api/enquiries?page=0&size=1" | grep -q "totalElements"; then
    TOTAL=$(curl -s "http://localhost:8888/api/enquiries?page=0&size=1" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ 成功 (共 $TOTAL 条记录)${NC}"
else
    echo -e "${RED}✗ 失败${NC}"
fi
echo ""

# 5. 检查最新测试数据
echo "【5】测试数据验证"
echo "   最新5条enquiry记录:"
docker exec logitrack-mysql mysql -uroot -pldf123 logitrack -se \
  "SELECT CONCAT('   ID ', id, ': ', reference_number, ' - Status: ', status) 
   FROM enquiry ORDER BY id DESC LIMIT 5;" 2>/dev/null

echo ""

# 6. 检查修复状态
echo "【6】Bug修复状态"
echo -n "   Container Lines字段完整性 ... "
MISSING=$(docker exec logitrack-mysql mysql -uroot -pldf123 logitrack -se \
  "SELECT COUNT(*) FROM enquiry_container_line 
   WHERE container_code IS NULL OR teu_per_unit IS NULL;" 2>/dev/null)
if [ "$MISSING" == "0" ]; then
    echo -e "${GREEN}✓ 完整 (0条缺失)${NC}"
else
    echo -e "${YELLOW}⚠ 发现 $MISSING 条记录缺失必填字段${NC}"
fi
echo ""

# 7. 总结
echo "======================================"
echo "系统状态总结"
echo "======================================"

ALL_OK=true

# 检查各项状态
if ! ps aux | grep -v grep | grep "java -jar.*logitrack" > /dev/null; then
    ALL_OK=false
    echo -e "${RED}⚠ 后端未运行${NC}"
fi

if ! ps aux | grep -v grep | grep "vite" > /dev/null; then
    ALL_OK=false
    echo -e "${RED}⚠ 前端未运行${NC}"
fi

if ! docker ps | grep -q "logitrack-mysql"; then
    ALL_OK=false
    echo -e "${RED}⚠ 数据库未运行${NC}"
fi

if $ALL_OK; then
    echo -e "${GREEN}✓ 所有服务运行正常${NC}"
    echo ""
    echo "您可以开始测试了："
    echo "  1. 访问: http://localhost:3000"
    echo "  2. 参考: BROWSER_TEST_GUIDE.md"
    echo "  3. 完成2条enquiry的创建测试"
else
    echo -e "${YELLOW}⚠ 部分服务未运行，请启动相关服务${NC}"
fi

echo ""
echo "详细文档："
echo "  • 快速入口: VERIFICATION_START_HERE.md"
echo "  • 测试指南: BROWSER_TEST_GUIDE.md"
echo "  • 修复报告: COMPLETION_REPORT_20260202.md"
echo ""
