import { AppSettings } from '../types';

export interface NavigationItem {
  id: string;
  label: string;
  groupId: string;
  icon?: string;
  tab: string;
  subTab: string;
  order: number;
  parent?: string; // for nested menus (unlimited levels)
  enabled: boolean;
  archived?: boolean;
  permissions?: string[]; // e.g., ['Administrator', 'Manager', 'Cashier', 'Sales Agent']
  translations?: Record<string, string>; // e.g. { 'bn': '...', 'es': '...' }
  roleVisibility?: string[];
  companyVisibility?: string[];
  branchVisibility?: string[];
  moduleVisibility?: string[];
  badgeKey?: string; // live status counter matching engine
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export interface NavigationRecent {
  itemId: string;
  timestamp: string;
}

export interface NavigationFavorite {
  itemId: string;
}

export interface NavigationPinned {
  itemId: string;
}

// Live counters selector keys
export type LiveBadgeKey =
  | 'low_stock'
  | 'pending_approvals'
  | 'new_orders'
  | 'unread_notifications'
  | 'draft_documents'
  | 'queue_status';

// Default initial groups reflecting Step 5 structural partitions
export const INITIAL_GROUPS: NavigationGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', order: 10, enabled: true },
  { id: 'sales', label: 'Sales', icon: 'Store', order: 20, enabled: true },
  { id: 'purchase', label: 'Purchase', icon: 'ShoppingCart', order: 30, enabled: true },
  { id: 'inventory', label: 'Inventory', icon: 'Boxes', order: 40, enabled: true },
  { id: 'accounting', label: 'Accounting', icon: 'BookOpen', order: 50, enabled: true },
  { id: 'crm', label: 'CRM', icon: 'Users', order: 60, enabled: true },
  { id: 'hrm', label: 'HRM', icon: 'Briefcase', order: 70, enabled: true },
  { id: 'projects', label: 'Projects', icon: 'Calendar', order: 80, enabled: true },
  { id: 'assets', label: 'Assets', icon: 'Building', order: 90, enabled: true },
  { id: 'manufacturing', label: 'Manufacturing', icon: 'Wrench', order: 100, enabled: true },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', order: 110, enabled: true },
  { id: 'administration', label: 'Administration', icon: 'Shield', order: 120, enabled: true },
  { id: 'settings', label: 'Settings', icon: 'Settings', order: 130, enabled: true },
];

