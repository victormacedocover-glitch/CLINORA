import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mercado Pago can send webhooks as POST or verification GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const query = req.query || {};
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const type = query.type || query.topic || body.type || body.topic;
    const dataId = query['data.id'] || query.id || body?.data?.id || body?.id;

    console.log(`[Mercado Pago Webhook] Received notification: type=${type}, dataId=${dataId}`);

    if (type === 'payment' && dataId && accessToken) {
      // Query payment details from Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (mpRes.ok) {
        const paymentData = await mpRes.json();
        console.log(`[Mercado Pago Webhook] Payment ${dataId} status: ${paymentData.status}`);

        if (paymentData.status === 'approved' && supabaseUrl && serviceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
          });

          let externalRef: any = {};
          try {
            if (paymentData.external_reference) {
              externalRef = JSON.parse(paymentData.external_reference);
            }
          } catch {
            // plain string or empty
          }

          const payerEmail = externalRef.email || paymentData.payer?.email;
          let targetUid = externalRef.userId;
          let targetClinicId = externalRef.clinicId || null;

          if (!targetUid && payerEmail) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('user_id, clinic_id')
              .eq('email', payerEmail)
              .maybeSingle();

            if (profile) {
              targetUid = profile.user_id;
              if (!targetClinicId) targetClinicId = profile.clinic_id;
            } else {
              const authList = await supabaseAdmin.auth.admin.listUsers();
              const found = authList.data?.users?.find((u) => u.email?.toLowerCase() === payerEmail.toLowerCase());
              if (found) {
                targetUid = found.id;
              }
            }
          }

          console.log(`[Mercado Pago Webhook] Granting access for email=${payerEmail}, userId=${targetUid}, clinicId=${targetClinicId}`);

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

            // 2. Set clinic status active
            if (targetClinicId) {
              await supabaseAdmin
                .from('clinics')
                .update({
                  status: 'active',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', targetClinicId);
            }

            // 3. Record payment
            try {
              await supabaseAdmin.from('payments').insert({
                user_id: targetUid,
                clinic_id: targetClinicId || null,
                mercado_pago_payment_id: String(paymentData.id),
                amount: Number(paymentData.transaction_amount) || 149.90,
                currency: paymentData.currency_id || 'BRL',
                status: 'approved',
                payment_method: paymentData.payment_method_id || paymentData.payment_type_id || 'mercadopago',
              });
            } catch (payErr) {
              console.warn('Payment insert warning:', payErr);
            }
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Mercado Pago Webhook] Error processing:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
}
