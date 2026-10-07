import React, { useState, useEffect, useRef } from 'react';
import { WebsiteConfig } from '../types.ts';
import { useSharedCMSConfig, cmsSyncManager } from '../services/cmsSyncModule.ts';
import { W3WLogo } from './W3WLogo.tsx';
import { W3WBrandTitle } from './W3WBrandTitle.tsx';
import {
  Shield,
  Headphones,
  Lock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Server,
  Network,
  Cpu,
  Cloud,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Laptop,
  Database,
  Layers,
  FileCheck,
  Send,
  Instagram,
  Facebook,
  Youtube,
  MapPin,
  Globe,
  Menu,
  AlertTriangle,
  Check,
  Building2,
  UserCheck,
  MessageSquare,
  Zap,
  Wrench
} from 'lucide-react';

interface W3WSiteViewProps {
  onEnterCRM: () => void;
  currentView?: 'frontend' | 'backend';
  onSwitchView?: (view: 'frontend' | 'backend') => void;
  websiteConfig?: WebsiteConfig;
}

const DEFAULT_HERO_SLIDES = [
  {
    tag: '• NOC & SERVIDORES 24/7 • Goiânia & Região',
    title: 'Sustentação de TI & Servidores Corporativos em Goiânia',
    description: 'Monitoramento contínuo, clusters Proxmox em alta disponibilidade e links redundantes MikroTik para o seu negócio.',
    cta: 'Conhecer Soluções',
    bgImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80'
  },
  {
    tag: '• CIBERSEGURANÇA & LGPD • Goiânia & Região',
    title: 'Proteção Anti-Ransomware & Backup Imutável em Nuvem',
    description: 'Blindagem de dados empresariais com firewalls perimetrais, auditoria contínua e planos de recuperação imediata.',
    cta: 'Avaliar Vulnerabilidades',
    bgImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1920&q=80'
  },
  {
    tag: '• SUPORTE GERENCIADO MSP • SLA GARANTIDO',
    title: 'Gestão Completa de Infraestrutura & Redes Corporativas',
    description: 'Monitoramento proativo 24/7 de computadores, switches e servidores para erradicar paradas no seu negócio.',
    cta: 'Conhecer Modelos de Suporte',
    bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80'
  }
];

