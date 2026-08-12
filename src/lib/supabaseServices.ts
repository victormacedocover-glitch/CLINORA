import { supabase, isSupabaseConfigured } from './supabase';

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

export interface ClinicAuditLog {
  id: string;
  clinicId: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  createdAt: string;
}

// ============================================================================
// HELPER FOR ACTIVE USER & CLINIC ID RESOLUTION
// ============================================================================

let cachedClinicId: { userId: string; clinicId: string } | null = null;

export function clearClinicIdCache(): void {
  cachedClinicId = null;
}

export function getCurrentClinicId(): string | null {
  try {
    const stored = localStorage.getItem('clinora_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.user?.clinicId) {
        return parsed.user.clinicId;
      }
    }
  } catch (err) {
    console.error('Error reading current clinicId from session', err);
  }
  return null;
}

export async function getActiveClinicId(): Promise<string | null> {
  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (cachedClinicId && cachedClinicId.userId === user.id) {
          return cachedClinicId.clinicId;
        }

        // 1. Check profiles table for clinic_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.clinic_id) {
          // Verify that this clinic_id exists in clinics table
          const { data: cData } = await supabase
            .from('clinics')
            .select('id')
            .eq('id', profile.clinic_id)
            .maybeSingle();

          if (cData?.id) {
            cachedClinicId = { userId: user.id, clinicId: cData.id };
            return cData.id;
          }
        }

        // 2. Check access_entitlements table
        const { data: ent } = await supabase
          .from('access_entitlements')
          .select('clinic_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (ent?.clinic_id) {
          const { data: cData } = await supabase
            .from('clinics')
            .select('id')
            .eq('id', ent.clinic_id)
            .maybeSingle();

          if (cData?.id) {
            // Repair profile relationship
            await supabase.from('profiles').upsert(
              {
                user_id: user.id,
                clinic_id: cData.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                email: user.email || '',
                role: 'clinic_admin',
              },
              { onConflict: 'user_id' }
            );

            cachedClinicId = { userId: user.id, clinicId: cData.id };
            return cData.id;
          }
        }

        // 3. Auto-heal: User is authenticated but no clinic exists in `public.clinics`.
        // Automatically create clinic row for user and update profiles & access_entitlements.
        const clinicName =
          user.user_metadata?.clinic_name ||
          `Clínica de ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'Clinora'}`;
        const clinicPhone = user.user_metadata?.clinic_phone || '(11) 99999-9999';
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrador';

        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_initial_clinic', {
            p_name: clinicName,
            p_phone: clinicPhone,
            p_email: user.email || '',
            p_full_name: fullName,
          });

          if (!rpcErr && rpcRes) {
            const newCid = typeof rpcRes === 'string' ? rpcRes : rpcRes?.id || rpcRes?.clinic_id;
            if (newCid) {
              cachedClinicId = { userId: user.id, clinicId: newCid };
              return newCid;
            }
          }
        } catch (rErr) {
          console.warn('RPC create_initial_clinic fallback attempt:', rErr);
        }

        const { data: newClinic, error: createErr } = await supabase
          .from('clinics')
          .insert({
            name: clinicName,
            phone: clinicPhone,
            email: user.email || '',
            status: 'active',
          })
          .select('id')
          .single();

        if (!createErr && newClinic?.id) {
          await supabase.from('profiles').upsert(
            {
              user_id: user.id,
              clinic_id: newClinic.id,
              full_name: fullName,
              email: user.email || '',
              role: 'clinic_admin',
            },
            { onConflict: 'user_id' }
          );

          await supabase.from('access_entitlements').upsert(
            {
              user_id: user.id,
              clinic_id: newClinic.id,
              access_type: 'lifetime',
              status: 'active',
            },
            { onConflict: 'user_id' }
          );

          cachedClinicId = { userId: user.id, clinicId: newClinic.id };
          return newClinic.id;
        }
      }
    } catch (err) {
      console.warn('Error fetching or repairing active clinic id from Supabase:', err);
    }
  }

  return getCurrentClinicId();
}

function getStorageKey(entity: string, clinicId?: string): string {
  const cid = clinicId || getCurrentClinicId() || 'demo';
  return `clinora_${entity}_${cid}`;
}

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

function getLocalItems<T extends { id: string }>(key: string): T[] {
  try {
    const deleted = getDeletedIds();
    const item = localStorage.getItem(key);
    if (!item) return [];
    const parsed = JSON.parse(item) as T[];
    return parsed.filter((i) => !deleted.has(i.id));
  } catch {
    return [];
  }
}

