import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-functions-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            if (url.startsWith('/.netlify/functions/') || url.startsWith('/api/')) {
              const urlObj = new URL(url, 'http://localhost:3000');
              let functionName = '';

              if (url.startsWith('/.netlify/functions/')) {
                functionName = urlObj.pathname.replace('/.netlify/functions/', '');
              } else if (url.startsWith('/api/')) {
                functionName = urlObj.pathname.replace('/api/', '');
              }

              // Map aliases
              if (functionName === 'ai/budget') functionName = 'ai-budget';
              if (functionName === 'ai/followup') functionName = 'ai-followup';

              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const modulePath = `./api/${functionName}.ts`;
                  const fnModule = await server.ssrLoadModule(modulePath);
                  const handler = fnModule.default || fnModule.handler;

                  if (handler) {
                    let parsedBody = body;
                    try {
                      parsedBody = JSON.parse(body);
                    } catch {
                      // plain
                    }

                    // Adapt mock request/response for Vercel/Express handlers
                    const mockReq = {
                      method: req.method,
                      query: Object.fromEntries(urlObj.searchParams.entries()),
                      body: parsedBody,
                      headers: req.headers,
                    };

                    const mockRes = {
                      statusCode: 200,
                      setHeader(k: string, v: string) { res.setHeader(k, v); return this; },
                      status(code: number) { this.statusCode = code; return this; },
                      json(data: any) {
                        res.statusCode = this.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                        return this;
                      },
                      end(data?: any) {
                        res.statusCode = this.statusCode;
                        res.end(data);
                        return this;
                      },
                    };

                    await handler(mockReq, mockRes);
                    return;
                  }
                } catch (err: any) {
                  console.error('Error running dev API function:', err);
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
