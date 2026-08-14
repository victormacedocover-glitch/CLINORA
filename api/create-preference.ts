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
    if (!accessToken || accessToken.includes('seu-access-token')) {
      return res.status(400).json({
        error: 'Chave MERCADOPAGO_ACCESS_TOKEN não configurada no servidor.',
        isConfigMissing: true,
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { userId, clinicId, email, fullName, clinicName } = body;

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const origin = req.headers.origin || (host ? `${protocol}://${host}` : '');

    const baseUrl = (
      process.env.APP_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      origin ||
      'https://clinora.app'
    ).replace(/\/$/, '');

    const preferencePayload = {
      items: [
        {
          id: 'clinora-pro-lifetime',
          title: 'Clinora Pro - Licença de Acesso',
          description: 'Acesso completo ao sistema de gestão CLINORA para clínicas odontológicas e de estética',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 149.90,
        },
      ],
      payer: {
        email: email || 'cliente@clinora.app',
        name: fullName || 'Cliente Clinora',
      },
      back_urls: {
        success: `${baseUrl}/pagamento-sucesso`,
        failure: `${baseUrl}/pagamento-falha`,
        pending: `${baseUrl}/pagamento-pendente`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mercadopago-webhook`,
      external_reference: JSON.stringify({
        userId: userId || null,
        clinicId: clinicId || null,
        email: email || null,
        clinicName: clinicName || null,
      }),
      statement_descriptor: 'CLINORA PRO',
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago API error:', mpData);
      return res.status(mpResponse.status).json({
        error: mpData.message || 'Erro ao gerar preferência no Mercado Pago.',
        details: mpData,
      });
    }

    return res.status(200).json({
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
      preferenceId: mpData.id,
    });
  } catch (err: any) {
    console.error('Create preference error:', err);
    return res.status(500).json({
      error: err.message || 'Erro interno ao processar requisição do Mercado Pago.',
    });
  }
}
