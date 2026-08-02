import { fetchCollectionFromFirestore } from './dataClient.ts';
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
      fetchCollectionFromFirestore<Invoice>('invoices'),
      fetchCollectionFromFirestore<Product>('products'),
      fetchCollectionFromFirestore<Customer>('customers'),
      fetchCollectionFromFirestore<Supplier>('suppliers'),
      fetchCollectionFromFirestore<BankAccount>('bankAccounts'),
      fetchCollectionFromFirestore<LoanAccount>('loanAccounts'),
      fetchCollectionFromFirestore<Employee>('employees'),
      fetchCollectionFromFirestore<PurchaseOrder>('purchaseOrders'),
      fetchCollectionFromFirestore<Transaction>('transactions'),
      fetchCollectionFromFirestore<Attendance>('attendances'),
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
    console.error('Failed to query executive dashboard data:', error);
    throw error;
  }
}

export function clearDashboardCache() {
  cachedDashboardData = null;
}
