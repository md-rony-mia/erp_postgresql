import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, where } from 'firebase/firestore';
import { BranchStock } from '../types';

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
  const stockDocId = `${branchId}_${productId}`;
  const stockRef = doc(db, 'branch_stocks', stockDocId);

  try {
    const snap = await getDoc(stockRef);
    if (snap.exists()) {
      const current = snap.data() as BranchStock;
      const newQty = Math.max(0, (current.stock || 0) + qtyChange);
      await updateDoc(stockRef, {
        stock: newQty,
        lastUpdated: new Date().toISOString(),
      });
      return newQty;
    } else {
      const initialStock = Math.max(0, qtyChange);
      const newDoc: BranchStock = {
        id: stockDocId,
        branchId,
        productId,
        stock: initialStock,
        lastUpdated: new Date().toISOString(),
      };
      await setDoc(stockRef, newDoc);
      return initialStock;
    }
  } catch (err) {
    console.error(`Error updating branch stock for ${stockDocId}:`, err);
    return 0;
  }
}

/**
 * Fetches branch stock documents for a specific branch
 */
export async function fetchBranchStocks(branchId: string): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  try {
    const q = query(collection(db, 'branch_stocks'), where('branchId', '==', branchId));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as BranchStock;
      if (data.productId) {
        map[data.productId] = data.stock || 0;
      }
    });
  } catch (e) {
    console.warn(`Error fetching branch stocks for ${branchId}:`, e);
  }
  return map;
}
