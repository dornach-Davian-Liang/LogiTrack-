-- Migration: Add SALES_MANAGER role
-- Purpose: Create intermediate role between ADMIN_USER and OPERATING_USER
-- SALES_MANAGER: enquiries + master data + reports (same as old OPERATING_USER)
-- OPERATING_USER: enquiries + master data only (NO reports)
-- Date: 2026-04-13

INSERT INTO role (role_code, role_name, description)
VALUES ('SALES_MANAGER', 'Sales Manager', 'Sales Manager - enquiries + master data + reports, no settings')
ON DUPLICATE KEY UPDATE role_name='Sales Manager', description='Sales Manager - enquiries + master data + reports, no settings';
