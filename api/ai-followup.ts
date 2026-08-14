import { GoogleGenAI } from '@google/genai';

interface FollowUpRequestBody {
  type?: 'budget_followup' | 'appointment_reminder' | 'post_procedure' | 'recall' | 'reactivation' | 'custom';
  patientName?: string;
  clinicName?: string;
  procedure?: string;
  date?: string;
  time?: string;
  channel?: 'whatsapp' | 'sms' | 'email';
  notes?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  // Enable CORS
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
    const body: FollowUpRequestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      type = 'budget_followup',
      patientName = 'Paciente',
      clinicName = 'Nossa Clínica',
      procedure = 'Consulta / Tratamento',
      date = '',
      time = '',
      channel = 'whatsapp',
      notes = '',
    } = body;

    const typeDescriptions: Record<string, string> = {
      budget_followup: 'Acompanhamento carinhoso de orçamento enviado anteriormente, perguntando se restou alguma dúvida e se deseja agendar.',
      appointment_reminder: `Lembrete cordial da consulta agendada para ${date || 'em breve'} às ${time || 'no horário combinado'}.`,
      post_procedure: 'Contato pós-atendimento para saber como o paciente está se sentindo e passar recomendações de cuidados.',
      recall: 'Convite para retorno de rotina preventiva e avaliação de manutenção da saúde.',
      reactivation: 'Mensagem simpática para paciente que não visita a clínica há algum tempo.',
      custom: 'Mensagem personalizada de atendimento clínico.',
    };

    const purposeDescription = typeDescriptions[type] || typeDescriptions.budget_followup;

    const prompt = `
Você é o assistente de relacionamento do software CLINORA.
Gere uma mensagem de follow-up personalizada, humanizada e empática.

DADOS:
- Objetivo do Contato: ${purposeDescription}
- Nome do Paciente: ${patientName}
- Nome da Clínica: ${clinicName}
- Procedimento / Assunto: ${procedure}
- Data/Hora de Referência: ${date} ${time}
- Canal de Envio: ${channel}
- Notas Especiais: ${notes || 'Nenhuma'}

DIRETRIZES:
1. Mensagem curta, calorosa e objetiva, ideal para leitura no ${channel === 'whatsapp' ? 'WhatsApp (com emojis moderados e quebras de linha limpas)' : 'E-mail'}.
2. Nunca soe invasivo ou insistente; transmita cuidado genuíno com o bem-estar do paciente.
3. Deixe fácil para o paciente responder com um simples 'Sim' ou tirar dúvidas.

Responda em formato JSON com as chaves:
- "message": texto completo pronto para envio.
- "subject": assunto resumido (para e-mail ou identificação interna).
- "suggestedChannel": "${channel}".
`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const outputText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(outputText);
    } catch {
      parsedResult = {
        message: outputText,
        subject: `Mensagem de ${clinicName}`,
        suggestedChannel: channel,
      };
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
    });
  } catch (err: any) {
    console.error('Error generating AI followup:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao gerar mensagem de follow-up com IA Gemini.',
    });
  }
}
