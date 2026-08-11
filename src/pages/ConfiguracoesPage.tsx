import React, { useState } from 'react';
import { Settings, Building, Lock, Bell, CheckCircle2, ShieldCheck, Database, CreditCard } from 'lucide-react';

interface ConfiguracoesPageProps {
  clinicName?: string;
}

export function ConfiguracoesPage({ clinicName = 'Clínica Odontológica Exemplo' }: ConfiguracoesPageProps) {
  const [name, setName] = useState(clinicName);
  const [phone, setPhone] = useState('(11) 98888-7777');
  const [email, setEmail] = useState('contato@clinica.com.br');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3">
        <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Configurações da Clínica</h1>
          <p className="text-xs text-slate-400">Gerencie informações cadastrais, integrações e segurança</p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-4 h-4 text-teal-400" />
            Dados da Empresa & Clínica
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nome Fantasia / Razão Social</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">E-mail de Notificações</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-md shadow-teal-600/20"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Integration Badges */}
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              Conexão com Banco de Dados
            </h3>
            <p className="text-[11px] text-slate-400">
              Sua aplicação opera em sincronia de estado persistente com retentativa dinâmica local.
            </p>
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-[11px] text-teal-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Modo de Alta Disponibilidade Ativo
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Mercado Pago & Pagamentos
            </h3>
            <p className="text-[11px] text-slate-400">
              Processamento seguro de PIX e cartão de crédito via SDK Oficial.
            </p>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Gateway Conectado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