export const W3WSiteView: React.FC<W3WSiteViewProps> = ({
  onEnterCRM,
  currentView = 'frontend',
  onSwitchView,
  websiteConfig
}) => {
  const [activeNav, setActiveNav] = useState<'solucoes' | 'modelos' | 'pilares' | 'metodologia' | 'contato'>('solucoes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticSent, setDiagnosticSent] = useState(false);

  // Ref para o conteúdo principal para centralizar e alinhar perfeitamente na tela ao clicar nos menus
  const mainContentRef = useRef<HTMLElement>(null);

  const scrollToContent = () => {
    // Scroll suave para que o conteúdo da aba selecionada apareça centralizado e alinhado logo abaixo do navbar
    setTimeout(() => {
      const mainEl = mainContentRef.current || document.getElementById('secao-conteudo-principal');
      if (mainEl) {
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 80;
        const elementTop = mainEl.getBoundingClientRect().top + window.pageYOffset;
        // Posiciona a seção perfeitamente visível abaixo da barra fixa
        const targetY = Math.max(0, elementTop - headerHeight);

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    }, 40);
  };

  const handleNavClick = (tab: 'solucoes' | 'modelos' | 'pilares' | 'metodologia' | 'contato') => {
    setActiveNav(tab);
    setMobileMenuOpen(false);
    scrollToContent();
  };

  // Imagem 01: Ao clicar na logo voltar para home página inicial
  const handleGoHome = () => {
    setActiveNav('solucoes');
    setActiveSlide(0);
    setMobileMenuOpen(false);
    setIsDiagnosticModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Módulo de sincronização em tempo real via Estado Global Compartilhado do CMS
  const { config: sharedGlobalConfig, syncState } = useSharedCMSConfig();

  useEffect(() => {
    if (websiteConfig) {
      cmsSyncManager.setFromExternal(websiteConfig);
    }
  }, [websiteConfig]);

  const activeConfig = sharedGlobalConfig || websiteConfig;

  const heroSlides = (activeConfig?.slides && activeConfig.slides.length > 0)
    ? activeConfig.slides
    : DEFAULT_HERO_SLIDES;

  useEffect(() => {
    if (activeSlide >= heroSlides.length) {
      setActiveSlide(Math.max(0, heroSlides.length - 1));
    }
  }, [heroSlides.length, activeSlide]);

  const currentSlide = heroSlides[activeSlide] || heroSlides[0] || DEFAULT_HERO_SLIDES[0];

  // Diagnostic flow state (IMAGEM 02 FLUXO & IMAGEM 03 FINALIZANDO DIRETO PARA WHATSAPP 62 9 8223 - 9004)
  const [diagnosticStep, setDiagnosticStep] = useState<1 | 2 | 3 | 4>(1);
  const [diagForm, setDiagForm] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    city: 'Goiânia e Região Metropolitana - GO',
    devicesCount: '16 a 40 computadores',
    serverType: 'Servidor Físico Local (Windows / Linux)',
    vulnerabilities: [
      'Proteção Anti-Ransomware & Blindagem de Dados',
      'Rotinas de Backup Imutável em Nuvem'
    ] as string[],
    notes: ''
  });

  const toggleVulnerability = (vuln: string) => {
    setDiagForm(prev => {
      const exists = prev.vulnerabilities.includes(vuln);
      return {
        ...prev,
        vulnerabilities: exists
          ? prev.vulnerabilities.filter(v => v !== vuln)
          : [...prev.vulnerabilities, vuln]
      };
    });
  };

  const handleOpenDiagnostic = (step: 1 | 2 | 3 = 1) => {
    setDiagnosticStep(step);
    setDiagnosticSent(false);
    setIsDiagnosticModalOpen(true);
  };

  const handleSendDiagnosticToWhatsApp = async () => {
    const vulnsList = diagForm.vulnerabilities.length > 0
      ? diagForm.vulnerabilities.map(v => `• ${v}`).join('\n')
      : '• Avaliação Geral de Vulnerabilidades e Inventário';

    const message = `🛡️ *SOLICITAÇÃO DE DIAGNÓSTICO DE VULNERABILIDADE & TI*
🌐 _Origem: Gerado automaticamente através do Site Oficial W3W Soluções em TI_

Olá equipe da W3W Soluções em TI! Preenchi a avaliação de vulnerabilidade no site oficial e gostaria de agendar o diagnóstico gratuito da nossa infraestrutura:

📋 *DADOS DA EMPRESA & RESPONSÁVEL:*
• *Empresa:* ${diagForm.company || 'Não informada'}
• *Responsável:* ${diagForm.name || 'Não informado'}
• *Cargo:* ${diagForm.role || 'Não informado'}
• *WhatsApp:* ${diagForm.phone || 'Não informado'}
• *E-mail:* ${diagForm.email || 'Não informado'}
• *Localização:* ${diagForm.city || 'Goiânia e Região Metropolitana - GO'}

💻 *PERFIL DA INFRAESTRUTURA:*
• *Quantidade de Computadores:* ${diagForm.devicesCount}
• *Ambiente de Servidores:* ${diagForm.serverType}

⚠️ *VULNERABILIDADES / RISCOS SELECIONADOS PARA AVALIAÇÃO:*
${vulnsList}

${diagForm.notes.trim() ? `📝 *Observações / Sintomas Relatados:*\n"${diagForm.notes.trim()}"\n\n` : ''}--------------------------------------------------
✅ *Status:* Formulário de diagnóstico preenchido no site oficial w3wsolucoesti.com.br
Solicito a análise técnica gratuita com os especialistas da W3W!`;

    try {
      await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...diagForm,
          generated_from: 'site_oficial_w3w',
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('Erro ao salvar no backend, prosseguindo com WhatsApp:', e);
    }

    setDiagnosticSent(true);
    setDiagnosticStep(4);

    const whatsappUrl = `https://api.whatsapp.com/send?phone=5562982239004&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDiagnosticSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendDiagnosticToWhatsApp();
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative">
      {/* 1. TOP ANNOUNCEMENT BAR (EXACT MATCH FOR IMAGE 01) */}
      {showTopBar && (
        <div className="bg-[#080d18] border-b border-orange-500/20 px-4 py-2 text-xs transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-orange-500 font-bold text-sm">⚡</span>
              <span className="font-extrabold text-orange-400">
                {activeConfig?.diagnostic_tag || 'Diagnóstico de TI & SLA'}
              </span>
              <span className="text-slate-300">
                • {activeConfig?.diagnostic_text || 'Avaliação de infraestrutura, redes e cibersegurança em Goiânia'}
              </span>
            </div>

            {/* Right side of Top Bar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Redes Sociais Oficiais no Top Bar */}
              <div className="hidden sm:flex items-center gap-1.5 border-r border-slate-700/80 pr-2.5">
                <a
                  href="https://www.instagram.com/w3wsolucoest/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram Oficial: @w3wsolucoest"
                  className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <Instagram className="w-3 h-3" />
                </a>
                <a
                  href="https://www.facebook.com/w3wti"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook Oficial: @w3wti"
                  className="w-6 h-6 rounded-md bg-[#1877f2] text-white flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <Facebook className="w-3 h-3" />
                </a>
                <a
                  href="https://www.youtube.com/@W3WSOLUCOESTI"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube Oficial: @W3WSOLUCOESTI"
                  className="w-6 h-6 rounded-md bg-[#ff0000] text-white flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <Youtube className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={() => handleOpenDiagnostic(1)}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs underline decoration-amber-400/80 cursor-pointer transition-colors"
              >
                {activeConfig?.diagnostic_button || 'Avaliar Vulnerabilidade'}
              </button>

              <button
                onClick={() => setShowTopBar(false)}
                className="px-2.5 py-1 bg-[#090f1a] hover:bg-slate-800 text-slate-300 rounded-md border border-slate-700/80 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Minimizar barra de avisos"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Minimizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVBAR (EXACT MATCH FOR IMAGEM 01) */}
      <header className="sticky top-0 z-40 bg-[#060a12]/95 backdrop-blur-md border-b border-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Slogan (IMAGEM 01: AO CLICAR NA LOGO VOLTAR PARA HOME PÁGINA INICIAL) */}
          <div
            onClick={handleGoHome}
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity select-none group"
            title="W3W Soluções em TI - Voltar para Página Inicial"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleGoHome();
              }
            }}
          >
            {/* W3W Official SVG Vector Logo */}
            <div className="group-hover:scale-105 transition-transform duration-200">
              <W3WLogo className="w-13 h-13 sm:w-14 sm:h-14 flex-shrink-0" />
            </div>

            <W3WBrandTitle showSubtitle={false} />
          </div>

          {/* Center Navigation Menu in Rounded Container with vertical separators (EXACT MATCH FOR IMAGEM 02 - MODERNO E ADAPTÁVEL) */}
          <nav className="hidden lg:flex items-center bg-[#070d18]/95 border border-slate-800/80 rounded-full p-1.5 shadow-inner gap-1 sm:gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleNavClick('solucoes')}
              className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center ${
                activeNav === 'solucoes'
                  ? 'bg-[#0c1424] text-white font-extrabold border-2 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.7)] ring-1 ring-orange-500/40'
                  : 'bg-[#0c1424] text-orange-400 hover:text-orange-300 hover:bg-[#101b2f] border border-slate-800/80 shadow-sm'
              }`}
            >
              Soluções em TI
            </button>

            <span className="text-slate-800/80 select-none px-0.5 text-xs font-light">|</span>

            <button
              onClick={() => handleNavClick('modelos')}
              className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center ${
                activeNav === 'modelos'
                  ? 'bg-[#0c1424] text-white font-extrabold border-2 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.7)] ring-1 ring-orange-500/40'
                  : 'bg-[#0c1424] text-orange-400 hover:text-orange-300 hover:bg-[#101b2f] border border-slate-800/80 shadow-sm'
              }`}
            >
              Modelos de Atendimento
            </button>

            <span className="text-slate-800/80 select-none px-0.5 text-xs font-light">|</span>

            <button
              onClick={() => handleNavClick('pilares')}
              className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center ${
                activeNav === 'pilares'
                  ? 'bg-[#0c1424] text-white font-extrabold border-2 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.7)] ring-1 ring-orange-500/40'
                  : 'bg-[#0c1424] text-orange-400 hover:text-orange-300 hover:bg-[#101b2f] border border-slate-800/80 shadow-sm'
              }`}
            >
              Nossos Pilares
            </button>

            <span className="text-slate-800/80 select-none px-0.5 text-xs font-light">|</span>

            <button
              onClick={() => handleNavClick('metodologia')}
              className={`rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center ${
                activeNav === 'metodologia'
                  ? 'bg-[#0c1424] text-white font-extrabold border-2 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.7)] ring-1 ring-orange-500/40'
                  : 'bg-[#0c1424] text-orange-400 hover:text-orange-300 hover:bg-[#101b2f] border border-slate-800/80 shadow-sm'
              }`}
            >
              Metodologia
            </button>

            <span className="text-slate-800/80 select-none px-0.5 text-xs font-light">|</span>

            <button
              onClick={() => handleNavClick('contato')}
              className={`rounded-xl px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center ${
                activeNav === 'contato'
                  ? 'bg-[#0c1424] text-white font-extrabold border-2 border-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.7)] ring-1 ring-orange-500/40'
                  : 'bg-[#0c1424] text-orange-400 hover:text-orange-300 hover:bg-[#101b2f] border border-slate-800/80 shadow-sm'
              }`}
            >
              Contato
            </button>
          </nav>

          {/* Right Action Icons (EXACT MATCH FOR IMAGEM 02: 3 ROUNDED SQUARES SLIM & ALIGNED) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Menu de Navegação"
              aria-label="Abrir Menu"
              className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0c1424] hover:bg-slate-800 border border-slate-700/80 text-orange-400 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* 1. Headset / Suporte */}
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('contato');
              }}
              title="Central de Atendimento & Suporte"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0c1424] hover:bg-slate-800 border border-amber-600/30 hover:border-amber-500 text-amber-500 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </a>

            {/* 2. WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?phone=${activeConfig?.contact_whatsapp || '556239230404'}&text=Ol%C3%A1%2C%20gostaria%20de%20um%20diagn%C3%B3stico%20de%20TI%20da%20W3W%20Solu%C3%A7%C3%B5es`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Oficial"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0c1424] hover:bg-slate-800 border border-emerald-600/30 hover:border-emerald-500 text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
              </svg>
            </a>

            {/* 3. Cadeado / Lock (Acesso ao CRM - Requer Autenticação por Usuário e Senha) */}
            <button
              onClick={() => (onSwitchView ? onSwitchView('backend') : onEnterCRM())}
              title="Área Restrita / CRM (Requer Login com Usuário e Senha)"
              aria-label="Acesso ao CRM"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0c1424] hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-500 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu (IMAGE 01 STANDARD) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/90 bg-[#070c16]/98 backdrop-blur-md px-4 py-3 space-y-1.5 shadow-2xl">
            <button
              onClick={() => handleNavClick('solucoes')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'solucoes'
                  ? 'bg-[#0c1424] text-white border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-[#0c1424] text-orange-400 hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              Soluções em TI
            </button>
            <button
              onClick={() => handleNavClick('modelos')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'modelos'
                  ? 'bg-[#0c1424] text-white border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-[#0c1424] text-orange-400 hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              Modelos de Atendimento
            </button>
            <button
              onClick={() => handleNavClick('pilares')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'pilares'
                  ? 'bg-[#0c1424] text-white border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-[#0c1424] text-orange-400 hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              Nossos Pilares
            </button>
            <button
              onClick={() => handleNavClick('metodologia')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'metodologia'
                  ? 'bg-[#0c1424] text-white border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-[#0c1424] text-orange-400 hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              Metodologia
            </button>
            <button
              onClick={() => handleNavClick('contato')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'contato'
                  ? 'bg-[#0c1424] text-white border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-[#0c1424] text-orange-400 hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              Contato
            </button>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION WITH IMAGE & CAROUSEL (EXACT MATCH FOR IMAGE 02 & IMAGE 03) */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#070b13] min-h-[360px] sm:min-h-[420px] flex flex-col justify-between p-6 sm:p-12">
            {/* Background Image with Dark Vignette Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
              style={{ backgroundImage: `url('${currentSlide.bgImage}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b12] via-[#070b13]/90 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-black/40 pointer-events-none" />

            {/* Content Top Tag */}
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                <span>{currentSlide.tag}</span>
              </div>

              {/* Title (IMAGE 02) */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h1>

              {/* Subtitle (IMAGE 02) */}
              <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                {currentSlide.description}
              </p>

              {/* Primary Action CTA Buttons (IMAGEM 01: BOTÃO AVALIAR VULNERABILIDADE) */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleOpenDiagnostic(1)}
                  className="px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer border border-orange-400/40 group hover:scale-[1.02]"
                  title="Avaliar Vulnerabilidade da sua TI"
                >
                  <Shield className="w-4 h-4 text-orange-200" />
                  <span>Avaliar Vulnerabilidade</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {currentSlide.cta && currentSlide.cta !== 'Avaliar Vulnerabilidades' && currentSlide.cta !== 'Avaliar Vulnerabilidade' && (
                  <button
                    onClick={() => {
                      if (currentSlide.cta.includes('Modelos')) {
                        handleNavClick('modelos');
                      } else {
                        handleNavClick('solucoes');
                      }
                    }}
                    className="px-5 py-3 bg-[#0a1120]/90 hover:bg-[#101b2f] text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{currentSlide.cta}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Carousel Navigation Indicator Dots (Bottom Right - EXACT MATCH FOR IMAGE 02) */}
            <div className="relative z-10 flex items-center justify-end gap-2 pt-6">
              <div className="flex items-center gap-2 bg-[#090e18]/90 border border-slate-800 rounded-full px-3 py-1.5 shadow-md">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      activeSlide === idx
                        ? 'w-7 h-2.5 bg-[#f97316]'
                        : 'w-2.5 h-2.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CENTRAL DE ATENDIMENTO & PLANTÃO GOIÂNIA (EXACT MATCH FOR IMAGE 02) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="border border-slate-800 bg-[#080d16] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  CENTRAL DE ATENDIMENTO & PLANTÃO GOIÂNIA
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Canais oficiais com conexão direta para suporte técnico, NOC e propostas corporativas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Box 1: Central & WhatsApp */}
            <a
              href="https://api.whatsapp.com/send?phone=556239230404&text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20central%20da%20W3W"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#07131a] hover:bg-[#0a1c26] border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors group cursor-pointer shadow-md"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-emerald-400 tracking-wider">CENTRAL & WHATSAPP •</div>
                <div className="text-sm sm:text-base font-black text-white font-mono tracking-tight">(62) 3923 - 0404</div>
              </div>
            </a>

            {/* Box 2: Plantão Técnico 24/7 */}
            <a
              href="https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1%2C%20preciso%20de%20atendimento%20do%20plant%C3%A3o%20t%C3%A9cnico%2024%2F7"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#14161f] hover:bg-[#1a1e2b] border border-orange-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors group cursor-pointer shadow-md"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-orange-400 tracking-wider">PLANTÃO TÉCNICO 24/7 •</div>
                <div className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">(62) 9 8223 - 9004</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* SEÇÃO DESTACADA DA IMAGEM 01 (SOLICITADA NO LOCAL INDICADO PELA IMAGEM 02) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-fadeIn">
        <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 bg-[#080d17] p-6 sm:p-10 lg:p-12 shadow-2xl">
          {/* Subtle Grid / Ambient Glow Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column (col-span-7): Headline, Paragraph, 3 Feature Cards & CTA Buttons */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge: Goiânia & Região Metropolitana • Suporte Presencial e Remoto */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1424] border border-emerald-500/30 text-xs font-semibold text-slate-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">{activeConfig?.diagnostic_location || 'Goiânia & Região Metropolitana'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-medium">Suporte Presencial e Remoto</span>
              </div>

              {/* Big Title: Terceirização de TI Estratégica & Blindada para Empresas */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Terceirização de TI{' '}
                <span className="text-[#f97316] drop-shadow-[0_0_16px_rgba(249,115,22,0.4)]">
                  Estratégica &amp; Blindada
                </span>{' '}
                para Empresas
              </h2>

              {/* Subtitle / Paragraph */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Elimine paralisações caras, proteja seus dados contra ataques cibernéticos e garanta conformidade com a LGPD através de uma gestão completa de infraestrutura, servidores e suporte corporativo.
              </p>

              {/* 3 Feature Cards (ZERO BRECHAS, 99.8% UPTIME, SLA CONTRATUAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {/* Card 1: ZERO BRECHAS */}
                <div className="bg-[#0b101c]/90 border border-slate-800/90 rounded-2xl p-4 space-y-2 hover:border-orange-500/40 transition-all shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                    ZERO BRECHAS
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Segurança ativa com Firewall UTM, antivírus EDR e política de privilégio mínimo.
                  </p>
                </div>

                {/* Card 2: 99.8% UPTIME */}
                <div className="bg-[#0b101c]/90 border border-slate-800/90 rounded-2xl p-4 space-y-2 hover:border-orange-500/40 transition-all shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                    99.8% UPTIME
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Monitoramento NOC 24/7 com resolução proativa antes do seu time perceber.
                  </p>
                </div>

                {/* Card 3: SLA CONTRATUAL */}
                <div className="bg-[#0b101c]/90 border border-slate-800/90 rounded-2xl p-4 space-y-2 hover:border-orange-500/40 transition-all shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                    SLA CONTRATUAL
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tempo de resposta de até 30 minutos com técnicos de campo dedicados em Goiânia.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Solicitar Diagnóstico Gratuito & Conhecer Nossos Pilares */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenDiagnostic(1)}
                  className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer border border-orange-400/40 group hover:scale-[1.02]"
                >
                  <span>Solicitar Diagnóstico Gratuito</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('pilares')}
                  className="px-5 py-3.5 bg-[#0a1120] hover:bg-[#111a2f] text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Conhecer Nossos Pilares</span>
                </button>
              </div>
            </div>

            {/* Right Column (col-span-5): NOC W3W Goiânia Live Telemetry Box */}
            <div className="lg:col-span-5">
              <div className="bg-[#090e1a]/95 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
                {/* Header: NOC W3W Goiânia & ONLINE 24/7 */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        NOC W3W Goiânia
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Monitoramento Ativo em Tempo Real
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold tracking-wider">
                    ONLINE 24/7
                  </span>
                </div>

                {/* Telemetry Progress Bars */}
                <div className="space-y-3.5 pt-1">
                  {/* Metric 1: Saúde do Ambiente de Servidores */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        <span>Saúde do Ambiente de Servidores</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-xs">99.98%</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full w-[99.98%]" />
                    </div>
                  </div>

                  {/* Metric 2: Proteção Ransomware & Firewall */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Proteção Ransomware &amp; Firewall</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-xs">100% Blindado</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full w-full" />
                    </div>
                  </div>

                  {/* Metric 3: Latência Média de Resposta (SLA) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Network className="w-3.5 h-3.5 text-amber-400" />
                        <span>Latência Média de Resposta (SLA)</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-xs">14 min</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full w-[45%]" />
                    </div>
                  </div>
                </div>

                {/* Checklist items */}
                <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Rotina de Backup Nuvem Diário</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">03:00 AM • OK</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Auditoria de Conformidade LGPD</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400">Ativa</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Tempo Médio de Atendimento</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-amber-400">&lt; 30 min</span>
                  </div>
                </div>

                {/* Bottom inner card: Equipe de Prontidão em Goiânia */}
                <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex items-center gap-3 mt-1">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Equipe de Prontidão em Goiânia
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Helpdesk, N1, N2 e especialistas N3 dedicados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON (IMAGE 02) */}
      <a
        href="https://api.whatsapp.com/send?phone=5562982239004&text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20especialista%20de%20TI%20da%20W3W"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 transition-all cursor-pointer"
        title="Falar com Especialista no WhatsApp 24/7"
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
        </svg>
      </a>

      {/* 4. MAIN CONTENT ACCORDING TO ACTIVE NAV TAB */}
      <main
        id="secao-conteudo-principal"
        ref={mainContentRef}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 scroll-mt-20"
      >
        {/* TAB 1: SOLUÇÕES EM TI */}
        {activeNav === 'solucoes' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Portfólio Corporativo B2B
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Soluções Estratégicas para Empresas de Goiânia e Região
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Garantimos disponibilidade, segurança e velocidade para sua operação com atendimento consultivo e técnico de alto nível.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Cibersegurança & Proteção Anti-Ransomware</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Firewalls de borda (Fortinet, pfSense), antivírus corporativo com EDR, proteção contra phishing e isolamento de ameaças em tempo real.
                </p>
                <div className="pt-2 text-xs text-orange-400 font-semibold flex items-center gap-1">
                  <span>Conformidade LGPD garantida</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDiagnostic(1)}
                  className="mt-2 w-full py-2.5 px-3 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Avaliar Vulnerabilidade de Cibersegurança"
                >
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                  <span>Avaliar Vulnerabilidade</span>
                </button>
              </div>

              {/* Card 2 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Infraestrutura de Redes & Wi-Fi Corporativo</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cabeamento estruturado Cat6/Cat6a, certificação de pontos, switches gerenciáveis, VLANs de alta performance e Wi-Fi corporativo Unifi.
                </p>
                <div className="pt-2 text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <span>Alta estabilidade e zero perdas</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Suporte Gerenciado MSP (Helpdesk & NOC)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contratos de manutenção preventiva e corretiva com SLA rígido de até 15 minutos. Atendimento humanizado remoto e presencial.
                </p>
                <div className="pt-2 text-xs text-indigo-400 font-semibold flex items-center gap-1">
                  <span>Chamados ilimitados para o seu time</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Backup Imutável em Nuvem (3-2-1)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rotinas automáticas de backup criptografado fora do ambiente da empresa, com proteção contra exclusão acidental e sequestro de dados.
                </p>
                <div className="pt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span>Recuperação testada mensalmente</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Servidores & Virtualização Corporativa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerenciamento de Active Directory, Windows Server, Linux, VMware e Proxmox. Otimização de recursos físicos e redundância local.
                </p>
                <div className="pt-2 text-xs text-purple-400 font-semibold flex items-center gap-1">
                  <span>Disponibilidade máxima para sistemas ERP</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 hover:border-orange-500/40 transition-all space-y-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Inventário de Ativos & Governança</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Telemetria em tempo real com agente automatizado para controle de hardware, softwares instalados, garantia e ciclo de vida dos equipamentos.
                </p>
                <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <span>Integrado com o CRM W3W</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: MODELOS DE ATENDIMENTO */}
        {activeNav === 'modelos' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Planos B2B Personalizados
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Modelos de Atendimento com SLA Estruturado
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Atendemos sua empresa com custos previsíveis e contratos claros, eliminando surpresas com manutenções de emergência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                  ESSENTIAL B2B
                </span>
                <h3 className="text-lg font-bold text-white">Para Empresas até 20 Usuários</h3>
                <p className="text-xs text-slate-400">
                  Suporte remoto ágil, monitoramento preventivo e gestão de antivírus corporativo.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SLA de resposta até 30 min</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Monitoramento contínuo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Backup em nuvem configurado</li>
                </ul>
                <button
                  onClick={() => setIsDiagnosticModalOpen(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Solicitar Proposta
                </button>
              </div>

              <div className="bg-[#0f172a] border-2 border-orange-500 rounded-2xl p-6 space-y-4 shadow-xl shadow-orange-500/10 relative">
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold">
                  MAIS ESCOLHIDO
                </span>
                <span className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                  ADVANCED MSP
                </span>
                <h3 className="text-lg font-bold text-white">Para Empresas de 20 a 80 Usuários</h3>
                <p className="text-xs text-slate-400">
                  Atendimento ilimitado remoto e presencial com técnico dedicado e plantão.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SLA de resposta até 15 min</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visitas preventivas semanais</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Backup imutável & Disaster Recovery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gerenciamento de servidores & firewall</li>
                </ul>
                <button
                  onClick={() => setIsDiagnosticModalOpen(true)}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Falar com Consultor
                </button>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                  ENTERPRISE
                </span>
                <h3 className="text-lg font-bold text-white">Ambientes Críticos & Redes Complexas</h3>
                <p className="text-xs text-slate-400">
                  Operação in-loco ou híbrida com governança de TI e gestão total de ativos.
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SLA imediato com plantão 24/7</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Alocação de analistas residentes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auditoria patrimonial contínua</li>
                </ul>
                <button
                  onClick={() => setIsDiagnosticModalOpen(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Personalizar Contrato
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: NOSSOS PILARES */}
        {activeNav === 'pilares' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Valores & Governança
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Os 4 Pilares da W3W Soluções em TI
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Construímos parcerias sólidas fundamentadas em competência técnica e transparência.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0b101c] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-3xl font-black text-orange-400">01</div>
                <h3 className="text-base font-bold text-white">Continuidade Operacional</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Antecipamos falhas antes que elas causem lentidão ou prejuízo na rotina da sua equipe.
                </p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-3xl font-black text-orange-400">02</div>
                <h3 className="text-base font-bold text-white">Segurança Inegociável</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Blindamos seu ambiente contra vazamento de dados, sequestro digital e invasões.
                </p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-3xl font-black text-orange-400">03</div>
                <h3 className="text-base font-bold text-white">Agilidade & SLA Rígido</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sem burocracia ou filas intermináveis. Comunicação direta via canais exclusivos.
                </p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="text-3xl font-black text-orange-400">04</div>
                <h3 className="text-base font-bold text-white">Transparência Total</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Relatórios periódicos com métricas claras de chamados, telemetria e inventário.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: METODOLOGIA */}
        {activeNav === 'metodologia' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Processo de Atendimento Ágil
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Como Transformamos a TI da sua Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0b101c] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-orange-400">ETAPA 1</span>
                <h4 className="text-sm font-bold text-white">Diagnóstico & Auditoria</h4>
                <p className="text-xs text-slate-400">Levantamento de vulnerabilidades, inventário e rotinas de backup.</p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-orange-400">ETAPA 2</span>
                <h4 className="text-sm font-bold text-white">Plano de Correção</h4>
                <p className="text-xs text-slate-400">Eliminação de gargalos urgentes e implementação de segurança perimetral.</p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-orange-400">ETAPA 3</span>
                <h4 className="text-sm font-bold text-white">Implantação do Agente</h4>
                <p className="text-xs text-slate-400">Telemetria contínua com monitoramento dos computadores e servidores.</p>
              </div>

              <div className="bg-[#0b101c] border border-slate-800 p-5 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-orange-400">ETAPA 4</span>
                <h4 className="text-sm font-bold text-white">Gestão Contínua</h4>
                <p className="text-xs text-slate-400">Suporte diário aos colaboradores e manutenções preventivas programadas.</p>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: CONTATO */}
        {activeNav === 'contato' && (
          <section className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Fale com a W3W Soluções
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Estamos Prontos para Atender sua Empresa
              </h2>

              {/* Subtítulo Oficial Conforme Imagem 01 (Logo Abaixo de "Estamos Prontos para Atender sua Empresa") */}
              <div className="pt-1.5 flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#0a101d] border border-orange-500/25 shadow-md">
                  <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-slate-200 font-['Montserrat',sans-serif]">
                    SERVIÇOS COMPLETO B2B INFRAESTRUTURA &amp; DESENVOLVIMENTO{' '}
                    <span className="text-[#f97316] font-black drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                      ÁGIL
                    </span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-orange-400 font-['Montserrat',sans-serif]">
                  A TECNOLOGIA QUE IMPULSIONA NEGÓCIOS
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-[#0b101c] border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col justify-center items-center text-center space-y-6">
                <h3 className="text-base sm:text-lg font-bold text-white text-center">Canais Oficiais W3W</h3>
                <div className="space-y-4 text-xs text-slate-300 w-full max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-3 text-center">
                    <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg flex-shrink-0"><Mail className="w-4 h-4" /></div>
                    <div className="text-center">
                      <span className="text-slate-500 block">E-mail Corporativo:</span>
                      <a href={`mailto:${activeConfig?.contact_email || 'comercial@w3wsolucoesti.com.br'}`} className="font-semibold text-white hover:text-amber-400 transition-colors">
                        {activeConfig?.contact_email || 'comercial@w3wsolucoesti.com.br'}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-center">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg flex-shrink-0"><Phone className="w-4 h-4" /></div>
                    <div className="text-center">
                      <span className="text-slate-500 block">WhatsApp & Telefone:</span>
                      <a href="https://wa.me/5562982239004" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                        {activeConfig?.contact_phone || '(62) 3923 - 0404 • (62) 9 8223 - 9004'} • Goiânia - GO
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-center">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg flex-shrink-0"><Clock className="w-4 h-4" /></div>
                    <div className="text-center">
                      <span className="text-slate-500 block">Horário de Atendimento:</span>
                      <span className="font-semibold text-white">Seg a Sex das 08h às 18h (Plantão 24/7 para contratos)</span>
                    </div>
                  </div>

                  {/* Redes Sociais Oficiais no Bloco de Contato (Centralizadas) */}
                  <div className="pt-3 border-t border-slate-800/80 w-full text-center flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                      REDES SOCIAIS OFICIAIS:
                    </span>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <a
                        href="https://www.instagram.com/w3wsolucoest/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram: @w3wsolucoest"
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-rose-500/30 text-rose-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        <Instagram className="w-3.5 h-3.5 text-rose-400" />
                        <span>Instagram</span>
                      </a>
                      <a
                        href="https://www.facebook.com/w3wti"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook: @w3wti"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        <Facebook className="w-3.5 h-3.5 text-blue-400" />
                        <span>Facebook</span>
                      </a>
                      <a
                        href="https://www.youtube.com/@W3WSOLUCOESTI"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="YouTube: @W3WSOLUCOESTI"
                        className="px-2.5 py-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span>YouTube</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleDiagnosticSubmit} className="bg-[#0b101c] border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
                <h3 className="text-base font-bold text-white">Mensagem Rápida</h3>
                {diagnosticSent ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
                    Mensagem enviada com sucesso! Entraremos em contato em breve.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-slate-400 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={diagForm.name}
                        onChange={(e) => setDiagForm({ ...diagForm, name: e.target.value })}
                        placeholder="Ex: Carlos Oliveira"
                        className="w-full p-2.5 bg-[#070b12] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Empresa / Cidade</label>
                      <input
                        type="text"
                        required
                        value={diagForm.company}
                        onChange={(e) => setDiagForm({ ...diagForm, company: e.target.value })}
                        placeholder="Empresa XYZ - Goiânia/GO"
                        className="w-full p-2.5 bg-[#070b12] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">E-mail Corporativo</label>
                      <input
                        type="email"
                        required
                        value={diagForm.email}
                        onChange={(e) => setDiagForm({ ...diagForm, email: e.target.value })}
                        placeholder="carlos@empresa.com.br"
                        className="w-full p-2.5 bg-[#070b12] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar e Falar pelo WhatsApp (62) 9 8223 - 9004</span>
                    </button>
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDiagnostic(1)}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold underline transition-colors cursor-pointer"
                      >
                        Ou iniciar Avaliação de Vulnerabilidade de TI completa →
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </section>
        )}
        {/* CTA BANNER (CONFORME IMAGEM 01 & IMAGEM 02) */}
        <div className="pt-12 pb-6 flex flex-col items-center justify-center text-center space-y-4">
          {activeNav !== 'contato' && (
            <div className="space-y-2.5 max-w-2xl mx-auto mb-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Fale com a W3W Soluções
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Estamos Prontos para Atender sua Empresa
              </h2>
              <div className="pt-1 flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#0a101d] border border-orange-500/25 shadow-md">
                  <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-slate-200 font-['Montserrat',sans-serif]">
                    SERVIÇOS COMPLETO B2B INFRAESTRUTURA &amp; DESENVOLVIMENTO{' '}
                    <span className="text-[#f97316] font-black drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                      ÁGIL
                    </span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-orange-400 font-['Montserrat',sans-serif]">
                  A TECNOLOGIA QUE IMPULSIONA NEGÓCIOS
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => handleOpenDiagnostic(1)}
            className="px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-500/25 flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <Shield className="w-5 h-5 text-white" />
            <span>Avaliar Vulnerabilidade &amp; Diagnóstico Gratuito</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-300 flex-wrap justify-center font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Sem custo ou fidelidade para o laudo inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Atendimento presencial em Goiânia e Região Metropolitana</span>
            </div>
          </div>
        </div>

        {/* SEÇÃO CONFORME IMAGEM 03 & IMAGEM 04: CAPACIDADE TÉCNICA AVANÇADA */}
        <section className="mt-8 mb-12 text-left">
          <div className="space-y-4">
            {/* Badge: • [ CAPACIDADE TÉCNICA AVANÇADA ] */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>[ CAPACIDADE TÉCNICA AVANÇADA ]</span>
              </div>
            </div>

            {/* Título Principal */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.2]">
              Soluções Especializadas em Infraestrutura, Blindagem e Inteligência
            </h2>

            {/* Subtítulo / Descrição */}
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base max-w-4xl leading-relaxed">
              Serviços de engenharia tecnológica desenvolvidos para garantir conformidade legal, resiliência operacional e máxima performance para sua empresa.
            </p>

            {/* Card com Ícone de Chave Inglesa / Assistência Técnica em Goiânia */}
            <div className="mt-6 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#080d1a]/95 p-5 sm:p-7 lg:p-8 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex-shrink-0">
                  <Wrench className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight">
                  Por que escolher a nossa assistência técnica em Goiânia?
                </h3>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm lg:text-[15px] leading-relaxed text-justify sm:text-left">
                Sabemos o quanto a tecnologia é fundamental para o seu dia a dia e para o sucesso do seu negócio. É por isso que contamos com um <strong className="text-white font-bold">laboratório próprio de última geração em Goiânia</strong> e uma equipe de <strong className="text-white font-bold">especialistas qualificados</strong> para resolver desde problemas simples de lentidão até os <strong className="text-white font-bold">reparos eletrônicos mais complexos</strong>. Trabalhamos com <strong className="text-white font-bold">peças de alta qualidade</strong>, <strong className="text-white font-bold">garantia em todos os serviços</strong> e <strong className="text-white font-bold">total transparência no diagnóstico</strong> do seu equipamento. Deixe a tecnologia com quem entende e tenha a tranquilidade que você merece!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER (CONFORME IMAGEM 01) */}
      <footer className="mt-auto bg-[#050811] border-t border-slate-800/80 pt-12 pb-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-8">
            {/* Coluna 1: Nome Centralizado (Imagem 02), Descrição & Conformidade LGPD */}
            <div className="space-y-4">
              {/* Nome Centralizado conforme Imagem 02 (logo redonda movida para a coluna 4) */}
              <div className="flex justify-center sm:justify-start lg:justify-center w-full">
                <W3WBrandTitle showSubtitle={true} />
              </div>

              {/* Descrição */}
              <p className="text-slate-400 text-xs leading-relaxed">
                W3W SOLUÇÕES TI. Terceirização, gestão de infraestrutura de alta performance, redes MikroTik, virtualização Proxmox VE e segurança da informação em Goiânia e Goiás.
              </p>

              {/* Selo LGPD */}
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs pt-1">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>Conformidade com a LGPD • Lei 13.709/2018</span>
              </div>
            </div>

            {/* Coluna 2: SOLUÇÕES ESPECIALIZADAS */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                SOLUÇÕES ESPECIALIZADAS
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavClick('solucoes')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Sustentação de Servidores & NOC 24/7
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('solucoes')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Roteamento & Firewall MikroTik RouterOS
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('solucoes')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Clusters Proxmox VE & Storage ZFS
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('solucoes')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Backup Imutável Anti-Ransomware 3-2-1
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('solucoes')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    DBA Oracle Database 19c & PostgreSQL
                  </button>
                </li>
              </ul>
            </div>

            {/* Coluna 3: INSTITUCIONAL & CRM */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                INSTITUCIONAL & CRM
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavClick('modelos')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Modelos de Atendimento (N1/N2/N3/vCIO)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('pilares')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Os 4 Pilares de Excelência
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavClick('metodologia')}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Metodologia de Transição
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOpenDiagnostic(1)}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    Avaliar Vulnerabilidade (Diagnóstico Técnico)
                  </button>
                </li>
                <li className="pt-0.5">
                  <button
                    onClick={() => (onSwitchView ? onSwitchView('backend') : onEnterCRM())}
                    className="text-orange-500 hover:text-orange-400 font-bold transition-colors cursor-pointer text-left flex items-center gap-1.5"
                    title="Acesso Seguro ao CRM da W3W"
                  >
                    <span>Painel CRM WhatsApp (Login Seguro)</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Coluna 4: SEDE & ATENDIMENTO & REDES SOCIAIS */}
            <div className="space-y-3">
              <h3 className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                SEDE & ATENDIMENTO
              </h3>

              <div className="space-y-2.5 text-xs text-slate-300">
                {/* Endereço */}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-200 uppercase tracking-wide">
                    RUA 22 SETOR OESTE GOIÂNIA.
                  </span>
                </div>

                {/* Telefone 1 */}
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 fill-emerald-400 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
                  </svg>
                  <a href="tel:6239230404" className="hover:text-emerald-400 font-semibold transition-colors">
                    (62) 3923 - 0404
                  </a>
                </div>

                {/* Telefone 2 / WhatsApp */}
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 fill-emerald-400 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
                  </svg>
                  <a
                    href="https://api.whatsapp.com/send?phone=5562982239004"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 font-semibold transition-colors"
                  >
                    (62) 9 8223 - 9004
                  </a>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <a href="mailto:comercial@w3wsolucoesti.com.br" className="hover:text-amber-400 font-semibold transition-colors">
                    comercial@w3wsolucoesti.com.br
                  </a>
                </div>
              </div>

              {/* Redes Sociais & Logo W3W (Conforme Seta da Imagem 01) */}
              <div className="pt-2 flex items-end justify-between gap-3">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                    REDES SOCIAIS OFICIAIS
                  </span>
                  <div className="flex items-center gap-2.5">
                    {/* Instagram */}
                    <a
                      href="https://www.instagram.com/w3wsolucoest/"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram Oficial: @w3wsolucoest"
                      className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/w3wti"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook Oficial: @w3wti"
                      className="w-9 h-9 rounded-xl bg-[#1877f2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>

                    {/* YouTube */}
                    <a
                      href="https://www.youtube.com/@W3WSOLUCOESTI"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="YouTube Oficial: @W3WSOLUCOESTI"
                      className="w-9 h-9 rounded-xl bg-[#ff0000] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Logo W3W Oficial no local apontado pela seta da Imagem 01 */}
                <div
                  onClick={handleGoHome}
                  className="flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  title="W3W Soluções em TI - Voltar para Página Inicial"
                  role="button"
                  tabIndex={0}
                >
                  <W3WLogo className="w-16 h-16 sm:w-18 sm:h-18 drop-shadow-[0_0_18px_rgba(243,131,19,0.35)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Linha final de Direitos Reservados conforme IMAGEM 02 */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>Copyright (c) 2026. W3W SOLUÇÕES TI. Todos os direitos reservados. Desenvolvido por: Wanderson Luz</p>
            <div className="flex items-center gap-4">
              <span>Termos de Uso</span>
              <span>•</span>
              <span>Política de Privacidade (LGPD)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. MODAL DE FLUXO DE DIAGNÓSTICO E AVALIAÇÃO DE VULNERABILIDADE (IMAGEM 02 & IMAGEM 03) */}
      {isDiagnosticModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#090f1d] border border-orange-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto">
            {/* Botão Fechar */}
            <button
              onClick={() => {
                setIsDiagnosticModalOpen(false);
                setDiagnosticStep(1);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer z-10"
              title="Fechar Diagnóstico"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/40 text-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/10">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Avaliação de Vulnerabilidade & Diagnóstico de TI
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                    GRATUITO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  W3W Soluções em TI • Goiânia e Região Metropolitana
                </p>
              </div>
            </div>

            {/* Stepper de Progresso Visual (IMAGEM 02 FLUXO & IMAGEM 03 FINALIZAÇÃO) */}
            {diagnosticStep !== 4 && (
              <div className="mb-5 bg-[#070b14] border border-slate-800 rounded-2xl p-2 sm:p-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiagnosticStep(1)}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                      diagnosticStep === 1
                        ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                        : diagnosticStep > 1
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      diagnosticStep === 1
                        ? 'bg-orange-500 text-white'
                        : diagnosticStep > 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {diagnosticStep > 1 ? '✓' : '1'}
                    </div>
                    <span className="text-[11px] sm:text-xs truncate">1. Empresa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (diagForm.name.trim() && diagForm.company.trim() && diagForm.phone.trim()) {
                        setDiagnosticStep(2);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                      diagnosticStep === 2
                        ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                        : diagnosticStep > 2
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      diagnosticStep === 2
                        ? 'bg-orange-500 text-white'
                        : diagnosticStep > 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {diagnosticStep > 2 ? '✓' : '2'}
                    </div>
                    <span className="text-[11px] sm:text-xs truncate">2. Riscos & TI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (diagForm.name.trim() && diagForm.company.trim() && diagForm.phone.trim()) {
                        setDiagnosticStep(3);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                      diagnosticStep === 3
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      diagnosticStep === 3
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      3
                    </div>
                    <span className="text-[11px] sm:text-xs truncate">3. WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 1: IDENTIFICAÇÃO DA EMPRESA E RESPONSÁVEL */}
            {diagnosticStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!diagForm.name.trim() || !diagForm.company.trim() || !diagForm.phone.trim()) {
                    return;
                  }
                  setDiagnosticStep(2);
                }}
                className="space-y-4 text-xs"
              >
                <div className="bg-[#070b14] border border-slate-800/80 rounded-2xl p-3.5 space-y-1 mb-2">
                  <span className="text-orange-400 font-extrabold uppercase tracking-wider text-[11px]">
                    Etapa 1 de 3 • Identificação Corporativa
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Informe os dados da sua organização para personalizarmos o diagnóstico presencial ou remoto.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagForm.name}
                      onChange={(e) => setDiagForm({ ...diagForm, name: e.target.value })}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={diagForm.role}
                      onChange={(e) => setDiagForm({ ...diagForm, role: e.target.value })}
                      placeholder="Ex: Diretor de Operações / Gerente"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagForm.company}
                      onChange={(e) => setDiagForm({ ...diagForm, company: e.target.value })}
                      placeholder="Ex: Construtora Goiás Ltda"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      WhatsApp / Telefone com DDD *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagForm.phone}
                      onChange={(e) => setDiagForm({ ...diagForm, phone: e.target.value })}
                      placeholder="(62) 98888-7777"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={diagForm.email}
                      onChange={(e) => setDiagForm({ ...diagForm, email: e.target.value })}
                      placeholder="carlos@empresa.com.br"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cidade / Região
                    </label>
                    <input
                      type="text"
                      value={diagForm.city}
                      onChange={(e) => setDiagForm({ ...diagForm, city: e.target.value })}
                      placeholder="Goiânia e Região Metropolitana - GO"
                      className="w-full p-2.5 sm:p-3 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Avançar para Avaliação Técnica da TI</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 2: FLUXO DIAGNÓSTICO (IMAGEM 02) */}
            {diagnosticStep === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDiagnosticStep(3);
                }}
                className="space-y-4 text-xs"
              >
                <div className="bg-[#070b14] border border-slate-800/80 rounded-2xl p-3.5 space-y-1 mb-2">
                  <span className="text-orange-400 font-extrabold uppercase tracking-wider text-[11px]">
                    Etapa 2 de 3 • Perfil da Infraestrutura & Riscos
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Mapeie os pontos críticos da sua operação para direcionarmos as ferramentas certas de auditoria.
                  </p>
                </div>

                {/* Quantidade de Computadores */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Quantidade Estimada de Computadores / Terminais:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      '5 a 15 computadores',
                      '16 a 40 computadores',
                      '41 a 100 computadores',
                      'Mais de 100 computadores'
                    ].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setDiagForm({ ...diagForm, devicesCount: count })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-[11px] sm:text-xs ${
                          diagForm.devicesCount === count
                            ? 'bg-orange-500/20 border-orange-500 text-white shadow-sm shadow-orange-500/20'
                            : 'bg-[#070b12] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estrutura de Servidores */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Ambiente de Servidores & Sistemas:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Servidor Físico Local (Windows / Linux)',
                      'Servidor em Nuvem / Virtualizado (Proxmox)',
                      'Ambiente Híbrido (Local + Nuvem)',
                      'Não temos servidor dedicado (Ponto a ponto)'
                    ].map((srv) => (
                      <button
                        type="button"
                        key={srv}
                        onClick={() => setDiagForm({ ...diagForm, serverType: srv })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-[11px] sm:text-xs flex items-center gap-2 ${
                          diagForm.serverType === srv
                            ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                            : 'bg-[#070b12] border-slate-800 text-slate-300 hover:border-slate-700 font-medium'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                          diagForm.serverType === srv ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                        }`} />
                        <span>{srv}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vulnerabilidades e Riscos */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Quais vulnerabilidades ou pontos você deseja avaliar prioritariamente?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { title: 'Proteção Anti-Ransomware & Blindagem', desc: 'Risco de sequestro de dados e vírus' },
                      { title: 'Rotinas de Backup Imutável em Nuvem', desc: 'Garantia de restauração e cópia 3-2-1' },
                      { title: 'Instabilidade de Rede & Wi-Fi Corporativo', desc: 'Quedas de internet e lentidão de rede' },
                      { title: 'Firewall Perimetral & Controle de Sites', desc: 'Bloqueio de acessos e regras MikroTik' },
                      { title: 'Lentidão nos Computadores da Equipe', desc: 'Equipamentos travando e perda de tempo' },
                      { title: 'Conformidade LGPD & Gestão de Acessos', desc: 'Segurança jurídica e dados confidenciais' }
                    ].map((item) => {
                      const selected = diagForm.vulnerabilities.includes(item.title);
                      return (
                        <div
                          key={item.title}
                          onClick={() => toggleVulnerability(item.title)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            selected
                              ? 'bg-orange-500/15 border-orange-500/60 text-white'
                              : 'bg-[#070b12] border-slate-800/90 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border flex-shrink-0 ${
                            selected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-600'
                          }`}>
                            {selected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block font-bold text-xs">{item.title}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observações Adicionais */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Relato de Problemas / Sintomas Observados (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={diagForm.notes}
                    onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })}
                    placeholder="Ex: Sofremos com quedas no sinal às 15h, e queremos verificar se nosso backup realmente funciona contra ransomware."
                    className="w-full p-2.5 bg-[#070b12] border border-slate-700/80 focus:border-orange-500 rounded-xl text-white text-xs outline-none transition-colors resize-none"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDiagnosticStep(1)}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Gerar Resumo & Finalizar no WhatsApp</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 3: RESUMO E ENCAMINHAMENTO DIRETO PARA WHATSAPP (IMAGEM 03) */}
            {diagnosticStep === 3 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="bg-[#070b14] border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Etapa 3 de 3 • Diagnóstico Pronto para Envio</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Confira abaixo o resumo dos dados preenchidos. Ao clicar em finalizar, o laudo será enviado diretamente ao WhatsApp oficial da W3W Soluções em TI.
                  </p>
                </div>

                {/* Card de Resumo Estilizado */}
                <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                  {/* Selo oficial de origem do site */}
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-orange-500/10 border border-orange-500/25 rounded-xl text-orange-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>GERADO A PARTIR DO SITE OFICIAL W3W SOLUÇÕES EM TI</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">w3wsolucoesti.com.br</span>
                  </div>

                  {/* Detalhes do Solicitante e Empresa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Empresa & Solicitante</span>
                      <span className="text-white font-extrabold text-sm">{diagForm.company || 'Não informada'}</span>
                      <span className="text-slate-300 block text-xs mt-0.5">
                        {diagForm.name} {diagForm.role ? `• ${diagForm.role}` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Contato & Cidade</span>
                      <span className="text-emerald-400 font-bold block">{diagForm.phone || 'Não informado'}</span>
                      <span className="text-slate-300 block text-xs">{diagForm.email}</span>
                      <span className="text-slate-400 text-[10px] block mt-0.5">{diagForm.city}</span>
                    </div>
                  </div>

                  {/* Detalhes do Ambiente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Parque de Computadores</span>
                      <span className="text-orange-400 font-bold">{diagForm.devicesCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Servidores</span>
                      <span className="text-slate-200 font-medium">{diagForm.serverType}</span>
                    </div>
                  </div>

                  {/* Vulnerabilidades Selecionadas */}
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1.5">
                      Vulnerabilidades Selecionadas para Avaliação:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {diagForm.vulnerabilities.map((v) => (
                        <span
                          key={v}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3 text-orange-400" />
                          <span>{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {diagForm.notes.trim() && (
                    <div className="pt-1">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1">
                        Observações Informadas:
                      </span>
                      <p className="text-slate-300 italic text-xs bg-[#090f1d] p-2.5 rounded-lg border border-slate-800">
                        "{diagForm.notes.trim()}"
                      </p>
                    </div>
                  )}

                  {/* Destinatário Oficial */}
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Oficial da Central:</span>
                    </span>
                    <span className="font-mono font-black text-white text-sm">(62) 9 8223 - 9004</span>
                  </div>
                </div>

                {/* Botão de Finalização para WhatsApp */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleSendDiagnosticToWhatsApp}
                    className="w-full py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.01]"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.127-.533-1.602-.667-2.617-2.315-2.698-2.423-.078-.109-.647-.862-.647-1.644 0-.783.411-1.168.558-1.328.146-.16.321-.2.429-.2.107 0 .213.001.306.006.098.005.23-.037.36.275.134.321.458 1.119.498 1.2.041.082.068.178.014.286-.054.107-.081.174-.162.268-.081.095-.171.212-.244.285-.082.082-.168.172-.072.337.096.164.427.705.916 1.141.629.561 1.159.734 1.324.816.164.082.261.072.358-.041.098-.113.419-.489.531-.657.112-.167.224-.139.376-.083.153.055.97.458 1.137.541.167.083.278.125.319.194.041.07.041.404-.103.809z" />
                    </svg>
                    <span>FINALIZAR E ENCAMINHAR PARA O WHATSAPP (62) 9 8223 - 9004</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setDiagnosticStep(2)}
                      className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar e ajustar informações</span>
                    </button>
                    <span>⚡ Resposta prioritária pelo NOC W3W</span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO DE ENVIO COM SUCESSO */}
            {diagnosticStep === 4 && (
              <div className="py-6 px-2 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-xl font-black text-white">
                    Diagnóstico Gerado com Sucesso!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Os dados foram estruturados e a conversa foi direcionada para o WhatsApp oficial da W3W Soluções em TI:
                  </p>
                  <div className="p-3 bg-[#070b14] border border-emerald-500/30 rounded-2xl inline-block mt-2">
                    <span className="font-mono text-base font-black text-emerald-400">
                      (62) 9 8223 - 9004
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  A equipe de engenharia e sustentação de TI da W3W responderá no WhatsApp para agendar a visita técnica e emissão do laudo gratuito da sua empresa.
                </p>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendDiagnosticToWhatsApp}
                    className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Reabrir WhatsApp (62) 9 8223 - 9004</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDiagnosticModalOpen(false);
                      setDiagnosticStep(1);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Concluir e Voltar ao Site</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
