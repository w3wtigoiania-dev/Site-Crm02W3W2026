import React, { useState } from 'react';
import { SystemSettings, ClientCompany } from '../types.ts';
import { W3WLogo } from './W3WLogo.tsx';
import {
  Server,
  Terminal,
  Download,
  RefreshCw,
  LogOut,
  Settings,
  ShieldCheck,
  CalendarDays,
  Building2,
  Plus,
  Users,
  CreditCard,
  Globe,
  Layers,
  Database,
  Menu,
  X,
  Monitor
} from 'lucide-react';

interface NavbarProps {
  user: { name: string; role: string } | null;
  settings: SystemSettings;
  companies?: ClientCompany[];
  selectedCompany?: string;
  onSelectCompany?: (companyName: string) => void;
  onOpenCompanies?: () => void;
  activeTab?: 'inventory' | 'calendar' | 'financial' | 'website';
  onChangeTab?: (tab: 'inventory' | 'calendar' | 'financial' | 'website') => void;
  onLogout: () => void;
  onOpenAgentHub: () => void;
  onOpenSettings: () => void;
  onOpenUsers?: () => void;
  onOpenBackup?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleFrontend?: () => void;
  currentView?: 'frontend' | 'backend';
  onSwitchView?: (view: 'frontend' | 'backend') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  settings,
  companies = [],
  selectedCompany = 'all',
  onSelectCompany,
  onOpenCompanies,
  activeTab = 'inventory',
  onChangeTab,
  onLogout,
  onOpenAgentHub,
  onOpenSettings,
  onOpenUsers,
  onOpenBackup,
  onRefresh,
  isRefreshing,
  onToggleFrontend,
  currentView = 'backend',
  onSwitchView
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Configurable Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {settings.logo_url ? (
              <div className="h-9 sm:h-10 max-w-[120px] sm:max-w-[150px] flex items-center justify-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner">
                <img
                  src={settings.logo_url}
                  alt={settings.company_name || 'Logo'}
                  className="max-h-7 sm:max-h-8 max-w-[110px] sm:max-w-[130px] object-contain"
                />
              </div>
            ) : (
              <W3WLogo className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-none">
                  {settings.system_title || 'InfraAsset IT'}
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded flex-shrink-0">
                  MSP
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                {settings.company_name} • {settings.department || 'Gestão de Ativos'}
              </p>
            </div>
          </div>

          {/* Center: B2B Client Company Switcher Dropdown (Desktop Only) */}
          {onSelectCompany && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-inner flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Empresa Cliente:</span>
                <select
                  value={selectedCompany}
                  onChange={(e) => onSelectCompany(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer max-w-[180px] xl:max-w-[220px] truncate"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">
                    🏢 Todas as Empresas (Visão Global)
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                      {c.name} ({c.machine_count || 0})
                    </option>
                  ))}
                </select>
              </div>
              {onOpenCompanies && (
                <button
                  type="button"
                  onClick={onOpenCompanies}
                  title="Gerenciar Empresas Clientes (Cadastrar, editar ou remover)"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-md transition-colors cursor-pointer ml-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Actions Section: Responsive Flexbox with Desktop Tools + Mobile Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* FRONTEND / BACKEND SWITCHER (ALWAYS VISIBLE & COMPACT) */}
            <div className="flex items-center bg-[#070c16] border border-slate-800/90 rounded-xl p-1 shadow-inner gap-1 flex-shrink-0">
              {/* Frontend Icon (Globe) */}
              <button
                onClick={() => (onSwitchView ? onSwitchView('frontend') : onToggleFrontend ? onToggleFrontend() : null)}
                title="Frontend: Site Oficial W3W Soluções TI"
                aria-label="Frontend - Site Oficial W3W"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  currentView === 'frontend'
                    ? 'bg-[#0e1627] text-orange-400 border border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                    : 'text-slate-400 hover:text-orange-400 hover:bg-slate-800/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
              </button>

              {/* Backend Icon (Server) */}
              <button
                onClick={() => (onSwitchView ? onSwitchView('backend') : null)}
                title="Backend: CRM & Gestão de Ativos (Ativo)"
                aria-label="Backend - CRM & Gestão de Ativos"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  currentView === 'backend'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/60'
                }`}
              >
                <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200" />
              </button>
            </div>

            {/* Refresh Button (Always Visible) */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar lista e dados"
              className="h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline whitespace-nowrap">Atualizar</span>
            </button>

            {/* DESKTOP-ONLY ACTIONS (HIDDEN ON MOBILE < 1024px) */}
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
              {/* CMS Site & Slides shortcut */}
              {onChangeTab && (
                <button
                  onClick={() => onChangeTab(activeTab === 'website' ? 'inventory' : 'website')}
                  title="Gestão de Slides e Conteúdo do Site (CMS Integrado ao CRM)"
                  className={`h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0 ${
                    activeTab === 'website'
                      ? 'bg-orange-500/25 text-orange-300 border-orange-500/50 shadow-orange-500/20 ring-1 ring-orange-500/30 font-bold'
                      : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  <span className="hidden xl:inline whitespace-nowrap">CMS Slides</span>
                </button>
              )}

              {/* Financial Module Shortcut Button */}
              {onChangeTab && (
                <button
                  onClick={() => onChangeTab(activeTab === 'financial' ? 'inventory' : 'financial')}
                  title="Módulo Financeiro: Controlador de Cartões de Crédito PJ, Contas a Pagar e Receber"
                  className={`h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0 ${
                    activeTab === 'financial'
                      ? 'bg-purple-600/25 text-purple-300 border-purple-500/50 shadow-purple-500/20 ring-1 ring-purple-500/30'
                      : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="hidden xl:inline whitespace-nowrap">Financeiro PJ</span>
                </button>
              )}

              {/* Calendar Shortcut Button */}
              {onChangeTab && (
                <button
                  onClick={() => onChangeTab(activeTab === 'calendar' ? 'inventory' : 'calendar')}
                  title="Calendário e Cronograma de Garantias"
                  className={`h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0 ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600/25 text-blue-300 border-blue-500/50 ring-1 ring-blue-500/30'
                      : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                  <span className="hidden xl:inline whitespace-nowrap">Calendário</span>
                </button>
              )}

              {/* Settings & Parameters Button */}
              <button
                onClick={onOpenSettings}
                title="Configurações e Parâmetros (Logotipo, Empresa, Relatórios)"
                className="h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="hidden xl:inline whitespace-nowrap">Configurações</span>
              </button>

              {/* Backup & Export Database Button */}
              {onOpenBackup && (
                <button
                  onClick={onOpenBackup}
                  title="Backup e Exportação do Banco de Dados (MySQL / JSON / CSV)"
                  className="h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
                >
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="hidden xl:inline whitespace-nowrap">Backup DB</span>
                </button>
              )}

              {/* Users & RBAC Permissions Button */}
              {onOpenUsers && (
                <button
                  onClick={onOpenUsers}
                  title="Gestão de Usuários e Matriz de Permissões (RBAC)"
                  className="h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="hidden xl:inline whitespace-nowrap">Usuários & RBAC</span>
                </button>
              )}

              {/* Agent Hub Button */}
              <button
                onClick={onOpenAgentHub}
                title="Central de Comandos do Agente"
                className="h-8 w-8 sm:h-9 sm:w-auto p-1.5 sm:px-2.5 xl:px-3 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400/30 flex-shrink-0"
              >
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xl:inline whitespace-nowrap">Central do Agente</span>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-800 mx-1 flex-shrink-0" />

              {/* User Profile & Logout */}
              <div className="flex items-center gap-1.5 pl-0.5 flex-shrink-0">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{user?.name || 'Administrador'}</span>
                  <span className="text-[10px] text-slate-400">{user?.role || 'Infraestrutura'}</span>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  title="Sair do painel"
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* MOBILE HAMBURGER MENU BUTTON (VISIBLE ON MOBILE < 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer shadow-sm relative flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
              {selectedCompany !== 'all' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE DRAWER / EXPANDABLE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* 1. Empresa Cliente MSP Dropdown */}
          {onSelectCompany && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Empresa Cliente (MSP)
                </span>
                {onOpenCompanies && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCompanies();
                    }}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Gerenciar
                  </button>
                )}
              </div>
              <select
                value={selectedCompany}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">🏢 Todas as Empresas (Visão Global)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.machine_count || 0} máquinas)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Módulos Principais do Sistema */}
          {onChangeTab && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block">
                Módulos do Sistema
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onChangeTab('inventory');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-blue-600/25 border-blue-500/60 text-white font-bold ring-1 ring-blue-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs truncate">Inventário</span>
                </button>

                <button
                  onClick={() => {
                    onChangeTab('calendar');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600/25 border-blue-500/60 text-white font-bold ring-1 ring-blue-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs truncate">Calendário</span>
                </button>

                <button
                  onClick={() => {
                    onChangeTab('financial');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'financial'
                      ? 'bg-purple-600/25 border-purple-500/60 text-white font-bold ring-1 ring-purple-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-xs truncate">Financeiro PJ</span>
                </button>

                <button
                  onClick={() => {
                    onChangeTab('website');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'website'
                      ? 'bg-orange-500/25 border-orange-500/60 text-white font-bold ring-1 ring-orange-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-xs truncate">CMS Slides</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Ferramentas Administrativas & Técnicas */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block">
              Ferramentas de Gestão
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAgentHub();
                }}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs border border-blue-400/30 shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-white flex-shrink-0" />
                <span className="truncate">Central do Agente</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="truncate">Configurações</span>
              </button>

              {onOpenBackup && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Backup BD</span>
                </button>
              )}

              {onOpenUsers && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenUsers();
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">Usuários & RBAC</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Usuário & Logout */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <span className="block text-xs font-bold text-white leading-tight">
                  {user?.name || 'Administrador'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {user?.role || 'Infraestrutura'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Deslogar do CRM (com opção de ir para o Frontend da W3W) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Encerrar Sessão</h3>
                <p className="text-xs text-slate-400">Escolha para onde deseja ir ao sair do CRM:</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                  if (onToggleFrontend) onToggleFrontend();
                }}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Voltar para o Site Oficial (w3wsolucoesti.com.br)</span>
              </button>

              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Apenas Sair e Ir para Tela de Login</span>
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/60 text-slate-400 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
