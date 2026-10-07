import React, { useState, useEffect } from 'react';
import { AppUser, RoleItem, ScopeItem, UserRole, ClientCompany } from '../types.ts';
import {
  X,
  Users,
  Shield,
  UserPlus,
  Key,
  Mail,
  UserCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  ShieldAlert,
  Layers,
  Lock,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Building2
} from 'lucide-react';

interface UsersModalProps {
  onClose: () => void;
  currentUser?: { name?: string; role?: string; email?: string } | null;
  companies?: ClientCompany[];
}

export const UsersModal: React.FC<UsersModalProps> = ({ onClose, currentUser, companies = [] }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [scopes, setScopes] = useState<ScopeItem[]>([]);
  const [companiesList, setCompaniesList] = useState<ClientCompany[]>(companies);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'reference'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating or editing user
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Operador' as UserRole,
    company_id: '',
    company_name: '',
    is_active: true,
    scopePermissions: {} as Record<string, string> // scope_id -> role_id
  });

  // Matrix edit state: userId -> { scopeId -> roleId }
  const [matrixState, setMatrixState] = useState<Record<string, Record<string, string>>>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, scopesRes, compRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/scopes'),
        fetch('/api/companies')
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const scopesData = await scopesRes.json();
      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.companies) setCompaniesList(compData.companies);
      }

      const userList: AppUser[] = usersData.users || [];
      const roleList: RoleItem[] = rolesData.roles || [];
      const scopeList: ScopeItem[] = scopesData.scopes || [];

      setUsers(userList);
      setRoles(roleList);
      setScopes(scopeList);

      // Initialize matrix state
      const initialMatrix: Record<string, Record<string, string>> = {};
      userList.forEach(u => {
        initialMatrix[u.id] = {};
        // Match default primary role id
        const primaryRoleObj = roleList.find(r => r.name === u.role) || roleList[0];
        const defaultRoleId = primaryRoleObj?.id || '';

        scopeList.forEach(s => {
          // If specific permission exists in user.permissions, use it
          const perm = u.permissions?.find(p => p.scope_id === s.id);
          initialMatrix[u.id][s.id] = perm?.role_id || defaultRoleId;
        });
      });

      setMatrixState(initialMatrix);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de usuários e permissões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    const initialScopePerms: Record<string, string> = {};
    const defaultRole = roles.find(r => r.name === 'Operador') || roles[0];
    scopes.forEach(s => {
      initialScopePerms[s.id] = defaultRole?.id || '';
    });

    const defaultCompany = companiesList[0];

    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'Operador',
      company_id: defaultCompany ? defaultCompany.id : '',
      company_name: defaultCompany ? defaultCompany.name : '',
      is_active: true,
      scopePermissions: initialScopePerms
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    const currentScopePerms: Record<string, string> = {};
    const primaryRoleObj = roles.find(r => r.name === user.role) || roles[0];
    
    scopes.forEach(s => {
      const perm = user.permissions?.find(p => p.scope_id === s.id);
      currentScopePerms[s.id] = perm?.role_id || primaryRoleObj?.id || '';
    });

    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      company_id: user.company_id || (companiesList.find(c => c.name === user.company_name)?.id || ''),
      company_name: user.company_name || companiesList[0]?.name || '',
      is_active: user.is_active,
      scopePermissions: currentScopePerms
    });
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.company_name) {
      setError('É obrigatório selecionar uma empresa cadastrada para vincular o usuário.');
      return;
    }

    try {
      const permissionsArray = Object.entries(formData.scopePermissions).map(([scope_id, role_id]) => ({
        scope_id,
        role_id
      }));

      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username || formData.email.split('@')[0],
        role: formData.role,
        company_id: formData.company_id,
        company_name: formData.company_name,
        is_active: formData.is_active,
        password: formData.password || undefined,
        permissions: permissionsArray
      };

      if (editingUserId) {
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao atualizar usuário');
        }
        setSuccessMsg(`Usuário "${formData.name}" atualizado com sucesso!`);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao cadastrar usuário');
        }
        setSuccessMsg(`Usuário "${formData.name}" cadastrado com sucesso!`);
      }

      setIsFormOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o usuário "${name}" e revogar todas as suas permissões?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir usuário');
      setSuccessMsg(`Usuário "${name}" excluído.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMatrixCellChange = (userId: string, scopeId: string, roleId: string) => {
    setMatrixState(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [scopeId]: roleId
      }
    }));
  };

  const handleSaveAllMatrix = async () => {
    setSavingMatrix(true);
    setError('');
    try {
      // Save for each user
      const promises = Object.entries(matrixState).map(([userId, scopeMap]) => {
        const permissions = Object.entries(scopeMap).map(([scope_id, role_id]) => ({
          scope_id,
          role_id
        }));
        return fetch(`/api/users/${userId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions })
        });
      });

      await Promise.all(promises);
      setSuccessMsg('Matriz de permissões salva e aplicada para todos os escopos!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Erro ao gravar matriz de permissões');
    } finally {
      setSavingMatrix(false);
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case 'SuperAdmin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Editor':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'Operador':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Viewer':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-500/20 border border-purple-400/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Gestão de Usuários & Matriz de Permissões (RBAC)
                </h2>
                <span className="text-[10px] px-2 py-0.5 font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  4 Níveis Hierárquicos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre usuários corporativos e configure permissões granulares por escopo (Rede, Servidores, Segurança, Web-Apps)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriz por Escopos</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lista de Usuários ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reference')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reference'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Regras & Papéis</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Alerts / Feedback */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: MATRIZ DE PERMISSÕES POR ESCOPO */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Matriz de Papel por Escopo de Sistema
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permite que um mesmo usuário possua papéis diferentes em cada módulo (Ex: <strong>Operador</strong> em Rede, mas <strong>Viewer</strong> em Segurança).
                  </p>
                </div>

                <button
                  onClick={handleSaveAllMatrix}
                  disabled={savingMatrix}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingMatrix ? 'Gravando...' : 'Salvar Matriz de Permissões'}</span>
                </button>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Usuário / Identificação</th>
                      <th className="py-3 px-3">Papel Geral</th>
                      {scopes.map(sc => (
                        <th key={sc.id} className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                            {sc.name}
                          </span>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                          <div className="text-[11px] text-sky-400 font-medium flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-sky-400" />
                            <span>{u.company_name || 'Sem Empresa Vinculada'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        {scopes.map(sc => {
                          const currentRoleId = matrixState[u.id]?.[sc.id] || '';
                          return (
                            <td key={sc.id} className="py-3 px-3 text-center">
                              <select
                                value={currentRoleId}
                                onChange={(e) => handleMatrixCellChange(u.id, sc.id, e.target.value)}
                                className="py-1 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer max-w-[130px]"
                              >
                                {roles.map(r => (
                                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                            title="Editar cadastro do usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LISTA DE USUÁRIOS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search filter */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar usuário por nome, email ou login..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <span className="text-xs text-slate-400">
                  Total: <strong>{filteredUsers.length}</strong> usuário(s)
                </span>
              </div>

              {/* Users Cards / Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 p-4 rounded-xl space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{u.name}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getRoleBadgeStyle(u.role)}`}>
                            {u.role}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {u.company_name || 'Sem Empresa Vinculada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-mono text-slate-400">@{u.username}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar Usuário"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Excluir Usuário"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scope Permissions Badges */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Permissões Atribuídas por Escopo:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {scopes.map(sc => {
                          const perm = u.permissions?.find(p => p.scope_id === sc.id);
                          const rName = perm ? perm.role_name : u.role;
                          return (
                            <div key={sc.id} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                              <span className="text-slate-400">{sc.name}:</span>
                              <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] border ${getRoleBadgeStyle(rName)}`}>
                                {rName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REGRAS E MATRIZ OFICIAL (TABELA DA ESPECIFICAÇÃO) */}
          {activeTab === 'reference' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Matriz de Permissões de Acesso do Sistema (4 Níveis Hierárquicos)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Especificação oficial que governa as ações de cada papel dentro do <strong>INFRA ASSET MANAGER</strong>:
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-40">Nível de Acesso</th>
                      <th className="py-3 px-4">Permissões no Sistema Próprio</th>
                      <th className="py-3 px-4 w-60">Quem utiliza?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-bold text-purple-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        SuperAdmin
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <strong>Controle total.</strong> Cria usuários, define chaves de API, altera conexões de banco/coletores e audita ações.
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        Dono do sistema / Líder de infraestrutura
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-bold text-sky-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        Editor / Configurador
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <strong>Cria e edita dashboards</strong>, define regras e limites de alertas (thresholds), cadastra novos servidores ou URLs para monitorar.
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        Engenheiros seniores de cada área
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-bold text-emerald-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Operador
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <strong>Visualiza painéis em tempo real</strong>, interage com alertas ativos (marca como "em andamento" ou "resolvido"), visualiza logs básicos.
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        Analistas de plantão (NOC / Suporte)
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-bold text-amber-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Viewer (Apenas Leitura)
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <strong>Visualiza apenas dashboards consolidados</strong> e relatórios de disponibilidade (Uptime/SLA). Não altera nada.
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        Gestores, diretores e clientes internos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Scopes Description */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Módulos & Escopos do Sistema Cadastrados:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {scopes.map(s => (
                    <div key={s.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                      <span className="font-semibold text-white text-xs block">{s.name}</span>
                      <span className="text-[10px] text-slate-400">Escopo #{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Create / Edit Drawer Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  {editingUserId ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">E-mail Institucional *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@empresa.com"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Login / Usuário</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="joao.silva"
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Empresa Cadastrada (Somente Empresa Cadastrada) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      Empresa Cadastrada (Vínculo Obrigatório) *
                    </label>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                      Somente Empresa Cadastrada
                    </span>
                  </div>
                  <select
                    required
                    value={formData.company_name}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const comp = companiesList.find(c => c.name === selectedName);
                      setFormData({
                        ...formData,
                        company_name: selectedName,
                        company_id: comp ? comp.id : ''
                      });
                    }}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    <option value="" disabled>-- Selecione uma empresa cadastrada --</option>
                    {companiesList.map(c => (
                      <option key={c.id} value={c.name}>
                        🏢 {c.name} {c.sla_plan ? `• Plano ${c.sla_plan}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Regra de acesso: Cada usuário é atrelado a uma empresa e só poderá visualizar e interagir com os equipamentos de sua empresa.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {editingUserId ? 'Nova Senha (opcional)' : 'Senha de Acesso'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUserId ? 'Manter senha atual' : '••••••••'}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Papel Global Principal</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Editor">Editor</option>
                      <option value="Operador">Operador</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                {/* Specific Scopes Selection */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="block text-slate-300 font-medium mb-2">
                    Permissões por Escopo Específico:
                  </span>
                  <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {scopes.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{s.name}:</span>
                        <select
                          value={formData.scopePermissions[s.id] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            scopePermissions: {
                              ...formData.scopePermissions,
                              [s.id]: e.target.value
                            }
                          })}
                          className="py-1 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <span>Tabelas `users`, `roles`, `scopes` e `user_permissions` sincronizadas no SQLite.</span>
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
