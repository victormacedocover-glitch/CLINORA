import { GoogleGenAI } from '@google/genai';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { patientName, contextType, details, clinicName } = body;
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
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, message: response.text.trim() }),
        };
      }
    }

    // Contextual fallback if API key is not configured or AI fails
    const defaultMessage = `Olá, ${patientName || 'Paciente'}! 😊\n\nAqui é da equipe da ${clinicName || 'sua clínica'}. Passando para saber como você está e se tem alguma dúvida sobre ${details || 'seu orçamento/tratamento'}.\n\nPodemos agendar o seu próximo horário? Fico à disposição para ajudar!`;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, message: defaultMessage, isFallback: true }),
    };
  } catch (err: any) {
    console.error('Error generating AI followup:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro ao gerar mensagem com IA', details: err?.message || 'Erro interno' }),
    };
  }
}
