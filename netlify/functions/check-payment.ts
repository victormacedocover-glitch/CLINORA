import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function handler(event: any) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const query = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    const paymentId = query.payment_id || body.payment_id || query.collection_id;
    const userId = query.user_id || body.user_id;
    const email = query.email || body.email;

    // 1. First check Supabase database for active access entitlement
    if (supabase && (userId || email)) {
      let targetUserId = userId;
      if (!targetUserId && email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();
        if (profile) targetUserId = profile.user_id;
      }

      if (targetUserId) {
        const { data: entitlement } = await supabase
          .from('access_entitlements')
          .select('status, access_type, granted_at')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (entitlement && entitlement.status === 'active') {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              approved: true,
              status: 'approved',
              accessGranted: true,
              accessType: entitlement.access_type,
              grantedAt: entitlement.granted_at,
            }),
          };
        }
      }
    }

    // 2. If paymentId is available and MERCADOPAGO_ACCESS_TOKEN is set, verify directly with Mercado Pago API
    if (paymentId && MERCADOPAGO_ACCESS_TOKEN) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
      });

      if (mpRes.ok) {
        const mpData = await mpRes.json();
        const mpStatus = mpData.status; // 'approved', 'pending', 'rejected', 'in_process'

        if (mpStatus === 'approved' && supabase) {
          // Parse external_reference to find userId
          let refUserId = userId;
          let refClinicId = null;
          if (mpData.external_reference) {
            try {
              const parsed = JSON.parse(mpData.external_reference);
              if (parsed.userId) refUserId = parsed.userId;
              if (parsed.clinicId) refClinicId = parsed.clinicId;
            } catch {
              refClinicId = mpData.external_reference;
            }
          }

          if (!refUserId && (email || mpData.payer?.email)) {
            const searchEmail = email || mpData.payer?.email;
            const { data: prof } = await supabase
              .from('profiles')
              .select('user_id, clinic_id')
              .eq('email', searchEmail)
              .maybeSingle();
            if (prof) {
              refUserId = prof.user_id;
              if (!refClinicId) refClinicId = prof.clinic_id;
            }
          }

          if (refUserId) {
            // Grant entitlement in database
            await supabase
              .from('access_entitlements')
              .upsert(
                {
                  user_id: refUserId,
                  clinic_id: refClinicId,
                  access_type: 'lifetime',
                  status: 'active',
                  granted_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );
          }

          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              approved: true,
              status: 'approved',
              accessGranted: true,
              paymentId,
            }),
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approved: mpStatus === 'approved',
            status: mpStatus,
            accessGranted: mpStatus === 'approved',
            paymentId,
          }),
        };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approved: false,
        status: 'pending',
        accessGranted: false,
        message: 'Pagamento pendente de confirmação no Mercado Pago.',
      }),
    };
  } catch (err: any) {
    console.error('Error in check-payment function:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Erro interno no servidor' }),
    };
  }
}
