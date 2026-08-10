export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'expired'
  | 'blocked';

export type UserRole = 'super_admin' | 'clinic_admin' | 'staff';

export interface UserProfile {
  id: string;
  userId: string;
  clinicId: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  clinicId: string;
  mercadopagoSubscriptionId?: string;
  status: SubscriptionStatus;
  plan: 'Clinora Pro';
  amount: number;
  currency: 'BRL';
  startedAt?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInfo {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
}

export const CLINORA_PRO_PLAN: PlanInfo = {
  name: 'Clinora Pro',
  price: 149.90,
  period: 'mês',
  description: 'A solução completa para organizar e escalar sua clínica com tranquilidade.',
  features: [
    'Gestão completa de Pacientes',
    'Agenda Inteligente de consultas',
    'Procedimentos e Catálogo de Preços',
    'Orçamentos ilimitados com status',
    'Controle Financeiro de Receitas e Despesas',
    'Gestão de Tarefas da equipe',
    'Funil de Oportunidades (Leads & Vendas)',
    'Relatórios e Indicadores estratégicos',
    'Suporte prioritário e backups diários',
    'Acesso em múltiplos dispositivos',
  ],
};
