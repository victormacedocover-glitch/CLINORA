import { supabase, isSupabaseConfigured } from './supabase';
import { UserRole, SubscriptionStatus } from '../types';

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId?: string;
  patientName: string;
  date: string;
  time: string;
  procedure: string;
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado';
  notes?: string;
  createdAt: string;
}

export interface ProcedureItem {
  id: string;
  clinicId: string;
  name: string;
  price: number;
  duration: number; // em minutos
  active: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  clinicId: string;
  patientId?: string;
  patientName: string;
  description: string;
  amount: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado';
  createdAt: string;
}

export interface Transaction {
  id: string;
  clinicId: string;
  description: string;
  type: 'receita' | 'despesa';
  amount: number;
  status: 'pago' | 'pendente' | 'cancelado';
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  clinicId: string;
  title: string;
  description?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  dueDate?: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  clinicId: string;
  patientName: string;
  title: string;
  status: 'novo_lead' | 'contato' | 'orcamento' | 'negociacao' | 'convertido' | 'perdido';
  value: number;
  createdAt: string;
}

// ============================================================================
// DEMO LOCAL STORAGE STATE ENGINE (Fallback quando Supabase não estiver conectado)
// ============================================================================
const DEMO_PATIENTS: Patient[] = [
  { id: 'p1', clinicId: 'c1', name: 'Mariana Costa', email: 'mariana@email.com', phone: '(11) 98888-1111', birthDate: '1992-05-14', notes: 'Paciente frequente, alergia a látex', createdAt: '2026-08-01' },
  { id: 'p2', clinicId: 'c1', name: 'Lucas Gabriel', email: 'lucas@email.com', phone: '(11) 97777-2222', birthDate: '1988-11-20', notes: 'Interesse em clareamento', createdAt: '2026-08-03' },
  { id: 'p3', clinicId: 'c1', name: 'Carla Souza', email: 'carla@email.com', phone: '(11) 96666-3333', birthDate: '1995-02-10', notes: 'Aplicação de toxina e preenchimento', createdAt: '2026-08-05' },
];

const DEMO_PROCEDURES: ProcedureItem[] = [
  { id: 'pr1', clinicId: 'c1', name: 'Limpeza e Profilaxia', price: 250, duration: 45, active: true, createdAt: '2026-08-01' },
  { id: 'pr2', clinicId: 'c1', name: 'Clareamento Dental a Laser', price: 950, duration: 60, active: true, createdAt: '2026-08-01' },
  { id: 'pr3', clinicId: 'c1', name: 'Aplicação de Toxina Botulínica (1 Região)', price: 1200, duration: 30, active: true, createdAt: '2026-08-01' },
  { id: 'pr4', clinicId: 'c1', name: 'Preenchimento Labial com Ácido Hialurônico', price: 1800, duration: 60, active: true, createdAt: '2026-08-01' },
  { id: 'pr5', clinicId: 'c1', name: 'Restauração Estética em Resina', price: 350, duration: 45, active: true, createdAt: '2026-08-01' },
];

const DEMO_APPOINTMENTS: Appointment[] = [
  { id: 'a1', clinicId: 'c1', patientId: 'p1', patientName: 'Mariana Costa', date: new Date().toISOString().split('T')[0], time: '14:00', procedure: 'Limpeza e Profilaxia', status: 'confirmado', createdAt: '2026-08-01' },
  { id: 'a2', clinicId: 'c1', patientId: 'p2', patientName: 'Lucas Gabriel', date: new Date().toISOString().split('T')[0], time: '15:30', procedure: 'Clareamento Dental a Laser', status: 'agendado', createdAt: '2026-08-02' },
  { id: 'a3', clinicId: 'c1', patientId: 'p3', patientName: 'Carla Souza', date: new Date().toISOString().split('T')[0], time: '16:45', procedure: 'Aplicação de Toxina Botulínica', status: 'confirmado', createdAt: '2026-08-03' },
];

