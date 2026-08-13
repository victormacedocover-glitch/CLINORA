-- ====================================================================
-- CLINORA V1 — SUPABASE SCHEMA SQL & RLS POLICIES (AUDITADO E CORRIGIDO)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ====================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE CLÍNICAS (clinics)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PERFIS DE USUÁRIOS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'clinic_admin' CHECK (role IN ('super_admin', 'clinic_admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PAGAMENTOS (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    mercado_pago_payment_id VARCHAR(255),
    preference_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL DEFAULT 149.90,
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
    payment_method VARCHAR(100),
    external_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE DIREITOS DE ACESSO VITALÍCIO (access_entitlements)
CREATE TABLE IF NOT EXISTS public.access_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'lifetime' CHECK (access_type IN ('lifetime', 'trial', 'custom')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked', 'revoked', 'expired')),
    granted_at TIMESTAMP WITH TIME ZONE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_access UNIQUE (user_id)
);

-- 6. TABELA DE ASSINANÇAS / PLANOS (subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    mercadopago_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'expired', 'blocked')),
    plan VARCHAR(100) NOT NULL DEFAULT 'Clinora Pro - Vitalício',
    amount DECIMAL(10,2) NOT NULL DEFAULT 149.90,
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    started_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE PACIENTES (patients)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    birth_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE PROCEDIMENTOS (procedures)
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE CONSULTAS / AGENDA (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    procedure VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'concluido', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABELA DE ORÇAMENTOS (budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'recusado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABELA DE TRANSAÇÕES FINANCEIRAS (transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'pendente', 'cancelado')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABELA DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TABELA DE OPORTUNIDADES / LEADS (opportunities)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'novo_lead' CHECK (status IN ('novo_lead', 'contato', 'orcamento', 'negociacao', 'convertido', 'perdido')),
    value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABELAS DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinic_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- FUNÇÕES DE SUPORTE SECURITY DEFINER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Buscar do perfil do usuário (Leitura pura)
  SELECT clinic_id INTO v_clinic_id
  FROM public.profiles
  WHERE user_id = v_user_id AND clinic_id IS NOT NULL
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    RETURN v_clinic_id;
  END IF;

  -- 2. Fallback de leitura em access_entitlements (Sem INSERT/UPDATE)
  SELECT clinic_id INTO v_clinic_id
  FROM public.access_entitlements
  WHERE user_id = v_user_id AND clinic_id IS NOT NULL
  LIMIT 1;

  RETURN v_clinic_id;
END;
$$;

-- Função explícita para inicializar conta do usuário de forma idempotente e segura
CREATE OR REPLACE FUNCTION public.initialize_user_account()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clinic_id UUID;
  v_user_email TEXT;
  v_full_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 1. Verificar se já existe perfil com clinic_id
  SELECT clinic_id INTO v_clinic_id
  FROM public.profiles
  WHERE user_id = v_user_id AND clinic_id IS NOT NULL
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    RETURN v_clinic_id;
  END IF;

  -- 2. Verificar se já existe vínculo em access_entitlements
  SELECT clinic_id INTO v_clinic_id
  FROM public.access_entitlements
  WHERE user_id = v_user_id AND clinic_id IS NOT NULL
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    v_full_name := COALESCE(SPLIT_PART(v_user_email, '@', 1), 'Usuário');

    INSERT INTO public.profiles (user_id, clinic_id, full_name, email, role)
    VALUES (v_user_id, v_clinic_id, v_full_name, COALESCE(v_user_email, ''), 'clinic_admin')
    ON CONFLICT (user_id) DO UPDATE
    SET clinic_id = EXCLUDED.clinic_id,
        updated_at = NOW();

    RETURN v_clinic_id;
  END IF;

  -- 3. Obter e-mail para criar única clínica inicial
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_full_name := COALESCE(SPLIT_PART(v_user_email, '@', 1), 'Usuário');

  -- Criar clínica
  INSERT INTO public.clinics (name, phone, email, status)
  VALUES ('Clínica de ' || v_full_name, '(11) 99999-9999', COALESCE(v_user_email, ''), 'active')
  RETURNING id INTO v_clinic_id;

  -- Vincular no profile
  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, role)
  VALUES (v_user_id, v_clinic_id, v_full_name, COALESCE(v_user_email, ''), 'clinic_admin')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();

  -- Vincular em access_entitlements
  INSERT INTO public.access_entitlements (user_id, clinic_id, access_type, status)
  VALUES (v_user_id, v_clinic_id, 'lifetime', 'active')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      status = 'active',
      updated_at = NOW();

  RETURN v_clinic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_initial_clinic(
  p_name VARCHAR(255),
  p_phone VARCHAR(50),
  p_email VARCHAR(255),
  p_full_name VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
  v_clinic_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  INSERT INTO public.clinics (name, phone, email, status)
  VALUES (p_name, p_phone, p_email, 'active')
  RETURNING id INTO v_clinic_id;

  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, role)
  VALUES (v_user_id, v_clinic_id, p_full_name, p_email, 'clinic_admin')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();

  INSERT INTO public.access_entitlements (user_id, clinic_id, access_type, status)
  VALUES (v_user_id, v_clinic_id, 'lifetime', 'pending')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      updated_at = NOW();

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM ALL TABLES
-- ====================================================================
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- NOVAS POLÍTICAS RLS SEGURAS E ISOLADAS POR CLÍNICA
-- ====================================================================

-- 1. CLINICS
DROP POLICY IF EXISTS "clinics_select_policy" ON public.clinics;
DROP POLICY IF EXISTS "clinics_insert_policy" ON public.clinics;
DROP POLICY IF EXISTS "clinics_update_policy" ON public.clinics;
DROP POLICY IF EXISTS "clinics_delete_policy" ON public.clinics;
DROP POLICY IF EXISTS "Usuários acessam apenas sua própria clínica ou super admin" ON public.clinics;
DROP POLICY IF EXISTS "Permitir criacao e leitura de clinica para usuario autenticado" ON public.clinics;
DROP POLICY IF EXISTS "Permitir leitura e atualizacao de clinica vinculada ou super admin" ON public.clinics;
DROP POLICY IF EXISTS "Permitir insercao de clinica por usuario autenticado" ON public.clinics;
DROP POLICY IF EXISTS "Permitir edicao de clinica vinculada ou super admin" ON public.clinics;

CREATE POLICY "clinics_select_policy" ON public.clinics FOR SELECT
USING (id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "clinics_insert_policy" ON public.clinics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clinics_update_policy" ON public.clinics FOR UPDATE
USING (id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "clinics_delete_policy" ON public.clinics FOR DELETE
USING (public.is_super_admin());

-- 2. PROFILES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Usuários leem seus próprios perfis ou perfis da mesma clínica" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfil pelo proprio usuario ou super admin" ON public.profiles;
DROP POLICY IF EXISTS "Permitir insercao e edicao de perfil pelo proprio usuario ou super admin" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualizacao de perfil pelo proprio usuario ou super admin" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
USING (user_id = auth.uid() OR public.is_super_admin())
WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- 3. PAYMENTS
DROP POLICY IF EXISTS "payments_policy" ON public.payments;
DROP POLICY IF EXISTS "Usuários leem e registram seus próprios pagamentos" ON public.payments;
CREATE POLICY "payments_policy" ON public.payments FOR ALL
USING (user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 4. ACCESS ENTITLEMENTS
DROP POLICY IF EXISTS "access_entitlements_policy" ON public.access_entitlements;
DROP POLICY IF EXISTS "Usuários leem e atualizam seus próprios direitos de acesso" ON public.access_entitlements;
CREATE POLICY "access_entitlements_policy" ON public.access_entitlements FOR ALL
USING (user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 5. SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_policy" ON public.subscriptions;
CREATE POLICY "subscriptions_policy" ON public.subscriptions FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 6. PATIENTS
DROP POLICY IF EXISTS "RLS Patients Isolamento Por Clínica" ON public.patients;
DROP POLICY IF EXISTS "patients_select" ON public.patients;
DROP POLICY IF EXISTS "patients_insert" ON public.patients;
DROP POLICY IF EXISTS "patients_update" ON public.patients;
DROP POLICY IF EXISTS "patients_delete" ON public.patients;

CREATE POLICY "patients_select" ON public.patients FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "patients_insert" ON public.patients FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "patients_update" ON public.patients FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "patients_delete" ON public.patients FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 7. PROCEDURES
DROP POLICY IF EXISTS "RLS Procedures Isolamento Por Clínica" ON public.procedures;
DROP POLICY IF EXISTS "procedures_select" ON public.procedures;
DROP POLICY IF EXISTS "procedures_insert" ON public.procedures;
DROP POLICY IF EXISTS "procedures_update" ON public.procedures;
DROP POLICY IF EXISTS "procedures_delete" ON public.procedures;

CREATE POLICY "procedures_select" ON public.procedures FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "procedures_insert" ON public.procedures FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "procedures_update" ON public.procedures FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "procedures_delete" ON public.procedures FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 8. APPOINTMENTS
DROP POLICY IF EXISTS "RLS Appointments Isolamento Por Clínica" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 9. BUDGETS
DROP POLICY IF EXISTS "RLS Budgets Isolamento Por Clínica" ON public.budgets;
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;

CREATE POLICY "budgets_select" ON public.budgets FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 10. TRANSACTIONS
DROP POLICY IF EXISTS "RLS Transactions Isolamento Por Clínica" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 11. TASKS
DROP POLICY IF EXISTS "RLS Tasks Isolamento Por Clínica" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 12. OPPORTUNITIES
DROP POLICY IF EXISTS "RLS Opportunities Isolamento Por Clínica" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_select" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_insert" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_update" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_delete" ON public.opportunities;

CREATE POLICY "opportunities_select" ON public.opportunities FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "opportunities_insert" ON public.opportunities FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "opportunities_update" ON public.opportunities FOR UPDATE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin())
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "opportunities_delete" ON public.opportunities FOR DELETE
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 13. CLINIC AUDIT LOGS
DROP POLICY IF EXISTS "RLS Clinic Audit Logs Isolamento Por Clínica" ON public.clinic_audit_logs;
DROP POLICY IF EXISTS "clinic_audit_logs_select" ON public.clinic_audit_logs;
DROP POLICY IF EXISTS "clinic_audit_logs_insert" ON public.clinic_audit_logs;

CREATE POLICY "clinic_audit_logs_select" ON public.clinic_audit_logs FOR SELECT
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "clinic_audit_logs_insert" ON public.clinic_audit_logs FOR INSERT
WITH CHECK (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

-- 14. ADMIN AUDIT LOGS
DROP POLICY IF EXISTS "admin_audit_logs_policy" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_policy" ON public.admin_audit_logs FOR ALL
USING (public.is_super_admin() OR auth.uid() IS NOT NULL);
