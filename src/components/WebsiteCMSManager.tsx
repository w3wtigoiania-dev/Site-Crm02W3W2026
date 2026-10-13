import React, { useState, useEffect } from 'react';
import { SystemSettings, WebsiteConfig, HeroSlide } from '../types.ts';
import {
  useCMSSync,
  DEFAULT_HERO_SLIDES,
  DEFAULT_WEBSITE_CONFIG
} from '../services/cmsSyncModule.ts';
import {
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Eye,
  Sparkles,
  Phone,
  Mail,
  Shield,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Radio,
  Database,
  RefreshCw,
  Zap,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { AssistanceSlidesManager } from './AssistanceSlidesManager.tsx';

interface WebsiteCMSManagerProps {
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => Promise<void>;
  onLiveUpdate?: (newConfig: WebsiteConfig) => void;
  onViewWebsite: () => void;
  onOpenBackup?: () => void;
}

const PRESET_BG_IMAGES = [
  {
    name: 'Datacenter & Cabos Ethernet Azuis',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Servidores & Racks em Alta Densidade',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Cibersegurança & Matriz Digital',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Infraestrutura Cloud & Fibra Óptica',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Central de Operações de TI (NOC)',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80'
  }
];

export const WebsiteCMSManager: React.FC<WebsiteCMSManagerProps> = ({
  settings,
  onSaveSettings,
  onLiveUpdate,
  onViewWebsite,
  onOpenBackup
}) => {
  // Módulo de sincronização em tempo real e estado global compartilhado
  const {
    config: liveConfig,
    syncState,
    updateConfig,
    updateSlide,
    addSlide,
    removeSlide,
    resetToDefaults,
    saveToServer,
    setFromExternal
  } = useCMSSync();

  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [activeCmsTab, setActiveCmsTab] = useState<'hero' | 'assistance' | 'diagnostic' | 'all'>('hero');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza estado inicial das configurações recebidas
  useEffect(() => {
    if (settings.website_config) {
      setFromExternal(settings.website_config);
    }
  }, [settings.website_config, setFromExternal]);

  // Notifica o callback pai se fornecido
  useEffect(() => {
    onLiveUpdate?.(liveConfig);
  }, [liveConfig, onLiveUpdate]);

  const slides = liveConfig.slides && liveConfig.slides.length > 0
    ? liveConfig.slides
    : DEFAULT_HERO_SLIDES;

  const diagnosticTag = liveConfig.diagnostic_tag ?? 'DIAGNÓSTICO CORPORATIVO GRATUITO';
  const diagnosticLocation = liveConfig.diagnostic_location ?? 'Goiânia e Região Metropolitana';
  const diagnosticText = liveConfig.diagnostic_text ?? 'Avalie vulnerabilidades, conformidade de backup e tempos de SLA da sua empresa sem custo.';
  const diagnosticButton = liveConfig.diagnostic_button ?? 'Solicitar Diagnóstico de TI';

  const contactPhone = liveConfig.contact_phone ?? '(62) 3923 - 0404 • (62) 9 8223 - 9004';
  const contactWhatsapp = liveConfig.contact_whatsapp ?? '5562982239004';
  const contactEmail = liveConfig.contact_email ?? 'comercial@w3wsolucoesti.com.br';

  // Handle slide field change via global real-time state
  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    updateSlide(index, field, value);
  };

  // Add new slide
  const handleAddSlide = () => {
    const newIdx = addSlide({
      bgImage: PRESET_BG_IMAGES[0].url
    });
    setSelectedSlideIndex(newIdx);
    setSuccessMsg('✨ Novo slide adicionado e sincronizado!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Remove slide
  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) {
      setErrorMsg('É necessário manter pelo menos 1 slide ativo no site.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    const removed = removeSlide(index);
    if (removed) {
      if (selectedSlideIndex >= index && selectedSlideIndex > 0) {
        setSelectedSlideIndex(selectedSlideIndex - 1);
      }
      setSuccessMsg(`Slide ${index + 1} removido e sincronizado em tempo real.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    resetToDefaults();
    setSelectedSlideIndex(0);
    setSuccessMsg('Configurações originais e slides restaurados e sincronizados!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Save all settings explicitly to database
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await saveToServer(settings);
      await onSaveSettings({
        ...settings,
        website_config: liveConfig
      });
      setSuccessMsg('✅ Configurações e slides sincronizados em tempo real e gravados no banco de dados SQLite com sucesso!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg('Erro ao salvar no banco de dados: ' + (err.message || 'Falha de conexão'));
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setSaving(false);
    }
  };

  const handleViewWebsite = async () => {
    try {
      await handleSave();
    } catch (e) {}
    onViewWebsite();
  };

  const activeSlide = slides[selectedSlideIndex] || slides[0] || DEFAULT_HERO_SLIDES[0];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#0d1424] border border-orange-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CMS INTEGRADO AO CRM</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>SINCRONIZAÇÃO BIDIRECIONAL ATIVA (SEM RECARREGAR)</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Gestão do Site Oficial & Slides do Banner</span>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 font-mono">
                w3wsolucoesti.com.br
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Qualquer alteração realizada aqui (textos dos slides, imagens de fundo, botões CTA, chamadas e canais de contato) é aplicada automaticamente no site institucional oficial (Frontend) em tempo real, sem necessidade de recarregar a página.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                title="Backup e exportação do banco de dados e configurações em MySQL, JSON ou CSV"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Backup DB / CMS</span>
              </button>
            )}

            <button
              onClick={handleViewWebsite}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer border border-orange-400/40"
              title="Abrir a tela do Frontend (Site Oficial) para ver como está ficando"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Site ao Vivo (Frontend)</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Status da Sincronização em Tempo Real (Estado Global Compartilhado) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-[11px] ${
              syncState.status === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : syncState.status === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                syncState.status === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : syncState.status === 'error'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400 animate-pulse'
              }`} />
              <span className="font-semibold">
                {syncState.status === 'syncing'
                  ? `Sincronizando em tempo real (${syncState.syncCounter} edições)...`
                  : syncState.status === 'error'
                  ? 'Reconectando sincronização...'
                  : 'Sincronização em Tempo Real Ativa'}
              </span>
            </div>

            <span className="text-slate-400 hidden sm:inline text-[11px]">
              • Consistência imediata com o <strong className="text-slate-300">W3WSiteView</strong> via Estado Global Compartilhado
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Última sinc: <strong className="text-slate-200">{syncState.lastSyncedAt || 'Agora'}</strong></span>
            {syncState.activeClientsCount > 1 && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {syncState.activeClientsCount} tela(s) conectadas
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="px-2 py-0.5 text-xs text-rose-300 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={onViewWebsite}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Conferir no Site</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO ENTRE MÓDULOS DO CMS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveCmsTab('hero')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeCmsTab === 'hero'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-300" />
          <span>Banner Principal (Hero)</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
            {slides.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCmsTab('assistance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeCmsTab === 'assistance'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-orange-400" />
          <span>Carrossel Assistência Técnica (Goiânia)</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-300 font-mono font-bold border border-orange-500/30">
            Destaque Dinâmico
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCmsTab('diagnostic')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeCmsTab === 'diagnostic'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-300" />
          <span>Diagnóstico, SLA & Contatos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCmsTab('all')}
          className={`ml-auto px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeCmsTab === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>Exibir Todos</span>
        </button>
      </div>

      {/* SECTION 1: SLIDES DO HERO BANNER */}
      {(activeCmsTab === 'hero' || activeCmsTab === 'all') && (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              <span>Carrossel de Slides Principais (Banner da Capa)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {slides.length} slides ativos
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Personalize o título, descrição, botão de ação (CTA) e imagem de fundo de cada slide rotativo do site.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-blue-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Slide</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restaurar slides originais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrões</span>
            </button>
          </div>
        </div>

        {/* Slide Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setSelectedSlideIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                selectedSlideIndex === idx
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Slide {idx + 1}</span>
              <span className="text-[10px] opacity-80 truncate max-w-[140px]">
                {s.title.substring(0, 18)}...
              </span>
            </button>
          ))}
        </div>

        {/* Active Slide Live Preview + Form */}
        {activeSlide && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Interactive Slide Miniature Preview */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pré-visualização do Slide {selectedSlideIndex + 1} em Tempo Real:
              </span>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090f1a] min-h-[280px] p-5 flex flex-col justify-between">
                {/* Background Image Preview */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity transition-all duration-500"
                  style={{ backgroundImage: `url('${activeSlide.bgImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070b12] via-[#090f1a]/80 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-orange-500/40 text-orange-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="truncate max-w-[240px]">{activeSlide.tag || 'Tag do Slide'}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {activeSlide.title || 'Título do Slide'}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {activeSlide.description || 'Descrição detalhada do serviço exibida no banner...'}
                  </p>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] text-white font-extrabold text-[11px] rounded-lg shadow">
                      <span>{activeSlide.cta || 'Botão CTA'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Dots indicator */}
                <div className="relative z-10 flex items-center justify-end gap-1.5 pt-4">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        selectedSlideIndex === i ? 'w-4 h-1.5 bg-orange-500' : 'w-1.5 h-1.5 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Preset Images Selector */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Escolher Imagem de Fundo (Galeria de Fotos Tecnológicas):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_BG_IMAGES.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSlideChange(selectedSlideIndex, 'bgImage', preset.url)}
                      className={`p-2 rounded-lg text-left text-[11px] transition-all flex items-center gap-2 cursor-pointer border ${
                        activeSlide.bgImage === preset.url
                          ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slide Edit Form */}
            <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Editando Slide {selectedSlideIndex + 1} de {slides.length}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveSlide(selectedSlideIndex)}
                  className="px-2.5 py-1 text-rose-400 hover:bg-rose-500/15 border border-rose-500/25 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este Slide</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tag Superior (Badge com Ponto Pulsante):
                </label>
                <input
                  type="text"
                  value={activeSlide.tag}
                  onChange={(e) => handleSlideChange(selectedSlideIndex, 'tag', e.target.value)}
                  placeholder="Ex: • CIBERSEGURANÇA & LGPD • Goiânia & Região"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Aparece no topo do banner com estilo de destaque chamativo.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título Principal do Slide (Destaque H1):
                </label>
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={(e) => handleSlideChange(selectedSlideIndex, 'title', e.target.value)}
                  placeholder="Ex: Proteção Anti-Ransomware & Backup Imutável em Nuvem"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Descrição do Serviço / Subtítulo:
                </label>
                <textarea
                  rows={3}
                  value={activeSlide.description}
                  onChange={(e) => handleSlideChange(selectedSlideIndex, 'description', e.target.value)}
                  placeholder="Ex: Blindagem de dados empresariais com firewalls perimetrais, auditoria contínua e planos de recuperação imediata."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Texto do Botão de Ação (CTA):
                  </label>
                  <input
                    type="text"
                    value={activeSlide.cta}
                    onChange={(e) => handleSlideChange(selectedSlideIndex, 'cta', e.target.value)}
                    placeholder="Ex: Avaliar Vulnerabilidades"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    URL da Imagem de Fundo Personalizada:
                  </label>
                  <input
                    type="text"
                    value={activeSlide.bgImage}
                    onChange={(e) => handleSlideChange(selectedSlideIndex, 'bgImage', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedSlideIndex === 0}
                    onClick={() => setSelectedSlideIndex(selectedSlideIndex - 1)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Slide Anterior</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedSlideIndex >= slides.length - 1}
                    onClick={() => setSelectedSlideIndex(selectedSlideIndex + 1)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Próximo Slide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Gravando...' : 'Salvar Este Slide'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* SECTION 2: CARROSSEL INSTITUCIONAL DE ASSISTÊNCIA TÉCNICA (GOIÂNIA) */}
      {(activeCmsTab === 'assistance' || activeCmsTab === 'all') && (
        <AssistanceSlidesManager onViewWebsite={onViewWebsite} />
      )}

      {/* SECTION 3: BARRA SUPERIOR DE DIAGNÓSTICO & CONTATOS */}
      {(activeCmsTab === 'diagnostic' || activeCmsTab === 'all') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barra Superior de Diagnóstico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Barra Superior de Diagnóstico & Alertas</h3>
              <p className="text-slate-400 text-[11px]">Faixa horizontal que aparece no topo de todo o site</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Etiqueta de Destaque:
            </label>
            <input
              type="text"
              value={diagnosticTag}
              onChange={(e) => updateConfig({ diagnostic_tag: e.target.value })}
              placeholder="Ex: DIAGNÓSTICO CORPORATIVO GRATUITO"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Localidade / Região de Atendimento:
            </label>
            <input
              type="text"
              value={diagnosticLocation}
              onChange={(e) => updateConfig({ diagnostic_location: e.target.value })}
              placeholder="Ex: Goiânia e Região Metropolitana"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Texto Descritivo do Diagnóstico:
            </label>
            <textarea
              rows={2}
              value={diagnosticText}
              onChange={(e) => updateConfig({ diagnostic_text: e.target.value })}
              placeholder="Ex: Avalie vulnerabilidades, conformidade de backup e tempos de SLA da sua empresa sem custo."
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Texto do Botão da Barra:
            </label>
            <input
              type="text"
              value={diagnosticButton}
              onChange={(e) => updateConfig({ diagnostic_button: e.target.value })}
              placeholder="Ex: Solicitar Diagnóstico de TI"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Informações Oficiais de Contato */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Canais de Contato & WhatsApp Institucional</h3>
              <p className="text-slate-400 text-[11px]">Links diretos dos botões de WhatsApp, telefone e e-mail do site</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Telefone Comercial Exibido:
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => updateConfig({ contact_phone: e.target.value })}
              placeholder="Ex: (62) 99999-9999"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Número de WhatsApp (Somente números com DDI e DDD):
            </label>
            <input
              type="text"
              value={contactWhatsapp}
              onChange={(e) => updateConfig({ contact_whatsapp: e.target.value })}
              placeholder="Ex: 5562999999999"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Usado no botão flutuante e ícone de WhatsApp para abrir a conversa automaticamente.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              E-mail Comercial / Suporte:
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => updateConfig({ contact_email: e.target.value })}
              placeholder="Ex: comercial@w3wsolucoesti.com.br"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando Alterações...' : 'Salvar Todos os Parâmetros do Site'}</span>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
