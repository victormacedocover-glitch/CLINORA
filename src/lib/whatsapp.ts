/**
 * Telefone e Deep Link Utility para o WhatsApp no CLINORA
 */

/**
 * Normaliza um número de telefone para o formato internacional do WhatsApp (55 + DDD + Número)
 * @param phone String de telefone informada no cadastro
 * @returns String normalizada contendo apenas números (ex: 5511999999999) ou null se inválido
 */
export function normalizePhoneBR(phone?: string | null): string | null {
  if (!phone) return null;

  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '');

  if (!digits) return null;

  // Se já tiver 12 ou 13 dígitos e começar com 55 (ex: 55 + DDD + 8 ou 9 dígitos)
  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55')) {
    return digits;
  }

  // Se tiver 10 ou 11 dígitos (DDD + 8 ou 9 dígitos locais)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se já tiver código internacional completo (12 a 15 dígitos)
  if (digits.length >= 12 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/**
 * Valida se um número de telefone é um número do WhatsApp válido
 */
export function isValidPhoneBR(phone?: string | null): boolean {
  const normalized = normalizePhoneBR(phone);
  return Boolean(normalized && normalized.length >= 12 && normalized.length <= 13);
}

/**
 * Gera a URL oficial do deep link do WhatsApp (https://wa.me/NUMERO?text=MENSAGEM)
 */
export function getWhatsAppUrl(phone?: string | null, message?: string): { url: string | null; error?: string } {
  const normalized = normalizePhoneBR(phone);

  if (!normalized || normalized.length < 12) {
    return {
      url: null,
      error: 'Este paciente não possui um telefone cadastrado ou o número é inválido.',
    };
  }

  const encodedText = message ? encodeURIComponent(message) : '';
  const url = `https://wa.me/${normalized}?text=${encodedText}`;

  return { url, error: undefined };
}

/**
 * Tenta abrir o WhatsApp diretamente no navegador/app
 */
export function openWhatsApp(phone?: string | null, message?: string): { success: boolean; error?: string } {
  const { url, error } = getWhatsAppUrl(phone, message);

  if (!url || error) {
    return { success: false, error: error || 'Telefone inválido.' };
  }

  // Abre em nova aba / aplicativo WhatsApp
  window.open(url, '_blank', 'noopener,noreferrer');
  return { success: true };
}