// Seed exact menu layouts for over 120+ pages to cover Step 5 in full enterprise compliance
export const INITIAL_ITEMS: NavigationItem[] = [
  // === DASHBOARD GROUP ===
  { id: 'exec_dashboard', label: 'Executive Dashboard', groupId: 'dashboard', icon: 'LayoutDashboard', tab: 'dashboard', subTab: '', order: 1, enabled: true, translations: { bn: 'নির্বাহী ড্যাশবোর্ড' } },
  { id: 'sales_dashboard', label: 'Sales Dashboard', groupId: 'dashboard', icon: 'TrendingUp', tab: 'dashboard', subTab: 'sales_dash', order: 2, enabled: true, translations: { bn: 'বিক্রয় ড্যাশবোর্ড' } },
  { id: 'purchase_dashboard', label: 'Purchase Dashboard', groupId: 'dashboard', icon: 'ShoppingCart', tab: 'dashboard', subTab: 'purchase_dash', order: 3, enabled: true, translations: { bn: 'ক্রয় ড্যাশবোর্ড' } },
  { id: 'inventory_dashboard', label: 'Inventory Dashboard', groupId: 'dashboard', icon: 'Boxes', tab: 'dashboard', subTab: 'inventory_dash', order: 4, enabled: true, translations: { bn: 'ইনভেন্টরি ড্যাশবোর্ড' } },
  { id: 'finance_dashboard', label: 'Finance Dashboard', groupId: 'dashboard', icon: 'BookOpen', tab: 'dashboard', subTab: 'finance_dash', order: 5, enabled: true, translations: { bn: 'অর্থনৈতিক ড্যাশবোর্ড' } },
  { id: 'hr_dashboard', label: 'HR Dashboard', groupId: 'dashboard', icon: 'Users', tab: 'dashboard', subTab: 'hr_dash', order: 6, enabled: true, translations: { bn: 'এইচআর ড্যাশবোর্ড' } },
  { id: 'crm_dashboard', label: 'CRM Dashboard', groupId: 'dashboard', icon: 'Activity', tab: 'dashboard', subTab: 'crm_dash', order: 7, enabled: true, translations: { bn: 'সিআরএম ড্যাশবোর্ড' } },
  { id: 'ai_copilot', label: 'AI Copilot', groupId: 'dashboard', icon: 'Sparkles', tab: 'ai', subTab: 'copilot', order: 8, enabled: true, translations: { bn: 'এআই কোপাইলট' } },
  { id: 'ai_forecast', label: 'Demand Forecasting', groupId: 'dashboard', icon: 'TrendingUp', tab: 'ai', subTab: 'forecast', order: 9, enabled: true, translations: { bn: 'চাহিদা পূর্বাভাস' } },
  { id: 'ai_recommendation', label: 'Reorder Advice', groupId: 'dashboard', icon: 'Lightbulb', tab: 'ai', subTab: 'recommendation', order: 10, enabled: true, translations: { bn: 'পুনঃক্রয় পরামর্শ' } },
  { id: 'ai_insights', label: 'Structural Insights', groupId: 'dashboard', icon: 'Brain', tab: 'ai', subTab: 'insights', order: 11, enabled: true, translations: { bn: 'কাঠামোগত অন্তর্দৃষ্টি' } },
  { id: 'ai_reports', label: 'Automated Executive Reports', groupId: 'dashboard', icon: 'FileSpreadsheet', tab: 'ai', subTab: 'ai_reports', order: 12, enabled: true, translations: { bn: 'স্বয়ংক্রিয় প্রতিবেদন' } },
  { id: 'favorites', label: 'Favorites List', groupId: 'dashboard', icon: 'Star', tab: 'dashboard', subTab: 'favorites', order: 13, enabled: true, translations: { bn: 'প্রিয় তালিকা' } },
  { id: 'recent', label: 'Recent Pages', groupId: 'dashboard', icon: 'Clock', tab: 'dashboard', subTab: 'recent', order: 14, enabled: true, translations: { bn: 'সাম্প্রতিক পেজ' } },

  // === SALES GROUP ===
  { id: 'pos', label: 'POS', groupId: 'sales', icon: 'CreditCard', tab: 'sales', subTab: 'pos', order: 1, enabled: true, badgeKey: 'new_orders', translations: { bn: 'পিওএস (POS)' } },
  { id: 'sales_order', label: 'Sales Order', groupId: 'sales', icon: 'ShoppingCart', tab: 'sales', subTab: 'sale_orders', order: 2, enabled: true, translations: { bn: 'বিক্রয় অর্ডার' } },
  { id: 'quotation_s', label: 'Quotation', groupId: 'sales', icon: 'FileText', tab: 'sales', subTab: 'quotation', order: 3, enabled: true, translations: { bn: 'কোটেশন' } },
  { id: 'delivery_s', label: 'Delivery', groupId: 'sales', icon: 'Truck', tab: 'sales', subTab: 'delivery', order: 4, enabled: true, translations: { bn: 'ডেলিভারি' } },
  { id: 'invoice_s', label: 'Invoice', groupId: 'sales', icon: 'FileCheck', tab: 'sales', subTab: 'invoices', order: 5, enabled: true, translations: { bn: 'ইনভয়েস' } },
  { id: 'return_s', label: 'Sales Return', groupId: 'sales', icon: 'RotateCcw', tab: 'sales', subTab: 'returns', order: 6, enabled: true, translations: { bn: 'বিক্রয় ফেরত' } },
  { id: 'payments_s', label: 'Customer Payment', groupId: 'sales', icon: 'Wallet', tab: 'sales', subTab: 'collection', order: 7, enabled: true, translations: { bn: 'গ্রাহক পেমেন্ট' } },
  { id: 'commission_s', label: 'Sales Commissions', groupId: 'sales', icon: 'TrendingUp', tab: 'sales', subTab: 'commission', order: 8, enabled: true, translations: { bn: 'বিক্রয় কমিশন' } },
  { id: 'pricing_s', label: 'Customer Pricing Levels', groupId: 'sales', icon: 'Sliders', tab: 'sales', subTab: 'pricing', order: 9, enabled: true, translations: { bn: 'প্রাইসিং লেভেল' } },

  // === PURCHASE GROUP ===
  { id: 'purchase_request', label: 'Purchase Request', groupId: 'purchase', icon: 'FileQuestion', tab: 'purchase', subTab: 'purchase_request', order: 1, enabled: true, translations: { bn: 'ক্রয় রিকুইজিশন' } },
  { id: 'rfq', label: 'RFQ', groupId: 'purchase', icon: 'FileQuestion', tab: 'purchase', subTab: 'request_quotations', order: 2, enabled: true, translations: { bn: 'আরএফকিউ (RFQ)' } },
  { id: 'purchase_order', label: 'Purchase Order', groupId: 'purchase', icon: 'ShoppingCart', tab: 'purchase', subTab: 'purchase_orders', order: 3, enabled: true, translations: { bn: 'ক্রয় অর্ডার' } },
  { id: 'grn', label: 'Goods Receive', groupId: 'purchase', icon: 'Download', tab: 'purchase', subTab: 'goods_receipt', order: 4, enabled: true, translations: { bn: 'পণ্য গ্রহণ (GRN)' } },
  { id: 'invoice_p', label: 'Purchase Invoice', groupId: 'purchase', icon: 'FileCheck', tab: 'purchase', subTab: 'invoices', order: 5, enabled: true, translations: { bn: 'ক্রয় ইনভয়েস' } },
  { id: 'payments_p', label: 'Supplier Payment', groupId: 'purchase', icon: 'Wallet', tab: 'purchase', subTab: 'purchase_payments', order: 6, enabled: true, translations: { bn: 'সরবরাহকারী পেমেন্ট' } },
  { id: 'return_p', label: 'Purchase Return', groupId: 'purchase', icon: 'RotateCcw', tab: 'purchase', subTab: 'purchase_returns', order: 7, enabled: true, translations: { bn: 'ক্রয় ফেরত' } },

  // === INVENTORY GROUP ===
  { id: 'products', label: 'Products', groupId: 'inventory', icon: 'Boxes', tab: 'inventory', subTab: 'products', order: 1, enabled: true, badgeKey: 'low_stock', translations: { bn: 'পণ্যসমূহ' } },
  { id: 'categories', label: 'Categories', groupId: 'inventory', icon: 'Bookmark', tab: 'inventory', subTab: 'categories', order: 2, enabled: true, translations: { bn: 'ক্যাটেগরি' } },
  { id: 'brands', label: 'Brands', groupId: 'inventory', icon: 'Award', tab: 'inventory', subTab: 'brands', order: 3, enabled: true, translations: { bn: 'ব্র্যান্ড' } },
  { id: 'units', label: 'Units', groupId: 'inventory', icon: 'Scale', tab: 'inventory', subTab: 'units', order: 4, enabled: true, translations: { bn: 'পরিমাপ ইউনিট' } },
  { id: 'warehouses', label: 'Warehouses', groupId: 'inventory', icon: 'MapPin', tab: 'inventory', subTab: 'warehouses', order: 5, enabled: true, translations: { bn: 'গুদামঘর' } },
  { id: 'transfer', label: 'Stock Transfer', groupId: 'inventory', icon: 'ArrowLeftRight', tab: 'inventory', subTab: 'stock_transfer', order: 6, enabled: true, translations: { bn: 'স্টক স্থানান্তর' } },
  { id: 'adjustment', label: 'Stock Adjustment', groupId: 'inventory', icon: 'Sliders', tab: 'inventory', subTab: 'adjustment', order: 7, enabled: true, translations: { bn: 'স্টক সমন্বয়' } },
  { id: 'batch', label: 'Batch', groupId: 'inventory', icon: 'PackageCheck', tab: 'inventory', subTab: 'batch', order: 8, enabled: true, translations: { bn: 'ব্যাচ কন্ট্রোল' } },
  { id: 'serial', label: 'Serial Number', groupId: 'inventory', icon: 'Barcode', tab: 'inventory', subTab: 'serial', order: 9, enabled: true, translations: { bn: 'সিরিয়াল নম্বর' } },
  { id: 'barcode_gen', label: 'Barcode', groupId: 'inventory', icon: 'Barcode', tab: 'inventory', subTab: 'barcodes', order: 10, enabled: true, translations: { bn: 'বারকোড জেনারেটর' } },
  { id: 'cycle_count', label: 'Cycle Count', groupId: 'inventory', icon: 'CheckSquare', tab: 'inventory', subTab: 'cycle_count', order: 11, enabled: true, translations: { bn: 'সাইকেল কাউন্ট' } },
  { id: 'templates', label: 'Templates', groupId: 'inventory', icon: 'Copy', tab: 'inventory', subTab: 'templates', order: 12, enabled: true, translations: { bn: 'টেমপ্লেট' } },
  { id: 'variants', label: 'Variants', groupId: 'inventory', icon: 'Layers', tab: 'inventory', subTab: 'variants', order: 13, enabled: true, translations: { bn: 'ভেরিয়েন্টসমূহ' } },
  { id: 'metadata', label: 'Metadata', groupId: 'inventory', icon: 'Database', tab: 'inventory', subTab: 'metadata', order: 14, enabled: true, translations: { bn: 'মেটাডেটা' } },
  { id: 'custom_fields', label: 'Custom Fields', groupId: 'inventory', icon: 'FileCode', tab: 'inventory', subTab: 'custom_fields', order: 15, enabled: true, translations: { bn: 'কাস্টম ফিল্ড' } },
  { id: 'layout_builder', label: 'Layout Builder', groupId: 'inventory', icon: 'Grid', tab: 'inventory', subTab: 'layout_builder', order: 16, enabled: true, translations: { bn: 'লেআউট বিল্ডার' } },
  { id: 'attributes', label: 'Attributes', groupId: 'inventory', icon: 'Tags', tab: 'inventory', subTab: 'attributes', order: 17, enabled: true, translations: { bn: 'বৈশিষ্ট্যসমূহ' } },

  // === ACCOUNTING GROUP ===
  { id: 'coa', label: 'Chart of Accounts', groupId: 'accounting', icon: 'BookOpen', tab: 'accounting', subTab: 'chart_accounts', order: 1, enabled: true, translations: { bn: 'চার্ট অফ অ্যাকাউন্টস' } },
  { id: 'journal', label: 'Journal', groupId: 'accounting', icon: 'FileSpreadsheet', tab: 'accounting', subTab: 'journal_entries', order: 2, enabled: true, translations: { bn: 'জার্নাল এন্ট্রি' } },
  { id: 'ledger', label: 'General Ledger', groupId: 'accounting', icon: 'BookOpen', tab: 'accounting', subTab: 'ledger', order: 3, enabled: true, translations: { bn: 'জেনারেল লেজার' } },
  { id: 'cash_accounts', label: 'Cash Book', groupId: 'accounting', icon: 'DollarSign', tab: 'reports', subTab: 'cash_book', order: 4, enabled: true, translations: { bn: 'ক্যাশ বুক' } },
  { id: 'bank_accounts', label: 'Bank Book', groupId: 'accounting', icon: 'Landmark', tab: 'banking', subTab: 'bank_accounts', order: 5, enabled: true, translations: { bn: 'ব্যাংক বুক' } },
  { id: 'contra_voucher', label: 'Contra Voucher', groupId: 'accounting', icon: 'ArrowLeftRight', tab: 'accounting', subTab: 'contra_voucher', order: 6, enabled: true, translations: { bn: 'কন্ট্রা ভাউচার' } },
  { id: 'payment_voucher', label: 'Payment Voucher', groupId: 'accounting', icon: 'MinusCircle', tab: 'accounting', subTab: 'payment_voucher', order: 7, enabled: true, translations: { bn: 'পেমেন্ট ভাউচার' } },
  { id: 'receipt_voucher', label: 'Receipt Voucher', groupId: 'accounting', icon: 'PlusCircle', tab: 'accounting', subTab: 'receipt_voucher', order: 8, enabled: true, translations: { bn: 'রিসিট ভাউচার' } },
  { id: 'debit_note', label: 'Debit Note', groupId: 'accounting', icon: 'ArrowUpRight', tab: 'accounting', subTab: 'debit_note', order: 9, enabled: true, translations: { bn: 'ডেবিট নোট' } },
  { id: 'credit_note', label: 'Credit Note', groupId: 'accounting', icon: 'ArrowDownRight', tab: 'accounting', subTab: 'credit_note', order: 10, enabled: true, translations: { bn: 'ক্রেডিট নোট' } },
  { id: 'trial_balance', label: 'Trial Balance', groupId: 'accounting', icon: 'Scale', tab: 'reports', subTab: 'trial_balance', order: 11, enabled: true, translations: { bn: 'রেওয়ামিল' } },
  { id: 'profit_loss', label: 'Profit & Loss', groupId: 'accounting', icon: 'TrendingUp', tab: 'reports', subTab: 'profit_loss', order: 12, enabled: true, translations: { bn: 'লাভ-ক্ষতি হিসাব' } },
  { id: 'balance_sheet', label: 'Balance Sheet', groupId: 'accounting', icon: 'FileCheck', tab: 'reports', subTab: 'balance_sheet', order: 13, enabled: true, translations: { bn: 'উদ্বৃত্ত পত্র' } },
  { id: 'cash_flow', label: 'Cash Flow', groupId: 'accounting', icon: 'Activity', tab: 'reports', subTab: 'cash_flow', order: 14, enabled: true, translations: { bn: 'নগদ প্রবাহ বিবরণী' } },

  // === CRM GROUP ===
  { id: 'crm_leads', label: 'Leads', groupId: 'crm', icon: 'UserPlus', tab: 'crm', subTab: 'leads', order: 1, enabled: true, translations: { bn: 'লিডসমূহ' } },
  { id: 'crm_opportunities', label: 'Opportunities', groupId: 'crm', icon: 'Kanban', tab: 'crm', subTab: 'pipeline', order: 2, enabled: true, translations: { bn: 'সুযোগ ও পাইপলাইন' } },
  { id: 'customers', label: 'Customers', groupId: 'crm', icon: 'Users', tab: 'sales', subTab: 'customers', order: 3, enabled: true, translations: { bn: 'গ্রাহক তালিকা' } },
  { id: 'crm_contacts', label: 'Contacts', groupId: 'crm', icon: 'Phone', tab: 'crm', subTab: 'contacts', order: 4, enabled: true, translations: { bn: 'যোগাযোগসমূহ' } },
  { id: 'crm_activities', label: 'Activities', groupId: 'crm', icon: 'Activity', tab: 'crm', subTab: 'activities', order: 5, enabled: true, translations: { bn: 'কার্যক্রম ফিড' } },
  { id: 'crm_followups', label: 'Follow Ups', groupId: 'crm', icon: 'Clock', tab: 'crm', subTab: 'follow_ups', order: 6, enabled: true, translations: { bn: 'অনুসরণ কার্যক্রম' } },
  { id: 'srv_warranty', label: 'Warranty Register', groupId: 'crm', icon: 'ShieldAlert', tab: 'service', subTab: 'warranty', order: 7, enabled: true, translations: { bn: 'ওয়ারেন্টি রেজিস্টার' } },
  { id: 'srv_repairs', label: 'Repairs & RMA', groupId: 'crm', icon: 'Wrench', tab: 'service', subTab: 'repairs', order: 8, enabled: true, translations: { bn: 'মেরামত ও আরএমএ' } },
  { id: 'srv_complaints', label: 'Complaints', groupId: 'crm', icon: 'MessageSquare', tab: 'service', subTab: 'complaints', order: 9, enabled: true, translations: { bn: 'গ্রাহক অভিযোগ' } },
  { id: 'srv_technicians', label: 'Technicians', groupId: 'crm', icon: 'Briefcase', tab: 'service', subTab: 'technicians', order: 10, enabled: true, translations: { bn: 'টেকনিশিয়ান প্যানেল' } },
  { id: 'srv_amc', label: 'AMC Maintenance', groupId: 'crm', icon: 'Calendar', tab: 'service', subTab: 'amc', order: 11, enabled: true, translations: { bn: 'বার্ষিক রক্ষণাবেক্ষণ' } },

  // === HRM GROUP ===
  { id: 'hr_employees', label: 'Employees', groupId: 'hrm', icon: 'Users', tab: 'employee', subTab: 'employees_list', order: 1, enabled: true, translations: { bn: 'কর্মকর্তা ও কর্মচারী' } },
  { id: 'hr_departments', label: 'Departments', groupId: 'hrm', icon: 'Building', tab: 'employee', subTab: 'departments', order: 2, enabled: true, translations: { bn: 'বিভাগসমূহ' } },
  { id: 'hr_designations', label: 'Designations', groupId: 'hrm', icon: 'Briefcase', tab: 'employee', subTab: 'designations', order: 3, enabled: true, translations: { bn: 'পদবীসমূহ' } },
  { id: 'hr_attendance', label: 'Attendance', groupId: 'hrm', icon: 'CheckSquare', tab: 'employee', subTab: 'attendance', order: 4, enabled: true, translations: { bn: 'উপস্থিতি লগ' } },
  { id: 'hr_leave', label: 'Leave', groupId: 'hrm', icon: 'Plane', tab: 'employee', subTab: 'leave', order: 5, enabled: true, translations: { bn: 'ছুটি রেজিস্টার' } },
  { id: 'hr_payroll', label: 'Payroll', groupId: 'hrm', icon: 'Wallet', tab: 'employee', subTab: 'payroll', order: 6, enabled: true, translations: { bn: 'বেতন ও পে-রোল' } },
  { id: 'hr_loans', label: 'Loans', groupId: 'hrm', icon: 'Landmark', tab: 'loan', subTab: 'loan_list', order: 7, enabled: true, translations: { bn: 'ঋণ সুবিধা' } },
  { id: 'hr_recruitment', label: 'Recruitment', groupId: 'hrm', icon: 'UserCheck', tab: 'employee', subTab: 'recruitment', order: 8, enabled: true, translations: { bn: 'নিয়োগ কার্যক্রম' } },

  // === PROJECTS GROUP ===
  { id: 'projects_list', label: 'Projects', groupId: 'projects', icon: 'FolderGit2', tab: 'projects', subTab: 'projects', order: 1, enabled: true, translations: { bn: 'প্রকল্পসমূহ' } },
  { id: 'projects_tasks', label: 'Tasks', groupId: 'projects', icon: 'CheckSquare', tab: 'projects', subTab: 'tasks', order: 2, enabled: true, translations: { bn: 'কাজসমূহ' } },
  { id: 'projects_kanban', label: 'Kanban', groupId: 'projects', icon: 'Kanban', tab: 'projects', subTab: 'kanban', order: 3, enabled: true, translations: { bn: 'কানবান বোর্ড' } },
  { id: 'projects_timesheets', label: 'Timesheets', groupId: 'projects', icon: 'Clock', tab: 'projects', subTab: 'timesheets', order: 4, enabled: true, translations: { bn: 'টাইমশিট' } },

  // === ASSETS GROUP ===
  { id: 'assets_list', label: 'Asset List', groupId: 'assets', icon: 'Building', tab: 'accounting', subTab: 'assets', order: 1, enabled: true, translations: { bn: 'সম্পদ তালিকা' } },
  { id: 'assets_alloc', label: 'Asset Allocation', groupId: 'assets', icon: 'UserCheck', tab: 'accounting', subTab: 'asset_allocation', order: 2, enabled: true, translations: { bn: 'সম্পদ বরাদ্দ' } },
  { id: 'assets_maint', label: 'Maintenance', groupId: 'assets', icon: 'Wrench', tab: 'accounting', subTab: 'asset_maintenance', order: 3, enabled: true, translations: { bn: 'রক্ষণাবেক্ষণ' } },
  { id: 'assets_depr', label: 'Depreciation', groupId: 'assets', icon: 'TrendingDown', tab: 'accounting', subTab: 'asset_depreciation', order: 4, enabled: true, translations: { bn: 'অবচয় হিসাব' } },

  // === MANUFACTURING GROUP ===
  { id: 'mfg_bom', label: 'Bill of Materials', groupId: 'manufacturing', icon: 'Receipt', tab: 'manufacturing', subTab: 'bom', order: 1, enabled: true, translations: { bn: 'বিল অফ মেটেরিয়ালস' } },
  { id: 'mfg_production', label: 'Production', groupId: 'manufacturing', icon: 'Settings', tab: 'manufacturing', subTab: 'production', order: 2, enabled: true, translations: { bn: 'উৎপাদন আদেশ' } },
  { id: 'mfg_work_orders', label: 'Work Orders', groupId: 'manufacturing', icon: 'ClipboardList', tab: 'manufacturing', subTab: 'work_orders', order: 3, enabled: true, translations: { bn: 'কার্য আদেশসমূহ' } },
  { id: 'mfg_quality', label: 'Quality Control', groupId: 'manufacturing', icon: 'FileCheck', tab: 'manufacturing', subTab: 'quality', order: 4, enabled: true, translations: { bn: 'মান নিয়ন্ত্রণ' } },

  // === REPORTS GROUP ===
  { id: 'rep_sales', label: 'Sales Reports', groupId: 'reports', icon: 'Store', tab: 'reports', subTab: 'sales_report', order: 1, enabled: true, translations: { bn: 'বিক্রয় বিবরণী' } },
  { id: 'rep_purchase', label: 'Purchase Reports', groupId: 'reports', icon: 'ShoppingCart', tab: 'reports', subTab: 'purchase_register', order: 2, enabled: true, translations: { bn: 'ক্রয় বিবরণী' } },
  { id: 'rep_inventory', label: 'Inventory Reports', groupId: 'reports', icon: 'Boxes', tab: 'reports', subTab: 'low_stock', order: 3, enabled: true, translations: { bn: 'ইনভেন্টরি রিপোর্ট' } },
  { id: 'rep_finance', label: 'Financial Reports', groupId: 'reports', icon: 'BookOpen', tab: 'reports', subTab: 'profit_loss', order: 4, enabled: true, translations: { bn: 'আর্থিক বিবরণী' } },
  { id: 'rep_hr', label: 'HR Reports', groupId: 'reports', icon: 'Users', tab: 'employee', subTab: 'employee_report', order: 5, enabled: true, translations: { bn: 'এইচআর রিপোর্ট' } },
  { id: 'rep_tax', label: 'Tax Reports', groupId: 'reports', icon: 'Percent', tab: 'reports', subTab: 'tax_report', order: 6, enabled: true, translations: { bn: 'ট্যাক্স বিবরণী' } },
  { id: 'rep_overdue', label: 'Overdue Reminders', groupId: 'reports', icon: 'Clock', tab: 'reports', subTab: 'overdue_reminders', order: 7, enabled: true, translations: { bn: 'বকেয়া রিমাইন্ডার তালিকা' } },
  { id: 'rep_vat_mushak', label: 'VAT / Mushak Sales', groupId: 'reports', icon: 'Receipt', tab: 'reports', subTab: 'mushak_vat', order: 8, enabled: true, translations: { bn: 'ভ্যাট / মূসক বিবরণী' } },
  { id: 'rep_custom_builder', label: 'Custom Report Builder', groupId: 'reports', icon: 'Sliders', tab: 'reports', subTab: 'custom_reports', order: 9, enabled: true, translations: { bn: 'কাস্টম রিপোর্ট বিল্ডার' } },
  { id: 'rep_rdl_designer', label: 'Report Designer (Layout)', groupId: 'reports', icon: 'LayoutTemplate', tab: 'rdlReport', subTab: 'report_manager', order: 10, enabled: true, translations: { bn: 'রিপোর্ট ডিজাইনার (লেআউট)' } },

  // === ADMINISTRATION GROUP ===
  { id: 'admin_users', label: 'Users', groupId: 'administration', icon: 'UserCheck', tab: 'settings', subTab: 'users', order: 1, enabled: true, translations: { bn: 'ব্যবহারকারীগণ' } },
  { id: 'admin_roles', label: 'Roles', groupId: 'administration', icon: 'Shield', tab: 'settings', subTab: 'roles', order: 2, enabled: true, translations: { bn: 'রোলসমূহ' } },
  { id: 'admin_permissions', label: 'Permissions', groupId: 'administration', icon: 'Lock', tab: 'settings', subTab: 'permissions', order: 3, enabled: true, translations: { bn: 'অনুমতিসমূহ' } },
  { id: 'admin_workflow', label: 'Approval Workflow', groupId: 'administration', icon: 'Workflow', tab: 'workflow', subTab: 'designer', order: 4, enabled: true, translations: { bn: 'অনুমোদন ওয়ার্কফ্লো' } },
  { id: 'admin_matrix', label: 'Approval Matrix', groupId: 'administration', icon: 'Table', tab: 'workflow', subTab: 'approval_rules', order: 5, enabled: true, translations: { bn: 'অনুমোদন ম্যাট্রিক্স' } },
  { id: 'doc_center', label: 'Document Center', groupId: 'administration', icon: 'FolderClosed', tab: 'documents', subTab: 'document_center', order: 6, enabled: true, translations: { bn: 'ডকুমেন্ট সেন্টার' } },
  { id: 'doc_attachments', label: 'Attachments', groupId: 'administration', icon: 'Paperclip', tab: 'documents', subTab: 'attachments', order: 7, enabled: true, translations: { bn: 'সংযুক্তি রেজিস্ট্রি' } },
  { id: 'doc_ocr', label: 'OCR Scanner', groupId: 'administration', icon: 'Eye', tab: 'documents', subTab: 'ocr', order: 8, enabled: true, translations: { bn: 'ওসিআর স্ক্যানার' } },
  { id: 'doc_signature', label: 'Digital Signatures', groupId: 'administration', icon: 'Signature', tab: 'documents', subTab: 'digital_signature', order: 9, enabled: true, translations: { bn: 'ডিজিটাল স্বাক্ষর' } },
  { id: 'doc_archive', label: 'Legal Archives', groupId: 'administration', icon: 'Archive', tab: 'documents', subTab: 'archive', order: 10, enabled: true, translations: { bn: 'আইনি আর্কাইভ' } },

  // === SETTINGS GROUP ===
  { id: 'admin_companies', label: 'Company', groupId: 'settings', icon: 'Building', tab: 'settings', subTab: 'companies', order: 1, enabled: true, translations: { bn: 'কোম্পানি সেটিংস' } },
  { id: 'admin_branches', label: 'Branches', groupId: 'settings', icon: 'MapPin', tab: 'settings', subTab: 'branches', order: 2, enabled: true, translations: { bn: 'শাখা সেটিংস' } },
  { id: 'settings_warehouses', label: 'Warehouses', groupId: 'settings', icon: 'Home', tab: 'inventory', subTab: 'warehouses', order: 3, enabled: true, translations: { bn: 'সেটিংস গুদামঘর' } },
  { id: 'admin_currency', label: 'Currency', groupId: 'settings', icon: 'Coins', tab: 'settings', subTab: 'currency', order: 4, enabled: true, translations: { bn: 'মুদ্রা বিনিময়' } },
  { id: 'admin_fiscal', label: 'Fiscal Year', groupId: 'settings', icon: 'Calendar', tab: 'settings', subTab: 'fiscal_year', order: 5, enabled: true, translations: { bn: 'অর্থবছর নির্ধারণ' } },
  { id: 'settings_taxes', label: 'Taxes', groupId: 'settings', icon: 'Percent', tab: 'settings', subTab: 'add_product_setting', order: 6, enabled: true, translations: { bn: 'ট্যাক্স সেটিংস' } },
  { id: 'sys_email_queue', label: 'Email', groupId: 'settings', icon: 'Mail', tab: 'settings', subTab: 'email_queue', order: 7, enabled: true, translations: { bn: 'ইমেইল কিউ' } },
  { id: 'sys_sms_queue', label: 'SMS', groupId: 'settings', icon: 'MessageSquareCode', tab: 'settings', subTab: 'sms_queue', order: 8, enabled: true, translations: { bn: 'এসএমএস প্রেরণকারী' } },
  { id: 'sys_backup', label: 'Backup', groupId: 'settings', icon: 'Save', tab: 'settings', subTab: 'backup', order: 9, enabled: true, translations: { bn: 'ব্যাকআপ শিডিউলার' } },
  { id: 'sys_activity_log', label: 'Audit Logs', groupId: 'settings', icon: 'Clock', tab: 'settings', subTab: 'activity_log', order: 10, enabled: true, translations: { bn: 'অডিট লগসমূহ' } },
  { id: 'settings_integrations', label: 'Integrations', groupId: 'settings', icon: 'Grid', tab: 'integration', subTab: '', order: 11, enabled: true, translations: { bn: 'সিস্টেম ইন্টিগ্রেশন' } },
  { id: 'int_import', label: 'Bulk CSV Import', groupId: 'settings', icon: 'Upload', tab: 'integration', subTab: 'import', order: 12, enabled: true, translations: { bn: 'সিএসভি ফাইল ইম্পোর্ট' } },
  { id: 'int_export', label: 'Bulk Data Export', groupId: 'settings', icon: 'Download', tab: 'integration', subTab: 'export', order: 13, enabled: true, translations: { bn: 'ডাটাসেট এক্সপোর্ট' } },
  { id: 'int_rest', label: 'REST API Tokens', groupId: 'settings', icon: 'Key', tab: 'integration', subTab: 'rest_api', order: 14, enabled: true, translations: { bn: 'এপিআই টোকেন' } },
  { id: 'int_graphql', label: 'GraphQL Playground', groupId: 'settings', icon: 'Layers', tab: 'integration', subTab: 'graphql', order: 15, enabled: true, translations: { bn: 'গ্রাফকিউএল প্লেগ্রাউন্ড' } },
  { id: 'int_webhook', label: 'Webhooks Integration', groupId: 'settings', icon: 'Webhook', tab: 'integration', subTab: 'webhook', order: 16, enabled: true, translations: { bn: 'ওয়েবহুক লিসেনার' } },
];