const DEMO_BUDGETS: Budget[] = [
  { id: 'b1', clinicId: 'c1', patientId: 'p1', patientName: 'Mariana Costa', description: 'Tratamento de Clareamento + Restauração', amount: 1300, status: 'aprovado', createdAt: '2026-08-02' },
  { id: 'b2', clinicId: 'c1', patientId: 'p2', patientName: 'Lucas Gabriel', description: 'Harmonização Facial completa', amount: 3800, status: 'enviado', createdAt: '2026-08-04' },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 't1', clinicId: 'c1', description: 'Consulta & Profilaxia - Mariana', type: 'receita', amount: 250, status: 'pago', date: '2026-08-08', createdAt: '2026-08-08' },
  { id: 't2', clinicId: 'c1', description: 'Material Odontológico e Anestésico', type: 'despesa', amount: 480, status: 'pago', date: '2026-08-07', createdAt: '2026-08-07' },
  { id: 't3', clinicId: 'c1', description: 'Orçamento Aprovado - Lucas Gabriel', type: 'receita', amount: 1900, status: 'pago', date: '2026-08-09', createdAt: '2026-08-09' },
];

const DEMO_TASKS: Task[] = [
  { id: 'tk1', clinicId: 'c1', title: 'Confirmar consultas do dia de amanhã via WhatsApp', description: 'Enviar mensagem para pacientes com horário das 09h às 18h', status: 'pendente', dueDate: new Date().toISOString().split('T')[0], createdAt: '2026-08-01' },
  { id: 'tk2', clinicId: 'c1', title: 'Fazer pedido de luvas e resinas para a dental', description: 'Verificar estoque da sala 2', status: 'em_andamento', dueDate: new Date().toISOString().split('T')[0], createdAt: '2026-08-02' },
];

const DEMO_OPPORTUNITIES: Opportunity[] = [
  { id: 'op1', clinicId: 'c1', patientName: 'Fernanda Rocha', title: 'Interesse em Lentes de Contato Dental', status: 'orcamento', value: 12000, createdAt: '2026-08-05' },
  { id: 'op2', clinicId: 'c1', patientName: 'Gabriel Ramos', title: 'Consulta de Avaliação Ortodôntica', status: 'novo_lead', value: 4500, createdAt: '2026-08-06' },
];

