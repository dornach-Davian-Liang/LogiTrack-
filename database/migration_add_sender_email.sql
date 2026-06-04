-- Migration: Add sender_email column to enquiry table
-- Date: 2026-04-23

ALTER TABLE enquiry ADD COLUMN sender_email VARCHAR(200) NULL AFTER assigned_cn_office;
