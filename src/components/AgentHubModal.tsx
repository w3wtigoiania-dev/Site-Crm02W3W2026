import React, { useState } from 'react';
import { ClientCompany } from '../types.ts';
import {
  X,
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  Key,
  Globe,
  CheckCircle2,
  FileCode,
  Shield,
  HelpCircle,
  Laptop,
  Server,
  Monitor,
  Building2,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  FileText,
  PlusCircle
} from 'lucide-react';

interface AgentHubModalProps {
  companies?: ClientCompany[];
  defaultCompany?: string;
  onClose: () => void;
  onSimulationSuccess: () => void;
  initialMode?: 'scripts' | 'simulator' | 'manual';
}

export const AgentHubModal: React.FC<AgentHubModalProps> = ({
  companies = [],
  defaultCompany = 'Hospital São Lucas',
  onClose,
  onSimulationSuccess,
  initialMode = 'scripts'
}) => {
  const [targetCompany, setTargetCompany] = useState<string>(
    defaultCompany && defaultCompany !== 'all'
      ? defaultCompany
      : (companies[0]?.name || 'Hospital São Lucas')
  );
  const [activeMode, setActiveMode] = useState<'scripts' | 'simulator' | 'manual'>(initialMode);
  const [selectedScript, setSelectedScript] = useState<'python' | 'powershell' | 'bash'>('python');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [simulationPreset, setSimulationPreset] = useState<'windows_pc' | 'ubuntu_server' | 'macbook_m3'>('windows_pc');

  // Manual Form State with exact agent options (IMAGEM 04)
  const [manualForm, setManualForm] = useState({
    hostname: '',
    logged_user: '',
    machine_type: 'desktop' as 'desktop' | 'notebook' | 'server' | 'vm',
    os_name: 'Windows 11 Pro',
    os_arch: 'x64',
    cpu_model: 'Intel Core i5-13400 @ 2.50GHz',
    cpu_cores_physical: 6,
    cpu_cores_logical: 12,
    cpu_freq_ghz: 2.5,
    ram_total_gb: 16,
    disk_total_gb: 512,
    disk_fstype: 'NTFS',
    primary_ip: '192.168.1.100',
    primary_mac: '',
    sector: 'TI & Operações',
    location: 'Matriz - 1º Andar',
    status: 'Ativo' as 'Ativo' | 'Em Manutenção' | 'Desativado' | 'Reserva',
    asset_tag: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_end: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 3).toISOString().split('T')[0],
    vendor: 'Dell OptiPlex 7090',
    cost: 4200,
    responsible_person: '',
    notes: 'Cadastrado manualmente com as mesmas opções técnicas do agente de coleta.'
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.hostname.trim()) {
      alert('Informe o Hostname do equipamento');
      return;
    }
    setSavingManual(true);
    setSimulationResult(null);

    try {
      const payload = {
        ...manualForm,
        client_company: targetCompany,
        cpu_cores_physical: Number(manualForm.cpu_cores_physical) || 4,
        cpu_cores_logical: Number(manualForm.cpu_cores_logical) || 8,
        cpu_freq_ghz: Number(manualForm.cpu_freq_ghz) || 2.4,
        ram_total_gb: Number(manualForm.ram_total_gb) || 16,
        disk_total_gb: Number(manualForm.disk_total_gb) || 512,
        cost: Number(manualForm.cost) || 0
      };

      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar ativo');

      setSimulationResult(`Equipamento "${payload.hostname}" cadastrado manualmente com sucesso na empresa "${targetCompany}"!`);
      onSimulationSuccess();
    } catch (err: any) {
      setSimulationResult(`Erro ao cadastrar ativo: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  };

  const serverUrl = window.location.origin;
  const agentToken = "infra_asset_token_secret_2026";

  const pythonSnippet = `#!/usr/bin/env python3
# InfraAsset IT - Agente de Coleta Multiplataforma (Ambiente B2B/MSP)
# Instale a dependência: pip install psutil
# Execução: python agent_collector.py --server "${serverUrl}" --token "${agentToken}" --company "${targetCompany}"

import sys, os, json, socket, platform, getpass, time
from datetime import datetime, timezone
import psutil

SERVER_URL = "${serverUrl}"
AGENT_TOKEN = "${agentToken}"
CLIENT_COMPANY = "${targetCompany}"

def collect():
    hostname = socket.gethostname()
    logged_user = getpass.getuser()
    vm = psutil.virtual_memory()
    
    # Processador
    cpu_freq = psutil.cpu_freq()
    freq_ghz = round(cpu_freq.current / 1000, 2) if cpu_freq else 2.40
    
    # Discos montados
    disks = []
    for p in psutil.disk_partitions(all=False):
        if p.fstype in ("", "squashfs", "tmpfs"): continue
        try:
            u = psutil.disk_usage(p.mountpoint)
            disks.append({
                "device": p.device,
                "mountpoint": p.mountpoint,
                "fstype": p.fstype,
                "total_gb": round(u.total / (1024**3), 2),
                "used_gb": round(u.used / (1024**3), 2),
                "free_gb": round(u.free / (1024**3), 2),
                "percent": u.percent
            })
        except: pass

    # Interfaces de Rede
    primary_ip = socket.gethostbyname(hostname)
    mac = "00:00:00:00:00:00"
    for iface, addrs in psutil.net_if_addrs().items():
        for a in addrs:
            if str(a.family) in ("17", "AF_LINK") and a.address:
                mac = a.address.upper().replace("-", ":")
                break
        if mac != "00:00:00:00:00:00": break

    payload = {
        "id": f"{mac.replace(':', '')}_{hostname}".upper(),
        "hostname": hostname,
        "logged_user": logged_user,
        "client_company": CLIENT_COMPANY,
        "machine_type": "notebook" if psutil.sensors_battery() else "desktop",
        "os": {
            "name": platform.system(),
            "version": platform.release(),
            "build": platform.version(),
            "arch": platform.machine()
        },
        "cpu": {
            "model": platform.processor() or "CPU",
            "cores_physical": psutil.cpu_count(logical=False) or 1,
            "cores_logical": psutil.cpu_count(logical=True) or 1,
            "freq_ghz": freq_ghz,
            "usage_percent": psutil.cpu_percent(interval=0.5)
        },
        "memory": {
            "total_gb": round(vm.total / (1024**3), 2),
            "used_gb": round(vm.used / (1024**3), 2),
            "free_gb": round(vm.available / (1024**3), 2),
            "percent": vm.percent
        },
        "disks": disks,
        "network": {
            "primary_ip": primary_ip,
            "primary_mac": mac,
            "public_ip": "Consultado na Web"
        },
        "uptime": {
            "seconds": int(time.time() - psutil.boot_time()),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).strftime("%Y-%m-%d %H:%M:%S")
        },
        "agent_version": "2.4.0"
    }

    import urllib.request
    req = urllib.request.Request(
        f"{SERVER_URL}/api/agent/report",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Agent-Token": AGENT_TOKEN,
            "X-Client-Company": CLIENT_COMPANY
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        print("[OK] Inventario enviado com sucesso para a empresa:", CLIENT_COMPANY, resp.read().decode())

if __name__ == "__main__":
    collect()`;

  const powershellSnippet = `# InfraAsset IT - Agente PowerShell Nativo para Windows (B2B / MSP)
# Executar via GPO de logon ou Prompt Administrativo:
# powershell -ExecutionPolicy Bypass -File .\\agent_collector.ps1 -ServerUrl "${serverUrl}" -ClientCompany "${targetCompany}"

$ServerUrl = "${serverUrl}"
$Token = "${agentToken}"
$ClientCompany = "${targetCompany}"

$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cs = Get-CimInstance Win32_ComputerSystem
$ipConfig = Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null } | Select-Object -First 1

$totalRamGB = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
$freeRamGB = [math]::Round($os.FreePhysicalMemory * 1024 / 1GB, 2)
$usedRamGB = [math]::Round($totalRamGB - $freeRamGB, 2)

$disks = @()
Get-CimInstance Win32_LogicalDisk -Filter "DriveType = 3" | ForEach-Object {
    if ($_.Size -gt 0) {
        $tot = [math]::Round($_.Size / 1GB, 2)
        $free = [math]::Round($_.FreeSpace / 1GB, 2)
        $disks += @{
            device = $_.DeviceID; mountpoint = $_.DeviceID + "\\"; fstype = $_.FileSystem;
            total_gb = $tot; used_gb = [math]::Round($tot - $free, 2); free_gb = $free;
            percent = [math]::Round((($tot - $free) / $tot) * 100, 1)
        }
    }
}

$payload = @{
    id = "$($ipConfig.NetAdapter.MacAddress -replace '[:-]', '')_$($env:COMPUTERNAME)".ToUpper()
    hostname = $env:COMPUTERNAME
    logged_user = $env:USERNAME
    client_company = $ClientCompany
    machine_type = if (Get-CimInstance Win32_Battery) { "notebook" } else { "desktop" }
    os = @{ name = "Windows"; version = $os.Caption; build = $os.Version; arch = $os.OSArchitecture }
    cpu = @{ model = $cpu.Name.Trim(); cores_physical = $cpu.NumberOfCores; cores_logical = $cpu.NumberOfLogicalProcessors; freq_ghz = [math]::Round($cpu.MaxClockSpeed / 1000, 2); usage_percent = 20 }
    memory = @{ total_gb = $totalRamGB; used_gb = $usedRamGB; free_gb = $freeRamGB; percent = [math]::Round(($usedRamGB/$totalRamGB)*100, 1) }
    disks = $disks
    network = @{ primary_ip = $ipConfig.IPv4Address.IPAddress; primary_mac = $ipConfig.NetAdapter.MacAddress; public_ip = "Consultado" }
    uptime = @{ seconds = [math]::Floor(((Get-Date) - $os.LastBootUpTime).TotalSeconds); boot_time = $os.LastBootUpTime.ToString("yyyy-MM-dd HH:mm:ss") }
    agent_version = "2.4.0-ps"
} | ConvertTo-Json -Depth 5

$headers = @{ 
    "Content-Type" = "application/json"
    "X-Agent-Token" = $Token
    "X-Client-Company" = $ClientCompany
}
Invoke-RestMethod -Uri "$ServerUrl/api/agent/report" -Method Post -Body $payload -Headers $headers
Write-Host "[OK] Dados enviados com sucesso para a empresa: $ClientCompany" -ForegroundColor Green`;

  const bashSnippet = `#!/usr/bin/env bash
# InfraAsset IT - Agente Nativo Bash para Linux (Ubuntu, Debian, RHEL, CentOS - B2B/MSP)
# Execução: ./agent_collector.sh --server "${serverUrl}" --token "${agentToken}" --company "${targetCompany}"

SERVER_URL="${serverUrl}"
TOKEN="${agentToken}"
CLIENT_COMPANY="${targetCompany}"
HOSTNAME=$(hostname)
USER=$(whoami)

# RAM
MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))
MEM_TOT_GB=$(awk "BEGIN {printf \\"%.2f\\", $MEM_TOTAL_KB / 1048576}")
MEM_USED_GB=$(awk "BEGIN {printf \\"%.2f\\", $MEM_USED_KB / 1048576}")
MEM_FREE_GB=$(awk "BEGIN {printf \\"%.2f\\", $MEM_AVAIL_KB / 1048576}")
MEM_PCT=$(awk "BEGIN {printf \\"%.1f\\", ($MEM_USED_KB / $MEM_TOTAL_KB) * 100}")

