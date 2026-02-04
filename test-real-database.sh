#!/bin/bash

echo "========================================"
echo "LogiTrack 真实数据库连接测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "测试 $name ... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  响应: ${response:0:100}..."
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣ 后端服务测试"
echo "----------------------------------------"

# 测试后端端口
if lsof -ti:8888 > /dev/null; then
    echo -e "${GREEN}✓ 后端服务运行中 (端口 8888)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    ((FAILED++))
fi

# 测试国家API
test_api "国家数据API" "http://localhost:8888/api/dict/countries" "countryCode"

# 获取国家数量
COUNTRY_COUNT=$(curl -s http://localhost:8888/api/dict/countries | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ ! -z "$COUNTRY_COUNT" ]; then
    echo -e "  ${YELLOW}→ 返回 $COUNTRY_COUNT 个国家${NC}"
fi

# 测试港口API
test_api "港口数据API" "http://localhost:8888/api/dict/ports?portType=SEA" "portCode"

PORT_COUNT=$(curl -s "http://localhost:8888/api/dict/ports?portType=SEA&keyword=" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ ! -z "$PORT_COUNT" ]; then
    echo -e "  ${YELLOW}→ 返回 $PORT_COUNT 个SEA港口${NC}"
fi

# 测试销售国家API
test_api "销售国家API" "http://localhost:8888/api/dict/sales-countries" "value"

# 测试CN办公室API
test_api "CN办公室API" "http://localhost:8888/api/dict/cn-offices" "code"

echo ""
echo "2️⃣ 前端服务测试"
echo "----------------------------------------"

# 测试前端端口
if lsof -ti:3000 > /dev/null; then
    echo -e "${GREEN}✓ 前端服务运行中 (端口 3000)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ 前端服务未运行${NC}"
    ((FAILED++))
fi

# 检查MOCK模式状态
if grep -q "USE_MOCK_DATA = false" /workspaces/LogiTrack-/logitrack-pro/services/api.ts; then
    echo -e "${GREEN}✓ MOCK模式已关闭，使用真实数据库${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ MOCK模式仍然开启${NC}"
    echo "  请编辑 api.ts 设置 USE_MOCK_DATA = false"
fi

echo ""
echo "3️⃣ 数据库连接测试"
echo "----------------------------------------"

# 测试MySQL容器
if docker ps | grep -q "logitrack-mysql"; then
    echo -e "${GREEN}✓ MySQL容器运行中${NC}"
    ((PASSED++))
    
    # 测试数据库数据
    DB_TEST=$(docker exec logitrack-mysql mysql -u root -proot123 -e "USE logitrack; SELECT COUNT(*) as cnt FROM country;" 2>/dev/null | tail -1)
    if [ ! -z "$DB_TEST" ]; then
        echo -e "  ${YELLOW}→ 数据库中有 $DB_TEST 个国家记录${NC}"
    fi
else
    echo -e "${RED}✗ MySQL容器未运行${NC}"
    ((FAILED++))
fi

echo ""
echo "4️⃣ 功能验证提示"
echo "----------------------------------------"
echo "请在浏览器中手动测试以下功能："
echo ""
echo "✓ POD Country 自动映射："
echo "  1. 打开 http://localhost:3000"
echo "  2. 点击 'New Enquiry'"
echo "  3. 按 F12 打开 Console"
echo "  4. 在路线信息选择 POD (如Shanghai)"
echo "  5. 验证 Console 输出:"
echo "     Looking for country CN, found: {value: \"CN\", label: \"CHINA\"}"
echo "  6. 验证 '目的港国家' 字段显示 'CHINA'"
echo ""
echo "✓ 销售级联选择："
echo "  1. 选择销售国家 (如 FRANCE)"
echo "  2. 验证 Sales PIC 下拉框自动加载法国销售人员"
echo "  3. 选择 Sales PIC"
echo "  4. 验证 Sales Office 自动填充"
echo ""
echo "✓ Enquiry 创建："
echo "  1. 填写完整表单"
echo "  2. 点击 'Save Enquiry'"
echo "  3. 返回 Enquiry Management"
echo "  4. 验证新记录出现在列表中"
echo "  5. 刷新页面验证数据持久化"
echo ""

echo "========================================"
echo "测试总结"
echo "========================================"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有自动化测试通过！${NC}"
    echo "现在可以在浏览器中进行手动功能测试。"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 个测试失败，请检查上述错误。${NC}"
    exit 1
fi
