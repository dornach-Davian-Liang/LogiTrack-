Param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,

    [string]$DbUser = "logitrack",
    [string]$DbPassword = "ldf123456",
    [string]$DbName = "logitrack",
    [int]$ApiPort = 8080,
    [int]$DbPort = 3306
)

$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Step {
    Param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    Param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Err {
    Param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Port {
    Param(
        [string]$HostName,
        [int]$Port
    )

    $result = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue
    return [bool]$result.TcpTestSucceeded
}

try {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "LogiTrack Remote Access Verification" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    Write-Step "Checking API TCP connectivity"
    if (Test-Port -HostName $ServerIp -Port $ApiPort) {
        Write-Ok "TCP $ApiPort is reachable"
    }
    else {
        throw "TCP $ApiPort is not reachable. Check server process, firewall and network route."
    }

    Write-Step "Checking API endpoint"
    $apiUrl = "http://$ServerIp`:$ApiPort/api/enquiries"
    $statusCode = & curl.exe -s -o NUL -w "%{http_code}" $apiUrl
    if ($statusCode -eq "200") {
        Write-Ok "API is reachable: $apiUrl (HTTP 200)"
    }
    else {
        throw "API returned HTTP $statusCode at $apiUrl"
    }

    Write-Step "Checking MySQL TCP connectivity"
    if (Test-Port -HostName $ServerIp -Port $DbPort) {
        Write-Ok "TCP $DbPort is reachable"
    }
    else {
        throw "TCP $DbPort is not reachable. Check MySQL bind-address, firewall and network route."
    }

    Write-Step "Checking MySQL login and query"
    $stderrPath = Join-Path $env:TEMP ("logitrack-mysql-check-" + [Guid]::NewGuid().ToString() + ".err.log")
    $env:MYSQL_PWD = $DbPassword
    $mysqlOutput = & mysql "--host=$ServerIp" "--port=$DbPort" "--user=$DbUser" "--database=$DbName" -e "SELECT COUNT(*) AS enquiry_count FROM enquiry;" 2> $stderrPath | Out-String
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    $mysqlExitCode = $LASTEXITCODE
    $stderrText = ""
    if (Test-Path $stderrPath) {
        $stderrText = Get-Content $stderrPath -Raw -ErrorAction SilentlyContinue
        Remove-Item $stderrPath -Force -ErrorAction SilentlyContinue
    }

    if ($mysqlExitCode -ne 0) {
        throw "MySQL login or query failed. Verify user/password and host grant (this remote machine IP must be authorized in MySQL)."
    }
    Write-Ok "MySQL login and sample query succeeded"

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Remote verification passed" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
catch {
    Write-Err $_.Exception.Message
    exit 1
}
