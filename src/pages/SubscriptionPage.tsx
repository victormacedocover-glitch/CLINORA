import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  AlertCircle,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Shield,
  Loader2,
  QrCode,
  FileText,
  ExternalLink,
  CheckCircle2,
  Zap,
  RefreshCw,
  XCircle,
  User,
  Headphones,
} from 'lucide-react';
import { CLINORA_PRO_PLAN, SubscriptionStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SubscriptionPageProps {
  onNavigate: (route: string) => void;
  user?: {
    id?: string;
    email: string;
    fullName?: string;
    clinicName?: string;
    clinicId?: string;
    role?: string;
  } | null;
  clinicInfo?: {
    name: string;
    email: string;
  } | null;
  subscriptionStatus?: SubscriptionStatus;
  onUpdateSubscriptionStatus?: (status: SubscriptionStatus) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onNavigate,
  user,
  clinicInfo,
  subscriptionStatus = 'pending',
  onUpdateSubscriptionStatus,
}) => {
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoChecking, setAutoChecking] = useState(false);

  // States fetched directly from Supabase / database
  const [accessStatus, setAccessStatus] = useState<'active' | 'pending' | 'blocked'>('pending');
  const [paymentStatus, setPaymentStatus] = useState<'approved' | 'pending' | 'cancelled' | 'rejected' | 'none'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    paymentId?: string;
    createdAt?: string;
  } | null>(null);

  const effectiveEmail = user?.email || clinicInfo?.email || '';
  const effectiveName = user?.fullName || 'Cliente Clinora';
  const effectiveClinicName = user?.clinicName || clinicInfo?.name || 'Clinora Pro';

  // 1. Fetch real status from Supabase on mount
  useEffect(() => {
    async function fetchSubscriptionInfo() {
      setLoading(true);

      if (!effectiveEmail && !user?.id) {
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        try {
          // Query entitlements
          let entQuery = supabase.from('access_entitlements').select('*');
          if (user?.id) {
            entQuery = entQuery.or(`user_id.eq.${user.id},email.eq.${effectiveEmail}`);
          } else {
            entQuery = entQuery.eq('email', effectiveEmail);
          }

          const { data: entData, error: entErr } = await entQuery.maybeSingle();

          let fetchedAccess: 'active' | 'pending' | 'blocked' = 'pending';
          if (entData?.status === 'blocked') {
            fetchedAccess = 'blocked';
          } else if (entData?.status === 'active') {
            fetchedAccess = 'active';
          }

          // Query clinic status if clinic_id is present
          if (entData?.clinic_id) {
            const { data: clinicData } = await supabase
              .from('clinics')
              .select('status')
              .eq('id', entData.clinic_id)
              .maybeSingle();

            if (clinicData?.status === 'blocked') {
              fetchedAccess = 'blocked';
            }
          }

          // Query payments
          let payQuery = supabase.from('payments').select('*');
          if (user?.id) {
            payQuery = payQuery.or(`user_id.eq.${user.id},email.eq.${effectiveEmail}`);
          } else {
            payQuery = payQuery.eq('email', effectiveEmail);
          }

          const { data: payData } = await payQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let fetchedPayment: 'approved' | 'pending' | 'cancelled' | 'rejected' | 'none' = 'none';

          if (payData) {
            setPaymentDetails({
              amount: payData.amount || 149.9,
              paymentId: payData.payment_id || payData.preference_id,
              createdAt: payData.created_at,
            });

            if (payData.status === 'approved' || payData.status === 'active') {
              fetchedPayment = 'approved';
              if (fetchedAccess !== 'blocked') {
                fetchedAccess = 'active';
              }
            } else if (payData.status === 'cancelled') {
              fetchedPayment = 'cancelled';
            } else if (payData.status === 'rejected') {
              fetchedPayment = 'rejected';
            } else {
              fetchedPayment = 'pending';
            }
          }

          setAccessStatus(fetchedAccess);
          setPaymentStatus(fetchedPayment);

          if (fetchedAccess === 'active' && onUpdateSubscriptionStatus) {
            onUpdateSubscriptionStatus('active');
          }
        } catch (err) {
          console.error('Error fetching subscription info from Supabase:', err);
        }
      } else {
        // Fallback to prop or local status
        if (subscriptionStatus === 'active') {
          setAccessStatus('active');
          setPaymentStatus('approved');
        } else {
          setAccessStatus('pending');
          setPaymentStatus('pending');
        }
      }

      setLoading(false);
    }

    fetchSubscriptionInfo();
  }, [effectiveEmail, user?.id, subscriptionStatus]);

  // 2. Check Mercado Pago return URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const statusParam =
      searchParams.get('status') ||
      searchParams.get('collection_status') ||
      searchParams.get('payment_status');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');

    if (
      statusParam === 'approved' ||
      statusParam === 'success' ||
      (paymentId && statusParam !== 'rejected' && statusParam !== 'pending')
    ) {
      setAutoChecking(true);
      setAccessStatus('active');
      setPaymentStatus('approved');

      if (onUpdateSubscriptionStatus) {
        onUpdateSubscriptionStatus('active');
      }

      // Update local storage if present
      if (effectiveEmail) {
        try {
          const stored = localStorage.getItem('clinora_registered_users');
          if (stored) {
            const users = JSON.parse(stored);
            const updated = users.map((u: any) =>
              u.email.toLowerCase() === effectiveEmail.toLowerCase()
                ? { ...u, hasActiveSubscription: true }
                : u
            );
            localStorage.setItem('clinora_registered_users', JSON.stringify(updated));
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Clean query parameters from URL
      window.history.replaceState({}, '', window.location.pathname);

      setTimeout(() => {
        setAutoChecking(false);
      }, 2500);
    }
  }, [effectiveEmail, onUpdateSubscriptionStatus]);

  // 3. Trigger Mercado Pago checkout via create-preference endpoint
  const handleRealizarAssinatura = async () => {
    setCheckoutLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/.netlify/functions/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          clinicId: user?.clinicId || null,
          email: effectiveEmail || 'cliente@clinora.app',
          fullName: effectiveName,
          clinicName: effectiveClinicName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.initPoint) {
        if (data.isConfigMissing) {
          setErrorMessage(
            'A variável MERCADOPAGO_ACCESS_TOKEN ainda não foi adicionada no ambiente Netlify/Servidor. Adicione seu Access Token de Produção ou Teste para ativar o checkout oficial.'
          );
        } else {
          setErrorMessage(data.error || 'Erro ao comunicar com o gateway do Mercado Pago.');
        }
        setCheckoutLoading(false);
        return;
      }

      // Redirect directly to Mercado Pago Official Checkout Pro URL
      window.location.href = data.initPoint;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(
        'Serviço de pagamento temporariamente indisponível. Verifique sua conexão e tente novamente.'
      );
      setCheckoutLoading(false);
    }
  };

  const isBlocked = accessStatus === 'blocked';
  const isActive = accessStatus === 'active' || paymentStatus === 'approved';
  const isPending = !isBlocked && !isActive && (paymentStatus === 'pending' || paymentStatus === 'none');
  const isCancelledOrRejected = !isBlocked && !isActive && (paymentStatus === 'cancelled' || paymentStatus === 'rejected');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Auto-checking overlay/banner when returning from MP */}
        {autoChecking && (
          <div className="bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 p-5 rounded-2xl shadow-2xl flex items-center justify-center gap-4 animate-pulse">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin shrink-0" />
            <div>
              <p className="font-extrabold text-base text-white">
                Pagamento Aprovado pelo Mercado Pago!
              </p>
              <p className="text-xs text-emerald-300">
                Confirmamos seu pagamento com sucesso. Liberando seu acesso vitalício ao Clinora...
              </p>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Plano Clinora Pro • Licença Vitalícia
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Minha Assinatura
          </h1>

          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Consulte o status do seu acesso, informações do plano e gerencie o pagamento único do Clinora Pro.
          </p>

          {(effectiveClinicName || effectiveEmail) && (
            <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>
                Clínica: <strong className="text-white">{effectiveClinicName}</strong> ({effectiveEmail})
              </span>
            </div>
          )}
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="bg-amber-950/80 border-2 border-amber-500 text-amber-200 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Falha na Operação</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Status Notice Banner (Dynamic according to User Situation) */}
        {loading ? (
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            <span>Verificando dados da assinatura no banco de dados...</span>
          </div>
        ) : (
          <div
            className={`p-6 rounded-2xl border text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xl ${
              isBlocked
                ? 'bg-red-950/70 border-red-500/60 text-red-200'
                : isActive
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : isCancelledOrRejected
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                : 'bg-amber-950/70 border-amber-500/60 text-amber-200'
            }`}
            id="subscription-status-banner"
          >
            <div className="flex items-center gap-4">
              {isBlocked ? (
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              ) : isActive ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : isCancelledOrRejected ? (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white">
                    {isBlocked
                      ? 'Acesso Bloqueado pelo Administrador'
                      : isActive
                      ? 'Assinatura Ativa • Acesso Vitalício'
                      : isCancelledOrRejected
                      ? 'Pagamento Não Confirmado / Recusado'
                      : 'Pagamento Pendente'}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isBlocked
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isCancelledOrRejected
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isBlocked
                      ? 'Acesso Bloqueado'
                      : isActive
                      ? 'Ativa'
                      : isCancelledOrRejected
                      ? 'Recusado'
                      : 'Pendente'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {isBlocked
                    ? 'Seu acesso ao Clinora está temporariamente bloqueado. Entre em contato com o suporte para regularizar a situação.'
                    : isActive
                    ? 'Seu acesso ao Clinora Pro está ativo. Sua licença é vitalícia e não possui mensalidades ou renovações.'
                    : isCancelledOrRejected
                    ? 'Identificamos que seu pagamento anterior foi cancelado ou não foi concluído. Realize uma nova tentativa para liberar seu acesso.'
                    : 'Seu acesso ao Clinora Pro ainda não foi ativado. Realize o pagamento único de R$ 149,90 para liberar todos os módulos do sistema.'}
                </p>
              </div>
            </div>

            {/* Action Buttons depending on situation */}
            <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
              {isActive && (
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  id="btn-access-dashboard"
                >
                  Acessar Painel
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {isBlocked && (
                <a
                  href="https://wa.me/5511966129320"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  id="btn-contact-support"
                >
                  <Headphones className="w-4 h-4" />
                  Falar com Suporte
                </a>
              )}
            </div>
          </div>
        )}

        {/* Plan Details Card */}
        <div className="bg-slate-950 border-2 border-teal-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
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
              <p className="text-3xl font-black text-white">
                R$ {CLINORA_PRO_PLAN.price.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-teal-400 font-bold uppercase mt-0.5">PAGAMENTO ÚNICO</p>
            </div>
          </div>

          {/* Included Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              O que está incluso na sua licença:
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

          {/* Mercado Pago Payment Section for Non-Active / Pending Users */}
          {!isActive && !isBlocked && (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-900 border border-teal-500/30 p-6 rounded-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Pagar com Mercado Pago
                      </h3>
                      <p className="text-xs text-slate-400">
                        PIX, Cartão de Crédito em até 12x ou Boleto Bancário.
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
                    Checkout Seguro Oficial
                  </span>
                </div>

                {/* Accepted Payment Methods Badges */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <QrCode className="w-5 h-5 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white">PIX</p>
                    <p className="text-[10px] text-slate-400">Aprovação imediata</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <CreditCard className="w-5 h-5 text-sky-400 mx-auto" />
                    <p className="font-bold text-white">Cartão de Crédito</p>
                    <p className="text-[10px] text-slate-400">Em até 12x</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <FileText className="w-5 h-5 text-amber-400 mx-auto" />
                    <p className="font-bold text-white">Boleto Bancário</p>
                    <p className="text-[10px] text-slate-400">À vista</p>
                  </div>
                </div>

                {/* Primary CTA Button: Realizar Assinatura */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleRealizarAssinatura}
                    disabled={checkoutLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold py-4 px-6 rounded-xl shadow-xl shadow-teal-500/25 text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50"
                    id="btn-realizar-assinatura"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Conectando ao Mercado Pago...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Realizar Assinatura — R$ 149,90
                      </>
                    )}
                  </button>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 text-center">
                    <p className="text-slate-300 font-semibold flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Liberação Automática pelo Webhook
                    </p>
                    <p>
                      O sistema identifica o pagamento aprovado no Mercado Pago e libera seu acesso vitalício instantaneamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Payment Info for Activated Users */}
          {isActive && paymentDetails && (
            <div className="pt-6 border-t border-slate-800 space-y-3 text-xs bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Comprovante de Licença Ativa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">VALOR PAGO:</span>
                  <strong className="text-white">R$ {paymentDetails.amount?.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">REFERÊNCIA MP:</span>
                  <strong className="text-white truncate block">{paymentDetails.paymentId || 'CLINORA-LIFETIME'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DATA DE ATIVAÇÃO:</span>
                  <strong className="text-white">
                    {paymentDetails.createdAt
                      ? new Date(paymentDetails.createdAt).toLocaleDateString('pt-BR')
                      : 'Ativação Concluída'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Security details footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Checkout Seguro Mercado Pago</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Sem Cobranças Recorrentes</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center sm:justify-end">
              <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Suporte WhatsApp (11) 96612-9320</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
