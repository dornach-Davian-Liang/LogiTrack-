Param(
    [switch]$InitSchema,
    [switch]$ForceKillPorts,
    [switch]$SkipFrontendInstall,
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "ldf123",
    [string]$DbName = "logitrack"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "logitrack-pro"
$DatabaseDir = Join-Path $Root "database"
$LogDir = Join-Path $Root ".logs"
$BackendLog = Join-Path $LogDir "backend.log"
$BackendErr = Join-Path $LogDir "backend.err.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
$FrontendErr = Join-Path $LogDir "frontend.err.log"
$BackendPort = 8080
$FrontendPort = 3000
$FrontendHost = "210.184.51.237"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Write-Step {
    Param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    Param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    Param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    Param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Require-Command {
    Param(
        [string]$Name,
        [string]$Hint
    )
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command '$Name'. $Hint"
    }
}

function Stop-ProcessByPort {
    Param([int]$Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($null -eq $connections) {
        return
    }

    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -and $procId -ne 0 -and $procId -ne $PID) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Warn "Port $Port released (PID=$procId)"
            }
            catch {
                Write-Warn "Cannot stop PID=$procId on port ${Port}: $($_.Exception.Message)"
            }
        }
    }
}

function Test-HttpReady {
    Param(
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )

    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                return $true
            }
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    return $false
}

function Ensure-MySqlAndSchema {
    Write-Step "Checking MySQL connection"

    & mysql "-u$MySqlUser" "-p$MySqlPassword" -e "SELECT 1;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL connection failed. Ensure service is running and credentials are correct (default root/ldf123)."
    }
    Write-Ok "MySQL is reachable"

    & mysql "-u$MySqlUser" "-p$MySqlPassword" -e "CREATE DATABASE IF NOT EXISTS $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database '$DbName'."
    }

    $tableCheck = & mysql "-u$MySqlUser" "-p$MySqlPassword" "--database=$DbName" "-Nse" "SHOW TABLES LIKE 'enquiry';"
    $needInit = $false
    if (-not $tableCheck) {
        $needInit = $true
    }
    if ($InitSchema) {
        $needInit = $true
    }

    if ($needInit) {
        # ⚠️  schema.sql 包含 DROP TABLE，执行后会清空所有业务数据！
        # 如果数据库里已有 enquiry 数据，强制要求二次确认
        $enquiryCount = (& mysql "-u$MySqlUser" "-p$MySqlPassword" "--database=$DbName" "-Nse" "SELECT COUNT(*) FROM enquiry 2>/dev/null;" 2>$null)
        if ($InitSchema -and $enquiryCount -and [int]$enquiryCount -gt 0) {
            Write-Host ""
            Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
            Write-Host "  ║  ⚠️   危险操作警告 - 即将清空所有业务数据！               ║" -ForegroundColor Red
            Write-Host "  ║  当前 enquiry 表有 $enquiryCount 条记录，执行 schema.sql 后将全部删除。  ║" -ForegroundColor Red
            Write-Host "  ║  若要恢复数据，需重新运行 database/import_enquiry_data.py  ║" -ForegroundColor Red
            Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
            Write-Host ""
            $confirm = Read-Host "  请输入 YES（全大写）确认清空并重建 schema，输入其他任何内容取消"
            if ($confirm -ne "YES") {
                Write-Warn "用户取消 schema 初始化，保留现有数据。"
                Write-Ok "Schema 已存在，跳过初始化"
                return
            }
        }

        Write-Step "Initializing schema"
        $schemaPath = Join-Path $DatabaseDir "schema.sql"
        if (-not (Test-Path $schemaPath)) {
            throw "Schema file not found: $schemaPath"
        }

        $schemaForMysql = ($schemaPath -replace "\\", "/")
        & mysql "-u$MySqlUser" "-p$MySqlPassword" "--database=$DbName" "--execute=source $schemaForMysql"
        if ($LASTEXITCODE -ne 0) {
            throw "Schema import failed. Please check database/schema.sql."
        }
        Write-Ok "Schema initialized"
    }
    else {
        Write-Ok "Schema already exists, skip initialization"
    }
}

function Start-Backend {
    Write-Step "Building and starting backend"

    Push-Location $BackendDir
    try {
        Stop-ProcessByPort -Port $BackendPort

        & mvn clean package -DskipTests
        if ($LASTEXITCODE -ne 0) {
            throw "Maven build failed. Check Java/Maven version and compiler output."
        }

        $jarPath = Join-Path $BackendDir "target\logitrack-backend-1.0.0.jar"
        if (-not (Test-Path $jarPath)) {
            throw "Backend JAR not found: $jarPath"
        }

        if (Test-Path $BackendLog) { Remove-Item $BackendLog -Force -ErrorAction SilentlyContinue }
        if (Test-Path $BackendErr) { Remove-Item $BackendErr -Force -ErrorAction SilentlyContinue }

        $proc = Start-Process -FilePath "java" -ArgumentList "-jar", "target/logitrack-backend-1.0.0.jar" -WorkingDirectory $BackendDir -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendErr -PassThru
        Write-Ok "Backend process started (PID=$($proc.Id))"

        if (-not (Test-HttpReady -Url "http://127.0.0.1:$BackendPort/api/enquiries" -TimeoutSeconds 90)) {
            throw "Backend health check timeout. Check logs: $BackendLog / $BackendErr"
        }

        Write-Ok "Backend is ready at http://127.0.0.1:$BackendPort"
    }
    finally {
        Pop-Location
    }
}

