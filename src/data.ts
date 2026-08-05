import {
  Product,
  Customer,
  Supplier,
  Invoice,
  PurchaseOrder,
  BankAccount,
  Transaction,
  AccountHead,
  Employee,
  Attendance,
  LoanAccount,
} from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Standard Premium cement',
    sku: 'PRM-CEM-01',
    category: 'Construction Materials',
    unit: 'Bags',
    warehouse: 'Main Warehouse',
    price: 480,
    cost: 410,
    stock: 120,
    alertQty: 20,
  },
  {
    id: 'p2',
    name: 'Deformed Steel Bar 60G (12mm)',
    sku: 'STL-BAR-12',
    category: 'Steel Items',
    unit: 'Tons',
    warehouse: 'Main Warehouse',
    price: 84000,
    cost: 78000,
    stock: 15,
    alertQty: 3,
  },
  {
    id: 'p3',
    name: 'Deformed Steel Bar 60G (16mm)',
    sku: 'STL-BAR-16',
    category: 'Steel Items',
    unit: 'Tons',
    warehouse: 'Yard B',
    price: 84500,
    cost: 79000,
    stock: 2, // low stock!
    alertQty: 5,
  },
  {
    id: 'p4',
    name: 'Bricks Grade A',
    sku: 'BRK-GRD-A',
    category: 'Bricks & Sand',
    unit: 'Pcs',
    warehouse: 'Yard A',
    price: 12,
    cost: 9.5,
    stock: 45000,
    alertQty: 10000,
  },
  {
    id: 'p5',
    name: 'Akok White Paint 20L',
    sku: 'PNT-WHT-20',
    category: 'Chemicals & Paint',
    unit: 'Drums',
    warehouse: 'Main Warehouse',
    price: 3600,
    cost: 2950,
    stock: 18,
    alertQty: 5,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Rony Mia',
    phone: '01712345678',
    email: 'rony.mia@gmail.com',
    group: 'Regular Retail',
    outstandingBalance: 0,
  },
  {
    id: 'c2',
    name: 'Rony',
    phone: '01887654321',
    email: 'rony.official@gmail.com',
    group: 'Regular Retail',
    outstandingBalance: 239.9,
  },
  {
    id: 'c3',
    name: 'Madani Builders Ltd.',
    phone: '01911122233',
    email: 'info@madanibuilders.com',
    group: 'Wholesale Contractor',
    outstandingBalance: 120500,
  },
  {
    id: 'c4',
    name: 'Zaman Enterprise',
    phone: '01511223344',
    email: 'zaman@enterprise.com',
    group: 'Retail Customer',
    outstandingBalance: 0,
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'Bashundhara Group Cement Div',
    phone: '02-9876543',
    email: 'cement.sales@bashundhara.com',
    companyName: 'Bashundhara Industrial Complex Ltd.',
    group: 'Local Producer',
    outstandingBalance: 3400000,
  },
  {
    id: 's2',
    name: 'BSRM Steel Depot',
    phone: '031-252156',
    email: 'bsrm.dhaka@bsrm.com',
    companyName: 'BSRM Steels Limited',
    group: 'National Supplier',
    outstandingBalance: 4001714.89,
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    invoiceNo: 'INV-007397',
    customerId: 'c1',
    customerName: 'Rony Mia',
    date: '2026-06-25',
    items: [
      {
        productId: 'p4',
        name: 'Bricks Grade A',
        quantity: 60,
        price: 12,
        subtotal: 720,
      },
    ],
    subtotal: 720,
    taxRate: 0.08,
    taxAmount: 0.6, // simple match to get total 720.60
    discount: 0,
    total: 720.6,
    paymentMethod: 'Cash',
    isPaid: true,
  },
  {
    id: 'inv2',
    invoiceNo: 'INV-007396',
    customerId: 'c2',
    customerName: 'Rony',
    date: '2026-06-25',
    items: [
      {
        productId: 'p1',
        name: 'Standard Premium cement',
        quantity: 10,
        price: 480,
        subtotal: 4800,
      },
    ],
    subtotal: 4800,
    taxRate: 0,
    taxAmount: 0,
    discount: 2,
    total: 4798.0,
    paymentMethod: 'Cash',
    isPaid: true,
  },
  {
    id: 'inv3',
    invoiceNo: 'INV-007395',
    customerId: 'c2',
    customerName: 'Rony',
    date: '2026-06-25',
    items: [
      {
        productId: 'p4',
        name: 'Bricks Grade A',
        quantity: 20,
        price: 12,
        subtotal: 240,
      },
    ],
    subtotal: 240,
    taxRate: 0,
    taxAmount: 0,
    discount: 0.1,
    total: 239.9,
    paymentMethod: 'Credit',
    isPaid: false,
  },
  {
    id: 'inv4',
    invoiceNo: 'INV-007394',
    customerId: 'c1',
    customerName: 'Rony Mia',
    date: '2026-06-25',
    items: [
      {
        productId: 'p5',
        name: 'Akok White Paint 20L',
        quantity: 5,
        price: 3600,
        subtotal: 18000,
      },
    ],
    subtotal: 18000,
    taxRate: 0,
    taxAmount: 0,
    discount: 2000,
    total: 16000.0,
    paymentMethod: 'Cash',
    isPaid: true,
  },
];

