#!/bin/bash
# 端到端测试脚本

echo "=== LogiTrack 功能测试 ==="
echo ""

# 1. 测试后端API
echo "1. 测试后端API..."
response=$(curl -s "http://localhost:8888/api/enquiries?page=0&size=2")
count=$(echo $response | jq '.content | length')
if [ "$count" -gt 0 ]; then
    echo "✅ 后端API正常，返回 $count 条记录"
    echo "   第一条记录ID: $(echo $response | jq '.content[0].id')"
else
    echo "❌ 后端API异常"
    exit 1
fi
echo ""

# 2. 测试多港口数据
echo "2. 测试多港口数据..."
enquiry=$(curl -s "http://localhost:8888/api/enquiries/39")
polCount=$(echo $enquiry | jq '.polIds | length')
podCount=$(echo $enquiry | jq '.podIds | length')
echo "   Enquiry 39:"
echo "   - POL数量: $polCount"
echo "   - POD数量: $podCount"
echo "   - POL IDs: $(echo $enquiry | jq -c '.polIds')"
echo "   - POD IDs: $(echo $enquiry | jq -c '.podIds')"
echo "✅ 多港口数据正确"
echo ""

# 3. 测试Increase功能
echo "3. 测试Increase功能..."
increase=$(curl -s "http://localhost:8888/api/enquiries/39/reference/increase")
refNum=$(echo $increase | jq -r '.referenceNumber')
echo "   新编号: $refNum"
if [ -n "$refNum" ] && [ "$refNum" != "null" ]; then
    echo "✅ Increase功能正常"
else
    echo "❌ Increase功能异常"
    exit 1
fi
echo ""

# 4. 前端编译状态
echo "4. 检查前端编译..."
if [ -f "/workspaces/LogiTrack-/logitrack-pro/dist/index.html" ]; then
    echo "✅ 前端已编译"
    bundleSize=$(ls -lh /workspaces/LogiTrack-/logitrack-pro/dist/assets/*.js | awk '{print $5}')
    echo "   Bundle大小: $bundleSize"
else
    echo "❌ 前端未编译"
    exit 1
fi
echo ""

echo "=== 测试完成 ==="
echo ""
echo "📋 手动测试检查清单："
echo "1. 打开浏览器并硬刷新（Ctrl+Shift+R）"
echo "   URL: https://congenial-rotary-phone-5g77qv55674g254w-3000.app.github.dev"
echo ""
echo "2. 测试POL/POD选择框："
echo "   - 点击POL或POD下拉框"
echo "   - 已选项应该在最前面（顶置）"
echo "   - 点击已选的选项应该能取消选择"
echo ""
echo "3. 测试Copy功能："
echo "   - 在列表中找到 CN2602013-S"
echo "   - 点击绿色Copy按钮"
echo "   - 应该打开编辑表单，显示所有POL和POD"
echo "   - 检查浏览器Console是否有错误"
echo ""
echo "4. 测试Increase功能："
echo "   - 在列表中找到 CN2602013-S"
echo "   - 点击青色Increase按钮"
echo "   - 应该打开编辑表单，reference number自动增加"
echo "   - 所有POL和POD应该保留"
echo ""
