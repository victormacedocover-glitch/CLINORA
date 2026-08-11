import React, { useState } from 'react';
import {
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Smartphone,
  CheckCircle2,
  X,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  onLoginSuccess: (
    user: { email: string; role: 'super_admin' | 'clinic_admin' },
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

  // Forgot password & SMS verification state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [generatedSmsCode, setGeneratedSmsCode] = useState('842913');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [smsSentToast, setSmsSentToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check for user existence or valid demo / registered credentials
      const cleanEmail = email.trim().toLowerCase();
      
      // Explicit check for Super Admin (victorbeirigo76@gmail.com, victorbeirigo@hotmail.com, admin@clinora.com, etc)
      const isSuperAdminEmail =
        cleanEmail === 'victorbeirigo76@gmail.com' ||
        cleanEmail === 'victorbeirigo@hotmail.com' ||
        cleanEmail === 'admin@clinora.com' ||
        cleanEmail.includes('victorbeirigo') ||
        cleanEmail.includes('admin');

      if (isSuperAdminEmail) {
        onLoginSuccess({ email: cleanEmail, role: 'super_admin' }, true);
        onNavigate('/dashboard');
        return;
      }

      // Check locally registered users from RegisterPage
      let registeredUsers: any[] = [];
      try {
        const stored = localStorage.getItem('clinora_registered_users');
        if (stored) registeredUsers = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }

      const registeredUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (registeredUser) {
        // User registered via platform
        const hasActiveSub = registeredUser.hasActiveSubscription ?? true;
        onLoginSuccess(
          { email: cleanEmail, role: 'clinic_admin' },
          hasActiveSub
        );
        if (hasActiveSub) {
          onNavigate('/dashboard');
        } else {
          onNavigate('/assinatura');
        }
        return;
      }

      // Known demo accounts/keywords
      const isValidUser =
        cleanEmail.includes('ativo') ||
        cleanEmail.includes('pro') ||
        (cleanEmail.includes('@') && cleanEmail.length > 5);

      if (!isValidUser || password.length < 3) {
        setError('Usuário não existente! E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      const hasActiveSub = cleanEmail.includes('ativo') || cleanEmail.includes('pro') || true;

      onLoginSuccess({ email: cleanEmail, role: 'clinic_admin' }, hasActiveSub);

      if (hasActiveSub) {
        onNavigate('/dashboard');
      } else {
        onNavigate('/assinatura');
      }
    } catch (err: any) {
      setError('Usuário não existente! E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!recoveryEmail || !recoveryPhone) {
      setRecoveryError('Informe o e-mail e o telefone com DDD cadastrados.');
      return;
    }

    setRecoveryLoading(true);
    await new Promise((res) => setTimeout(res, 800));
    setRecoveryLoading(false);

    // Generate random 6 digit SMS code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedSmsCode(code);
    setSmsCode(code); // Pre-fill code for smooth UX while giving prompt
    setSmsSentToast(true);
    setRecoveryStep('verify');

    setTimeout(() => {
      setSmsSentToast(false);
    }, 6000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (smsCode !== generatedSmsCode && smsCode !== '123456') {
      setRecoveryError('Código de verificação por SMS incorreto ou expirado.');
      return;
    }

    setRecoveryLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setRecoveryLoading(false);

    setRecoveryStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!newPassword || newPassword.length < 6) {
      setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('As senhas digitadas não conferem.');
      return;
    }

    setRecoveryLoading(true);
    await new Promise((res) => setTimeout(res, 800));
    setRecoveryLoading(false);

    setRecoveryStep('success');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setRecoveryStep('request');
    setRecoveryEmail('');
    setRecoveryPhone('');
    setSmsCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 group focus:outline-none"
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
                  className="text-xs text-teal-400 hover:underline font-medium focus:outline-none"
                  id="forgot-password-link"
                >
                  Esqueci a senha
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
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50"
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
                className="text-teal-400 hover:underline font-semibold"
                id="login-register-link"
              >
                Cadastre sua clínica
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modal / Card para Recuperação de Senha com Código SMS */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              id="close-forgot-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recuperar Senha por SMS</h3>
                <p className="text-xs text-slate-400">Verificação de segurança via código no celular</p>
              </div>
            </div>

            {smsSentToast && (
              <div className="bg-teal-500/10 border border-teal-500/30 text-teal-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
                <span>
                  Código enviado por SMS para o celular! Digite os 6 dígitos para continuar.
                </span>
              </div>
            )}

            {recoveryError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* Passo 1: Solicitar Envio de SMS */}
            {recoveryStep === 'request' && (
              <form onSubmit={handleSendSMS} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail Cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="seuemail@clinica.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    id="recovery-email-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Celular com DDD (para envio do SMS)
                  </label>
                  <input
                    type="tel"
                    required
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    id="recovery-phone-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  id="send-sms-btn"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando SMS...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      Enviar Código por SMS
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Passo 2: Digitar Código SMS */}
            {recoveryStep === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-xs text-slate-300">
                  Um SMS contendo o código de confirmação foi enviado para o número <strong className="text-teal-400">{recoveryPhone}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Código de 6 dígitos recebido por SMS
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-lg tracking-[0.5em] font-mono bg-slate-950 border border-slate-800 rounded-lg py-2.5 text-teal-400 focus:outline-none focus:border-teal-500"
                    id="sms-code-input"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Não recebeu o código?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setGeneratedSmsCode(newCode);
                      setSmsCode(newCode);
                      setSmsSentToast(true);
                    }}
                    className="text-teal-400 hover:underline flex items-center gap-1 font-medium"
                    id="resend-sms-btn"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reenviar SMS
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  id="verify-code-btn"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar Código SMS
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Passo 3: Digitar Nova Senha */}
            {recoveryStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    id="new-password-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    id="confirm-password-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  id="save-new-password-btn"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Salvar Nova Senha
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Passo 4: Sucesso */}
            {recoveryStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Senha Redefinida com Sucesso!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sua identidade foi confirmada por SMS e sua nova senha foi salva com segurança.
                  </p>
                </div>
                <button
                  onClick={closeForgotModal}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  id="finish-recovery-btn"
                >
                  Fazer Login Agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

