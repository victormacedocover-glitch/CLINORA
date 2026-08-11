import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function handler(event: any) {
  // Allow GET for ping/health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', message: 'Clinora Mercado Pago Webhook Operacional' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    // Get Payment ID from webhook notification payload
    const paymentId =
      body?.data?.id ||
      body?.id ||
      queryParams?.id ||
      queryParams?.['data.id'];

    const topic = body?.type || body?.action || queryParams?.topic || queryParams?.type;

    console.log(`[Mercado Pago Webhook] Topic: ${topic}, Payment ID: ${paymentId}`);

    if (!paymentId) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'Nenhum ID de pagamento fornecido.' }),
      };
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.warn('[Mercado Pago Webhook] MERCADOPAGO_ACCESS_TOKEN ausente no servidor.');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'MERCADOPAGO_ACCESS_TOKEN ausente.' }),
      };
    }

    // Query Mercado Pago Payment API to verify authentic status directly from source
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpRes.ok) {
      console.error(`[Mercado Pago Webhook] Erro ao consultar pagamento ${paymentId} na API do MP`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'Não foi possível consultar o pagamento na API do MP.' }),
      };
    }

    const paymentData = await mpRes.json();
    const mpStatus = paymentData.status; // 'approved', 'pending', 'rejected', 'cancelled'
    const transactionAmount = Number(paymentData.transaction_amount || 0);
    const paymentMethodId = paymentData.payment_method_id || paymentData.payment_type_id || 'mercadopago';
    const rawRef = paymentData.external_reference;

    let userId: string | null = null;
    let clinicId: string | null = null;
    let payerEmail: string | null = paymentData.payer?.email || null;

    if (rawRef) {
      try {
        const parsed = JSON.parse(rawRef);
        userId = parsed.userId || null;
        clinicId = parsed.clinicId || null;
        if (parsed.email) payerEmail = parsed.email;
      } catch {
        // If external_reference was just string ID
        clinicId = rawRef;
      }
    }

    console.log(`[Mercado Pago Webhook] Payment ${paymentId} status: ${mpStatus}, User: ${userId}, Email: ${payerEmail}`);

    if (!supabase) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, status: mpStatus, note: 'Supabase não configurado.' }),
      };
    }

    // 1. Record payment in Supabase (Idempotent update/upsert)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('mercado_pago_payment_id', String(paymentId))
      .maybeSingle();

    let paymentDbId = existingPayment?.id;

    if (existingPayment) {
      await supabase
        .from('payments')
        .update({
          status: mpStatus,
          payment_method: paymentMethodId,
          amount: transactionAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
    } else {
      const { data: newPay } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          mercado_pago_payment_id: String(paymentId),
          amount: transactionAmount || 149.9,
          currency: 'BRL',
          status: mpStatus,
          payment_method: paymentMethodId,
          external_reference: rawRef,
        })
        .select('id')
        .single();
      if (newPay) paymentDbId = newPay.id;
    }

    // 2. CRITICAL RULE: ONLY if payment status is 'approved', grant lifetime access entitlement!
    if (mpStatus === 'approved') {
      // Find target user ID if missing
      if (!userId && payerEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, clinic_id')
          .eq('email', payerEmail)
          .maybeSingle();
        if (profile) {
          userId = profile.user_id;
          if (!clinicId) clinicId = profile.clinic_id;
        }
      }

      if (userId) {
        // Upsert access_entitlement
        const { error: entErr } = await supabase
          .from('access_entitlements')
          .upsert(
            {
              user_id: userId,
              clinic_id: clinicId,
              access_type: 'lifetime',
              status: 'active',
              granted_at: new Date().toISOString(),
              payment_id: paymentDbId || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (entErr) {
          console.error('[Mercado Pago Webhook] Erro ao conceder access_entitlement:', entErr);
        } else {
          console.log(`[Mercado Pago Webhook] ACESSO VITALÍCIO CONCEDIDO para user_id ${userId}`);
        }
      }

      if (clinicId) {
        // Also update clinic & subscription status
        await supabase
          .from('clinics')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', clinicId);

        await supabase
          .from('subscriptions')
          .upsert(
            {
              clinic_id: clinicId,
              mercadopago_subscription_id: String(paymentId),
              status: 'active',
              plan: 'Clinora Pro - Vitalício',
              amount: 149.9,
              currency: 'BRL',
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'clinic_id' }
          );
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, paymentId, status: mpStatus }),
    };
  } catch (err: any) {
    console.error('Error in mercadopago-webhook function:', err);
    return {
      statusCode: 200, // Return 200 to prevent MP retries loop
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, error: err.message }),
    };
  }
}
