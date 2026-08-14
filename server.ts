import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import aiBudgetHandler from './api/ai-budget';
import aiFollowupHandler from './api/ai-followup';
import createPreferenceHandler from './api/create-preference';
import mercadopagoWebhookHandler from './api/mercadopago-webhook';
import checkPaymentHandler from './api/check-payment';
import adminUserManagementHandler from './api/admin-user-management';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Routes
  app.all(['/api/ai/budget', '/api/ai-budget'], (req, res) => {
    aiBudgetHandler(req, res);
  });

  app.all(['/api/ai/followup', '/api/ai-followup'], (req, res) => {
    aiFollowupHandler(req, res);
  });

  // Mercado Pago & Payment Routes
  app.all(['/api/create-preference', '/.netlify/functions/create-preference'], (req, res) => {
    createPreferenceHandler(req, res);
  });

  app.all(['/api/mercadopago-webhook', '/.netlify/functions/mercadopago-webhook'], (req, res) => {
    mercadopagoWebhookHandler(req, res);
  });

  app.all(['/api/check-payment', '/.netlify/functions/check-payment'], (req, res) => {
    checkPaymentHandler(req, res);
  });

  // Admin Routes
  app.all(['/api/admin-user-management', '/.netlify/functions/admin-user-management'], (req, res) => {
    adminUserManagementHandler(req, res);
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
