import React, { useState, useEffect } from 'react';
import { supabaseServices, Patient } from '../lib/supabaseServices';
import { Users, Plus, Search, Phone, Mail, Calendar, Trash2, UserPlus, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    const data = await supabaseServices.getPatients();
    setPatients(data);
    setLoading(false);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    await supabaseServices.createPatient({
      clinicId: 'c1',
      name,
      email,
      phone,
      birthDate,
      notes,
    });

    setSaving(false);
    setShowModal(false);
    setName('');
    setEmail('');
    setPhone('');
    setBirthDate('');
    setNotes('');

    setSuccessMsg('Paciente cadastrado com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
    loadPatients();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabaseServices.deletePatient(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    loadPatients();
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Pacientes</h1>
              <p className="text-slate-400 text-sm">Prontuário e cadastro simplificado da sua clínica</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Paciente
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nome, telefone ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition text-sm"
        />
      </div>

      {/* Patient List Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando lista de pacientes...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
          <UserPlus className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-medium text-white mb-1">Nenhum paciente encontrado</h3>
          <p className="text-slate-400 text-sm mb-4">
            {searchTerm ? 'Tente buscar por outro termo' : 'Cadastre o primeiro paciente da clínica'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-medium rounded-xl text-sm hover:bg-emerald-600 transition"
          >
            Cadastrar Paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/20 text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{patient.name}</h3>
                      <span className="text-xs text-slate-400">Desde {new Date(patient.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTargetId(patient.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                    title="Excluir paciente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nascimento: {new Date(patient.birthDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {patient.notes && (
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40 text-xs text-slate-400 italic">
                    "{patient.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Novo Paciente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Cadastrar Novo Paciente</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Ana Paula Silva"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações do Prontuário</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Histórico clínico, alergias ou preferências..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  {saving ? 'Salvando...' : 'Salvar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Excluir Paciente"
        message="Tem certeza que deseja excluir este paciente do sistema? Esta ação removerá os dados do cadastro."
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
