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

      if (user_id) {
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'active',
            plan: 'pro_lifetime',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user_id);
        accessGranted = true;
      } else if (email) {
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'active',
            plan: 'pro_lifetime',
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
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
