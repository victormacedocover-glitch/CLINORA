import { createClient } from '@supabase/supabase-js';

const SUPER_ADMIN_EMAILS = [
  'victorbeirigo76@gmail.com',
  'victorbeirigo@hotmail.com',
  'admin@clinora.com',
];

function isAuthorizedAdmin(email?: string): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email.trim().toLowerCase());
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase service role credentials not configured on server.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      action,
      adminEmail,
      userId,
      targetUserId,
      clinicId,
      newStatus,
      newPlan,
      targetEmail,
      newPassword,
      fullName,
      clinicName,
      phone,
      email,
    } = body;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Public / Registration Action: create or initialize initial account records safely
    if (action === 'create_initial_account') {
      const targetUid = userId || targetUserId;
      const userEmail = email || targetEmail;
      const userFullName = fullName || 'Responsável';
      const userClinicName = clinicName || 'Minha Clínica';
      const userPhone = phone || '';

      if (!targetUid) {
        return res.status(400).json({ error: 'userId is required for account initialization' });
      }

      // 1. Create Clinic
      let createdClinicId = clinicId;
      if (!createdClinicId) {
        const { data: cData, error: cErr } = await supabaseAdmin
          .from('clinics')
          .insert({
            name: userClinicName,
            phone: userPhone,
            email: userEmail || '',
            status: 'active',
          })
          .select('id')
          .single();

        if (cErr && !cData) {
          console.error('Error inserting clinic:', cErr);
        } else if (cData) {
          createdClinicId = cData.id;
        }
      }

      // 2. Create Profile
      if (createdClinicId) {
        await supabaseAdmin.from('profiles').upsert(
          {
            user_id: targetUid,
            clinic_id: createdClinicId,
            full_name: userFullName,
            email: userEmail || '',
            role: 'clinic_admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }

      // 3. Create Access Entitlement with 'pending'
      await supabaseAdmin.from('access_entitlements').upsert(
        {
          user_id: targetUid,
          clinic_id: createdClinicId || null,
          access_type: 'lifetime',
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      return res.status(200).json({
        success: true,
        clinicId: createdClinicId,
      });
    }

    // All subsequent actions require Super Admin Authorization
    if (!isAuthorizedAdmin(adminEmail)) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o Super Admin tem autorização.' });
    }

    const effectiveUserId = targetUserId || userId;

    switch (action) {
      case 'fetch_all_data': {
        const [
          authUsersRes,
          profilesRes,
          clinicsRes,
          entitlementsRes,
          paymentsRes,
          auditLogsRes,
        ] = await Promise.all([
          supabaseAdmin.auth.admin.listUsers().catch((err) => ({ data: { users: [] }, error: err })),
          supabaseAdmin.from('profiles').select('*').catch((err) => ({ data: [], error: err })),
          supabaseAdmin.from('clinics').select('*').catch((err) => ({ data: [], error: err })),
          supabaseAdmin.from('access_entitlements').select('*').catch((err) => ({ data: [], error: err })),
          supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false }).catch((err) => ({ data: [], error: err })),
          supabaseAdmin.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100).catch((err) => ({ data: [], error: err })),
        ]);

        const authUsers = (authUsersRes.data as any)?.users || [];
        const profiles = (profilesRes.data as any[]) || [];
        const clinics = (clinicsRes.data as any[]) || [];
        const entitlements = (entitlementsRes.data as any[]) || [];
        const payments = (paymentsRes.data as any[]) || [];
        const auditLogs = (auditLogsRes.data as any[]) || [];

        const profilesByUser = new Map<string, any>(profiles.map((p) => [p.user_id, p]));
        const clinicsById = new Map<string, any>(clinics.map((c) => [c.id, c]));
        const entitlementsByUser = new Map<string, any>(entitlements.map((e) => [e.user_id, e]));
        const paymentsByUser = new Map<string, any>();
        for (const pay of payments) {
          if (pay.user_id && !paymentsByUser.has(pay.user_id)) {
            paymentsByUser.set(pay.user_id, pay);
          }
        }

        // Build Combined Users List from auth.users and profiles
        const allUserIds = new Set<string>();
        authUsers.forEach((u: any) => allUserIds.add(u.id));
        profiles.forEach((p: any) => allUserIds.add(p.user_id));

        const usersList: any[] = [];

        for (const uid of Array.from(allUserIds)) {
          const authUser = authUsers.find((u: any) => u.id === uid);
          const profile = profilesByUser.get(uid);
          const meta = authUser?.user_metadata || {};
          const clinicIdResolved = profile?.clinic_id || entitlementsByUser.get(uid)?.clinic_id || null;
          const clinic = clinicIdResolved ? clinicsById.get(clinicIdResolved) : null;
          const entitlement = entitlementsByUser.get(uid);
          const payment = paymentsByUser.get(uid);

          const emailResolved = authUser?.email || profile?.email || clinic?.email || '';
          const ownerResolved =
            profile?.full_name ||
            meta.full_name ||
            meta.name ||
            (emailResolved ? emailResolved.split('@')[0] : 'Usuário');

          const clinicNameResolved = clinic?.name || meta.clinic_name || 'Clínica não definida';
          const phoneResolved = clinic?.phone || meta.clinic_phone || '';

          // Determine access status
          let accessStatus: 'active' | 'pending' | 'blocked' = 'pending';
          if (entitlement?.status === 'active' || (clinic && clinic.status === 'active' && entitlement?.status === 'active')) {
            accessStatus = 'active';
          } else if (entitlement?.status === 'blocked' || clinic?.status === 'blocked') {
            accessStatus = 'blocked';
          } else {
            accessStatus = 'pending';
          }

          // Determine payment status
          let subscriptionStatus = 'pending';
          if (payment?.status === 'approved' || accessStatus === 'active') {
            subscriptionStatus = 'approved';
          } else if (payment?.status) {
            subscriptionStatus = payment.status;
          }

          usersList.push({
            id: profile?.id || uid,
            userId: uid,
            clinicId: clinicIdResolved,
            clinicName: clinicNameResolved,
            owner: ownerResolved,
            email: emailResolved,
            phone: phoneResolved,
            plan: 'Clinora Pro - Vitalício',
            accessStatus: accessStatus,
            subscriptionStatus: subscriptionStatus,
            emailConfirmed: Boolean(authUser?.email_confirmed_at),
            createdAt: authUser?.created_at
              ? new Date(authUser.created_at).toLocaleDateString('pt-BR')
              : profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('pt-BR')
              : '-',
            lastSignInAt: authUser?.last_sign_in_at
              ? new Date(authUser.last_sign_in_at).toLocaleString('pt-BR')
              : 'Nunca acessou',
          });
        }

        // Build Clinics List
        const clinicsList = clinics.map((c) => {
          const matchingProfile = profiles.find((p) => p.clinic_id === c.id);
          const matchingAuth = matchingProfile ? authUsers.find((u: any) => u.id === matchingProfile.user_id) : null;

          return {
            id: c.id,
            name: c.name,
            ownerName: matchingProfile?.full_name || 'Responsável',
            ownerEmail: c.email || matchingProfile?.email || '',
            phone: c.phone || '',
            status: c.status || 'active',
            createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '-',
            lastSignInAt: matchingAuth?.last_sign_in_at
              ? new Date(matchingAuth.last_sign_in_at).toLocaleString('pt-BR')
              : 'Nunca acessou',
          };
        });

        // Build Payments List
        const paymentsList = payments.map((pay) => {
          const matchingProfile = pay.user_id ? profilesByUser.get(pay.user_id) : null;
          const matchingClinic = pay.clinic_id ? clinicsById.get(pay.clinic_id) : null;
          const matchingAuth = pay.user_id ? authUsers.find((u: any) => u.id === pay.user_id) : null;
          const matchingEnt = pay.user_id ? entitlementsByUser.get(pay.user_id) : null;

          return {
            id: pay.id,
            userId: pay.user_id,
            clinicId: pay.clinic_id,
            clientName: matchingProfile?.full_name || matchingAuth?.user_metadata?.full_name || 'Cliente',
            clinicName: matchingClinic?.name || 'Clínica',
            email: matchingProfile?.email || matchingAuth?.email || matchingClinic?.email || '',
            amount: Number(pay.amount) || 149.90,
            status: pay.status || 'pending',
            paymentMethod: pay.payment_method || 'Mercado Pago',
            transactionId: pay.mercado_pago_payment_id || pay.preference_id || pay.id,
            createdAt: pay.created_at ? new Date(pay.created_at).toLocaleDateString('pt-BR') : '-',
            userAccessStatus: matchingEnt?.status || 'pending',
          };
        });

        // Calculate Stats
        const approvedPays = paymentsList.filter((p) => p.status === 'approved');
        const totalRev = approvedPays.reduce((acc, p) => acc + (p.amount || 0), 0);

        const stats = {
          totalClinics: clinicsList.length,
          totalUsers: usersList.length,
          activeUsers: usersList.filter((u) => u.accessStatus === 'active').length,
          pendingUsers: usersList.filter((u) => u.accessStatus === 'pending').length,
          blockedUsers: usersList.filter((u) => u.accessStatus === 'blocked').length,
          approvedPayments: approvedPays.length,
          totalRevenue: totalRev,
          activeSubscriptions: usersList.filter((u) => u.accessStatus === 'active' || u.subscriptionStatus === 'approved').length,
        };

        return res.status(200).json({
          usersList,
          clinicsList,
          paymentsList,
          auditLogs,
          stats,
        });
      }

      case 'update_access_status': {
        if (!effectiveUserId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const validStatus = newStatus === 'active' ? 'active' : newStatus === 'blocked' ? 'blocked' : 'pending';

        // 1. Update or Insert access_entitlements
        await supabaseAdmin.from('access_entitlements').upsert(
          {
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            access_type: 'lifetime',
            status: validStatus,
            granted_at: validStatus === 'active' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // 2. Update clinic status if clinicId exists
        if (clinicId) {
          await supabaseAdmin
            .from('clinics')
            .update({
              status: validStatus === 'blocked' ? 'blocked' : 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', clinicId);
        }

        // 3. Log audit
        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            admin_email: adminEmail,
            action: `Alteração de status de acesso para: ${validStatus.toUpperCase()}`,
            details: `Usuário ${targetEmail || effectiveUserId}`,
          });
        } catch (aErr) {
          console.warn('Audit log error:', aErr);
        }

        return res.status(200).json({ success: true, message: 'Status de acesso atualizado com sucesso.' });
      }

      case 'release_manual_access': {
        if (!effectiveUserId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        await supabaseAdmin.from('access_entitlements').upsert(
          {
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            access_type: 'lifetime',
            status: 'active',
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (clinicId) {
          await supabaseAdmin
            .from('clinics')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', clinicId);
        }

        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            admin_email: adminEmail,
            action: 'Liberação Manual de Acesso Vitalício',
            details: `Acesso liberado para o usuário ${targetEmail || effectiveUserId}`,
          });
        } catch (aErr) {
          console.warn('Audit log error:', aErr);
        }

        return res.status(200).json({ success: true, message: 'Acesso vitalício liberado com sucesso.' });
      }

      case 'confirm_user_email': {
        if (!effectiveUserId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(effectiveUserId, {
          email_confirm: true,
        });

        if (error) throw error;

        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            admin_email: adminEmail,
            action: 'Confirmação Manual de E-mail no Supabase Auth',
            details: `E-mail confirmado para o usuário ${targetEmail || effectiveUserId}`,
          });
        } catch (aErr) {
          console.warn('Audit log error:', aErr);
        }

        return res.status(200).json({ success: true, message: 'E-mail confirmado com sucesso.' });
      }

      case 'reset_password': {
        if (!effectiveUserId || !newPassword) {
          return res.status(400).json({ error: 'userId and newPassword are required' });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(effectiveUserId, {
          password: newPassword,
        });

        if (error) throw error;

        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            admin_email: adminEmail,
            action: 'Redefinição de Senha de Usuário',
            details: `Senha alterada para o usuário ${targetEmail || effectiveUserId}`,
          });
        } catch (aErr) {
          console.warn('Audit log error:', aErr);
        }

        return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso.' });
      }

      case 'update_user_info': {
        if (!effectiveUserId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        if (fullName || email) {
          await supabaseAdmin
            .from('profiles')
            .update({
              full_name: fullName,
              email: email,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', effectiveUserId);
        }

        if (clinicId && (clinicName || phone || email)) {
          await supabaseAdmin
            .from('clinics')
            .update({
              name: clinicName,
              phone: phone,
              email: email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', clinicId);
        }

        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            user_id: effectiveUserId,
            clinic_id: clinicId || null,
            admin_email: adminEmail,
            action: 'Atualização de Dados Cadastrais',
            details: `Dados atualizados para ${fullName || targetEmail}`,
          });
        } catch (aErr) {
          console.warn('Audit log error:', aErr);
        }

        return res.status(200).json({ success: true, message: 'Dados cadastrais atualizados com sucesso.' });
      }

      default:
        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }
  } catch (err: any) {
    console.error('Admin user management error:', err);
    return res.status(500).json({ error: err.message || 'Erro ao processar ação de administração.' });
  }
}

