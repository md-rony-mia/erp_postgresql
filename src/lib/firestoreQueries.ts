import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';
import {
  Invoice,
  Product,
  Customer,
  Supplier,
  BankAccount,
  LoanAccount,
  Employee,
  PurchaseOrder,
  Transaction,
  Attendance,
} from '../types';

export interface ExecutiveDashboardData {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  bankAccounts: BankAccount[];
  loanAccounts: LoanAccount[];
  employees: Employee[];
  purchaseOrders: PurchaseOrder[];
  transactions: Transaction[];
  attendances: Attendance[];
  fetchedAt: number;
}

let cachedDashboardData: ExecutiveDashboardData | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export async function fetchExecutiveDashboardData(
  forceRefresh = false
): Promise<ExecutiveDashboardData> {
  const now = Date.now();
  if (!forceRefresh && cachedDashboardData && now - cachedDashboardData.fetchedAt < CACHE_TTL_MS) {
    return cachedDashboardData;
  }

  try {
    const fetchCol = async <T>(colName: string, maxItems = 200): Promise<T[]> => {
      try {
        const q = query(collection(db, colName), limit(maxItems));
        const snap = await getDocs(q);
        const results: T[] = [];
        snap.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        return results;
      } catch (err) {
        console.warn(`Firestore query failed for collection ${colName}:`, err);
        return [];
      }
    };

    const [
      invoices,
      products,
      customers,
      suppliers,
      bankAccounts,
      loanAccounts,
      employees,
      purchaseOrders,
      transactions,
      attendances,
    ] = await Promise.all([
      fetchCol<Invoice>('invoices'),
      fetchCol<Product>('products'),
      fetchCol<Customer>('customers'),
      fetchCol<Supplier>('suppliers'),
      fetchCol<BankAccount>('bankAccounts'),
      fetchCol<LoanAccount>('loanAccounts'),
      fetchCol<Employee>('employees'),
      fetchCol<PurchaseOrder>('purchaseOrders'),
      fetchCol<Transaction>('transactions'),
      fetchCol<Attendance>('attendances'),
    ]);

    const data: ExecutiveDashboardData = {
      invoices,
      products,
      customers,
      suppliers,
      bankAccounts,
      loanAccounts,
      employees,
      purchaseOrders,
      transactions,
      attendances,
      fetchedAt: Date.now(),
    };

    cachedDashboardData = data;
    return data;
  } catch (error) {
    console.error('Failed to query Firestore for executive dashboard:', error);
    throw error;
  }
}

export function clearDashboardCache() {
  cachedDashboardData = null;
}
