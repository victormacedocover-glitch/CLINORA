import React, { useState } from 'react';
import {
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
  Building2,
  Send,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearClinicIdCache, getActiveClinicId } from '../lib/supabaseServices';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  onLoginSuccess: (
    user: { id?: string; email: string; role: 'super_admin' | 'clinic_admin' },
    hasActiveSubscription: boolean
  ) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secure Password Reset Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryClinic, setRecoveryClinic] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearClinicIdCache();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);

    try {
      // 1. Explicit check for Super Admin
      const isSuperAdminEmail =
        cleanEmail === 'victorbeirigo@hotmail.com' ||
        cleanEmail === 'victorbeirigo76@gmail.com' ||
        cleanEmail === 'admin@clinora.com';

      if (isSuperAdminEmail) {
        if (password !== '834902' && password !== 'admin' && password !== 'admin123') {
          setError('Senha incorreta para a conta Administrador.');
          setLoading(false);
          return;
        }
        onLoginSuccess({ email: cleanEmail, role: 'super_admin' }, true);
        onNavigate('/dashboard');
        return;
      }

      // 2. Real Supabase Auth if configured
      if (isSupabaseConfigured) {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authErr) {
          setError(authErr.message || 'E-mail ou senha incorretos.');
          setLoading(false);
          return;
        }

        const userId = authData.user?.id;

        // Query entitlement & profile/clinic status from Supabase database
        let hasActiveSub = false;
        let userRole: 'super_admin' | 'clinic_admin' = 'clinic_admin';
        let userClinicId: string | undefined = undefined;
        let userClinicName: string | undefined = undefined;

        if (userId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role, clinic_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (profileData) {
            if (profileData.role) userRole = profileData.role as any;
            if (profileData.clinic_id) userClinicId = profileData.clinic_id;
          }

          const { data: entData } = await supabase
            .from('access_entitlements')
            .select('status, clinic_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!userClinicId && entData?.clinic_id) {
            userClinicId = entData.clinic_id;
          }

          // Check if blocked
          if (entData?.status === 'blocked') {
            setError('Seu acesso ao Clinora está temporariamente bloqueado. Entre em contato com o suporte.');
            setLoading(false);
            return;
          }

          if (userClinicId) {
            const { data: clinicData } = await supabase
              .from('clinics')
              .select('status, name')
              .eq('id', userClinicId)
              .maybeSingle();

            if (clinicData?.status === 'blocked') {
              setError('Seu acesso ao Clinora está temporariamente bloqueado. Entre em contato com o suporte.');
              setLoading(false);
              return;
            }
            if (clinicData?.name) {
              userClinicName = clinicData.name;
            }
          }

          if (entData && entData.status === 'active') {
            hasActiveSub = true;
          }

          if (!userClinicId) {
            userClinicId = (await getActiveClinicId()) || undefined;
          }
        }

        onLoginSuccess(
          {
            id: userId,
            email: cleanEmail,
            role: userRole,
            clinicId: userClinicId,
            clinicName: userClinicName,
          },
          hasActiveSub
        );

        if (hasActiveSub) {
          onNavigate('/dashboard');
        } else {
          onNavigate('/checkout');
        }
        return;
      }

      // 3. Fallback for local session check
      let registeredUsers: any[] = [];
      try {
        const stored = localStorage.getItem('clinora_registered_users');
        if (stored) registeredUsers = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }

      const registeredUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (registeredUser) {
        const hasActiveSub = registeredUser.hasActiveSubscription === true;
        onLoginSuccess(
          { id: registeredUser.id, email: cleanEmail, role: 'clinic_admin' },
          hasActiveSub
        );
        if (hasActiveSub) {
          onNavigate('/dashboard');
        } else {
          onNavigate('/checkout');
        }
        return;
      }

      // 4. Known demo account keywords
      const isValidUser =
        cleanEmail.includes('ativo') ||
        cleanEmail.includes('pro') ||
        (cleanEmail.includes('@') && cleanEmail.length > 5);

      if (!isValidUser || password.length < 3) {
        setError('Usuário não existente! E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      const hasActiveSub = cleanEmail.includes('ativo') || cleanEmail.includes('pro');

      onLoginSuccess({ email: cleanEmail, role: 'clinic_admin' }, hasActiveSub);

      if (hasActiveSub) {
        onNavigate('/dashboard');
      } else {
        onNavigate('/checkout');
      }
    } catch (err: any) {
      setError(err?.message || 'Usuário não existente! E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    const message = `Olá! Preciso de suporte para redefinir minha senha de acesso ao Clinora.\n\nE-mail da Clínica: ${recoveryEmail}\nNome da Clínica/Consultório: ${recoveryClinic || 'Não informado'}`;
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5511966129320?text=${encoded}`;
    
    window.open(whatsappUrl, '_blank');
    setRecoverySent(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setRecoveryEmail('');
    setRecoveryClinic('');
    setRecoverySent(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 group focus:outline-none cursor-pointer"
            id="login-logo-btn"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">CLINORA</span>
          </button>
        </div>

        <h2 className="text-center text-2xl font-bold text-white tracking-tight">
          Acesse a conta da sua clínica
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Informe suas credenciais para entrar no sistema
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-950 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@clinica.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="login-email-input"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-teal-400 hover:underline font-medium focus:outline-none cursor-pointer flex items-center gap-1"
                  id="forgot-password-link"
                >
                  <HelpCircle className="w-3 h-3" />
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 cursor-pointer"
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no Clinora
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Ainda não possui uma conta?{' '}
              <button
                onClick={() => onNavigate('/cadastro')}
                className="text-teal-400 hover:underline font-semibold cursor-pointer"
                id="login-register-link"
              >
                Cadastre sua clínica
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modal - Recuperação Segura de Senha & Suporte */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              id="close-forgot-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Redefinição Segura de Senha</h3>
                <p className="text-xs text-slate-400">Política de segurança e proteção LGPD</p>
              </div>
            </div>

            {!recoverySent ? (
              <div className="space-y-4 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Por motivos de segurança e verificação cadastral, o atendimento de redefinição de senha é realizado diretamente com nosso Suporte via WhatsApp (<strong className="text-emerald-400">(11) 96612-9320</strong>).
                </p>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 text-[11px]">
                  <p className="font-semibold text-teal-400">Como funciona o atendimento de suporte:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Preencha seu e-mail cadastrado abaixo.</li>
                    <li>Ao clicar no botão, uma conversa no WhatsApp será aberta diretamente com o administrador do sistema.</li>
                  </ul>
                </div>

                <form onSubmit={handleSupportRequest} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      E-mail Cadastrado da Clínica *
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seuemail@clinica.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome da Clínica / Consultório (opcional)
                    </label>
                    <input
                      type="text"
                      value={recoveryClinic}
                      onChange={(e) => setRecoveryClinic(e.target.value)}
                      placeholder="Ex: Clínica Odontológica Silva"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chamar no WhatsApp (11) 96612-9320
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Atendimento Iniciado no WhatsApp!</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    A janela do WhatsApp foi aberta para você enviar a mensagem ao Suporte no número <strong className="text-emerald-400">(11) 96612-9320</strong>. Responderemos o mais breve possível para ajudar com sua senha.
                  </p>
                </div>
                <button
                  onClick={closeForgotModal}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  Fechar e Voltar ao Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


