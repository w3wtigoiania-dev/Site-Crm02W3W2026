import React from 'react';
import { DashboardStats } from '../types.ts';
import {
  Monitor,
  Laptop,
  Server,
  Cpu,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Activity,
  Building2,
  Globe
} from 'lucide-react';

interface StatsDashboardProps {
  stats: DashboardStats | null;
  selectedCompany?: string;
  onClearCompanyFilter?: () => void;
  onFilterByOS?: (os: string) => void;
  onFilterByType?: (type: string) => void;
  onFilterByStatus?: (status: string) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  selectedCompany = 'all',
  onClearCompanyFilter,
  onFilterByOS,
  onFilterByType,
  onFilterByStatus
}) => {
  if (!stats) return null;

  const total = stats.total || 1;
  const winPct = Math.round((stats.os.windows / total) * 100);
  const linuxPct = Math.round((stats.os.linux / total) * 100);
  const macPct = Math.round((stats.os.macos / total) * 100);

  return (
    <div className="space-y-4">
      {/* Active Company Banner */}
      {selectedCompany && selectedCompany !== 'all' && (
        <div className="bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">
                Visão Filtrada B2B / MSP
              </span>
              <span className="text-white font-bold text-sm">
                {selectedCompany}
              </span>
              <span className="text-slate-400 ml-2">
                ({stats.total} {stats.total === 1 ? 'máquina vinculada' : 'máquinas vinculadas'})
              </span>
            </div>
          </div>
          {onClearCompanyFilter && (
            <button
              onClick={onClearCompanyFilter}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Ver Visão Global (Todas as Empresas)</span>
            </button>
          )}
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Ativos</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">máquinas cadastradas</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.online} online
            </span>
            <span>•</span>
            <span className="text-slate-400">
              {stats.offline} offline
            </span>
          </div>
        </div>

        {/* Card 2: Status Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disponibilidade</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-400">
              {total > 0 ? Math.round((stats.online / total) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400">taxa de resposta</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span
              onClick={() => onFilterByStatus?.('Ativo')}
              className="hover:text-blue-400 cursor-pointer"
            >
              {stats.status.ativo} Ativos
            </span>
            <span
              onClick={() => onFilterByStatus?.('Em Manutenção')}
              className="text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              {stats.status.manutencao} Manutenção
            </span>
          </div>
        </div>

        {/* Card 3: Servers & Workstations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Servidores / Clientes</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{stats.types.servers}</span>
            <span className="text-xs text-purple-400 font-medium">servidores</span>
            <span className="text-xs text-slate-500">/ {stats.types.desktops + stats.types.notebooks} clientes</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span
              onClick={() => onFilterByType?.('notebook')}
              className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5" />
              {stats.types.notebooks} Notebooks
            </span>
            <span>•</span>
            <span
              onClick={() => onFilterByType?.('desktop')}
              className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              {stats.types.desktops} Desktops
            </span>
          </div>
        </div>

        {/* Card 4: Telemetry Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Atenção e Alertas</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tracking-tight ${stats.alerts.diskAlerts + stats.alerts.ramAlerts > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {stats.alerts.diskAlerts + stats.alerts.ramAlerts}
            </span>
            <span className="text-xs text-slate-400">máquinas com recursos críticos</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-rose-400">
              <HardDrive className="w-3 h-3" />
              {stats.alerts.diskAlerts} Disco &gt; 85%
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3 h-3" />
              {stats.alerts.longUptimeCount} Uptime &gt; 30d
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Distributions (OS breakdown + Machine Types breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OS Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Distribuição por Sistema Operacional
            </h3>
            <span className="text-xs text-slate-400">Windows vs Linux vs macOS</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex mb-3">
            <div
              style={{ width: `${winPct}%` }}
              className="bg-blue-500 hover:bg-blue-400 transition-all cursor-pointer"
              title={`Windows: ${stats.os.windows} (${winPct}%)`}
            />
            <div
              style={{ width: `${linuxPct}%` }}
              className="bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
              title={`Linux: ${stats.os.linux} (${linuxPct}%)`}
            />
            <div
              style={{ width: `${macPct}%` }}
              className="bg-slate-300 hover:bg-white transition-all cursor-pointer"
              title={`macOS: ${stats.os.macos} (${macPct}%)`}
            />
          </div>

          {/* OS Badges */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onFilterByOS?.('Windows')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-400">Windows</span>
                <span className="text-xs font-bold text-white">{stats.os.windows}</span>
              </div>
              <span className="text-[11px] text-slate-400">{winPct}% do parque</span>
            </button>

            <button
              onClick={() => onFilterByOS?.('Linux')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-amber-400">Linux</span>
                <span className="text-xs font-bold text-white">{stats.os.linux}</span>
              </div>
              <span className="text-[11px] text-slate-400">{linuxPct}% do parque</span>
            </button>

            <button
              onClick={() => onFilterByOS?.('macOS')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">macOS</span>
                <span className="text-xs font-bold text-white">{stats.os.macos}</span>
              </div>
              <span className="text-[11px] text-slate-400">{macPct}% do parque</span>
            </button>
          </div>
        </div>

        {/* Machine Types Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Classificação dos Equipamentos
            </h3>
            <span className="text-xs text-slate-400">Desktops vs Notebooks vs Servidores</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onFilterByType?.('desktop')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">{stats.types.desktops}</span>
              </div>
              <p className="text-xs font-medium text-slate-200">Desktops</p>
              <p className="text-[10px] text-slate-400">Estações fixas</p>
            </button>

            <button
              onClick={() => onFilterByType?.('notebook')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">{stats.types.notebooks}</span>
              </div>
              <p className="text-xs font-medium text-slate-200">Notebooks</p>
              <p className="text-[10px] text-slate-400">Portáteis corporativos</p>
            </button>

            <button
              onClick={() => onFilterByType?.('server')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">{stats.types.servers}</span>
              </div>
              <p className="text-xs font-medium text-slate-200">Servidores</p>
              <p className="text-[10px] text-slate-400">Físicos / Produção</p>
            </button>

            <button
              onClick={() => onFilterByType?.('vm')}
              className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">{stats.types.vms}</span>
              </div>
              <p className="text-xs font-medium text-slate-200">VMs / Virtuais</p>
              <p className="text-[10px] text-slate-400">Instâncias virtuais</p>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800">
            <span>Setores principais identificados:</span>
            <div className="flex items-center gap-2 overflow-x-auto max-w-[65%]">
              {stats.sectors.slice(0, 3).map((sec, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                  {sec.name} ({sec.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
