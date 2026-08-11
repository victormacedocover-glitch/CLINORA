import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [clinics, setClinics] = useState([
    {
      id: '1',
      name: 'Clínica Odontológica Silva',
      owner: 'Dra. Juliana Silva',
      email: 'juliana@clinicasilva.com.br',
      phone: '(11) 99999-8888',
      status: 'active',
      subscriptionStatus: 'active',
      plan: 'Clinora Pro',
      amount: 149.9,
      createdAt: '2026-08-01',
    },
    {
      id: '2',
      name: 'Estética Avançada Belle',
      owner: 'Dra. Patricia Lima',
      email: 'contato@belleestetica.com',
      phone: '(21) 98888-7777',
      status: 'active',
      subscriptionStatus: 'pending',
      plan: 'Clinora Pro',
      amount: 149.9,
      createdAt: '2026-08-08',
    },
    {
      id: '3',
      name: 'Consultório Dr. Roberto',
      owner: 'Dr. Roberto Santos',
      email: 'roberto@consultorio.med.br',
      phone: '(31) 97777-6666',
      status: 'blocked',
      subscriptionStatus: 'cancelled',
      plan: 'Clinora Pro',
      amount: 149.9,
      createdAt: '2026-07-15',
    },
  ]);

  const toggleClinicStatus = (id: string) => {
    setClinics(
      clinics.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'blocked' ? 'active' : 'blocked';
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const grantManualAccess = (id: string) => {
    setClinics(
      clinics.map((c) => {
        if (c.id === id) {
          return { ...c, subscriptionStatus: 'active', status: 'active' };
        }
        return c;
      })
    );
  };

  const totalClinics = clinics.length;
  const activeClinics = clinics.filter((c) => c.status === 'active').length;
  const pendingClinics = clinics.filter((c) => c.subscriptionStatus === 'pending').length;
  const activeSubscriptions = clinics.filter((c) => c.subscriptionStatus === 'active').length;
  const cancelledSubscriptions = clinics.filter((c) => c.subscriptionStatus === 'cancelled').length;
  const estimatedMrr = activeSubscriptions * 149.9;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-purple-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Painel Super Admin</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SaaS Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão global de clínicas, assinaturas e faturamento recorrente (MRR).
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Site
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Total de Clínicas</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalClinics}</p>
          <p className="text-[11px] text-slate-400">
            {activeClinics} ativas | {pendingClinics} pendentes
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Assinaturas Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{activeSubscriptions}</p>
          <p className="text-[11px] text-slate-400">{cancelledSubscriptions} canceladas</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Faturamento Licenças</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">
            R$ {estimatedMrr.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[11px] text-teal-400">R$ 149,90 por licença vitalícia</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Usuários Registrados</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalClinics * 2}</p>
          <p className="text-[11px] text-slate-400">Médios por clínica</p>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Lista de Clínicas do Clinora
          </h2>
          <span className="text-xs text-slate-400">
            Ações administrativas de suporte e bloqueio
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Clínica / Responsável</th>
                <th className="p-3">Contato</th>
                <th className="p-3">Status Clínica</th>
                <th className="p-3">Assinatura</th>
                <th className="p-3">Data Cadastro</th>
                <th className="p-3 rounded-r-lg text-right">Ações de Suporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-medium">
                    <p className="font-bold text-white text-sm">{clinic.name}</p>
                    <p className="text-slate-400 text-[11px]">{clinic.owner}</p>
                  </td>
                  <td className="p-3">
                    <p>{clinic.email}</p>
                    <p className="text-slate-400 text-[11px]">{clinic.phone}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                        clinic.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {clinic.status === 'active' ? 'Ativa' : 'Bloqueada'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                        clinic.subscriptionStatus === 'active'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                          : clinic.subscriptionStatus === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {clinic.subscriptionStatus}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono">{clinic.createdAt}</td>
                  <td className="p-3 text-right space-x-2">
                    {clinic.subscriptionStatus !== 'active' && (
                      <button
                        onClick={() => grantManualAccess(clinic.id)}
                        className="bg-teal-600/80 hover:bg-teal-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                        title="Liberar Acesso Manual Suporte"
                      >
                        Liberar Acesso
                      </button>
                    )}
                    <button
                      onClick={() => toggleClinicStatus(clinic.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1 ${
                        clinic.status === 'blocked'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-red-600/80 hover:bg-red-500 text-white'
                      }`}
                    >
                      {clinic.status === 'blocked' ? (
                        <>
                          <Unlock className="w-3 h-3" /> Desbloquear
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Bloquear
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
