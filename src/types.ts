export interface BranchEnabledFeatures {
  sales: boolean;
  purchase: boolean;
  inventory: boolean;
  accounting: boolean;
  banking: boolean;
  crm: boolean;
  employee: boolean;
  manufacturing: boolean;
  projects: boolean;
  documents: boolean;
}

export interface BranchSharedFeatures {
  productCatalog: boolean;
  customerList: boolean;
  supplierList: boolean;
  chartOfAccounts: boolean;
}

export interface Branch {
  id: string;
  name: string;
  branchCode: string;
  address: string;
  phone: string;
  managerName: string;
  status: 'Active' | 'Inactive';
  isMainBranch: boolean;
  stockMode: 'shared' | 'independent';
  enabledFeatures: BranchEnabledFeatures;
  sharedFeatures: BranchSharedFeatures;
  assignedUserIds?: string[];
  createdAt: string;
}

export interface BranchStock {
  id: string; // branchId_productId
  branchId: string;
  productId: string;
  stock: number;
  reservedQty?: number;
  allocatedQty?: number;
  alertQty?: number;
  lastUpdated?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  warehouse: string;
  price: number;
  cost: number;
  stock: number;
  alertQty: number;
  pcsPerBox?: number;
  branchId?: string;
  branchStocks?: Record<string, number>;
  // Advanced Enterprise Inventory parameters
  reservedQty?: number;
  allocatedQty?: number;
  damagedQty?: number;
  transitQty?: number;
  onOrderQty?: number;
  minStock?: number;
  maxStock?: number;
  safetyStock?: number;
  abcClass?: 'A' | 'B' | 'C';
  xyzClass?: 'X' | 'Y' | 'Z';
  stockFreeze?: boolean;
  brand?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  group: string;
  outstandingBalance: number;
  branchId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  group: string;
  outstandingBalance: number;
  branchId?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  discount?: number;
  netRate?: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Credit' | 'Mobile Banking';
  isPaid: boolean;
  labourCost?: number;
  transportCost?: number;
  branchId?: string;
}

export interface POItem {
  productId: string;
  name: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: POItem[];
  subtotal: number;
  total: number;
  status: 'Ordered' | 'Received' | 'Cancelled';
  branchId?: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  type: 'Savings' | 'Current' | 'Mobile';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Income' | 'Expense';
  amount: number;
  accountId: string; // references BankAccount
  category: string;
  referenceNo?: string;
  branchId?: string;
  /** The two ledger legs created by this posting. Legacy records may not have them. */
  debitAccountCode?: string;
  creditAccountCode?: string;
  /** False for accrual/non-cash postings such as credit sales and COGS. */
  cashImpact?: boolean;
}

export interface AccountHead {
  id: string;
  name: string;
  code: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  joiningDate: string;
  salary: number;
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  checkIn?: string;
  checkOut?: string;
}

export interface LoanAccount {
  id: string;
  accountNo: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  disbursedAmount: number;
  outstandingAmount: number;
  status: 'Active' | 'Paid' | 'Disbursed' | 'Closed';
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  referenceNo: string;
}

export interface TaxRateSetting {
  id: string;
  name: string;
  rate: number;
  type: string; // 'Sales' | 'Purchase' | 'Both'
  status: 'Active' | 'Inactive';
}

export interface PaymentMethodSetting {
  id: string;
  name: string;
  type: string; // 'Cash' | 'Mobile Wallet' | 'Bank' | 'Card Gateway'
  charge: number;
  status: 'Active' | 'Inactive';
}

export interface UserSetting {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  assignedBranchIds?: string[];
  currentBranchId?: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  phone: string;
  tinNumber: string;
  binNumber: string;
  tradeLicense: string;
  defaultVatRate: number;
  defaultDiscountRate: number;
  baseCurrency: string;
  receiptFooterMessage: string;
  autoPrintReceipt: boolean;
  enableSmsNotification: boolean;
  defaultWarehouse: string;
  defaultUnit: string;
  lowStockThreshold: number;
  timezone: string;
  taxes?: TaxRateSetting[];
  paymentMethods?: PaymentMethodSetting[];
  usersList?: UserSetting[];
  
  supplierCreditTerms?: string;
  supplierCodePrefix?: string;
  reorderLeadTime?: number;
  supplierReqLimit?: number;

  customerCreditLimit?: number;
  customerGroupDefault?: string;
  customerGracePeriod?: number;
  customerAllowUnregistered?: boolean;

  productSkuRule?: string;
  productSkuPrefix?: string;
  productMarkup?: number;
  productValuation?: string;

  posDefaultCustomer?: string;
  posShowImageGrid?: boolean;
  posQuickDiscounts?: string;
  posCashDrawTrigger?: string;

  collectionBounceFee?: number;
  collectionEarlyDiscount?: number;
  collectionTargetDays?: number;
  collectionAutoAlloc?: boolean;

  loanDefaultInt?: number;
  loanMaxTenure?: number;
  loanEarlyRepayPenalty?: number;
  loanMinMargin?: number;

  salesReturnWindow?: string;
  salesRestockingFee?: number;
  salesReturnAction?: string;
  salesReturnInspection?: boolean;

  salesOrderAutoRelease?: boolean;
  salesOrderPartial?: boolean;
  salesOrderPrefix?: string;
  salesOrderTerms?: string;

  purchaseStrictPOAmt?: number;
  purchaseAutoReorder?: boolean;
  purchaseDefaultUnit?: string;
  purchaseGrnAutoDisburse?: boolean;

  entryAutoPosting?: boolean;
  entryLockDays?: number;
  entryVoucherPrefix?: string;
  entryAllowManualLedger?: boolean;
  isDbSeeded?: boolean;
  systemDateMode?: 'auto' | 'custom';
  systemCustomDate?: string;
  lastBackupAt?: string;
}

export function formatBoxQty(pcs: number, pcsPerBox?: number): string {
  if (!pcsPerBox || pcsPerBox <= 1) {
    return `${pcs} Pcs`;
  }
  const boxes = Math.floor(pcs / pcsPerBox);
  const remainingPcs = pcs % pcsPerBox;

  if (boxes > 0 && remainingPcs > 0) {
    return `${boxes} Box${boxes > 1 ? 's' : ''} ${remainingPcs} Pc${remainingPcs !== 1 ? 's' : ''}`;
  } else if (boxes > 0) {
    return `${boxes} Box${boxes > 1 ? 's' : ''}`;
  } else {
    return `${remainingPcs} Pc${remainingPcs !== 1 ? 's' : ''}`;
  }
}

export function getSystemDate(settings?: AppSettings): string {
  if (settings?.systemDateMode === 'custom' && settings?.systemCustomDate) {
    return settings.systemCustomDate;
  }
  return new Date().toISOString().split('T')[0];
}
