import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  AlertCircle,
  CreditCard,
  Lock,
  Zap,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { CLINORA_PRO_PLAN, SubscriptionStatus } from '../types';

interface SubscriptionPageProps {
  onNavigate: (route: string) => void;
  clinicInfo?: {
    name: string;
    email: string;
  } | null;
  subscriptionStatus?: SubscriptionStatus;
  onUpdateSubscriptionStatus?: (status: SubscriptionStatus) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onNavigate,
  clinicInfo,
  subscriptionStatus = 'pending',
  onUpdateSubscriptionStatus,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isActive = subscriptionStatus === 'active';

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage(null);

    // Update subscription status in app state
    if (onUpdateSubscriptionStatus) {
      onUpdateSubscriptionStatus('active');
    }

    // Update in registered users if exists
    if (clinicInfo?.email) {
      try {
        const stored = localStorage.getItem('clinora_registered_users');
        if (stored) {
          const users = JSON.parse(stored);
          const updated = users.map((u: any) =>
            u.email.toLowerCase() === clinicInfo.email.toLowerCase()
              ? { ...u, hasActiveSubscription: true }
              : u
          );
          localStorage.setItem('clinora_registered_users', JSON.stringify(updated));
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      // Call Netlify Function create-subscription
      const res = await fetch('/.netlify/functions/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinicInfo?.name || 'clinic_demo_1',
          email: clinicInfo?.email || 'admin@clinica.com',
          fullName: 'Dr. Clinora',
          clinicName: clinicInfo?.name || 'Clínica Odontológica',
        }),
      });

      const data = await res.json();

      if (data.initPoint) {
        setMessage('Redirecionando para o checkout seguro do Mercado Pago...');
        window.location.href = data.initPoint;
      } else {
        setMessage('Assinatura ativada com sucesso! Você já tem acesso total ao Clinora Pro.');
        setTimeout(() => {
          onNavigate('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setMessage('Plano ativado no sistema! Redirecionando para o seu Painel...');
      setTimeout(() => {
        onNavigate('/dashboard');
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Ativação do Plano
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Assinatura Clinora Pro
          </h1>

          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Para liberar o acesso ao sistema e começar a gerenciar sua clínica, ative sua assinatura mensal.
          </p>

          {clinicInfo && (
            <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>
                Clínica: <strong className="text-white">{clinicInfo.name}</strong> ({clinicInfo.email})
              </span>
            </div>
          )}
        </div>

        {/* Status Notice Banner (#9) */}
        <div
          className={`p-4 rounded-2xl border text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
            isActive
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          }`}
          id="subscription-status-banner"
        >
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="font-bold text-base text-white">
                {isActive ? 'Sua assinatura está ativa.' : 'Sua assinatura ainda não está ativa.'}
              </p>
              <p className="text-xs text-slate-300">
                {isActive
                  ? 'Você tem acesso ilimitado a todas as funcionalidades do Clinora Pro.'
                  : 'Sua conta foi criada com sucesso, mas o acesso ao sistema requer a assinatura ativa.'}
              </p>
            </div>
          </div>

          {isActive ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-emerald-500/20"
              id="goto-dashboard-btn"
            >
              Acessar Painel
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              Aguardando pagamento
            </span>
          )}
        </div>

        {/* Plan Details Card */}
        <div className="bg-slate-950 border-2 border-teal-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold text-white">{CLINORA_PRO_PLAN.name}</h2>
                <span className="text-[10px] font-extrabold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  Plano Único
                </span>
              </div>
              <p className="text-xs text-slate-400">{CLINORA_PRO_PLAN.description}</p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-black text-white">
                R$ {CLINORA_PRO_PLAN.price.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-400">por mês (cobrança recorrente)</p>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              O que está incluído na sua assinatura PRO:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINORA_PRO_PLAN.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notice & Subscribe Action */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            {message && (
              <div className="bg-slate-900 border border-teal-500/30 p-3 rounded-xl text-xs text-teal-300">
                {message}
              </div>
            )}

            {!isActive ? (
              <div className="space-y-3">
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-teal-500/25 transition-all text-sm flex items-center justify-center gap-2"
                  id="subscribe-pro-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando checkout Mercado Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Assinar Clinora Pro (R$ 149,90/mês)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-300 text-center space-y-1">
                  <p className="font-bold">Sua assinatura Clinora Pro está ativa!</p>
                  <p className="text-slate-300">Você já pode utilizar todos os recursos do sistema.</p>
                </div>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  id="dashboard-access-btn"
                >
                  Ir para o Dashboard da Clínica
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Payment security info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Processamento Mercado Pago</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Sem contrato de fidelidade</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Cancelamento a qualquer momento</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
