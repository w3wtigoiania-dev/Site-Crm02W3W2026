import React, { useState } from 'react';
import { SystemSettings } from '../types.ts';
import { ShieldCheck, Lock, User, ArrowLeft, Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { W3WLogo } from './W3WLogo.tsx';

interface LoginViewProps {
  settings?: SystemSettings;
  onLoginSuccess: (user: any) => void;
  onOpenSite?: () => void;
  currentView?: 'frontend' | 'backend';
  onSwitchView?: (view: 'frontend' | 'backend') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenSite,
  onSwitchView
}) => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register form state ("ACRESCENTE A OPÇÃO DE CRIAR USUÁRIO")
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleReturnToSite = () => {
    if (onOpenSite) {
      onOpenSite();
    } else if (onSwitchView) {
      onSwitchView('frontend');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique usuário e senha.');
      }

      if (rememberMe) {
        localStorage.setItem('infra_session_token', data.token);
        localStorage.setItem('infra_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError('A confirmação da senha não confere com a senha digitada.');
      return;
    }

    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          company_name: regCompany.trim() || 'W3W Soluções em TI',
          role: 'Operador'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário.');
      }

      setSuccessMsg('Usuário criado com sucesso! Entrando no CRM...');
      localStorage.setItem('infra_session_token', data.token);
      localStorage.setItem('infra_user', JSON.stringify(data.user));

      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-between px-4 py-6 sm:py-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with return to institutional website (EXACT MATCH FOR IMAGEM 02) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-start relative z-20 pb-4">
        <button
          onClick={handleReturnToSite}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="Voltar ao Site Institucional"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-orange-400 group-hover:-translate-x-0.5 transition-all" />
          <span>Voltar ao Site Institucional</span>
        </button>
      </div>

      {/* Central Login / Register Card (EXACT MATCH FOR IMAGEM 02) */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <div className="bg-[#090f1d]/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Circular W3W Logo at Top of Card (EXACT MATCH FOR IMAGEM 02) */}
          <div className="w-16 h-16 rounded-full bg-[#181816] border border-orange-500/30 flex items-center justify-center mx-auto mb-4 p-2 shadow-[0_0_22px_rgba(243,131,19,0.3)]">
            <W3WLogo className="w-12 h-12" />
          </div>

          {/* Title & Subtitle (EXACT MATCH FOR IMAGEM 02) */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[26px] font-black text-white tracking-tight">
              {isRegistering ? 'Criar Novo Usuário' : 'Acesso ao CRM WhatsApp'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {isRegistering
                ? 'Cadastre suas credenciais para acesso corporativo'
                : 'W3W SOLUÇÕES TI • Goiânia e Região Metropolitana'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: LOGIN (CONFORME IMAGEM 02) */}
          {!isRegistering ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Campo 1: Usuário ou E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Informe seu usuário de acesso"
                    className="w-full pl-10 pr-4 py-3 bg-[#070b14] border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Campo 2: Senha de Acesso */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Informe sua senha"
                    className="w-full pl-10 pr-11 py-3 bg-[#070b14] border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Linha de Opções: Manter conectado / Ambiente Seguro RLS (EXACT MATCH FOR IMAGEM 02) */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Manter conectado</span>
                </label>
                <span className="text-slate-500 font-medium">Ambiente Seguro RLS</span>
              </div>

              {/* Botão de Ação Laranja (EXACT MATCH FOR IMAGEM 02) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Entrar no CRM WhatsApp</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORM: CRIAR NOVO USUÁRIO ("ACRESCENTE A OPÇÃO DE CRIAR USUÁRIO") */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: Carlos Henrique"
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usuário de Acesso *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Ex: SUPORTE-TI"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Empresa / Organização
                </label>
                <input
                  type="text"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  placeholder="W3W Soluções em TI"
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full pl-3 pr-8 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2.5 bg-[#070b14] border border-slate-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar e Entrar no CRM</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Separador e Segurança (EXACT MATCH FOR IMAGEM 02) */}
          <div className="border-t border-slate-800/80 pt-4 mt-5">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Row-Level Security (RLS)</span>
              <span>•</span>
              <span>LGPD Compliant</span>
            </div>
          </div>

          {/* Opção de Alternar entre Login e Criar Usuário (ACRESCENTADO CONFORME SOLICITADO) */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            {!isRegistering ? (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
              >
                Não possui acesso ao CRM?{' '}
                <span className="text-orange-400 font-bold underline">Criar Novo Usuário</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
              >
                Já possui acesso cadastrado?{' '}
                <span className="text-orange-400 font-bold underline">Voltar para o Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer simples de copyright */}
      <div className="w-full text-center text-[11px] text-slate-600 relative z-10 pt-4">
        © {new Date().getFullYear()} W3W Soluções em TI • Todos os direitos reservados
      </div>
    </div>
  );
};
