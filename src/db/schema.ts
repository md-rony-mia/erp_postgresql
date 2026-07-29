import { pgTable, serial, text, numeric, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name'),
  email: text('email').notNull(),
  role: text('role'),
  username: text('username'),
  status: text('status').default('Active'),
  avatar: text('avatar'),
  assignedBranchIds: jsonb('assigned_branch_ids'),
  currentBranchId: text('current_branch_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  branchCode: text('branch_code'),
  address: text('address'),
  phone: text('phone'),
  managerName: text('manager_name'),
  status: text('status').default('Active'),
  isMainBranch: boolean('is_main_branch').default(false),
  stockMode: text('stock_mode').default('shared'),
  enabledFeatures: jsonb('enabled_features'),
  sharedFeatures: jsonb('shared_features'),
  assignedUserIds: jsonb('assigned_user_ids'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const branchStocks = pgTable('branch_stocks', {
  id: text('id').primaryKey(), // branchId_productId
  branchId: text('branch_id').notNull(),
  productId: text('product_id').notNull(),
  stock: numeric('stock').default('0'),
  reservedQty: numeric('reserved_qty').default('0'),
  allocatedQty: numeric('allocated_qty').default('0'),
  alertQty: numeric('alert_qty').default('0'),
  lastUpdated: text('last_updated'),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku'),
  category: text('category'),
  unit: text('unit'),
  warehouse: text('warehouse'),
  price: numeric('price').default('0'),
  cost: numeric('cost').default('0'),
  stock: numeric('stock').default('0'),
  alertQty: numeric('alert_qty').default('0'),
  pcsPerBox: numeric('pcs_per_box').default('1'),
  branchId: text('branch_id'),
  branchStocks: jsonb('branch_stocks'),
  reservedQty: numeric('reserved_qty').default('0'),
  allocatedQty: numeric('allocated_qty').default('0'),
  damagedQty: numeric('damaged_qty').default('0'),
  transitQty: numeric('transit_qty').default('0'),
  onOrderQty: numeric('on_order_qty').default('0'),
  minStock: numeric('min_stock').default('0'),
  maxStock: numeric('max_stock').default('0'),
  safetyStock: numeric('safety_stock').default('0'),
  abcClass: text('abc_class'),
  xyzClass: text('xyz_class'),
  stockFreeze: boolean('stock_freeze').default(false),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  groupName: text('group_name'),
  outstandingBalance: numeric('outstanding_balance').default('0'),
  branchId: text('branch_id'),
});

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  companyName: text('company_name'),
  groupName: text('group_name'),
  outstandingBalance: numeric('outstanding_balance').default('0'),
  branchId: text('branch_id'),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNo: text('invoice_no').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  date: text('date'),
  items: jsonb('items'),
  subtotal: numeric('subtotal').default('0'),
  taxRate: numeric('tax_rate').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discount: numeric('discount').default('0'),
  total: numeric('total').default('0'),
  paymentMethod: text('payment_method'),
  isPaid: boolean('is_paid').default(false),
  labourCost: numeric('labour_cost').default('0'),
  transportCost: numeric('transport_cost').default('0'),
  branchId: text('branch_id'),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  poNo: text('po_no').notNull(),
  supplierId: text('supplier_id'),
  supplierName: text('supplier_name'),
  date: text('date'),
  items: jsonb('items'),
  subtotal: numeric('subtotal').default('0'),
  total: numeric('total').default('0'),
  status: text('status'),
  branchId: text('branch_id'),
});

export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(),
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number'),
  bankName: text('bank_name'),
  balance: numeric('balance').default('0'),
  type: text('type'),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date'),
  description: text('description'),
  type: text('type'),
  amount: numeric('amount').default('0'),
  accountId: text('account_id'),
  category: text('category'),
  referenceNo: text('reference_no'),
  branchId: text('branch_id'),
});

export const accountHeads = pgTable('account_heads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  type: text('type'),
  balance: numeric('balance').default('0'),
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  designation: text('designation'),
  department: text('department'),
  email: text('email'),
  phone: text('phone'),
  joiningDate: text('joining_date'),
  salary: numeric('salary').default('0'),
  status: text('status').default('Active'),
});

export const attendances = pgTable('attendances', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  employeeName: text('employee_name'),
  date: text('date'),
  status: text('status'),
  checkIn: text('check_in'),
  checkOut: text('check_out'),
});

export const loanAccounts = pgTable('loan_accounts', {
  id: text('id').primaryKey(),
  accountNo: text('account_no').notNull(),
  borrowerName: text('borrower_name'),
  amount: numeric('amount').default('0'),
  interestRate: numeric('interest_rate').default('0'),
  durationMonths: numeric('duration_months').default('0'),
  disbursedAmount: numeric('disbursed_amount').default('0'),
  outstandingAmount: numeric('outstanding_amount').default('0'),
  status: text('status'),
});

export const loanRepayments = pgTable('loan_repayments', {
  id: text('id').primaryKey(),
  loanId: text('loan_id').notNull(),
  date: text('date'),
  amount: numeric('amount').default('0'),
  principal: numeric('principal').default('0'),
  interest: numeric('interest').default('0'),
  referenceNo: text('reference_no'),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  data: jsonb('data'),
});
