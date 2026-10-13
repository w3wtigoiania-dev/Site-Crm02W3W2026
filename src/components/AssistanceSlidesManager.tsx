import React, { useState, useEffect, useRef } from 'react';
import { AssistanceSlide } from '../types.ts';
import {
  DEFAULT_ASSISTANCE_SLIDES,
  useCMSSync
} from '../services/cmsSyncModule.ts';
import {
  Wrench,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Eye,
  ArrowUp,
  ArrowDown,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Cpu,
  Microscope,
  Check,
  ExternalLink
} from 'lucide-react';
import { TechnicalAssistanceCarousel } from './TechnicalAssistanceCarousel.tsx';

interface AssistanceSlidesManagerProps {
  onViewWebsite?: () => void;
  className?: string;
}

const PRESET_ASSISTANCE_IMAGES = [
  {
    name: 'Engenharia de TI & Bancada de Testes',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Laboratório Eletrônico de Alta Precisão',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Microeletrônica & Solda em Placa-Mãe',
    url: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Hardware de Alta Performance & Processadores',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Equipe de Especialistas & Suporte Goiânia',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1920&q=80'
  },
  {
    name: 'Datacenter & Servidores em Racks',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80'
  }
];

const PRESET_FOCUS_AREAS = [
  'Essencialidade',
  'Infraestrutura',
  'Complexidade',
  'Confiança',
  'Chamada para Ação'
];

