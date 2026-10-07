import React, { useState } from 'react';
import { ClientCompany } from '../types.ts';
import {
  X,
  PlusCircle,
  Terminal,
  FileText,
  Building2,
  Monitor,
  Laptop,
  Server,
  Layers,
  Check,
  Copy,
  Play,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface AddDeviceModalProps {
  onClose: () => void;
  onDeviceAdded: () => void;
  companies: ClientCompany[];
  userCompany?: string;
  userRole?: string;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  onClose,
  onDeviceAdded,
  companies,
  userCompany,
  userRole
}) => {
  const isSuperAdmin = userRole === 'SuperAdmin';
  const defaultTargetCompany = (!isSuperAdmin && userCompany)
    ? userCompany
    : (userCompany || companies[0]?.name || 'Hospital São Lucas');

  const [method, setMethod] = useState<'agent' | 'manual'>('agent');
  const [selectedCompany, setSelectedCompany] = useState<string>(defaultTargetCompany);
  const [agentOs, setAgentOs] = useState<'windows' | 'linux' | 'macos'>('windows');
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual Form State
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
    notes: 'Equipamento registrado via coleta manual no inventário.'
  });

  const apiHost = window.location.origin;
  const agentToken = 'infra_asset_token_secret_2026';

  const getAgentCommand = () => {
    const encodedComp = encodeURIComponent(selectedCompany);
    if (agentOs === 'windows') {
      return `# Executar no PowerShell como Administrador:
irm "${apiHost}/agent.ps1" -Headers @{"x-client-company"="${selectedCompany}"; "x-agent-token"="${agentToken}"} | iex; Start-InfraAgent -ServerUrl "${apiHost}" -Company "${selectedCompany}" -Token "${agentToken}"`;
    } else if (agentOs === 'linux') {
      return `# Executar no Terminal Linux (Ubuntu, Debian, RedHat):
curl -sSL -H "x-client-company: ${selectedCompany}" "${apiHost}/agent.sh" | sudo bash -s -- --url "${apiHost}" --company "${selectedCompany}" --token "${agentToken}"`;
    } else {
      return `# Executar no Terminal macOS:
curl -sSL -H "x-client-company: ${selectedCompany}" "${apiHost}/agent-mac.sh" | bash -s -- --url "${apiHost}" --company "${selectedCompany}" --token "${agentToken}"`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getAgentCommand());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Immediate Simulation of Agent Report for this company
  const handleSimulateAgent = async (preset: string) => {
    setSimulating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/agent/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset,
          company: selectedCompany
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar coleta automática');
      }

      setSuccessMsg(`Dispositivo "${data.data?.hostname || 'Ativo'}" inventariado com sucesso via agente para "${selectedCompany}"!`);
      onDeviceAdded();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao simular coleta do agente');
    } finally {
      setSimulating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!manualForm.hostname.trim()) {
      setErrorMsg('Informe o nome/hostname do dispositivo.');
      return;
    }

    if (!selectedCompany) {
      setErrorMsg('Selecione a empresa cadastrada.');
      return;
    }

    setSavingManual(true);

    try {
      const payload = {
        ...manualForm,
        client_company: selectedCompany,
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
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar equipamento no inventário');
      }

      setSuccessMsg(`Equipamento "${payload.hostname}" cadastrado com sucesso na empresa "${selectedCompany}"!`);
      onDeviceAdded();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar equipamento');
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Cadastrar Dispositivo / Novo Ativo
              </h2>
              <p className="text-xs text-slate-400">
                Escolha o método de inventário vinculado à empresa contratante
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Association Bar */}
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Empresa Cadastrada do Ativo:</span>
          </div>

          {isSuperAdmin ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="py-1 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                    🏢 {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                SuperAdmin Multi-Empresa
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                🏢 {selectedCompany}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                Isolamento Ativo
              </span>
            </div>
          )}
        </div>

        {/* Method Switcher Tabs (1 Coleta Automática / 2 Coleta Manual) */}
        <div className="p-4 sm:px-6 bg-slate-900/60 border-b border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('agent')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                method === 'agent'
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className={`p-2 rounded-lg ${method === 'agent' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white">1. Coleta Automática</span>
                <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                  Via agente inteligente do sistema (Telemetria instantânea)
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('manual')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                method === 'manual'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className={`p-2 rounded-lg ${method === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-white">2. Coleta Manual</span>
                <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                  Formulário com preenchimento das especificações técnicas
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* METHOD 1: COLETA AUTOMÁTICA VIA AGENTE */}
          {method === 'agent' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Como funciona a coleta automática do agente:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O script do agente consulta nativamente processador, memória RAM, partições de disco, interfaces de rede, IPs, placa-mãe e sistema operacional, transmitindo o inventário em tempo real para a empresa <strong>"{selectedCompany}"</strong>.
                </p>
              </div>

              {/* OS Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Selecione o Sistema Operacional do Dispositivo Alvo:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAgentOs('windows')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      agentOs === 'windows'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🪟 Windows (PowerShell)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgentOs('linux')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      agentOs === 'linux'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🐧 Linux (Bash/curl)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgentOs('macos')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      agentOs === 'macos'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🍎 macOS (Terminal)</span>
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Comando de Instalação e Execução:</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado para a área de transferência!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Comando</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
                  {getAgentCommand()}
                </pre>
              </div>

              {/* Test Simulation Option */}
              <div className="pt-3 border-t border-slate-800">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Testar Envio Automático Imediato
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gere uma telemetria automática simulada diretamente vinculada a <strong>{selectedCompany}</strong> para validar o painel em tempo real.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={simulating}
                      onClick={() => handleSimulateAgent('ubuntu_server')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Simular Servidor</span>
                    </button>
                    <button
                      type="button"
                      disabled={simulating}
                      onClick={() => handleSimulateAgent('win11_notebook')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      <span>Simular Estação</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 2: COLETA MANUAL (CADASTRO MANUAL DE ATIVO) */}
          {method === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              {/* Basic Identification */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  Identificação do Dispositivo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Hostname / Nome do Equipamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualForm.hostname}
                      onChange={(e) => setManualForm({ ...manualForm, hostname: e.target.value.toUpperCase() })}
                      placeholder="Ex: SRV-DATABASE-01 ou NOTE-FIN-12"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tipo de Ativo *</label>
                    <select
                      value={manualForm.machine_type}
                      onChange={(e) => setManualForm({ ...manualForm, machine_type: e.target.value as any })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="desktop">Desktop / Workstation</option>
                      <option value="notebook">Notebook Corporativo</option>
                      <option value="server">Servidor Dedicado</option>
                      <option value="vm">Máquina Virtual (VM)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Usuário Responsável / Logado</label>
                    <input
                      type="text"
                      value={manualForm.logged_user}
                      onChange={(e) => setManualForm({ ...manualForm, logged_user: e.target.value })}
                      placeholder="Ex: carlos.silva"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Setor / Departamento</label>
                    <input
                      type="text"
                      value={manualForm.sector}
                      onChange={(e) => setManualForm({ ...manualForm, sector: e.target.value })}
                      placeholder="Ex: Financeiro, TI, Engenharia"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Localização Física</label>
                    <input
                      type="text"
                      value={manualForm.location}
                      onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                      placeholder="Ex: Matriz - Sala 204"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware & OS Specifications */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Hardware & Sistema Operacional
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Sistema Operacional *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.os_name}
                      onChange={(e) => setManualForm({ ...manualForm, os_name: e.target.value })}
                      placeholder="Ex: Windows 11 Pro, Ubuntu 24.04 LTS, Windows Server 2022"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Status Operacional</label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Ativo">Ativo (Em Produção)</option>
                      <option value="Em Manutenção">Em Manutenção</option>
                      <option value="Reserva">Reserva Técnica</option>
                      <option value="Desativado">Desativado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Modelo do Processador (CPU)</label>
                    <input
                      type="text"
                      value={manualForm.cpu_model}
                      onChange={(e) => setManualForm({ ...manualForm, cpu_model: e.target.value })}
                      placeholder="Ex: Intel Core i7-13700K @ 3.40GHz"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Memória RAM Total (GB) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1024}
                      value={manualForm.ram_total_gb}
                      onChange={(e) => setManualForm({ ...manualForm, ram_total_gb: Number(e.target.value) })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Armazenamento Principal (GB)</label>
                    <input
                      type="number"
                      min={10}
                      value={manualForm.disk_total_gb}
                      onChange={(e) => setManualForm({ ...manualForm, disk_total_gb: Number(e.target.value) })}
                      placeholder="512"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Fabricante & Modelo da Máquina</label>
                    <input
                      type="text"
                      value={manualForm.vendor}
                      onChange={(e) => setManualForm({ ...manualForm, vendor: e.target.value })}
                      placeholder="Ex: Dell PowerEdge R7525, Lenovo ThinkPad E14"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Network Connectivity */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  Rede & Endereçamento
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Endereço IP Primário (IPv4) *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.primary_ip}
                      onChange={(e) => setManualForm({ ...manualForm, primary_ip: e.target.value })}
                      placeholder="Ex: 192.168.1.150"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Endereço MAC (Físico)</label>
                    <input
                      type="text"
                      value={manualForm.primary_mac}
                      onChange={(e) => setManualForm({ ...manualForm, primary_mac: e.target.value.toUpperCase() })}
                      placeholder="Ex: 00:1A:2B:3C:4D:5E"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Asset & Warranty Control */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Patrimônio & Garantia
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Etiqueta de Patrimônio (Tag)</label>
                    <input
                      type="text"
                      value={manualForm.asset_tag}
                      onChange={(e) => setManualForm({ ...manualForm, asset_tag: e.target.value.toUpperCase() })}
                      placeholder="PAT-2026-0042"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Data de Aquisição</label>
                    <input
                      type="date"
                      value={manualForm.purchase_date}
                      onChange={(e) => setManualForm({ ...manualForm, purchase_date: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fim da Garantia (SLA)</label>
                    <input
                      type="date"
                      value={manualForm.warranty_end}
                      onChange={(e) => setManualForm({ ...manualForm, warranty_end: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Observações Técnicas</label>
                  <textarea
                    rows={2}
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder="Informações adicionais, histórico de upgrade, finalidade do equipamento..."
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingManual ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Ativo no Inventário</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