# CPU
CPU_MODEL=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs)
CORES_LOGICAL=$(grep -c "processor" /proc/cpuinfo 2>/dev/null)

# IP e MAC
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
IFACE=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $5; exit}')
MAC=$(cat /sys/class/net/"$IFACE"/address 2>/dev/null | tr '[:lower:]' '[:upper:]')
UPTIME_SEC=$(awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0)

JSON_PAYLOAD=$(cat <<EOF
{
  "id": "$(echo $MAC | tr -d ':-')_$HOSTNAME",
  "hostname": "$HOSTNAME",
  "logged_user": "$USER",
  "client_company": "$CLIENT_COMPANY",
  "machine_type": "server",
  "os": { "name": "Linux", "version": "$(uname -s)", "build": "$(uname -r)", "arch": "$(uname -m)" },
  "cpu": { "model": "$CPU_MODEL", "cores_physical": 1, "cores_logical": $CORES_LOGICAL, "freq_ghz": 2.40, "usage_percent": 15 },
  "memory": { "total_gb": $MEM_TOT_GB, "used_gb": $MEM_USED_GB, "free_gb": $MEM_FREE_GB, "percent": $MEM_PCT },
  "disks": [ {"device": "/dev/sda1", "mountpoint": "/", "fstype": "ext4", "total_gb": 100, "used_gb": 35, "free_gb": 65, "percent": 35} ],
  "network": { "primary_ip": "$IP", "primary_mac": "$MAC", "public_ip": "Detectado" },
  "uptime": { "seconds": $UPTIME_SEC, "boot_time": "Linux Boot" },
  "agent_version": "2.4.0-sh"
}
EOF
)