export const INITIAL_PO: PurchaseOrder[] = [
  {
    id: 'po1',
    poNo: 'PO-2026-001',
    supplierId: 's1',
    supplierName: 'Bashundhara Group Cement Div',
    date: '2026-06-20',
    items: [
      {
        productId: 'p1',
        name: 'Standard Premium cement',
        quantity: 500,
        cost: 410,
        subtotal: 205000,
      },
    ],
    subtotal: 205000,
    total: 205000,
    status: 'Received',
  },
  {
    id: 'po2',
    poNo: 'PO-2026-002',
    supplierId: 's2',
    supplierName: 'BSRM Steel Depot',
    date: '2026-06-24',
    items: [
      {
        productId: 'p2',
        name: 'Deformed Steel Bar 60G (12mm)',
        quantity: 10,
        cost: 78000,
        subtotal: 780000,
      },
    ],
    subtotal: 780000,
    total: 780000,
    status: 'Ordered',
  },
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'b1',
    accountName: 'Main Cash Account',
    accountNumber: 'MAIN-CASH-001',
    bankName: 'In-Hand Cash Vault',
    balance: 45000,
    type: 'Current',
  },
  {
    id: 'b2',
    accountName: 'Dutch Bangla Current Account',
    accountNumber: '102.110.456891',
    bankName: 'Dutch-Bangla Bank PLC',
    balance: 1450200,
    type: 'Current',
  },
  {
    id: 'b3',
    accountName: 'bKash Merchant Account',
    accountNumber: '01712345678',
    bankName: 'bKash Mobile Banking',
    balance: 85200,
    type: 'Mobile',
  },
  {
    id: 'b4',
    accountName: 'Standard Chartered Savings',
    accountNumber: '44-1293881-01',
    bankName: 'Standard Chartered Bank',
    balance: 500000,
    type: 'Savings',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    date: '2026-06-25',
    description: 'Cash sale matching INV-007397',
    type: 'Deposit',
    amount: 720.6,
    accountId: 'b1',
    category: 'Sales Income',
    referenceNo: 'INV-007397',
  },
  {
    id: 'tx2',
    date: '2026-06-25',
    description: 'Cash sale matching INV-007396',
    type: 'Deposit',
    amount: 4798.0,
    accountId: 'b1',
    category: 'Sales Income',
    referenceNo: 'INV-007396',
  },
  {
    id: 'tx3',
    date: '2026-06-25',
    description: 'Cash sale matching INV-007394',
    type: 'Deposit',
    amount: 16000.0,
    accountId: 'b1',
    category: 'Sales Income',
    referenceNo: 'INV-007394',
  },
  {
    id: 'tx4',
    date: '2026-06-24',
    description: 'Advance payment to Bashundhara Cement',
    type: 'Withdrawal',
    amount: 100000.0,
    accountId: 'b2',
    category: 'Purchasing Advance',
    referenceNo: 'PAY-8820',
  },
  {
    id: 'tx5',
    date: '2026-06-22',
    description: 'Office Rent June 2026',
    type: 'Expense',
    amount: 25000,
    accountId: 'b2',
    category: 'Rental Expense',
    referenceNo: 'TX-RNT-06',
  },
];

