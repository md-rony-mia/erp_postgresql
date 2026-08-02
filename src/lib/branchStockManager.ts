import { BranchStock } from '../types';

const TOKEN_KEY = 'nexova_auth_token';

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Updates stock quantity for a product at a specific independent branch.
 * @param branchId Branch ID
 * @param productId Product ID
 * @param qtyChange Positive number for stock additions (e.g. PO received), negative for sales
 */
export async function updateBranchProductStock(
  branchId: string,
  productId: string,
  qtyChange: number
): Promise<number> {
  try {
    const res = await fetch('/api/branch-stock/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ branchId, productId, qtyChange }),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const body = await res.json();
    return body.stock as number;
  } catch (err) {
    console.error(`Error updating branch stock for ${branchId}_${productId}:`, err);
    return 0;
  }
}

/**
 * Fetches branch stock levels for a specific branch, keyed by productId.
 */
export async function fetchBranchStocks(branchId: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/branch-stock/${branchId}`, { headers: authHeaders() });
    if (!res.ok) return {};
    const body = await res.json();
    return (body.stocks || {}) as Record<string, number>;
  } catch (e) {
    console.warn(`Error fetching branch stocks for ${branchId}:`, e);
    return {};
  }
}
