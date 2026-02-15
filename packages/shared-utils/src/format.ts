/**
 * Formate un montant en FCFA.
 * Ex: 15000 → "15 000 FCFA"
 */
export function formatXOF(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Formate un numéro de téléphone sénégalais.
 * Ex: 771234567 → "+221 77 123 45 67"
 */
export function formatPhoneSN(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const withPrefix = cleaned.startsWith('221') ? cleaned : `221${cleaned}`;
  return `+${withPrefix.slice(0, 3)} ${withPrefix.slice(3, 5)} ${withPrefix.slice(5, 8)} ${withPrefix.slice(8, 10)} ${withPrefix.slice(10, 12)}`;
}

/**
 * Formate une taille EU pour l'affichage.
 * Ex: 46 → "EU 46"
 */
export function formatSize(sizeEu: number, sizeUs?: number | null): string {
  let result = `EU ${sizeEu}`;
  if (sizeUs) {
    result += ` / US ${sizeUs}`;
  }
  return result;
}
