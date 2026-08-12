import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  CreditCard,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
  user: {
    id?: string;
    email: string;
    fullName?: string;
    role?: string;
  } | null;
  subscriptionStatus: 'active' | 'pending' | 'expired';
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  user,
  subscriptionStatus,
  onLogout,
}) => {
  const [entitlementInfo, setEntitlementInfo] = useState<{
    accessType?: string;
    grantedAt?: string;
    paymentId?: string;
  } | null>(null);

  useEffect(() => {
    async function loadEntitlement() {
      if (isSupabaseConfigured && user?.id) {
        try {
          const { data } = await supabase
            .from('access_entitlements')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setEntitlementInfo({
              accessType: data.access_type,
              grantedAt: data.granted_at,
              paymentId: data.payment_id,
            });
          }
        } catch (e) {
          console.error('Error fetching entitlement info:', e);
        }
      }
    }
    loadEntitlement();
  }, [user]);

  const isActive = subscriptionStatus === 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-teal-400" /> Perfil da Conta Clinora
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Informações do perfil, dados da clínica e status do seu acesso vitalício
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="profile-logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User details */}
        <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Dados do Usuário
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <User className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Nome Completo</p>
                <p className="text-sm font-bold text-white">{user?.fullName || 'Usuário Clinora'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <Mail className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">E-mail Cadastrado</p>
                <p className="text-sm font-bold text-white">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Perfil / Função</p>
                <p className="text-sm font-bold text-white capitalize">
                  {user?.role === 'super_admin' ? 'Super Administrador' : 'Administrador da Clínica'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Lifetime Entitlement Badge */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-3">
              Status do Acesso
            </h2>

            {isActive ? (
              <div className="bg-teal-950/60 border border-teal-500/40 p-4 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                    SISTEMA ATIVO
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">ACESSO VITALÍCIO</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Sua licença do Clinora Pro é vitalícia e não possui cobranças de mensalidade.
                  </p>
                </div>

                <div className="pt-2 border-t border-teal-500/20 text-[11px] text-slate-300 text-left space-y-1 font-mono">
                  <p>Modelo: <strong>Pagamento Único</strong></p>
                  <p>Valor: <strong>R$ 149,90</strong></p>
                  {entitlementInfo?.grantedAt && (
                    <p>
                      Ativação:{' '}
                      <strong>{new Date(entitlementInfo.grantedAt).toLocaleDateString('pt-BR')}</strong>
                    </p>
                  )}
                  {entitlementInfo?.paymentId && (
                    <p className="truncate">Ref MP: {entitlementInfo.paymentId}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-950/60 border border-amber-500/40 p-4 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    PAGAMENTO PENDENTE
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">Acesso Bloqueado</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Conclua o pagamento único de R$ 149,90 para liberar todos os módulos do Clinora.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('/assinatura')}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Gerenciar Assinatura (R$ 149,90)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
