import React, { useState, useEffect, useCallback } from 'react';
import { Machine, DashboardStats, FilterState, SystemSettings, ClientCompany, WebsiteConfig } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { StatsDashboard } from './components/StatsDashboard.tsx';
import { MachineList } from './components/MachineList.tsx';
import { MachineDetailModal } from './components/MachineDetailModal.tsx';
import { AgentHubModal } from './components/AgentHubModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CompaniesModal } from './components/CompaniesModal.tsx';
import { MaintenanceCalendar } from './components/MaintenanceCalendar.tsx';
import { FinancialModule } from './components/FinancialModule.tsx';
import { UsersModal } from './components/UsersModal.tsx';
import { LoginView } from './components/LoginView.tsx';
import { W3WSiteView } from './components/W3WSiteView.tsx';
import { AddDeviceModal } from './components/AddDeviceModal.tsx';
import { WebsiteCMSManager } from './components/WebsiteCMSManager.tsx';
import { BackupExportModal } from './components/BackupExportModal.tsx';
import { cmsSyncManager } from './services/cmsSyncModule.ts';
import { Monitor, CalendarDays, CreditCard, Globe, Server, Shield, Layers, Eye } from 'lucide-react';

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'InfraAsset IT Solutions',
  system_title: 'INFRA ASSET MANAGER',
  department: 'Infraestrutura, Redes & Governança de TI',
  logo_url: '',
  footer_text: 'INFRA ASSET MANAGER • Gestão de Ativos & Telemetria em Tempo Real',
  report_header: 'RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL'
};

