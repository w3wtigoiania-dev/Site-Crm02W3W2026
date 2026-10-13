import React from 'react';

interface W3WLogoProps {
  className?: string;
  size?: number | string;
}

export const W3WLogo: React.FC<W3WLogoProps> = ({ className = 'w-12 h-12', size }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="W3W Soluções em TI"
    >
      <svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(243,131,19,0.3)] transition-transform hover:scale-105 duration-300"
      >
        {/* Círculo Escuro de Fundo com contorno laranja suave */}
        <circle
          cx="250"
          cy="250"
          r="245"
          fill="#181816"
          stroke="#f38313"
          strokeWidth="7"
        />

        {/* Elementos Brancos: W esquerdo, Base do 3, W direito */}
        <g fill="#e8e8e8">
          {/* W Esquerdo com corte superior direito inclinado */}
          <path d="M 56,182 L 91,182 L 112,262 L 135,182 L 163,182 L 186,262 L 204,193 L 222,223 L 198,298 L 169,298 L 149,225 L 129,298 L 100,298 Z" />

          {/* Curva Inferior do 3 */}
          <path d="M 271,231 C 285,241 292,254 292,268 C 292,287 277,298 252,298 L 204,298 L 211,275 L 249,275 C 260,275 266,271 266,264 C 266,257 261,252 252,248 Z" />

          {/* W Direito com corte superior esquerdo inclinado */}
          <path d="M 284,220 L 311,200 L 330,262 L 353,182 L 381,182 L 404,262 L 425,182 L 460,182 L 418,298 L 389,298 L 367,225 L 347,298 L 318,298 Z" />
        </g>

        <defs>
          <linearGradient id="w3wCircleArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="40%" stopColor="#f38313" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        {/* Topo Laranja do 3 (Formato de Seta Dinâmica com Animação) */}
        <g className="animate-w3w-arrow">
          <polygon
            points="202,182 323,182 243,244 229,224 257,204 215,204"
            fill="url(#w3wCircleArrowGrad)"
          />
        </g>

        {/* Subtítulo Laranja */}
        <text
          x="250"
          y="340"
          fill="#f38313"
          fontFamily="'Montserrat', sans-serif"
          fontWeight="700"
          fontSize="27px"
          textAnchor="middle"
          letterSpacing="0.22em"
        >
          SOLUÇÕES EM TI
        </text>
      </svg>
    </div>
  );
};
