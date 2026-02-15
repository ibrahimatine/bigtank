import { COMMISSION_FREE_SALES, COMMISSION_PER_SALE_XOF } from './constants';

/**
 * Calcule la commission pour un vendeur en fonction de son nombre de ventes.
 * - 1ère vente : gratuite
 * - À partir de la 2e : 100 FCFA par vente
 */
export function calculateCommission(totalSalesCompleted: number): number {
  if (totalSalesCompleted < COMMISSION_FREE_SALES) {
    return 0;
  }
  return COMMISSION_PER_SALE_XOF;
}

/**
 * Vérifie si un vendeur bénéficie encore de ventes gratuites.
 */
export function hasFreeSalesRemaining(totalSalesCompleted: number): boolean {
  return totalSalesCompleted < COMMISSION_FREE_SALES;
}
