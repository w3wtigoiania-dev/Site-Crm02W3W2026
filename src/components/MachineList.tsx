import React, { useState } from 'react';
import { Machine, FilterState, SystemSettings, ClientCompany } from '../types.ts';
import { PhysicalAuditModal } from './PhysicalAuditModal.tsx';
import { exportMachinesToCSV, exportMachinesToPDF } from '../utils/exportUtils.ts';
import { printInventoryReport } from '../utils/printUtils.ts';
import {
  Search,
  Filter,
  Monitor,
  Laptop,
  Server,
  Layers,
  HardDrive,
  Cpu,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  Download,
  Printer,
  ClipboardCheck,
  FileSpreadsheet,
  FileType,
  Building2,
  PlusCircle,
  LayoutGrid,
  Table,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MachineListProps {
  machines: Machine[];
  filters: FilterState;
  settings?: SystemSettings;
  companies?: ClientCompany[];
  onFilterChange: (newFilters: FilterState) => void;
  onSelectMachine: (machine: Machine) => void;
  onEditMachine: (machine: Machine) => void;
  onDeleteMachine: (id: string, hostname: string) => void;
  onOpenAddDevice?: (method?: 'manual' | 'agent') => void;
}

export const MachineList: React.FC<MachineListProps> = ({
  machines,
  filters,
  settings,
  companies = [],
  onFilterChange,
  onSelectMachine,
  onEditMachine,
  onDeleteMachine,
  onOpenAddDevice
}) => {
  const [copiedMac, setCopiedMac] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFiltersCount = [
    filters.company && filters.company !== 'all',
    filters.os && filters.os !== 'all',
    filters.type && filters.type !== 'all',
    filters.status && filters.status !== 'all',
    filters.sector && filters.sector !== 'all',
    Boolean(filters.search)
  ].filter(Boolean).length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMac(id);
    setTimeout(() => setCopiedMac(null), 2000);
  };

  const handleExportCsv = () => {
    const suffix = filters.company && filters.company !== 'all' ? `_${filters.company.toLowerCase().replace(/\s+/g, '_')}` : '';
    exportMachinesToCSV(machines, `inventario_ti_ativos${suffix}`);
  };

  const handleExportPdf = () => {
    const reportTitle = filters.company && filters.company !== 'all'
      ? `RELATÓRIO DE INVENTÁRIO - CLIENTE: ${filters.company.toUpperCase()}`
      : (settings?.report_header || 'RELATÓRIO EXECUTIVO DE INVENTÁRIO TI');

    exportMachinesToPDF(machines, filters, {
      title: reportTitle,
      auditorName: 'Equipe de Infraestrutura & Redes',
      settings
    });
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'Recente';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatLastSeen = (isoString: string) => {
    if (!isoString) return 'Nunca';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays}d`;
  };

  const isOnline = (lastSeen: string) => {
    if (!lastSeen) return false;
    const diffMin = (Date.now() - new Date(lastSeen).getTime()) / 60000;
    return diffMin <= 15;
  };

  const getOsIcon = (osName: string) => {
    const os = (osName || '').toLowerCase();
    if (os.includes('win')) {
      return <span className="text-blue-400 font-bold text-xs">WIN</span>;
    }
    if (os.includes('linux')) {
      return <span className="text-amber-400 font-bold text-xs">LINUX</span>;
    }
    if (os.includes('mac') || os.includes('darwin')) {
      return <span className="text-slate-300 font-bold text-xs">MAC</span>;
    }
    return <span className="text-slate-400 font-bold text-xs">OS</span>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'notebook':
        return <Laptop className="w-4 h-4 text-indigo-400" />;
      case 'vm':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      default:
        return <Monitor className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Ativo</span>;
      case 'Em Manutenção':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">Manutenção</span>;
      case 'Desativado':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">Desativado</span>;
      case 'Reserva':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20 rounded">Reserva</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-700 text-slate-300 rounded">{status}</span>;
    }
  };

  // Distinct sectors
  const sectors = Array.from(new Set(machines.map(m => m.sector || 'Geral'))).sort();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header and Controls */}
      <div className="p-3.5 sm:p-5 border-b border-slate-800 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Inventário de Ativos de TI
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                  {machines.length}
                </span>
              </h2>

              {/* View Mode Switcher Capsule */}
              <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('auto')}
                  title="Modo Automático: Cards no celular e Tabela no computador"
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all cursor-pointer ${
                    viewMode === 'auto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Modo Cards (Otimizado para dispositivos móveis)"
                  className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Modo Tabela Completa"
                  className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span className="hidden sm:inline">Tabela</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lista consolidada de computadores, notebooks e servidores com dados coletados pelo agente
            </p>
          </div>

          {/* Action buttons: Export CSV, Export PDF, Physical Audit Checklist, Add Device */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {onOpenAddDevice && (
              <button
                onClick={() => onOpenAddDevice('manual')}
                title="Cadastrar novo ativo de TI (Opções manuais idênticas ao agente ou coleta automática)"
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400/30 flex-shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
                <span>+ Cadastrar Ativo</span>
              </button>
            )}

            <button
              onClick={() => printInventoryReport(machines, filters, settings)}
              disabled={machines.length === 0}
              title="Imprimir relatório oficial de inventário formatado para impressora ou PDF"
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-blue-950/80 hover:bg-blue-900/90 text-blue-200 hover:text-white text-xs font-semibold rounded-lg border border-blue-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Imprimir Inventário</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={machines.length === 0}
              title="Exportar equipamentos visíveis diretamente para planilha CSV formatada"
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={machines.length === 0}
              title="Gerar e baixar relatório executivo em PDF estilizado com jsPDF"
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileType className="w-3.5 h-3.5 text-rose-400" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              disabled={machines.length === 0}
              title="Abrir laudo de auditoria física para conferência e termo de vistoria"
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-blue-400/30"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Laudo & Vistoria</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Buscar por hostname, usuário, IP, MAC, patrimônio, empresa..."
                value={filters.search}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange({ ...filters, search: '' })}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`sm:hidden px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeFiltersCount > 0
                  ? 'bg-blue-600/25 border-blue-500/60 text-blue-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Dropdowns Grid (Always visible on sm+, expandable on mobile) */}
          <div className={`${showMobileFilters ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1`}>
            {/* Company Filter (MSP) */}
            <div>
              <select
                value={filters.company || 'all'}
                onChange={(e) => onFilterChange({ ...filters, company: e.target.value })}
                className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="all">🏢 Todas as Empresas (MSP)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* OS Filter */}
            <div>
              <select
                value={filters.os}
                onChange={(e) => onFilterChange({ ...filters, os: e.target.value })}
                className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Todos os Sistemas (SO)</option>
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="macOS">macOS</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filters.type}
                onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
                className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                <option value="desktop">Desktop</option>
                <option value="notebook">Notebook</option>
                <option value="server">Servidor</option>
                <option value="vm">Máquina Virtual</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                className="w-full py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Desativado">Desativado</option>
                <option value="Reserva">Reserva</option>
              </select>
            </div>

            {/* Clear Filters (if active) */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ search: '', os: 'all', type: 'all', status: 'all', sector: 'all', company: 'all' })}
                className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer sm:col-span-2 lg:col-span-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Inventory Content: Empty State, Responsive Cards, or High-Density Table */}
      {machines.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Nenhum equipamento encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Nenhuma máquina corresponde aos filtros selecionados. Tente limpar os filtros ou execute o agente de coleta.
          </p>
          <button
            onClick={() => onFilterChange({ search: '', os: 'all', type: 'all', status: 'all', sector: 'all', company: 'all' })}
            className="mt-4 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      ) : (
        <>
          {/* 1. RESPONSIVE MOBILE CARDS VIEW (DEFAULT ON PHONES/TABLETS OR EXPLICIT CARDS VIEW) */}
          {(viewMode === 'cards' || viewMode === 'auto') && (
            <div className={`${viewMode === 'auto' ? 'block md:hidden' : 'block'} p-3 space-y-3 bg-slate-950/30`}>
              {machines.map((m) => {
                const online = isOnline(m.last_seen);
                return (
                  <div
                    key={m.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-3 shadow-sm transition-all"
                  >
                    {/* Header: Hostname, Type, Live Pulse & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                            {getTypeIcon(m.machine_type)}
                          </div>
                          <span
                            title={online ? 'Agente comunicando ativamente' : 'Agente offline'}
                            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                              online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => onSelectMachine(m)}
                            className="font-bold text-white hover:text-blue-400 text-sm transition-colors cursor-pointer text-left truncate block max-w-[180px]"
                          >
                            {m.hostname}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {m.asset_tag ? (
                              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded">
                                {m.asset_tag}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Sem patrimônio</span>
                            )}
                            <span className="text-[10px] text-slate-400 capitalize">• {m.machine_type}</span>
                            {m.client_company && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded truncate max-w-[110px]">
                                {m.client_company}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(m.status)}
                      </div>
                    </div>

                    {/* Metrics Grid (2 columns) */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-800/80">
                      {/* Usuário & Setor */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Usuário / Setor
                        </span>
                        <div className="text-slate-200 font-medium truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{m.logged_user || 'N/A'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {m.sector || 'Geral'}
                        </span>
                      </div>

                      {/* Sistema Operacional */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Sistema Operacional
                        </span>
                        <div className="text-slate-200 font-medium truncate flex items-center gap-1">
                          {getOsIcon(m.os_name)}
                          <span className="truncate">{m.os_name} {m.os_version}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block font-mono">
                          {m.os_arch}
                        </span>
                      </div>

                      {/* CPU & RAM */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          CPU & Memória
                        </span>
                        <div className="text-[11px] text-slate-300 truncate">
                          {m.cpu_cores_logical}c @ {m.cpu_freq_ghz}GHz
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(m.ram_percent, 100)}%` }}
                              className={`h-full rounded-full ${
                                m.ram_percent > 85 ? 'bg-rose-500' : m.ram_percent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {m.ram_used_gb}/{m.ram_total_gb}G
                          </span>
                        </div>
                      </div>

                      {/* Rede & IPs */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Endereço de Rede
                        </span>
                        <span className="text-slate-200 font-mono text-[11px] block truncate">
                          {m.primary_ip || '127.0.0.1'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-slate-400 truncate">
                            {m.primary_mac || '00:00:00:00:00:00'}
                          </span>
                          <button
                            onClick={() => handleCopy(m.primary_mac, m.id)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 flex-shrink-0 cursor-pointer"
                            title="Copiar MAC Address"
                          >
                            {copiedMac === m.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Uptime + Action Buttons with touch-friendly targets */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Uptime: {formatUptime(m.uptime_seconds)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectMachine(m)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ver Hardware & Telemetria"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Detalhes</span>
                        </button>
                        <button
                          onClick={() => onEditMachine(m)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Editar Campos Manuais"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMachine(m.id, m.hostname)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Excluir Equipamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. HIGH-DENSITY TABULAR VIEW (DEFAULT ON DESKTOP/TABLET OR EXPLICIT TABLE VIEW) */}
          {(viewMode === 'table' || viewMode === 'auto') && (
            <div className={`${viewMode === 'auto' ? 'hidden md:block' : 'block'} overflow-x-auto`}>
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Equipamento / Host</th>
                    <th className="py-3 px-4">Empresa Cliente (MSP)</th>
                    <th className="py-3 px-4">Usuário / Setor</th>
                    <th className="py-3 px-4">Sistema Operacional</th>
                    <th className="py-3 px-4">CPU & Memória</th>
                    <th className="py-3 px-4">Endereço de Rede</th>
                    <th className="py-3 px-4">Uptime / Visto</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {machines.map((m) => {
                    const online = isOnline(m.last_seen);
                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Hostname & Asset Tag */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                                {getTypeIcon(m.machine_type)}
                              </div>
                              {/* Live pulse dot */}
                              <span
                                title={online ? 'Agente comunicando ativamente' : 'Agente offline'}
                                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                                  online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => onSelectMachine(m)}
                                className="font-bold text-white hover:text-blue-400 text-xs transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                              >
                                <span>{m.hostname}</span>
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {m.asset_tag ? (
                                  <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded">
                                    {m.asset_tag}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Sem patrimônio</span>
                                )}
                                <span className="text-[10px] text-slate-500 capitalize">• {m.machine_type}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client Company */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="truncate max-w-[130px]" title={m.client_company || 'Cliente Geral'}>
                              {m.client_company || 'Cliente Geral'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {m.location || 'Matriz'}
                          </div>
                        </td>

                        {/* User & Sector */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>{m.logged_user || 'N/A'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={m.sector}>
                            {m.sector || 'Geral'}
                          </div>
                        </td>

                        {/* OS */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {getOsIcon(m.os_name)}
                            <span className="text-slate-200 font-medium truncate max-w-[150px]" title={`${m.os_name} ${m.os_version}`}>
                              {m.os_name} {m.os_version}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {m.os_arch} • build {m.os_build ? m.os_build.slice(0, 10) : ''}
                          </div>
                        </td>

                        {/* CPU & RAM */}
                        <td className="py-3.5 px-4 min-w-[150px]">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                            <span className="truncate max-w-[100px]" title={m.cpu_model}>
                              {m.cpu_cores_logical}c @ {m.cpu_freq_ghz}GHz
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {m.ram_used_gb} / {m.ram_total_gb} GB
                            </span>
                          </div>
                          {/* Mini RAM progress */}
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${Math.min(m.ram_percent, 100)}%` }}
                              className={`rounded-full transition-all ${
                                m.ram_percent > 85 ? 'bg-rose-500' : m.ram_percent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Network IPs */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] text-slate-200 flex items-center gap-1">
                            <span>{m.primary_ip || '127.0.0.1'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">
                              {m.primary_mac || '00:00:00:00:00:00'}
                            </span>
                            <button
                              onClick={() => handleCopy(m.primary_mac, m.id)}
                              title="Copiar MAC Address"
                              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                            >
                              {copiedMac === m.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Uptime & Last seen */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-slate-300 font-medium">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatUptime(m.uptime_seconds)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatLastSeen(m.last_seen)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(m.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onSelectMachine(m)}
                              title="Ver Especificações Completas"
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditMachine(m)}
                              title="Editar Informações Manuais (Setor, Patrimônio, etc.)"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMachine(m.id, m.hostname)}
                              title="Excluir Equipamento"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Physical Audit Report & PDF Modal */}
      {isAuditModalOpen && (
        <PhysicalAuditModal
          machines={machines}
          filters={filters}
          settings={settings}
          onClose={() => setIsAuditModalOpen(false)}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
};
