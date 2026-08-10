// Netlify Function: /netlify/functions/mercadopago-webhook.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event: any) {
  // Allow GET for ping/verification and POST for Webhook events
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', message: 'Clinora Mercado Pago Webhook Operational' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    // Mercado Pago passes ID in body.data.id, body.id, or query string
    const resourceId =
      body?.data?.id ||
      body?.id ||
      queryParams?.id ||
      queryParams?.['data.id'];

    const topic = body?.type || body?.action || queryParams?.topic || queryParams?.type;

    console.log(`Mercado Pago Webhook Received. Topic: ${topic}, ID: ${resourceId}`);

    if (!resourceId) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'No resource ID supplied' }),
      };
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.warn('MERCADOPAGO_ACCESS_TOKEN missing in environment.');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'MERCADOPAGO_ACCESS_TOKEN missing' }),
      };
    }

    // Query Mercado Pago directly to get authorized status of preapproval resource
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpRes.ok) {
      console.error(`Failed to fetch preapproval ${resourceId} from Mercado Pago`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, note: 'Could not fetch resource from MP' }),
      };
    }

    const preapprovalData = await mpRes.json();
    const mpStatus = preapprovalData.status; // 'authorized', 'paused', 'cancelled', 'pending'
    const externalReference = preapprovalData.external_reference; // clinicId

    let mappedStatus: 'active' | 'cancelled' | 'pending' | 'past_due' = 'pending';
    if (mpStatus === 'authorized') {
      mappedStatus = 'active';
    } else if (mpStatus === 'cancelled') {
      mappedStatus = 'cancelled';
    } else if (mpStatus === 'paused') {
      mappedStatus = 'past_due';
    }

    // Update subscription in Supabase database
    if (externalReference) {
      const { error: subErr } = await supabase
        .from('subscriptions')
        .update({
          mercadopago_subscription_id: resourceId,
          status: mappedStatus,
          updated_at: new Date().toISOString(),
          started_at: mappedStatus === 'active' ? new Date().toISOString() : undefined,
        })
        .eq('clinic_id', externalReference);

      if (subErr) {
        console.error('Error updating subscription in Supabase:', subErr);
      }

      // Also ensure clinic status matches
      if (mappedStatus === 'active') {
        await supabase
          .from('clinics')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', externalReference);
      }
    } else {
      // Search by mercadopago_subscription_id
      await supabase
        .from('subscriptions')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('mercadopago_subscription_id', resourceId);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, status: mappedStatus }),
    };
  } catch (err: any) {
    console.error('Error in mercadopago-webhook:', err);
    return {
      statusCode: 200, // MP requires 200 OK to prevent endless retries on handler error
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, error: err.message }),
    };
  }
}
