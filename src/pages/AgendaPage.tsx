import React, { useState, useEffect } from 'react';
import { supabaseServices, Appointment, Patient, ProcedureItem } from '../lib/supabaseServices';
import { Calendar as CalendarIcon, Plus, Clock, User, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [patientName, setPatientName] = useState('');
  const [time, setTime] = useState('14:00');
  const [procedure, setProcedure] = useState('Limpeza e Profilaxia');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [apps, pats, procs] = await Promise.all([
      supabaseServices.getAppointments(),
      supabaseServices.getPatients(),
      supabaseServices.getProcedures(),
    ]);
    setAppointments(apps);
    setPatients(pats);
    setProcedures(procs);
    setLoading(false);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) return;

    setSaving(true);
    await supabaseServices.createAppointment({
      clinicId: 'c1',
      patientName,
      date: selectedDate,
      time,
      procedure,
      status: 'agendado',
      notes,
    });

    setSaving(false);
    setShowModal(false);
    setPatientName('');
    setNotes('');
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabaseServices.deleteAppointment(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    loadData();
  };

  const dayAppointments = appointments.filter((a) => a.date === selectedDate);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Agenda Médica & Odontológica</h1>
            <p className="text-slate-400 text-sm">Controle diário de horários e atendimento aos pacientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Agendar Consulta
        </button>
      </div>

      {/* Date Picker Bar */}
      <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">Selecione a Data:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          Total no dia: <strong className="text-white">{dayAppointments.length} agendamentos</strong>
        </div>
      </div>

      {/* Schedule Timeline */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando consultas...</div>
      ) : dayAppointments.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-medium text-white mb-1">Nenhum agendamento nesta data</h3>
          <p className="text-slate-400 text-sm mb-4">Clique no botão acima para incluir uma nova consulta na agenda.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-medium rounded-xl text-sm hover:bg-emerald-600 transition"
          >
            Agendar Horário
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dayAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-center font-bold text-sm min-w-[70px]">
                  {app.time}
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {app.patientName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{app.procedure}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const nextStatus =
                      app.status === 'agendado'
                        ? 'confirmado'
                        : app.status === 'confirmado'
                        ? 'concluido'
                        : 'agendado';
                    await supabaseServices.updateAppointmentStatus(app.id, nextStatus);
                    loadData();
                  }}
                  className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer transition ${
                    app.status === 'confirmado'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : app.status === 'concluido'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  {app.status.toUpperCase()}
                </button>
                <button
                  onClick={() => setDeleteTargetId(app.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                  title="Excluir agendamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Novo Agendamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Agendar Nova Consulta</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Paciente *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Selecione ou digite o paciente"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Procedimento</label>
                  <select
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {procedures.length > 0 ? (
                      procedures.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="Consulta Geral">Consulta Geral</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observações da Consulta</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Primeira vez, encaminhamento, exames..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
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
                  {saving ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Cancelar Agendamento"
        message="Tem certeza que deseja cancelar e remover este agendamento da agenda?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
