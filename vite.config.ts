import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'netlify-functions-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/.netlify/functions/')) {
              const urlObj = new URL(req.url, 'http://localhost:3000');
              const functionName = urlObj.pathname.replace('/.netlify/functions/', '');
              
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  let modulePath = '';
                  if (functionName === 'create-preference' || functionName === 'create-subscription') {
                    modulePath = './netlify/functions/create-preference.ts';
                  } else if (functionName === 'mercadopago-webhook') {
                    modulePath = './netlify/functions/mercadopago-webhook.ts';
                  } else if (functionName === 'check-payment') {
                    modulePath = './netlify/functions/check-payment.ts';
                  }

                  if (modulePath) {
                    const fnModule = await server.ssrLoadModule(modulePath);
                    const event = {
                      httpMethod: req.method,
                      queryStringParameters: Object.fromEntries(urlObj.searchParams.entries()),
                      body: body,
                    };
                    const result = await fnModule.handler(event);

                    res.statusCode = result.statusCode || 200;
                    if (result.headers) {
                      Object.entries(result.headers).forEach(([k, v]) => {
                        res.setHeader(k, v as string);
                      });
                    }
                    res.end(result.body || '');
                    return;
                  }
                } catch (err: any) {
                  console.error('Error running dev function:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
                next();
              });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
