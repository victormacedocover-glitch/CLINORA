import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Check,
  CheckCheck,
  Calendar,
  User,
  FileText,
  TrendingUp,
  X,
  Menu,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  supabaseServices,
  Patient,
  Appointment,
  Budget,
  Task
} from '../lib/supabaseServices';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'appointment' | 'budget' | 'task' | 'system';
  date: string;
  read: boolean;
  route?: string;
}

interface HeaderBarProps {
  clinicName?: string;
  onNavigate: (route: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  clinicName = 'Minha Clínica',
  onNavigate,
  onToggleMobileSidebar,
}) => {
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [patientsResult, setPatientsResult] = useState<Patient[]>([]);
  const [apptsResult, setApptsResult] = useState<Appointment[]>([]);
  const [budgetsResult, setBudgetsResult] = useState<Budget[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load and auto-generate notifications on mount
  useEffect(() => {
    loadAndGenerateNotifications();

    // Close popovers when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAndGenerateNotifications = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [apps, budgets, tasks] = await Promise.all([
        supabaseServices.getAppointments(),
        supabaseServices.getBudgets(),
        supabaseServices.getTasks(),
      ]);

      const generated: AppNotification[] = [];

      // 1. Check appointments for today
      const todayAppts = apps.filter((a) => a.date === todayStr);
      if (todayAppts.length > 0) {
        generated.push({
          id: `appt-today-${todayStr}`,
          title: `📅 ${todayAppts.length} Consulta(s) Hoje!`,
          description: `Você possui ${todayAppts.length} consulta(s) agendada(s) para o dia de hoje.`,
          type: 'appointment',
          date: 'Hoje',
          read: false,
          route: '/agenda',
        });
      }

      // 2. Check pending budgets
      const pendingBudgets = budgets.filter((b) => b.status === 'enviado' || b.status === 'rascunho');
      if (pendingBudgets.length > 0) {
        generated.push({
          id: `budget-pending-${pendingBudgets.length}`,
          title: `📄 Orçamentos Aguardando Resposta`,
          description: `${pendingBudgets.length} orçamento(s) estão pendentes de aprovação pelos pacientes.`,
          type: 'budget',
          date: 'Recente',
          read: false,
          route: '/orcamentos',
        });
      }

      // 3. Check overdue or pending tasks
      const pendingTasks = tasks.filter((t) => t.status !== 'concluida');
      if (pendingTasks.length > 0) {
        generated.push({
          id: `task-pending-${pendingTasks.length}`,
          title: `✅ Tarefas da Equipe`,
          description: `${pendingTasks.length} tarefa(s) pendente(s) necessitam de atenção.`,
          type: 'task',
          date: 'Hoje',
          read: false,
          route: '/tarefas',
        });
      }

      // Load stored notification read states from localStorage
      const storedReadIds = JSON.parse(localStorage.getItem('clinora_read_notifs') || '[]');
      const finalNotifs = generated.map((n) => ({
        ...n,
        read: storedReadIds.includes(n.id),
      }));

      setNotifications(finalNotifs);
    } catch (err) {
      console.error('Error generating notifications:', err);
    }
  };

  // Perform Global Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setIsSearchOpen(true);
      try {
        const q = searchQuery.toLowerCase().trim();
        const [pats, apps, budg] = await Promise.all([
          supabaseServices.getPatients(),
          supabaseServices.getAppointments(),
          supabaseServices.getBudgets(),
        ]);

        setPatientsResult(
          pats.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.phone && p.phone.includes(q)) ||
              (p.email && p.email.toLowerCase().includes(q))
          ).slice(0, 4)
        );

        setApptsResult(
          apps.filter(
            (a) =>
              a.patientName.toLowerCase().includes(q) ||
              a.procedure.toLowerCase().includes(q)
          ).slice(0, 4)
        );

        setBudgetsResult(
          budg.filter(
            (b) =>
              b.patientName.toLowerCase().includes(q) ||
              b.description.toLowerCase().includes(q)
          ).slice(0, 4)
        );
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    const readIds = updated.filter((n) => n.read).map((n) => n.id);
    localStorage.setItem('clinora_read_notifs', JSON.stringify(readIds));
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    const readIds = updated.map((n) => n.id);
    localStorage.setItem('clinora_read_notifs', JSON.stringify(readIds));
  };

  const requestBrowserPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Clinora Pro', {
            body: 'Notificações do navegador ativadas com sucesso para sua clínica!',
            icon: '/favicon.ico',
          });
        }
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasSearchResults =
    patientsResult.length > 0 || apptsResult.length > 0 || budgetsResult.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Clinic Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 lg:hidden"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Clínica:</span>
          <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
            {clinicName}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Busca global em Pacientes, Consultas, Orçamentos e CRM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 max-h-96 overflow-y-auto space-y-4">
            {searchLoading ? (
              <div className="text-center py-6 text-slate-400 text-xs">Buscando no banco de dados...</div>
            ) : !hasSearchResults ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum resultado encontrado para "{searchQuery}".
              </div>
            ) : (
              <>
                {/* Patients */}
                {patientsResult.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Pacientes
                    </span>
                    {patientsResult.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          onNavigate('/pacientes');
                        }}
                        className="p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <span className="font-semibold text-white">{p.name}</span>
                        <span className="text-slate-400 text-[11px]">{p.phone || p.email}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Appointments */}
                {apptsResult.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Agenda / Consultas
                    </span>
                    {apptsResult.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          onNavigate('/agenda');
                        }}
                        className="p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <span className="font-semibold text-white">{a.patientName} — {a.procedure}</span>
                        <span className="text-amber-400 text-[11px]">{a.date} ({a.time})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Budgets */}
                {budgetsResult.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Orçamentos
                    </span>
                    {budgetsResult.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          onNavigate('/orcamentos');
                        }}
                        className="p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <span className="font-semibold text-white">{b.patientName}</span>
                        <span className="text-emerald-400 font-bold">R$ {b.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications Bell Popover */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className="relative p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
          title="Notificações do Sistema"
        >
          <Bell className="w-5 h-5 text-teal-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center border-2 border-slate-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        {isNotifOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Notificações da Clínica</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold">
                    {unreadCount} não lida(s)
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">Nenhuma notificação no momento.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.route) {
                        setIsNotifOpen(false);
                        onNavigate(n.route);
                      }
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer relative ${
                      n.read
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-teal-500/30 text-white shadow-md'
                    }`}
                  >
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-400 absolute top-3 right-3 animate-ping" />
                    )}
                    <h4 className="text-xs font-bold text-slate-100">{n.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{n.description}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">{n.date}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer option: Enable browser push */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Web Push Notifications:</span>
              <button
                onClick={requestBrowserPush}
                className="text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
              >
                Ativar no Navegador
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
