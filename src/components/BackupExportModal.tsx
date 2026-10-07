import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  FileCode,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Table,
  Layers,
  Shield,
  Eye,
  Server,
  Sparkles
} from 'lucide-react';

interface BackupStats {
  timestamp: string;
  total_records: number;
  tables_count: number;
  table_stats: Record<string, number>;
}

interface BackupExportModalProps {
  onClose: () => void;
}

const TABLE_LABELS: Record<string, { name: string; category: string; description: string }> = {
  all: {
    name: 'Todas as Tabelas (Dump Completo do Banco)',
    category: 'Geral',
    description: 'Inclui todos os ativos, configurações, clientes, usuários e dados financeiros'
  },
  machines: {
    name: 'Ativos de TI & Máquinas (machines)',
    category: 'Inventário',
    description: 'Computadores, servidores, hardware, IP, MAC e telemetria'
  },
  machine_disks: {
    name: 'Discos e Partições (machine_disks)',
    category: 'Inventário',
    description: 'Volumes, pontos de montagem e espaço livre de armazenamento'
  },
  machine_networks: {
    name: 'Interfaces de Rede (machine_networks)',
    category: 'Inventário',
    description: 'Placas de rede, endereços IP, MAC e status de link'
  },
  client_companies: {
    name: 'Empresas Clientes B2B (client_companies)',
    category: 'Empresas',
    description: 'Cadastro de clientes corporativos, contatos e planos de SLA'
  },
  system_settings: {
    name: 'Configurações do Sistema & CMS (system_settings)',
    category: 'Sistema',
    description: 'Logotipos, cabeçalhos de relatórios, slides do site e banners'
  },
  users: {
    name: 'Usuários & Operadores (users)',
    category: 'Segurança',
    description: 'Contas administrativas, permissões e empresas vinculadas'
  },
  financial_credit_cards: {
    name: 'Cartões Corporativos PJ (financial_credit_cards)',
    category: 'Financeiro',
    description: 'Cartões de crédito, limites, bancos e dias de vencimento'
  },
  credit_card_expenses: {
    name: 'Despesas Parceladas de Cartão (credit_card_expenses)',
    category: 'Financeiro',
    description: 'Lançamentos parcelados, categorias e controle de quitação'
  },
  accounts_payable: {
    name: 'Contas a Pagar (accounts_payable)',
    category: 'Financeiro',
    description: 'Boletos, fornecedores, vencimentos e código de barras'
  },
  accounts_receivable: {
    name: 'Contas a Receber (accounts_receivable)',
    category: 'Financeiro',
    description: 'Faturas de clientes, honorários mensais e previsão de caixa'
  },
  agent_tokens: {
    name: 'Tokens de Agentes de TI (agent_tokens)',
    category: 'Segurança',
    description: 'Chaves de autenticação de coleta automática de telemetria'
  }
};

