import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { DashboardPreview } from './pages/DashboardPreview';
import { AdminPage } from './pages/AdminPage';
import { ModulePlaceholder } from './pages/ModulePlaceholder';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppSidebar } from './components/AppSidebar';
import { SubscriptionStatus, UserRole } from './types';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Settings,
  Sliders,
} from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [user, setUser] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
    clinicName: string;
  } | null>(null);

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('pending');

  // Handle browser URL hash or path state for navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    // PROTECTED ROUTES CHECK (#7 & #8)
    const isProtectedRoute = [
      '/dashboard',
      '/pacientes',
      '/agenda',
      '/orcamentos',
      '/procedimentos',
      '/financeiro',
      '/tarefas',
      '/oportunidades',
      '/relatorios',
      '/configuracoes',
    ].includes(route);

    if (isProtectedRoute) {
      if (!user) {
        // Not authenticated -> redirect to login
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
        return;
      }

      if (subscriptionStatus !== 'active' && user.role !== 'super_admin') {
        // Authenticated but no active subscription -> redirect to /assinatura (#8)
        setCurrentRoute('/assinatura');
        window.history.pushState({}, '', '/assinatura');
        return;
      }
    }

    if (route === '/admin' && user?.role !== 'super_admin') {
      // Non-super-admin trying to access /admin
      if (user && subscriptionStatus === 'active') {
        setCurrentRoute('/dashboard');
        window.history.pushState({}, '', '/dashboard');
      } else {
        setCurrentRoute('/assinatura');
        window.history.pushState({}, '', '/assinatura');
      }
      return;
    }

    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterSuccess = (data: {
    fullName: string;
    email: string;
    clinicName: string;
    clinicPhone: string;
  }) => {
    setUser({
      fullName: data.fullName,
      email: data.email,
      role: 'clinic_admin',
      clinicName: data.clinicName,
    });
    setSubscriptionStatus('pending'); // Initial registration status is pending (#5)
  };

  const handleLoginSuccess = (
    userData: { email: string; role: 'super_admin' | 'clinic_admin' },
    hasActiveSub: boolean
  ) => {
    setUser({
      fullName: userData.role === 'super_admin' ? 'Super Admin' : 'Usuário Clínica',
      email: userData.email,
      role: userData.role,
      clinicName: userData.role === 'super_admin' ? 'Administração SaaS' : 'Clínica Exemplo',
    });
    setSubscriptionStatus(hasActiveSub ? 'active' : 'pending');
  };

  const handleLogout = () => {
    setUser(null);
    setSubscriptionStatus('pending');
    navigate('/');
  };

  // Determine if viewing a protected internal dashboard layout
  const isProtectedLayoutRoute =
    [
      '/dashboard',
      '/pacientes',
      '/agenda',
      '/orcamentos',
      '/procedimentos',
      '/financeiro',
      '/tarefas',
      '/oportunidades',
      '/relatorios',
      '/configuracoes',
    ].includes(currentRoute) &&
    user &&
    (subscriptionStatus === 'active' || user.role === 'super_admin');

  if (isProtectedLayoutRoute) {
    return (
      <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        <AppSidebar
          currentRoute={currentRoute}
          onNavigate={navigate}
          clinicName={user.clinicName}
          isSuperAdmin={user.role === 'super_admin'}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          {currentRoute === '/dashboard' && (
            <DashboardPreview clinicName={user.clinicName} onNavigate={navigate} />
          )}
          {currentRoute === '/pacientes' && (
            <ModulePlaceholder
              title="Pacientes"
              description="Gestão, prontuários e histórico dos seus pacientes."
              icon={Users}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/agenda' && (
            <ModulePlaceholder
              title="Agenda"
              description="Agendamento diário, semanal e controle de horários."
              icon={Calendar}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/procedimentos' && (
            <ModulePlaceholder
              title="Procedimentos"
              description="Catálogo de procedimentos, preços e duração média."
              icon={Sliders}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/orcamentos' && (
            <ModulePlaceholder
              title="Orçamentos"
              description="Criação, envio e acompanhamento de aprovação de orçamentos."
              icon={FileText}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/financeiro' && (
            <ModulePlaceholder
              title="Financeiro Básico"
              description="Controle simples de receitas, despesas e fluxo de caixa."
              icon={DollarSign}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/tarefas' && (
            <ModulePlaceholder
              title="Tarefas"
              description="Organização de pendências da recepção e equipe."
              icon={CheckSquare}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/oportunidades' && (
            <ModulePlaceholder
              title="Oportunidades"
              description="Funil visual de vendas e relacionamento com novos pacientes."
              icon={TrendingUp}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/relatorios' && (
            <ModulePlaceholder
              title="Relatórios"
              description="Indicadores fundamentais de desempenho e faturamento da clínica."
              icon={BarChart3}
              onNavigate={navigate}
            />
          )}
          {currentRoute === '/configuracoes' && (
            <ModulePlaceholder
              title="Configurações"
              description="Dados da clínica, usuários e personalização."
              icon={Settings}
              onNavigate={navigate}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigate}
        currentUser={user ? { name: user.fullName, email: user.email } : null}
        onLogout={handleLogout}
      />

      {/* Main Public / Auth View Routes */}
      <main className="flex-1">
        {currentRoute === '/' && <LandingPage onNavigate={navigate} />}
        {currentRoute === '/login' && (
          <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
        )}
        {currentRoute === '/cadastro' && (
          <RegisterPage onNavigate={navigate} onRegisterSuccess={handleRegisterSuccess} />
        )}
        {currentRoute === '/assinatura' && (
          <SubscriptionPage
            onNavigate={navigate}
            clinicInfo={user ? { name: user.clinicName, email: user.email } : null}
            subscriptionStatus={subscriptionStatus}
            onUpdateSubscriptionStatus={setSubscriptionStatus}
          />
        )}
        {currentRoute === '/admin' && <AdminPage onNavigate={navigate} />}
      </main>

      {/* Footer for Public pages */}
      {['/', '/login', '/cadastro', '/assinatura'].includes(currentRoute) && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
}
