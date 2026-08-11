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
  name: 'Clinora Pro (Acesso Vitalício)',
  price: 149.90,
  period: 'pagamento único',
  description: 'Licença definitiva e acesso ilimitado ao Clinora para sua clínica. Sem mensalidades!',
  features: [
    'Pagamento Único — Acesso Vitalício',
    'Aceitamos Pix, Cartão de Crédito e Boleto',
    'Gestão completa de Pacientes',
    'Agenda Inteligente de consultas',
    'Procedimentos e Catálogo de Preços',
    'Orçamentos ilimitados com status',
    'Controle Financeiro de Receitas e Despesas',
    'Gestão de Tarefas da equipe',
    'Funil de Oportunidades (Leads & Vendas)',
    'Relatórios e Indicadores estratégicos',
    'Suporte prioritário via WhatsApp',
    'Sem mensalidades nem taxas ocultas',
  ],
};
