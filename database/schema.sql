-- LogiTrack Pro - MySQL 数据库表结构
-- 根据 Test.csv 设计
-- 创建日期: 2024-11-24

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS logitrack
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE logitrack;

-- 询价记录表
DROP TABLE IF EXISTS enquiry_records;

CREATE TABLE enquiry_records (
    -- 主键
    id VARCHAR(36) PRIMARY KEY COMMENT '主键 UUID',
    
    -- 日期字段
    enquiry_received_date DATE COMMENT '询价接收日期',
    issue_date DATE COMMENT '发布日期',
    cargo_ready_date DATE COMMENT '货物准备日期',
    first_quotation_sent DATE COMMENT '首次报价发送日期',
    
    -- 基本信息
    reference_number VARCHAR(50) NOT NULL UNIQUE COMMENT '参考编号',
    product VARCHAR(50) COMMENT '产品类型 (AIR/OCEAN)',
    status VARCHAR(50) COMMENT '状态 (New/Quoted/Booking)',
    
    -- 管理人员信息
    cn_pricing_admin VARCHAR(100) COMMENT '中国定价管理员',
    sales_country VARCHAR(100) COMMENT '销售国家',
    sales_office VARCHAR(100) COMMENT '销售办公室',
    sales_pic VARCHAR(100) COMMENT '销售负责人',
    assigned_cn_offices VARCHAR(100) COMMENT '指派的中国办公室',
    
    -- 货物信息
    cargo_type VARCHAR(50) COMMENT '货物类型 (AIR/OCEAN/LCL)',
    volume_cbm DECIMAL(10, 3) COMMENT '体积 (立方米)',
    quantity DECIMAL(10, 2) COMMENT '数量',
    quantity_unit VARCHAR(20) COMMENT '数量单位 (KG/PCS/CARTONS)',
    quantity_teu DECIMAL(10, 2) COMMENT '数量 (TEU)',
    commodity VARCHAR(255) COMMENT '商品名称',
    haz_special_equipment TEXT COMMENT '危险品/特殊设备说明',
    
    -- 路线信息
    pol VARCHAR(10) COMMENT '起运港代码',
    pod VARCHAR(10) COMMENT '目的港代码',
    pod_country VARCHAR(100) COMMENT '目的地国家',
    
    -- 业务分类
    core_non_core VARCHAR(20) COMMENT '核心/非核心业务',
    category VARCHAR(100) COMMENT '类别 (1-5)',
    
    -- 需求和备注
    additional_requirement TEXT COMMENT '额外要求',
    remark TEXT COMMENT '备注',
    
    -- 报价信息
    first_offer_ocean_frg VARCHAR(100) COMMENT '首次报价-海运费',
    first_offer_air_frg_kg VARCHAR(100) COMMENT '首次报价-空运费/KG',
    latest_offer_ocean_frg VARCHAR(100) COMMENT '最新报价-海运费',
    latest_offer_air_frg_kg VARCHAR(100) COMMENT '最新报价-空运费/KG',
    
    -- 预订状态
    booking_confirmed VARCHAR(20) COMMENT '预订确认 (Yes/Rejected/Pending)',
    rejected_reason TEXT COMMENT '拒绝原因',
    actual_reason TEXT COMMENT '实际原因',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_reference_number (reference_number),
    INDEX idx_status (status),
    INDEX idx_sales_country (sales_country),
    INDEX idx_product (product),
    INDEX idx_booking_confirmed (booking_confirmed),
    INDEX idx_enquiry_received_date (enquiry_received_date),
    INDEX idx_sales_office (sales_office),
    INDEX idx_pol_pod (pol, pod)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价记录表';

-- 查看表结构
DESCRIBE enquiry_records;

-- 统计信息查询（用于验证）
-- SELECT COUNT(*) as total_records FROM enquiry_records;
-- SELECT status, COUNT(*) as count FROM enquiry_records GROUP BY status;
-- SELECT sales_country, COUNT(*) as count FROM enquiry_records GROUP BY sales_country;
