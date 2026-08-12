import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Search,
  Filter,
  Settings,
  Key,
  Eye,
  Clock,
  FileText,
  Check,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Edit2,
  Save,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  CreditCard,
  History,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPageProps {
  onNavigate: (route: string) => void;
  currentUser?: {
    id?: string;
    email?: string;
    role?: string;
  } | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, currentUser }) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [clinicsList, setClinicsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalClinics: number;
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    blockedUsers: number;
    approvedPayments: number;
    totalRevenue: number;
    activeSubscriptions: number;
  }>({
    totalClinics: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    blockedUsers: 0,
    approvedPayments: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Navigation Tabs in Super Admin
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clinics' | 'payments' | 'audit'>('dashboard');

  // Manage Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'access' | 'credentials' | 'plan'>('overview');

  // Credential Edit State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [credMessage, setCredMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [credLoading, setCredLoading] = useState<boolean>(false);

  // User Edit Info State
  const [editOwner, setEditOwner] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editClinicName, setEditClinicName] = useState<string>('');
  const [infoSaving, setInfoSaving] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'activate' | 'pending' | 'block' | 'unblock' | 'manual_release' | 'confirm_email';
    targetUser: any | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'activate',
    targetUser: null,
  });

  const adminEmail = currentUser?.email || 'victorbeirigo76@gmail.com';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch real administrative data from backend Netlify function
  const fetchData = async () => {
    setLoading(true);
    setAccessDenied(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_all_data',
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        setAccessDenied(true);
        setErrorMessage(data.error || 'Acesso negado. Apenas o Super Admin tem permissão.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (response.ok) {
        setUsersList(data.usersList || []);
        setClinicsList(data.clinicsList || []);
        setPaymentsList(data.paymentsList || []);
        setAuditLogs(data.auditLogs || []);

        if (data.stats) {
          setStats(data.stats);
        } else {
          // Derive stats dynamically from arrays
          const users = data.usersList || [];
          const pays = data.paymentsList || [];
          const appPays = pays.filter((p: any) => p.status === 'approved');
          const revenue = appPays.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

          setStats({
            totalClinics: (data.clinicsList || []).length,
            totalUsers: users.length,
            activeUsers: users.filter((u: any) => u.accessStatus === 'active').length,
            pendingUsers: users.filter((u: any) => u.accessStatus === 'pending').length,
            blockedUsers: users.filter((u: any) => u.accessStatus === 'blocked').length,
            approvedPayments: appPays.length,
            totalRevenue: revenue,
            activeSubscriptions: users.filter((u: any) => u.accessStatus === 'active' || u.subscriptionStatus === 'approved').length,
          });
        }
      } else {
        setErrorMessage(data.error || 'Erro ao carregar dados do banco de dados.');
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setErrorMessage('Erro de conexão ao comunicar com o servidor administrativo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminEmail]);

  // Update Access Status Handler (Ativar, Pendente, Bloquear, Desbloquear)
  const handleUpdateAccessStatus = async (user: any, newStatus: 'active' | 'pending' | 'blocked') => {
    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_access_status',
          userId: user.userId,
          clinicId: user.clinicId,
          targetEmail: user.email,
          newStatus,
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh full data from backend to ensure state consistency
        fetchData();

        if (selectedUser && (selectedUser.id === user.id || selectedUser.email === user.email)) {
          setSelectedUser((prev: any) => ({ ...prev, accessStatus: newStatus }));
        }

        const messages = {
          active: '✓ Acesso liberado com sucesso.',
          pending: 'Status de acesso alterado para pendente.',
          blocked: '✓ Usuário bloqueado com sucesso.',
        };

        showToast(data.message || messages[newStatus] || 'Status atualizado com sucesso!', 'success');
      } else {
        showToast(data.error || 'Erro ao atualizar status de acesso.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro de conexão com o servidor.', 'error');
    }
  };

  // Release Manual Access Handler (Pagamento Aprovado mas Acesso Pendente)
  const handleReleaseManualAccess = async (user: any) => {
    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release_manual_access',
          userId: user.userId,
          clinicId: user.clinicId,
          targetEmail: user.email,
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchData();
        if (selectedUser) {
          setSelectedUser((prev: any) => ({ ...prev, accessStatus: 'active' }));
        }
        showToast(data.message || '✓ Acesso ativado e liberado com sucesso!', 'success');
      } else {
        showToast(data.error || 'Erro ao liberar acesso do usuário.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro de conexão.', 'error');
    }
  };

  // Confirm User Email Handler (Official Supabase Auth Admin API)
  const handleConfirmEmail = async (user: any) => {
    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_user_email',
          userId: user.userId,
          clinicId: user.clinicId,
          targetEmail: user.email,
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchData();
        if (selectedUser && (selectedUser.id === user.id || selectedUser.email === user.email)) {
          setSelectedUser((prev: any) => ({ ...prev, emailConfirmed: true }));
        }
        showToast(data.message || '✓ E-mail do usuário confirmado no Supabase Auth com sucesso!', 'success');
      } else {
        showToast(data.error || 'Erro ao confirmar e-mail do usuário no Supabase Auth.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro de conexão com o servidor.', 'error');
    }
  };

  // Password Reset Handler (Official Supabase Auth Admin API)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);

    if (!selectedUser) return;

    if (!newPassword || newPassword.length < 6) {
      setCredMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setCredMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setCredLoading(true);

    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          userId: selectedUser.userId,
          targetEmail: selectedUser.email,
          newPassword: newPassword,
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCredMessage({ text: '✓ Senha redefinida com sucesso!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
        showToast('✓ Senha do usuário redefinida com sucesso.', 'success');
      } else {
        setCredMessage({ text: data.error || 'Erro ao redefinir senha.', type: 'error' });
      }
    } catch (err: any) {
      setCredMessage({ text: err?.message || 'Erro ao conectar ao servidor.', type: 'error' });
    } finally {
      setCredLoading(false);
    }
  };

  // User Info Edit Handler
  const handleSaveUserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setInfoSaving(true);
    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_info',
          userId: selectedUser.userId,
          clinicId: selectedUser.clinicId,
          fullName: editOwner,
          email: editEmail,
          phone: editPhone,
          clinicName: editClinicName,
          adminEmail: adminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchData();
        setSelectedUser((prev: any) => ({
          ...prev,
          owner: editOwner,
          email: editEmail,
          phone: editPhone,
          clinicName: editClinicName,
        }));
        showToast('Dados atualizados com sucesso.', 'success');
      } else {
        showToast(data.error || 'Erro ao salvar dados do usuário.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar dados.', 'error');
    } finally {
      setInfoSaving(false);
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (u.clinicName || '').toLowerCase().includes(searchLower) ||
      (u.owner || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.phone || '').toLowerCase().includes(searchLower);

    const matchesAccess = accessFilter === 'all' || u.accessStatus === accessFilter;

    const matchesSubscription =
      subscriptionFilter === 'all' || u.subscriptionStatus === subscriptionFilter;

    const matchesPlan = planFilter === 'all' || (u.plan || '').includes(planFilter);

    return matchesSearch && matchesAccess && matchesSubscription && matchesPlan;
  });

  // Filtered Payments List
  const filteredPayments = paymentsList.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (p.clientName || '').toLowerCase().includes(searchLower) ||
      (p.clinicName || '').toLowerCase().includes(searchLower) ||
      (p.email || '').toLowerCase().includes(searchLower) ||
      (p.transactionId || '').toLowerCase().includes(searchLower);

    const matchesStatus = subscriptionFilter === 'all' || p.status === subscriptionFilter;

    return matchesSearch && matchesStatus;
  });

  // Open Manage Modal
  const openManageModal = (user: any) => {
    setSelectedUser(user);
    setEditOwner(user.owner || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditClinicName(user.clinicName || '');
    setModalTab('overview');
    setCredMessage(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Quick Action Confirmation Trigger
  const triggerActionModal = (
    user: any,
    actionType: 'activate' | 'pending' | 'block' | 'unblock' | 'manual_release' | 'confirm_email'
  ) => {
    const titles = {
      activate: 'Liberar Acesso Vitalício',
      pending: 'Colocar Acesso em Pendente',
      block: 'Bloquear Acesso da Clínica',
      unblock: 'Desbloquear Acesso da Clínica',
      manual_release: 'Liberar Acesso Manualmente (Pagamento Aprovado)',
      confirm_email: 'Confirmar E-mail no Supabase Auth',
    };

    const messages = {
      activate: `Tem certeza que deseja liberar o acesso do Clinora para "${user.clinicName}" (${user.owner})?`,
      pending: `Deseja colocar o acesso de "${user.clinicName}" como pendente?`,
      block: `Tem certeza que deseja bloquear o acesso de "${user.clinicName}"? O login será suspenso.`,
      unblock: `Tem certeza que deseja desbloquear o acesso de "${user.clinicName}"? O login será restaurado.`,
      manual_release: `Pagamento aprovado encontrado. Deseja liberar o acesso deste usuário (${user.owner})?`,
      confirm_email: `Deseja confirmar manualmente o e-mail do usuário "${user.owner}" (${user.email}) diretamente no Supabase Auth?`,
    };

    setConfirmModal({
      isOpen: true,
      title: titles[actionType],
      message: messages[actionType],
      actionType,
      targetUser: user,
    });
  };

  const handleExecuteConfirmAction = () => {
    if (!confirmModal.targetUser) return;

    if (confirmModal.actionType === 'confirm_email') {
      handleConfirmEmail(confirmModal.targetUser);
    } else if (confirmModal.actionType === 'manual_release') {
      handleReleaseManualAccess(confirmModal.targetUser);
    } else {
      const targetStatusMap: Record<string, 'active' | 'pending' | 'blocked'> = {
        activate: 'active',
        pending: 'pending',
        block: 'blocked',
        unblock: 'active',
      };
      const newStatus = targetStatusMap[confirmModal.actionType];
      handleUpdateAccessStatus(confirmModal.targetUser, newStatus);
    }

    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      actionType: 'activate',
      targetUser: null,
    });
  };

  // Access Denied Screen for non-superadmin users
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border-2 border-red-500/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Acesso negado.</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você não possui autorização para acessar o Painel Super Admin do Clinora. Esta área é restrita aos administradores autorizados do sistema.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/dashboard')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950 border-red-500/50 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 border border-purple-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Painel Super Admin</h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SaaS Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Administração central de clínicas, usuários, pagamentos reais e credenciais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            title="Atualizar dados do banco"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={() => onNavigate('/dashboard')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </button>
        </div>
      </div>

      {/* Real Indicators Row (Calculated from DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* Total Clínicas */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Clínicas</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalClinics}</p>
          <p className="text-[10px] text-slate-500">Cadastradas</p>
        </div>

        {/* Usuários Registrados */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Usuários</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats.totalUsers}</p>
          <p className="text-[10px] text-slate-500">Registrados</p>
        </div>

        {/* Usuários Ativos */}
        <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-semibold">
            <span>Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.activeUsers}</p>
          <p className="text-[10px] text-emerald-500/70">Acesso liberado</p>
        </div>

        {/* Usuários Pendentes */}
        <div className="bg-slate-950 border border-amber-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-amber-400 text-xs font-semibold">
            <span>Pendentes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{stats.pendingUsers}</p>
          <p className="text-[10px] text-amber-500/70">Aguardando pgt</p>
        </div>

        {/* Usuários Bloqueados */}
        <div className="bg-slate-950 border border-red-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-red-400 text-xs font-semibold">
            <span>Bloqueados</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-red-400">{stats.blockedUsers}</p>
          <p className="text-[10px] text-red-500/70">Suspensos</p>
        </div>

        {/* Pagamentos Aprovados */}
        <div className="bg-slate-950 border border-teal-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-teal-400 text-xs font-semibold">
            <span>Pgts MP</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-400">{stats.approvedPayments}</p>
          <p className="text-[10px] text-teal-500/70">Aprovados</p>
        </div>

        {/* Faturamento Total */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1 col-span-1 sm:col-span-2 xl:col-span-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Faturamento Real</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] text-emerald-400">Somatório de pagamentos reais aprovados</p>
        </div>
      </div>

      {/* Main Container Tabs */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários ({usersList.length})
          </button>

          <button
            onClick={() => setActiveTab('clinics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'clinics'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Clínicas ({clinicsList.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pagamentos Reais ({paymentsList.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico ({auditLogs.length})
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 0: DASHBOARD EXECUTIVE SUMMARY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-purple-400 tracking-wider">
                  Status de Licenciamento
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total de Usuários:</span>
                    <strong className="text-white">{stats.totalUsers}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Acessos Liberados (Ativos):</span>
                    <strong className="text-emerald-400">{stats.activeUsers}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Pendente de Pagamento:</span>
                    <strong className="text-amber-400">{stats.pendingUsers}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Bloqueados:</span>
                    <strong className="text-red-400">{stats.blockedUsers}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-teal-400 tracking-wider">
                  Integração Mercado Pago
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Transações Registradas:</span>
                    <strong className="text-white">{paymentsList.length}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Pagamentos Aprovados:</span>
                    <strong className="text-teal-400">{stats.approvedPayments}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Ticket Licença Clinora Pro:</span>
                    <strong className="text-white">R$ 149,90</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Faturamento Bruto Real:</span>
                    <strong className="text-emerald-400">
                      R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                  Ações Rápidas de Administração
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerencie permissões, redefina senhas de usuários e resolva discrepâncias entre pagamento e liberação de acesso.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    Gerenciar Usuários
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition-colors border border-slate-700"
                  >
                    Ver Pagamentos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ALL REAL USERS TABLE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              <div className="relative col-span-1 md:col-span-2">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail, telefone ou clínica..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Acesso: Todos</option>
                  <option value="active">Ativos</option>
                  <option value="pending">Pendentes</option>
                  <option value="blocked">Bloqueados</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Pagamento: Todos</option>
                  <option value="approved">Aprovados</option>
                  <option value="pending">Pendentes</option>
                  <option value="cancelled">Cancelados</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-lg">Usuário / Responsável</th>
                    <th className="p-3.5">Clínica</th>
                    <th className="p-3.5">Plano</th>
                    <th className="p-3.5">Acesso</th>
                    <th className="p-3.5">Pagamento</th>
                    <th className="p-3.5">Cadastro</th>
                    <th className="p-3.5">Último Acesso</th>
                    <th className="p-3.5 rounded-r-lg text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                        Carregando usuários do banco de dados...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Nenhum usuário encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-medium">
                          <p className="font-bold text-white text-sm">{user.owner}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400 font-mono text-[11px]">{user.email}</span>
                            {user.emailConfirmed ? (
                              <span className="inline-flex items-center text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded" title="E-mail confirmado no Supabase Auth">
                                ✓ E-mail Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded" title="E-mail não confirmado no Supabase Auth (será confirmado ao ativar ou redefinir senha)">
                                ⚠ Não Confirmado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-200">
                          {user.clinicName}
                          {user.phone && <span className="block text-[11px] text-slate-400 font-normal">{user.phone}</span>}
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">{user.plan}</td>
                        <td className="p-3.5">
                          {user.accessStatus === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              ATIVO
                            </span>
                          )}
                          {user.accessStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              PENDENTE
                            </span>
                          )}
                          {user.accessStatus === 'blocked' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                              <Lock className="w-3 h-3" />
                              BLOQUEADO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase ${
                              user.subscriptionStatus === 'approved' || user.subscriptionStatus === 'active'
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                                : user.subscriptionStatus === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {user.subscriptionStatus === 'approved' || user.subscriptionStatus === 'active'
                              ? 'Aprovado'
                              : user.subscriptionStatus === 'pending'
                              ? 'Pendente'
                              : 'Recusado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{user.createdAt}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{user.lastSignInAt}</td>
                        <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                          {/* Explicit Action: Confirm Email in Supabase Auth */}
                          {!user.emailConfirmed && (
                            <button
                              onClick={() => triggerActionModal(user, 'confirm_email')}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-sm shadow-blue-600/30"
                              title="Confirmar e-mail no Supabase Auth"
                            >
                              <Mail className="w-3 h-3" /> Confirmar E-mail
                            </button>
                          )}

                          {/* Discrepancy Action: Payment Approved but Access Pending */}
                          {(user.subscriptionStatus === 'approved' || user.subscriptionStatus === 'active') &&
                            user.accessStatus === 'pending' && (
                              <button
                                onClick={() => triggerActionModal(user, 'manual_release')}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer animate-pulse"
                                title="Pagamento aprovado. Liberar Acesso agora!"
                              >
                                <CheckSquare className="w-3 h-3" /> Liberar Acesso
                              </button>
                            )}

                          {user.accessStatus === 'pending' && user.subscriptionStatus !== 'approved' && (
                            <button
                              onClick={() => triggerActionModal(user, 'activate')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Liberar Acesso"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Ativar
                            </button>
                          )}

                          {user.accessStatus === 'active' && (
                            <button
                              onClick={() => triggerActionModal(user, 'block')}
                              className="bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Bloquear Acesso"
                            >
                              <Lock className="w-3 h-3" /> Bloquear
                            </button>
                          )}

                          {user.accessStatus === 'blocked' && (
                            <button
                              onClick={() => triggerActionModal(user, 'unblock')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Desbloquear Acesso"
                            >
                              <Unlock className="w-3 h-3" /> Desbloquear
                            </button>
                          )}

                          <button
                            onClick={() => openManageModal(user)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 shadow-md shadow-purple-600/20 cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Gerenciar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: REAL CLINICS LIST */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'clinics' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-lg">Nome da Clínica</th>
                    <th className="p-3.5">Responsável / E-mail</th>
                    <th className="p-3.5">Telefone</th>
                    <th className="p-3.5">Plano</th>
                    <th className="p-3.5">Status Clínica</th>
                    <th className="p-3.5">Data Cadastro</th>
                    <th className="p-3.5 rounded-r-lg text-right">Último Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Carregando clínicas do banco de dados...
                      </td>
                    </tr>
                  ) : clinicsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Nenhuma clínica cadastrada no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    clinicsList.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-bold text-white text-sm">{clinic.name}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-200">{clinic.ownerName}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{clinic.ownerEmail}</p>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono">{clinic.phone || 'Não informado'}</td>
                        <td className="p-3.5 text-purple-400 font-semibold">Clinora Pro</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                              clinic.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {clinic.status === 'active' ? 'Ativa' : 'Bloqueada'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{clinic.createdAt}</td>
                        <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">{clinic.lastSignInAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: REAL PAYMENTS TABLE (MERCADO PAGO) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-lg">Cliente / E-mail</th>
                    <th className="p-3.5">Clínica Vinculada</th>
                    <th className="p-3.5">Valor</th>
                    <th className="p-3.5">Status Mercado Pago</th>
                    <th className="p-3.5">Método</th>
                    <th className="p-3.5">ID Transação / Pref ID</th>
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5 rounded-r-lg text-right">Ação de Suporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Carregando registros de pagamentos do banco...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Nenhum pagamento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-bold text-white">
                          {pay.clientName}
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            {pay.email}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-300">{pay.clinicName}</td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          R$ {pay.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                              pay.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : pay.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {pay.status === 'approved'
                              ? 'Aprovado'
                              : pay.status === 'pending'
                              ? 'Pendente'
                              : 'Recusado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono text-[11px] uppercase">
                          {pay.paymentMethod}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                          {pay.transactionId || pay.id}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{pay.createdAt}</td>
                        <td className="p-3.5 text-right">
                          {pay.status === 'approved' && pay.userAccessStatus === 'pending' && (
                            <button
                              onClick={() =>
                                triggerActionModal(
                                  {
                                    userId: pay.userId,
                                    clinicId: pay.clinicId,
                                    owner: pay.clientName,
                                    clinicName: pay.clinicName,
                                    email: pay.email,
                                  },
                                  'manual_release'
                                )
                              }
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckSquare className="w-3 h-3" />
                              Liberar Acesso
                            </button>
                          )}
                          {pay.status === 'approved' && pay.userAccessStatus === 'active' && (
                            <span className="text-emerald-400 font-bold text-[10px] flex items-center justify-end gap-1">
                              <Check className="w-3 h-3" />
                              Acesso Liberado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Histórico de Ações Administrativas do Banco
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-lg">Data & Hora</th>
                    <th className="p-3.5">Administrador</th>
                    <th className="p-3.5">Ação Executada</th>
                    <th className="p-3.5 rounded-r-lg">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        Nenhuma ação administrativa registrada no banco.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : 'Sem data'}
                        </td>
                        <td className="p-3.5 font-bold text-purple-300">{log.admin_email}</td>
                        <td className="p-3.5 font-semibold text-white">{log.action}</td>
                        <td className="p-3.5 text-slate-400">{log.details || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL "GERENCIAR USUÁRIO" */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">{selectedUser.clinicName}</h2>
                  <p className="text-xs text-slate-400">
                    Gerenciamento: {selectedUser.owner} ({selectedUser.email})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setModalTab('overview')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  modalTab === 'overview'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Dados Pessoais & Clínica
              </button>

              <button
                onClick={() => setModalTab('access')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  modalTab === 'access'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Controle de Acesso
              </button>

              <button
                onClick={() => setModalTab('credentials')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  modalTab === 'credentials'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Credenciais & Senha
              </button>

              <button
                onClick={() => setModalTab('plan')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  modalTab === 'plan'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Assinatura & Pagamento
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* TAB 1: DADOS PESSOAIS */}
              {modalTab === 'overview' && (
                <form onSubmit={handleSaveUserInfo} className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Editar Dados Cadastrais
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome do Responsável
                      </label>
                      <input
                        type="text"
                        value={editOwner}
                        onChange={(e) => setEditOwner(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        E-mail de Login
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome da Clínica
                      </label>
                      <input
                        type="text"
                        value={editClinicName}
                        onChange={(e) => setEditClinicName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 mt-2 font-mono">
                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">ID Usuário</p>
                      <p className="font-bold text-white truncate text-[10px]">{selectedUser.userId}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">ID Clínica</p>
                      <p className="font-bold text-white truncate text-[10px]">{selectedUser.clinicId || 'Sem ID'}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">Data Cadastro</p>
                      <p className="font-bold text-white text-[10px]">{selectedUser.createdAt}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">Último Acesso</p>
                      <p className="font-bold text-white text-[10px]">{selectedUser.lastSignInAt}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={infoSaving}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {infoSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CONTROLE DE ACESSO */}
              {modalTab === 'access' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Estados Independentes do Usuário
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* E-mail Status */}
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status do E-mail:</span>
                        {selectedUser.emailConfirmed ? (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> E-mail Confirmado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-400">
                            <AlertCircle className="w-3.5 h-3.5" /> Não Confirmado
                          </span>
                        )}
                      </div>

                      {/* Access Status */}
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status de Acesso:</span>
                        {selectedUser.accessStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ATIVO
                          </span>
                        )}
                        {selectedUser.accessStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> PENDENTE
                          </span>
                        )}
                        {selectedUser.accessStatus === 'blocked' && (
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-red-400">
                            <Lock className="w-3.5 h-3.5" /> BLOQUEADO
                          </span>
                        )}
                      </div>

                      {/* Payment Status */}
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Status de Pagamento:</span>
                        <span className={`inline-flex items-center gap-1 font-bold text-xs uppercase ${
                          selectedUser.subscriptionStatus === 'approved' || selectedUser.subscriptionStatus === 'active'
                            ? 'text-teal-400'
                            : selectedUser.subscriptionStatus === 'pending'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}>
                          {selectedUser.subscriptionStatus === 'approved' || selectedUser.subscriptionStatus === 'active'
                            ? 'Aprovado'
                            : selectedUser.subscriptionStatus === 'pending'
                            ? 'Pendente'
                            : 'Recusado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">Ações Administrativas Diretas:</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Confirm Email Button Card */}
                      <button
                        onClick={() => handleConfirmEmail(selectedUser)}
                        className="bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 text-blue-200 p-4 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-blue-400">
                          <Mail className="w-4 h-4" /> [CONFIRMAR E-MAIL]
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Confirma o e-mail diretamente no Supabase Auth.
                        </p>
                      </button>

                      {/* Activate Access Button Card */}
                      <button
                        onClick={() => handleUpdateAccessStatus(selectedUser, 'active')}
                        className="bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-200 p-4 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> [LIBERAR ACESSO / ATIVAR]
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Define o access_status como active no banco de dados.
                        </p>
                      </button>

                      {/* Pending Button Card */}
                      <button
                        onClick={() => handleUpdateAccessStatus(selectedUser, 'pending')}
                        className="bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 text-amber-200 p-4 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                          <Clock className="w-4 h-4" /> Colocar como Pendente
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Retorna o access_status para pending.
                        </p>
                      </button>

                      {/* Block/Unblock Button Card */}
                      {selectedUser.accessStatus === 'blocked' ? (
                        <button
                          onClick={() => handleUpdateAccessStatus(selectedUser, 'active')}
                          className="bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-200 p-4 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                            <Unlock className="w-4 h-4" /> [DESBLOQUEAR]
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Restaura o acesso da clínica.
                          </p>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateAccessStatus(selectedUser, 'blocked')}
                          className="bg-red-950/60 border border-red-500/40 hover:bg-red-900/60 text-red-200 p-4 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 font-bold text-xs text-red-400">
                            <Lock className="w-4 h-4" /> [BLOQUEAR]
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Modifica o status para blocked e suspende login sem excluir conta.
                          </p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CREDENCIAIS & REDEFINIÇÃO DE SENHA */}
              {modalTab === 'credentials' && (
                <div className="space-y-5">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400">E-mail de Autenticação:</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedUser.email}</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-purple-400" /> Redefinir Senha do Usuário
                    </h3>

                    {credMessage && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold ${
                          credMessage.type === 'success'
                            ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950 border border-red-500/40 text-red-300'
                        }`}
                      >
                        {credMessage.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nova Senha (mínimo 6 caracteres)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Confirmar Nova Senha
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme a senha..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={credLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {credLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: PLANO & PAGAMENTOS */}
              {modalTab === 'plan' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Plano Atribuído</p>
                      <p className="text-sm font-extrabold text-purple-400">{selectedUser.plan}</p>
                      <p className="text-[11px] text-slate-400">Licença Vitalícia • R$ 149,90</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Status no Mercado Pago</p>
                      <p className="text-sm font-extrabold text-white uppercase">{selectedUser.subscriptionStatus}</p>
                      <p className="text-[11px] text-slate-400">Checkout Oficial Mercado Pago</p>
                    </div>
                  </div>

                  {selectedUser.paymentDetails ? (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                      <h4 className="font-bold text-white text-xs font-sans">Registro de Pagamento no Banco:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div>ID Pagamento MP: <strong className="text-white">{selectedUser.paymentDetails.paymentId || 'N/A'}</strong></div>
                        <div>Valor Pago: <strong className="text-emerald-400">R$ {selectedUser.paymentDetails.amount?.toFixed(2).replace('.', ',')}</strong></div>
                        <div>Método: <strong className="text-white">{selectedUser.paymentDetails.paymentMethod}</strong></div>
                        <div>Data: <strong className="text-white">{selectedUser.paymentDetails.createdAt ? new Date(selectedUser.paymentDetails.createdAt).toLocaleString('pt-BR') : 'N/A'}</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs text-slate-400">
                      Nenhum registro prévio de transação encontrado no banco para este usuário.
                    </div>
                  )}

                  {/* Discrepancy Tool: Payment Approved but Access Pending */}
                  {selectedUser.subscriptionStatus === 'approved' && selectedUser.accessStatus === 'pending' && (
                    <div className="bg-amber-950/60 border-2 border-amber-500/60 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 font-extrabold text-amber-300 text-xs">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Discrepância Detectada: Pagamento Aprovado com Acesso Pendente</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        O Mercado Pago registrou o pagamento como aprovado, porém o acesso do usuário ainda consta como pendente.
                      </p>
                      <button
                        onClick={() => handleReleaseManualAccess(selectedUser)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Liberar Acesso do Usuário
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION ACTION MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteConfirmAction}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
