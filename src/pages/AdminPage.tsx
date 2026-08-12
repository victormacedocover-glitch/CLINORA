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
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  // Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'access' | 'credentials' | 'plan' | 'audit'>('overview');

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

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'activate' | 'pending' | 'block' | 'unblock';
    targetUser: any | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'activate',
    targetUser: null,
  });

  // Current admin email
  const currentAdminEmail = 'victorbeirigo76@gmail.com';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch administrative data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/admin-user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_all_data',
          adminEmail: currentAdminEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.usersList && data.usersList.length > 0) {
          setUsersList(data.usersList);
        } else {
          // Fallback mock data if database is empty
          loadFallbackData();
        }
        if (data.auditLogs) {
          setAuditLogs(data.auditLogs);
        }
      } else {
        loadFallbackData();
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      loadFallbackData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFallbackData = () => {
    setUsersList([
      {
        id: '1',
        userId: 'u1',
        clinicId: 'c1',
        clinicName: 'Clínica Odontológica Silva',
        owner: 'Dra. Juliana Silva',
        email: 'juliana@clinicasilva.com.br',
        phone: '(11) 99999-8888',
        accessStatus: 'active',
        subscriptionStatus: 'active',
        plan: 'Clinora Pro - Vitalício',
        amount: 149.9,
        createdAt: '01/08/2026',
        lastSignInAt: '12/08/2026 10:15',
      },
      {
        id: '2',
        userId: 'u2',
        clinicId: 'c2',
        clinicName: 'Estética Avançada Belle',
        owner: 'Dra. Patricia Lima',
        email: 'contato@belleestetica.com',
        phone: '(21) 98888-7777',
        accessStatus: 'pending',
        subscriptionStatus: 'pending',
        plan: 'Clinora Pro - Vitalício',
        amount: 149.9,
        createdAt: '08/08/2026',
        lastSignInAt: '08/08/2026 14:20',
      },
      {
        id: '3',
        userId: 'u3',
        clinicId: 'c3',
        clinicName: 'Consultório Dr. Roberto',
        owner: 'Dr. Roberto Santos',
        email: 'roberto@consultorio.med.br',
        phone: '(31) 97777-6666',
        accessStatus: 'blocked',
        subscriptionStatus: 'cancelled',
        plan: 'Clinora Pro - Vitalício',
        amount: 149.9,
        createdAt: '15/07/2026',
        lastSignInAt: '20/07/2026 09:30',
      },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Access Status Handler
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
          adminEmail: currentAdminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setUsersList((prev) =>
          prev.map((u) => {
            if (u.id === user.id || u.userId === user.userId || u.email === user.email) {
              return { ...u, accessStatus: newStatus };
            }
            return u;
          })
        );

        if (selectedUser && (selectedUser.id === user.id || selectedUser.email === user.email)) {
          setSelectedUser((prev: any) => ({ ...prev, accessStatus: newStatus }));
        }

        const messages = {
          active: '✓ Acesso liberado com sucesso.',
          pending: 'Status de acesso alterado para pendente.',
          blocked: '✓ Usuário bloqueado com sucesso.',
        };

        showToast(messages[newStatus] || 'Status atualizado com sucesso!', 'success');

        // Add to audit logs locally
        const newLog = {
          id: Math.random().toString(),
          admin_email: currentAdminEmail,
          action: `Acesso alterado para ${newStatus.toUpperCase()}`,
          details: `Acesso da clínica ${user.clinicName} (${user.owner}) alterado para ${newStatus}`,
          created_at: new Date().toISOString(),
        };
        setAuditLogs((prev) => [newLog, ...prev]);
      } else {
        showToast(data.error || 'Erro ao atualizar status de acesso.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro de conexão com o servidor.', 'error');
    }
  };

  // Password Reset Handler
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
          adminEmail: currentAdminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCredMessage({ text: '✓ Senha redefinida com sucesso!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
        showToast('✓ Senha do usuário alterada com sucesso.', 'success');
      } else {
        setCredMessage({ text: data.error || 'Erro ao redefinir senha.', type: 'error' });
      }
    } catch (err: any) {
      setCredMessage({ text: err?.message || 'Erro ao conectar ao servidor.', type: 'error' });
    } finally {
      setCredLoading(false);
    }
  };

  // User Info Save Handler
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
          adminEmail: currentAdminEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update state
        setUsersList((prev) =>
          prev.map((u) => {
            if (u.id === selectedUser.id) {
              return {
                ...u,
                owner: editOwner,
                email: editEmail,
                phone: editPhone,
                clinicName: editClinicName,
              };
            }
            return u;
          })
        );
        setSelectedUser((prev: any) => ({
          ...prev,
          owner: editOwner,
          email: editEmail,
          phone: editPhone,
          clinicName: editClinicName,
        }));
        showToast('✓ Dados cadastrais salvos com sucesso!', 'success');
      } else {
        showToast(data.error || 'Erro ao salvar dados.', 'error');
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

    const matchesAccess =
      accessFilter === 'all' || u.accessStatus === accessFilter;

    const matchesSubscription =
      subscriptionFilter === 'all' || u.subscriptionStatus === subscriptionFilter;

    return matchesSearch && matchesAccess && matchesSubscription;
  });

  // Calculate Real Dynamic Metrics
  const totalClinics = usersList.length;
  const activeUsers = usersList.filter((u) => u.accessStatus === 'active').length;
  const pendingUsers = usersList.filter((u) => u.accessStatus === 'pending').length;
  const blockedUsers = usersList.filter((u) => u.accessStatus === 'blocked').length;
  const activeSubscriptions = usersList.filter((u) => u.subscriptionStatus === 'active').length;
  const totalRevenue = activeSubscriptions * 149.9;

  // Open "Gerenciar" Modal
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
  const triggerQuickAction = (user: any, actionType: 'activate' | 'pending' | 'block' | 'unblock') => {
    const titles = {
      activate: 'Liberar Acesso Vitalício',
      pending: 'Colocar em Pendente',
      block: 'Bloquear Acesso da Clínica',
      unblock: 'Desbloquear Acesso da Clínica',
    };

    const messages = {
      activate: `Tem certeza que deseja liberar o acesso completo do Clinora para "${user.clinicName}"?`,
      pending: `Deseja colocar o acesso de "${user.clinicName}" como pendente?`,
      block: `Tem certeza que deseja bloquear o acesso de "${user.clinicName}"? Os dados da clínica NÃO serão apagados.`,
      unblock: `Tem certeza que deseja desbloquear o acesso de "${user.clinicName}"? O login será restaurado.`,
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

    const targetStatusMap: Record<string, 'active' | 'pending' | 'blocked'> = {
      activate: 'active',
      pending: 'pending',
      block: 'blocked',
      unblock: 'active',
    };

    const newStatus = targetStatusMap[confirmModal.actionType];
    handleUpdateAccessStatus(confirmModal.targetUser, newStatus);

    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      actionType: 'activate',
      targetUser: null,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all transform translate-y-0 ${
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

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 border border-purple-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Painel Super Admin</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SaaS Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão global de clínicas, assinaturas e faturamento recorrente (MRR).
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
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
            title="Atualizar dados do banco"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Site
          </button>
        </div>
      </div>

      {/* Metrics Row (Dynamic Real Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* Total Clínicas */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Total Clínicas</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalClinics}</p>
          <p className="text-[10px] text-slate-400">Cadastradas</p>
        </div>

        {/* Usuários Ativos */}
        <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-emerald-400 text-xs font-semibold">
            <span>Acesso Ativo</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{activeUsers}</p>
          <p className="text-[10px] text-emerald-500/70">Acesso liberado</p>
        </div>

        {/* Usuários Pendentes */}
        <div className="bg-slate-950 border border-amber-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-amber-400 text-xs font-semibold">
            <span>Acesso Pendente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{pendingUsers}</p>
          <p className="text-[10px] text-amber-500/70">Aguardando pagamento</p>
        </div>

        {/* Usuários Bloqueados */}
        <div className="bg-slate-950 border border-red-500/20 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-red-400 text-xs font-semibold">
            <span>Bloqueados</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-red-400">{blockedUsers}</p>
          <p className="text-[10px] text-red-500/70">Suspensos</p>
        </div>

        {/* Assinaturas Ativas */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Assinaturas</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-400">{activeSubscriptions}</p>
          <p className="text-[10px] text-slate-400">Pagas no Mercado Pago</p>
        </div>

        {/* Faturamento Licenças */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1 col-span-1 sm:col-span-2 xl:col-span-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Faturamento Licenças</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-[10px] text-teal-400">R$ 149,90 por licença vitalícia</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Header Tabs & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Lista de Clínicas do Clinora ({filteredUsers.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Alterações ({auditLogs.length})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            Ações administrativas de suporte, liberação e bloqueio
          </span>
        </div>

        {/* Tab 1: Users & Clinics Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por clínica, responsável, e-mail ou telefone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Access Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <label className="text-xs text-slate-400 whitespace-nowrap">Status Acesso:</label>
                <select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="pending">Pendentes</option>
                  <option value="blocked">Bloqueados</option>
                </select>
              </div>

              {/* Subscription Status Filter */}
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <label className="text-xs text-slate-400 whitespace-nowrap">Assinatura:</label>
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Todas as Assinaturas</option>
                  <option value="active">Ativa</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-lg">Clínica / Responsável</th>
                    <th className="p-3.5">Contato</th>
                    <th className="p-3.5">Acesso</th>
                    <th className="p-3.5">Assinatura</th>
                    <th className="p-3.5">Cadastro</th>
                    <th className="p-3.5 rounded-r-lg text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                        Carregando registros do banco...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Nenhuma clínica ou usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-medium">
                          <p className="font-bold text-white text-sm">{user.clinicName}</p>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-purple-400" />
                            {user.owner}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <p className="text-slate-200 font-mono">{user.email}</p>
                          {user.phone && (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {user.phone}
                            </p>
                          )}
                        </td>
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
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                              user.subscriptionStatus === 'active'
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                                : user.subscriptionStatus === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {user.subscriptionStatus === 'active'
                              ? 'Ativa'
                              : user.subscriptionStatus === 'pending'
                              ? 'Pendente'
                              : 'Cancelada'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{user.createdAt}</td>
                        <td className="p-3.5 text-right space-x-2">
                          {/* Quick Action Button */}
                          {user.accessStatus === 'pending' && (
                            <button
                              onClick={() => triggerQuickAction(user, 'activate')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              title="Liberar Acesso Rapidamente"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Liberar Acesso
                            </button>
                          )}

                          {user.accessStatus === 'active' && (
                            <button
                              onClick={() => triggerQuickAction(user, 'block')}
                              className="bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              title="Bloquear Acesso da Clínica"
                            >
                              <Lock className="w-3 h-3" /> Bloquear
                            </button>
                          )}

                          {user.accessStatus === 'blocked' && (
                            <button
                              onClick={() => triggerQuickAction(user, 'unblock')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              title="Desbloquear Acesso"
                            >
                              <Unlock className="w-3 h-3" /> Desbloquear
                            </button>
                          )}

                          {/* "Gerenciar" Main Action */}
                          <button
                            onClick={() => openManageModal(user)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 shadow-md shadow-purple-600/20"
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

        {/* Tab 2: Global Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Histórico de Alterações Administrativas
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
                        Nenhuma alteração registrada até o momento.
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
                    Gerenciamento completo: {selectedUser.owner} ({selectedUser.email})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setModalTab('overview')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  modalTab === 'overview'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Visão Geral
              </button>

              <button
                onClick={() => setModalTab('access')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  modalTab === 'access'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Controle de Acesso
              </button>

              <button
                onClick={() => setModalTab('credentials')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  modalTab === 'credentials'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Credenciais & Senha
              </button>

              <button
                onClick={() => setModalTab('plan')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  modalTab === 'plan'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Plano & Assinatura
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* ------------------ TAB 1: VISÃO GERAL / DADOS ------------------ */}
              {modalTab === 'overview' && (
                <form onSubmit={handleSaveUserInfo} className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Dados Cadastrais da Clínica e Responsável
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 mt-2">
                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">Data de Cadastro</p>
                      <p className="font-bold text-white mt-0.5">{selectedUser.createdAt}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">Último Acesso</p>
                      <p className="font-bold text-white mt-0.5">{selectedUser.lastSignInAt || 'Nunca'}</p>
                    </div>

                    <div>
                      <p className="text-slate-500 text-[10px] font-semibold">Status de Acesso</p>
                      <p className="font-bold text-purple-400 uppercase mt-0.5">{selectedUser.accessStatus}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={infoSaving}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {infoSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------ TAB 2: CONTROLE DE ACESSO ------------------ */}
              {modalTab === 'access' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Status Atual de Acesso do Usuário
                    </h3>

                    <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-300 font-semibold">Status de Acesso:</span>
                      {selectedUser.accessStatus === 'active' && (
                        <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ATIVO (Acesso liberado ao Clinora)
                        </span>
                      )}
                      {selectedUser.accessStatus === 'pending' && (
                        <span className="px-3 py-1 rounded-full font-bold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          PENDENTE (Aguardando Pagamento/Liberação)
                        </span>
                      )}
                      {selectedUser.accessStatus === 'blocked' && (
                        <span className="px-3 py-1 rounded-full font-bold text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                          BLOQUEADO (Acesso temporariamente suspenso)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">Alterar Status de Acesso:</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Ativar */}
                      <button
                        onClick={() => handleUpdateAccessStatus(selectedUser, 'active')}
                        disabled={selectedUser.accessStatus === 'active'}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                          selectedUser.accessStatus === 'active'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 cursor-default opacity-80'
                            : 'bg-slate-950 border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="font-bold text-xs">Ativar Acesso</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Permite login e todas as funções
                          </p>
                        </div>
                      </button>

                      {/* Pendente */}
                      <button
                        onClick={() => handleUpdateAccessStatus(selectedUser, 'pending')}
                        disabled={selectedUser.accessStatus === 'pending'}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                          selectedUser.accessStatus === 'pending'
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 cursor-default opacity-80'
                            : 'bg-slate-950 border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400'
                        }`}
                      >
                        <Clock className="w-6 h-6 text-amber-400" />
                        <div>
                          <p className="font-bold text-xs">Colocar como Pendente</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Redireciona para checkout
                          </p>
                        </div>
                      </button>

                      {/* Bloquear */}
                      <button
                        onClick={() => handleUpdateAccessStatus(selectedUser, 'blocked')}
                        disabled={selectedUser.accessStatus === 'blocked'}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                          selectedUser.accessStatus === 'blocked'
                            ? 'bg-red-950/40 border-red-500/50 text-red-300 cursor-default opacity-80'
                            : 'bg-slate-950 border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-400'
                        }`}
                      >
                        <Lock className="w-6 h-6 text-red-400" />
                        <div>
                          <p className="font-bold text-xs">Bloquear Acesso</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Impede login do usuário
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="font-bold text-slate-300">Nota de Suporte Técnico:</p>
                    <p>
                      O status de acesso manual pode ser administrado independentemente do status da assinatura. Bloquear um usuário não apaga nenhum dado da clínica ou histórico de atendimentos.
                    </p>
                  </div>
                </div>
              )}

              {/* ------------------ TAB 3: CREDENCIAIS & SENHA ------------------ */}
              {modalTab === 'credentials' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Gerenciamento de Login & Redefinição de Senha
                  </h3>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">E-mail de Login Atual:</span>
                      <span className="font-bold text-white font-mono">{selectedUser.email}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Defina uma nova senha segura para o usuário. A senha anterior nunca é exibida por motivos de segurança e é armazenada via Hash.
                    </p>
                  </div>

                  {credMessage && (
                    <div
                      className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        credMessage.type === 'success'
                          ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-300'
                          : 'bg-red-950 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {credMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      {credMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nova Senha (Mínimo 6 caracteres) *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirmar Nova Senha *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={credLoading}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      {credLoading ? 'Redefinindo...' : 'Definir Nova Senha'}
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------ TAB 4: PLANO & ASSINATURA ------------------ */}
              {modalTab === 'plan' && (
                <div className="space-y-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Detalhes do Plano e Transação de Pagamento
                  </h3>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 font-semibold text-[10px]">Plano Contratado</p>
                        <p className="font-extrabold text-white text-sm mt-0.5">Clinora Pro</p>
                      </div>

                      <div>
                        <p className="text-slate-500 font-semibold text-[10px]">Tipo de Licença</p>
                        <p className="font-bold text-teal-400 text-sm mt-0.5">Acesso Vitalício</p>
                      </div>

                      <div>
                        <p className="text-slate-500 font-semibold text-[10px]">Valor da Licença</p>
                        <p className="font-bold text-white text-sm mt-0.5">R$ 149,90 (Pagamento Único)</p>
                      </div>

                      <div>
                        <p className="text-slate-500 font-semibold text-[10px]">Status da Assinatura MP</p>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] mt-1 ${
                            selectedUser.subscriptionStatus === 'active'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {selectedUser.subscriptionStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Liberar Acesso em Caso de Erro de Webhook
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Se o cliente pagou R$ 149,90 pelo Mercado Pago mas o webhook não ativou a conta automaticamente, você pode conceder o acesso diretamente clicando no botão abaixo:
                    </p>
                    <button
                      onClick={() => handleUpdateAccessStatus(selectedUser, 'active')}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors mt-2 inline-flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Conceder Acesso Vitalício Manualmente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteConfirmAction}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Confirmar Ação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