function setLocalItems<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('clinora_data_changed'));
    }
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// ============================================================================
// SERVIÇOS DO SUPABASE & REAL-TIME LOCAL ENGINE (PERSISTÊNCIA REAL)
// ============================================================================

export const supabaseServices = {
  // AUDIT LOGS DA CLÍNICA
  async logClinicAction(action: string, details?: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return;

    const newLog: ClinicAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      clinicId: activeClinicId,
      action,
      details,
      createdAt: new Date().toISOString(),
    };

    const key = getStorageKey('audit_logs', activeClinicId);
    const existing = getLocalItems<ClinicAuditLog>(key);
    setLocalItems(key, [newLog, ...existing]);

    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('clinic_audit_logs').insert({
          clinic_id: activeClinicId,
          user_id: userData.user?.id || null,
          user_name: userData.user?.email || 'Usuário Clínica',
          action,
          details,
        });
      } catch (err) {
        console.warn('Failed to insert clinic_audit_log into Supabase:', err);
      }
    }
  },

  async getClinicAuditLogs(clinicId?: string): Promise<ClinicAuditLog[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('audit_logs', activeClinicId);
    const local = getLocalItems<ClinicAuditLog>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('clinic_audit_logs')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: ClinicAuditLog[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            userId: d.user_id,
            userName: d.user_name,
            action: d.action,
            details: d.details,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Failed to fetch clinic_audit_logs from Supabase:', err);
      }
    }

    return local;
  },

  // PACIENTES
  async getPatients(clinicId?: string): Promise<Patient[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('patients', activeClinicId);
    const local = getLocalItems<Patient>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: Patient[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            name: d.name,
            email: d.email || undefined,
            phone: d.phone || undefined,
            birthDate: d.birth_date || undefined,
            notes: d.notes || undefined,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch patients failed:', err);
      }
    }
    return local;
  },

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>, clinicId?: string): Promise<Patient> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Identificação da clínica não encontrada.');

    let createdPatient: Patient | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          clinic_id: activeClinicId,
          name: patient.name,
          email: patient.email || null,
          phone: patient.phone || null,
          birth_date: patient.birthDate || null,
          notes: patient.notes || null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao salvar paciente no banco:', error);
        throw new Error(`Não foi possível cadastrar o paciente. Motivo: ${error.message || 'Erro no banco'}`);
      }

      if (data) {
        createdPatient = {
          id: data.id,
          clinicId: data.clinic_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          birthDate: data.birth_date || undefined,
          notes: data.notes || undefined,
          createdAt: data.created_at,
        };
      }
    }

    if (!createdPatient) {
      createdPatient = {
        ...patient,
        clinicId: activeClinicId,
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('patients', activeClinicId);
    const current = getLocalItems<Patient>(key);
    setLocalItems(key, [createdPatient, ...current]);

    await this.logClinicAction('Novo Paciente Cadastrado', `Paciente: ${patient.name}`, activeClinicId);
    return createdPatient;
  },

  async updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'clinicId' | 'createdAt'>>, clinicId?: string): Promise<Patient> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: updates.name,
          email: updates.email || null,
          phone: updates.phone || null,
          birth_date: updates.birthDate || null,
          notes: updates.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('clinic_id', activeClinicId)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar paciente no Supabase:', error);
        throw new Error(`Não foi possível atualizar o paciente. Motivo: ${error.message}`);
      }

      if (data) {
        const updated: Patient = {
          id: data.id,
          clinicId: data.clinic_id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          birthDate: data.birth_date || undefined,
          notes: data.notes || undefined,
          createdAt: data.created_at,
        };

        const key = getStorageKey('patients', activeClinicId);
        const current = getLocalItems<Patient>(key);
        setLocalItems(key, current.map((p) => (p.id === id ? updated : p)));
        await this.logClinicAction('Paciente Atualizado', `Paciente: ${updated.name}`, activeClinicId);
        return updated;
      }
    }

    const key = getStorageKey('patients', activeClinicId);
    const current = getLocalItems<Patient>(key);
    const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setLocalItems(key, updated);
    return updated.find((p) => p.id === id)!;
  },

  async deletePatient(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir paciente no Supabase:', error);
        throw new Error(`Não foi possível excluir o paciente. Motivo: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('patients', activeClinicId);
      const current = getLocalItems<Patient>(key);
      setLocalItems(key, current.filter((p) => p.id !== id));
      await this.logClinicAction('Paciente Excluído', `ID do Paciente: ${id}`, activeClinicId);
    }
  },

  // PROCEDIMENTOS
  async getProcedures(clinicId?: string): Promise<ProcedureItem[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('procedures', activeClinicId);
    const local = getLocalItems<ProcedureItem>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('procedures')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            name: d.name,
            price: Number(d.price),
            duration: d.duration,
            active: d.active,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch procedures failed:', err);
      }
    }
    return local;
  },

  async createProcedure(proc: Omit<ProcedureItem, 'id' | 'createdAt'>, clinicId?: string): Promise<ProcedureItem> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdProc: ProcedureItem | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('procedures')
        .insert({
          clinic_id: activeClinicId,
          name: proc.name,
          price: proc.price,
          duration: proc.duration,
          active: proc.active,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao salvar procedimento:', error);
        throw new Error(`Não foi possível cadastrar o procedimento: ${error.message}`);
      }

      if (data) {
        createdProc = {
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

    if (!createdProc) {
      createdProc = {
        ...proc,
        clinicId: activeClinicId,
        id: 'pr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('procedures', activeClinicId);
    const current = getLocalItems<ProcedureItem>(key);
    setLocalItems(key, [createdProc, ...current]);

    await this.logClinicAction('Novo Procedimento Cadastrado', `Procedimento: ${proc.name}`, activeClinicId);
    return createdProc;
  },

  async deleteProcedure(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('procedures').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir procedimento:', error);
        throw new Error(`Não foi possível excluir o procedimento: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('procedures', activeClinicId);
      const current = getLocalItems<ProcedureItem>(key);
      setLocalItems(key, current.filter((p) => p.id !== id));
      await this.logClinicAction('Procedimento Excluído', `ID: ${id}`, activeClinicId);
    }
  },

  // CONSULTAS (AGENDA)
  async getAppointments(clinicId?: string): Promise<Appointment[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('appointments', activeClinicId);
    const local = getLocalItems<Appointment>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, patients(name)')
          .eq('clinic_id', activeClinicId)
          .order('date', { ascending: true });

        if (!error && data) {
          const mapped: Appointment[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientId: d.patient_id || undefined,
            patientName: d.patients?.name || d.patient_name || d.notes?.split('\n')[0] || 'Paciente',
            date: d.date,
            time: d.time,
            procedure: d.procedure,
            status: d.status,
            notes: d.notes || undefined,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch appointments failed:', err);
      }
    }
    return local;
  },

  async createAppointment(app: Omit<Appointment, 'id' | 'createdAt'>, clinicId?: string): Promise<Appointment> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdApp: Appointment | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: activeClinicId,
          patient_id: app.patientId || null,
          date: app.date,
          time: app.time,
          procedure: app.procedure,
          status: app.status,
          notes: app.notes ? `${app.patientName}\n${app.notes}` : app.patientName,
        })
        .select('*, patients(name)')
        .single();

      if (error) {
        console.error('Erro ao agendar consulta:', error);
        throw new Error(`Não foi possível agendar a consulta: ${error.message}`);
      }

      if (data) {
        createdApp = {
          id: data.id,
          clinicId: data.clinic_id,
          patientId: data.patient_id || undefined,
          patientName: data.patients?.name || app.patientName,
          date: data.date,
          time: data.time,
          procedure: data.procedure,
          status: data.status,
          notes: data.notes || undefined,
          createdAt: data.created_at,
        };
      }
    }

    if (!createdApp) {
      createdApp = {
        ...app,
        clinicId: activeClinicId,
        id: 'a_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('appointments', activeClinicId);
    const current = getLocalItems<Appointment>(key);
    setLocalItems(key, [createdApp, ...current]);

    await this.logClinicAction('Consulta Agendada', `Paciente: ${app.patientName} - Data: ${app.date} ${app.time}`, activeClinicId);
    return createdApp;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status'], clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar status da consulta:', error);
        throw new Error(`Não foi possível atualizar o status: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('appointments', activeClinicId);
      const current = getLocalItems<Appointment>(key);
      setLocalItems(key, current.map((a) => (a.id === id ? { ...a, status } : a)));
      await this.logClinicAction('Status da Consulta Alterado', `ID: ${id} -> Status: ${status}`, activeClinicId);
    }
  },

  async deleteAppointment(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir consulta:', error);
        throw new Error(`Não foi possível excluir a consulta: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('appointments', activeClinicId);
      const current = getLocalItems<Appointment>(key);
      setLocalItems(key, current.filter((a) => a.id !== id));
      await this.logClinicAction('Consulta Excluída', `ID: ${id}`, activeClinicId);
    }
  },

  // ORÇAMENTOS
  async getBudgets(clinicId?: string): Promise<Budget[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('budgets', activeClinicId);
    const local = getLocalItems<Budget>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*, patients(name)')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: Budget[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientId: d.patient_id || undefined,
            patientName: d.patients?.name || d.patient_name || 'Paciente',
            description: d.description,
            amount: Number(d.amount),
            status: d.status,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch budgets failed:', err);
      }
    }
    return local;
  },

  async createBudget(b: Omit<Budget, 'id' | 'createdAt'>, clinicId?: string): Promise<Budget> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdBudget: Budget | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          clinic_id: activeClinicId,
          patient_id: b.patientId || null,
          description: b.description,
          amount: b.amount,
          status: b.status,
        })
        .select('*, patients(name)')
        .single();

      if (error) {
        console.error('Erro ao criar orçamento:', error);
        throw new Error(`Não foi possível criar o orçamento: ${error.message}`);
      }

      if (data) {
        createdBudget = {
          id: data.id,
          clinicId: data.clinic_id,
          patientId: data.patient_id || undefined,
          patientName: data.patients?.name || b.patientName,
          description: data.description,
          amount: Number(data.amount),
          status: data.status,
          createdAt: data.created_at,
        };
      }
    }

    if (!createdBudget) {
      createdBudget = {
        ...b,
        clinicId: activeClinicId,
        id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('budgets', activeClinicId);
    const current = getLocalItems<Budget>(key);
    setLocalItems(key, [createdBudget, ...current]);

    await this.logClinicAction('Novo Orçamento Criado', `Paciente: ${b.patientName} - Valor: R$ ${b.amount}`, activeClinicId);
    return createdBudget;
  },

  async updateBudgetStatus(id: string, status: Budget['status'], clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('budgets').update({ status }).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar status do orçamento:', error);
        throw new Error(`Não foi possível atualizar o orçamento: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('budgets', activeClinicId);
      const current = getLocalItems<Budget>(key);
      setLocalItems(key, current.map((b) => (b.id === id ? { ...b, status } : b)));
      await this.logClinicAction('Status do Orçamento Atualizado', `ID: ${id} -> Status: ${status}`, activeClinicId);
    }
  },

  async deleteBudget(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir orçamento:', error);
        throw new Error(`Não foi possível excluir o orçamento: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('budgets', activeClinicId);
      const current = getLocalItems<Budget>(key);
      setLocalItems(key, current.filter((b) => b.id !== id));
      await this.logClinicAction('Orçamento Excluído', `ID: ${id}`, activeClinicId);
    }
  },

  // TRANSAÇÕES FINANCEIRAS
  async getTransactions(clinicId?: string): Promise<Transaction[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('transactions', activeClinicId);
    const local = getLocalItems<Transaction>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('date', { ascending: false });

        if (!error && data) {
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
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch transactions failed:', err);
      }
    }
    return local;
  },

  async createTransaction(t: Omit<Transaction, 'id' | 'createdAt'>, clinicId?: string): Promise<Transaction> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdT: Transaction | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          clinic_id: activeClinicId,
          description: t.description,
          type: t.type,
          amount: t.amount,
          status: t.status,
          date: t.date,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao registrar transação:', error);
        throw new Error(`Não foi possível salvar a transação: ${error.message}`);
      }

      if (data) {
        createdT = {
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

    if (!createdT) {
      createdT = {
        ...t,
        clinicId: activeClinicId,
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('transactions', activeClinicId);
    const current = getLocalItems<Transaction>(key);
    setLocalItems(key, [createdT, ...current]);

    await this.logClinicAction('Nova Transação Financeira', `${t.type === 'receita' ? 'Receita' : 'Despesa'}: ${t.description}`, activeClinicId);
    return createdT;
  },

  async deleteTransaction(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir transação:', error);
        throw new Error(`Não foi possível excluir a transação: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('transactions', activeClinicId);
      const current = getLocalItems<Transaction>(key);
      setLocalItems(key, current.filter((t) => t.id !== id));
      await this.logClinicAction('Transação Financeira Excluída', `ID: ${id}`, activeClinicId);
    }
  },

  // TAREFAS
  async getTasks(clinicId?: string): Promise<Task[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('tasks', activeClinicId);
    const local = getLocalItems<Task>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: Task[] = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            title: d.title,
            description: d.description || undefined,
            status: d.status,
            dueDate: d.due_date || undefined,
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch tasks failed:', err);
      }
    }
    return local;
  },

  async createTask(t: Omit<Task, 'id' | 'createdAt'>, clinicId?: string): Promise<Task> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdTask: Task | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          clinic_id: activeClinicId,
          title: t.title,
          description: t.description || null,
          status: t.status,
          due_date: t.dueDate || null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        throw new Error(`Não foi possível criar a tarefa: ${error.message}`);
      }

      if (data) {
        createdTask = {
          id: data.id,
          clinicId: data.clinic_id,
          title: data.title,
          description: data.description || undefined,
          status: data.status,
          dueDate: data.due_date || undefined,
          createdAt: data.created_at,
        };
      }
    }

    if (!createdTask) {
      createdTask = {
        ...t,
        clinicId: activeClinicId,
        id: 'tk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('tasks', activeClinicId);
    const current = getLocalItems<Task>(key);
    setLocalItems(key, [createdTask, ...current]);

    await this.logClinicAction('Nova Tarefa Criada', `Título: ${t.title}`, activeClinicId);
    return createdTask;
  },

  async updateTaskStatus(id: string, status: Task['status'], clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw new Error(`Não foi possível atualizar a tarefa: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('tasks', activeClinicId);
      const current = getLocalItems<Task>(key);
      setLocalItems(key, current.map((t) => (t.id === id ? { ...t, status } : t)));
      await this.logClinicAction('Status da Tarefa Atualizado', `ID: ${id} -> Status: ${status}`, activeClinicId);
    }
  },

  async deleteTask(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        throw new Error(`Não foi possível excluir a tarefa: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('tasks', activeClinicId);
      const current = getLocalItems<Task>(key);
      setLocalItems(key, current.filter((t) => t.id !== id));
      await this.logClinicAction('Tarefa Excluída', `ID: ${id}`, activeClinicId);
    }
  },

  // OPORTUNIDADES (LEADS & FUNIL)
  async getOpportunities(clinicId?: string): Promise<Opportunity[]> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) return [];

    const key = getStorageKey('opportunities', activeClinicId);
    const local = getLocalItems<Opportunity>(key);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('clinic_id', activeClinicId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            clinicId: d.clinic_id,
            patientName: d.patient_name || d.title || 'Lead Contact',
            title: d.title,
            status: d.status,
            value: Number(d.value),
            createdAt: d.created_at,
          }));
          setLocalItems(key, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch opportunities failed:', err);
      }
    }
    return local;
  },

  async createOpportunity(op: Omit<Opportunity, 'id' | 'createdAt'>, clinicId?: string): Promise<Opportunity> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    if (!activeClinicId) throw new Error('Clínica não identificada');

    let createdOp: Opportunity | null = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          clinic_id: activeClinicId,
          title: op.title,
          status: op.status,
          value: op.value,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar oportunidade:', error);
        throw new Error(`Não foi possível salvar a oportunidade: ${error.message}`);
      }

      if (data) {
        createdOp = {
          id: data.id,
          clinicId: data.clinic_id,
          patientName: op.patientName || data.title,
          title: data.title,
          status: data.status,
          value: Number(data.value),
          createdAt: data.created_at,
        };
      }
    }

    if (!createdOp) {
      createdOp = {
        ...op,
        clinicId: activeClinicId,
        id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
    }

    const key = getStorageKey('opportunities', activeClinicId);
    const current = getLocalItems<Opportunity>(key);
    setLocalItems(key, [createdOp, ...current]);

    await this.logClinicAction('Nova Oportunidade Criada', `Título: ${op.title}`, activeClinicId);
    return createdOp;
  },

  async updateOpportunityStatus(id: string, status: Opportunity['status'], clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('opportunities').update({ status }).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar oportunidade:', error);
        throw new Error(`Não foi possível atualizar a oportunidade: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('opportunities', activeClinicId);
      const current = getLocalItems<Opportunity>(key);
      setLocalItems(key, current.map((op) => (op.id === id ? { ...op, status } : op)));
      await this.logClinicAction('Etapa do Funil Atualizada', `ID: ${id} -> Status: ${status}`, activeClinicId);
    }
  },

  async deleteOpportunity(id: string, clinicId?: string): Promise<void> {
    const activeClinicId = clinicId || (await getActiveClinicId());
    addDeletedId(id);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir oportunidade:', error);
        throw new Error(`Não foi possível excluir a oportunidade: ${error.message}`);
      }
    }

    if (activeClinicId) {
      const key = getStorageKey('opportunities', activeClinicId);
      const current = getLocalItems<Opportunity>(key);
      setLocalItems(key, current.filter((op) => op.id !== id));
      await this.logClinicAction('Oportunidade Excluída', `ID: ${id}`, activeClinicId);
    }
  },
};
