# Document Organization Script
# Purpose: Move all Markdown documents to corresponding docs subdirectories

$ErrorActionPreference = "Continue"
$workspace = "c:\logitrack\LogiTrack--update-status-report-20260126023903"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LogiTrack Document Organization Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 01-getting-started
$gettingStartedFiles = @(
    "QUICKSTART.md",
    "QUICK_REFERENCE.md",
    "STARTUP.md",
    "本地部署完整指南.md"
)

Write-Host "[1/6] Moving getting-started documents..." -ForegroundColor Yellow
foreach ($file in $gettingStartedFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\01-getting-started\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# 02-deployment
$deploymentFiles = @(
    "DEPLOYMENT.md",
    "WINDOWS_DEPLOYMENT_GUIDE.md",
    "AWS_DEPLOYMENT_README.md",
    "AWS_EC2_DEPLOYMENT_GUIDE.md",
    "AWS_QUICK_REFERENCE.md",
    "DEPLOYMENT_EXECUTION_GUIDE.md",
    "START_DEPLOYMENT_NOW.md",
    "FIND_AWS_KEYPAIR.md",
    "CODESPACES_ACCESS_GUIDE.md",
    "DELIVERY_CHECKLIST_20260225.md"
)

Write-Host "[2/6] Moving deployment documents..." -ForegroundColor Yellow
foreach ($file in $deploymentFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\02-deployment\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# 03-features
$featureFiles = @(
    "CORE_DESIGN_QUICK_REFERENCE.md",
    "DATE_PICKER_DESIGN_GUIDE.md",
    "REPORT_SETTINGS_DESIGN.md",
    "enquiry_mysql_design_spec.md",
    "FRONTEND_REQUIREMENTS.md",
    "OPERATOR_PERMISSIONS_ANALYSIS.md",
    "AUDIT_LOG_QUICK_START.md",
    "SERVER_ROLE_EXPLANATION_DMZ_IP_MAPPING.md"
)

Write-Host "[3/6] Moving feature design documents..." -ForegroundColor Yellow
foreach ($file in $featureFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\03-features\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# 04-testing
$testingFiles = @(
    "TEST_CHECKLIST.md",
    "TEST_VERIFICATION.md",
    "ACCEPTANCE_TEST_CHECKLIST.md",
    "BROWSER_TEST_GUIDE.md",
    "BROWSER_MANUAL_TEST_GUIDE.md",
    "FRONTEND_TEST_GUIDE.md",
    "RBAC_TEST_GUIDE.md",
    "QUICK_TEST_GUIDE.md",
    "REPORT_MODULE_QUICK_TEST_GUIDE.md",
    "AUDIT_LOG_TEST_SUMMARY.md",
    "PORTIDS_DISPLAY_TEST_GUIDE.md",
    "BUGFIX_EDIT_ENQUIRY_QUICK_TEST.md",
    "NEW_FEATURES_VERIFICATION_GUIDE.md",
    "VERIFICATION_START_HERE.md",
    "SYSTEM_STARTUP_VERIFICATION_20260225.md"
)

Write-Host "[4/6] Moving testing documents..." -ForegroundColor Yellow
foreach ($file in $testingFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\04-testing\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# 05-bugfixes
$bugfixFiles = @(
    "BUGFIX_REPORT.md",
    "BUGFIX_ANALYSIS_REPORT.md",
    "BUGFIX_DEBUG_SUMMARY.md",
    "BUGFIX_REPORT_20260204.md",
    "BUG_FIX_REPORT_20260202.md",
    "BUG_FIX_FINAL_REPORT.md",
    "BUG_FIX_COMPLETION_REPORT.md",
    "COPY_INCREASE_FIX_REPORT.md",
    "ENQUIRY_EDIT_BUG_FIX_REPORT.md",
    "BUGFIX_TIMEZONE_OFFSET_REPORT.md",
    "BUGFIX_EDIT_ENQUIRY_500_REPORT_20260225.md",
    "BUGFIX_EDIT_ENQUIRY_FINAL_SUMMARY_20260225.md",
    "README_BUGFIX_COMPLETE_20260225.md",
    "AUDIT_LOG_FIX_REPORT_20260224.md",
    "AUDIT_LOG_PORTIDS_FIX_REPORT.md",
    "AUDIT_LOG_PERMISSION_FIX_REPORT.md"
)

Write-Host "[5/6] Moving bugfix documents..." -ForegroundColor Yellow
foreach ($file in $bugfixFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\05-bugfixes\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

# 06-implementation-reports
$implementationFiles = @(
    "MYSQL_MIGRATION_COMPLETE.md",
    "IMPLEMENTATION_ROADMAP.md",
    "IMPLEMENTATION_SUMMARY.md",
    "FRONTEND_IMPLEMENTATION_REPORT.md",
    "FRONTEND_IMPLEMENTATION_UPDATE.md",
    "REPORT_MODULE_IMPLEMENTATION_REPORT.md",
    "REPORT_MODULE_COMPLETION_REPORT.md",
    "REPORT_SETTINGS_IMPLEMENTATION.md",
    "RBAC_AUDIT_IMPLEMENTATION_REPORT.md",
    "DASHBOARD_ENHANCED_REPORT.md",
    "COMPARISON_FEATURE_REPORT.md",
    "MULTI_PORT_OPTIMIZATION_REPORT.md",
    "PERFORMANCE_OPTIMIZATION_REPORT.md",
    "DATE_PICKER_IMPLEMENTATION_COMPLETE.md",
    "DATE_PICKER_REDESIGN_REPORT.md",
    "I18N_COMPLETE_REPORT.md",
    "ENQUIRY_LIST_MODAL_I18N_REPORT.md",
    "AUDIT_LOG_I18N_COMPLETE_REPORT.md",
    "AUDIT_LOG_ENHANCEMENT_REPORT.md",
    "AUDIT_LOG_DETAILS_MODAL_FEATURE.md",
    "AUDIT_LOG_DEBUG_REPORT.md",
    "AUDIT_LOG_E2E_TEST_REPORT.md",
    "SESSION_PERSISTENCE_AND_AVATAR_FIX_REPORT.md",
    "PORTIDS_BEFORE_AFTER_COMPARISON.md",
    "E2E_TEST_REPORT_MULTIPORT.md",
    "FEATURE_VERIFICATION_REPORT.md",
    "TEST_VERIFICATION_REPORT_20260202.md",
    "COMPLETION_REPORT_20260202.md",
    "FINAL_COMPLETION_REPORT.md",
    "FINAL_VERIFICATION_REPORT_20260225.md",
    "QUICK_COMPLETION_CHECKLIST.md",
    "FIXES_SUMMARY.md",
    "CODE_CHANGES.md",
    "CODE_CHANGES_DETAIL.md",
    "STATUS_REPORT.md",
    "SESSION_SUMMARY_20260128.md",
    "README_REPORT_SETTINGS.md",
    "DOCUMENTATION_INDEX.md",
    "CN_ADMIN_AND_CORE_IMPLEMENTATION_REPORT_20260226.md"
)

Write-Host "[6/6] Moving implementation reports..." -ForegroundColor Yellow
foreach ($file in $implementationFiles) {
    $source = Join-Path $workspace $file
    $dest = Join-Path $workspace "docs\06-implementation-reports\$file"
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Document organization complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documents organized into:" -ForegroundColor White
Write-Host "  docs/01-getting-started/" -ForegroundColor Gray
Write-Host "  docs/02-deployment/" -ForegroundColor Gray
Write-Host "  docs/03-features/" -ForegroundColor Gray
Write-Host "  docs/04-testing/" -ForegroundColor Gray
Write-Host "  docs/05-bugfixes/" -ForegroundColor Gray
Write-Host "  docs/06-implementation-reports/" -ForegroundColor Gray
Write-Host ""
Write-Host "View documentation index: docs\README.md" -ForegroundColor Cyan
Write-Host "View code change history: MILESTONE_CHANGELOG.md" -ForegroundColor Cyan
Write-Host ""
