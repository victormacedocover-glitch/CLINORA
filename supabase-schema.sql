-- ====================================================================
-- CLINORA V1 — SUPABASE SCHEMA SQL & RLS POLICIES
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

-- 6. TABELA DE ASSINANÇAS / PLANOS (subscriptions - legado/compatibilidade)
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

-- 5. TABELA DE PACIENTES (patients)
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

-- 6. TABELA DE PROCEDIMENTOS (procedures)
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration INTEGER DEFAULT 30, -- minutos
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE CONSULTAS / AGENDA (appointments)
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

-- 8. TABELA DE ORÇAMENTOS (budgets)
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

-- 9. TABELA DE TRANSAÇÕES FINANCEIRAS (transactions)
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

-- 10. TABELA DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABELA DE OPORTUNIDADES / LEADS (opportunities)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'novo_lead' CHECK (status IN ('novo_lead', 'contato', 'orcamento', 'negociacao', 'convertido', 'perdido')),
    value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABELA DE LOGS DE AUDITORIA ADMINISTRATIVA (admin_audit_logs)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TABELA DE LOGS DE AUDITORIA DA CLÍNICA (clinic_audit_logs)
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
-- HELPER FUNCTION PARA AUXILIAR NO ISOLAMENTO RLS E CRIAÇÃO DE CLÍNICA
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

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

  -- Criar clínica
  INSERT INTO public.clinics (name, phone, email, status)
  VALUES (p_name, p_phone, p_email, 'active')
  RETURNING id INTO v_clinic_id;

  -- Criar ou atualizar perfil do usuário como clinic_admin
  INSERT INTO public.profiles (user_id, clinic_id, full_name, email, role)
  VALUES (v_user_id, v_clinic_id, p_full_name, p_email, 'clinic_admin')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();

  -- Criar entitlement pendente
  INSERT INTO public.access_entitlements (user_id, clinic_id, access_type, status)
  VALUES (v_user_id, v_clinic_id, 'lifetime', 'pending')
  ON CONFLICT (user_id) DO UPDATE
  SET clinic_id = EXCLUDED.clinic_id,
      updated_at = NOW();

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ATIVANDO ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
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

-- POLÍTICAS RLS - CLINICS
CREATE POLICY "Usuários acessam apenas sua própria clínica ou super admin"
ON public.clinics FOR ALL
USING (
  id = public.get_user_clinic_id() OR public.is_super_admin()
);

-- POLÍTICAS RLS - PROFILES
CREATE POLICY "Usuários leem seus próprios perfis ou perfis da mesma clínica"
ON public.profiles FOR ALL
USING (
  user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin()
);

-- POLÍTICAS RLS - PAYMENTS
CREATE POLICY "Usuários leem seus próprios pagamentos"
ON public.payments FOR SELECT
USING (
  user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin()
);

-- POLÍTICAS RLS - ACCESS ENTITLEMENTS
CREATE POLICY "Usuários leem seus próprios direitos de acesso"
ON public.access_entitlements FOR SELECT
USING (
  user_id = auth.uid() OR clinic_id = public.get_user_clinic_id() OR public.is_super_admin()
);

-- POLÍTICAS RLS - SUBSCRIPTIONS
CREATE POLICY "Usuários leem a assinatura de sua clínica"
ON public.subscriptions FOR SELECT
USING (
  clinic_id = public.get_user_clinic_id() OR public.is_super_admin()
);

-- POLÍTICAS RLS - DEMAIS TABELAS (patients, procedures, appointments, budgets, transactions, tasks, opportunities)
CREATE POLICY "RLS Patients Isolamento Por Clínica" ON public.patients FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Procedures Isolamento Por Clínica" ON public.procedures FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Appointments Isolamento Por Clínica" ON public.appointments FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Budgets Isolamento Por Clínica" ON public.budgets FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Transactions Isolamento Por Clínica" ON public.transactions FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Tasks Isolamento Por Clínica" ON public.tasks FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Opportunities Isolamento Por Clínica" ON public.opportunities FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());

CREATE POLICY "RLS Clinic Audit Logs Isolamento Por Clínica" ON public.clinic_audit_logs FOR ALL
USING (clinic_id = public.get_user_clinic_id() OR public.is_super_admin());
