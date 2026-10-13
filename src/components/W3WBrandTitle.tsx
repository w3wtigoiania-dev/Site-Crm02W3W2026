import React from 'react';

interface W3WBrandTitleProps {
  className?: string;
  size?: 'small' | 'navbar' | 'normal' | 'large';
  showSubtitle?: boolean;
}

/**
 * W3WBrandTitle Component
 * Renderiza "W3W SOLUÇÕES TI" onde "SOLUÇÕES TI" tem rigorosamente o MESMO TAMANHO
 * (altura de caixa alta de 116 unidades) que o "W3W", mantendo o número 3 estilizado
 * com a seta dinâmica '>' animada em laranja vibrante da marca oficial (Imagem 02).
 * Inclui o modo size="navbar" com proporções padrão para cabeçalhos corporativos,
 * garantindo delimitação vetorial rígida sem sobreposição no menu de navegação.
 */
export const W3WBrandTitle: React.FC<W3WBrandTitleProps> = ({
  className = '',
  size = 'normal',
  showSubtitle = true
}) => {
  const sizeClasses = {
    small: {
      svgHeight: 'h-5 sm:h-5.5',
      subHeight: 'h-2 sm:h-2.5',
    },
    navbar: {
      svgHeight: 'h-5.5 sm:h-6 lg:h-6.5 xl:h-7',
      subHeight: 'h-2 sm:h-2.5',
    },
    normal: {
      svgHeight: 'h-6 sm:h-7 lg:h-7.5',
      subHeight: 'h-2.5 sm:h-3',
    },
    large: {
      svgHeight: 'h-8 sm:h-9 lg:h-10',
      subHeight: 'h-3 sm:h-3.5',
    }
  }[size] || {
    svgHeight: 'h-5.5 sm:h-6 lg:h-6.5 xl:h-7',
    subHeight: 'h-2 sm:h-2.5',
  };

  return (
    <div className={`inline-flex flex-col w-fit select-none group/brand ${className}`}>
      {/* Linha 1: W3W e SOLUÇÕES TI rigorosamente no MESMO TAMANHO e altura exata via SVG vetorial unificado */}
      <div className={`inline-flex items-center ${sizeClasses.svgHeight} w-auto flex-shrink-0 relative overflow-hidden`}>
        <svg
          viewBox="48 172 1380 134"
          className="h-full w-auto drop-shadow-[0_0_8px_rgba(243,131,19,0.25)] select-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="W3W SOLUÇÕES TI"
        >
          <defs>
            <linearGradient id="w3wArrowGradTitle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <filter id="w3wGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f97316" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* ============================================================== */}
          {/* LOGOMARCA W3W OFICIAL: ALTURA EXATA DE Y=182 A Y=298 (116 UNIDADES) */}
          {/* ============================================================== */}

          {/* W Esquerdo Oficial da Marca */}
          <path
            d="M 56,182 L 91,182 L 112,262 L 135,182 L 163,182 L 186,262 L 204,193 L 222,223 L 198,298 L 169,298 L 149,225 L 129,298 L 100,298 Z"
            fill="#ffffff"
          />

          {/* Curva Inferior do 3 Oficial da Marca */}
          <path
            d="M 271,231 C 285,241 292,254 292,268 C 292,287 277,298 252,298 L 204,298 L 211,275 L 249,275 C 260,275 266,271 266,264 C 266,257 261,252 252,248 Z"
            fill="#ffffff"
          />

          {/* W Direito Oficial da Marca */}
          <path
            d="M 284,220 L 311,200 L 330,262 L 353,182 L 381,182 L 404,262 L 425,182 L 460,182 L 418,298 L 389,298 L 367,225 L 347,298 L 318,298 Z"
            fill="#ffffff"
          />

          {/* Topo Laranja do 3: Seta Dinâmica '>' com Animação e Brilho Oficial */}
          <g className="animate-w3w-arrow cursor-pointer">
            <polygon
              points="202,182 323,182 243,244 229,224 257,204 215,204"
              fill="url(#w3wArrowGradTitle)"
              filter="url(#w3wGlowFilter)"
            />
          </g>

          {/* Separador Sutil e Elegante da Marca */}
          <line
            x1="472"
            y1="184"
            x2="472"
            y2="296"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* ============================================================== */}
          {/* SOLUÇÕES TI: RIGOROSAMENTE NO MESMO TAMANHO E ALTURA DE W3W */}
          {/* Linha de Base em Y=298 e Topo em Y=182, 100% Alinhados */}
          {/* ============================================================== */}
          <text
            x="490"
            y="298"
            textLength="900"
            lengthAdjust="spacingAndGlyphs"
            fill="#ffffff"
            fontFamily="'Montserrat', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="158"
            letterSpacing="0.03em"
            className="select-none"
          >
            SOLUÇÕES TI
          </text>
        </svg>
      </div>

      {/* Linha 2: SERVIÇOS COMPLETO B2B INFRAESTRUTURA & DESENVOLVIMENTO AGIL */}
      {showSubtitle && (
        <div className="w-full mt-1 sm:mt-1.5 overflow-hidden">
          <svg
            viewBox="0 0 520 20"
            className={`w-full ${sizeClasses.subHeight} block overflow-hidden pointer-events-none`}
            preserveAspectRatio="none"
            aria-label="SERVIÇOS COMPLETO B2B INFRAESTRUTURA & DESENVOLVIMENTO AGIL"
          >
            <text
              x="0"
              y="15"
              textLength="520"
              lengthAdjust="spacingAndGlyphs"
              fill="#cbd5e1"
              fontSize="11"
              fontFamily="'Montserrat', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontWeight="700"
            >
              SERVIÇOS COMPLETO B2B INFRAESTRUTURA &amp; DESENVOLVIMENTO <tspan fill="#f97316" fontWeight="900">AGIL</tspan>
            </text>
          </svg>
        </div>
      )}
    </div>
  );
};

