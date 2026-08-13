import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini Client initialization
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Follow-up Endpoint (Etapas 3 e 11)
  app.post('/api/ai/followup', async (req, res) => {
    try {
      const { patientName, contextType, details, clinicName } = req.body;
      const ai = getGeminiClient();

      if (ai) {
        const prompt = `Você é o assistente virtual da clínica "${clinicName || 'Nossa Clínica'}".
Gere uma mensagem profissional, amigável e persuasiva para ser enviada pelo WhatsApp para o paciente "${patientName || 'Cliente'}".
Contexto: ${contextType || 'Acompanhamento do tratamento / Orçamento'}
Detalhes: ${details || 'Retorno para verificar interesse em agendar ou aprovar o orçamento.'}

Diretrizes:
- Use tom humano, acolhedor e atencioso.
- Mantenha a mensagem curta, perfeita para WhatsApp (1 a 3 parágrafos).
- Inclua emojis relevantes.
- Termine com uma pergunta simpática incentivando a resposta.
- Retorne APENAS o texto da mensagem pronta para envio.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        if (response?.text) {
          return res.json({ success: true, message: response.text.trim() });
        }
      }

      // Contextual fallback if API key is not configured
      const defaultMessage = `Olá, ${patientName || 'Paciente'}! 😊

Aqui é da equipe da ${clinicName || 'sua clínica'}. Passando para saber como você está e se tem alguma dúvida sobre ${details || 'seu orçamento/tratamento'}.

Podemos agendar o seu próximo horário? Fico à disposição para ajudar!`;

      res.json({ success: true, message: defaultMessage, isFallback: true });
    } catch (err: any) {
      console.error('Error generating AI followup:', err);
      res.status(500).json({ error: 'Erro ao gerar mensagem com IA', details: err?.message || 'Erro interno' });
    }
  });

  // AI Budget Generator Endpoint (Etapa 6)
  app.post('/api/ai/budget', async (req, res) => {
    try {
      const { patientName, procedure, information, price, observations, clinicName } = req.body;
      const ai = getGeminiClient();

      if (ai) {
        const prompt = `Você é um especialista em comunicação e vendas da clínica "${clinicName || 'Nossa Clínica'}".
Crie uma proposta de orçamento profissional, detalhada e persuasiva para o paciente.

Dados informados pelo usuário:
- Paciente: ${patientName}
- Procedimento / Serviço: ${procedure}
- Informações / Necessidade do Paciente: ${information || 'Tratamento recomendado pelo especialista.'}
- Valor do Investimento: R$ ${price}
- Observações / Validade: ${observations || 'Validade de 15 dias.'}

Regras ESTRITAS:
- NUNCA invente valores ou procedimentos. Utilize estritamente R$ ${price} e o procedimento "${procedure}".
- Elabore um TÍTULO atrativo para a proposta.
- Escreva uma DESCRIÇÃO PROFISSIONAL do procedimento ressaltando os benefícios e resultados esperados.
- Liste os BENEFÍCIOS em tópicos.
- Descreva as CONDIÇÕES DE PAGAMENTO.
- Para a "whatsappMessage", crie uma mensagem comercial pronta para WhatsApp no seguinte formato estruturado:
  1. Saudação personalizada com emoji e nome do paciente ("Olá, ${patientName}! 😊").
  2. Apresentação do procedimento ("Preparamos seu orçamento para o procedimento de ${procedure}.").
  3. Valor exato ("O investimento é de R$ ${price}.").
  4. Resumo com benefícios e condições.
  5. Validade se existente.
  6. Chamada para ação ("Podemos agendar seu atendimento?").
  7. Assinatura ("${clinicName || 'Nossa Clínica'}").

Retorne em formato JSON válido com as chaves:
{
  "title": "...",
  "description": "...",
  "benefits": ["...", "..."],
  "conditions": "...",
  "validity": "...",
  "whatsappMessage": "..."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response?.text) {
          try {
            const parsed = JSON.parse(response.text.trim());
            return res.json({ success: true, budgetData: parsed });
          } catch (pErr) {
            console.warn('Failed to parse JSON from Gemini response, raw:', response.text);
          }
        }
      }

      // Structured fallback if API key is not configured or parsing fails
      const fallbackBudgetData = {
        title: `Proposta de Orçamento — ${procedure}`,
        description: `Elaboramos uma proposta personalizada para o procedimento de ${procedure}. Nosso objetivo é garantir o seu bem-estar, estética e saúde funcional com máxima excelência. ${information ? `\n\nDetalhes do caso: ${information}` : ''}`,
        benefits: [
          'Atendimento personalizado com profissionais especializados',
          'Tecnologia de ponta e materiais de alta qualidade',
          'Acompanhamento e suporte pré e pós-procedimento',
        ],
        conditions: `Investimento total de R$ ${price}. Consulte condições especiais de parcelamento no cartão ou desconto à vista.`,
        validity: observations || 'Validade de 15 dias.',
        whatsappMessage: `Olá, ${patientName}! 😊\n\nPreparamos seu orçamento para o procedimento de ${procedure}.\n\nO investimento é de R$ ${price}.\n\n${observations ? `${observations}\n\n` : ''}Se tiver qualquer dúvida, estou à disposição.\n\nPodemos agendar seu atendimento?\n\n${clinicName || 'Nossa Clínica'}`,
      };

      res.json({ success: true, budgetData: fallbackBudgetData, isFallback: true });
    } catch (err: any) {
      console.error('Error generating AI budget:', err);
      res.status(500).json({ error: 'Erro ao gerar orçamento com IA', details: err?.message || 'Erro interno' });
    }
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