curl -s -X POST "$SERVER_URL/api/agent/report" \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-Token: $TOKEN" \\
  -H "X-Client-Company: $CLIENT_COMPANY" \\
  -d "$JSON_PAYLOAD"
echo "[OK] Reporte enviado para $CLIENT_COMPANY!"`;

  const getCurrentSnippet = () => {
    switch (selectedScript) {
      case 'powershell':
        return powershellSnippet;
      case 'bash':
        return bashSnippet;
      default:
        return pythonSnippet;
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(agentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleDownload = () => {
    const filename =
      selectedScript === 'powershell'
        ? 'agent_collector.ps1'
        : selectedScript === 'bash'
        ? 'agent_collector.sh'
        : 'agent_collector.py';
    window.open(`/api/agent/scripts/${filename}`, '_blank');
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/agent/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: simulationPreset,
          company: targetCompany
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na simulação');

      setSimulationResult(
        `Ativo simulado com sucesso: ${data.data.hostname} (${data.data.os_name}) atrelado à empresa "${data.data.client_company || targetCompany}"!`
      );
      onSimulationSuccess();
    } catch (err: any) {
      setSimulationResult(`Erro na simulação: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Central do Agente de Coleta
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  MSP Multi-Empresa
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gere scripts pré-configurados e colete informações atrelando cada equipamento diretamente à empresa cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials / Endpoint Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-slate-400">Endpoint API:</span>
              <span className="font-mono text-slate-200 truncate">{serverUrl}/api/agent/report</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <Key className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-slate-400">Token do Agente:</span>
              <span className="font-mono text-amber-300 truncate">{agentToken}</span>
            </div>
            <button
              onClick={handleCopyToken}
              className="text-slate-400 hover:text-white transition-colors ml-2 cursor-pointer"
              title="Copiar token"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Mode Navigation Tabs (IMAGEM 04 - MANUAL + SCRIPTS + SIMULADOR) */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMode('scripts')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'scripts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>1. Scripts do Agente</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('simulator')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>2. Simulador de Envio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'manual'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>3. Cadastro Manual (Mesmos Dados)</span>
            </button>
          </div>

          {/* Targeted Client Company Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Empresa Cliente de Destino
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Atrelação Automática
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione o cliente atendido. Os dados cadastrados ou coletados serão vinculados a esta empresa.
                </p>
              </div>
            </div>

            <div className="w-full md:w-64">
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full py-2 px-3 bg-slate-900 border border-blue-500/50 rounded-lg text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                    🏢 {c.name} ({c.sla_plan || 'Padrão'})
                  </option>
                ))}
                {targetCompany && !companies.some(c => c.name === targetCompany) && (
                  <option value={targetCompany}>🏢 {targetCompany}</option>
                )}
              </select>
            </div>
          </div>

          {simulationResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{simulationResult}</span>
              </div>
              <button
                type="button"
                onClick={() => setSimulationResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MODE 3: CADASTRO MANUAL COM AS MESMAS OPÇÕES DO AGENTE (IMAGEM 04) */}
          {activeMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs bg-slate-950/70 p-5 rounded-2xl border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Formulário de Cadastro Técnico Manual</h4>
                    <p className="text-[11px] text-slate-400">Preencha com as mesmas especificações de telemetria coletadas pelo script</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  EQUIVALENTE AO AGENTE
                </span>
              </div>

              {/* Seção 1: Identificação do Dispositivo */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/80 pb-1 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  Identificação do Ativo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Hostname / Nome da Máquina *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.hostname}
                      onChange={(e) => setManualForm({ ...manualForm, hostname: e.target.value.toUpperCase() })}
                      placeholder="SRV-PROD-01 ou NOTE-FIN-05"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono uppercase focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tipo de Máquina *</label>
                    <select
                      value={manualForm.machine_type}
                      onChange={(e) => setManualForm({ ...manualForm, machine_type: e.target.value as any })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="desktop">Desktop / Workstation</option>
                      <option value="notebook">Notebook Corporativo</option>
                      <option value="server">Servidor Dedicado</option>
                      <option value="vm">Máquina Virtual (VM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Usuário Logado / Principal</label>
                    <input
                      type="text"
                      value={manualForm.logged_user}
                      onChange={(e) => setManualForm({ ...manualForm, logged_user: e.target.value })}
                      placeholder="Ex: joao.silva"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Setor / Departamento</label>
                    <input
                      type="text"
                      value={manualForm.sector}
                      onChange={(e) => setManualForm({ ...manualForm, sector: e.target.value })}
                      placeholder="Financeiro, TI, Diretoria"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Localização Física</label>
                    <input
                      type="text"
                      value={manualForm.location}
                      onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                      placeholder="Sede Goiânia - 2º Andar"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Status Operacional</label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Ativo">Ativo (Em Operação)</option>
                      <option value="Em Manutenção">Em Manutenção</option>
                      <option value="Aguardando Peça">Aguardando Peça</option>
                      <option value="Em Diagnóstico">Em Diagnóstico</option>
                      <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                      <option value="Pronto / Liberado">Pronto / Liberado</option>
                      <option value="Garantia / RMA">Garantia / RMA</option>
                      <option value="Reserva">Reserva Técnica</option>
                      <option value="Desativado">Desativado</option>
                      <option value="Quarentena / Bloqueado">Quarentena / Bloqueado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Hardware & Sistema Operacional */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/80 pb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Hardware & Sistema Operacional
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Sistema Operacional & Versão *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.os_name}
                      onChange={(e) => setManualForm({ ...manualForm, os_name: e.target.value })}
                      placeholder="Windows 11 Pro, Ubuntu 24.04 LTS, Windows Server 2022"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Arquitetura do SO</label>
                    <select
                      value={manualForm.os_arch}
                      onChange={(e) => setManualForm({ ...manualForm, os_arch: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="x64">x64 (64-bit AMD/Intel)</option>
                      <option value="ARM64">ARM64 (Apple Silicon / Snapdragon)</option>
                      <option value="x86">x86 (32-bit Legado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Modelo do Processador (CPU)</label>
                    <input
                      type="text"
                      value={manualForm.cpu_model}
                      onChange={(e) => setManualForm({ ...manualForm, cpu_model: e.target.value })}
                      placeholder="Intel Core i7-13700K ou AMD Ryzen 7"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Núcleos (Físicos / Lógicos)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={manualForm.cpu_cores_physical}
                        onChange={(e) => setManualForm({ ...manualForm, cpu_cores_physical: Number(e.target.value) })}
                        className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        title="Núcleos físicos"
                      />
                      <input
                        type="number"
                        min={1}
                        value={manualForm.cpu_cores_logical}
                        onChange={(e) => setManualForm({ ...manualForm, cpu_cores_logical: Number(e.target.value) })}
                        className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        title="Threads / Lógicos"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Frequência (GHz)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualForm.cpu_freq_ghz}
                      onChange={(e) => setManualForm({ ...manualForm, cpu_freq_ghz: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Memória RAM Total (GB) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1024}
                      value={manualForm.ram_total_gb}
                      onChange={(e) => setManualForm({ ...manualForm, ram_total_gb: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Armazenamento Total (GB) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={manualForm.disk_total_gb}
                      onChange={(e) => setManualForm({ ...manualForm, disk_total_gb: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Sistema de Arquivos</label>
                    <select
                      value={manualForm.disk_fstype}
                      onChange={(e) => setManualForm({ ...manualForm, disk_fstype: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="NTFS">NTFS (Windows Padrão)</option>
                      <option value="ext4">ext4 (Linux Padrão)</option>
                      <option value="APFS">APFS (macOS)</option>
                      <option value="Btrfs">Btrfs / ZFS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 3: Rede & Endereçamento */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/80 pb-1 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  Rede & Conectividade
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Endereço IP Primário (IPv4) *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.primary_ip}
                      onChange={(e) => setManualForm({ ...manualForm, primary_ip: e.target.value })}
                      placeholder="192.168.1.150"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Endereço MAC (Físico)</label>
                    <input
                      type="text"
                      value={manualForm.primary_mac}
                      onChange={(e) => setManualForm({ ...manualForm, primary_mac: e.target.value.toUpperCase() })}
                      placeholder="00:1A:2B:3C:4D:5E"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Patrimônio & Garantia */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/80 pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Patrimônio & SLA
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Etiqueta de Patrimônio (Tag)</label>
                    <input
                      type="text"
                      value={manualForm.asset_tag}
                      onChange={(e) => setManualForm({ ...manualForm, asset_tag: e.target.value.toUpperCase() })}
                      placeholder="PAT-2026-0099"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Vencimento da Garantia</label>
                    <input
                      type="date"
                      value={manualForm.warranty_end}
                      onChange={(e) => setManualForm({ ...manualForm, warranty_end: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fabricante & Modelo</label>
                    <input
                      type="text"
                      value={manualForm.vendor}
                      onChange={(e) => setManualForm({ ...manualForm, vendor: e.target.value })}
                      placeholder="Dell PowerEdge, Lenovo ThinkPad"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Formulário Manual */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('scripts')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Voltar para Scripts
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingManual ? (
                    <span>Salvando ativo...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Equipamento com Dados Técnicos Manuais</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: SIMULADOR DE ENVIO */}
          {activeMode === 'simulator' && (
            <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-5 rounded-2xl border border-blue-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Simulador de Telemetria de Ativos em Tempo Real</h3>
                  <p className="text-xs text-slate-300">
                    Dispare coletas automáticas com dados realistas para testar a telemetria da empresa <strong className="text-blue-300">{targetCompany}</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preset de Dispositivo para Teste:</label>
                  <select
                    value={simulationPreset}
                    onChange={(e) => setSimulationPreset(e.target.value as any)}
                    className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white cursor-pointer w-full sm:w-72"
                  >
                    <option value="windows_pc">🖥️ Desktop Windows 11 Pro (Core i7, 16GB RAM, 512GB SSD)</option>
                    <option value="ubuntu_server">🖧 Servidor Linux Ubuntu 24.04 (Xeon, 32GB RAM, 1TB SSD)</option>
                    <option value="macbook_m3">💻 Notebook MacBook Pro M3 (Apple Silicon, 18GB RAM)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{simulating ? 'Transmitindo Telemetria...' : 'Disparar Coleta Agora'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>Quer cadastrar manualmente um ativo com especificações reais sem simulação?</span>
                <button
                  type="button"
                  onClick={() => setActiveMode('manual')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                >
                  Abrir Cadastro Manual
                </button>
              </div>
            </div>
          )}

          {/* MODE 1: SCRIPTS AUTOMÁTICOS (PYTHON, POWERSHELL, BASH) */}
          {activeMode === 'scripts' && (
            <div className="space-y-4">
              {/* Shortcut Banner to Manual */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-300">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Deseja registrar o equipamento sem rodar scripts? Você pode usar o cadastro manual.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('manual')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  Cadastro Manual
                </button>
              </div>

          {/* Script Type Selector & Actions */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSelectedScript('python')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedScript === 'python'
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python (Multiplataforma)
                </button>
                <button
                  onClick={() => setSelectedScript('powershell')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedScript === 'powershell'
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PowerShell (Nativo Windows)
                </button>
                <button
                  onClick={() => setSelectedScript('bash')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedScript === 'bash'
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bash (Nativo Linux)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copiado!' : 'Copiar Script'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                <span>
                  {selectedScript === 'python'
                    ? `scripts/agent_collector.py (Alvo: ${targetCompany})`
                    : selectedScript === 'powershell'
                    ? `scripts/agent_collector.ps1 (Alvo: ${targetCompany})`
                    : `scripts/agent_collector.sh (Alvo: ${targetCompany})`}
                </span>
                <span className="text-emerald-400">Atrelado a: {targetCompany}</span>
              </div>
              <pre className="p-4 text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                <code>{getCurrentSnippet()}</code>
              </pre>
            </div>
          </div>

          {/* How to deploy guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Windows GPO & Task Scheduler */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Monitor className="w-4 h-4 text-blue-400" />
                Como rodar no Logon do Windows (AD / GPO)
              </h4>
              <p className="text-slate-400">
                Para inventariar automaticamente todos os computadores da empresa cliente sem intervenção manual do usuário:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>Abra o Gerenciador de GPO no Active Directory (`gpmc.msc`).</li>
                <li>Vá em <strong>Configuração do Usuário &gt; Políticas &gt; Configurações do Windows &gt; Scripts (Logon/Logoff) &gt; Logon</strong>.</li>
                <li>Adicione o script <code className="text-blue-400">agent_collector.ps1</code> passando <code className="text-amber-300">-ClientCompany "{targetCompany}"</code>.</li>
                <li>Alternativa local: Crie uma Tarefa Agendada no Windows com trigger <code className="text-slate-300">Ao Fazer Logon</code>.</li>
              </ol>
            </div>

            {/* Linux Cron / Systemd */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Server className="w-4 h-4 text-purple-400" />
                Como rodar em Servidores e Desktops Linux
              </h4>
              <p className="text-slate-400">
                Para servidores Linux rodando em segundo plano ou no boot do sistema operacional:
              </p>
              <div className="bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
                <p># 1. Permissão de execução:</p>
                <p className="text-emerald-400">chmod +x /opt/agent_collector.sh</p>
                <p># 2. Adicionar ao crontab com a empresa cliente:</p>
                <p className="text-emerald-400">crontab -e</p>
                <p className="text-blue-400">0 */4 * * * /opt/agent_collector.sh --company "{targetCompany}" &gt; /dev/null 2&gt;&amp;1</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Coletando para: <strong className="text-white">{targetCompany}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
