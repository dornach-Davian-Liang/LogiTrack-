$base = "http://localhost:8080/api/master"
$h = @{"Content-Type"="application/json; charset=utf-8"}
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ?�间?��?缀，避??unique code ?��?
$ts = Get-Date -Format "hhmmss"
Write-Host "?�间?? $ts"

function To-Json($obj) { $obj | ConvertTo-Json -Depth 5 -Compress }

function Test-Result($label, $condition, $detail="") {
    if ($condition) { Write-Host "  OK $label $detail" -ForegroundColor Green }
    else            { Write-Host "  FAIL $label $detail" -ForegroundColor Red }
}

# =============================================
# 1. COUNTRY MANAGEMENT
# =============================================
Write-Host "`n========== [1/4] Country Management ==========" -ForegroundColor Cyan

# CREATE
Write-Host "`n[CREATE] POST /api/master/countries"
$body = To-Json @{countryCode="C$ts"; countryNameEn="TestCountry$ts"; countryNameCn="测�??�家"; isActive=$true; isCore=$false}
$c = Invoke-RestMethod -Uri "$base/countries" -Method POST -Body $body -Headers $h
Test-Result "?��?" ($c.id -gt 0 -and $c.countryCode -eq "C$ts" -and $c.isActive -eq $true -and $c.isCore -eq $false) "id=$($c.id), code=$($c.countryCode), isActive=$($c.isActive), isCore=$($c.isCore)"

# GET by ID
Write-Host "`n[READ] GET /api/master/countries/$($c.id)"
$cg = Invoke-RestMethod -Uri "$base/countries/$($c.id)" -Method GET
Test-Result "?�询?�条" ($cg.id -eq $c.id -and $cg.countryCode -eq "C$ts") "code=$($cg.countryCode)"

# UPDATE all fields
Write-Host "`n[UPDATE] PUT /api/master/countries/$($c.id)  (?��?段修??"
$upd = To-Json @{countryCode="U$ts"; countryNameEn="UpdatedCountry$ts"; countryNameCn="?�新?�家"; isActive=$false; isCore=$true}
$cu = Invoke-RestMethod -Uri "$base/countries/$($c.id)" -Method PUT -Body $upd -Headers $h
Test-Result "countryCode" ($cu.countryCode -eq "U$ts") "=> $($cu.countryCode)"
Test-Result "countryNameEn" ($cu.countryNameEn -eq "UpdatedCountry$ts") "=> $($cu.countryNameEn)"
Test-Result "isActive false" ($cu.isActive -eq $false) "=> $($cu.isActive)"
Test-Result "isCore true" ($cu.isCore -eq $true) "=> $($cu.isCore)"

# DELETE
Write-Host "`n[DELETE] DELETE /api/master/countries/$($c.id)"
Invoke-RestMethod -Uri "$base/countries/$($c.id)" -Method DELETE
$del404 = $false
try { Invoke-RestMethod -Uri "$base/countries/$($c.id)" -Method GET } catch { $del404 = $true }
Test-Result "已�???404)" $del404

# LIST (smoke)
Write-Host "`n[LIST] GET /api/master/countries"
$list = Invoke-RestMethod -Uri "$base/countries" -Method GET
Test-Result "?�表?�数>0" ($list.Count -gt 0) "count=$($list.Count)"

# =============================================
# 2. PORT MANAGEMENT
# =============================================
Write-Host "`n========== [2/4] Port Management ==========" -ForegroundColor Cyan

# CREATE
Write-Host "`n[CREATE] POST /api/master/ports"
$body = To-Json @{portCode="P$ts"; portName="TestPort$ts"; portType="SEA"; countryCode="CN"; city="TestCity"; isActive=$true}
$p = Invoke-RestMethod -Uri "$base/ports" -Method POST -Body $body -Headers $h
Test-Result "?��?" ($p.id -gt 0 -and $p.portCode -eq "P$ts" -and $p.portType -eq "SEA") "id=$($p.id), code=$($p.portCode), type=$($p.portType)"