export const INITIAL_ACCOUNT_HEADS: AccountHead[] = [
  { id: 'ah1', name: 'Cash in Hand', code: '1010', type: 'Asset', balance: 45000 },
  { id: 'ah2', name: 'Cash at Bank', code: '1020', type: 'Asset', balance: 2035400 },
  { id: 'ah3', name: 'Accounts Receivable', code: '1030', type: 'Asset', balance: 120739.9 },
  { id: 'ah10', name: 'Merchandise Inventory', code: '1040', type: 'Asset', balance: 1804700 },
  { id: 'ah11', name: 'Raw Materials Inventory', code: '1041', type: 'Asset', balance: 500000 },
  { id: 'ah12', name: 'Finished Goods Inventory', code: '1042', type: 'Asset', balance: 1304700 },
  { id: 'ah4', name: 'Accounts Payable', code: '2010', type: 'Liability', balance: 7401714.89 },
  { id: 'ah5', name: 'Capital Equity', code: '3010', type: 'Equity', balance: 5000000 },
  { id: 'ah6', name: 'Sales Revenue', code: '4010', type: 'Revenue', balance: 21518.5 },
  { id: 'ah7', name: 'Cost of Goods Sold', code: '5010', type: 'Expense', balance: 14750 },
  { id: 'ah8', name: 'Office Rent Expense', code: '5020', type: 'Expense', balance: 25000 },
  { id: 'ah9', name: 'Salary & Wages Expense', code: '5030', type: 'Expense', balance: 112000 },
];

// Real, required Chart of Accounts structure with zero balances — this is NOT
// demo/fake data. handleAddInvoice and other posting logic in App.tsx hard-code
// these specific account codes (1010, 1020, 1030, 1040, 2010, 3010, 4010, 5010).
// Without these accounts existing, double-entry postings silently have nothing
// to update, which desyncs the Balance Sheet from real invoices/purchases.
// This is seeded regardless of VITE_ENABLE_DEMO_SEED, same as the minimal
// bootstrap branch in BranchManagementView.tsx.
export const MINIMAL_BOOTSTRAP_ACCOUNT_HEADS: AccountHead[] = INITIAL_ACCOUNT_HEADS.map((h) => ({
  ...h,
  balance: 0,
}));

// Same reasoning as above — 'b1' is referenced directly as a fallback bank
// account id throughout App.tsx's posting logic.
export const MINIMAL_BOOTSTRAP_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'b1',
    accountName: 'Main Cash Account',
    accountNumber: '',
    bankName: 'Cash in Hand',
    balance: 0,
    type: 'Current',
  },
];


export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: 'Asaduzzaman Khan',
    designation: 'General Manager',
    department: 'Administration',
    email: 'asad.khan@nexova.com',
    phone: '01711223344',
    joiningDate: '2024-01-15',
    salary: 45000,
    status: 'Active',
  },
  {
    id: 'e2',
    name: 'Farhana Yasmin',
    designation: 'Senior Accountant',
    department: 'Accounts',
    email: 'farhana.y@nexova.com',
    phone: '01822334455',
    joiningDate: '2024-06-01',
    salary: 32000,
    status: 'Active',
  },
  {
    id: 'e3',
    name: 'Rashedul Islam',
    designation: 'Warehouse Officer',
    department: 'Inventory',
    email: 'rashed.i@nexova.com',
    phone: '01933445566',
    joiningDate: '2025-02-10',
    salary: 18000,
    status: 'Active',
  },
  {
    id: 'e4',
    name: 'Sonia Akhter',
    designation: 'Sales Executive',
    department: 'Sales',
    email: 'sonia.a@nexova.com',
    phone: '01544556677',
    joiningDate: '2025-05-20',
    salary: 17000,
    status: 'Active',
  },
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  { id: 'at1', employeeId: 'e1', employeeName: 'Asaduzzaman Khan', date: '2026-07-06', status: 'Present', checkIn: '08:55 AM', checkOut: '05:05 PM' },
  { id: 'at2', employeeId: 'e2', employeeName: 'Farhana Yasmin', date: '2026-07-06', status: 'Present', checkIn: '08:48 AM', checkOut: '05:15 PM' },
  { id: 'at3', employeeId: 'e3', employeeName: 'Rashedul Islam', date: '2026-07-06', status: 'Late', checkIn: '09:20 AM', checkOut: '05:00 PM' },
  { id: 'at4', employeeId: 'e4', employeeName: 'Sonia Akhter', date: '2026-07-06', status: 'Present', checkIn: '08:52 AM', checkOut: '05:10 PM' },
];

export const INITIAL_LOANS: LoanAccount[] = [
  {
    id: 'l1',
    accountNo: 'LN-DBBL-2026-401',
    borrowerName: 'M/S Madani Traders (Business expansion)',
    amount: 1500000,
    interestRate: 9,
    durationMonths: 24,
    disbursedAmount: 1500000,
    outstandingAmount: 1250000,
    status: 'Active',
  },
  {
    id: 'l2',
    accountNo: 'LN-EMP-S42',
    borrowerName: 'Rashedul Islam (Staff Advance)',
    amount: 10000,
    interestRate: 0,
    durationMonths: 5,
    disbursedAmount: 10000,
    outstandingAmount: 4000,
    status: 'Active',
  },
];
