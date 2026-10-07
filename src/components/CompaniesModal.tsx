import React, { useState } from 'react';
import { ClientCompany } from '../types.ts';
import {
  X,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Server,
  Mail,
  Phone,
  User,
  FileText,
  Shield,
  Search,
  ExternalLink,
  Save,
  RotateCcw
} from 'lucide-react';

interface CompaniesModalProps {
  companies: ClientCompany[];
  selectedCompany: string;
  onSelectCompany: (companyName: string) => void;
  onRefreshCompanies: () => Promise<void>;
  onClose: () => void;
}

export const CompaniesModal: React.FC<CompaniesModalProps> = ({
  companies,
  selectedCompany,
  onSelectCompany,
  onRefreshCompanies,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    trade_name: '',
    document: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    sla_plan: 'Prata (12x5)',
    notes: ''
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      trade_name: '',
      document: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      sla_plan: 'Prata (12x5)',
      notes: ''
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (comp: ClientCompany) => {
    setEditingId(comp.id);
    setFormData({
      name: comp.name || '',
      trade_name: comp.trade_name || comp.name || '',
      document: comp.document || '',
      contact_name: comp.contact_name || '',
      contact_email: comp.contact_email || '',
      contact_phone: comp.contact_phone || '',
      sla_plan: comp.sla_plan || 'Prata (12x5)',
      notes: comp.notes || ''
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('O nome da empresa cliente é obrigatório.');
      return;
    }

    setSaving(true);
    setMsg('');

    try {
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao salvar dados da empresa.');
      }

      await onRefreshCompanies();
      setMsg(editingId ? 'Empresa atualizada com sucesso!' : 'Empresa cliente cadastrada com sucesso!');
      setIsEditing(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (comp: ClientCompany) => {
    if (!window.confirm(`Deseja realmente remover a empresa "${comp.name}"? As máquinas vinculadas não serão excluídas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${comp.id}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshCompanies();
        if (selectedCompany === comp.name) {
          onSelectCompany('all');
        }
      }
    } catch (err) {
      console.error('Falha ao remover empresa:', err);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.trade_name && c.trade_name.toLowerCase().includes(search.toLowerCase())) ||
    (c.document && c.document.includes(search)) ||
    (c.contact_name && c.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Gestão de Empresas Clientes (Ambiente MSP / B2B)
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  {companies.length} cadastradas
                </span>
              </h2>
              <p className="text-slate-400 mt-0.5">
                Organize os equipamentos de TI por cliente corporativo, contratos de SLA e contatos técnicos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {msg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{msg}</span>
            </div>
          )}

          {isEditing ? (
            /* Form to Create/Edit */
            <form onSubmit={handleSubmit} className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  {editingId ? 'Editar Empresa Cliente' : 'Nova Empresa Cliente'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nome Fantasia / Comercial: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Hospital São Lucas"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Razão Social:
                  </label>
                  <input
                    type="text"
                    value={formData.trade_name}
                    onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                    placeholder="Ex: Hospital & Maternidade São Lucas S/A"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    CNPJ / Documento:
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Plano de Suporte / SLA:
                  </label>
                  <select
                    value={formData.sla_plan}
                    onChange={(e) => setFormData({ ...formData, sla_plan: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Bronze (8x5 Comercial)">Bronze (8x5 Comercial)</option>
                    <option value="Prata (12x5)">Prata (12x5)</option>
                    <option value="Ouro (24x7 Crítico)">Ouro (24x7 Crítico)</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Contato do Gestor / Responsável:
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Ex: Dra. Camila Torres"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    E-mail de Notificação / Chamados:
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="ti@empresa.com.br"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="(11) 98877-6655"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Observações de Contrato:
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Servidores em sala cofre, 2 links redundantes"
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Gravando...' : 'Salvar Empresa'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Companies List & Toolbar */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar empresa por nome, CNPJ ou contato..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectCompany('all');
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer font-medium ${
                      selectedCompany === 'all'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>Ver Todas (Visão Global MSP)</span>
                  </button>

                  <button
                    onClick={handleOpenNew}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Empresa</span>
                  </button>
                </div>
              </div>

              {/* Company Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCompanies.map((comp) => {
                  const isCurrent = selectedCompany === comp.name;

                  return (
                    <div
                      key={comp.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isCurrent
                          ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {comp.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {comp.sla_plan || 'Padrão'}
                            </span>
                          </div>
                          {comp.trade_name && comp.trade_name !== comp.name && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {comp.trade_name}
                            </p>
                          )}
                          {comp.document && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              CNPJ: {comp.document}
                            </span>
                          )}
                        </div>

                        {/* Machines badge */}
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 font-bold text-white text-xs">
                            <Server className="w-3 h-3 text-emerald-400" />
                            {comp.machine_count || 0} ativos
                          </span>
                        </div>
                      </div>

                      {/* Contact information */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400 text-[11px]">
                        {comp.contact_name && (
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>{comp.contact_name}</span>
                          </div>
                        )}
                        {comp.contact_email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>{comp.contact_email}</span>
                          </div>
                        )}
                        {comp.contact_phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>{comp.contact_phone}</span>
                          </div>
                        )}
                        {comp.notes && (
                          <p className="text-[10px] text-slate-500 pt-1 line-clamp-1 italic">
                            "{comp.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCompany(comp.name);
                            onClose();
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'Empresa Selecionada' : 'Filtrar por esta Empresa'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(comp)}
                          title="Editar cadastro da empresa"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(comp)}
                          title="Excluir empresa"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-slate-500">
          <span>Selecione uma empresa para filtrar relatórios, cronogramas e inventário.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
