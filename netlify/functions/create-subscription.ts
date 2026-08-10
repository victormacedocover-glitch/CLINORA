// Netlify Function: /netlify/functions/create-subscription.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { clinicId, email, fullName, clinicName } = body;

    if (!clinicId || !email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'clinicId e email são obrigatórios.' }),
      };
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      // Return clear message if token is not yet defined in env vars
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente. Configure as variáveis no Netlify / AI Studio.',
          isMock: true,
        }),
      };
    }

    // Call Mercado Pago API to create recurring preapproval (subscription)
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        payer_email: email,
        back_url: `${APP_URL}/assinatura?status=success`,
        reason: `Clinora Pro - ${clinicName || 'Assinatura Mensal'}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 149.9,
          currency_id: 'BRL',
        },
        external_reference: clinicId,
        status: 'pending',
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago API error:', mpData);
      return {
        statusCode: mpResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: mpData.message || 'Erro ao comunicar com Mercado Pago.',
          details: mpData,
        }),
      };
    }

    // Upsert subscription in Supabase
    const mpSubId = mpData.id;
    const initPoint = mpData.init_point;

    await supabase.from('subscriptions').upsert(
      {
        clinic_id: clinicId,
        mercadopago_subscription_id: mpSubId,
        status: 'pending',
        plan: 'Clinora Pro',
        amount: 149.9,
        currency: 'BRL',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clinic_id' }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: mpSubId,
        initPoint: initPoint,
        message: 'Assinatura iniciada no Mercado Pago com sucesso.',
      }),
    };
  } catch (err: any) {
    console.error('Error in create-subscription function:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Erro interno no servidor' }),
    };
  }
}