# GET by ID
Write-Host "`n[READ] GET /api/master/ports/$($p.id)"
$pg = Invoke-RestMethod -Uri "$base/ports/$($p.id)" -Method GET
Test-Result "?�询?�条" ($pg.id -eq $p.id) "portName=$($pg.portName)"

# UPDATE all fields
Write-Host "`n[UPDATE] PUT /api/master/ports/$($p.id)  (?��?段修??"
$upd = To-Json @{portCode="A$ts"; portName="UpdatedPort$ts"; portType="AIR"; countryCode="DE"; city="UpdateCity"; isActive=$false}
$pu = Invoke-RestMethod -Uri "$base/ports/$($p.id)" -Method PUT -Body $upd -Headers $h
Test-Result "portCode" ($pu.portCode -eq "A$ts") "=> $($pu.portCode)"
Test-Result "portName" ($pu.portName -eq "UpdatedPort$ts") "=> $($pu.portName)"
Test-Result "portType AIR" ($pu.portType -eq "AIR") "=> $($pu.portType)"
Test-Result "countryCode DE" ($pu.countryCode -eq "DE") "=> $($pu.countryCode)"
Test-Result "city" ($pu.city -eq "UpdateCity") "=> $($pu.city)"
Test-Result "isActive false" ($pu.isActive -eq $false) "=> $($pu.isActive)"
Invoke-RestMethod -Uri "$base/ports/$($p.id)" -Method DELETE
$del404 = $false
try { Invoke-RestMethod -Uri "$base/ports/$($p.id)" -Method GET } catch { $del404 = $true }
Test-Result "已�???404)" $del404

# LIST
Write-Host "`n[LIST] GET /api/master/ports"
$list = Invoke-RestMethod -Uri "$base/ports" -Method GET
Test-Result "?�表?�数>0" ($list.Count -gt 0) "count=$($list.Count)"

# =============================================
# 3. SALES PIC MANAGEMENT
# =============================================
Write-Host "`n========== [3/4] Sales PIC Management ==========" -ForegroundColor Cyan

# ?��?一个�?法�? salesOfficeId
$offices = Invoke-RestMethod -Uri "$base/sales-offices" -Method GET
$offA = $offices[0]; $offB = $offices[1]
Write-Host "  (使用 officeId=$($offA.id) code=$($offA.code) ??officeId=$($offB.id) code=$($offB.code))"

# CREATE
Write-Host "`n[CREATE] POST /api/master/sales-pics"
$body = To-Json @{name="TestPic$ts"; countryCode="CN"; salesOfficeId=$offA.id; isActive=$true}
$s = Invoke-RestMethod -Uri "$base/sales-pics" -Method POST -Body $body -Headers $h
Test-Result "?��?" ($s.id -gt 0 -and $s.name -eq "TestPic$ts" -and $s.salesOfficeId -eq $offA.id) "id=$($s.id), name=$($s.name), officeId=$($s.salesOfficeId)"

# GET by ID
Write-Host "`n[READ] GET /api/master/sales-pics/$($s.id)"
$sg = Invoke-RestMethod -Uri "$base/sales-pics/$($s.id)" -Method GET
Test-Result "?�询?�条" ($sg.id -eq $s.id -and $sg.name -eq "TestPic$ts") "name=$($sg.name), officeName=$($sg.salesOfficeName)"

