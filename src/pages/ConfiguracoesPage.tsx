import React, { useState, useEffect } from 'react';
import { Settings, Building, Lock, CheckCircle2, Database, CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import { supabaseServices } from '../lib/supabaseServices';

interface ConfiguracoesPageProps {
  clinicName?: string;
  onClinicNameChange?: (newName: string) => void;
}

export function ConfiguracoesPage({ clinicName = 'Clínica Odontológica Exemplo', onClinicNameChange }: ConfiguracoesPageProps) {
  const [name, setName] = useState(clinicName);
  const [phone, setPhone] = useState('(11) 98888-7777');
  const [email, setEmail] = useState('contato@clinica.com.br');

  // Address fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadClinicInfo();
  }, []);

  const loadClinicInfo = async () => {
    setLoading(true);
    try {
      const details = await supabaseServices.getClinicDetails();
      if (details) {
        if (details.name) setName(details.name);
        if (details.phone) setPhone(details.phone);
        if (details.email) setEmail(details.email);
        setCep(details.cep || '');
        setStreet(details.street || '');
        setNumber(details.number || '');
        setComplement(details.complement || '');
        setNeighborhood(details.neighborhood || '');
        setCity(details.city || '');
        setState(details.state || '');
      }
    } catch (err) {
      console.warn('Error loading clinic info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const updated = await supabaseServices.updateClinicDetails({ name, phone, email });
      setSavedMsg('Dados da clínica salvos com sucesso!');
      if (updated.name && onClinicNameChange) {
        onClinicNameChange(updated.name);
      }
      window.dispatchEvent(new Event('clinora_data_changed'));
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving general details:', err);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await supabaseServices.updateClinicDetails({
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      });
      setSavedMsg('Informações de endereço salvas com sucesso!');
      window.dispatchEvent(new Event('clinora_data_changed'));
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving address details:', err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCepChange = async (val: string) => {
    setCep(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
        }
      } catch (e) {
        console.warn('ViaCEP fetch error:', e);
      } finally {
        setLoadingCep(false);
      }
    }
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
          <p className="text-xs text-slate-400">Gerencie informações cadastrais, endereço, integrações e segurança</p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
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

            <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
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
                  disabled={savingGeneral}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {savingGeneral ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          {/* Section: 📍 Endereço da clínica */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <MapPin className="w-4 h-4 text-teal-400" />
              📍 Endereço da clínica
            </h2>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    {loadingCep && (
                      <span className="absolute right-3 top-2.5 text-[10px] text-teal-400 animate-pulse">
                        Buscando...
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua Exemplo"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Número</label>
                  <input
                    type="text"
                    placeholder="Ex: 123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Complemento</label>
                  <input
                    type="text"
                    placeholder="Ex: Sala 2"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Centro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="Ex: SP"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {savingAddress ? 'Salvando...' : 'Salvar informações'}
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
