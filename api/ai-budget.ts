import { GoogleGenAI } from '@google/genai';

interface BudgetRequestBody {
  patientName?: string;
  clinicName?: string;
  procedures?: string | Array<{ name: string; price?: number }>;
  totalAmount?: number;
  conditions?: string;
  notes?: string;
  tone?: 'formal' | 'amigavel' | 'persuasivo' | 'clinico';
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
    const body: BudgetRequestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      patientName = 'Paciente',
      clinicName = 'Nossa Clínica',
      procedures = 'Procedimentos Odontológicos / Estéticos',
      totalAmount,
      conditions = 'Pagamento facilitado em até 12x no cartão ou à vista',
      notes = '',
      tone = 'amigavel',
    } = body;

    const proceduresText = Array.isArray(procedures)
      ? procedures.map((p) => `- ${p.name}${p.price ? ` (R$ ${p.price.toFixed(2)})` : ''}`).join('\n')
      : String(procedures);

    const amountFormatted = totalAmount != null
      ? `R$ ${Number(totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'A consultar';

    const prompt = `
Você é o assistente clínico do software CLINORA.
Gere uma proposta de orçamento elegante, humanizada e transparente para o paciente a seguir.

INFORMAÇÕES:
- Nome do Paciente: ${patientName}
- Clínica: ${clinicName}
- Procedimentos propostos:
${proceduresText}
- Valor Total do Tratamento: ${amountFormatted}
- Condições de Pagamento: ${conditions}
- Observações Clínicas Adicionais: ${notes || 'Nenhuma'}
- Tom de Comunicação: ${tone}

ESTRUTURA DESEJADA:
1. Saudação cordial e acolhedora.
2. Apresentação clara do plano de tratamento e valorização da saúde/autoestima do paciente.
3. Resumo dos procedimentos e benefícios esperados.
4. Apresentação do investimento e facilidades de pagamento.
5. Chamada para ação calorosa convidando para confirmar e agendar o início do tratamento.
6. Assinatura com o nome da clínica.

Responda em formato JSON com as chaves:
- "proposalText": texto completo formatado para WhatsApp/E-mail.
- "patientSummary": resumo em 2 frases sobre os benefícios do tratamento.
- "paymentOptions": resumo das condições de pagamento.
- "nextSteps": passo a passo sugerido para o paciente iniciar.
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
        proposalText: outputText,
        patientSummary: 'Plano de tratamento personalizado.',
        paymentOptions: conditions,
        nextSteps: 'Entre em contato com nossa equipe para agendar.',
      };
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
    });
  } catch (err: any) {
    console.error('Error generating AI budget:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao gerar proposta com IA Gemini.',
    });
  }
}
