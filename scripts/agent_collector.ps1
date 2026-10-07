<#
==============================================================================
INFRAASSET IT - AGENTE DE COLETA NATIVO POWERSHELL (WINDOWS 10/11 & SERVERS)
==============================================================================
Não requer instalação de Python. Executável nativamente via GPO ou Agendador de Tarefas.
Comando de teste rápido:
  powershell -ExecutionPolicy Bypass -File .\agent_collector.ps1 -ServerUrl "http://localhost:3000"
==============================================================================
#>

param (
    [string]$ServerUrl = "http://localhost:3000",
    [string]$AgentToken = "infra_asset_token_secret_2026",
    [string]$ClientCompany = "Hospital São Lucas",
    [switch]$Quiet
)

$ErrorActionPreference = "SilentlyContinue"

# 1. Informações Básicas
$hostname = $env:COMPUTERNAME
$loggedUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# 2. Sistema Operacional
$osInfo = Get-CimInstance -ClassName Win32_OperatingSystem
$osName = "Windows"
$osVersion = $osInfo.Caption -replace "Microsoft Windows ", ""
$osBuild = $osInfo.Version
$osArch = $osInfo.OSArchitecture

# 3. Processador (CPU)
$cpuInfo = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
$cpuModel = $cpuInfo.Name.Trim()
$cpuPhysical = (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property NumberOfCores -Sum).Sum
$cpuLogical = (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
$cpuFreq = [math]::Round($cpuInfo.MaxClockSpeed / 1000, 2)
$cpuLoad = $cpuInfo.LoadPercentage
if (-not $cpuLoad) { $cpuLoad = 15 }

# 4. Memória RAM
$totalRamBytes = (Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory
$freeRamBytes = $osInfo.FreePhysicalMemory * 1024
$usedRamBytes = $totalRamBytes - $freeRamBytes

$totalRamGB = [math]::Round($totalRamBytes / 1GB, 2)
$usedRamGB = [math]::Round($usedRamBytes / 1GB, 2)
$freeRamGB = [math]::Round($freeRamBytes / 1GB, 2)
$ramPercent = [math]::Round(($usedRamBytes / $totalRamBytes) * 100, 1)

# 5. Armazenamento (Discos e Volumes)
$disks = @()
$drives = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType = 3"
foreach ($d in $drives) {
    if ($d.Size -gt 0) {
        $totGB = [math]::Round($d.Size / 1GB, 2)
        $freeGB = [math]::Round($d.FreeSpace / 1GB, 2)
        $usedGB = [math]::Round($totGB - $freeGB, 2)
        $pct = [math]::Round(($usedGB / $totGB) * 100, 1)
        
        $disks += @{
            device = $d.DeviceID
            mountpoint = $d.DeviceID + "\"
            fstype = $d.FileSystem
            total_gb = $totGB
            used_gb = $usedGB
            free_gb = $freeGB
            percent = $pct
        }
    }
}

# 6. Rede (NICs, IPs e MAC)
$interfaces = @()
$primaryIP = "127.0.0.1"
$primaryMAC = "00:00:00:00:00:00"

$netAdapters = Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null }
foreach ($adapter in $netAdapters) {
    $ip = $adapter.IPv4Address.IPAddress
    $alias = $adapter.InterfaceAlias
    $mac = $adapter.NetAdapter.MacAddress
    
    if (-not $primaryIP -or $primaryIP -eq "127.0.0.1") {
        $primaryIP = $ip
        $primaryMAC = $mac
    }
    
    $interfaces += @{
        interface_name = $alias
        ip_address = $ip
        netmask = "255.255.255.0"
        mac_address = $mac
        is_up = $true
    }
}

# Fallback se Get-NetIPConfiguration não retornar
if ($primaryMAC -eq "00:00:00:00:00:00") {
    $alt = Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled = True" | Select-Object -First 1
    if ($alt) {
        $primaryIP = $alt.IPAddress[0]
        $primaryMAC = $alt.MACAddress
    }
}

# 7. Tipo de Máquina (Notebook vs Desktop vs Server)
$isServer = (Get-CimInstance -ClassName Win32_OperatingSystem).ProductType -ne 1
$battery = Get-CimInstance -ClassName Win32_Battery
$machineType = "desktop"
if ($isServer) {
    $machineType = "server"
} elseif ($battery) {
    $machineType = "notebook"
}

# 8. Uptime
$bootTime = $osInfo.LastBootUpTime
$uptimeSpan = (Get-Date) - $bootTime
$uptimeSeconds = [math]::Floor($uptimeSpan.TotalSeconds)

# 9. IP Público
$publicIP = "N/A"
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 2).Trim()
} catch {
    $publicIP = "Interno"
}

# 10. Montar JSON
$cleanMac = ($primaryMAC -replace "[:-]", "").ToUpper()
$cleanHost = ($hostname -replace "[^a-zA-Z0-9]", "").ToUpper()
$uniqueId = "$($cleanMac)_$($cleanHost)"

$payload = @{
    id = $uniqueId
    hostname = $hostname
    logged_user = $loggedUser
    machine_type = $machineType
    os = @{
        name = $osName
        version = $osVersion
        build = $osBuild
        arch = $osArch
    }
    cpu = @{
        model = $cpuModel
        cores_physical = $cpuPhysical
        cores_logical = $cpuLogical
        freq_ghz = $cpuFreq
        usage_percent = $cpuLoad
    }
    memory = @{
        total_gb = $totalRamGB
        used_gb = $usedRamGB
        free_gb = $freeRamGB
        percent = $ramPercent
    }
    disks = $disks
    network = @{
        primary_ip = $primaryIP
        primary_mac = $primaryMAC
        public_ip = $publicIP
        interfaces = $interfaces
    }
    uptime = @{
        seconds = $uptimeSeconds
        boot_time = $bootTime.ToString("yyyy-MM-dd HH:mm:ss UTC")
    }
    agent_version = "2.4.0-ps"
    client_company = $ClientCompany
    collected_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$jsonBody = $payload | ConvertTo-Json -Depth 6

if (-not $Quiet) {
    Write-Host "[*] Enviando telemetria para $ServerUrl/api/agent/report ..." -ForegroundColor Cyan
    Write-Host "[*] Host: $hostname | Tipo: $machineType | OS: $osName $osVersion" -ForegroundColor Gray
}

# 11. Envio HTTP POST
$headers = @{
    "Content-Type" = "application/json; charset=utf-8"
    "X-Agent-Token" = $AgentToken
}

try {
    $response = Invoke-RestMethod -Uri "$ServerUrl/api/agent/report" -Method Post -Body $jsonBody -Headers $headers -TimeoutSec 10
    if (-not $Quiet) {
        Write-Host "[OK] Sucesso! Resposta do Servidor: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
    }
} catch {
    Write-Error "[FALHA] Não foi possível enviar relatório para o servidor: $_"
    exit 1
}
