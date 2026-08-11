import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const SITE_URL = process.env.SITE_URL || process.env.APP_URL || process.env.VITE_SITE_URL || 'http://localhost:3000';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, clinicId, email, fullName, clinicName } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'O e-mail é obrigatório para gerar o pagamento.' }),
      };
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente servidor. Por favor, adicione esta variável nas configurações da Netlify.',
          isConfigMissing: true,
        }),
      };
    }

    const cleanSiteUrl = SITE_URL.replace(/\/$/, '');

    // Create Preference on Mercado Pago Official API
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Clinora Pro — Acesso Vitalício',
            description: `Licença Definitiva do Clinora para a clínica ${clinicName || 'Clinora Pro'}`,
            quantity: 1,
            unit_price: 149.9,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: email,
          name: fullName || 'Cliente Clinora',
        },
        back_urls: {
          success: `${cleanSiteUrl}/payment/success`,
          pending: `${cleanSiteUrl}/payment/pending`,
          failure: `${cleanSiteUrl}/payment/failure`,
        },
        auto_return: 'approved',
        notification_url: `${cleanSiteUrl}/.netlify/functions/mercadopago-webhook`,
        external_reference: JSON.stringify({
          userId: userId || null,
          clinicId: clinicId || null,
          email: email,
        }),
      }),
    });

    const prefData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago Preference API Error:', prefData);
      return {
        statusCode: mpResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: prefData.message || 'Erro ao gerar preferência no Mercado Pago.',
          details: prefData,
        }),
      };
    }

    // Insert payment record in Supabase
    if (supabase) {
      try {
        await supabase.from('payments').insert({
          user_id: userId || null,
          clinic_id: clinicId || null,
          preference_id: prefData.id,
          amount: 149.9,
          currency: 'BRL',
          status: 'pending',
          external_reference: JSON.stringify({ userId, clinicId, email }),
        });
      } catch (dbErr) {
        console.warn('Erro ao registrar preference no banco Supabase:', dbErr);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferenceId: prefData.id,
        initPoint: prefData.init_point,
        sandboxInitPoint: prefData.sandbox_init_point,
      }),
    };
  } catch (err: any) {
    console.error('Error in create-preference function:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Erro interno no servidor' }),
    };
  }
}
