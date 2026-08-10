import React, { useState } from 'react';
import {
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
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

      // Check if super_admin or standard user demo credentials for Stage 1 navigation
      const isSuperAdmin = email.toLowerCase().includes('admin');
      const role = isSuperAdmin ? 'super_admin' : 'clinic_admin';
      const hasActiveSub = email.toLowerCase().includes('ativo') || email.toLowerCase().includes('pro');

      onLoginSuccess({ email, role }, hasActiveSub);

      if (isSuperAdmin) {
        onNavigate('/admin');
      } else if (hasActiveSub) {
        onNavigate('/dashboard');
      } else {
        onNavigate('/assinatura');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
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
    </div>
  );
};