export default function App() {
  const [currentView, setCurrentView] = useState<'frontend' | 'backend'>(() => {
    const saved = localStorage.getItem('w3w_active_view');
    return (saved === 'backend' || saved === 'frontend') ? saved : 'frontend';
  });

  const [user, setUser] = useState<{ name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('infra_user');
    const token = localStorage.getItem('infra_session_token');
    return (saved && token) ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('infra_system_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [machines, setMachines] = useState<Machine[]>([]);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    os: 'all',
    type: 'all',
    status: 'all',
    sector: 'all',
    company: 'all'
  });

  // Modal states
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'hardware' | 'manual'>('hardware');
  const [isAgentHubOpen, setIsAgentHubOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [addDeviceInitialMethod, setAddDeviceInitialMethod] = useState<'manual' | 'agent'>('manual');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'calendar' | 'financial' | 'website'>('inventory');

  const handleSwitchView = (view: 'frontend' | 'backend') => {
    setCurrentView(view);
    localStorage.setItem('w3w_active_view', view);
  };

  // Load system settings from backend
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        localStorage.setItem('infra_system_settings', JSON.stringify(data));
        if (data.website_config) {
          cmsSyncManager.setFromExternal(data.website_config);
        }
      }
    } catch (err) {
      console.warn('Usando configurações do cache local:', err);
    }
  }, []);

  // Load client companies from backend
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar lista de empresas clientes:', err);
    }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.os && filters.os !== 'all') queryParams.set('os', filters.os);
      if (filters.type && filters.type !== 'all') queryParams.set('type', filters.type);
      if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.sector && filters.sector !== 'all') queryParams.set('sector', filters.sector);
      if (filters.company && filters.company !== 'all') queryParams.set('company', filters.company);

      const statsQuery = filters.company && filters.company !== 'all' 
        ? `?company=${encodeURIComponent(filters.company)}` 
        : '';

      const [machinesRes, statsRes] = await Promise.all([
        fetch(`/api/machines?${queryParams.toString()}`),
        fetch(`/api/stats${statsQuery}`)
      ]);

      if (machinesRes.ok) {
        const mData = await machinesRes.json();
        setMachines(mData.data || []);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do inventário:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSettings();
    fetchCompanies();
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchSettings, fetchCompanies]);

  const handleLiveUpdateWebConfig = useCallback((newConfig: WebsiteConfig) => {
    setSettings(prev => ({
      ...prev,
      website_config: newConfig
    }));
    cmsSyncManager.updateConfig(newConfig, true);
    try {
      const saved = localStorage.getItem('infra_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.website_config = newConfig;
        localStorage.setItem('infra_system_settings', JSON.stringify(parsed));
      }
    } catch (e) {}
  }, []);

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    // Immediate reactive local state update without delay
    setSettings(newSettings);
    localStorage.setItem('infra_system_settings', JSON.stringify(newSettings));

    if (newSettings.website_config) {
      cmsSyncManager.updateConfig(newSettings.website_config, false);
    }

    // Broadcast across windows/tabs
    if (newSettings.website_config && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('w3w_website_config_updated', {
          detail: newSettings.website_config
        })
      );
    }

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao salvar configurações no servidor');
    }

    const data = await res.json();
    setSettings(data.settings);
    localStorage.setItem('infra_system_settings', JSON.stringify(data.settings));
    if (data.settings?.website_config) {
      cmsSyncManager.setFromExternal(data.settings.website_config);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('infra_session_token');
    localStorage.removeItem('infra_user');
    setUser(null);
    setCurrentView('frontend');
    localStorage.setItem('w3w_active_view', 'frontend');
  };

  const handleDeleteMachine = async (id: string, hostname: string) => {
    if (!window.confirm(`Deseja realmente remover o equipamento "${hostname}" do inventário?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData(true);
        fetchCompanies();
      }
    } catch (err) {
      console.error('Falha ao excluir equipamento:', err);
    }
  };

  const handleOpenCRM = () => {
    // Ao clicar no botão de acesso ao CRM, exige autenticação com usuário e senha conforme Imagem 02
    setUser(null);
    localStorage.removeItem('infra_session_token');
    localStorage.removeItem('infra_user');
    setCurrentView('backend');
    localStorage.setItem('w3w_active_view', 'backend');
  };

  if (currentView === 'frontend') {
    return (
      <div className="relative">
        <W3WSiteView
          onEnterCRM={handleOpenCRM}
          currentView={currentView}
          onSwitchView={(view) => {
            if (view === 'backend') {
              handleOpenCRM();
            } else {
              handleSwitchView(view);
            }
          }}
          websiteConfig={settings.website_config}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <LoginView
          settings={settings}
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          onOpenSite={() => handleSwitchView('frontend')}
          currentView={currentView}
          onSwitchView={handleSwitchView}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative">
      {/* Top Navigation */}
      <Navbar
        user={user}
        settings={settings}
        companies={companies}
        selectedCompany={filters.company || 'all'}
        onSelectCompany={(companyName) => setFilters(prev => ({ ...prev, company: companyName }))}
        onOpenCompanies={() => setIsCompaniesOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAgentHub={() => setIsAgentHubOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUsers={() => setIsUsersOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onRefresh={() => {
          fetchData(false);
          fetchCompanies();
        }}
        isRefreshing={isRefreshing}
        onToggleFrontend={() => handleSwitchView('frontend')}
        currentView={currentView}
        onSwitchView={handleSwitchView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Navigation Switcher Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('inventory')}
              title="Inventário de Ativos"
              className={`h-9 px-3 sm:px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Inventário</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === 'inventory' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {machines.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              title="Calendário & Garantias"
              className={`h-9 px-3 sm:px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Calendário</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-mono">
                Prazos
              </span>
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              title="Financeiro & Cartões PJ"
              className={`h-9 px-3 sm:px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'financial'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />
              <span className="whitespace-nowrap">Financeiro PJ</span>
            </button>

            <button
              onClick={() => setActiveTab('website')}
              title="Gestão de Slides, Banners e Conteúdo do Site (CMS Integrado ao CRM)"
              className={`h-9 px-3 sm:px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'website'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Site CMS</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full font-mono">
                W3W
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
            <button
              onClick={() => handleSwitchView('frontend')}
              className="h-8.5 px-3 text-xs font-bold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
              title="Ir para o Frontend (Site Oficial W3W Soluções em TI - Imagem 02)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Site Oficial</span>
            </button>

            <div className="text-xs text-slate-400 hidden xl:block">
              {activeTab === 'inventory' ? (
                <span>Monitoramento de telemetria em tempo real e cadastro técnico de ativos B2B/MSP</span>
              ) : activeTab === 'calendar' ? (
                <span>Cronograma de vencimento de garantias, manutenções técnicas e renovação de parque</span>
              ) : activeTab === 'financial' ? (
                <span>Gestão de Cartões de Crédito Corporativos PJ, despesas parceladas, Contas a Pagar e Receber</span>
              ) : (
                <span>Gerencie os slides do banner principal, textos e contatos exibidos no site institucional</span>
              )}
            </div>
          </div>
        </div>

        {/* View Content */}
        {activeTab === 'inventory' ? (
          <>
            {/* KPI Dashboard */}
            <StatsDashboard
              stats={stats}
              selectedCompany={filters.company || 'all'}
              onClearCompanyFilter={() => setFilters(prev => ({ ...prev, company: 'all' }))}
              onFilterByOS={(os) => setFilters(prev => ({ ...prev, os }))}
              onFilterByType={(type) => setFilters(prev => ({ ...prev, type }))}
              onFilterByStatus={(status) => setFilters(prev => ({ ...prev, status }))}
            />

            {/* Machine Inventory Table */}
            <MachineList
              machines={machines}
              filters={filters}
              settings={settings}
              companies={companies}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              onSelectMachine={(m) => {
                setSelectedMachineId(m.id);
                setModalTab('hardware');
              }}
              onEditMachine={(m) => {
                setSelectedMachineId(m.id);
                setModalTab('manual');
              }}
              onDeleteMachine={handleDeleteMachine}
              onOpenAddDevice={(method) => {
                setAddDeviceInitialMethod(method || 'manual');
                setIsAddDeviceOpen(true);
              }}
            />
          </>
        ) : activeTab === 'calendar' ? (
          <MaintenanceCalendar
            machines={machines}
            settings={settings}
            companies={companies}
            selectedCompany={filters.company || 'all'}
            onSelectCompany={(companyName) => setFilters(prev => ({ ...prev, company: companyName }))}
            onSelectMachine={(m) => {
              setSelectedMachineId(m.id);
              setModalTab('hardware');
            }}
            onEditMachine={(m) => {
              setSelectedMachineId(m.id);
              setModalTab('manual');
            }}
            onRefreshMachines={() => {
              fetchData(true);
            }}
          />
        ) : activeTab === 'financial' ? (
          <FinancialModule
            companies={companies}
            selectedCompany={filters.company || 'all'}
            userRole={user?.role}
            userCompany={(user as any)?.company_name}
            onRefreshData={() => {
              fetchData(true);
            }}
          />
        ) : (
          <WebsiteCMSManager
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onLiveUpdate={handleLiveUpdateWebConfig}
            onViewWebsite={() => handleSwitchView('frontend')}
            onOpenBackup={() => setIsBackupOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{settings.footer_text || 'InfraAsset IT • Gestão de Ativos & Telemetria em Tempo Real'}</span>
          <span className="font-mono text-slate-400 text-[11px]">
            API REST v2.4.0 • SQLite Engine • Gestão Multi-Empresa B2B / MSP
          </span>
        </div>
      </footer>

      {/* Details & Edit Modal */}
      {selectedMachineId && (
        <MachineDetailModal
          machineId={selectedMachineId}
          initialTab={modalTab}
          companies={companies}
          onClose={() => setSelectedMachineId(null)}
          onMachineUpdated={() => {
            fetchData(true);
            fetchCompanies();
          }}
        />
      )}

      {/* Agent Hub & Deployment Modal */}
      {isAgentHubOpen && (
        <AgentHubModal
          companies={companies}
          defaultCompany={filters.company && filters.company !== 'all' ? filters.company : undefined}
          onClose={() => setIsAgentHubOpen(false)}
          onSimulationSuccess={() => {
            fetchData(true);
            fetchCompanies();
          }}
        />
      )}

      {/* Add Device Modal (Opção de Cadastrar com as mesmas opções do agente de forma manual) */}
      {isAddDeviceOpen && (
        <AddDeviceModal
          companies={companies}
          userCompany={(user as any)?.company_name}
          userRole={user?.role}
          onClose={() => setIsAddDeviceOpen(false)}
          onDeviceAdded={() => {
            fetchData(true);
            fetchCompanies();
          }}
        />
      )}

      {/* System Settings & Logo Parameters Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          onOpenWebsiteCMS={() => setActiveTab('website')}
          onOpenWebsite={() => handleSwitchView('frontend')}
          onOpenBackup={() => setIsBackupOpen(true)}
        />
      )}

      {/* Database Backup & Export Modal (MySQL, JSON, CSV) */}
      {isBackupOpen && (
        <BackupExportModal
          onClose={() => setIsBackupOpen(false)}
        />
      )}

      {/* Client Companies Management Modal */}
      {isCompaniesOpen && (
        <CompaniesModal
          companies={companies}
          selectedCompany={filters.company || 'all'}
          onSelectCompany={(companyName) => {
            setFilters(prev => ({ ...prev, company: companyName }));
            setIsCompaniesOpen(false);
          }}
          onRefreshCompanies={async () => {
            await fetchCompanies();
            await fetchData(true);
          }}
          onClose={() => setIsCompaniesOpen(false)}
        />
      )}

      {/* Users & RBAC Permissions Modal */}
      {isUsersOpen && (
        <UsersModal
          currentUser={user}
          onClose={() => setIsUsersOpen(false)}
        />
      )}
    </div>
  );
}
