import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Settings,
  Stethoscope,
  Shield,
  LogOut,
  Sliders,
} from 'lucide-react';

interface AppSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  clinicName?: string;
  isSuperAdmin?: boolean;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentRoute,
  onNavigate,
  clinicName = 'Minha Clínica',
  isSuperAdmin = false,
  onLogout,
}) => {
  const menuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'Pacientes', route: '/pacientes', icon: Users },
    { label: 'Agenda', route: '/agenda', icon: Calendar },
    { label: 'Procedimentos', route: '/procedimentos', icon: Sliders },
    { label: 'Orçamentos', route: '/orcamentos', icon: FileText },
    { label: 'Financeiro', route: '/financeiro', icon: DollarSign },
    { label: 'Tarefas', route: '/tarefas', icon: CheckSquare },
    { label: 'Oportunidades', route: '/oportunidades', icon: TrendingUp },
    { label: 'Relatórios', route: '/relatorios', icon: BarChart3 },
    { label: 'Configurações', route: '/configuracoes', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 pt-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-white tracking-tight leading-none">
              CLINORA
            </span>
            <span className="text-[10px] text-teal-400 font-semibold uppercase mt-0.5">
              Clinora Pro
            </span>
          </div>
        </div>

        {/* Clinic Name Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Clínica Ativa</p>
          <p className="font-bold text-white truncate">{clinicName}</p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
                id={`sidebar-link-${item.route.replace('/', '')}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isSuperAdmin && (
            <div className="pt-2">
              <div className="border-t border-slate-800 my-2" />
              <button
                onClick={() => onNavigate('/admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentRoute === '/admin'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'text-purple-400 hover:bg-purple-950/30'
                }`}
                id="sidebar-link-admin"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Super Admin</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => onNavigate('/assinatura')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium py-2 rounded-lg border border-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          Gerenciar Assinatura
        </button>

        <button
          onClick={onLogout}
          className="w-full text-slate-400 hover:text-red-400 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          id="sidebar-logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};
