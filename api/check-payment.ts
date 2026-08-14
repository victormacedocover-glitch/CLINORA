import { createClient } from '@supabase/supabase-js';

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
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { payment_id, user_id, email } = body;

    if (!payment_id) {
      return res.status(400).json({ error: 'ID do pagamento não informado.', approved: false });
    }

    if (!accessToken) {
      return res.status(500).json({ error: 'Chave MERCADOPAGO_ACCESS_TOKEN não configurada.', approved: false });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mpRes.ok) {
      const errData = await mpRes.json();
      return res.status(mpRes.status).json({ approved: false, error: errData.message || 'Erro ao consultar pagamento no Mercado Pago.' });
    }

    const payment = await mpRes.json();
    const isApproved = payment.status === 'approved';

    let accessGranted = false;

    if (isApproved && supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      let targetUid = user_id;
      let targetClinicId: string | null = null;

      // If only email is provided, lookup user_id in auth or profiles
      if (!targetUid && email) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_id, clinic_id')
          .eq('email', email)
          .maybeSingle();

        if (profile) {
          targetUid = profile.user_id;
          targetClinicId = profile.clinic_id;
        } else {
          const authList = await supabaseAdmin.auth.admin.listUsers();
          const users = (authList.data as any)?.users || [];
          const found = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (found) {
            targetUid = found.id;
          }
        }
      }

      if (targetUid) {
        if (!targetClinicId) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('clinic_id')
            .eq('user_id', targetUid)
            .maybeSingle();
          if (prof?.clinic_id) targetClinicId = prof.clinic_id;
        }

        // 1. Grant access entitlement
        await supabaseAdmin.from('access_entitlements').upsert(
          {
            user_id: targetUid,
            clinic_id: targetClinicId || null,
            access_type: 'lifetime',
            status: 'active',
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // 2. Ensure clinic is active
        if (targetClinicId) {
          await supabaseAdmin
            .from('clinics')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetClinicId);
        }

        // 3. Record or update payment record
        try {
          await supabaseAdmin.from('payments').insert({
            user_id: targetUid,
            clinic_id: targetClinicId || null,
            mercado_pago_payment_id: String(payment.id),
            amount: Number(payment.transaction_amount) || 149.90,
            currency: payment.currency_id || 'BRL',
            status: 'approved',
            payment_method: payment.payment_method_id || payment.payment_type_id || 'mercadopago',
          });
        } catch (payErr) {
          console.warn('Payment insert warning:', payErr);
        }

        accessGranted = true;
      }
    }

    return res.status(200).json({
      approved: isApproved,
      status: payment.status,
      status_detail: payment.status_detail,
      accessGranted,
      paymentId: payment.id,
    });
  } catch (err: any) {
    console.error('Error checking payment:', err);
    return res.status(500).json({ approved: false, error: err.message });
  }
}