export const AssistanceSlidesManager: React.FC<AssistanceSlidesManagerProps> = ({
  onViewWebsite,
  className = ''
}) => {
  const {
    config,
    updateAssistanceSlide,
    addAssistanceSlide,
    removeAssistanceSlide,
    setAssistanceSlides,
    saveToServer
  } = useCMSSync();

  const slides = (config?.assistance_slides && config.assistance_slides.length > 0)
    ? config.assistance_slides
    : DEFAULT_ASSISTANCE_SLIDES;

  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Garante índice selecionado válido
  useEffect(() => {
    if (selectedSlideIndex >= slides.length && slides.length > 0) {
      setSelectedSlideIndex(slides.length - 1);
    }
  }, [slides.length, selectedSlideIndex]);

  const activeSlide = slides[selectedSlideIndex] || slides[0] || DEFAULT_ASSISTANCE_SLIDES[0];

  const handleFieldChange = (field: keyof AssistanceSlide, value: any) => {
    updateAssistanceSlide(selectedSlideIndex, field, value);
  };

  // Upload local de imagem via File API e backend endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP ou SVG).');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          // Envia para o endpoint do backend
          const res = await fetch('/api/assistance-slides/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_data: base64Data,
              filename: file.name
            })
          });

          if (res.ok) {
            const data = await res.json();
            handleFieldChange('image_url', data.url);
            setSuccessMsg('✅ Imagem enviada e vinculada ao slide com sucesso!');
          } else {
            // Fallback direto com a string base64 se a rota falhar
            handleFieldChange('image_url', base64Data);
            setSuccessMsg('✅ Imagem carregada com sucesso via dados diretos!');
          }
        } catch (err) {
          // Fallback seguro em memória
          handleFieldChange('image_url', base64Data);
          setSuccessMsg('✅ Imagem carregada localmente com sucesso!');
        } finally {
          setUploadingImage(false);
          setTimeout(() => setSuccessMsg(''), 3500);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      setErrorMsg('Erro ao processar imagem selecionada.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAddNewSlide = () => {
    const newIdx = addAssistanceSlide({
      focus: 'Especialidade',
      badge: 'Foco: Especialidade',
      title: 'Nova Capacidade Técnica em Goiânia',
      description: 'Descrição do diferencial técnico ou serviço especializado da assistência W3W.',
      image_url: PRESET_ASSISTANCE_IMAGES[0].url,
      cta_text: 'Falar com Especialista via WhatsApp',
      cta_link: 'https://api.whatsapp.com/send?phone=5562982239004'
    });
    setSelectedSlideIndex(newIdx);
    setSuccessMsg('✨ Novo slide institucional adicionado!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveCurrent = (idx: number) => {
    if (slides.length <= 1) {
      setErrorMsg('É necessário manter pelo menos 1 slide ativo no carrossel.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    const success = removeAssistanceSlide(idx);
    if (success) {
      if (selectedSlideIndex >= idx && selectedSlideIndex > 0) {
        setSelectedSlideIndex(selectedSlideIndex - 1);
      }
      setSuccessMsg('Slide removido com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Atualiza order_index
    const reordered = newSlides.map((s, idx) => ({ ...s, order_index: idx }));
    setAssistanceSlides(reordered);
    setSelectedSlideIndex(targetIndex);

    // Persiste no backend via reorder
    fetch('/api/assistance-slides/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideIds: reordered.map(s => s.id) })
    }).catch(e => console.warn('Aviso: reorder no servidor falhou:', e));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveToServer();
      setSuccessMsg('🎉 Slides de Assistência Técnica gravados no banco e sincronizados em tempo real!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setErrorMsg('Erro ao salvar slides no servidor: ' + (e.message || 'Falha de rede'));
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Deseja restaurar os 5 slides institucionais padrão para a assistência técnica em Goiânia?')) {
      return;
    }
    setAssistanceSlides(DEFAULT_ASSISTANCE_SLIDES);
    try {
      await fetch('/api/assistance-slides/reset', { method: 'POST' });
    } catch (e) {}
    setSelectedSlideIndex(0);
    setSuccessMsg('🔄 Slides restaurados para o padrão original institucional de Goiânia!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mensagens de Notificação */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs text-rose-300 hover:text-white cursor-pointer">
            Fechar
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          {onViewWebsite && (
            <button
              onClick={onViewWebsite}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Ver no Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Cabeçalho da Seção de Gestão */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-mono font-bold">
                Módulo CRM • Assistência Técnica Goiânia
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                {slides.length} slides cadastrados
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-400" />
              <span>Gerenciador do Carrossel Institucional</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Edite os argumentos, textos de títulos e descrições, e altere as imagens de fundo (via upload de arquivo ou link externo) do carrossel exibido no site oficial.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddNewSlide}
              className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-blue-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Slide</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restaurar os 5 slides padrão de Goiânia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrão Goiânia</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLivePreview(prev => !prev)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{showLivePreview ? 'Ocultar Prévia' : 'Ver Prévia'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Salvar no Banco'}</span>
            </button>
          </div>
        </div>

        {/* Pré-visualização do Carrossel em Tempo Real */}
        {showLivePreview && (
          <div className="p-4 rounded-2xl bg-[#050811] border border-orange-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5 text-orange-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRÉ-VISUALIZAÇÃO AO VIVO NO CRM</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Qualquer digitação abaixo é refletida instantaneamente aqui
              </span>
            </div>
            <TechnicalAssistanceCarousel slides={slides} />
          </div>
        )}

        {/* Lista de Seleção de Slides (Pílulas / Tabs) */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Selecione o Slide para Editar:</span>
            <span className="text-[11px] font-mono text-slate-400 normal-case">
              (Use as setas para alterar a ordem de exibição)
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {slides.map((slide, idx) => {
              const isSelected = idx === selectedSlideIndex;
              return (
                <div
                  key={slide.id || idx}
                  className={`p-3 rounded-xl border transition-all text-left relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSlideIndex(idx)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-orange-400 border border-slate-700">
                        Slide {idx + 1}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        slide.is_active !== false
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {slide.is_active !== false ? 'Ativo' : 'Oculto'}
                      </span>
                    </div>

                    <div
                      className="w-full h-14 rounded-lg bg-cover bg-center mb-2 border border-slate-800 relative overflow-hidden"
                      style={{ backgroundImage: `url('${slide.image_url}')` }}
                    >
                      <div className="absolute inset-0 bg-slate-950/40" />
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-white/90 bg-black/60 px-1 rounded">
                        {slide.focus}
                      </span>
                    </div>

                    <p className="text-xs font-bold truncate text-white">
                      {slide.title}
                    </p>
                  </button>

                  {/* Controles de Ordem e Exclusão do Card */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover slide para cima"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(idx, 'down')}
                        disabled={idx === slides.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover slide para baixo"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCurrent(idx)}
                      className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                      title="Excluir este slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulário de Edição do Slide Selecionado */}
        {activeSlide && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Editando Slide {selectedSlideIndex + 1}: <strong className="text-orange-400">{activeSlide.title}</strong></span>
              </h3>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeSlide.is_active !== false}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-orange-500 focus:ring-orange-500 bg-slate-800"
                  />
                  <span>Slide Ativo no Site</span>
                </label>
              </div>
            </div>

            {/* Grid de Campos: Foco e Título */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Foco do Argumento:
                </label>
                <div className="space-y-1.5">
                  <select
                    value={activeSlide.focus}
                    onChange={(e) => {
                      handleFieldChange('focus', e.target.value);
                      handleFieldChange('badge', `Foco: ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    {PRESET_FOCUS_AREAS.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                    <option value="Personalizado">Outro foco personalizado...</option>
                  </select>

                  <input
                    type="text"
                    value={activeSlide.focus}
                    onChange={(e) => {
                      handleFieldChange('focus', e.target.value);
                      handleFieldChange('badge', `Foco: ${e.target.value}`);
                    }}
                    placeholder="Nome do foco do slide"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título Principal do Slide:
                </label>
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Ex: Tecnologia no seu dia a dia e no sucesso do seu negócio."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Recomendado: Frase concisa e impactante alinhada à assistência técnica.
                </p>
              </div>
            </div>

            {/* Campo de Descrição Detalhada */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descrição e Argumentação Institucional:
              </label>
              <textarea
                rows={3}
                value={activeSlide.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Ex: Sabemos o quanto a tecnologia é fundamental para o seu dia a dia e para o sucesso do seu negócio..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Gestão e Troca de Imagem de Fundo (Upload ou Link) */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  <span>Imagem de Fundo do Slide:</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Suporta upload direto de foto ou link HTTP/HTTPS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Visualizador da imagem atual */}
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 h-28 flex items-center justify-center">
                  <img
                    src={activeSlide.image_url}
                    alt={activeSlide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_ASSISTANCE_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded border border-white/20">
                      Visualização Atual
                    </span>
                  </div>
                </div>

                {/* Opções de troca: Upload e URL */}
                <div className="md:col-span-2 space-y-3">
                  {/* Opção 1: Upload de Arquivo do Computador */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-orange-400" />
                      <span>{uploadingImage ? 'Enviando...' : 'Fazer Upload de Imagem'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      (PNG, JPG, WebP)
                    </span>
                  </div>

                  {/* Opção 2: URL de Imagem Direta */}
                  <div>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={activeSlide.image_url}
                        onChange={(e) => handleFieldChange('image_url', e.target.value)}
                        placeholder="https://exemplo.com/minha-imagem.jpg"
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets de Imagens Rápidas de Laboratório / TI */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Ou selecione uma foto técnica da galeria recomendada W3W:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {PRESET_ASSISTANCE_IMAGES.map((preset, pIdx) => {
                    const isSelectedPreset = activeSlide.image_url === preset.url;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleFieldChange('image_url', preset.url)}
                        className={`group relative rounded-lg overflow-hidden border h-16 transition-all text-left cursor-pointer ${
                          isSelectedPreset ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[9px] text-white font-medium truncate block w-full leading-tight">
                            {preset.name}
                          </span>
                        </div>
                        {isSelectedPreset && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white p-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chamada para Ação (CTA) e WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Texto do Botão CTA:
                </label>
                <input
                  type="text"
                  value={activeSlide.cta_text || ''}
                  onChange={(e) => handleFieldChange('cta_text', e.target.value)}
                  placeholder="Ex: Falar com Especialista via WhatsApp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Link de Ação / WhatsApp Direto:
                </label>
                <input
                  type="text"
                  value={activeSlide.cta_link || ''}
                  onChange={(e) => handleFieldChange('cta_link', e.target.value)}
                  placeholder="https://api.whatsapp.com/send?phone=5562982239004"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-xs font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
