#!/bin/bash

echo "================================"
echo "LogiTrack 系统状态检查"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查后端
echo "1. 检查后端 (Spring Boot)..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/enquiries)
if [ "$BACKEND_STATUS" = "200" ]; then
    RECORD_COUNT=$(curl -s http://localhost:8080/api/enquiries | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ 后端运行正常 (http://localhost:8080)${NC}"
    echo "   - 数据库记录数: $RECORD_COUNT"
else
    echo -e "${RED}❌ 后端未响应${NC}"
    echo "   请运行: cd backend && ./start-backend.sh"
fi
echo ""

# 检查前端
echo "2. 检查前端 (React + Vite)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 前端运行正常 (http://localhost:3000)${NC}"
else
    echo -e "${RED}❌ 前端未响应${NC}"
    echo "   请运行: cd logitrack-pro && npm run dev"
fi
echo ""

# 检查前后端连接
echo "3. 检查前后端配置..."
MOCK_STATUS=$(grep "USE_MOCK_DATA = false" logitrack-pro/services/dataService.ts)
if [ -n "$MOCK_STATUS" ]; then
    echo -e "${GREEN}✅ 前端已配置连接后端 API${NC}"
else
    echo -e "${YELLOW}⚠️  前端可能使用 Mock 数据${NC}"
fi
echo ""

# API 测试
echo "4. 测试 API 端点..."
echo "   GET /api/enquiries:"
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/enquiries)
if [ "$API_TEST" = "200" ]; then
    echo -e "   ${GREEN}✅ 成功${NC}"
else
    echo -e "   ${RED}❌ 失败 (状态码: $API_TEST)${NC}"
fi
echo ""

# 总结
echo "================================"
echo "系统状态总结"
echo "================================"
if [ "$BACKEND_STATUS" = "200" ] && [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 系统运行正常！${NC}"
    echo ""
    echo "访问地址:"
    echo "  - 前端: http://localhost:3000"
    echo "  - 后端 API: http://localhost:8080/api/enquiries"
    echo "  - H2 控制台: http://localhost:8080/h2-console"
    echo ""
    echo "使用说明:"
    echo "  1. 在浏览器中打开 http://localhost:3000"
    echo "  2. 点击登录按钮进入系统"
    echo "  3. 开始管理询价记录！"
else
    echo -e "${RED}❌ 系统未完全启动${NC}"
    echo ""
    echo "请按以下步骤启动:"
    if [ "$BACKEND_STATUS" != "200" ]; then
        echo "  1. 启动后端: cd backend && ./start-backend.sh"
    fi
    if [ "$FRONTEND_STATUS" != "200" ]; then
        echo "  2. 启动前端: cd logitrack-pro && npm run dev"
    fi
fi
echo ""
