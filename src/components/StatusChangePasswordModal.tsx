import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Laptop,
  FileText
} from 'lucide-react';
import { Machine, EquipmentStatus } from '../types.ts';
import { StatusBadge } from '../utils/statusUtils.tsx';

interface StatusChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine;
  targetStatus: string;
  customStatuses?: EquipmentStatus[];
  onSuccess: (updatedMachine: Machine) => void;
  currentUser?: { name?: string; role?: string } | null;
}

export const StatusChangePasswordModal: React.FC<StatusChangePasswordModalProps> = ({
  isOpen,
  onClose,
  machine,
  targetStatus,
  customStatuses = [],
  onSuccess,
  currentUser
}) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Informe a senha de autorização técnica/supervisor.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await fetch(`/api/machines/${machine.id}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          password: password.trim(),
          reason: reason.trim() || `Alteração para ${targetStatus} autorizada`,
          requested_by: currentUser?.name || 'Técnico Autorizado'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Senha incorreta. Não foi possível autorizar a mudança de status.');
      }

      onSuccess(data.machine || { ...machine, status: targetStatus as any });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na autorização de segurança.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b101d] border border-blue-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Autorização de Segurança
                <span className="px-1.5 py-0.5 text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 rounded font-semibold uppercase">
                  Controle de Ativos
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Validação de senha para alteração de status de equipamento/serviço
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações do Equipamento */}
        <div className="mt-4 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white text-sm">{machine.hostname}</span>
              {machine.asset_tag && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {machine.asset_tag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{machine.client_company || 'Cliente Geral'}</span>
            </div>
          </div>

          {/* Comparativo de Status */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Status Atual</span>
              <StatusBadge status={machine.status} customStatuses={customStatuses} size="sm" />
            </div>

            <div className="flex items-center justify-center p-1.5 text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/20">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Novo Status</span>
              <StatusBadge status={targetStatus} customStatuses={customStatuses} size="sm" />
            </div>
          </div>
        </div>

        {/* Formulário com Senha */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Senha de Autorização (Supervisor / Técnico)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha de supervisor..."
                className="w-full py-2.5 pl-3.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm font-medium tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Motivo / Justificativa Técnica (Auditoria)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Encaminhado para troca de SSD, Teste de bancada finalizado..."
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Alerta de Erro */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block">Acesso Não Autorizado</span>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Dica de Senhas para o Usuário */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showHint ? 'Ocultar credenciais padrão' : 'Ver senhas de autorização do sistema'}</span>
            </button>
            {showHint && (
              <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1 font-mono">
                <div>• Supervisor Geral: <strong className="text-white">Admin@1b2c3d4%</strong> ou <strong className="text-white">admin123</strong></div>
                <div>• Suporte NOC: <strong className="text-white">editor123</strong> ou <strong className="text-white">w3w@2026</strong></div>
                <div>• PIN Rápido: <strong className="text-white">123456</strong></div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Mudança</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