export const BackupExportModal: React.FC<BackupExportModalProps> = ({ onClose }) => {
  const [format, setFormat] = useState<'sql' | 'json' | 'csv'>('sql');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch database backup statistics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/backup/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Falha ao obter estatísticas do banco:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch preview of export
  const handleLoadPreview = async () => {
    setLoadingPreview(true);
    setShowPreview(true);
    setPreviewContent('');
    try {
      const url = `/api/backup/download?format=${format}&table=${selectedTable}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        // Show first 150 lines or 8000 characters
        const lines = text.split('\n');
        const truncated = lines.slice(0, 120).join('\n');
        setPreviewContent(truncated + (lines.length > 120 ? `\n\n... [Mais ${lines.length - 120} linhas ocultas nesta prévia]` : ''));
      } else {
        setPreviewContent('Falha ao carregar pré-visualização.');
      }
    } catch (err: any) {
      setPreviewContent(`Erro na prévia: ${err.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Trigger file download
  const handleDownload = async () => {
    setDownloading(true);
    setSuccessMessage('');
    try {
      const url = `/api/backup/download?format=${format}&table=${selectedTable}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Falha ao gerar o arquivo de backup no servidor');
      }

      const blob = await res.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const ext = format === 'sql' ? 'sql' : format === 'json' ? 'json' : 'csv';
      const fileName = `backup_w3w_${selectedTable}_${dateStr}.${ext}`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage(`✅ Arquivo "${fileName}" baixado com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      alert('Erro ao realizar download: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Backup & Exportação do Banco de Dados</span>
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 font-mono">
                  MySQL • JSON • CSV
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exporte todo o inventário, parâmetros do sistema, CMS do site, clientes e módulo financeiro em formato estruturado.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2.5 font-medium animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* KPI Statistics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total de Tabelas</span>
                <span className="text-lg font-black text-white">
                  {loadingStats ? '...' : `${stats?.tables_count || 16} Tabelas`}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registros Gravados</span>
                <span className="text-lg font-black text-emerald-400">
                  {loadingStats ? '...' : `${stats?.total_records || 0} Registros`}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Engine de Exportação</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  MySQL / MariaDB
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT FORMAT */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <span>Escolha o Formato de Exportação</span>
              </h3>
              <span className="text-[11px] text-slate-500">Formato para download</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* MySQL Option */}
              <button
                type="button"
                onClick={() => setFormat('sql')}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  format === 'sql'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/15 ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${format === 'sql' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-400'}`}>
                    <FileCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    .SQL
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Banco de Dados MySQL / MariaDB</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Script completo com DDL (CREATE TABLE), LOCK TABLES e INSERT INTO compatível com MySQL 5.7/8.0, phpMyAdmin e DBeaver.
                  </p>
                </div>
              </button>

              {/* JSON Option */}
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  format === 'json'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/15 ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${format === 'json' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-amber-400'}`}>
                    <FileJson className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    .JSON
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Arquivo Estruturado JSON</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Backup com objetos JSON puros de todas as tabelas, configurações de sistema e CMS do site para migrações e APIs REST.
                  </p>
                </div>
              </button>

              {/* CSV Option */}
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  format === 'csv'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${format === 'csv' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    .CSV
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Planilha Tabular CSV (Excel)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Formato com cabeçalhos e valores separados por vírgula pronto para abrir no Microsoft Excel, Google Planilhas ou BI.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT TABLES */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <span>Selecione a Tabela ou Escopo dos Dados</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedTable === 'all' ? 'Dump Completo' : `Tabela: ${selectedTable}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {Object.keys(TABLE_LABELS).map((tblKey) => {
                const info = TABLE_LABELS[tblKey];
                const count = tblKey === 'all' ? stats?.total_records : stats?.table_stats?.[tblKey];
                const isSelected = selectedTable === tblKey;

                return (
                  <button
                    key={tblKey}
                    type="button"
                    onClick={() => setSelectedTable(tblKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-xs truncate block">{info.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{info.description}</span>
                    </div>
                    {count !== undefined && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count} rec
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREVIEW SECTION (OPTIONAL) */}
          {showPreview && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>Prévia do Arquivo Gerado ({format.toUpperCase()}):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar Prévia
                </button>
              </div>

              {loadingPreview ? (
                <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Gerando prévia do arquivo...</span>
                </div>
              ) : (
                <pre className="p-3 bg-black/60 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {previewContent}
                </pre>
              )}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoadPreview}
              disabled={loadingPreview}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>{loadingPreview ? 'Carregando...' : 'Visualizar Prévia do Código'}</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                <span>
                  {downloading
                    ? 'Gerando Arquivo...'
                    : `Baixar Backup (.${format.toUpperCase()})`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            Os arquivos exportados contêm dados confidenciais e conformidade com a LGPD da organização.
          </span>
          <span className="font-mono text-slate-400">
            Exportador Multi-Banco v2.5 • W3W TI
          </span>
        </div>
      </div>
    </div>
  );
};