# UPDATE all fields
Write-Host "`n[UPDATE] PUT /api/master/sales-pics/$($s.id)  (?��?段修??"
$upd = To-Json @{name="UpdatedPic$ts"; countryCode="DE"; salesOfficeId=$offB.id; isActive=$false}
$su = Invoke-RestMethod -Uri "$base/sales-pics/$($s.id)" -Method PUT -Body $upd -Headers $h
Test-Result "name" ($su.name -eq "UpdatedPic$ts") "=> $($su.name)"
Test-Result "countryCode DE" ($su.countryCode -eq "DE") "=> $($su.countryCode)"
Test-Result "salesOfficeId changed" ($su.salesOfficeId -eq $offB.id) "=> $($su.salesOfficeId)"
Test-Result "isActive false" ($su.isActive -eq $false) "=> $($su.isActive)"
Invoke-RestMethod -Uri "$base/sales-pics/$($s.id)" -Method DELETE
$del404 = $false
try { Invoke-RestMethod -Uri "$base/sales-pics/$($s.id)" -Method GET } catch { $del404 = $true }
Test-Result "已�???404)" $del404

# LIST
Write-Host "`n[LIST] GET /api/master/sales-pics"
$list = Invoke-RestMethod -Uri "$base/sales-pics" -Method GET
Test-Result "?�表?�数>0" ($list.Count -gt 0) "count=$($list.Count)"

# =============================================
# 4. CONTAINER TYPE MANAGEMENT
# =============================================
Write-Host "`n========== [4/4] Container Type Management ==========" -ForegroundColor Cyan

# CREATE
Write-Host "`n[CREATE] POST /api/master/container-types"
$body = To-Json @{containerCode="Z$ts"; containerName="TestContainer$ts"; teuValue=3.5; lengthFeet=99; isSpecial=$true; isActive=$true}
$ct = Invoke-RestMethod -Uri "$base/container-types" -Method POST -Body $body -Headers $h
Test-Result "?��?" ($ct.id -gt 0 -and $ct.containerCode -eq "Z$ts" -and $ct.teuValue -eq 3.5) "id=$($ct.id), code=$($ct.containerCode), teu=$($ct.teuValue), special=$($ct.isSpecial)"

# GET by ID
Write-Host "`n[READ] GET /api/master/container-types/$($ct.id)"
$ctg = Invoke-RestMethod -Uri "$base/container-types/$($ct.id)" -Method GET
Test-Result "?�询?�条" ($ctg.id -eq $ct.id -and $ctg.containerCode -eq "Z$ts") "name=$($ctg.containerName)"

# UPDATE all fields
Write-Host "`n[UPDATE] PUT /api/master/container-types/$($ct.id)  (?��?段修??"
$upd = To-Json @{containerCode="Y$ts"; containerName="UpdatedContainer$ts"; teuValue=4.0; lengthFeet=88; isSpecial=$false; isActive=$false}
$ctu = Invoke-RestMethod -Uri "$base/container-types/$($ct.id)" -Method PUT -Body $upd -Headers $h
Test-Result "containerCode" ($ctu.containerCode -eq "Y$ts") "=> $($ctu.containerCode)"
Test-Result "containerName" ($ctu.containerName -eq "UpdatedContainer$ts") "=> $($ctu.containerName)"
Test-Result "teuValue 4.0" ($ctu.teuValue -eq 4.0) "=> $($ctu.teuValue)"
Test-Result "lengthFeet 88" ($ctu.lengthFeet -eq 88) "=> $($ctu.lengthFeet)"
Test-Result "isSpecial false" ($ctu.isSpecial -eq $false) "=> $($ctu.isSpecial)"
Test-Result "isActive false" ($ctu.isActive -eq $false) "=> $($ctu.isActive)"

# DELETE
Write-Host "`n[DELETE] DELETE /api/master/container-types/$($ct.id)"
Invoke-RestMethod -Uri "$base/container-types/$($ct.id)" -Method DELETE
$del404 = $false
try { Invoke-RestMethod -Uri "$base/container-types/$($ct.id)" -Method GET } catch { $del404 = $true }
Test-Result "已�???404)" $del404

# LIST
Write-Host "`n[LIST] GET /api/master/container-types"
$list = Invoke-RestMethod -Uri "$base/container-types" -Method GET
Test-Result "?�表?�数>0" ($list.Count -gt 0) "count=$($list.Count)"

Write-Host "`n========== 测�?完�? ==========" -ForegroundColor Cyan
