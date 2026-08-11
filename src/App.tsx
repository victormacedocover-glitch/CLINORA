import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { DashboardPreview } from './pages/DashboardPreview';
import { AdminPage } from './pages/AdminPage';
import { PatientsPage } from './pages/PatientsPage';
import { AgendaPage } from './pages/AgendaPage';
import { ProceduresPage } from './pages/ProceduresPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { FinancialPage } from './pages/FinancialPage';
import { TasksPage } from './pages/TasksPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppSidebar } from './components/AppSidebar';
import { SubscriptionStatus, UserRole } from './types';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [user, setUser] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
    clinicName: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('clinora_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.user || null;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(() => {
    try {
      const stored = localStorage.getItem('clinora_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.subscriptionStatus || 'pending';
      }
    } catch (err) {
      console.error(err);
    }
    return 'pending';
  });

  // Keep localStorage session in sync
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(
          'clinora_session',
          JSON.stringify({ user, subscriptionStatus })
        );
      } else {
        localStorage.removeItem('clinora_session');
      }
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }, [user, subscriptionStatus]);

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
    // PROTECTED ROUTES CHECK
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
        // Authenticated but no active subscription -> redirect to /assinatura
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
    setSubscriptionStatus('pending');
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
      '/admin',
      '/assinatura',
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
        <main className="flex-1 overflow-y-auto bg-slate-900">
          {currentRoute === '/dashboard' && (
            <DashboardPreview clinicName={user.clinicName} onNavigate={navigate} />
          )}
          {currentRoute === '/pacientes' && <PatientsPage />}
          {currentRoute === '/agenda' && <AgendaPage />}
          {currentRoute === '/procedimentos' && <ProceduresPage />}
          {currentRoute === '/orcamentos' && <BudgetsPage />}
          {currentRoute === '/financeiro' && <FinancialPage />}
          {currentRoute === '/tarefas' && <TasksPage />}
          {currentRoute === '/oportunidades' && <OpportunitiesPage />}
          {currentRoute === '/relatorios' && <RelatoriosPage />}
          {currentRoute === '/configuracoes' && (
            <ConfiguracoesPage clinicName={user.clinicName} />
          )}
          {currentRoute === '/admin' && <AdminPage onNavigate={navigate} />}
          {currentRoute === '/assinatura' && (
            <SubscriptionPage
              onNavigate={navigate}
              clinicInfo={user ? { name: user.clinicName, email: user.email } : null}
              subscriptionStatus={subscriptionStatus}
              onUpdateSubscriptionStatus={setSubscriptionStatus}
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
      {['/', '/login', '/cadastro'].includes(currentRoute) && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
}

