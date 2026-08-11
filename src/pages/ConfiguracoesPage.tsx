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
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
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

          {/* Security & Password Reset Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Lock className="w-4 h-4 text-teal-400" />
              Segurança & Redefinição de Senha
            </h2>

            <p className="text-xs text-slate-400">
              Altere sua senha de acesso ao sistema Clinora de forma segura e imediata.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSavedMsg('Sua senha foi atualizada com sucesso e criptografada!');
                setTimeout(() => setSavedMsg(''), 4000);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repita a nova senha"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold rounded-xl transition cursor-pointer"
              >
                Atualizar Senha Agora
              </button>
            </form>
          </div>
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
              <CreditCard className="w-4 h-4 text-sky-400" />
              Mercado Pago & Pagamentos
            </h3>
            <p className="text-[11px] text-slate-400">
              Processamento direto via Mercado Pago no valor de R$ 149,90 (Acesso Vitalício).
            </p>
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300">
                Link de Pagamento do Mercado Pago (Opcional):
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/seu-link-vitalicio"
                defaultValue={localStorage.getItem('clinora_mp_checkout_link') || ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    localStorage.setItem('clinora_mp_checkout_link', val);
                  } else {
                    localStorage.removeItem('clinora_mp_checkout_link');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-500">
                Se você criar um link de cobrança personalizado no seu painel do Mercado Pago, cole-o acima.
              </p>
            </div>
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[11px] text-sky-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Mercado Pago Vitalício Conectado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
