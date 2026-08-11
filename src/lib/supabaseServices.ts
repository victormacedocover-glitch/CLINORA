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
// DEMO LOCAL STORAGE STATE ENGINE (Persistent Base Data)
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

// Helper Functions
function getDeletedIds(): Set<string> {
  try {
    const item = localStorage.getItem('clinora_deleted_ids');
    return item ? new Set(JSON.parse(item)) : new Set();
  } catch {
    return new Set();
  }
}

function addDeletedId(id: string): void {
  try {
    const deleted = getDeletedIds();
    deleted.add(id);
    localStorage.setItem('clinora_deleted_ids', JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Error saving deleted id', err);
  }
}

function getLocal<T extends { id: string }>(key: string, initial: T[]): T[] {
  try {
    const deleted = getDeletedIds();
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial.filter((i) => !deleted.has(i.id));
    }
    const parsed = JSON.parse(item) as T[];
    return parsed.filter((i) => !deleted.has(i.id));
  } catch {
    const deleted = getDeletedIds();
    return initial.filter((i) => !deleted.has(i.id));
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('clinora_data_changed'));
    }
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// Helper to merge local items with Supabase response
function mergeItems<T extends { id: string }>(serverItems: T[], localItems: T[]): T[] {
  const deleted = getDeletedIds();
  const map = new Map<string, T>();
  // Put local items first (unless deleted)
  localItems.forEach((item) => {
    if (!deleted.has(item.id)) map.set(item.id, item);
  });
  // Override/Add server items (unless deleted)
  serverItems.forEach((item) => {
    if (!deleted.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

// ============================================================================
// SERVIÇOS DO SUPABASE & REAL-TIME LOCAL ENGINE
// ============================================================================

export const supabaseServices = {
  // PACIENTES
  async getPatients(): Promise<Patient[]> {
    const local = getLocal('clinora_patients', DEMO_PATIENTS);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Patient[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            name: d.name,
            email: d.email,
            phone: d.phone,
            birthDate: d.birth_date,
            notes: d.notes,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, fallback to local', err);
      }
    }
    return local;
  },

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const newP: Patient = {
      ...patient,
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_patients', DEMO_PATIENTS);
    const updated = [newP, ...current];
    setLocal('clinora_patients', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('patients').insert({
          clinic_id: patient.clinicId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          birth_date: patient.birthDate,
          notes: patient.notes,
        });
      } catch (err) {
        console.warn('Supabase insert failed, persisted locally', err);
      }
    }

    return newP;
  },

  async deletePatient(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_patients', DEMO_PATIENTS);
    setLocal('clinora_patients', current.filter((p) => p.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('patients').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed', err);
      }
    }
  },

  // PROCEDIMENTOS
  async getProcedures(): Promise<ProcedureItem[]> {
    const local = getLocal('clinora_procedures', DEMO_PROCEDURES);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('procedures').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            name: d.name,
            price: Number(d.price),
            duration: d.duration,
            active: d.active,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase fetch failed', err);
      }
    }
    return local;
  },

  async createProcedure(proc: Omit<ProcedureItem, 'id' | 'createdAt'>): Promise<ProcedureItem> {
    const newProc: ProcedureItem = {
      ...proc,
      id: 'pr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_procedures', DEMO_PROCEDURES);
    const updated = [newProc, ...current];
    setLocal('clinora_procedures', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('procedures').insert({
          clinic_id: proc.clinicId,
          name: proc.name,
          price: proc.price,
          duration: proc.duration,
          active: proc.active,
        });
      } catch (err) {
        console.warn('Supabase procedure insert failed', err);
      }
    }

    return newProc;
  },

  async deleteProcedure(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_procedures', DEMO_PROCEDURES);
    setLocal('clinora_procedures', current.filter((p) => p.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('procedures').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete procedure failed', err);
      }
    }
  },

  // CONSULTAS (AGENDA)
  async getAppointments(): Promise<Appointment[]> {
    const local = getLocal('clinora_appointments', DEMO_APPOINTMENTS);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, patients(name)')
          .order('date', { ascending: true });
        if (!error && data && data.length > 0) {
          const mapped: Appointment[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientId: d.patient_id,
            patientName: d.patients?.name || d.patient_name || 'Paciente',
            date: d.date,
            time: d.time,
            procedure: d.procedure,
            status: d.status,
            notes: d.notes,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase appointment fetch failed', err);
      }
    }
    return local;
  },

  async createAppointment(app: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const newApp: Appointment = {
      ...app,
      id: 'a_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_appointments', DEMO_APPOINTMENTS);
    const updated = [newApp, ...current];
    setLocal('clinora_appointments', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').insert({
          clinic_id: app.clinicId,
          patient_id: app.patientId || null,
          date: app.date,
          time: app.time,
          procedure: app.procedure,
          status: app.status,
          notes: app.notes,
        });
      } catch (err) {
        console.warn('Supabase appointment insert failed', err);
      }
    }

    return newApp;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const current = getLocal('clinora_appointments', DEMO_APPOINTMENTS);
    setLocal('clinora_appointments', current.map((a) => (a.id === id ? { ...a, status } : a)));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update status failed', err);
      }
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_appointments', DEMO_APPOINTMENTS);
    setLocal('clinora_appointments', current.filter((a) => a.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete appointment failed', err);
      }
    }
  },

  // ORÇAMENTOS
  async getBudgets(): Promise<Budget[]> {
    const local = getLocal('clinora_budgets', DEMO_BUDGETS);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('budgets').select('*, patients(name)').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Budget[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientId: d.patient_id,
            patientName: d.patients?.name || d.patient_name || 'Paciente',
            description: d.description,
            amount: Number(d.amount),
            status: d.status,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase budgets fetch failed', err);
      }
    }
    return local;
  },

  async createBudget(b: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const newB: Budget = {
      ...b,
      id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_budgets', DEMO_BUDGETS);
    const updated = [newB, ...current];
    setLocal('clinora_budgets', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('budgets').insert({
          clinic_id: b.clinicId,
          patient_id: b.patientId || null,
          description: b.description,
          amount: b.amount,
          status: b.status,
        });
      } catch (err) {
        console.warn('Supabase budget insert failed', err);
      }
    }

    return newB;
  },

  async updateBudgetStatus(id: string, status: Budget['status']): Promise<void> {
    const current = getLocal('clinora_budgets', DEMO_BUDGETS);
    setLocal('clinora_budgets', current.map((b) => (b.id === id ? { ...b, status } : b)));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('budgets').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update budget status failed', err);
      }
    }
  },

  async deleteBudget(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_budgets', DEMO_BUDGETS);
    setLocal('clinora_budgets', current.filter((b) => b.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('budgets').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete budget failed', err);
      }
    }
  },

  // TRANSAÇÕES FINANCEIRAS
  async getTransactions(): Promise<Transaction[]> {
    const local = getLocal('clinora_transactions', DEMO_TRANSACTIONS);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            description: d.description,
            type: d.type,
            amount: Number(d.amount),
            status: d.status,
            date: d.date,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase transaction fetch failed', err);
      }
    }
    return local;
  },

  async createTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const newT: Transaction = {
      ...t,
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_transactions', DEMO_TRANSACTIONS);
    const updated = [newT, ...current];
    setLocal('clinora_transactions', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('transactions').insert({
          clinic_id: t.clinicId,
          description: t.description,
          type: t.type,
          amount: t.amount,
          status: t.status,
          date: t.date,
        });
      } catch (err) {
        console.warn('Supabase transaction insert failed', err);
      }
    }

    return newT;
  },

  async deleteTransaction(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_transactions', DEMO_TRANSACTIONS);
    setLocal('clinora_transactions', current.filter((t) => t.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete transaction failed', err);
      }
    }
  },

  // TAREFAS
  async getTasks(): Promise<Task[]> {
    const local = getLocal('clinora_tasks', DEMO_TASKS);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Task[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            title: d.title,
            description: d.description,
            status: d.status,
            dueDate: d.due_date,
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase task fetch failed', err);
      }
    }
    return local;
  },

  async createTask(t: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const newT: Task = {
      ...t,
      id: 'tk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_tasks', DEMO_TASKS);
    const updated = [newT, ...current];
    setLocal('clinora_tasks', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').insert({
          clinic_id: t.clinicId,
          title: t.title,
          description: t.description,
          status: t.status,
          due_date: t.dueDate,
        });
      } catch (err) {
        console.warn('Supabase task insert failed', err);
      }
    }

    return newT;
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<void> {
    const current = getLocal('clinora_tasks', DEMO_TASKS);
    setLocal('clinora_tasks', current.map((t) => (t.id === id ? { ...t, status } : t)));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase task status update failed', err);
      }
    }
  },

  async deleteTask(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_tasks', DEMO_TASKS);
    setLocal('clinora_tasks', current.filter((t) => t.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase task delete failed', err);
      }
    }
  },

  // OPORTUNIDADES
  async getOpportunities(): Promise<Opportunity[]> {
    const local = getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientName: d.patient_name || 'Lead Contact',
            title: d.title,
            status: d.status,
            value: Number(d.value),
            createdAt: d.created_at,
          }));
          return mergeItems(mapped, local);
        }
      } catch (err) {
        console.warn('Supabase opportunity fetch failed', err);
      }
    }
    return local;
  },

  async createOpportunity(op: Omit<Opportunity, 'id' | 'createdAt'>): Promise<Opportunity> {
    const newOp: Opportunity = {
      ...op,
      id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const current = getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
    const updated = [newOp, ...current];
    setLocal('clinora_opportunities', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('opportunities').insert({
          clinic_id: op.clinicId,
          title: op.title,
          status: op.status,
          value: op.value,
        });
      } catch (err) {
        console.warn('Supabase opportunity insert failed', err);
      }
    }

    return newOp;
  },

  async updateOpportunityStatus(id: string, status: Opportunity['status']): Promise<void> {
    const current = getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
    setLocal('clinora_opportunities', current.map((op) => (op.id === id ? { ...op, status } : op)));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('opportunities').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase opportunity status update failed', err);
      }
    }
  },

  async deleteOpportunity(id: string): Promise<void> {
    addDeletedId(id);
    const current = getLocal('clinora_opportunities', DEMO_OPPORTUNITIES);
    setLocal('clinora_opportunities', current.filter((op) => op.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('opportunities').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase opportunity delete failed', err);
      }
    }
  },
};
