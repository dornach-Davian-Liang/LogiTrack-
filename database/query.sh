#!/bin/bash
# LogiTrack 数据库快速查询工具

MYSQL_CMD="docker exec -i logitrack-mysql mysql -uroot -pldf123 logitrack"

echo "=================================="
echo "LogiTrack 数据库快速查询工具"
echo "=================================="
echo ""

case "$1" in
    stats)
        echo "📊 基本统计信息"
        $MYSQL_CMD -e "
        SELECT 'enquiry' as table_name, COUNT(*) as count FROM enquiry
        UNION ALL SELECT 'offer', COUNT(*) FROM offer
        UNION ALL SELECT 'country', COUNT(*) FROM country
        UNION ALL SELECT 'port', COUNT(*) FROM port;
        "
        ;;
    
    status)
        echo "📈 按状态统计"
        $MYSQL_CMD -e "
        SELECT status, COUNT(*) as count, 
               CONCAT(ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM enquiry),2),'%') as pct
        FROM enquiry GROUP BY status ORDER BY count DESC;
        "
        ;;
    
    recent)
        echo "🕐 最近10条询价"
        $MYSQL_CMD -e "
        SELECT reference_number, product_code, status, 
               DATE_FORMAT(issue_date, '%Y-%m-%d') as date
        FROM enquiry ORDER BY id DESC LIMIT 10;
        "
        ;;
    
    search)
        if [ -z "$2" ]; then
            echo "用法: $0 search <reference_number>"
            exit 1
        fi
        echo "🔍 搜索询价: $2"
        $MYSQL_CMD -e "
        SELECT e.*, c.country_name_en as country, so.name as office
        FROM enquiry e
        JOIN country c ON e.sales_country_id = c.id
        JOIN dict_sales_office so ON e.sales_office_id = so.id
        WHERE e.reference_number LIKE '%$2%';
        "
        ;;
    
    offers)
        if [ -z "$2" ]; then
            echo "用法: $0 offers <reference_number>"
            exit 1
        fi
        echo "💰 查询报价: $2"
        $MYSQL_CMD -e "
        SELECT o.*, e.reference_number
        FROM offer o
        JOIN enquiry e ON o.enquiry_id = e.id
        WHERE e.reference_number = '$2';
        "
        ;;
    
    verify)
        echo "✅ 运行完整验证"
        $MYSQL_CMD < /workspaces/LogiTrack-/database/verify_import.sql 2>&1 | grep -v Warning
        ;;
    
    backup)
        BACKUP_FILE="logitrack_backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "💾 备份数据库到: $BACKUP_FILE"
        docker exec logitrack-mysql mysqldump -uroot -pldf123 logitrack > "$BACKUP_FILE"
        echo "✅ 备份完成: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
        ;;
    
    *)
        echo "用法: $0 {stats|status|recent|search|offers|verify|backup} [参数]"
        echo ""
        echo "命令说明:"
        echo "  stats              - 显示基本统计信息"
        echo "  status             - 按状态统计"
        echo "  recent             - 最近10条询价"
        echo "  search <ref>       - 搜索询价记录"
        echo "  offers <ref>       - 查询报价记录"
        echo "  verify             - 运行完整验证"
        echo "  backup             - 备份数据库"
        echo ""
        echo "示例:"
        echo "  $0 stats"
        echo "  $0 search CN2401"
        echo "  $0 offers CN2401006-A"
        exit 1
        ;;
esac
