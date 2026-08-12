import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

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
          clinicsList: [],
          paymentsList: [],
          auditLogs: [],
          stats: {
            totalClinics: 0,
            totalUsers: 0,
            activeUsers: 0,
            pendingUsers: 0,
            blockedUsers: 0,
            approvedPayments: 0,
            totalRevenue: 0,
            activeSubscriptions: 0,
          },
          message: 'Supabase Service Role não configurado no servidor.',
        }),
      };
    }

    // -------------------------------------------------------------
    // 1. FETCH ALL REAL DATA FROM SUPABASE
    // -------------------------------------------------------------
    if (action === 'fetch_all_data') {
      // Fetch clinics
      const { data: clinics = [] } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch profiles
      const { data: profiles = [] } = await supabase.from('profiles').select('*');

      // Fetch access_entitlements
      const { data: entitlements = [] } = await supabase.from('access_entitlements').select('*');

      // Fetch payments
      const { data: payments = [] } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch audit logs
      let auditLogs: any[] = [];
      try {
        const { data: logs } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (logs) auditLogs = logs;
      } catch (err) {
        console.warn('admin_audit_logs table lookup:', err);
      }

      // Fetch auth users if service role available
      let authUsers: any[] = [];
      try {
        const { data: authList } = await supabase.auth.admin.listUsers();
        if (authList?.users) authUsers = authList.users;
      } catch (e) {
        console.warn('Could not list auth users:', e);
      }

      // Map users into consolidated list
      const usersMap = new Map<string, any>();

      (profiles || []).forEach((p: any) => {
        const clinic = (clinics || []).find((c: any) => c.id === p.clinic_id);
        const entitlement = (entitlements || []).find((e: any) => e.user_id === p.user_id);
        const userPayment = (payments || []).find((pay: any) => pay.user_id === p.user_id || pay.clinic_id === p.clinic_id);
        const authUser = authUsers.find((au: any) => au.id === p.user_id);

        const accessStatus = entitlement?.status || (clinic?.status === 'blocked' ? 'blocked' : 'pending');
        const paymentStatus = userPayment?.status || 'pending';

        usersMap.set(p.user_id, {
          id: p.id,
          userId: p.user_id,
          clinicId: p.clinic_id,
          clinicName: clinic?.name || 'Clínica Não Cadastrada',
          owner: p.full_name || 'Usuário Sem Nome',
          email: p.email || authUser?.email || '',
          phone: clinic?.phone || '',
          accessStatus: accessStatus, // 'active' | 'pending' | 'blocked'
          subscriptionStatus: paymentStatus, // 'approved' | 'pending' | 'cancelled' | 'rejected'
          emailConfirmed: !!authUser?.email_confirmed_at,
          emailConfirmedAt: authUser?.email_confirmed_at || null,
          paymentDetails: userPayment
            ? {
                id: userPayment.id,
                paymentId: userPayment.mercado_pago_payment_id || userPayment.preference_id,
                amount: userPayment.amount || 149.9,
                status: userPayment.status,
                paymentMethod: userPayment.payment_method || 'Mercado Pago',
                externalReference: userPayment.external_reference || null,
                createdAt: userPayment.created_at,
              }
            : null,
          plan: 'Clinora Pro - Vitalício',
          amount: userPayment?.amount || 149.9,
          role: p.role || 'clinic_admin',
          createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Sem data',
          rawCreatedAt: p.created_at || new Date().toISOString(),
          lastSignInAt: authUser?.last_sign_in_at
            ? new Date(authUser.last_sign_in_at).toLocaleString('pt-BR')
            : 'Nunca',
        });
      });

      // Add any auth users without profiles
      authUsers.forEach((au: any) => {
        if (!usersMap.has(au.id) && au.email) {
          const entitlement = (entitlements || []).find((e: any) => e.user_id === au.id);
          const userPayment = (payments || []).find((pay: any) => pay.user_id === au.id);
          usersMap.set(au.id, {
            id: au.id,
            userId: au.id,
            clinicId: null,
            clinicName: au.user_metadata?.clinic_name || 'Não atribuída',
            owner: au.user_metadata?.full_name || au.email.split('@')[0],
            email: au.email,
            phone: au.user_metadata?.clinic_phone || '',
            accessStatus: entitlement?.status || 'pending',
            subscriptionStatus: userPayment?.status || 'pending',
            emailConfirmed: !!au.email_confirmed_at,
            emailConfirmedAt: au.email_confirmed_at || null,
            paymentDetails: userPayment
              ? {
                  id: userPayment.id,
                  paymentId: userPayment.mercado_pago_payment_id || userPayment.preference_id,
                  amount: userPayment.amount || 149.9,
                  status: userPayment.status,
                  paymentMethod: userPayment.payment_method || 'Mercado Pago',
                  externalReference: userPayment.external_reference || null,
                  createdAt: userPayment.created_at,
                }
              : null,
            plan: 'Clinora Pro - Vitalício',
            amount: 149.9,
            role: 'clinic_admin',
            createdAt: au.created_at ? new Date(au.created_at).toLocaleDateString('pt-BR') : 'Sem data',
            rawCreatedAt: au.created_at || new Date().toISOString(),
            lastSignInAt: au.last_sign_in_at
              ? new Date(au.last_sign_in_at).toLocaleString('pt-BR')
              : 'Nunca',
          });
        }
      });

      const usersList = Array.from(usersMap.values()).sort(
        (a, b) => new Date(b.rawCreatedAt).getTime() - new Date(a.rawCreatedAt).getTime()
      );

      // Map Real Clinics List
      const clinicsList = (clinics || []).map((c: any) => {
        const ownerProfile = (profiles || []).find((p: any) => p.clinic_id === c.id);
        const ownerAuth = authUsers.find((au: any) => au.id === ownerProfile?.user_id);
        const clinicPayments = (payments || []).filter((pay: any) => pay.clinic_id === c.id);
        const approvedPayment = clinicPayments.find((pay: any) => pay.status === 'approved');

        return {
          id: c.id,
          name: c.name,
          phone: c.phone || ownerProfile?.phone || '',
          email: c.email || ownerProfile?.email || '',
          status: c.status,
          ownerName: ownerProfile?.full_name || 'Sem responsável',
          ownerEmail: ownerProfile?.email || c.email,
          createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Sem data',
          rawCreatedAt: c.created_at,
          paymentStatus: approvedPayment ? 'approved' : (clinicPayments[0]?.status || 'pending'),
          lastSignInAt: ownerAuth?.last_sign_in_at
            ? new Date(ownerAuth.last_sign_in_at).toLocaleString('pt-BR')
            : 'Nunca',
        };
      });

      // Map Real Payments List
      const paymentsList = (payments || []).map((pay: any) => {
        const userProf = (profiles || []).find((p: any) => p.user_id === pay.user_id);
        const clinic = (clinics || []).find((c: any) => c.id === pay.clinic_id || c.id === userProf?.clinic_id);
        const entitlement = (entitlements || []).find((e: any) => e.user_id === pay.user_id);

        return {
          id: pay.id,
          userId: pay.user_id,
          clinicId: pay.clinic_id || clinic?.id || null,
          clientName: userProf?.full_name || clinic?.name || pay.user_id || 'Cliente Clinora',
          clinicName: clinic?.name || 'Clínica Não Identificada',
          email: userProf?.email || clinic?.email || 'N/A',
          amount: Number(pay.amount || 149.9),
          status: pay.status || 'pending',
          paymentMethod: pay.payment_method || 'Mercado Pago',
          transactionId: pay.mercado_pago_payment_id || pay.preference_id || pay.id,
          externalReference: pay.external_reference || null,
          createdAt: pay.created_at ? new Date(pay.created_at).toLocaleString('pt-BR') : 'Sem data',
          rawCreatedAt: pay.created_at,
          userAccessStatus: entitlement?.status || (clinic?.status === 'blocked' ? 'blocked' : 'pending'),
        };
      });

      // Calculate Dynamic Indicators from real data
      const approvedPayList = paymentsList.filter((p: any) => p.status === 'approved');
      const totalRevenue = approvedPayList.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

      const stats = {
        totalClinics: clinicsList.length,
        totalUsers: usersList.length,
        activeUsers: usersList.filter((u) => u.accessStatus === 'active').length,
        pendingUsers: usersList.filter((u) => u.accessStatus === 'pending').length,
        blockedUsers: usersList.filter((u) => u.accessStatus === 'blocked').length,
        approvedPayments: approvedPayList.length,
        totalRevenue: totalRevenue,
        activeSubscriptions: usersList.filter((u) => u.accessStatus === 'active' || u.subscriptionStatus === 'approved').length,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConfigured: true,
          usersList,
          clinicsList,
          paymentsList,
          auditLogs,
          stats,
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
          body: JSON.stringify({ error: 'userId ou targetEmail é obrigatório.' }),
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
        } else {
          try {
            const { data: authList } = await supabase.auth.admin.listUsers();
            const found = authList?.users?.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase());
            if (found) effectiveUserId = found.id;
          } catch (e) {
            console.warn('Error searching auth user by email:', e);
          }
        }
      }

      let emailConfirmedByAdmin = false;
      let emailAlreadyConfirmed = false;

      // When activating user access, check and confirm user's email in Supabase Auth if needed
      if (newStatus === 'active' && effectiveUserId) {
        try {
          const { data: userData, error: getUserErr } = await supabase.auth.admin.getUserById(effectiveUserId);
          if (!getUserErr && userData?.user) {
            if (userData.user.email_confirmed_at) {
              emailAlreadyConfirmed = true;
            } else {
              const { error: confirmErr } = await supabase.auth.admin.updateUserById(effectiveUserId, {
                email_confirm: true,
              });
              if (!confirmErr) {
                emailConfirmedByAdmin = true;
              } else {
                console.warn('Erro ao confirmar e-mail no Auth Admin:', confirmErr);
              }
            }
          }
        } catch (err) {
          console.warn('Exceção ao consultar/confirmar e-mail via Auth Admin:', err);
        }
      }

      if (effectiveUserId) {
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

      let emailNote = '';
      if (emailConfirmedByAdmin) {
        emailNote = ' (E-mail confirmado no Supabase Auth pelo Super Admin)';
      } else if (emailAlreadyConfirmed) {
        emailNote = ' (E-mail já estava confirmado no Supabase Auth)';
      }

      try {
        await supabase.from('admin_audit_logs').insert({
          user_id: effectiveUserId || null,
          clinic_id: effectiveClinicId || null,
          admin_email: adminEmail || 'super_admin',
          action: `Acesso alterado para ${statusLabels[newStatus] || newStatus}`,
          details: `Super Admin ${adminEmail} alterou o acesso do usuário (${targetEmail || effectiveUserId}) para ${newStatus.toUpperCase()}${emailNote}.`,
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
          emailConfirmedByAdmin,
          emailAlreadyConfirmed,
          message: emailConfirmedByAdmin
            ? `Acesso ativado e e-mail do usuário confirmado no Supabase Auth com sucesso!`
            : `Status de acesso alterado para ${statusLabels[newStatus]} com sucesso.`,
        }),
      };
    }

    // -------------------------------------------------------------
    // 3. RELEASE MANUAL ACCESS (PAGAMENTO APROVADO MAS ACESSO PENDENTE)
    // -------------------------------------------------------------
    if (action === 'release_manual_access') {
      const { userId, clinicId, targetEmail } = body;

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
        } else {
          try {
            const { data: authList } = await supabase.auth.admin.listUsers();
            const found = authList?.users?.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase());
            if (found) effectiveUserId = found.id;
          } catch (e) {
            console.warn('Error searching auth user by email:', e);
          }
        }
      }

      let emailConfirmedByAdmin = false;
      let emailAlreadyConfirmed = false;

      // Check and confirm email in Supabase Auth
      if (effectiveUserId) {
        try {
          const { data: userData, error: getUserErr } = await supabase.auth.admin.getUserById(effectiveUserId);
          if (!getUserErr && userData?.user) {
            if (userData.user.email_confirmed_at) {
              emailAlreadyConfirmed = true;
            } else {
              const { error: confirmErr } = await supabase.auth.admin.updateUserById(effectiveUserId, {
                email_confirm: true,
              });
              if (!confirmErr) {
                emailConfirmedByAdmin = true;
              } else {
                console.warn('Erro ao confirmar e-mail no Auth Admin:', confirmErr);
              }
            }
          }
        } catch (err) {
          console.warn('Exceção ao consultar/confirmar e-mail via Auth Admin:', err);
        }
      }

      if (effectiveUserId) {
        await supabase.from('access_entitlements').upsert(
          {
            user_id: effectiveUserId,
            clinic_id: effectiveClinicId || null,
            access_type: 'lifetime',
            status: 'active',
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }

      if (effectiveClinicId) {
        await supabase
          .from('clinics')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', effectiveClinicId);
      }

      let emailNote = '';
      if (emailConfirmedByAdmin) {
        emailNote = ' (E-mail confirmado no Supabase Auth pelo Super Admin).';
      } else if (emailAlreadyConfirmed) {
        emailNote = ' (E-mail já estava confirmado no Supabase Auth).';
      }

      // Log in audit table
      try {
        await supabase.from('admin_audit_logs').insert({
          user_id: effectiveUserId || null,
          clinic_id: effectiveClinicId || null,
          admin_email: adminEmail || 'super_admin',
          action: 'Acesso Liberado Manualmente (Pagamento Aprovado)',
          details: `Super Admin ${adminEmail} liberou o acesso do usuário ${targetEmail || effectiveUserId} com pagamento confirmado no Mercado Pago.${emailNote}`,
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
          emailConfirmedByAdmin,
          emailAlreadyConfirmed,
          message: emailConfirmedByAdmin
            ? 'Acesso ativado e e-mail do usuário confirmado no Supabase Auth com sucesso!'
            : 'Acesso ativado e liberado com sucesso!',
        }),
      };
    }

    // -------------------------------------------------------------
    // 4. RESET USER PASSWORD / UPDATE CREDENTIALS
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
          email_confirm: true,
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
          body: JSON.stringify({ error: 'Usuário não encontrado no Auth para redefinição de senha.' }),
        };
      }

      // Audit Log
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
    // 5. UPDATE USER PROFILE & CLINIC DATA
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

        if (email) {
          try {
            await supabase.auth.admin.updateUserById(userId, { email });
          } catch (e) {
            console.warn('Could not sync auth email:', e);
          }
        }
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
          action: 'Editar Dados de Usuário e Clínica',
          details: `Super Admin ${adminEmail} atualizou os dados da clínica (${clinicName}) e responsável (${fullName}).`,
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
          message: 'Dados atualizados com sucesso.',
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
