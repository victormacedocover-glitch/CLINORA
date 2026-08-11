import React, { useState, useEffect } from 'react';
import { supabaseServices, Task } from '../lib/supabaseServices';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseServices.getTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSaving(true);
    await supabaseServices.createTask({
      clinicId: 'c1',
      title,
      description,
      status: 'pendente',
      dueDate,
    });

    setSaving(false);
    setShowModal(false);
    setTitle('');
    setDescription('');
    loadData();
  };

  const handleStatusChange = async (id: string, currentStatus: Task['status']) => {
    const nextStatus: Task['status'] =
      currentStatus === 'pendente'
        ? 'em_andamento'
        : currentStatus === 'em_andamento'
        ? 'concluida'
        : 'pendente';
    await supabaseServices.updateTaskStatus(id, nextStatus);
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabaseServices.deleteTask(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tarefas & Pendências</h1>
            <p className="text-slate-400 text-sm">Organização de rotina da recepção e equipe clínica</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando tarefas...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          Nenhuma tarefa cadastrada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-3 transition hover:border-slate-600"
            >
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold text-white">{task.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(task.id, task.status)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition cursor-pointer ${
                      task.status === 'concluida'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : task.status === 'em_andamento'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {task.status.replace('_', ' ').toUpperCase()}
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(task.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {task.description && <p className="text-xs text-slate-300">{task.description}</p>}

              {task.dueDate && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700/40">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal - Nova Tarefa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Nova Tarefa</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Confirmar lista de pacientes de amanhã"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detalhes / Instruções</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções adicionais para a recepção..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  {saving ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
