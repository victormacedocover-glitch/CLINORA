import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentPendingPage } from './pages/PaymentPendingPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
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
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [user, setUser] = useState<{
    id?: string;
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

  // Supabase Auth listener & entitlement checking
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const userEmail = u.email || '';
        const meta = u.user_metadata || {};

        // Query access entitlements table
        supabase
          .from('access_entitlements')
          .select('status')
          .eq('user_id', u.id)
          .maybeSingle()
          .then(({ data: entData }) => {
            const active = entData?.status === 'active';
            setUser({
              id: u.id,
              fullName: meta.full_name || meta.name || userEmail.split('@')[0],
              email: userEmail,
              role: 'clinic_admin',
              clinicName: meta.clinic_name || 'Minha Clínica',
            });
            setSubscriptionStatus(active ? 'active' : 'pending');
          });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const userEmail = u.email || '';
        const meta = u.user_metadata || {};

        const { data: entData } = await supabase
          .from('access_entitlements')
          .select('status')
          .eq('user_id', u.id)
          .maybeSingle();

        const active = entData?.status === 'active';
        setUser({
          id: u.id,
          fullName: meta.full_name || meta.name || userEmail.split('@')[0],
          email: userEmail,
          role: 'clinic_admin',
          clinicName: meta.clinic_name || 'Minha Clínica',
        });
        setSubscriptionStatus(active ? 'active' : 'pending');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSubscriptionStatus('pending');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Keep local session in sync
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

  // Handle browser URL history state
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check query params for Mercado Pago return status
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mpStatus =
      searchParams.get('status') ||
      searchParams.get('collection_status') ||
      searchParams.get('payment_status');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');

    if (
      mpStatus === 'approved' ||
      mpStatus === 'success' ||
      (paymentId && mpStatus !== 'rejected' && mpStatus !== 'pending')
    ) {
      setSubscriptionStatus('active');

      if (user?.email) {
        try {
          const stored = localStorage.getItem('clinora_registered_users');
          if (stored) {
            const users = JSON.parse(stored);
            const updated = users.map((u: any) =>
              u.email.toLowerCase() === user.email.toLowerCase()
                ? { ...u, hasActiveSubscription: true }
                : u
            );
            localStorage.setItem('clinora_registered_users', JSON.stringify(updated));
          }
        } catch (e) {
          console.error(e);
        }
      }

      window.history.replaceState({}, '', '/payment/success');
      setCurrentRoute('/payment/success');
    }
  }, [user]);

  // Route guard: strictly restrict access to system tools
  useEffect(() => {
    const protectedToolRoutes = [
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
      '/perfil',
      '/admin',
    ];

    if (protectedToolRoutes.includes(currentRoute)) {
      if (!user) {
        setCurrentRoute('/login');
        window.history.replaceState({}, '', '/login');
      } else if (subscriptionStatus !== 'active' && user.role !== 'super_admin') {
        setCurrentRoute('/checkout');
        window.history.replaceState({}, '', '/checkout');
      }
    }
  }, [currentRoute, user, subscriptionStatus]);

  const navigate = (route: string) => {
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
      '/perfil',
    ].includes(route);

    if (isProtectedRoute) {
      if (!user) {
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
        return;
      }

      if (subscriptionStatus !== 'active' && user.role !== 'super_admin') {
        setCurrentRoute('/checkout');
        window.history.pushState({}, '', '/checkout');
        return;
      }
    }

    if (route === '/admin' && user?.role !== 'super_admin') {
      if (user && subscriptionStatus === 'active') {
        setCurrentRoute('/dashboard');
        window.history.pushState({}, '', '/dashboard');
      } else {
        setCurrentRoute('/checkout');
        window.history.pushState({}, '', '/checkout');
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
    id?: string;
  }) => {
    setUser({
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      role: 'clinic_admin',
      clinicName: data.clinicName,
    });
    setSubscriptionStatus('pending');
  };

  const handleLoginSuccess = (
    userData: { id?: string; email: string; role: 'super_admin' | 'clinic_admin' },
    hasActiveSub: boolean
  ) => {
    setUser({
      id: userData.id,
      fullName: userData.role === 'super_admin' ? 'Super Admin' : 'Usuário Clínica',
      email: userData.email,
      role: userData.role,
      clinicName: userData.role === 'super_admin' ? 'Administração SaaS' : 'Clínica Silva',
    });
    setSubscriptionStatus(hasActiveSub ? 'active' : 'pending');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out:', e);
      }
    }
    setUser(null);
    setSubscriptionStatus('pending');
    navigate('/');
  };

  // Determine layout wrapper
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
      '/perfil',
      '/admin',
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
          {currentRoute === '/perfil' && (
            <ProfilePage
              onNavigate={navigate}
              user={user}
              subscriptionStatus={subscriptionStatus}
              onLogout={handleLogout}
            />
          )}
          {currentRoute === '/admin' && <AdminPage onNavigate={navigate} />}
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

      {/* Main Views */}
      <main className="flex-1">
        {currentRoute === '/' && <LandingPage onNavigate={navigate} />}
        {currentRoute === '/login' && (
          <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
        )}
        {currentRoute === '/cadastro' && (
          <RegisterPage onNavigate={navigate} onRegisterSuccess={handleRegisterSuccess} />
        )}
        {currentRoute === '/forgot-password' && (
          <ForgotPasswordPage onNavigate={navigate} />
        )}
        {currentRoute === '/checkout' && (
          <CheckoutPage onNavigate={navigate} user={user} />
        )}
        {currentRoute === '/payment/success' && (
          <PaymentSuccessPage
            onNavigate={navigate}
            user={user}
            onGrantAccess={() => setSubscriptionStatus('active')}
          />
        )}
        {currentRoute === '/payment/pending' && (
          <PaymentPendingPage onNavigate={navigate} />
        )}
        {currentRoute === '/payment/failure' && (
          <PaymentFailurePage onNavigate={navigate} />
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

      {/* Footer */}
      {['/', '/login', '/cadastro', '/checkout', '/forgot-password'].includes(currentRoute) && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
}
