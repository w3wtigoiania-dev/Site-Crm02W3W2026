import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AssistanceSlide } from '../types.ts';
import {
  DEFAULT_ASSISTANCE_SLIDES,
  useSharedCMSConfig
} from '../services/cmsSyncModule.ts';
import {
  Wrench,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Microscope,
  Award,
  PhoneCall,
  Play,
  Pause,
  ExternalLink,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface TechnicalAssistanceCarouselProps {
  slides?: AssistanceSlide[];
  onOpenDiagnosticModal?: () => void;
  className?: string;
  autoPlayIntervalMs?: number;
}

const FOCUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Essencialidade': Cpu,
  'Infraestrutura': Microscope,
  'Complexidade': Wrench,
  'Confiança': ShieldCheck,
  'Chamada para Ação': PhoneCall
};

export const TechnicalAssistanceCarousel: React.FC<TechnicalAssistanceCarouselProps> = ({
  slides: propSlides,
  onOpenDiagnosticModal,
  className = '',
  autoPlayIntervalMs = 6000
}) => {
  const { config } = useSharedCMSConfig();

  // Obtém slides da prop, do estado global compartilhado sincronizado em tempo real ou do padrão institucional
  const activeSlidesList = (propSlides && propSlides.length > 0)
    ? propSlides
    : (config?.assistance_slides && config.assistance_slides.length > 0)
      ? config.assistance_slides.filter(s => s.is_active !== false)
      : DEFAULT_ASSISTANCE_SLIDES;

  const slides = activeSlidesList.length > 0 ? activeSlidesList : DEFAULT_ASSISTANCE_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Garante índice válido
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay com pausa ao interagir
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, autoPlayIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, slides.length, autoPlayIntervalMs, handleNext]);

  // Navegação por teclado quando focado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Suporte a swipe no mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const currentSlide = slides[currentIndex] || slides[0] || DEFAULT_ASSISTANCE_SLIDES[0];
  const FocusIcon = FOCUS_ICONS[currentSlide.focus] || Sparkles;

  const handleCtaClick = () => {
    if (currentSlide.cta_link) {
      window.open(currentSlide.cta_link, '_blank');
    } else if (onOpenDiagnosticModal) {
      onOpenDiagnosticModal();
    } else {
      const msg = encodeURIComponent(`Olá! Vi no site da W3W sobre a assistência técnica em Goiânia ("${currentSlide.title}") e gostaria de atendimento.`);
      window.open(`https://api.whatsapp.com/send?phone=5562982239004&text=${msg}`, '_blank');
    }
  };

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#080d1a]/95 shadow-2xl relative overflow-hidden focus:outline-none select-none transition-all ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Carrossel Institucional de Assistência Técnica W3W Goiânia"
    >
      {/* Background Image com Crossfade suave e overlays técnicos */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-35 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url('${slide.image_url}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(1px) brightness(0.65)'
            }}
          />
        ))}

        {/* Gradientes e Vinheta Cibernética */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d1a] via-[#080d1a]/60 to-[#080d1a]/90 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent z-10" />
      </div>

      {/* Conteúdo Central do Slide */}
      <div className="relative z-20 p-5 sm:p-7 lg:p-9 flex flex-col justify-between min-h-[360px] sm:min-h-[380px]">
        {/* Top Header do Carrossel */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 shadow-md flex-shrink-0">
              <Wrench className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Por que escolher a nossa assistência técnica em Goiânia?</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                Laboratório Próprio • Especialistas Certificados • Diagnóstico Transparente
              </p>
            </div>
          </div>

          {/* Badge do Slide Atual & Indicador de Contagem */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-orange-300 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
              <span>{currentSlide.badge || `Foco: ${currentSlide.focus}`}</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 font-semibold">
              {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Corpo do Slide Atual */}
        <div className="my-auto py-2 space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold">
            <FocusIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>Argumento {currentIndex + 1} • {currentSlide.focus}</span>
          </div>

          <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
            {currentSlide.title}
          </h4>

          <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed max-w-3xl text-justify sm:text-left drop-shadow-sm">
            {currentSlide.description}
          </p>

          {/* Destaques rápidos de confiança */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Laboratório ESD em Goiânia</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garantia Formal nos Serviços</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-800 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Laudo Técnico & Transparência</span>
            </div>
          </div>
        </div>

        {/* Rodapé do Carrossel: Navegação e CTA */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Botão de Ação Direta para o Slide */}
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/40 active:scale-95"
          >
            <PhoneCall className="w-4 h-4 text-white" />
            <span>{currentSlide.cta_text || 'Falar com Especialista via WhatsApp'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-orange-200" />
          </button>

          {/* Controles de Navegação: Anterior / Play / Próximo e Bolinhas */}
          <div className="flex items-center gap-3">
            {/* Play/Pause toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying(prev => !prev)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={isPlaying ? 'Pausar rotação automática' : 'Retomar rotação automática'}
              aria-label={isPlaying ? 'Pausar slides' : 'Iniciar reprodução de slides'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Botão Anterior */}
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95 shadow"
              title="Slide anterior"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Indicador de Bolinhas / Pílulas */}
            <div className="flex items-center gap-1.5 px-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 h-2 bg-gradient-to-r from-orange-500 to-amber-400 shadow-sm'
                      : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Ir para o slide ${idx + 1}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Botão Próximo */}
            <button
              type="button"
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95 shadow"
              title="Próximo slide"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
