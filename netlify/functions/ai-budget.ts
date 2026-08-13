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

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { patientName, procedure, information, price, observations, clinicName } = body;
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
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, budgetData: parsed }),
          };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, budgetData: fallbackBudgetData, isFallback: true }),
    };
  } catch (err: any) {
    console.error('Error generating AI budget:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao gerar orçamento com IA', details: err?.message || 'Erro interno' }),
    };
  }
}
