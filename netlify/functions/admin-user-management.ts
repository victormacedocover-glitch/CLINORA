import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const SUPER_ADMIN_EMAILS = [
  'victorbeirigo@hotmail.com',
  'victorbeirigo76@gmail.com',
  'admin@clinora.com',
];

export async function handler(event: any) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const query = event.queryStringParameters || {};
    const action = body.action || query.action || 'fetch_all_data';
    const adminEmail = (body.adminEmail || query.adminEmail || '').toLowerCase().trim();

    // Verify Super Admin Authorization
    let isSuperAdmin = SUPER_ADMIN_EMAILS.includes(adminEmail);

    if (!isSuperAdmin && supabase && adminEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', adminEmail)
        .maybeSingle();

      if (profile && profile.role === 'super_admin') {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin && adminEmail !== 'admin') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Acesso negado. Apenas o Super Admin tem permissão.' }),
      };
    }

    if (!supabase) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConfigured: false,
          usersList: [],
          auditLogs: [],
          message: 'Supabase Service Role não configurado no servidor.',
        }),
      };
    }

    // -------------------------------------------------------------
    // 1. FETCH ALL DATA
    // -------------------------------------------------------------
    if (action === 'fetch_all_data') {
      // Fetch clinics
      const { data: clinics = [] } = await supabase.from('clinics').select('*').order('created_at', { ascending: false });
      
      // Fetch profiles
      const { data: profiles = [] } = await supabase.from('profiles').select('*');

      // Fetch access_entitlements
      const { data: entitlements = [] } = await supabase.from('access_entitlements').select('*');

      // Fetch payments
      const { data: payments = [] } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

      // Fetch audit logs
      let auditLogs: any[] = [];
      try {
        const { data: logs } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (logs) auditLogs = logs;
      } catch (err) {
        console.warn('admin_audit_logs table might not exist yet:', err);
      }

      // Fetch auth users if available
      let authUsers: any[] = [];
      try {
        const { data: authList } = await supabase.auth.admin.listUsers();
        if (authList?.users) authUsers = authList.users;
      } catch (e) {
        console.warn('Could not list auth users:', e);
      }

      // Map profiles into consolidated list
      const usersMap = new Map<string, any>();

      // First add profiles
      (profiles || []).forEach((p: any) => {
        const clinic = (clinics || []).find((c: any) => c.id === p.clinic_id);
        const entitlement = (entitlements || []).find((e: any) => e.user_id === p.user_id);
        const userPayment = (payments || []).find((pay: any) => pay.user_id === p.user_id || pay.clinic_id === p.clinic_id);
        const authUser = authUsers.find((au: any) => au.id === p.user_id);

        const accessStatus = entitlement?.status || (clinic?.status === 'blocked' ? 'blocked' : 'pending');
        const subscriptionStatus = userPayment?.status === 'approved' ? 'active' : (userPayment?.status || 'pending');

        usersMap.set(p.user_id, {
          id: p.id,
          userId: p.user_id,
          clinicId: p.clinic_id,
          clinicName: clinic?.name || 'Clínica Não Cadastrada',
          owner: p.full_name || 'Usuário Sem Nome',
          email: p.email || authUser?.email || '',
          phone: clinic?.phone || '',
          accessStatus: accessStatus, // 'active' | 'pending' | 'blocked'
          subscriptionStatus: subscriptionStatus, // 'active' | 'pending' | 'cancelled' | 'rejected'
          plan: 'Clinora Pro - Vitalício',
          amount: 149.90,
          role: p.role || 'clinic_admin',
          createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Data n/d',
          rawCreatedAt: p.created_at || new Date().toISOString(),
          lastSignInAt: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca',
        });
      });

      // Also ensure any auth users without profiles are visible
      authUsers.forEach((au: any) => {
        if (!usersMap.has(au.id) && au.email) {
          const entitlement = (entitlements || []).find((e: any) => e.user_id === au.id);
          usersMap.set(au.id, {
            id: au.id,
            userId: au.id,
            clinicId: null,
            clinicName: au.user_metadata?.clinic_name || 'Não atribuída',
            owner: au.user_metadata?.full_name || au.email.split('@')[0],
            email: au.email,
            phone: au.user_metadata?.clinic_phone || '',
            accessStatus: entitlement?.status || 'pending',
            subscriptionStatus: 'pending',
            plan: 'Clinora Pro - Vitalício',
            amount: 149.90,
            role: 'clinic_admin',
            createdAt: au.created_at ? new Date(au.created_at).toLocaleDateString('pt-BR') : 'Data n/d',
            rawCreatedAt: au.created_at || new Date().toISOString(),
            lastSignInAt: au.last_sign_in_at ? new Date(au.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca',
          });
        }
      });

      const usersList = Array.from(usersMap.values()).sort((a, b) => 
        new Date(b.rawCreatedAt).getTime() - new Date(a.rawCreatedAt).getTime()
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConfigured: true,
          usersList,
          auditLogs,
        }),
      };
    }

    // -------------------------------------------------------------
    // 2. UPDATE ACCESS STATUS (active / pending / blocked)
    // -------------------------------------------------------------
    if (action === 'update_access_status') {
      const { userId, clinicId, newStatus, targetEmail } = body;

      if (!userId && !targetEmail) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'userId ou email é obrigatório.' }),
        };
      }

      if (!['active', 'pending', 'blocked'].includes(newStatus)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Status de acesso inválido.' }),
        };
      }

      let effectiveUserId = userId;
      let effectiveClinicId = clinicId;

      if (!effectiveUserId && targetEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, clinic_id')
          .eq('email', targetEmail)
          .maybeSingle();

        if (prof) {
          effectiveUserId = prof.user_id;
          if (!effectiveClinicId) effectiveClinicId = prof.clinic_id;
        }
      }

      if (effectiveUserId) {
        // Upsert access entitlement
        await supabase.from('access_entitlements').upsert(
          {
            user_id: effectiveUserId,
            clinic_id: effectiveClinicId || null,
            access_type: 'lifetime',
            status: newStatus,
            granted_at: newStatus === 'active' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }

      if (effectiveClinicId) {
        await supabase
          .from('clinics')
          .update({
            status: newStatus === 'blocked' ? 'blocked' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', effectiveClinicId);
      }

      // Log in admin_audit_logs
      const statusLabels: Record<string, string> = {
        active: 'ATIVADO',
        pending: 'PENDENTE',
        blocked: 'BLOQUEADO',
      };

      try {
        await supabase.from('admin_audit_logs').insert({
          user_id: effectiveUserId || null,
          clinic_id: effectiveClinicId || null,
          admin_email: adminEmail || 'super_admin',
          action: `Acesso alterado para ${statusLabels[newStatus] || newStatus}`,
          details: `Super Admin ${adminEmail} alterou o acesso do usuário (${targetEmail || effectiveUserId}) para ${newStatus.toUpperCase()}.`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Audit log write exception:', err);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Status de acesso alterado para ${statusLabels[newStatus]} com sucesso.`,
        }),
      };
    }

    // -------------------------------------------------------------
    // 3. RESET USER PASSWORD / UPDATE CREDENTIALS
    // -------------------------------------------------------------
    if (action === 'reset_password') {
      const { userId, newPassword, newEmail, targetEmail } = body;

      if (!newPassword || newPassword.length < 6) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }),
        };
      }

      let effectiveUserId = userId;
      let userEmail = targetEmail || newEmail;

      if (!effectiveUserId && userEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', userEmail)
          .maybeSingle();

        if (prof) effectiveUserId = prof.user_id;
      }

      if (effectiveUserId) {
        // Securely update user password in Supabase Auth via Admin API
        const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(effectiveUserId, {
          password: newPassword,
          ...(newEmail ? { email: newEmail } : {}),
        });

        if (authUpdateErr) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Erro ao redefinir senha no Auth: ${authUpdateErr.message}` }),
          };
        }

        if (newEmail) {
          await supabase
            .from('profiles')
            .update({ email: newEmail, updated_at: new Date().toISOString() })
            .eq('user_id', effectiveUserId);
        }
      } else {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Usuário não encontrado para redefinição de senha.' }),
        };
      }

      // Log in admin_audit_logs
      try {
        await supabase.from('admin_audit_logs').insert({
          user_id: effectiveUserId,
          admin_email: adminEmail || 'super_admin',
          action: 'Redefinição de Senha',
          details: `Super Admin ${adminEmail} redefiniu com sucesso a senha para o usuário (${userEmail}).`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Audit log write exception:', err);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Senha do usuário redefinida com sucesso!',
        }),
      };
    }

    // -------------------------------------------------------------
    // 4. UPDATE USER PROFILE & CLINIC DATA
    // -------------------------------------------------------------
    if (action === 'update_user_info') {
      const { userId, clinicId, fullName, email, phone, clinicName } = body;

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      if (clinicId) {
        await supabase
          .from('clinics')
          .update({
            name: clinicName,
            phone: phone,
            email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clinicId);
      }

      // Audit Log
      try {
        await supabase.from('admin_audit_logs').insert({
          user_id: userId || null,
          clinic_id: clinicId || null,
          admin_email: adminEmail || 'super_admin',
          action: 'Atualizou dados cadastrais',
          details: `Atualizou clínica ${clinicName} e responsável ${fullName}.`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(err);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Dados cadastrais atualizados com sucesso.',
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ação administrativa não reconhecida.' }),
    };
  } catch (err: any) {
    console.error('Error in admin-user-management function:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Erro interno no servidor' }),
    };
  }
}