export class NavigationEngineService {
  private items: NavigationItem[] = [];
  private groups: NavigationGroup[] = [];
  private favorites: NavigationFavorite[] = [];
  private pinned: NavigationPinned[] = [];
  private recents: NavigationRecent[] = [];
  private activeLanguage: string = 'en';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const NAV_VERSION = 'v5_enterprise_refactor_bilingual';
    const savedVersion = localStorage.getItem('nexova_nav_version');
    if (savedVersion !== NAV_VERSION) {
      localStorage.removeItem('nexova_nav_items');
      localStorage.removeItem('nexova_nav_groups');
      localStorage.setItem('nexova_nav_version', NAV_VERSION);
    }

    const savedItems = localStorage.getItem('nexova_nav_items');
    const savedGroups = localStorage.getItem('nexova_nav_groups');
    const savedFavs = localStorage.getItem('nexova_nav_favorites');
    const savedPinned = localStorage.getItem('nexova_nav_pinned');
    const savedRecents = localStorage.getItem('nexova_nav_recents');
    const savedLang = localStorage.getItem('nexova_nav_language');

    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        // Robustly merge any missing items from INITIAL_ITEMS so that newly added menus appear in existing sessions
        const parsedIds = new Set(parsed.map((item: any) => item.id));
        const missingItems = INITIAL_ITEMS.filter(item => !parsedIds.has(item.id));
        if (missingItems.length > 0) {
          this.items = [...parsed, ...missingItems];
          this.saveItems();
        } else {
          this.items = parsed;
        }
      } catch {
        this.items = INITIAL_ITEMS;
      }
    } else {
      this.items = INITIAL_ITEMS;
      this.saveItems();
    }

    if (savedGroups) {
      try { this.groups = JSON.parse(savedGroups); } catch { this.groups = INITIAL_GROUPS; }
    } else {
      this.groups = INITIAL_GROUPS;
      this.saveGroups();
    }

    try {
      this.favorites = savedFavs ? JSON.parse(savedFavs) : [];
      this.pinned = savedPinned ? JSON.parse(savedPinned) : [];
      this.recents = savedRecents ? JSON.parse(savedRecents) : [];
      this.activeLanguage = savedLang || 'en';
    } catch {
      this.favorites = [];
      this.pinned = [];
      this.recents = [];
    }
  }

  private saveItems() {
    localStorage.setItem('nexova_nav_items', JSON.stringify(this.items));
  }

  private saveGroups() {
    localStorage.setItem('nexova_nav_groups', JSON.stringify(this.groups));
  }

  private saveFavorites() {
    localStorage.setItem('nexova_nav_favorites', JSON.stringify(this.favorites));
  }

  private savePinned() {
    localStorage.setItem('nexova_nav_pinned', JSON.stringify(this.pinned));
  }

  private saveRecents() {
    localStorage.setItem('nexova_nav_recents', JSON.stringify(this.recents));
  }

  public getGroups(): NavigationGroup[] {
    return this.groups.filter(g => g.enabled).sort((a, b) => a.order - b.order);
  }

  public getAllGroups(): NavigationGroup[] {
    return [...this.groups].sort((a, b) => a.order - b.order);
  }

  public getItems(): NavigationItem[] {
    return this.items.filter(i => i.enabled && !i.archived).sort((a, b) => a.order - b.order);
  }

  public getAllItems(): NavigationItem[] {
    return [...this.items].sort((a, b) => a.order - b.order);
  }

  public getLanguage(): string {
    return this.activeLanguage;
  }

  public setLanguage(lang: string) {
    this.activeLanguage = lang;
    localStorage.setItem('nexova_nav_language', lang);
  }

  // Group Operations
  public createGroup(group: NavigationGroup) {
    this.groups.push(group);
    this.saveGroups();
  }

  public updateGroup(id: string, updated: Partial<NavigationGroup>) {
    this.groups = this.groups.map(g => g.id === id ? { ...g, ...updated } : g);
    this.saveGroups();
  }

  public deleteGroup(id: string) {
    this.groups = this.groups.filter(g => g.id !== id);
    this.items = this.items.filter(i => i.groupId !== id);
    this.saveGroups();
    this.saveItems();
  }

  // Item Operations
  public createItem(item: NavigationItem) {
    this.items.push(item);
    this.saveItems();
  }

  public updateItem(id: string, updated: Partial<NavigationItem>) {
    this.items = this.items.map(i => i.id === id ? { ...i, ...updated } : i);
    this.saveItems();
  }

  public deleteItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.favorites = this.favorites.filter(f => f.itemId !== id);
    this.pinned = this.pinned.filter(p => p.itemId !== id);
    this.recents = this.recents.filter(r => r.itemId !== id);
    this.saveItems();
    this.saveFavorites();
    this.savePinned();
    this.saveRecents();
  }

  public cloneItem(id: string, newId: string, newLabel: string): NavigationItem | null {
    const existing = this.items.find(i => i.id === id);
    if (!existing) return null;
    const clone: NavigationItem = {
      ...existing,
      id: newId,
      label: newLabel,
      order: existing.order + 1,
    };
    this.items.push(clone);
    this.saveItems();
    return clone;
  }

  // Favorites
  public getFavorites(): string[] {
    return this.favorites.map(f => f.itemId);
  }

  public isFavorite(itemId: string): boolean {
    return this.favorites.some(f => f.itemId === itemId);
  }

  public toggleFavorite(itemId: string) {
    const exists = this.favorites.some(f => f.itemId === itemId);
    if (exists) {
      this.favorites = this.favorites.filter(f => f.itemId !== itemId);
    } else {
      this.favorites.push({ itemId });
    }
    this.saveFavorites();
  }

  // Pinned
  public getPinned(): string[] {
    return this.pinned.map(p => p.itemId);
  }

  public isPinned(itemId: string): boolean {
    return this.pinned.some(p => p.itemId === itemId);
  }

  public togglePinned(itemId: string) {
    const exists = this.pinned.some(p => p.itemId === itemId);
    if (exists) {
      this.pinned = this.pinned.filter(p => p.itemId !== itemId);
    } else {
      this.pinned.push({ itemId });
    }
    this.savePinned();
  }

  // Recents (History tracker - maximum 10 items, unique)
  public getRecents(): string[] {
    return this.recents.map(r => r.itemId);
  }

  public addRecent(itemId: string) {
    this.recents = this.recents.filter(r => r.itemId !== itemId);
    this.recents.unshift({ itemId, timestamp: new Date().toISOString() });
    if (this.recents.length > 10) {
      this.recents.pop();
    }
    this.saveRecents();
  }

  // Search Engine: Fuzzy / Instant search matching label, tab, subTab, or tags
  public fuzzySearch(query: string, userRole: string = 'Administrator'): NavigationItem[] {
    if (!query) return [];
    const q = query.toLowerCase();
    return this.items.filter(item => {
      if (!item.enabled || item.archived) return false;
      
      // Check permissions
      if (item.permissions && item.permissions.length > 0 && !item.permissions.includes(userRole)) {
        return false;
      }

      const label = item.label.toLowerCase();
      const tab = item.tab.toLowerCase();
      const sub = item.subTab.toLowerCase();
      
      // Check translation match
      let translationMatch = false;
      if (item.translations) {
        translationMatch = Object.values(item.translations).some(t => t.toLowerCase().includes(q));
      }

      return label.includes(q) || tab.includes(q) || sub.includes(q) || translationMatch;
    });
  }

  // Live counters provider
  public getLiveBadgeValue(key: LiveBadgeKey, data: { lowStockCount: number; invoicesCount: number }): number | string | null {
    switch (key) {
      case 'low_stock':
        return data.lowStockCount > 0 ? data.lowStockCount : null;
      case 'new_orders':
        return data.invoicesCount > 0 ? data.invoicesCount : null;
      case 'pending_approvals':
      case 'unread_notifications':
      case 'draft_documents':
        // No real backing data source for these yet — show nothing rather than a fabricated number.
        return null;
      case 'queue_status':
        return 'Idle';
      default:
        return null;
    }
  }

  // Reset navigation to default values
  public resetToDefault() {
    this.items = INITIAL_ITEMS;
    this.groups = INITIAL_GROUPS;
    this.favorites = [];
    this.pinned = [];
    this.recents = [];
    this.activeLanguage = 'en';
    this.saveItems();
    this.saveGroups();
    this.saveFavorites();
    this.savePinned();
    this.saveRecents();
  }
}

export const navEngine = new NavigationEngineService();