function Install-FrontendDeps {
    if ($SkipFrontendInstall) {
        Write-Warn "Skip frontend dependency installation (-SkipFrontendInstall)"
        return
    }

    Write-Step "Installing frontend dependencies"
    Push-Location $FrontendDir
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "npm install failed, retry with --legacy-peer-deps"
            & npm install --legacy-peer-deps
            if ($LASTEXITCODE -ne 0) {
                throw "npm install still failed. Check network or npm logs."
            }
        }

        Write-Ok "Frontend dependencies installed"
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Step "Starting frontend"
    Push-Location $FrontendDir
    try {
        Stop-ProcessByPort -Port $FrontendPort

        if (Test-Path $FrontendLog) { Remove-Item $FrontendLog -Force -ErrorAction SilentlyContinue }
        if (Test-Path $FrontendErr) { Remove-Item $FrontendErr -Force -ErrorAction SilentlyContinue }

        Write-Step "Building frontend for preview mode"
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed. Check npm / Vite output."
        }

        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run preview -- --host 0.0.0.0 --port 3000 --strictPort" -WorkingDirectory $FrontendDir -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendErr -PassThru
        Write-Ok "Frontend preview process started (PID=$($proc.Id))"

        Start-Sleep -Seconds 3
        $frontReady = Test-HttpReady -Url "http://127.0.0.1:$FrontendPort" -TimeoutSeconds 60
        if (-not $frontReady) {
            if (Test-Path $FrontendErr) {
                $errText = Get-Content $FrontendErr -Raw -ErrorAction SilentlyContinue
                if ($errText -match 'Could not resolve "react-is"') {
                    Write-Warn "Missing react-is detected, installing and restarting frontend"
                    & npm install react-is --save --legacy-peer-deps
                    if ($LASTEXITCODE -eq 0) {
                        Stop-ProcessByPort -Port $FrontendPort
                        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $FrontendDir -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendErr -PassThru
                        Start-Sleep -Seconds 3
                        $frontReady = Test-HttpReady -Url "http://127.0.0.1:$FrontendPort" -TimeoutSeconds 60
                    }
                }
            }
        }

        if (-not $frontReady) {
            throw "Frontend health check timeout. Check logs: $FrontendLog / $FrontendErr"
        }

        Write-Ok "Frontend preview is ready at http://${FrontendHost}:$FrontendPort"
    }
    finally {
        Pop-Location
    }
}

function Show-Troubleshooting {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "Common startup issue handling" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "1) Port conflicts: run .\start-all.ps1 -ForceKillPorts" -ForegroundColor Gray
    Write-Host "2) npm dependency conflicts: script auto retries with --legacy-peer-deps" -ForegroundColor Gray
    Write-Host "3) Missing react-is: script auto installs and restarts frontend" -ForegroundColor Gray
    Write-Host "4) Missing tables: run .\start-all.ps1 -InitSchema" -ForegroundColor Gray
    Write-Host "5) Logs: .logs\backend.log, .logs\backend.err.log, .logs\frontend.log, .logs\frontend.err.log" -ForegroundColor Gray
}

try {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "LogiTrack Windows one-click startup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    Require-Command -Name "java" -Hint "Install Java 17+ and add to PATH."
    Require-Command -Name "mvn" -Hint "Install Maven 3.6+ and add to PATH."
    Require-Command -Name "node" -Hint "Install Node.js 18+ and add to PATH."
    Require-Command -Name "npm" -Hint "Install npm (usually bundled with Node.js)."
    Require-Command -Name "mysql" -Hint "Install MySQL client and add to PATH."

    if ($ForceKillPorts) {
        Write-Step "Releasing common ports"
        Stop-ProcessByPort -Port $BackendPort
        Stop-ProcessByPort -Port $FrontendPort
    }

    Ensure-MySqlAndSchema
    Start-Backend
    Install-FrontendDeps
    Start-Frontend

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Startup completed" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Frontend: http://${FrontendHost}:$FrontendPort" -ForegroundColor White
    Write-Host "Backend:  http://127.0.0.1:$BackendPort" -ForegroundColor White
    Write-Host "Database: localhost:3306/$DbName" -ForegroundColor White
    Write-Host "Logs:     $LogDir" -ForegroundColor White

    Show-Troubleshooting
}
catch {
    Write-Err $_.Exception.Message
    Show-Troubleshooting
    exit 1
}
