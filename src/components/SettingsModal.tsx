import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types.ts';
import {
  X,
  Settings,
  Upload,
  Image as ImageIcon,
  Building,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Eye,
  Shield,
  HelpCircle,
  ExternalLink,
  Database
} from 'lucide-react';

interface SettingsModalProps {
  settings: SystemSettings;
  onClose: () => void;
  onSave: (newSettings: SystemSettings) => Promise<void>;
  onOpenWebsiteCMS?: () => void;
  onOpenWebsite?: () => void;
  onOpenBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSave,
  onOpenWebsiteCMS,
  onOpenWebsite,
  onOpenBackup
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>(settings.logo_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleLogos = [
    {
      name: 'Logo Tech Blue (SVG)',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect width="200" height="60" rx="10" fill="%231E293B"/><polygon points="20,15 40,15 50,45 30,45" fill="%233B82F6"/><circle cx="28" cy="30" r="5" fill="%23FFFFFF"/><text x="65" y="32" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23FFFFFF">CORP%20ASSET</text><text x="65" y="46" font-family="sans-serif" font-size="9" fill="%2394A3B8">ENTERPRISE IT</text></svg>'
    },
    {
      name: 'Logo Green Shield (SVG)',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect width="200" height="60" rx="10" fill="%23064E3B"/><path d="M 25 18 Q 38 12 50 18 Q 50 38 38 48 Q 25 38 25 18 Z" fill="%2310B981"/><text x="65" y="32" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23FFFFFF">CYBER%20INFRA</text><text x="65" y="46" font-family="sans-serif" font-size="9" fill="%236EE7B7">SECURITY &amp; ASSETS</text></svg>'
    },
    {
      name: 'Logo Apex Datacenter (SVG)',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><rect width="200" height="60" rx="10" fill="%23312E81"/><rect x="22" y="18" width="24" height="6" rx="2" fill="%23818CF8"/><rect x="22" y="27" width="24" height="6" rx="2" fill="%23818CF8"/><rect x="22" y="36" width="24" height="6" rx="2" fill="%23818CF8"/><text x="58" y="32" font-family="sans-serif" font-weight="bold" font-size="15" fill="%23FFFFFF">APEX%20SYSTEMS</text><text x="58" y="46" font-family="sans-serif" font-size="9" fill="%23C7D2FE">DATACENTER MGMT</text></svg>'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setFormData(prev => ({ ...prev, logo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplySampleLogo = (dataUrl: string) => {
    setLogoPreview(dataUrl);
    setFormData(prev => ({ ...prev, logo_url: dataUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await onSave(formData);
      setSuccessMsg('Configurações e Logotipo salvos com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('Deseja restaurar as configurações padrão de identidade e logotipo?')) {
      return;
    }
    const defaults: SystemSettings = {
      company_name: 'InfraAsset IT Solutions',
      system_title: 'INFRA ASSET MANAGER',
      department: 'Infraestrutura, Redes & Governança de TI',
      logo_url: '',
      footer_text: 'INFRA ASSET MANAGER • Gestão de Ativos & Telemetria em Tempo Real',
      report_header: 'RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL'
    };
    setFormData(defaults);
    setLogoPreview('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Configurações & Parâmetros do Sistema
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  Identidade Visual
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize o logotipo, nomes corporativos e cabeçalhos exibidos na aplicação, tela de login e relatórios PDF
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* QUICK SHORTCUT TO WEBSITE & SLIDES CMS */}
          <div className="bg-gradient-to-r from-orange-950/40 via-slate-950 to-slate-950 p-4 rounded-xl border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Gestão do Site Oficial & Slides do Banner
                  <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 font-mono rounded">
                    w3wsolucoesti.com.br
                  </span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Edite os slides do carrossel principal, textos de diagnóstico gratuito e canais de contato sincronizados com o site.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onOpenWebsite && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWebsite();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                  <span>Ver Site</span>
                </button>
              )}

              {onOpenWebsiteCMS && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWebsiteCMS();
                  }}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Abrir CMS de Slides</span>
                  <span className="text-xs">→</span>
                </button>
              )}
            </div>
          </div>

          {/* QUICK SHORTCUT TO DATABASE BACKUP & EXPORT */}
          {onOpenBackup && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 p-4 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Backup & Exportação do Banco de Dados
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono rounded">
                      MySQL • JSON • CSV
                    </span>
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Faça download de dumps SQL completos para MySQL/MariaDB, arquivos JSON de migração ou planilhas CSV por tabela.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBackup();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Acessar Módulo de Backup</span>
                  <span className="text-xs">→</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: LOGOTIPO CORPORATIVO */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Logotipo Corporativo (Logo da Empresa)
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Esta logo será exibida na barra superior (Navbar), na tela de login e no cabeçalho de todos os relatórios PDF e laudos de auditoria.
                </p>
              </div>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-2.5 py-1 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Logo</span>
                </button>
              )}
            </div>

