import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  Palette,
  ShieldCheck,
  Tag,
  Clock,
  History,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { EquipmentStatus, EquipmentStatusLog, StatusSituationType } from '../types.ts';
import { StatusBadge, COLOR_PALETTE, SITUATION_LABELS } from '../utils/statusUtils.tsx';

interface StatusManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusesChanged?: () => void;
}

export const StatusManagementModal: React.FC<StatusManagementModalProps> = ({
  isOpen,
  onClose,
  onStatusesChanged
}) => {
  const [statuses, setStatuses] = useState<EquipmentStatus[]>([]);
  const [logs, setLogs] = useState<EquipmentStatusLog[]>([]);
  const [activeTab, setActiveTab] = useState<'statuses' | 'register' | 'logs'>('statuses');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formSituation, setFormSituation] = useState<StatusSituationType>('manutencao');
  const [formDescription, setFormDescription] = useState('');
  const [formRequiresPassword, setFormRequiresPassword] = useState(true);

  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/equipment-statuses');
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/statuses/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar logs:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormColor('blue');
    setFormSituation('manutencao');
    setFormDescription('');
    setFormRequiresPassword(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const startEdit = (status: EquipmentStatus) => {
    setEditingId(status.id);
    setFormName(status.name);
    setFormColor(status.color);
    setFormSituation(status.situation_type);
    setFormDescription(status.description || '');
    setFormRequiresPassword(status.requires_password);
    setActiveTab('register');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Informe o nome do status.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const selectedPalette = COLOR_PALETTE.find(p => p.id === formColor) || COLOR_PALETTE[0];
      const payload = {
        name: formName.trim(),
        color: formColor,
        hex_color: selectedPalette.hex,
        bg_class: `${selectedPalette.bg} ${selectedPalette.text} border ${selectedPalette.border}`,
        situation_type: formSituation,
        description: formDescription.trim(),
        requires_password: formRequiresPassword,
        is_active: true
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`/api/equipment-statuses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/equipment-statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao salvar status.');
      }

      setSuccessMsg(editingId ? 'Status atualizado com sucesso!' : 'Novo status cadastrado com sucesso!');
      await fetchStatuses();
      onStatusesChanged?.();
      setTimeout(() => {
        resetForm();
        setActiveTab('statuses');
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar operação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (status: EquipmentStatus) => {
    if (status.is_default) {
      alert('Este status é padrão protegido do sistema e não pode ser excluído.');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir o status "${status.name}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/equipment-statuses/${status.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível excluir o status.');
      }
      await fetchStatuses();
      onStatusesChanged?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b101d] border border-blue-500/40 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Gestão e Cadastro de Status de Manutenção
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                  {statuses.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Diferencie cores por situação técnica e controle mudanças com senha de segurança
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

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-4 pb-3 border-b border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('statuses'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'statuses'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Status Cadastrados ({statuses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { resetForm(); setActiveTab('register'); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? 'Editar Status' : '+ Cadastrar Novo Status'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('logs'); fetchLogs(); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoria & Trocas ({logs.length})</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="my-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 py-3 pr-1">
          {/* TAB 1: LISTAGEM DE STATUS */}
          {activeTab === 'statuses' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statuses.map(s => {
                  const sitInfo = SITUATION_LABELS[s.situation_type] || SITUATION_LABELS.geral;
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <StatusBadge status={s.name} customStatuses={statuses} size="md" />
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                              {sitInfo.label}
                            </span>
                            {s.requires_password && (
                              <span
                                title="Exige senha de segurança para aplicar"
                                className="p-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] flex items-center"
                              >
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">
                          {s.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                        <span>{s.is_default ? 'Padrão do Sistema' : 'Personalizado'}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Editar status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!s.is_default && (
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Excluir status"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {statuses.length === 0 && !isLoading && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum status encontrado. Clique em "+ Cadastrar Novo Status".
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CADASTRAR OU EDITAR STATUS */}
          {activeTab === 'register' && (
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl mx-auto p-1">
              {/* Preview Dinâmico */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Prévia do Badge em Tempo Real:
                </span>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={formName.trim() || 'Exemplo de Status'}
                    customStatuses={[
                      {
                        id: 'preview',
                        name: formName.trim() || 'Exemplo de Status',
                        color: formColor,
                        hex_color: COLOR_PALETTE.find(p => p.id === formColor)?.hex || '#3b82f6',
                        situation_type: formSituation,
                        description: formDescription,
                        requires_password: formRequiresPassword,
                        is_default: false,
                        order_index: 0,
                        is_active: true
                      }
                    ]}
                    size="lg"
                  />
                  {formRequiresPassword && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                      <Lock className="w-3 h-3" /> Exigirá senha para aplicar
                    </span>
                  )}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Status *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Em Testes Finais, Aguardando Peça, Liberado..."
                  className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Situação Técnica */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Situação Técnica (Classificação Operacional)
                </label>
                <select
                  value={formSituation}
                  onChange={(e) => setFormSituation(e.target.value as StatusSituationType)}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  {Object.entries(SITUATION_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor Visual de Cores */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  Cor de Destaque da Situação
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_PALETTE.map(p => {
                    const isSelected = formColor === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormColor(p.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="text-[11px] text-slate-200 truncate font-medium">
                          {p.name.split(' ')[0]}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição da Situação Técnica
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explique o estado em que o equipamento se encontra ao estar neste status..."
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Exigir Senha */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Exigir Senha para Mudar para este Status
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Maior controle e segurança: técnicos e supervisores precisarão informar a senha de autorização.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formRequiresPassword}
                  onChange={(e) => setFormRequiresPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {/* Botões */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { resetForm(); setActiveTab('statuses'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Status'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUDITORIA DE STATUS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Registro imutável de todas as alterações de status de controle de equipamentos protegidas por senha.
                </span>
              </div>

              <div className="space-y-2">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <span>{log.hostname || 'Equipamento'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({log.machine_id})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-slate-400">Transição:</span>
                      <StatusBadge status={log.previous_status || 'Sem status'} customStatuses={statuses} size="sm" />
                      <span className="text-slate-500 font-bold">➔</span>
                      <StatusBadge status={log.new_status} customStatuses={statuses} size="sm" />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span>Autorizado por: <strong className="text-slate-200">{log.authorized_by}</strong></span>
                      {log.reason && <span className="italic text-slate-400">{log.reason}</span>}
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Nenhum registro de alteração de status realizado até o momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
