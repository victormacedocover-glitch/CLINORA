import React, { useState, useEffect } from 'react';
import { supabaseServices, Appointment, Patient, ProcedureItem, formatClinicAddress } from '../lib/supabaseServices';
import { isValidPhoneBR, openWhatsApp } from '../lib/whatsapp';
import { Calendar as CalendarIcon, Plus, Clock, User, FileText, CheckCircle2, AlertCircle, Trash2, MessageSquare, ExternalLink } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface AgendaPageProps {
  onNavigate?: (route: string) => void;
}

export function AgendaPage({ onNavigate }: AgendaPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [procedure, setProcedure] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, pats, procs] = await Promise.all([
        supabaseServices.getAppointments(),
        supabaseServices.getPatients(),
        supabaseServices.getProcedures(),
      ]);
      setAppointments(apps);
      setPatients(pats);
      setProcedures(procs);
      if (procs.length > 0 && !procedure) {
        setProcedure(procs[0].name);
      }
    } catch (err) {
      console.error('Error loading agenda data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    if (val) {
      const p = patients.find((pat) => pat.id === val);
      if (p) setPatientName(p.name);
    }
  };

  const openNewModal = () => {
    setErrorMsg('');
    setAppointmentDate(selectedDate || new Date().toISOString().split('T')[0]);
    if (procedures.length > 0) {
      setProcedure(procedures[0].name);
    } else {
      setProcedure('');
    }
    setShowModal(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = patientName.trim();
    if (!finalName) {
      setErrorMsg('Por favor, informe o nome do paciente.');
      return;
    }

    if (!appointmentDate) {
      setErrorMsg('A data da consulta é obrigatória.');
      return;
    }

    if (!time) {
      setErrorMsg('O horário da consulta é obrigatório.');
      return;
    }

    if (!procedure && procedures.length > 0) {
      setErrorMsg('Selecione um procedimento para o agendamento.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await supabaseServices.createAppointment({
        clinicId: '',
        patientId: selectedPatientId || undefined,
        patientName: finalName,
        date: appointmentDate,
        time,
        procedure: procedure || 'Consulta Geral',
        status: 'agendado',
      });

      setSuccessMsg('Consulta agendada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setPatientName('');
      setSelectedPatientId('');
      if (appointmentDate !== selectedDate) {
        setSelectedDate(appointmentDate);
      }
      await loadData();
    } catch (err: any) {
      console.error('Erro ao agendar consulta:', err);
      setErrorMsg(err.message || 'Não foi possível agendar a consulta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendAppointmentWhatsApp = async (app: Appointment) => {
    setErrorMsg('');
    let matched = app.patientId ? patients.find((p) => p.id === app.patientId) : undefined;

    if (!matched && app.patientName) {
      const nameLower = app.patientName.trim().toLowerCase();
      matched = patients.find((p) => p.name.trim().toLowerCase() === nameLower);
    }

    const phone = matched?.phone;

    if (!isValidPhoneBR(phone)) {
      setErrorMsg(`Este paciente (${app.patientName}) não possui um telefone válido cadastrado.`);
      return;
    }

    const [yyyy, mm, dd] = app.date.split('-');
    const dateFormatted = `${dd}/${mm}/${yyyy}`;

    const clinicDetails = await supabaseServices.getClinicDetails();
    const clinicName = clinicDetails.name || 'nossa clínica';
    const addressBlock = formatClinicAddress(clinicDetails, 'Endereço:');

    let msg = `Olá, ${app.patientName}!\n\nPassando para confirmar seu atendimento na ${clinicName}.\n\nData: ${dateFormatted}\nHorário: ${app.time}\nProcedimento: ${app.procedure}`;

    if (addressBlock) {
      msg += `\n\n${addressBlock}`;
    }

    msg += `\n\nEsperamos você!\n\n${clinicName}`;

    openWhatsApp(phone, msg);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setErrorMsg('');

    try {
      await supabaseServices.deleteAppointment(deleteTargetId);
      setDeleteTargetId(null);
      setSuccessMsg('Agendamento removido com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao cancelar agendamento:', err);
      setErrorMsg(err.message || 'Não foi possível cancelar o agendamento.');
    } finally {
      setDeleting(false);
    }
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
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer text-sm"
          id="btn-agendar-consulta"
        >
          <Plus className="w-4 h-4" />
          Agendar Consulta
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && !showModal && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Date Picker Bar */}
      <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">Selecione a Data:</span>
          <input
            type="date"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            id="agenda-date-picker"
          />
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          Total no dia: <strong className="text-white">{dayAppointments.length} agendamentos</strong>
        </div>
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando consultas do banco...</div>
      ) : dayAppointments.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-medium text-white mb-1">Nenhum agendamento nesta data</h3>
          <p className="text-slate-400 text-sm mb-4">Clique no botão abaixo para incluir uma nova consulta na agenda.</p>
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-medium rounded-xl text-sm hover:bg-emerald-600 transition cursor-pointer"
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
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-center font-bold text-sm min-w-[80px]">
                  {app.time}
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-slate-400" />
                    {app.patientName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-teal-400" />
                      Data: <strong className="text-slate-200">{app.date}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Procedimento: <strong className="text-slate-200">{app.procedure}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendAppointmentWhatsApp(app)}
                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Enviar lembrete pelo WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={async () => {
                    const nextStatus =
                      app.status === 'agendado'
                        ? 'confirmado'
                        : app.status === 'confirmado'
                        ? 'concluido'
                        : 'agendado';
                    try {
                      await supabaseServices.updateAppointmentStatus(app.id, nextStatus);
                      await loadData();
                    } catch (err: any) {
                      setErrorMsg(err.message);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer transition border capitalize ${
                    app.status === 'confirmado'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : app.status === 'concluido'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  {app.status}
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
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Selecionar Paciente Cadastrado
                </label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientSelectChange}
                  className="w-full px-3.5 py-2 mb-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Selecione ou digite manualmente abaixo --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Paciente *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data da Consulta *
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Procedimento *
                </label>

                {procedures.length === 0 ? (
                  <div className="bg-slate-900 border border-amber-500/30 p-3 rounded-xl space-y-2">
                    <p className="text-xs text-amber-300">
                      Você ainda não possui procedimentos cadastrados.
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          onNavigate('/procedimentos');
                        }}
                        className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cadastrar novo procedimento
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {procedures.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
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
        message="Tem certeza que deseja cancelar e remover este agendamento do banco de dados?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
