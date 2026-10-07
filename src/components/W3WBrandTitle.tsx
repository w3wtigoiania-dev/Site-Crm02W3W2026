import React from 'react';

interface W3WBrandTitleProps {
  className?: string;
  size?: 'normal' | 'large' | 'small';
  showSubtitle?: boolean;
}

/**
 * W3WBrandTitle Component
 * Renderiza "W3W SOLUÇÕES TI" com a tipografia oficial e o subtítulo
 * "SERVIÇOS COMPLETO B2B INFRAESTRUTURA & DESENVOLVIMENTO AGIL"
 * exatamente do mesmo tamanho e 100% alinhado de ponta a ponta (justificado).
 */
export const W3WBrandTitle: React.FC<W3WBrandTitleProps> = ({
  className = '',
  size = 'normal',
  showSubtitle = true
}) => {
  return (
    <div className={`inline-flex flex-col w-fit select-none ${className}`}>
      {/* Linha 1: W3W SOLUÇÕES TI */}
      <div className="flex items-center leading-none whitespace-nowrap">
        <span className="text-xl sm:text-2xl font-black text-white tracking-wider">W</span>
        <span className="text-xl sm:text-2xl font-black text-orange-500 tracking-wider">3</span>
        <span className="text-xl sm:text-2xl font-black text-white tracking-wider">W</span>
        <span className="text-xl sm:text-2xl font-black text-white tracking-wider ml-1.5 sm:ml-2">
          SOLUÇÕES TI
        </span>
      </div>

      {/* Linha 2: SERVIÇOS COMPLETO B2B INFRAESTRUTURA & DESENVOLVIMENTO AGIL
          Exatamente do tamanho (comprimento) e alinhado com W3W SOLUÇÕES TI */}
      {showSubtitle && (
        <div className="w-full mt-1 sm:mt-1.5 overflow-hidden">
          <svg
            viewBox="0 0 520 20"
            className="w-full h-2.5 sm:h-3 block overflow-hidden pointer-events-none"
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
