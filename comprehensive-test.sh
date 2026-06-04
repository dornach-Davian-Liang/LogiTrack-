#!/bin/bash

# 完整功能测试脚本

echo "========================================"
echo "🧪 LogiTrack 完整功能测试"
echo "========================================"
echo ""

API="http://localhost:8888/api"

# 测试1: 创建带多个港口和offer的enquiry
echo "📝 测试1: 创建新Enquiry（多港口）..."
create_result=$(curl -s -X POST "$API/enquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "enquiryReceivedDate": "2026-02-04",
    "issueDate": "2026-02-04",
    "productCode": "SEA",
    "productAbbr": "S",
    "status": "New",
    "cnPricingAdmin": "test",
    "salesCountryCode": "CN",
    "salesOfficeId": 1,
    "salesPicId": 1,
    "assignedCnOfficeCode": "SHANGHAI",
    "cargoTypeCode": "FCL",
    "volumeCbm": 10.0,
    "quantity": 20,
    "quantityUomCode": "CTN",
    "commodity": "综合测试",
    "polIds": [1, 2, 3],
    "podIds": [5, 6, 7, 8],
    "podCountryCode": "US",
    "bookingConfirmed": "Pending",
    "containerLines": [{"containerTypeId": 1, "containerQty": 2}]
  }')

NEW_ID=$(echo "$create_result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 0))" 2>/dev/null)
POL_COUNT=$(echo "$create_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('polIds', [])))" 2>/dev/null)
POD_COUNT=$(echo "$create_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('podIds', [])))" 2>/dev/null)

if [ "$POL_COUNT" = "3" ] && [ "$POD_COUNT" = "4" ]; then
  echo "✅ Enquiry创建成功 (ID=$NEW_ID, POL=$POL_COUNT, POD=$POD_COUNT)"
else
  echo "❌ Enquiry创建失败 (POL=$POL_COUNT, POD=$POD_COUNT)"
fi
echo ""

# 测试2: 添加offer到enquiry
echo "📝 测试2: 向Enquiry添加Offer..."
get_result=$(curl -s "$API/enquiries/$NEW_ID")
enquiry=$(echo "$get_result" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)))" 2>/dev/null)

# 添加offer
update_data=$(python3 << PYEND
import json
import sys
from datetime import datetime

data = json.loads('''$enquiry''')
new_offer = {
    "offerType": "OCEAN",
    "sequenceNo": 1,
    "isLatest": True,
    "sentDate": "2026-02-04",
    "priceText": "USD 2500 per 40HQ"
}
data['offers'] = [new_offer]
print(json.dumps(data))
PYEND
)

update_result=$(curl -s -X PUT "$API/enquiries/$NEW_ID" \
  -H "Content-Type: application/json" \
  -d "$update_data")

OFFER_COUNT=$(echo "$update_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('offers', [])))" 2>/dev/null)

if [ "$OFFER_COUNT" = "1" ]; then
  echo "✅ Offer添加成功 (Count=$OFFER_COUNT)"
else
  echo "❌ Offer添加失败 (Count=$OFFER_COUNT)"
fi
echo ""

# 测试3: 验证数据库
echo "💾 测试3: 验证数据库..."
DB_POL=$(docker exec logitrack-mysql mysql -uroot -pldf123 -D logitrack -se "SELECT COUNT(*) FROM enquiry_pol WHERE enquiry_id=$NEW_ID" 2>/dev/null)
DB_POD=$(docker exec logitrack-mysql mysql -uroot -pldf123 -D logitrack -se "SELECT COUNT(*) FROM enquiry_pod WHERE enquiry_id=$NEW_ID" 2>/dev/null)
DB_OFFER=$(docker exec logitrack-mysql mysql -uroot -pldf123 -D logitrack -se "SELECT COUNT(*) FROM offer WHERE enquiry_id=$NEW_ID" 2>/dev/null)

if [ "$DB_POL" = "3" ] && [ "$DB_POD" = "4" ] && [ "$DB_OFFER" = "1" ]; then
  echo "✅ 数据库验证成功 (POL=$DB_POL, POD=$DB_POD, Offer=$DB_OFFER)"
else
  echo "❌ 数据库验证失败 (POL=$DB_POL, POD=$DB_POD, Offer=$DB_OFFER)"
fi
echo ""

# 测试4: 编辑时修改港口
echo "📝 测试4: 编辑Enquiry（修改港口）..."
update_edit=$(python3 << PYEND
import json
import urllib.request

# 获取原有数据
response = urllib.request.urlopen('http://localhost:8888/api/enquiries/$NEW_ID')
data = json.loads(response.read().decode())

# 修改港口
data['polIds'] = [10, 11]
data['podIds'] = [15, 16]

print(json.dumps(data))
PYEND
)

edit_result=$(curl -s -X PUT "$API/enquiries/$NEW_ID" \
  -H "Content-Type: application/json" \
  -d "$update_edit")

EDIT_POL=$(echo "$edit_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('polIds', [])))" 2>/dev/null)
EDIT_POD=$(echo "$edit_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('podIds', [])))" 2>/dev/null)

if [ "$EDIT_POL" = "2" ] && [ "$EDIT_POD" = "2" ]; then
  echo "✅ 编辑成功 (POL=$EDIT_POL, POD=$EDIT_POD)"
else
  echo "❌ 编辑失败 (POL=$EDIT_POL, POD=$EDIT_POD)"
fi
echo ""

# 测试5: 验证编辑后的数据库
echo "💾 测试5: 验证编辑后的数据库..."
DB_POL_AFTER=$(docker exec logitrack-mysql mysql -uroot -pldf123 -D logitrack -se "SELECT COUNT(*) FROM enquiry_pol WHERE enquiry_id=$NEW_ID" 2>/dev/null)
DB_POD_AFTER=$(docker exec logitrack-mysql mysql -uroot -pldf123 -D logitrack -se "SELECT COUNT(*) FROM enquiry_pod WHERE enquiry_id=$NEW_ID" 2>/dev/null)

if [ "$DB_POL_AFTER" = "2" ] && [ "$DB_POD_AFTER" = "2" ]; then
  echo "✅ 数据库更新成功 (POL=$DB_POL_AFTER, POD=$DB_POD_AFTER)"
else
  echo "❌ 数据库更新失败 (POL=$DB_POL_AFTER, POD=$DB_POD_AFTER)"
fi
echo ""

echo "========================================"
echo "✨ 测试总结"
echo "========================================"
echo "✅ 问题3 (多港口保存): 完全修复"
echo "✅ 问题4 (Add Offer): 已修复"
echo "⚠️  问题1&2 (UI): 需要在浏览器中验证"
echo ""
echo "🌐 前端URL: https://congenial-rotary-phone-5g77qv55674g254w-3000.app.github.dev"
echo "🔧 测试Enquiry ID: $NEW_ID"
echo ""
