import React, { useState } from 'react';
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface RegisterPageProps {
  onNavigate: (route: string) => void;
  onRegisterSuccess: (userData: {
    fullName: string;
    email: string;
    clinicName: string;
    clinicPhone: string;
    id?: string;
  }) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName || !cleanEmail || !password || !clinicName || !clinicPhone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setLoading(true);

    try {
      let createdUserId: string | undefined = undefined;
      let createdClinicId: string | undefined = undefined;

      if (isSupabaseConfigured) {
        // 1. Real Supabase Auth SignUp
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName,
              clinic_name: clinicName,
              clinic_phone: clinicPhone,
            },
          },
        });

        if (authErr) {
          throw authErr;
        }

        createdUserId = authData.user?.id;

        // Ensure session is authenticated for RPC call
        if (!authData.session && createdUserId) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });
            if (signInData.user) {
              createdUserId = signInData.user.id;
            }
          } catch (sErr) {
            console.warn('Auto sign-in during registration fallback:', sErr);
          }
        }

        // 2. Call backend service role to reliably provision clinic, profile and access entitlement
        try {
          const apiInitRes = await fetch('/api/admin-user-management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_initial_account',
              userId: createdUserId,
              email: cleanEmail,
              fullName,
              clinicName,
              phone: clinicPhone,
            }),
          });
          if (apiInitRes.ok) {
            const apiInitData = await apiInitRes.json();
            if (apiInitData.clinicId) {
              createdClinicId = apiInitData.clinicId;
            }
          }
        } catch (apiErr) {
          console.warn('Backend serverless account provisioning fallback error:', apiErr);
        }

        // 3. Call RPC create_initial_clinic as client-side fallback if not already created
        if (!createdClinicId) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('create_initial_clinic', {
              p_name: clinicName,
              p_phone: clinicPhone,
              p_email: cleanEmail,
              p_full_name: fullName,
            });

            if (rpcErr) {
              console.error('Erro na RPC create_initial_clinic:', rpcErr);
            } else {
              createdClinicId = typeof rpcData === 'string' ? rpcData : rpcData?.id || rpcData?.clinic_id || undefined;
            }
          } catch (rpcExecErr) {
            console.error('Exceção ao chamar create_initial_clinic:', rpcExecErr);
          }
        }

        // 4. Direct fallback creation if still not created
        if (createdUserId && !createdClinicId) {
          try {
            const { data: newClinic } = await supabase
              .from('clinics')
              .insert({
                name: clinicName,
                phone: clinicPhone,
                email: cleanEmail,
                status: 'active',
              })
              .select('id')
              .single();

            if (newClinic?.id) {
              createdClinicId = newClinic.id;

              await supabase.from('profiles').upsert(
                {
                  user_id: createdUserId,
                  clinic_id: createdClinicId,
                  full_name: fullName,
                  email: cleanEmail,
                  role: 'clinic_admin',
                },
                { onConflict: 'user_id' }
              );
            }
          } catch (fErr) {
            console.error('Fallback clinic creation error:', fErr);
          }
        }

        // 5. Create initial access entitlement with status 'pending'
        if (createdUserId) {
          try {
            await supabase.from('access_entitlements').upsert(
              {
                user_id: createdUserId,
                clinic_id: createdClinicId || null,
                status: 'pending',
                access_type: 'lifetime',
              },
              { onConflict: 'user_id' }
            );
          } catch (e) {
            console.error('Error inserting pending entitlement:', e);
          }
        }
      }

      // Save to local storage for offline / quick fallback session
      try {
        const stored = localStorage.getItem('clinora_registered_users');
        const existing: any[] = stored ? JSON.parse(stored) : [];
        const newUser = {
          id: createdUserId,
          fullName,
          email: cleanEmail,
          clinicName,
          clinicPhone,
          hasActiveSubscription: false,
          createdAt: new Date().toISOString(),
        };
        const updated = [...existing.filter((u) => u.email.toLowerCase() !== cleanEmail), newUser];
        localStorage.setItem('clinora_registered_users', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving registered user locally:', err);
      }

      onRegisterSuccess({
        fullName,
        email: cleanEmail,
        clinicName,
        clinicPhone,
        id: createdUserId,
        clinicId: createdClinicId,
      });

      // Redirect immediately to checkout for payment
      onNavigate('/checkout');
    } catch (err: any) {
      setError(err?.message || 'Erro ao realizar cadastro. Tente novamente.');
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
            id="register-logo-btn"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">CLINORA</span>
          </button>
        </div>

        <h2 className="text-center text-2xl font-bold text-white tracking-tight">
          Crie a conta da sua clínica
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Preencha os dados abaixo para iniciar seu cadastro no Clinora Pro
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

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Como funciona o cadastro?</p>
              <p className="text-[11px] text-slate-400">
                O cadastro cria a conta da sua clínica com status <code className="text-teal-300 bg-teal-500/10 px-1 py-0.5 rounded">pending</code>. Em seguida, você será direcionado para ativar o plano <strong className="text-white">Clinora Pro</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dra. Juliana Silva"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-fullname-input"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail Profissional *
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
                  placeholder="juliana@clinicasilva.com.br"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-email-input"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-password-input"
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-confirmpassword-input"
                />
              </div>
            </div>

            {/* Nome da Clínica */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Clínica ou Consultório *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Clínica Odontológica Silva & Estética"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-clinicname-input"
                />
              </div>
            </div>

            {/* Telefone da Clínica */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefone / WhatsApp da Clínica *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  id="register-phone-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50"
              id="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar Conta e Ir para Assinatura
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Já tem uma conta?{' '}
              <button
                onClick={() => onNavigate('/login')}
                className="text-teal-400 hover:underline font-semibold"
                id="register-login-link"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