            {/* Logo Preview Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview in Dark theme (Login / System) */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[120px] text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 mb-2">
                  Pré-visualização no Painel & Tela de Login (Fundo Escuro)
                </span>
                {logoPreview ? (
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 max-h-24 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo Corporativa"
                      className="max-h-16 max-w-[220px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500 py-3">
                    <ImageIcon className="w-8 h-8 mb-1 stroke-1" />
                    <span>Nenhum logo enviado (usando ícone padrão)</span>
                  </div>
                )}
              </div>

              {/* Preview in White theme (PDF & Impressão) */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 flex flex-col items-center justify-center min-h-[120px] text-center shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-slate-500 mb-2">
                  Pré-visualização nos Relatórios PDF & Laudos (Papel Branco)
                </span>
                {logoPreview ? (
                  <div className="p-2 border border-gray-200 rounded max-h-24 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo Relatório"
                      className="max-h-16 max-w-[220px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 py-3">
                    <ImageIcon className="w-8 h-8 mb-1 stroke-1" />
                    <span>Nenhum logo personalizado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Buttons & Options */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                  id="logo-upload-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Fazer Upload de Logo (PNG, JPG, SVG)</span>
                </button>

                <span className="text-slate-500 text-[11px]">Recomendado: imagem horizontal transparente (ex: 200x60px)</span>
              </div>

              {/* Sample Logos Quick Selection */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-2 text-[11px]">Ou clique em um modelo de demonstração:</span>
                <div className="flex flex-wrap gap-2">
                  {sampleLogos.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySampleLogo(s.data)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <ImageIcon className="w-3 h-3 text-blue-400" />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: IDENTIDADE & NOMES CORPORATIVOS */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Identidade Corporativa & Títulos do Sistema
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nome da Empresa / Organização:
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Ex: Grupo Empresarial Delta"
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Exibido nos cabeçalhos e relatórios</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Título do Sistema / Aplicação:
                </label>
                <input
                  type="text"
                  value={formData.system_title}
                  onChange={(e) => setFormData({ ...formData, system_title: e.target.value })}
                  placeholder="Ex: InfraAsset IT - Gestão de Ativos"
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Título principal do painel de controle</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Departamento / Gerência Responsável:
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Departamento de TI & Infraestrutura"
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Texto de Rodapé do Sistema:
                </label>
                <input
                  type="text"
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="Ex: Sistema de Gestão de Ativos • Confidencial"
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PARÂMETROS DE RELATÓRIO PDF */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Parâmetros de Relatórios PDF & Laudos de Auditoria
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Título Oficial nos Relatórios PDF:
              </label>
              <input
                type="text"
                value={formData.report_header}
                onChange={(e) => setFormData({ ...formData, report_header: e.target.value })}
                placeholder="Ex: RELATÓRIO OFICIAL DE INVENTÁRIO E AUDITORIA PATRIMONIAL"
                className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Este título será impresso no topo do PDF gerado pelo jsPDF e no laudo impresso.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrões</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando Alterações...' : 'Salvar Parâmetros e Logotipo'}</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <span>Configurações armazenadas com segurança no SQLite e sincronizadas localmente.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
