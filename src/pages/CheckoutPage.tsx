import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  FileText,
  Loader2,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CLINORA_PRO_PLAN } from '../types';

interface CheckoutPageProps {
  onNavigate: (route: string) => void;
  user?: {
    id?: string;
    email: string;
    fullName?: string;
    clinicName?: string;
    clinicId?: string;
  } | null;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, user }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreatePreference = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/.netlify/functions/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          clinicId: user?.clinicId,
          email: user?.email || 'cliente@clinora.app',
          fullName: user?.fullName || 'Cliente Clinora',
          clinicName: user?.clinicName || 'Clinora Pro',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.initPoint) {
        if (data.isConfigMissing) {
          setErrorMessage(
            'A variável MERCADOPAGO_ACCESS_TOKEN ainda não foi adicionada no ambiente Netlify/Servidor. Adicione seu Access Token de Produção ou Teste nas configurações do Netlify para ativar o checkout oficial.'
          );
        } else {
          setErrorMessage(data.error || 'Erro ao comunicar com o gateway Mercado Pago.');
        }
        setLoading(false);
        return;
      }

      // Redirect directly to Mercado Pago Official Checkout Pro URL
      window.location.href = data.initPoint;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(
        'Serviço de pagamento temporariamente indisponível. Verifique as credenciais do Mercado Pago ou sua conexão.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Licença Definitiva • Pagamento Único
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Checkout Oficial Clinora Pro
          </h1>

          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Adquira acesso vitalício completo ao Clinora por R$ 149,90 em até 12x no Cartão, Pix ou Boleto via Mercado Pago.
          </p>

          {user && (
            <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>
                Conta: <strong className="text-white">{user.fullName || user.email}</strong> {user.clinicName && `(${user.clinicName})`}
              </span>
            </div>
          )}
        </div>

        {/* Error Alert if Mercado Pago environment token is missing or API errors */}
        {errorMessage && (
          <div className="bg-amber-950/80 border-2 border-amber-500 text-amber-200 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Configuração de Pagamento Requerida</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
            <div className="pt-2 text-[11px] text-amber-400/90 font-mono">
              Variável de Ambiente Exigida: MERCADOPAGO_ACCESS_TOKEN
            </div>
          </div>
        )}

        {/* Main Product Card */}
        <div className="bg-slate-950 border-2 border-teal-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold text-white">{CLINORA_PRO_PLAN.name}</h2>
                <span className="text-[10px] font-extrabold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  Acesso Vitalício
                </span>
              </div>
              <p className="text-xs text-slate-400">{CLINORA_PRO_PLAN.description}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-3xl font-black text-white">
                R$ {CLINORA_PRO_PLAN.price.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-xs text-teal-400 font-bold uppercase mt-0.5">PAGAMENTO ÚNICO</p>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Benefícios e Recursos Inclusos:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINORA_PRO_PLAN.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateways / Accepted Methods */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Formas de Pagamento no Mercado Pago:
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <QrCode className="w-6 h-6 text-teal-400 mx-auto" />
                <p className="font-bold text-white">PIX</p>
                <p className="text-[10px] text-slate-400">Aprovação Imediata</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <CreditCard className="w-6 h-6 text-sky-400 mx-auto" />
                <p className="font-bold text-white">Cartão de Crédito</p>
                <p className="text-[10px] text-slate-400">Em até 12x</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <FileText className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="font-bold text-white">Boleto</p>
                <p className="text-[10px] text-slate-400">À Vista</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreatePreference}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-teal-500/25 text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50"
              id="checkout-pay-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando ao Mercado Pago...
                </>
              ) : (
                <>
                  Continuar para Pagamento no Mercado Pago (R$ 149,90)
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                Gateway Criptografado SSL
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Sem Renovação Automática
              </span>
            </div>
          </div>
        </div>

        {/* Security guarantee footer */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>O acesso vitalício é liberado automaticamente após confirmação via Webhook do Mercado Pago.</p>
          <p className="text-slate-500">Dúvidas? Entre em contato com o suporte em (11) 96612-9320.</p>
        </div>
      </div>
    </div>
  );
};
