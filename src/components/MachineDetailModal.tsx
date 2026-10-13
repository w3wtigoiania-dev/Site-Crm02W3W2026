import React, { useState, useEffect } from 'react';
import { Machine, ClientCompany, EquipmentStatus, EquipmentStatusLog } from '../types.ts';
import { StatusBadge } from '../utils/statusUtils.tsx';
import { StatusChangePasswordModal } from './StatusChangePasswordModal.tsx';
import { StatusManagementModal } from './StatusManagementModal.tsx';
import {
  X,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  User,
  ShieldCheck,
  Calendar,
  DollarSign,
  Building,
  Save,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Laptop,
  Server,
  Layers,
  Activity,
  FileText,
  Building2,
  Lock,
  Palette,
  KeyRound,
  History,
  Tag
} from 'lucide-react';

interface MachineDetailModalProps {
  machineId: string;
  initialTab?: 'hardware' | 'manual' | 'history' | 'status_audit';
  companies?: ClientCompany[];
  currentUser?: { name?: string; role?: string } | null;
  onClose: () => void;
  onMachineUpdated: () => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machineId,
  initialTab = 'hardware',
  companies = [],
  currentUser,
  onClose,
  onMachineUpdated
}) => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hardware' | 'manual' | 'disks' | 'networks' | 'history' | 'status_audit'>(initialTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [companyList, setCompanyList] = useState<ClientCompany[]>(companies);

  // Statuses e Segurança com Senha
  const [customStatuses, setCustomStatuses] = useState<EquipmentStatus[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingTargetStatus, setPendingTargetStatus] = useState<string>('');
  const [isStatusManageModalOpen, setIsStatusManageModalOpen] = useState(false);
  const [statusLogs, setStatusLogs] = useState<EquipmentStatusLog[]>([]);

  useEffect(() => {
    if (companies && companies.length > 0) {
      setCompanyList(companies);
    } else {
      fetch('/api/companies')
        .then(res => res.json())
        .then(d => { if (d.companies) setCompanyList(d.companies); })
        .catch(() => {});
    }
  }, [companies]);

  // Editable manual fields state
  const [manualForm, setManualForm] = useState({
    client_company: '',
    sector: '',
    location: '',
    status: 'Ativo',
    asset_tag: '',
    purchase_date: '',
    warranty_end: '',
    vendor: '',
    cost: '',
    responsible_person: '',
    notes: ''
  });

  const loadMachineDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/machines/${machineId}`);
      if (!res.ok) throw new Error('Falha ao carregar detalhes do equipamento');
      const data = await res.json();
      setMachine(data);
      setManualForm({
        client_company: data.client_company || '',
        sector: data.sector || '',
        location: data.location || '',
        status: data.status || 'Ativo',
        asset_tag: data.asset_tag || '',
        purchase_date: data.purchase_date || '',
        warranty_end: data.warranty_end || '',
        vendor: data.vendor || '',
        cost: data.cost ? String(data.cost) : '',
        responsible_person: data.responsible_person || '',
        notes: data.notes || ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomStatuses = async () => {
    try {
      const res = await fetch('/api/equipment-statuses');
      if (res.ok) {
        const data = await res.json();
        if (data.statuses) setCustomStatuses(data.statuses);
      }
    } catch (e) {
      console.warn('Erro ao carregar status:', e);
    }
  };

  const fetchStatusLogs = async () => {
    try {
      const res = await fetch(`/api/machines/${machineId}/status-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setStatusLogs(data.logs);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico de status:', e);
    }
  };

  useEffect(() => {
    loadMachineDetails();
    fetchCustomStatuses();
    fetchStatusLogs();
  }, [machineId]);

  const handleRequestStatusChange = (newStatus: string) => {
    if (!machine) return;
    if (newStatus === machine.status) {
      setManualForm(prev => ({ ...prev, status: newStatus }));
      return;
    }
    setPendingTargetStatus(newStatus);
    setIsPasswordModalOpen(true);
  };

  const handleStatusChangeSuccess = (updated: Machine) => {
    setMachine(updated);
    setManualForm(prev => ({ ...prev, status: updated.status }));
    fetchStatusLogs();
    onMachineUpdated();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se o usuário alterou o status no formulário, exige a senha primeiro
    if (machine && manualForm.status !== machine.status) {
      handleRequestStatusChange(manualForm.status);
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...manualForm,
        cost: manualForm.cost ? parseFloat(manualForm.cost) : null
      };

      const res = await fetch(`/api/machines/${machineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar alterações');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onMachineUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'Recente';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days} dias, ${hours} horas e ${mins} minutos`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-300">Carregando especificações técnicas...</p>
        </div>
      </div>
    );
  }

  if (!machine) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
              {machine.machine_type === 'server' ? (
                <Server className="w-6 h-6 text-purple-400" />
              ) : machine.machine_type === 'notebook' ? (
                <Laptop className="w-6 h-6 text-indigo-400" />
              ) : (
                <Monitor className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">{machine.hostname}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded uppercase">
                  {machine.machine_type}
                </span>
                <StatusBadge status={machine.status} customStatuses={customStatuses} size="sm" />
                <button
                  type="button"
                  onClick={() => {
                    setPendingTargetStatus(machine.status === 'Ativo' ? 'Em Manutenção' : 'Ativo');
                    setIsPasswordModalOpen(true);
                  }}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Alterar status operacional com senha de supervisor"
                >
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>Mudar Status</span>
                </button>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {machine.client_company || 'Cliente Geral'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>UUID: <span className="font-mono text-slate-300">{machine.id}</span></span>
                <span>•</span>
                <span>Último reporte: {new Date(machine.last_seen).toLocaleString('pt-BR')}</span>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'hardware'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Hardware & Sistema
          </button>
          <button
            onClick={() => setActiveTab('disks')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'disks'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Discos & Volumes ({machine.disks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('networks')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'networks'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Rede & Interfaces ({machine.networks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Gestão Manual (Patrimônio, Setor)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Telemetria Recente
          </button>
          <button
            onClick={() => setActiveTab('status_audit')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'status_audit'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Auditoria de Status ({statusLogs.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: HARDWARE & OS */}
          {activeTab === 'hardware' && (
            <div className="space-y-6">
              {/* OS & Session Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Sistema Operacional
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Distribuição / SO:</span>
                      <span className="text-white font-medium">{machine.os_name} {machine.os_version}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Build do Kernel:</span>
                      <span className="font-mono text-slate-300">{machine.os_build || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Arquitetura:</span>
                      <span className="font-mono text-slate-300">{machine.os_arch}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Versão do Agente:</span>
                      <span className="font-mono text-blue-400">v{machine.agent_version}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Sessão e Atividade
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Usuário Logado:</span>
                      <span className="text-white font-medium">{machine.logged_user || 'Desconhecido'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Tempo de Atividade (Uptime):</span>
                      <span className="text-emerald-400 font-medium">{formatUptime(machine.uptime_seconds)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Data de Boot:</span>
                      <span className="text-slate-300">{machine.boot_time || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">IP Público / Externo:</span>
                      <span className="font-mono text-slate-300">{machine.public_ip || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPU & Memory Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CPU */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      Processador (CPU)
                    </h3>
                    <span className="text-xs font-mono text-blue-400 font-bold">{machine.cpu_usage_percent}% uso</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-3">{machine.cpu_model}</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Núcleos Físicos</span>
                      <span className="text-white font-bold text-sm">{machine.cpu_cores_physical}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Threads Lógicas</span>
                      <span className="text-white font-bold text-sm">{machine.cpu_cores_logical}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Clock Base</span>
                      <span className="text-white font-bold text-sm">{machine.cpu_freq_ghz} GHz</span>
                    </div>
                  </div>
                </div>

                {/* RAM */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Memória RAM
                    </h3>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{machine.ram_percent}% ocupada</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Usado: <strong>{machine.ram_used_gb} GB</strong></span>
                      <span>Total: <strong>{machine.ram_total_gb} GB</strong></span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.min(machine.ram_percent, 100)}%` }}
                        className={`transition-all rounded-full ${
                          machine.ram_percent > 85 ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Disponível imediatamente: <strong className="text-slate-200">{machine.ram_free_gb} GB</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISKS & PARTITIONS */}
          {activeTab === 'disks' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unidades de Armazenamento e Partições Detectadas
              </h3>
              {(!machine.disks || machine.disks.length === 0) ? (
                <p className="text-xs text-slate-400">Nenhum disco físico reportado pelo agente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machine.disks.map((disk, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-white text-sm">{disk.device}</span>
                          <span className="text-xs text-slate-400">({disk.mountpoint})</span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-300 uppercase">
                          {disk.fstype}
                        </span>
                      </div>

                      <div className="space-y-1.5 my-3">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>{disk.used_gb} GB usados</span>
                          <span className="font-semibold">{disk.percent}%</span>
                          <span>{disk.total_gb} GB total</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${Math.min(disk.percent, 100)}%` }}
                            className={`rounded-full transition-all ${
                              disk.percent >= 90 ? 'bg-rose-500' : disk.percent >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                        <span>Espaço Livre: <strong className="text-slate-200">{disk.free_gb} GB</strong></span>
                        {disk.percent >= 85 && (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Alerta de Espaço
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NETWORKS & INTERFACES */}
          {activeTab === 'networks' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Endereço IP Principal (Rota padrão):</span>
                  <div className="font-mono text-base font-bold text-white">{machine.primary_ip}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Endereço MAC Principal:</span>
                  <div className="font-mono text-base font-bold text-blue-400">{machine.primary_mac}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">IP Público Externo:</span>
                  <div className="font-mono text-base font-bold text-emerald-400">{machine.public_ip || 'N/A'}</div>
                </div>
              </div>

              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Adaptadores e Interfaces de Rede
              </h3>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Adaptador / Interface</th>
                      <th className="py-2.5 px-3">Endereço IPv4</th>
                      <th className="py-2.5 px-3">Máscara de Rede</th>
                      <th className="py-2.5 px-3">MAC Address</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {machine.networks?.map((net, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-blue-400" />
                          {net.interface_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">{net.ip_address || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{net.netmask || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{net.mac_address || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            net.is_up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {net.is_up ? 'CONECTADO' : 'DESCONECTADO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MANUAL FIELDS (EDITABLE IN UI) */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Informações Manuais Gerenciais</h3>
                  <p className="text-xs text-slate-400">Preencha dados de patrimônio, fornecedor, garantia e setor para este ativo.</p>
                </div>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* Empresa Cliente (B2B / MSP) */}
                <div className="sm:col-span-2 md:col-span-3 bg-slate-950/80 border border-blue-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <label className="text-white font-bold flex items-center gap-1.5 text-xs">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      Empresa Cliente Vinculada (Contrato B2B / MSP)
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Vincule este equipamento à respectiva empresa cliente atendida pelo suporte de TI.
                    </p>
                  </div>
                  <div className="w-full sm:w-72">
                    <select
                      value={manualForm.client_company}
                      onChange={(e) => setManualForm({ ...manualForm, client_company: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-900 border border-blue-500/50 rounded-lg text-white font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Selecione uma Empresa Cliente...</option>
                      {companyList.map((c) => (
                        <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                          🏢 {c.name} {c.sla_plan ? `(${c.sla_plan})` : ''}
                        </option>
                      ))}
                      {manualForm.client_company && !companyList.some(c => c.name === manualForm.client_company) && (
                        <option value={manualForm.client_company}>🏢 {manualForm.client_company}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Setor */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Setor / Departamento</label>
                  <input
                    type="text"
                    value={manualForm.sector}
                    onChange={(e) => setManualForm({ ...manualForm, sector: e.target.value })}
                    placeholder="Ex: TI, Financeiro, RH, Engenharia"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Localização */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Localização Física / Sala</label>
                  <input
                    type="text"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                    placeholder="Ex: Matriz - Sala 302, Rack 04"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status Operacional */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Status Operacional (Com Senha)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsStatusManageModalOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Palette className="w-3 h-3" />
                      <span>+ Cadastrar / Gerenciar Status</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={manualForm.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (machine && val !== machine.status) {
                          handleRequestStatusChange(val);
                        } else {
                          setManualForm({ ...manualForm, status: val });
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    >
                      {customStatuses.length > 0 ? (
                        customStatuses.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Ativo">Ativo</option>
                          <option value="Em Manutenção">Em Manutenção</option>
                          <option value="Aguardando Peça">Aguardando Peça</option>
                          <option value="Em Diagnóstico">Em Diagnóstico</option>
                          <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                          <option value="Pronto / Liberado">Pronto / Liberado</option>
                          <option value="Garantia / RMA">Garantia / RMA</option>
                          <option value="Reserva">Reserva</option>
                          <option value="Desativado">Desativado</option>
                          <option value="Quarentena / Bloqueado">Quarentena / Bloqueado</option>
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTargetStatus(manualForm.status);
                        setIsPasswordModalOpen(true);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Autorizar alteração de status com senha"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Patrimônio */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Número de Patrimônio / Tag</label>
                  <input
                    type="text"
                    value={manualForm.asset_tag}
                    onChange={(e) => setManualForm({ ...manualForm, asset_tag: e.target.value })}
                    placeholder="Ex: PAT-00129"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Data de Compra */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data de Aquisição</label>
                  <input
                    type="date"
                    value={manualForm.purchase_date}
                    onChange={(e) => setManualForm({ ...manualForm, purchase_date: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Término da Garantia */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fim da Garantia</label>
                  <input
                    type="date"
                    value={manualForm.warranty_end}
                    onChange={(e) => setManualForm({ ...manualForm, warranty_end: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Fornecedor / Fabricante */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fornecedor / Modelo Comercial</label>
                  <input
                    type="text"
                    value={manualForm.vendor}
                    onChange={(e) => setManualForm({ ...manualForm, vendor: e.target.value })}
                    placeholder="Ex: Dell OptiPlex, Lenovo ThinkPad"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Custo */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor de Compra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualForm.cost}
                    onChange={(e) => setManualForm({ ...manualForm, cost: e.target.value })}
                    placeholder="Ex: 4500.00"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Colaborador Responsável</label>
                  <input
                    type="text"
                    value={manualForm.responsible_person}
                    onChange={(e) => setManualForm({ ...manualForm, responsible_person: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 text-xs">Observações Técnicas / Histórico de Manutenção</label>
                <textarea
                  rows={3}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Ex: Upgrade de SSD efetuado em Jan/2026. Acessórios inclusos: 2 monitores e dockstation."
                  className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Gravando...' : 'Salvar Informações Gerenciais'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: TELEMETRY SNAPSHOT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Snapshots Recentes de Telemetria
              </h3>
              {(!machine.history || machine.history.length === 0) ? (
                <p className="text-xs text-slate-400">Nenhum snapshot de histórico gravado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {machine.history.map((h, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>{new Date(h.recorded_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-blue-400">CPU: {h.cpu_percent}%</span>
                        <span className="text-indigo-400">RAM: {h.ram_percent}%</span>
                        <span className="text-slate-400">Uptime: {Math.round(h.uptime_seconds / 3600)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STATUS AUDIT HISTORY */}
          {activeTab === 'status_audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Histórico de Auditoria de Trocas de Status
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registro de todas as alterações de status deste equipamento validadas por senha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingTargetStatus(machine.status === 'Ativo' ? 'Em Manutenção' : 'Ativo');
                    setIsPasswordModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Alterar Status com Senha</span>
                </button>
              </div>

              {statusLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  Nenhum registro de alteração de status registrado para este equipamento até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {statusLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={log.previous_status || 'Inicial'} customStatuses={customStatuses} size="sm" />
                          <span className="text-slate-500 font-bold">➔</span>
                          <StatusBadge status={log.new_status} customStatuses={customStatuses} size="sm" />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span>Autorizado por: <strong className="text-slate-200">{log.authorized_by}</strong></span>
                        {log.reason && <span className="italic text-slate-400">{log.reason}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Última atualização cadastral: {new Date(machine.updated_at).toLocaleString('pt-BR')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>

      {/* Modal de Senha para Mudança de Status */}
      {isPasswordModalOpen && machine && (
        <StatusChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          machine={machine}
          targetStatus={pendingTargetStatus}
          customStatuses={customStatuses}
          currentUser={currentUser}
          onSuccess={handleStatusChangeSuccess}
        />
      )}

      {/* Modal de Cadastro & Gestão de Status */}
      {isStatusManageModalOpen && (
        <StatusManagementModal
          isOpen={isStatusManageModalOpen}
          onClose={() => setIsStatusManageModalOpen(false)}
          onStatusesChanged={() => {
            fetchCustomStatuses();
            onMachineUpdated();
          }}
        />
      )}
    </div>
  );
};