// Helper Function: Store Local
function getLocal<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch {
    return initial;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// ============================================================================
// SERVIÇOS DO SUPABASE & DEMO FALLBACK
// ============================================================================

export const supabaseServices = {
  // PACIENTES
  async getPatients(): Promise<Patient[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          birthDate: d.birth_date,
          notes: d.notes,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_patients', DEMO_PATIENTS);
  },

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const newP: Patient = {
      ...patient,
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          clinic_id: patient.clinicId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          birth_date: patient.birthDate,
          notes: patient.notes,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          birthDate: data.birth_date,
          notes: data.notes,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_patients', DEMO_PATIENTS);
    const updated = [newP, ...current];
    setLocal('clinora_patients', updated);
    return newP;
  },

  async deletePatient(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('patients').delete().eq('id', id);
    }
    const current = getLocal('clinora_patients', DEMO_PATIENTS);
    setLocal('clinora_patients', current.filter((p) => p.id !== id));
  },

  // PROCEDIMENTOS
  async getProcedures(): Promise<ProcedureItem[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('procedures').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          name: d.name,
          price: Number(d.price),
          duration: d.duration,
          active: d.active,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_procedures', DEMO_PROCEDURES);
  },

  async createProcedure(proc: Omit<ProcedureItem, 'id' | 'createdAt'>): Promise<ProcedureItem> {
    const newProc: ProcedureItem = {
      ...proc,
      id: 'pr_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('procedures')
        .insert({
          clinic_id: proc.clinicId,
          name: proc.name,
          price: proc.price,
          duration: proc.duration,
          active: proc.active,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          name: data.name,
          price: Number(data.price),
          duration: data.duration,
          active: data.active,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_procedures', DEMO_PROCEDURES);
    const updated = [newProc, ...current];
    setLocal('clinora_procedures', updated);
    return newProc;
  },

  // CONSULTAS (AGENDA)
  async getAppointments(): Promise<Appointment[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .order('date', { ascending: true });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          patientId: d.patient_id,
          patientName: d.patients?.name || 'Paciente',
          date: d.date,
          time: d.time,
          procedure: d.procedure,
          status: d.status,
          notes: d.notes,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_appointments', DEMO_APPOINTMENTS);
  },

  async createAppointment(app: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const newApp: Appointment = {
      ...app,
      id: 'a_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: app.clinicId,
          patient_id: app.patientId || null,
          date: app.date,
          time: app.time,
          procedure: app.procedure,
          status: app.status,
          notes: app.notes,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          patientId: data.patient_id,
          patientName: app.patientName,
          date: data.date,
          time: data.time,
          procedure: data.procedure,
          status: data.status,
          notes: data.notes,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_appointments', DEMO_APPOINTMENTS);
    const updated = [newApp, ...current];
    setLocal('clinora_appointments', updated);
    return newApp;
  },

  // ORÇAMENTOS
  async getBudgets(): Promise<Budget[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('budgets').select('*, patients(name)').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          patientId: d.patient_id,
          patientName: d.patients?.name || 'Paciente',
          description: d.description,
          amount: Number(d.amount),
          status: d.status,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_budgets', DEMO_BUDGETS);
  },

  async createBudget(b: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const newB: Budget = {
      ...b,
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          clinic_id: b.clinicId,
          patient_id: b.patientId || null,
          description: b.description,
          amount: b.amount,
          status: b.status,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          patientId: data.patient_id,
          patientName: b.patientName,
          description: data.description,
          amount: Number(data.amount),
          status: data.status,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_budgets', DEMO_BUDGETS);
    const updated = [newB, ...current];
    setLocal('clinora_budgets', updated);
    return newB;
  },

  // TRANSAÇÕES FINANCEIRAS
  async getTransactions(): Promise<Transaction[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          description: d.description,
          type: d.type,
          amount: Number(d.amount),
          status: d.status,
          date: d.date,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_transactions', DEMO_TRANSACTIONS);
  },

  async createTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const newT: Transaction = {
      ...t,
      id: 't_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          clinic_id: t.clinicId,
          description: t.description,
          type: t.type,
          amount: t.amount,
          status: t.status,
          date: t.date,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          description: data.description,
          type: data.type,
          amount: Number(data.amount),
          status: data.status,
          date: data.date,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_transactions', DEMO_TRANSACTIONS);
    const updated = [newT, ...current];
    setLocal('clinora_transactions', updated);
    return newT;
  },

  // TAREFAS
  async getTasks(): Promise<Task[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          title: d.title,
          description: d.description,
          status: d.status,
          dueDate: d.due_date,
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_tasks', DEMO_TASKS);
  },

  async createTask(t: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const newT: Task = {
      ...t,
      id: 'tk_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          clinic_id: t.clinicId,
          title: t.title,
          description: t.description,
          status: t.status,
          due_date: t.dueDate,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          title: data.title,
          description: data.description,
          status: data.status,
          dueDate: data.due_date,
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_tasks', DEMO_TASKS);
    const updated = [newT, ...current];
    setLocal('clinora_tasks', updated);
    return newT;
  },

  // OPORTUNIDADES
  async getOpportunities(): Promise<Opportunity[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          clinicId: d.clinic_id,
          patientName: d.patient_name || 'Lead Contact',
          title: d.title,
          status: d.status,
          value: Number(d.value),
          createdAt: d.created_at,
        }));
      }
    }
    return getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
  },

  async createOpportunity(op: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> {
    const newOp: Opportunity = {
      ...op,
      id: 'op_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          clinic_id: op.clinicId,
          title: op.title,
          status: op.status,
          value: op.value,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          clinicId: data.clinic_id,
          patientName: op.patientName,
          title: data.title,
          status: data.status,
          value: Number(data.value),
          createdAt: data.created_at,
        };
      }
    }

    const current = getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
    const updated = [newOp, ...current];
    setLocal('clinora_opportunities', updated);
    return newOp;
  },
};
