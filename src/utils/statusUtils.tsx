import React from 'react';
import {
  CheckCircle2,
  Wrench,
  Clock,
  Search,
  FileCheck2,
  CheckCheck,
  ShieldAlert,
  Archive,
  Ban,
  Lock,
  Cpu,
  AlertTriangle,
  Layers,
  HelpCircle
} from 'lucide-react';
import { EquipmentStatus, StatusSituationType } from '../types.ts';

export interface StatusStyleConfig {
  name: string;
  color: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
  situation: StatusSituationType;
}

export const SITUATION_LABELS: Record<StatusSituationType, { label: string; color: string }> = {
  operacional: { label: 'Operacional', color: 'emerald' },
  manutencao: { label: 'Em Manutenção', color: 'amber' },
  analise: { label: 'Análise / Diagnóstico', color: 'blue' },
  pendencia: { label: 'Pendente / Aguardando', color: 'yellow' },
  concluido: { label: 'Pronto / Liberado', color: 'teal' },
  inativo: { label: 'Inativo / Desativado', color: 'rose' },
  reserva: { label: 'Reserva Técnica', color: 'slate' },
  seguranca: { label: 'Quarentena / Bloqueio', color: 'red' },
  geral: { label: 'Geral', color: 'blue' }
};

export const COLOR_PALETTE = [
  { id: 'emerald', name: 'Verde Esmeralda (Operacional)', hex: '#10b981', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { id: 'amber', name: 'Âmbar / Laranja (Manutenção)', hex: '#f59e0b', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { id: 'yellow', name: 'Amarelo Ouro (Pendente / Peça)', hex: '#eab308', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  { id: 'blue', name: 'Azul Elétrico (Diagnóstico / Triagem)', hex: '#3b82f6', border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { id: 'cyan', name: 'Ciano (Laboratório / Testes)', hex: '#06b6d4', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  { id: 'teal', name: 'Verde Água / Teal (Pronto / Liberado)', hex: '#14b8a6', border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-400' },
  { id: 'purple', name: 'Roxo / Violeta (Aprovação / Orçamento)', hex: '#a855f7', border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { id: 'indigo', name: 'Índigo (Garantia RMA / Fabricante)', hex: '#6366f1', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  { id: 'rose', name: 'Rosa Carmim (Desativado / Sucata)', hex: '#f43f5e', border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  { id: 'red', name: 'Vermelho Alerta (Quarentena / Bloqueado)', hex: '#ef4444', border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
  { id: 'orange', name: 'Laranja Intenso (Urgência)', hex: '#f97316', border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  { id: 'slate', name: 'Cinza / Slate (Reserva Técnica)', hex: '#64748b', border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-300' }
];

export function getStatusStyle(statusName: string, customStatuses?: EquipmentStatus[]): StatusStyleConfig {
  const norm = (statusName || '').trim().toLowerCase();

  // Se tiver um status customizado cadastrado no banco com esse nome
  if (customStatuses && customStatuses.length > 0) {
    const match = customStatuses.find(s => s.name.trim().toLowerCase() === norm);
    if (match) {
      const palette = COLOR_PALETTE.find(p => p.id === match.color) || COLOR_PALETTE[0];
      return {
        name: match.name,
        color: match.color,
        hex: match.hex_color || palette.hex,
        bgClass: palette.bg,
        borderClass: palette.border,
        textClass: palette.text,
        dotColor: palette.hex,
        icon: getIconForSituation(match.situation_type),
        situation: match.situation_type
      };
    }
  }

  // Predefinições conhecidas
  switch (norm) {
    case 'ativo':
    case 'operacional':
    case 'em operacao':
    case 'online':
      return {
        name: statusName || 'Ativo',
        color: 'emerald',
        hex: '#10b981',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/25',
        textClass: 'text-emerald-400',
        dotColor: '#10b981',
        icon: CheckCircle2,
        situation: 'operacional'
      };

    case 'em manutenção':
    case 'em manutencao':
    case 'manutencao':
    case 'reparo':
      return {
        name: statusName || 'Em Manutenção',
        color: 'amber',
        hex: '#f59e0b',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/30',
        textClass: 'text-amber-400',
        dotColor: '#f59e0b',
        icon: Wrench,
        situation: 'manutencao'
      };

    case 'aguardando peça':
    case 'aguardando peca':
    case 'aguardando pecas':
    case 'pendente':
      return {
        name: statusName || 'Aguardando Peça',
        color: 'yellow',
        hex: '#eab308',
        bgClass: 'bg-yellow-500/15',
        borderClass: 'border-yellow-500/30',
        textClass: 'text-yellow-400',
        dotColor: '#eab308',
        icon: Clock,
        situation: 'pendencia'
      };

    case 'em diagnóstico':
    case 'em diagnostico':
    case 'diagnostico':
    case 'triagem':
    case 'analise':
      return {
        name: statusName || 'Em Diagnóstico',
        color: 'blue',
        hex: '#3b82f6',
        bgClass: 'bg-blue-500/15',
        borderClass: 'border-blue-500/30',
        textClass: 'text-blue-400',
        dotColor: '#3b82f6',
        icon: Search,
        situation: 'analise'
      };

    case 'aguardando aprovação':
    case 'aguardando aprovacao':
    case 'orcamento':
    case 'aguardando orcamento':
      return {
        name: statusName || 'Aguardando Aprovação',
        color: 'purple',
        hex: '#a855f7',
        bgClass: 'bg-purple-500/15',
        borderClass: 'border-purple-500/30',
        textClass: 'text-purple-400',
        dotColor: '#a855f7',
        icon: FileCheck2,
        situation: 'pendencia'
      };

    case 'pronto':
    case 'pronto / liberado':
    case 'liberado':
    case 'concluido':
    case 'concluída':
    case 'finalizado':
      return {
        name: statusName || 'Pronto / Liberado',
        color: 'teal',
        hex: '#14b8a6',
        bgClass: 'bg-teal-500/15',
        borderClass: 'border-teal-500/30',
        textClass: 'text-teal-400',
        dotColor: '#14b8a6',
        icon: CheckCheck,
        situation: 'concluido'
      };

    case 'garantia':
    case 'garantia / rma':
    case 'rma':
    case 'em garantia':
      return {
        name: statusName || 'Garantia / RMA',
        color: 'indigo',
        hex: '#6366f1',
        bgClass: 'bg-indigo-500/15',
        borderClass: 'border-indigo-500/30',
        textClass: 'text-indigo-400',
        dotColor: '#6366f1',
        icon: ShieldAlert,
        situation: 'manutencao'
      };

    case 'reserva':
    case 'reserva técnica':
    case 'reserva tecnica':
    case 'backup':
    case 'sobressalente':
      return {
        name: statusName || 'Reserva',
        color: 'slate',
        hex: '#64748b',
        bgClass: 'bg-slate-500/15',
        borderClass: 'border-slate-500/30',
        textClass: 'text-slate-300',
        dotColor: '#94a3b8',
        icon: Archive,
        situation: 'reserva'
      };

    case 'desativado':
    case 'inativo':
    case 'descarte':
    case 'sucata':
    case 'baixado':
      return {
        name: statusName || 'Desativado',
        color: 'rose',
        hex: '#f43f5e',
        bgClass: 'bg-rose-500/15',
        borderClass: 'border-rose-500/30',
        textClass: 'text-rose-400',
        dotColor: '#f43f5e',
        icon: Ban,
        situation: 'inativo'
      };

    case 'quarentena':
    case 'bloqueado':
    case 'quarentena / bloqueado':
    case 'critico':
    case 'incidente':
      return {
        name: statusName || 'Quarentena / Bloqueado',
        color: 'red',
        hex: '#ef4444',
        bgClass: 'bg-red-500/15',
        borderClass: 'border-red-500/30',
        textClass: 'text-red-400',
        dotColor: '#ef4444',
        icon: Lock,
        situation: 'seguranca'
      };

    default:
      return {
        name: statusName || 'Não Definido',
        color: 'slate',
        hex: '#64748b',
        bgClass: 'bg-slate-800/80',
        borderClass: 'border-slate-700',
        textClass: 'text-slate-300',
        dotColor: '#94a3b8',
        icon: HelpCircle,
        situation: 'geral'
      };
  }
}

function getIconForSituation(situation: StatusSituationType): React.ComponentType<{ className?: string }> {
  switch (situation) {
    case 'operacional':
      return CheckCircle2;
    case 'manutencao':
      return Wrench;
    case 'analise':
      return Search;
    case 'pendencia':
      return Clock;
    case 'concluido':
      return CheckCheck;
    case 'reserva':
      return Archive;
    case 'inativo':
      return Ban;
    case 'seguranca':
      return Lock;
    default:
      return HelpCircle;
  }
}

interface StatusBadgeProps {
  status: string;
  customStatuses?: EquipmentStatus[];
  showIcon?: boolean;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customStatuses,
  showIcon = true,
  showDot = true,
  size = 'md',
  className = '',
  onClick,
  title
}) => {
  const style = getStatusStyle(status, customStatuses);
  const IconComponent = style.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5'
  }[size];

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  }[size];

  return (
    <span
      onClick={onClick}
      title={title || `Situação: ${style.name} (${SITUATION_LABELS[style.situation]?.label || style.situation})`}
      className={`inline-flex items-center font-semibold rounded-md border backdrop-blur-sm transition-all select-none ${style.bgClass} ${style.borderClass} ${style.textClass} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''
      } ${className}`}
      style={{
        boxShadow: `0 0 10px -2px ${style.hex}25`
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: style.dotColor }}
        />
      )}
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span className="truncate tracking-wide">{style.name}</span>
    </span>
  );
};
