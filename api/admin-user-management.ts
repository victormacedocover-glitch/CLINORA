import { createClient } from '@supabase/supabase-js';

const SUPER_ADMIN_EMAIL = 'victorbeirigo76@gmail.com';

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
    const { action, adminEmail, targetUserId, newStatus, newPlan, targetEmail, newPassword, userData } = body;

    // Verify Super Admin
    if (!adminEmail || adminEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o Super Admin tem autorização.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    switch (action) {
      case 'fetch_all_data': {
        const [usersRes, clinicsRes, authUsersRes] = await Promise.all([
          supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
          supabaseAdmin.from('clinics').select('*'),
          supabaseAdmin.auth.admin.listUsers(),
        ]);

        const authUsersMap = new Map((authUsersRes.data?.users || []).map((u) => [u.id, u]));

        const combinedUsers = (usersRes.data || []).map((u) => {
          const authUser = authUsersMap.get(u.id);
          return {
            ...u,
            email_confirmed_at: authUser?.email_confirmed_at || null,
            last_sign_in_at: authUser?.last_sign_in_at || null,
          };
        });

        return res.status(200).json({
          usersList: combinedUsers,
          clinicsList: clinicsRes.data || [],
        });
      }

      case 'update_access_status': {
        if (!targetUserId) {
          return res.status(400).json({ error: 'targetUserId is required' });
        }
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: newStatus,
            plan: newPlan || 'pro_lifetime',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'release_manual_access': {
        if (!targetUserId) {
          return res.status(400).json({ error: 'targetUserId is required' });
        }
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'active',
            plan: 'pro_lifetime',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'confirm_user_email': {
        if (!targetUserId) {
          return res.status(400).json({ error: 'targetUserId is required' });
        }
        const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          email_confirm: true,
        });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'reset_password': {
        if (!targetUserId || !newPassword) {
          return res.status(400).json({ error: 'targetUserId and newPassword are required' });
        }
        const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: newPassword,
        });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'update_user_info': {
        if (!targetUserId) {
          return res.status(400).json({ error: 'targetUserId is required' });
        }
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    console.error('Admin user management error:', err);
    return res.status(500).json({ error: err.message || 'Erro ao processar ação de administração.' });
  }
}
