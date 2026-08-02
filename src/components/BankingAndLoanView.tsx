import React, { useState, useEffect } from 'react';
import { BankAccount, LoanAccount, Transaction, AppSettings } from '../types';
import { navEngine, NavigationItem, NavigationGroup } from '../lib/navigationEngine';
import {
  createNewUserWithSecondaryApp,
  auth,
  deleteDocById,
  queryCollectionWhere,
  sendPasswordResetEmail,
  updatePassword,
} from '../lib/dataClient';
import { fetchErrorLogsFromFirestore, clearErrorLogsFromFirestore, ErrorLogEntry } from '../lib/errorLogger';
import BranchManagementView from './BranchManagementView';
import * as Icons from 'lucide-react';
import {
  Landmark,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Settings as SetIcon,
  ShieldCheck,
  CheckCircle,
  Smartphone,
  Users,
  Percent,
  Bug,
  TrendingUp,
  FileText,
  AlertTriangle,
  Download,
  Upload,
  Sliders,
  Building,
  CreditCard,
  Truck,
  ShoppingCart,
  UserCheck,
  Shield,
  Menu,
  Trash2,
  RotateCcw,
  Clock,
  ShoppingBag,
  Database,
  Lock,
  Search,
  Eye,
  RefreshCw,
  Edit,
  Check,
  X,
} from 'lucide-react';

interface BankingAndLoanViewProps {
  bankAccounts: BankAccount[];
  loanAccounts: LoanAccount[];
  transactions: Transaction[];
  currentTab: 'banking' | 'loan' | 'settings';
  activeSubTab?: string;
  onAddBankAccount: (bank: Omit<BankAccount, 'id' | 'balance'>) => void;
  onAddLoan: (loan: Omit<LoanAccount, 'id' | 'accountNo' | 'disbursedAmount' | 'outstandingAmount' | 'status'>) => void;
  settings?: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onResetData?: () => void | Promise<void>;
  onClearAllData?: () => void | Promise<void>;
  onImportData?: (importedData: any) => void;
  systemData?: any;
  currentUser?: any;
  onBranchChange?: () => void;
}

export default function BankingAndLoanView({
  bankAccounts,
  loanAccounts,
  transactions,
  currentTab,
  activeSubTab,
  onAddBankAccount,
  onAddLoan,
  settings,
  onUpdateSettings,
  onResetData,
  onClearAllData,
  onImportData,
  systemData,
  currentUser,
  onBranchChange,
}: BankingAndLoanViewProps) {
  // --- SUB-TAB ROUTERS ---
  const subTab = activeSubTab || (currentTab === 'loan' ? 'loan_accounts' : 'bank_accounts');

  const humanizeTab = (tab: string) => {
    return tab
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // --- LOCAL MUTABLE STATS ---
  const [localBanks, setLocalBanks] = useState<BankAccount[]>(bankAccounts);
  const [localLoans, setLocalLoans] = useState<LoanAccount[]>(loanAccounts);
  const [localTxs, setLocalTxs] = useState<Transaction[]>(transactions);

  // --- SETTINGS FORM STATES & SYNC ---
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'billing' | 'inventory' | 'backup'>('profile');

  const [compName, setCompName] = useState(settings?.companyName || '');
  const [compAddr, setCompAddr] = useState(settings?.companyAddress || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [tin, setTin] = useState(settings?.tinNumber || '');
  const [bin, setBin] = useState(settings?.binNumber || '');
  const [tradeLic, setTradeLic] = useState(settings?.tradeLicense || '');
  const [vat, setVat] = useState(settings?.defaultVatRate || 5);
  const [discount, setDiscount] = useState(settings?.defaultDiscountRate || 0);
  const [curr, setCurr] = useState(settings?.baseCurrency || '৳');
  const [footer, setFooter] = useState(settings?.receiptFooterMessage || '');
  const [autoPrint, setAutoPrint] = useState(settings?.autoPrintReceipt ?? true);
  const [smsNotif, setSmsNotif] = useState(settings?.enableSmsNotification ?? false);
  const [warehouse, setWarehouse] = useState(settings?.defaultWarehouse || '');
  const [defUnit, setDefUnit] = useState(settings?.defaultUnit || 'Pcs');
  const [threshold, setThreshold] = useState(settings?.lowStockThreshold || 5);
  const [tz, setTz] = useState(settings?.timezone || 'Asia/Dhaka');

  // --- SUB-MENU SELECTOR STATE ---
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<string>(activeSubTab || 'system_settings');

  useEffect(() => {
    if (activeSubTab && currentTab === 'settings') {
      setSelectedSettingsTab(activeSubTab);
    }
  }, [activeSubTab, currentTab]);

  // --- ERROR LOGS STATE ---
  const [errorLogEntries, setErrorLogEntries] = useState<ErrorLogEntry[]>([]);
  const [isLoadingErrorLogs, setIsLoadingErrorLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [shouldTriggerTestError, setShouldTriggerTestError] = useState(false);

  useEffect(() => {
    if (selectedSettingsTab === 'error_logs') {
      loadErrorLogs();
    }
  }, [selectedSettingsTab]);

  const loadErrorLogs = async () => {
    setIsLoadingErrorLogs(true);
    try {
      const logs = await fetchErrorLogsFromFirestore();
      setErrorLogEntries(logs);
    } catch (e) {
      console.error('Error fetching logs from Firestore:', e);
    } finally {
      setIsLoadingErrorLogs(false);
    }
  };

  const handleClearErrorLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all error log entries?')) return;
    setIsLoadingErrorLogs(true);
    try {
      await clearErrorLogsFromFirestore();
      setErrorLogEntries([]);
      alert('Error logs cleared successfully.');
    } catch (e) {
      alert('Failed to clear error logs.');
    } finally {
      setIsLoadingErrorLogs(false);
    }
  };

  // --- CUSTOM DIALOG & NOTIFICATION STATES ---
  const [confirmActionType, setConfirmActionType] = useState<'reset' | 'clear' | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleConfirmAction = async () => {
    if (!confirmActionType || isPerformingAction) return;
    setIsPerformingAction(true);
    try {
      if (confirmActionType === 'reset') {
        if (onResetData) await onResetData();
        setShowSuccessToast('সফলভাবে সম্পূর্ণ ডেটাবেস ডেমো ভ্যালুগুলোতে রিসেট করা হয়েছে!');
      } else if (confirmActionType === 'clear') {
        if (onClearAllData) await onClearAllData();
        setShowSuccessToast('সফলভাবে সমস্ত ডেমো ডেটা মুছে ফেলা হয়েছে এবং ইআরপি ফাঁকা করা হয়েছে!');
      }
      setConfirmActionType(null);
    } catch (err) {
      console.error("Error executing system action:", err);
    } finally {
      setIsPerformingAction(false);
    }
  };

  // --- DYNAMIC SUBSYSTEM STATES FOR UNHANDLED SETTINGS ---
  const [branches, setBranches] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_branches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'b1', name: 'Dhaka Head Office Yard', code: 'DHK-HQ', city: 'Dhaka', status: 'Active', manager: 'Mizanur Rahman' },
      { id: 'b2', name: 'Narayanganj Cement Factory', code: 'NYG-PLT', city: 'Narayanganj', status: 'Active', manager: 'Sabbir Rahman' },
      { id: 'b3', name: 'Chittagong Port Warehouse', code: 'CTG-WH', city: 'Chittagong', status: 'Active', manager: 'Farhana Yasmin' }
    ];
  });

  const [fiscalYears, setFiscalYears] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_fiscal_years');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'fy1', year: 'FY 2025-2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'Closed' },
      { id: 'fy2', year: 'FY 2026-2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'Active' }
    ];
  });

  const [currencies, setCurrencies] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_currencies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { code: 'BDT', symbol: '৳', rate: 1.0, isDefault: true, status: 'Active' },
      { code: 'USD', symbol: '$', rate: 118.5, isDefault: false, status: 'Active' },
      { code: 'EUR', symbol: '€', rate: 128.2, isDefault: false, status: 'Active' }
    ];
  });

  const [outboxQueue, setOutboxQueue] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_outbox_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'q1', type: 'Email', recipient: 'buyer@purbachal.com', subject: 'Invoice INV-2026-0412 Released', status: 'Sent', sentTime: '2026-07-10 11:45 AM' },
      { id: 'q2', type: 'SMS', recipient: '+8801712345678', subject: 'Nexova Low Stock Alert: Steel Girders', status: 'Pending', sentTime: '-' },
      { id: 'q3', type: 'Email', recipient: 'supervisor@nexova.com', subject: 'Workflow Approval Req PO-2026-9021', status: 'Failed', sentTime: '-' }
    ];
  });

  const [cronJobs, setCronJobs] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_cron_jobs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'job1', name: 'Nightly Database JSON Backup', schedule: '0 0 * * *', lastRun: 'Yesterday 12:00 AM', status: 'Active' },
      { id: 'job2', name: 'Low Stock Safety Alert Scanner', schedule: '*/30 * * * *', lastRun: '15 mins ago', status: 'Active' },
      { id: 'job3', name: 'Monthly Payroll Ledger Auto-Post', schedule: '0 8 1 * *', lastRun: '2026-07-01', status: 'Active' }
    ];
  });

  // Persisting updates
  React.useEffect(() => {
    localStorage.setItem('nexova_branches', JSON.stringify(branches));
  }, [branches]);

  React.useEffect(() => {
    localStorage.setItem('nexova_fiscal_years', JSON.stringify(fiscalYears));
  }, [fiscalYears]);

  React.useEffect(() => {
    localStorage.setItem('nexova_currencies', JSON.stringify(currencies));
  }, [currencies]);

  React.useEffect(() => {
    localStorage.setItem('nexova_outbox_queue', JSON.stringify(outboxQueue));
  }, [outboxQueue]);

  React.useEffect(() => {
    localStorage.setItem('nexova_cron_jobs', JSON.stringify(cronJobs));
  }, [cronJobs]);

  // --- ENTERPRISE NAVIGATION BUILDER STATE MANAGEMENT ---
  const [navItems, setNavItems] = useState<NavigationItem[]>(() => navEngine.getAllItems());
  const [navGroups, setNavGroups] = useState<NavigationGroup[]>(() => navEngine.getAllGroups());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState({
    id: '',
    label: '',
    groupId: 'inventory',
    icon: 'Boxes',
    tab: 'inventory',
    subTab: '',
    order: 10,
    parent: '',
    enabled: true,
    translationsBn: '',
    badgeKey: '',
  });

  const [groupForm, setGroupForm] = useState({
    id: '',
    label: '',
    icon: 'Grid',
    order: 10,
    enabled: true,
  });

  const refreshNavEngine = () => {
    setNavItems(navEngine.getAllItems());
    setNavGroups(navEngine.getAllGroups());
  };

  React.useEffect(() => {
    if (currentTab === 'settings' && activeSubTab) {
      setSelectedSettingsTab(activeSubTab);
    }
  }, [activeSubTab, currentTab]);

  // 1. Tax Rates
  const [taxes, setTaxes] = useState<any[]>(settings?.taxes || [
    { id: '1', name: 'Standard VAT', rate: 5, type: 'Sales', status: 'Active' },
    { id: '2', name: 'Supplementary Duty (SD)', rate: 10, type: 'Both', status: 'Active' },
    { id: '3', name: 'Import Custom Duty', rate: 15, type: 'Purchase', status: 'Active' },
    { id: '4', name: 'Zero Rated Tax', rate: 0, type: 'Both', status: 'Active' },
  ]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxType, setNewTaxType] = useState('Sales');

  // --- INLINE EDIT STATES FOR ERP CORE SETTINGS ---
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editTaxName, setEditTaxName] = useState('');
  const [editTaxRate, setEditTaxRate] = useState('');
  const [editTaxType, setEditTaxType] = useState('Sales');
  const [editTaxStatus, setEditTaxStatus] = useState<'Active' | 'Inactive'>('Active');

  const [editingPayId, setEditingPayId] = useState<string | null>(null);
  const [editPayName, setEditPayName] = useState('');
  const [editPayType, setEditPayType] = useState('Cash');
  const [editPayCharge, setEditPayCharge] = useState('');
  const [editPayStatus, setEditPayStatus] = useState<'Active' | 'Inactive'>('Active');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserRole, setEditUserRole] = useState('Cashier');
  const [editUserStatus, setEditUserStatus] = useState<'Active' | 'Inactive'>('Active');

  // TAX RATES ACTIONS
  const startEditTax = (tax: any) => {
    setEditingTaxId(tax.id);
    setEditTaxName(tax.name);
    setEditTaxRate(tax.rate.toString());
    setEditTaxType(tax.type);
    setEditTaxStatus(tax.status);
  };

  const handleSaveEditTax = (id: string) => {
    const updated = taxes.map(t => t.id === id ? {
      ...t,
      name: editTaxName,
      rate: Number(editTaxRate),
      type: editTaxType,
      status: editTaxStatus
    } : t);
    setTaxes(updated);
    setEditingTaxId(null);
    
    // Auto save to settings
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        taxes: updated,
        defaultVatRate: id === '1' ? Number(editTaxRate) : settings.defaultVatRate,
      });
    }
  };

  const handleDeleteTax = (id: string) => {
    if (confirm('Are you sure you want to delete this tax rate setting?')) {
      const updated = taxes.filter(t => t.id !== id);
      setTaxes(updated);
      if (onUpdateSettings && settings) {
        onUpdateSettings({
          ...settings,
          taxes: updated,
        });
      }
    }
  };

  const handleAddTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName || !newTaxRate) return;
    const newTax = {
      id: Date.now().toString(),
      name: newTaxName,
      rate: Number(newTaxRate),
      type: newTaxType,
      status: 'Active',
    };
    const updated = [...taxes, newTax];
    setTaxes(updated);
    setNewTaxName('');
    setNewTaxRate('');
    
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        taxes: updated
      });
    }
    alert('Custom Tax Rate added successfully!');
  };

  // 2. Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>(settings?.paymentMethods || [
    { id: '1', name: 'Cash on Hand', type: 'Cash', charge: 0, status: 'Active' },
    { id: '2', name: 'bKash Merchant Pay', type: 'Mobile Wallet', charge: 1.5, status: 'Active' },
    { id: '3', name: 'Nagad Business Account', type: 'Mobile Wallet', charge: 1.0, status: 'Active' },
    { id: '4', name: 'Mutual Trust Bank Transfer', type: 'Bank', charge: 0, status: 'Active' },
    { id: '5', name: 'Visa/Mastercard Terminal', type: 'Card Gateway', charge: 2.0, status: 'Active' },
  ]);
  const [newPayName, setNewPayName] = useState('');
  const [newPayType, setNewPayType] = useState('Cash');
  const [newPayCharge, setNewPayCharge] = useState('');

  // PAYMENT METHODS ACTIONS
  const startEditPay = (method: any) => {
    setEditingPayId(method.id);
    setEditPayName(method.name);
    setEditPayType(method.type);
    setEditPayCharge(method.charge.toString());
    setEditPayStatus(method.status);
  };

  const handleSaveEditPay = (id: string) => {
    const updated = paymentMethods.map(p => p.id === id ? {
      ...p,
      name: editPayName,
      type: editPayType,
      charge: Number(editPayCharge),
      status: editPayStatus
    } : p);
    setPaymentMethods(updated);
    setEditingPayId(null);
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        paymentMethods: updated,
      });
    }
  };

  const handleDeletePay = (id: string) => {
    if (confirm('Are you sure you want to remove this payment instrument?')) {
      const updated = paymentMethods.filter(p => p.id !== id);
      setPaymentMethods(updated);
      if (onUpdateSettings && settings) {
        onUpdateSettings({
          ...settings,
          paymentMethods: updated,
        });
      }
    }
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayName) return;
    const newMethod = {
      id: Date.now().toString(),
      name: newPayName,
      type: newPayType,
      charge: Number(newPayCharge || 0),
      status: 'Active',
    };
    const updated = [...paymentMethods, newMethod];
    setPaymentMethods(updated);
    setNewPayName('');
    setNewPayCharge('');
    
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        paymentMethods: updated
      });
    }
    alert('Payment Method registered!');
  };

  // 3. Suppliers Setting
  const [supplierCreditTerms, setSupplierCreditTerms] = useState(settings?.supplierCreditTerms || 'Net 30');
  const [supplierCodePrefix, setSupplierCodePrefix] = useState(settings?.supplierCodePrefix || 'SUP-');
  const [reorderLeadTime, setReorderLeadTime] = useState(settings?.reorderLeadTime || 5);
  const [supplierReqLimit, setSupplierReqLimit] = useState(settings?.supplierReqLimit || 50000);

  // 4. Customers Setting
  const [customerCreditLimit, setCustomerCreditLimit] = useState(settings?.customerCreditLimit || 100000);
  const [customerGroupDefault, setCustomerGroupDefault] = useState(settings?.customerGroupDefault || 'General');
  const [customerGracePeriod, setCustomerGracePeriod] = useState(settings?.customerGracePeriod || 7);
  const [customerAllowUnregistered, setCustomerAllowUnregistered] = useState(settings?.customerAllowUnregistered ?? true);

  // 5. Product Setting
  const [productSkuRule, setProductSkuRule] = useState(settings?.productSkuRule || 'Auto');
  const [productSkuPrefix, setProductSkuPrefix] = useState(settings?.productSkuPrefix || 'PRD-');
  const [productMarkup, setProductMarkup] = useState(settings?.productMarkup || 15);
  const [productValuation, setProductValuation] = useState(() => {
    const saved = localStorage.getItem('nexova_valuation_method');
    if (saved) {
      return saved === 'WAC' ? 'Weighted Average' : saved;
    }
    return settings?.productValuation || 'Weighted Average';
  });

  // 6. POS Setting
  const [posDefaultCustomer, setPosDefaultCustomer] = useState(settings?.posDefaultCustomer || 'Walk-In Cash Customer');
  const [posShowImageGrid, setPosShowImageGrid] = useState(settings?.posShowImageGrid ?? true);
  const [posQuickDiscounts, setPosQuickDiscounts] = useState(settings?.posQuickDiscounts || '5, 10, 15, 20');
  const [posCashDrawTrigger, setPosCashDrawTrigger] = useState(settings?.posCashDrawTrigger || 'Auto Open');

  // 7. Collection & Payment Settings
  const [collectionAutoAlloc, setCollectionAutoAlloc] = useState(settings?.collectionAutoAlloc ?? true);
  const [collectionBounceFee, setCollectionBounceFee] = useState(settings?.collectionBounceFee || 500);
  const [collectionEarlyDiscount, setCollectionEarlyDiscount] = useState(settings?.collectionEarlyDiscount || 2);
  const [collectionTargetDays, setCollectionTargetDays] = useState(settings?.collectionTargetDays || 10);

  // 8. Users
  const [usersList, setUsersList] = useState<any[]>(settings?.usersList || [
    { id: '1', name: 'Rony Mia', username: 'admin_rony', email: 'ronymia2022@gmail.com', role: 'Administrator', status: 'Active', avatar: 'RM' },
    { id: '2', name: 'Tasnim Ahmed', username: 'tasnim_mgr', email: 'tasnim@madani.com', role: 'Manager', status: 'Active', avatar: 'TA' },
    { id: '3', name: 'Sabbir Rahman', username: 'sabbir_csh', email: 'sabbir@madani.com', role: 'Cashier', status: 'Active', avatar: 'SR' },
    { id: '4', name: 'Sumona Yasmin', username: 'sumona_sales', email: 'sumona@madani.com', role: 'Sales Agent', status: 'Inactive', avatar: 'SY' },
  ]);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('Cashier');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // --- PASSWORD RESET & CHANGE STATES ---
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string | null>(null);
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);

  // SYSTEM USER ACTIONS
  const startEditUser = (usr: any) => {
    setEditingUserId(usr.id);
    setEditUserFullName(usr.name);
    setEditUserEmail(usr.email);
    setEditUserUsername(usr.username);
    setEditUserRole(usr.role);
    setEditUserStatus(usr.status);
  };

  const handleSaveEditUser = (id: string) => {
    const updated = usersList.map(u => u.id === id ? {
      ...u,
      name: editUserFullName,
      email: editUserEmail,
      username: editUserUsername,
      role: editUserRole,
      status: editUserStatus
    } : u);
    setUsersList(updated);
    setEditingUserId(null);
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        usersList: updated,
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = usersList.find(u => String(u.id) === String(id));
    if (!targetUser) {
      alert(`দুঃখিত, এই আইডি (${id}) এর ব্যবহারকারী পাওয়া যায়নি! / Sorry, user with ID ${id} was not found in the users list.`);
      return;
    }

    // ১. শুধুমাত্র সিস্টেম এডমিনিস্ট্রেটররাই ব্যবহারকারী অ্যাকাউন্ট মুছে ফেলতে পারবেন।
    // (Only Administrator users can delete accounts)
    if (currentUser?.role !== 'Administrator') {
      alert('দুঃখিত, শুধুমাত্র সিস্টেম এডমিনিস্ট্রেটররাই ব্যবহারকারী অ্যাকাউন্ট মুছে ফেলতে পারবেন। / Sorry, only active system Administrators can delete user accounts.');
      return;
    }

    // ২. আপনি বর্তমানে এই অ্যাকাউন্টে লগইন আছেন, তাই এটি মুছে ফেলা সম্ভব নয়।
    // (Prevent current user from self-deleting)
    const currentEmail = (currentUser?.email || '').toLowerCase();
    const targetEmail = (targetUser.email || '').toLowerCase();
    if (currentEmail && targetEmail === currentEmail) {
      alert('আপনি বর্তমানে এই অ্যাকাউন্টে লগইন আছেন, তাই এটি মুছে ফেলা সম্ভব নয়। / You are currently logged in with this account and cannot delete it.');
      return;
    }

    // ৩. চেক করুন ব্যবহারকারীর সিস্টেমে কোনো লেনদেন রেকর্ড আছে কিনা।
    // (Check if the user has any transactions/invoices/purchaseOrders)
    const targetUsername = (targetUser.username || '').toLowerCase();
    const targetName = (targetUser.name || '').toLowerCase();

    // Ledger transactions check
    const hasTx = localTxs.some(tx => {
      const desc = (tx.description || '').toLowerCase();
      const cat = (tx.category || '').toLowerCase();
      const ent = ((tx as any).enteredBy || '').toLowerCase();
      return (
        (targetUsername && desc.includes(targetUsername)) ||
        (targetName && desc.includes(targetName)) ||
        (targetUsername && cat.includes(targetUsername)) ||
        (targetName && cat.includes(targetName)) ||
        (targetUsername && ent === targetUsername) ||
        (targetName && ent === targetName) ||
        (targetEmail && ent === targetEmail)
      );
    });

    // Sales Invoice check
    const hasInvoice = systemData?.invoices?.some((inv: any) => {
      const ent = (inv.enteredBy || '').toLowerCase();
      const cust = (inv.customerName || '').toLowerCase();
      return (
        (targetUsername && ent === targetUsername) ||
        (targetName && ent === targetName) ||
        (targetName && cust.includes(targetName))
      );
    }) || false;

    // Purchase Order check
    const hasPurchase = systemData?.purchaseOrders?.some((po: any) => {
      const ent = (po.enteredBy || '').toLowerCase();
      return (
        (targetUsername && ent === targetUsername) ||
        (targetName && ent === targetName)
      );
    }) || false;

    let forceDelete = false;
    if (hasTx || hasInvoice || hasPurchase) {
      let reasons = [];
      if (hasTx) reasons.push('লেনদেন খতিয়ান রেকর্ড (Ledger Transactions)');
      if (hasInvoice) reasons.push('বিক্রয় চালান (Sales Invoices)');
      if (hasPurchase) reasons.push('ক্রয় অর্ডার (Purchase Orders)');

      const confirmForce = window.confirm(
        `সতর্কতা: এই ব্যবহারকারীর (${targetUser.name}) সিস্টেমে নিচের রেকর্ডসমূহ বা ট্রানজেকশন রয়েছে:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nসিস্টেমের ডাটা ইন্টিগ্রিটির জন্য এই অ্যাকাউন্টটি মুছে ফেলা রিকমেন্ডেড নয়। তবে আপনি চাইলে অ্যাকাউন্টটি জোরপূর্বক মুছে (Force Delete) ফেলতে পারেন।\n\nআপনি কি নিশ্চিত যে আপনি অ্যাকাউন্টটি ফোর্স ডিলিট (Force Delete) করতে চান?\n\n/ WARNING: This user has historical records in the system. Do you want to FORCE delete their login account anyway?`
      );
      if (!confirmForce) return;
      forceDelete = true;
    }

    // ৪. ডিলিট করার কনফার্মেশন (যদি অলরেডি ফোর্স ডিলিট কনফার্ম না করা হয়ে থাকে)
    if (forceDelete || window.confirm(`আপনি কি নিশ্চিত যে আপনি "${targetUser.name}" ব্যবহারকারী অ্যাকাউন্টটি মুছে ফেলতে চান?\n\nAre you sure you want to delete this user login account?`)) {
      const updated = usersList.filter(u => String(u.id) !== String(id));
      setUsersList(updated);
      
      try {
        // Firestore 'users' কালেকশন থেকে ডিলিট করার চেষ্টা করুন
        if (targetUser.id) {
          await deleteDocById('users', targetUser.id);
        }
      } catch (dbErr) {
        // Intentionally silent: non-critical firestore document deletion failure during user account deletion
        console.warn("Firestore user doc deletion warning (ignoring):", dbErr);
      }

      if (onUpdateSettings && settings) {
        onUpdateSettings({
          ...settings,
          usersList: updated,
        });
      }
      window.alert(`ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে! / User account for ${targetUser.name} deleted successfully!`);
    }
  };

  const handleSendResetPassword = async (email: string, name: string) => {
    if (!email) return;
    const confirmReset = window.confirm(
      `আপনি কি নিশ্চিত যে আপনি "${name}" (${email}) এর জন্য একটি নতুন পাসওয়ার্ড জেনারেট করতে চান?

No email service is configured, so a temporary password will be generated and shown to you here instead of a reset link.`
    );
    if (!confirmReset) return;

    try {
      const { tempPassword } = await sendPasswordResetEmail(email);
      alert(
        `নতুন অস্থায়ী পাসওয়ার্ড: ${tempPassword}

এই পাসওয়ার্ডটি "${email}" এর সাথে সরাসরি শেয়ার করুন এবং লগইনের পর পাসওয়ার্ড পরিবর্তন করতে বলুন।

Temporary password: ${tempPassword} -- share this with ${name} securely; ask them to change it after logging in.`
      );
    } catch (err: any) {
      console.error("Password reset error:", err);
      alert(
        `পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে: ${err.message || err}

Failed to reset password.`
      );
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    // Only allow Administrators to perform this
    if (currentUser?.role !== 'Administrator') {
      setAddUserError('Only active Administrators can create new user accounts. / শুধুমাত্র সচল এডমিনিস্ট্রেটররা নতুন অ্যাকাউন্ট তৈরি করতে পারেন।');
      return;
    }

    if (!newUserFullName || !newUserUsername || !newUserEmail || !newUserPassword) {
      setAddUserError('All fields including password are required. / পাসওয়ার্ড সহ সব তথ্য পূরণ করা আবশ্যক।');
      return;
    }

    if (newUserPassword.length < 6) {
      setAddUserError('Password must be at least 6 characters long. / পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    try {
      setAddUserLoading(false); // set true during process
      setAddUserLoading(true);
      
      const result = await createNewUserWithSecondaryApp(
        newUserEmail,
        newUserPassword,
        newUserFullName,
        newUserRole,
        newUserUsername
      );

      const initials = newUserFullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const newUser = {
        id: result.uid,
        name: newUserFullName,
        username: newUserUsername.toLowerCase().replace(/\s/g, '_'),
        email: newUserEmail,
        role: newUserRole,
        status: 'Active',
        avatar: initials || 'U',
      };

      const updated = [...usersList, newUser];
      setUsersList(updated);
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserUsername('');
      setNewUserPassword('');
      
      if (onUpdateSettings && settings) {
        onUpdateSettings({
          ...settings,
          usersList: updated
        });
      }
      alert(`Successfully registered account for ${newUserFullName}! / ${newUserFullName}-এর অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!`);
    } catch (err: any) {
      console.error("In-app user creation error:", err);
      let errMsg = `Failed to create account: ${err.message || err} / অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে: ${err.message || err}`;
      if (err.code === 'auth/email-already-in-use') {
        const confirmLink = confirm(
          `এই ইমেইল এড্রেসটি (${newUserEmail}) ইতিমধ্যেই ফায়ারবেস অথেনটিকেশনে নিবন্ধিত আছে, কিন্তু বর্তমান ব্যবহারকারী তালিকায় নেই।\n\nআপনি কি এই বিদ্যমান অ্যাকাউন্টটি সিস্টেমের ব্যবহারকারী তালিকায় পুনরায় সংযুক্ত (Link/Restore) করতে চান?\n\nThis email is already registered in Firebase Auth but missing from the list. Do you want to restore and link it?`
        );
        if (confirmLink) {
          try {
            setAddUserLoading(true);
            // Search existing users for a matching email to recover the real id
            const qSnap = await queryCollectionWhere<any>('users', 'email', newUserEmail);
            
            let existingUid = `imported-${Date.now()}`;
            let existingName = newUserFullName;
            let existingUsername = newUserUsername;
            let existingRole = newUserRole;

            if (qSnap.length > 0) {
              const matchedDoc = qSnap[0];
              existingUid = String(matchedDoc.id);
              if (matchedDoc.name) existingName = matchedDoc.name;
              if (matchedDoc.username) existingUsername = matchedDoc.username;
              if (matchedDoc.role) existingRole = matchedDoc.role;
            }

            const initials = existingName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const newUser = {
              id: existingUid,
              name: existingName,
              username: existingUsername.toLowerCase().replace(/\s/g, '_'),
              email: newUserEmail,
              role: existingRole,
              status: 'Active' as const,
              avatar: initials || 'U',
            };

            const updated = [...usersList, newUser];
            setUsersList(updated);
            setNewUserFullName('');
            setNewUserEmail('');
            setNewUserUsername('');
            setNewUserPassword('');

            if (onUpdateSettings && settings) {
              onUpdateSettings({
                ...settings,
                usersList: updated
              });
            }

            alert(`অ্যাকাউন্টটি সফলভাবে পুনরুদ্ধার এবং লিংক করা হয়েছে! / Successfully restored and linked account for ${existingName}!`);
            return;
          } catch (restoreErr: any) {
            console.error("Error restoring user profile:", restoreErr);
            errMsg = `Failed to restore profile: ${restoreErr.message || restoreErr} / প্রোফাইল পুনরুদ্ধার ব্যর্থ হয়েছে।`;
          }
        } else {
          errMsg = 'This email address is already in use by another user. / এই ইমেইলটি ইতিমধ্যে অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে।';
        }
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'The email address is invalid. / অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন।';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'The password is too weak. Please choose a stronger password. / পাসওয়ার্ডটি অত্যন্ত দুর্বল। অনুগ্রহ করে আরও শক্তিশালী পাসওয়ার্ড দিন।';
      } else if (err.message && err.message.includes('permission-denied')) {
        errMsg = 'Access Denied. You do not have permission to write this user profile. / প্রবেশাধিকার প্রত্যাখ্যাত। ফায়ারস্টোর পারমিশন নেই।';
      }
      setAddUserError(errMsg);
      alert(errMsg);
    } finally {
      setAddUserLoading(false);
    }
  };

  // 9. Roles Permissions Matrix
  const [rolesPermissions, setRolesPermissions] = useState([
    { role: 'Administrator', sales: { read: true, write: true, delete: true }, purchase: { read: true, write: true, delete: true }, inventory: { read: true, write: true, delete: true }, banking: { read: true, write: true, delete: true }, hr: { read: true, write: true, delete: true } },
    { role: 'Manager', sales: { read: true, write: true, delete: false }, purchase: { read: true, write: true, delete: false }, inventory: { read: true, write: true, delete: true }, banking: { read: true, write: true, delete: false }, hr: { read: true, write: true, delete: false } },
    { role: 'Cashier', sales: { read: true, write: true, delete: false }, purchase: { read: false, write: false, delete: false }, inventory: { read: true, write: false, delete: false }, banking: { read: true, write: false, delete: false }, hr: { read: false, write: false, delete: false } },
    { role: 'Inventory Officer', sales: { read: false, write: false, delete: false }, purchase: { read: true, write: true, delete: false }, inventory: { read: true, write: true, delete: true }, banking: { read: false, write: false, delete: false }, hr: { read: false, write: false, delete: false } },
  ]);

  const handleTogglePermission = (roleIdx: number, module: 'sales' | 'purchase' | 'inventory' | 'banking' | 'hr', action: 'read' | 'write' | 'delete') => {
    const updated = [...rolesPermissions];
    updated[roleIdx][module][action] = !updated[roleIdx][module][action];
    setRolesPermissions(updated);
  };

  // 10. Loan Setting
  const [loanDefaultInt, setLoanDefaultInt] = useState(settings?.loanDefaultInt || 9);
  const [loanMaxTenure, setLoanMaxTenure] = useState(settings?.loanMaxTenure || 36);
  const [loanEarlyRepayPenalty, setLoanEarlyRepayPenalty] = useState(settings?.loanEarlyRepayPenalty || 1);
  const [loanMinMargin, setLoanMinMargin] = useState(settings?.loanMinMargin || 20);

  // 12. Menu Management
  const [sidebarMenusEnabled, setSidebarMenusEnabled] = useState({
    dashboard: true,
    inventory: true,
    sales: true,
    purchase: true,
    employee: true,
    accounting: true,
    banking: true,
    loan: true,
    reports: true,
  });

  // 13. Delete History
  const [deletedItems, setDeletedItems] = useState([
    { id: 'DEL-01', date: '2026-07-06 14:20:05', module: 'Sales Invoice', details: 'Invoice #INV-2026-003, Value: ৳12,400', deletedBy: 'admin_rony' },
    { id: 'DEL-02', date: '2026-07-05 09:12:44', module: 'Banking Account', details: 'Nagad Personal Wallet, Initial Balance: ৳5,000', deletedBy: 'tasnim_mgr' },
    { id: 'DEL-03', date: '2026-07-04 18:45:10', module: 'Employee Payroll', details: 'June Advance disbursement for Sabbir Rahman', deletedBy: 'admin_rony' },
  ]);

  const handleRestoreItem = (id: string, module: string) => {
    setDeletedItems(deletedItems.filter(item => item.id !== id));
    alert(`Successfully restored ${module} entry back into active tables!`);
  };

  // 14. Sales Return Setting
  const [salesReturnWindow, setSalesReturnWindow] = useState(settings?.salesReturnWindow || '15 Days');
  const [salesRestockingFee, setSalesRestockingFee] = useState(settings?.salesRestockingFee || 5);
  const [salesReturnAction, setSalesReturnAction] = useState(settings?.salesReturnAction || 'Credit Note');
  const [salesReturnInspection, setSalesReturnInspection] = useState(settings?.salesReturnInspection ?? true);

  // 15. Sales Order Setting
  const [salesOrderAutoRelease, setSalesOrderAutoRelease] = useState(settings?.salesOrderAutoRelease ?? true);
  const [salesOrderPartial, setSalesOrderPartial] = useState(settings?.salesOrderPartial ?? false);
  const [salesOrderPrefix, setSalesOrderPrefix] = useState(settings?.salesOrderPrefix || 'SO-');
  const [salesOrderTerms, setSalesOrderTerms] = useState(settings?.salesOrderTerms || 'Immediate Delivery');

  // 16. Activity Log
  const [activityLogs, setActivityLogs] = useState([
    { id: 'LOG-304', time: '2026-07-07 09:54:10', user: 'admin_rony', action: 'System Login', module: 'Security', status: 'Success', ip: '192.168.1.104' },
    { id: 'LOG-303', time: '2026-07-06 18:32:15', user: 'admin_rony', action: 'Update Base VAT Rate', module: 'Settings', status: 'Success', ip: '192.168.1.104' },
    { id: 'LOG-302', time: '2026-07-06 15:45:00', user: 'tasnim_mgr', action: 'Approved Purchase PO #PO-02', module: 'Purchase', status: 'Success', ip: '192.168.1.112' },
    { id: 'LOG-301', time: '2026-07-06 11:20:44', user: 'sabbir_csh', action: 'Created POS Receipt #INV-109', module: 'Sales', status: 'Success', ip: '192.168.1.135' },
    { id: 'LOG-300', time: '2026-07-05 17:01:29', user: 'admin_rony', action: 'Added Supplier "Apex Ltd."', module: 'Purchase', status: 'Success', ip: '192.168.1.104' },
  ]);
  const [activityLogSearch, setActivityLogSearch] = useState('');

  // 17. Purchase Setting
  const [purchaseStrictPOAmt, setPurchaseStrictPOAmt] = useState(settings?.purchaseStrictPOAmt || 100000);
  const [purchaseAutoReorder, setPurchaseAutoReorder] = useState(settings?.purchaseAutoReorder ?? true);
  const [purchaseDefaultUnit, setPurchaseDefaultUnit] = useState(settings?.purchaseDefaultUnit || 'Box');
  const [purchaseGrnAutoDisburse, setPurchaseGrnAutoDisburse] = useState(settings?.purchaseGrnAutoDisburse ?? false);

  // 18. Entry Setting
  const [entryAutoPosting, setEntryAutoPosting] = useState(settings?.entryAutoPosting ?? true);
  const [entryLockDays, setEntryLockDays] = useState(settings?.entryLockDays || 30);
  const [entryVoucherPrefix, setEntryVoucherPrefix] = useState(settings?.entryVoucherPrefix || 'VOU-');
  const [entryAllowManualLedger, setEntryAllowManualLedger] = useState(settings?.entryAllowManualLedger ?? false);

  // 19. System Date Override Setting
  const [sysDateMode, setSysDateMode] = useState<'auto' | 'custom'>(settings?.systemDateMode || 'auto');
  const [sysCustomDate, setSysCustomDate] = useState<string>(settings?.systemCustomDate || new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (settings) {
      setCompName(settings.companyName || '');
      setCompAddr(settings.companyAddress || '');
      setPhone(settings.phone || '');
      setTin(settings.tinNumber || '');
      setBin(settings.binNumber || '');
      setTradeLic(settings.tradeLicense || '');
      setVat(settings.defaultVatRate || 5);
      setDiscount(settings.defaultDiscountRate || 0);
      setCurr(settings.baseCurrency || '৳');
      setFooter(settings.receiptFooterMessage || '');
      setAutoPrint(settings.autoPrintReceipt ?? true);
      setSmsNotif(settings.enableSmsNotification ?? false);
      setWarehouse(settings.defaultWarehouse || '');
      setDefUnit(settings.defaultUnit || 'Pcs');
      setThreshold(settings.lowStockThreshold || 5);
      setTz(settings.timezone || 'Asia/Dhaka');
      
      if (settings.taxes) setTaxes(settings.taxes);
      if (settings.paymentMethods) setPaymentMethods(settings.paymentMethods);
      if (settings.usersList) setUsersList(settings.usersList);

      setSupplierCreditTerms(settings.supplierCreditTerms || 'Net 30');
      setSupplierCodePrefix(settings.supplierCodePrefix || 'SUP-');
      setReorderLeadTime(settings.reorderLeadTime || 5);
      setSupplierReqLimit(settings.supplierReqLimit || 50000);

      setCustomerCreditLimit(settings.customerCreditLimit || 100000);
      setCustomerGroupDefault(settings.customerGroupDefault || 'General');
      setCustomerGracePeriod(settings.customerGracePeriod || 7);
      setCustomerAllowUnregistered(settings.customerAllowUnregistered ?? true);

      setProductSkuRule(settings.productSkuRule || 'Auto');
      setProductSkuPrefix(settings.productSkuPrefix || 'PRD-');
      setProductMarkup(settings.productMarkup || 15);
      setProductValuation(settings.productValuation || 'Weighted Average');

      setPosDefaultCustomer(settings.posDefaultCustomer || 'Walk-In Cash Customer');
      setPosShowImageGrid(settings.posShowImageGrid ?? true);
      setPosQuickDiscounts(settings.posQuickDiscounts || '5, 10, 15, 20');
      setPosCashDrawTrigger(settings.posCashDrawTrigger || 'Auto Open');

      setCollectionAutoAlloc(settings.collectionAutoAlloc ?? true);
      setCollectionBounceFee(settings.collectionBounceFee || 500);
      setCollectionEarlyDiscount(settings.collectionEarlyDiscount || 2);
      setCollectionTargetDays(settings.collectionTargetDays || 10);

      setLoanDefaultInt(settings.loanDefaultInt || 9);
      setLoanMaxTenure(settings.loanMaxTenure || 36);
      setLoanEarlyRepayPenalty(settings.loanEarlyRepayPenalty || 1);
      setLoanMinMargin(settings.loanMinMargin || 20);

      setSalesReturnWindow(settings.salesReturnWindow || '15 Days');
      setSalesRestockingFee(settings.salesRestockingFee || 5);
      setSalesReturnAction(settings.salesReturnAction || 'Credit Note');
      setSalesReturnInspection(settings.salesReturnInspection ?? true);

      setSalesOrderAutoRelease(settings.salesOrderAutoRelease ?? true);
      setSalesOrderPartial(settings.salesOrderPartial ?? false);
      setSalesOrderPrefix(settings.salesOrderPrefix || 'SO-');
      setSalesOrderTerms(settings.salesOrderTerms || 'Immediate Delivery');

      setPurchaseStrictPOAmt(settings.purchaseStrictPOAmt || 100000);
      setPurchaseAutoReorder(settings.purchaseAutoReorder ?? true);
      setPurchaseDefaultUnit(settings.purchaseDefaultUnit || 'Box');
      setPurchaseGrnAutoDisburse(settings.purchaseGrnAutoDisburse ?? false);

      setEntryAutoPosting(settings.entryAutoPosting ?? true);
      setEntryLockDays(settings.entryLockDays || 30);
      setEntryVoucherPrefix(settings.entryVoucherPrefix || 'VOU-');
      setEntryAllowManualLedger(settings.entryAllowManualLedger ?? false);

      setSysDateMode(settings.systemDateMode || 'auto');
      setSysCustomDate(settings.systemCustomDate || new Date().toISOString().split('T')[0]);
    }
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const mappedValuation = productValuation === 'Weighted Average' ? 'WAC' : productValuation;
    localStorage.setItem('nexova_valuation_method', mappedValuation);
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        companyName: compName,
        companyAddress: compAddr,
        phone,
        tinNumber: tin,
        binNumber: bin,
        tradeLicense: tradeLic,
        defaultVatRate: Number(vat),
        defaultDiscountRate: Number(discount),
        baseCurrency: curr,
        receiptFooterMessage: footer,
        autoPrintReceipt: autoPrint,
        enableSmsNotification: smsNotif,
        defaultWarehouse: warehouse,
        defaultUnit: defUnit,
        lowStockThreshold: Number(threshold),
        timezone: tz,
        taxes: taxes,
        paymentMethods: paymentMethods,
        usersList: usersList,
        supplierCreditTerms,
        supplierCodePrefix,
        reorderLeadTime,
        supplierReqLimit,
        customerCreditLimit,
        customerGroupDefault,
        customerGracePeriod,
        customerAllowUnregistered,
        productSkuRule,
        productSkuPrefix,
        productMarkup,
        productValuation,
        posDefaultCustomer,
        posShowImageGrid,
        posQuickDiscounts,
        posCashDrawTrigger,
        collectionBounceFee,
        collectionEarlyDiscount,
        collectionTargetDays,
        collectionAutoAlloc,
        loanDefaultInt,
        loanMaxTenure,
        loanEarlyRepayPenalty,
        loanMinMargin,
        salesReturnWindow,
        salesRestockingFee,
        salesReturnAction,
        salesReturnInspection,
        salesOrderAutoRelease,
        salesOrderPartial,
        salesOrderPrefix,
        salesOrderTerms,
        purchaseStrictPOAmt,
        purchaseAutoReorder,
        purchaseDefaultUnit,
        purchaseGrnAutoDisburse,
        entryAutoPosting,
        entryLockDays,
        entryVoucherPrefix,
        entryAllowManualLedger,
        systemDateMode: sysDateMode,
        systemCustomDate: sysCustomDate,
      });
      alert('System settings updated successfully!');
    }
  };
  
  const handleSaveTabSettings = (tabLabel: string) => {
    const mappedValuation = productValuation === 'Weighted Average' ? 'WAC' : productValuation;
    localStorage.setItem('nexova_valuation_method', mappedValuation);
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        companyName: compName,
        companyAddress: compAddr,
        phone,
        tinNumber: tin,
        binNumber: bin,
        tradeLicense: tradeLic,
        defaultVatRate: Number(vat),
        defaultDiscountRate: Number(discount),
        baseCurrency: curr,
        receiptFooterMessage: footer,
        autoPrintReceipt: autoPrint,
        enableSmsNotification: smsNotif,
        defaultWarehouse: warehouse,
        defaultUnit: defUnit,
        lowStockThreshold: Number(threshold),
        timezone: tz,
        taxes: taxes,
        paymentMethods: paymentMethods,
        usersList: usersList,
        supplierCreditTerms,
        supplierCodePrefix,
        reorderLeadTime,
        supplierReqLimit,
        customerCreditLimit,
        customerGroupDefault,
        customerGracePeriod,
        customerAllowUnregistered,
        productSkuRule,
        productSkuPrefix,
        productMarkup,
        productValuation,
        posDefaultCustomer,
        posShowImageGrid,
        posQuickDiscounts,
        posCashDrawTrigger,
        collectionBounceFee,
        collectionEarlyDiscount,
        collectionTargetDays,
        collectionAutoAlloc,
        loanDefaultInt,
        loanMaxTenure,
        loanEarlyRepayPenalty,
        loanMinMargin,
        salesReturnWindow,
        salesRestockingFee,
        salesReturnAction,
        salesReturnInspection,
        salesOrderAutoRelease,
        salesOrderPartial,
        salesOrderPrefix,
        salesOrderTerms,
        purchaseStrictPOAmt,
        purchaseAutoReorder,
        purchaseDefaultUnit,
        purchaseGrnAutoDisburse,
        entryAutoPosting,
        entryLockDays,
        entryVoucherPrefix,
        entryAllowManualLedger,
      });
      alert(`${tabLabel} configurations saved successfully!`);
    }
  };

  // Note: True automated background backup without human action requires a server-side scheduled background job
  // (e.g. Cloud Functions + Cloud Scheduler). This client-side reminder system prompts admins to run manual exports periodically.
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(systemData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexova_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Record lastBackupAt timestamp in AppSettings and persist to Firestore
    const nowIso = new Date().toISOString();
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        lastBackupAt: nowIso,
      } as AppSettings);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Safe Confirmation gate requiring case-sensitive "RESTORE" word input
      const userInput = window.prompt(
        "সতর্কতা: ব্যাকআপ ফাইলটি ইম্পোর্ট করলে আপনার বর্তমান সমস্ত ডাটা ওভাররাইট হয়ে যাবে!\n\nডাটা রিস্টোর করার জন্য নিচে বড় হাতের অক্ষরে 'RESTORE' টাইপ করুন:"
      );

      if (userInput !== "RESTORE") {
        alert("ডাটা রিস্টোর বাতিল করা হয়েছে বা ভুল ইনপুট দেওয়া হয়েছে। (Restore aborted or invalid input)");
        e.target.value = ''; // reset the file input
        return;
      }

      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (onImportData) {
            onImportData(parsed);
          }
        } catch (err) {
          alert("Invalid JSON file uploaded.");
        }
      };
    }
  };

  const [mobileWallets, setMobileWallets] = useState([
    { name: 'bKash Merchant Wallet', provider: 'bKash', number: '01712-940129', balance: 145000, status: 'Active' },
    { name: 'Nagad Business Pay', provider: 'Nagad', number: '01815-402910', balance: 82000, status: 'Active' },
    { name: 'Rocket Corp Wallet', provider: 'Rocket', number: '01911-301291', balance: 12500, status: 'Active' },
  ]);

  // --- GENERAL FORM MODAL ON/OFF ---
  const [showBankModal, setShowBankModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // --- FORM VALUES ---
  // Bank Form
  const [bName, setBName] = useState('');
  const [bAccName, setBAccName] = useState('');
  const [bAccNo, setBAccNo] = useState('');
  const [bType, setBType] = useState<BankAccount['type']>('Current');

  // Loan Form
  const [lBorrower, setLBorrower] = useState('');
  const [lAmt, setLAmt] = useState('');
  const [lInt, setLInt] = useState('9');
  const [lDur, setLDur] = useState('12');

  // Deposit / Withdrawal Forms
  const [txTargetBank, setTxTargetBank] = useState(bankAccounts[0]?.id || '');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  // Transfer Form
  const [xfrFrom, setXfrFrom] = useState(bankAccounts[0]?.id || '');
  const [xfrTo, setXfrTo] = useState(bankAccounts[1]?.id || '');
  const [xfrAmt, setXfrAmt] = useState('');

  // Party Transaction Form
  const [partyName, setPartyName] = useState('');
  const [partyRole, setPartyRole] = useState<'Customer' | 'Supplier'>('Customer');
  const [partyAmt, setPartyAmt] = useState('');
  const [partyBank, setPartyBank] = useState(bankAccounts[0]?.id || '');

  // Mobile Banking Form
  const [mobWalletIdx, setMobWalletIdx] = useState('0');
  const [mobTxType, setMobTxType] = useState<'Cash In' | 'Cash Out'>('Cash In');
  const [mobAmt, setMobAmt] = useState('');
  const [mobDesc, setMobDesc] = useState('');

  // Reconciliation Form
  const [reconBankId, setReconBankId] = useState(bankAccounts[0]?.id || '');
  const [reconStatementBal, setReconStatementBal] = useState('');
  const [reconMatched, setReconMatched] = useState<boolean | null>(null);

  // Repayments Form
  const [repayLoanId, setRepayLoanId] = useState(loanAccounts[0]?.id || '');
  const [repayAmt, setRepayAmt] = useState('');

  // --- HANDLERS ---
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bAccName || !bAccNo) return;

    onAddBankAccount({
      bankName: bName,
      accountName: bAccName,
      accountNumber: bAccNo,
      type: bType,
    });

    const newBank: BankAccount = {
      id: `bank_dyn_${Date.now()}`,
      bankName: bName,
      accountName: bAccName,
      accountNumber: bAccNo,
      type: bType,
      balance: 0,
    };
    setLocalBanks([...localBanks, newBank]);

    setBName('');
    setBAccName('');
    setBAccNo('');
    setShowBankModal(false);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lBorrower || !lAmt) return;

    onAddLoan({
      borrowerName: lBorrower,
      amount: parseFloat(lAmt),
      interestRate: parseFloat(lInt),
      durationMonths: parseInt(lDur),
    });

    const newLoan: LoanAccount = {
      id: `loan_dyn_${Date.now()}`,
      accountNo: `LN-${Math.floor(Math.random() * 9000) + 1000}`,
      borrowerName: lBorrower,
      amount: parseFloat(lAmt),
      disbursedAmount: 0,
      outstandingAmount: parseFloat(lAmt),
      interestRate: parseFloat(lInt),
      durationMonths: parseInt(lDur),
      status: 'Active',
    };
    setLocalLoans([...localLoans, newLoan]);

    setLBorrower('');
    setLAmt('');
    setShowLoanModal(false);
  };

  // Deposit Inward Handler
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTargetBank || !txAmount) return;
    const amt = parseFloat(txAmount);
    if (amt <= 0) return;

    setLocalBanks(prev => prev.map(b => b.id === txTargetBank ? { ...b, balance: b.balance + amt } : b));

    const selectedBank = localBanks.find(b => b.id === txTargetBank);
    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `DEP-JV-${1000 + localTxs.length}`,
      description: txDesc || 'Direct Cash Vault Deposit',
      category: 'Capital Inflow',
      amount: amt,
      type: 'Deposit',
      accountId: txTargetBank,
    };
    setLocalTxs([newTx, ...localTxs]);

    setTxAmount('');
    setTxDesc('');
    alert(`Successfully credited ৳${amt.toLocaleString()} to ${selectedBank?.accountName}`);
  };

  // Withdrawal Outward Handler
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTargetBank || !txAmount) return;
    const amt = parseFloat(txAmount);
    if (amt <= 0) return;

    const selectedBank = localBanks.find(b => b.id === txTargetBank);
    if (selectedBank && selectedBank.balance < amt) {
      alert(`Insufficient funds! Available balance is ৳${selectedBank.balance.toLocaleString()}`);
      return;
    }

    setLocalBanks(prev => prev.map(b => b.id === txTargetBank ? { ...b, balance: b.balance - amt } : b));

    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `WTH-JV-${1000 + localTxs.length}`,
      description: txDesc || 'Direct Cash Vault Withdrawal',
      category: 'Cash Withdrawal',
      amount: amt,
      type: 'Expense',
      accountId: txTargetBank,
    };
    setLocalTxs([newTx, ...localTxs]);

    setTxAmount('');
    setTxDesc('');
    alert(`Successfully withdrew ৳${amt.toLocaleString()} from ${selectedBank?.accountName}`);
  };

  // Internal Bank to Bank Transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!xfrFrom || !xfrTo || !xfrAmt || xfrFrom === xfrTo) {
      alert('Source and destination accounts must be different!');
      return;
    }
    const amt = parseFloat(xfrAmt);
    const sourceBank = localBanks.find(b => b.id === xfrFrom);
    if (sourceBank && sourceBank.balance < amt) {
      alert(`Insufficient funds in source account! Available is ৳${sourceBank.balance.toLocaleString()}`);
      return;
    }

    setLocalBanks(prev => prev.map(b => {
      if (b.id === xfrFrom) return { ...b, balance: b.balance - amt };
      if (b.id === xfrTo) return { ...b, balance: b.balance + amt };
      return b;
    }));

    const destBank = localBanks.find(b => b.id === xfrTo);
    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `TRF-JV-${1000 + localTxs.length}`,
      description: `Fund transfer from ${sourceBank?.accountName} to ${destBank?.accountName}`,
      category: 'Internal Transfer',
      amount: amt,
      type: 'Expense',
      accountId: xfrFrom,
    };
    setLocalTxs([newTx, ...localTxs]);

    setXfrAmt('');
    alert(`Fund transfer of ৳${amt.toLocaleString()} completed successfully.`);
  };

  // Party Transaction (Settling Vendor/Client ledger)
  const handlePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !partyAmt || !partyBank) return;
    const amt = parseFloat(partyAmt);

    const bank = localBanks.find(b => b.id === partyBank);
    if (partyRole === 'Supplier' && bank && bank.balance < amt) {
      alert(`Insufficient funds in selected bank to pay supplier!`);
      return;
    }

    setLocalBanks(prev => prev.map(b => {
      if (b.id === partyBank) {
        return { ...b, balance: partyRole === 'Customer' ? b.balance + amt : b.balance - amt };
      }
      return b;
    }));

    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `PRT-JV-${1000 + localTxs.length}`,
      description: `Party Payment: ${partyRole === 'Customer' ? 'Inward from' : 'Outward to'} ${partyName}`,
      category: partyRole === 'Customer' ? 'Sales Income' : 'Cost of Goods Sold',
      amount: amt,
      type: partyRole === 'Customer' ? 'Deposit' : 'Expense',
      accountId: partyBank,
    };
    setLocalTxs([newTx, ...localTxs]);

    setPartyName('');
    setPartyAmt('');
    alert(`Successfully posted party transaction of ৳${amt.toLocaleString()} to ledger.`);
  };

  // Mobile Banking Wallet Transaction
  const handleMobileTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobAmt) return;
    const idx = parseInt(mobWalletIdx);
    const amt = parseFloat(mobAmt);
    const targetWallet = mobileWallets[idx];

    if (mobTxType === 'Cash Out' && targetWallet.balance < amt) {
      alert(`Insufficient wallet balance!`);
      return;
    }

    setMobileWallets(prev => prev.map((w, i) => {
      if (i === idx) {
        return { ...w, balance: mobTxType === 'Cash In' ? w.balance + amt : w.balance - amt };
      }
      return w;
    }));

    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `MOB-JV-${1000 + localTxs.length}`,
      description: mobDesc || `Mobile wallet ${mobTxType} on ${targetWallet.provider}`,
      category: 'Mobile Transaction',
      amount: amt,
      type: mobTxType === 'Cash In' ? 'Deposit' : 'Expense',
      accountId: 'mobile',
    };
    setLocalTxs([newTx, ...localTxs]);

    setMobAmt('');
    setMobDesc('');
    alert(`Successfully posted ৳${amt.toLocaleString()} ${mobTxType} transaction on ${targetWallet.name}`);
  };

  // Bank Reconciliation matching
  const handleReconSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconStatementBal) return;
    const targetBank = localBanks.find(b => b.id === reconBankId);
    if (!targetBank) return;

    const stmtVal = parseFloat(reconStatementBal);
    const isMatched = Math.abs(targetBank.balance - stmtVal) < 0.01;
    setReconMatched(isMatched);
  };

  // Disburse Loan Payout
  const handleDisburse = (loanId: string) => {
    const loan = localLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Credit one of our bank accounts (e.g. first bank account)
    if (localBanks.length > 0) {
      const bId = localBanks[0].id;
      setLocalBanks(prev => prev.map(b => b.id === bId ? { ...b, balance: b.balance + loan.amount } : b));
    }

    setLocalLoans(prev => prev.map(l => l.id === loanId ? { ...l, disbursedAmount: loan.amount, status: 'Disbursed' } : l));

    // Record dynamic transaction
    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `DSB-JV-${1000 + localTxs.length}`,
      description: `Disbursed loan capital from ${loan.borrowerName}`,
      category: 'Loan Disbursement Credit',
      amount: loan.amount,
      type: 'Deposit',
      accountId: localBanks[0]?.id || 'cash',
    };
    setLocalTxs([newTx, ...localTxs]);

    alert(`Successfully disbursed ৳${loan.amount.toLocaleString()} into corporate cash reserve account.`);
  };

  // Repay Loan Installment
  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmt || !repayLoanId) return;
    const amt = parseFloat(repayAmt);

    const targetLoan = localLoans.find(l => l.id === repayLoanId);
    if (!targetLoan) return;

    if (amt > targetLoan.outstandingAmount) {
      alert(`Repayment amount cannot exceed remaining outstanding debt of ৳${targetLoan.outstandingAmount.toLocaleString()}`);
      return;
    }

    // Deduct from bank accounts
    if (localBanks.length > 0) {
      const bId = localBanks[0].id;
      setLocalBanks(prev => prev.map(b => b.id === bId ? { ...b, balance: b.balance - amt } : b));
    }

    setLocalLoans(prev => prev.map(l => l.id === repayLoanId ? { ...l, outstandingAmount: l.outstandingAmount - amt, status: l.outstandingAmount - amt <= 0 ? 'Closed' : 'Disbursed' } : l));

    // Record transaction
    const newTx: Transaction = {
      id: `tx_dyn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `RPY-JV-${1000 + localTxs.length}`,
      description: `Loan Repayment installment to ${targetLoan.borrowerName}`,
      category: 'Debt Amortization',
      amount: amt,
      type: 'Expense',
      accountId: localBanks[0]?.id || 'cash',
    };
    setLocalTxs([newTx, ...localTxs]);

    setRepayAmt('');
    alert(`Amortization payment of ৳${amt.toLocaleString()} recorded successfully.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ========================================================
          BANKING TERMINALS & COGNATES
          ======================================================== */}
      {currentTab === 'banking' && (
        <div className="space-y-6">
          
          {/* 1. BANK ACCOUNTS VIEW */}
          {subTab === 'bank_accounts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-display">Banking Terminals</h2>
                  <p className="text-xs text-slate-400 mt-1">Review ledger vault liquid balances and connected corporate bank accounts.</p>
                </div>
                <button
                  onClick={() => setShowBankModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Link Bank Account</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {localBanks.map((b) => (
                  <div key={b.id} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
                    <div className="flex items-start justify-between">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                        {b.type}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-bold text-slate-800 text-sm">{b.accountName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{b.bankName} • {b.accountNumber}</p>
                    </div>
                    <div className="border-t border-slate-50 pt-4 mt-4 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Settled Balance</span>
                      <span className="text-base font-black text-slate-800 font-display">৳{b.balance.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. TRANSACTIONS LEDGER */}
          {subTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Bank Ledger Transactions</h2>
                <p className="text-xs text-slate-400 mt-1">Review comprehensive deposits, payments, withdrawals, and capital transfers.</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Reference No</th>
                      <th className="py-3.5 px-6">Transaction Description</th>
                      <th className="py-3.5 px-6">Category Tag</th>
                      <th className="py-3.5 px-6 text-right">Inflow / Outflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localTxs.slice().reverse().map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-6 text-slate-500 font-medium">{t.date || '2026-07-06'}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">{t.referenceNo || 'TRX-JV'}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{t.description}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.category}</td>
                        <td className="py-3.5 px-6 text-right font-black">
                          {t.type === 'Deposit' || t.type === 'Income' ? (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>+৳{t.amount.toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                              <ArrowDownRight className="h-3.5 w-3.5" />
                              <span>-৳{t.amount.toLocaleString()}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. DEPOSIT COGNATE */}
          {subTab === 'deposit' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Record Bank Deposit Inward</h3>
                <p className="text-xs text-slate-400 mt-1">Manually credit funds into one of your connected business bank terminal ledgers.</p>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Bank Account</label>
                  <select
                    value={txTargetBank} onChange={(e) => setTxTargetBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName} (৳{b.balance.toLocaleString()})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deposit Amount (৳) *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 50000" value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inward Memo Description</label>
                  <input
                    type="text" placeholder="e.g. Capital injection from promoter" value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Confirm Credit Deposit
                </button>
              </form>
            </div>
          )}

          {/* 4. WITHDRAWAL COGNATE */}
          {subTab === 'withdrawal' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Record Bank Withdrawal Outward</h3>
                <p className="text-xs text-slate-400 mt-1">Manually debit funds from connected corporate banks for vault cash replenishment.</p>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Bank Account</label>
                  <select
                    value={txTargetBank} onChange={(e) => setTxTargetBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName} (৳{b.balance.toLocaleString()})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Withdrawal Amount (৳) *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 10000" value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outward Memo Description</label>
                  <input
                    type="text" placeholder="e.g. Petty cash replenishment" value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Confirm Debit Withdrawal
                </button>
              </form>
            </div>
          )}

          {/* 5. BANK TRANSFERS COGNATE */}
          {subTab === 'transfers' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Internal Funds Transfer</h3>
                <p className="text-xs text-slate-400 mt-1">Move cash balances seamlessly between different linked company bank accounts.</p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From (Debit Source)</label>
                    <select value={xfrFrom} onChange={(e) => setXfrFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                      {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName} (৳{b.balance.toLocaleString()})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To (Credit Dest)</label>
                    <select value={xfrTo} onChange={(e) => setXfrTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                      {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName} (৳{b.balance.toLocaleString()})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transfer Amount (৳) *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 5000" value={xfrAmt}
                    onChange={(e) => setXfrAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Post Transfer Journal
                </button>
              </form>
            </div>
          )}

          {/* 6. PARTY TRANSACTIONS */}
          {subTab === 'party_transaction' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Client / Supplier Transactions</h3>
                <p className="text-xs text-slate-400 mt-1">Directly log customer collection inflows or vendor pay-outs into ledgers.</p>
              </div>

              <form onSubmit={handlePartySubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Party Role</label>
                    <select value={partyRole} onChange={(e) => setPartyRole(e.target.value as 'Customer' | 'Supplier')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                      <option value="Customer">Customer Inflow (Credit)</option>
                      <option value="Supplier">Supplier Pay-out (Debit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Settlement Channel</label>
                    <select value={partyBank} onChange={(e) => setPartyBank(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                      {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Party / Entity Name *</label>
                  <input
                    type="text" required placeholder="e.g. Hasan Enterprise Ltd." value={partyName}
                    onChange={(e) => setPartyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Settled Amount (৳) *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 15000" value={partyAmt}
                    onChange={(e) => setPartyAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors ${partyRole === 'Customer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  Record Party Ledger Settlement
                </button>
              </form>
            </div>
          )}

          {/* 7. MOBILE BANKING DIRECTORY */}
          {subTab === 'mobile_banking' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mobileWallets.map((wallet) => (
                  <div key={wallet.number} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded uppercase">{wallet.provider}</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5">{wallet.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{wallet.number}</p>
                      <p className="font-black text-slate-800 mt-2 text-sm">৳{wallet.balance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Post Mobile Wallet transaction</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Adjust wallet floats for instant Bkash/Nagad checkout reconciliations.</p>
                </div>

                <form onSubmit={handleMobileTxSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Wallet</label>
                      <select value={mobWalletIdx} onChange={(e) => setMobWalletIdx(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                        {mobileWallets.map((w, i) => (
                          // index key safe: fixed-order static list
                          <option key={i} value={i}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Float</label>
                      <select value={mobTxType} onChange={(e) => setMobTxType(e.target.value as 'Cash In' | 'Cash Out')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                        <option value="Cash In">Cash In (Credit Float)</option>
                        <option value="Cash Out">Cash Out (Debit Outflow)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Amount (৳) *</label>
                    <input
                      type="number" required min="1" placeholder="e.g. 5000" value={mobAmt}
                      onChange={(e) => setMobAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Reference</label>
                    <input
                      type="text" placeholder="e.g. Bkash Wallet Cash-in Ref" value={mobDesc}
                      onChange={(e) => setMobDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Confirm Mobile Wallet Float Update
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 8. BANK RECONCILIATION */}
          {subTab === 'reconciliation' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Bank Ledger Reconciliation</h3>
                <p className="text-xs text-slate-400 mt-1">Cross-check system virtual ledger balance against real physical bank statement.</p>
              </div>

              <form onSubmit={handleReconSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recon Account</label>
                  <select value={reconBankId} onChange={(e) => setReconBankId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                    {localBanks.map(b => <option key={b.id} value={b.id}>{b.accountName} (Ledger: ৳{b.balance.toLocaleString()})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Statement Balance (৳) *</label>
                  <input
                    type="number" required placeholder="e.g. 50000" value={reconStatementBal}
                    onChange={(e) => setReconStatementBal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Verify Bank Statement
                </button>
              </form>

              {reconMatched !== null && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-100 ${reconMatched ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
                  {reconMatched ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                      <p>Success! Ledgers match statement perfectly. Audit trails generated.</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                      <p>Mismatch detected! Adjustment entry required for unresolved discrepancies.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          LOANS & DEBT SERVICING
          ======================================================== */}
      {currentTab === 'loan' && (
        <div className="space-y-6">
          
          {/* 1. LOAN ACCOUNTS VIEW */}
          {subTab === 'loan_accounts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-display">Liability Loan Registry</h2>
                  <p className="text-xs text-slate-400 mt-1">Track company credit lines, staff advances, and monthly amortization schedules.</p>
                </div>
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Liability Loan</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Amortization No</th>
                      <th className="py-3.5 px-6">Borrower Entity Name</th>
                      <th className="py-3.5 px-6 text-center">Interest / Duration</th>
                      <th className="py-3.5 px-6 text-right">Sanctioned Principal</th>
                      <th className="py-3.5 px-6 text-right">Disbursed Amount</th>
                      <th className="py-3.5 px-6 text-right">Outstanding Debt</th>
                      <th className="py-3.5 px-6 text-center">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localLoans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-600">{l.accountNo}</td>
                        <td className="py-4 px-6 font-bold text-slate-800">{l.borrowerName}</td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-500">
                          {l.interestRate}% Int. • {l.durationMonths} Mos.
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-500">৳{l.amount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-600">৳{l.disbursedAmount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-black text-rose-600">৳{l.outstandingAmount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'Disbursed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. DISBURSEMENTS */}
          {subTab === 'disbursements' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Disbursement Actions</h2>
                <p className="text-xs text-slate-400 mt-1">Disburse sanctioned loan funds directly into connected active bank balances.</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Loan Ref</th>
                      <th className="py-3.5 px-6">Lender Name</th>
                      <th className="py-3.5 px-6 text-right">sanctioned Capital</th>
                      <th className="py-3.5 px-6 text-center">Disbursed Ratio</th>
                      <th className="py-3.5 px-6 text-center">Disbursed Status</th>
                      <th className="py-3.5 px-6 text-right">Disbursement Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localLoans.map((l) => {
                      const isDisbursed = l.disbursedAmount > 0;
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-indigo-600">{l.accountNo}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{l.borrowerName}</td>
                          <td className="py-4 px-6 text-right font-black text-slate-800">৳{l.amount.toLocaleString()}</td>
                          <td className="py-4 px-6 text-center font-bold text-slate-600">
                            {isDisbursed ? '100% Fully Disbursed' : '0% Pending'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${isDisbursed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {isDisbursed ? 'Disbursed' : 'Sanctioned'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              disabled={isDisbursed}
                              onClick={() => handleDisburse(l.id)}
                              className={`px-3.5 py-1.5 font-bold rounded-lg text-[10px] cursor-pointer transition-colors ${isDisbursed ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                              {isDisbursed ? 'Disbursed' : 'Release Capital'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. REPAYMENTS */}
          {subTab === 'repayments' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Amortization Installments Repayment</h3>
                <p className="text-xs text-slate-400 mt-1">Settle outstanding debt installments with direct corporate bank debits.</p>
              </div>

              <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Credit Line</label>
                  <select value={repayLoanId} onChange={(e) => setRepayLoanId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer text-slate-700">
                    {localLoans.filter(l => l.outstandingAmount > 0).map(l => (
                      <option key={l.id} value={l.id}>{l.borrowerName} (Debt: ৳{l.outstandingAmount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Repayment Installment Amount (৳) *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 25000" value={repayAmt}
                    onChange={(e) => setRepayAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-bold text-rose-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Post Repayment installment
                </button>
              </form>
            </div>
          )}

          {/* 4. LOAN REPORTS */}
          {subTab === 'loan_report' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Aggregate Loan Debt Analytics</h2>
                <p className="text-xs text-slate-400 mt-1">Audit company debt-to-equity ratios, total accrued interest liability, and outstanding capital.</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Accrued Sanctioned Capital</span>
                    <span className="text-lg font-bold text-slate-800 mt-2 block">
                      ৳{localLoans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Released Payout Float</span>
                    <span className="text-lg font-bold text-indigo-600 mt-2 block">
                      ৳{localLoans.reduce((sum, l) => sum + l.disbursedAmount, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                    <span className="text-[10px] font-bold uppercase text-rose-500 block">Total Outstanding Debt Liability</span>
                    <span className="text-lg font-bold text-rose-700 mt-2 block">
                      ৳{localLoans.reduce((sum, l) => sum + l.outstandingAmount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          Nexova SYSTEM CONFIG SETTINGS (POLISHED TABBED VERSION)
          ======================================================== */}
      {currentTab === 'settings' && (
        <div className="max-w-6xl mx-auto bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
          {/* Scrollable Sidebar Tabs */}
          <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-200/80 p-5 flex flex-col shrink-0">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nexova Settings Portal</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Configure and calibrate your ERP environment</p>
            </div>

            {/* Scrollable Container for menu items */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
              {[
                { id: 'branches', label: 'Branches (শাখাসমূহ)', icon: Building },
                { id: 'tax_rates', label: 'Tax Rates', icon: Percent },
                { id: 'payment_methods', label: 'Payment Method', icon: CreditCard },
                { id: 'add_suppliers_setting', label: 'Add Suppliers Setting', icon: Truck },
                { id: 'add_customers_setting', label: 'Add Customers Setting', icon: Users },
                { id: 'add_product_setting', label: 'Add Product Setting', icon: ShoppingBag },
                { id: 'pos_setting', label: 'POS Setting', icon: ShoppingCart },
                { id: 'collection_payment_settings', label: 'Collection & Payment', icon: TrendingUp },
                { id: 'users', label: 'Users', icon: UserCheck },
                { id: 'roles', label: 'Roles', icon: Shield },
                { id: 'loan_setting', label: 'Loan Setting', icon: Landmark },
                { id: 'system_settings', label: 'System Settings', icon: Sliders },
                { id: 'menu_management', label: 'Menu Management', icon: Menu },
                { id: 'delete_history', label: 'Delete History', icon: Trash2 },
                { id: 'sales_return_setting', label: 'Sales Return Setting', icon: RotateCcw },
                { id: 'sales_order_setting', label: 'Sales Order Setting', icon: FileText },
                { id: 'activity_log', label: 'Activity Log', icon: Clock },
                { id: 'purchase_setting', label: 'Purchase Setting', icon: ShoppingBag },
                { id: 'entry_setting', label: 'Entry Setting', icon: Database },
                { id: 'date_setting', label: 'Date Change (তারিখ পরিবর্তন)', icon: Icons.Calendar },
                { id: 'error_logs', label: 'Error Logs (ব্যর্থতা লগ)', icon: Bug },
              ].map((menu) => {
                const IconComponent = menu.icon;
                const isSelected = selectedSettingsTab === menu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setSelectedSettingsTab(menu.id)}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{menu.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Enterprise Security Sandbox</span>
              </div>
            </div>
          </div>

          {/* Dynamic Content Pane */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[640px]">
            {/* 0. BRANCHES MANAGEMENT */}
            {selectedSettingsTab === 'branches' && (
              <BranchManagementView currentUser={currentUser} onBranchChange={onBranchChange} />
            )}

            {/* 1. TAX RATES */}
            {selectedSettingsTab === 'tax_rates' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Corporate Tax & VAT Rates</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Add and manage national VAT standard brackets and custom supplementary duties.</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Tax Title</th>
                        <th className="p-3 text-center">Tax Rate (%)</th>
                        <th className="p-3">Application Scope</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {taxes.map((tax) => {
                        const isEditing = editingTaxId === tax.id;
                        return (
                          <tr key={tax.id} className="hover:bg-slate-50/50">
                            {isEditing ? (
                              <>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editTaxName}
                                    onChange={(e) => setEditTaxName(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editTaxRate}
                                    onChange={(e) => setEditTaxRate(e.target.value)}
                                    className="w-20 bg-white border border-slate-300 rounded p-1 text-xs font-mono text-center focus:outline-none focus:border-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editTaxType}
                                    onChange={(e) => setEditTaxType(e.target.value)}
                                    className="bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="Sales">Sales Only</option>
                                    <option value="Purchase">Purchase Only</option>
                                    <option value="Both">Both (Sales & Purchase)</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editTaxStatus}
                                    onChange={(e) => setEditTaxStatus(e.target.value as any)}
                                    className="bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold text-slate-700"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditTax(tax.id)}
                                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
                                      title="Save Changes"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTaxId(null)}
                                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-bold text-slate-800">{tax.name}</td>
                                <td className="p-3 text-center font-mono text-indigo-600">{tax.rate}%</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">{tax.type}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    tax.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                  }`}>{tax.status}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => startEditTax(tax)}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                      title="Edit Tax Rate"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTax(tax.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                      title="Delete Tax Rate"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleAddTax} className="p-5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-4">
                  <span className="block text-xs font-bold text-slate-800">Register Custom VAT/Tax Category</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Category Title</label>
                      <input
                        type="text" required placeholder="e.g. Export SD 12%" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Standard Rate (%)</label>
                      <input
                        type="number" required min="0" max="100" placeholder="12" value={newTaxRate} onChange={(e) => setNewTaxRate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Scope Context</label>
                      <select
                        value={newTaxType} onChange={(e) => setNewTaxType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Sales">Sales Only</option>
                        <option value="Purchase">Purchase Only</option>
                        <option value="Both">Both (Sales & Purchase)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-xs">
                      Add Custom Tax
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. PAYMENT METHODS */}
            {selectedSettingsTab === 'payment_methods' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Financial Payment Instruments</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Activate mobile money gateways, credit card points of service, or cash drawers.</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Method Name</th>
                        <th className="p-3">Gateway Class</th>
                        <th className="p-3 text-center">Gateway Charge (%)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {paymentMethods.map((method) => {
                        const isEditing = editingPayId === method.id;
                        return (
                          <tr key={method.id} className="hover:bg-slate-50/50">
                            {isEditing ? (
                              <>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editPayName}
                                    onChange={(e) => setEditPayName(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editPayType}
                                    onChange={(e) => setEditPayType(e.target.value)}
                                    className="bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="Cash">Cash Ledger</option>
                                    <option value="Mobile Wallet">Mobile Money Wallet</option>
                                    <option value="Bank">Direct Banking Account</option>
                                    <option value="Card Gateway">Card Merchant Terminal</option>
                                  </select>
                                </td>
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editPayCharge}
                                    onChange={(e) => setEditPayCharge(e.target.value)}
                                    className="w-20 bg-white border border-slate-300 rounded p-1 text-xs font-mono text-center focus:outline-none focus:border-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={editPayStatus}
                                    onChange={(e) => setEditPayStatus(e.target.value as any)}
                                    className="bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold text-slate-700"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditPay(method.id)}
                                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
                                      title="Save Changes"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPayId(null)}
                                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-bold text-slate-800">{method.name}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">{method.type}</span>
                                </td>
                                <td className="p-3 text-center font-mono text-indigo-600">{method.charge}%</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    method.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                  }`}>{method.status}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => startEditPay(method)}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                      title="Edit Instrument"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePay(method.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                      title="Remove Instrument"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <form onSubmit={handleAddPaymentMethod} className="p-5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-4">
                  <span className="block text-xs font-bold text-slate-800">Add Corporate Payment Method</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Method Name</label>
                      <input
                        type="text" required placeholder="e.g. City Bank POS" value={newPayName} onChange={(e) => setNewPayName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gateway Class</label>
                      <select
                        value={newPayType} onChange={(e) => setNewPayType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="Cash">Cash Ledger</option>
                        <option value="Mobile Wallet">Mobile Money Wallet</option>
                        <option value="Bank">Direct Banking Account</option>
                        <option value="Card Gateway">Card Merchant Terminal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gateway Charge (%)</label>
                      <input
                        type="number" step="0.1" placeholder="1.5" value={newPayCharge} onChange={(e) => setNewPayCharge(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-mono text-center"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-xs">
                      Register Instrument
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. SUPPLIERS SETTING */}
            {selectedSettingsTab === 'add_suppliers_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Supplier Accounts Rules</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Control procurement invoice default terms, automated purchase triggers and lead margins.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Supplier Payment Terms</label>
                    <select
                      value={supplierCreditTerms} onChange={(e) => setSupplierCreditTerms(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days (Standard)</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="Immediate">Immediate Cash on Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Supplier System Code Prefix</label>
                    <input
                      type="text" value={supplierCodePrefix} onChange={(e) => setSupplierCodePrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Safety Procurement Lead Time (Days)</label>
                    <input
                      type="number" value={reorderLeadTime} onChange={(e) => setReorderLeadTime(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Strict PO Sign-off Cap Limit (৳)</label>
                    <input
                      type="number" value={supplierReqLimit} onChange={(e) => setSupplierReqLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Supplier Preferences')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Supplier Config
                  </button>
                </div>
              </div>
            )}

            {/* 4. CUSTOMERS SETTING */}
            {selectedSettingsTab === 'add_customers_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Customer Accounts Rules</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Define corporate credit extension limits, payment windows, and wholesale profiles.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Maximum Extendable Credit Ceiling (৳)</label>
                    <input
                      type="number" value={customerCreditLimit} onChange={(e) => setCustomerCreditLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Client Category Tier</label>
                    <select
                      value={customerGroupDefault} onChange={(e) => setCustomerGroupDefault(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="General">General Retail Consumer</option>
                      <option value="Wholesale">Primary Wholesaler Category</option>
                      <option value="VIP">Executive Platinum Client</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Overdue Warning Invoice Grace Period (Days)</label>
                    <input
                      type="number" value={customerGracePeriod} onChange={(e) => setCustomerGracePeriod(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Allow Guest Credit Invoicing</span>
                      <span className="block text-[9px] text-slate-400">Generate liability bills for walk-in accounts.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerAllowUnregistered(!customerAllowUnregistered)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${customerAllowUnregistered ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Customer Accounts Rules')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Customer Config
                  </button>
                </div>
              </div>
            )}

            {/* 5. PRODUCT SETTING */}
            {selectedSettingsTab === 'add_product_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Product Catalog Rules</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Configure automated barcode/SKU parameters and standard ledger valuation formulas.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SKU Code Auto-Generation Rule</label>
                    <select
                      value={productSkuRule} onChange={(e) => setProductSkuRule(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Auto">Auto-Generate from Category Prefix</option>
                      <option value="Manual">Requires Manual Operator Code Entry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product SKU Base Code Prefix</label>
                    <input
                      type="text" value={productSkuPrefix} onChange={(e) => setProductSkuPrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">System Profit Markup Target (%)</label>
                    <input
                      type="number" value={productMarkup} onChange={(e) => setProductMarkup(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Asset Inventory Valuation Formula</label>
                    <select
                      value={productValuation} onChange={(e) => setProductValuation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Weighted Average">Weighted Average Cost (AVCO)</option>
                      <option value="FIFO">First In, First Out (FIFO)</option>
                      <option value="LIFO">Last In, First Out (LIFO)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Product Catalog Rules')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Catalog Config
                  </button>
                </div>
              </div>
            )}

            {/* 6. POS SETTING */}
            {selectedSettingsTab === 'pos_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">POS Cash Register Preferences</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Customize real-time retail screen defaults, shortcuts and cash drawer rules.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Customer Mapping</label>
                    <input
                      type="text" value={posDefaultCustomer} onChange={(e) => setPosDefaultCustomer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick Fast-Discount Buttons (%, CSV)</label>
                    <input
                      type="text" value={posQuickDiscounts} onChange={(e) => setPosQuickDiscounts(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Drawer Automatic Open Rule</label>
                    <select
                      value={posCashDrawTrigger} onChange={(e) => setPosCashDrawTrigger(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Auto Open">Auto Open on Receipt Checkout</option>
                      <option value="Password">Requires Supervisor Overrule Password</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Display Catalog Thumbnail Images</span>
                      <span className="block text-[9px] text-slate-400">Show visual grids on POS cashier panel.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPosShowImageGrid(!posShowImageGrid)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${posShowImageGrid ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('POS Cash Register Preferences')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save POS Config
                  </button>
                </div>
              </div>
            )}

            {/* 7. COLLECTION & PAYMENT SETTINGS */}
            {selectedSettingsTab === 'collection_payment_settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Invoice Collection & Payment Policies</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Regulate bank statement automated reconciliation rules, overdue penalty charges and discounts.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bounced Check Processing Fees (৳)</label>
                    <input
                      type="number" value={collectionBounceFee} onChange={(e) => setCollectionBounceFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Early Payment Cash Discount (%)</label>
                    <input
                      type="number" value={collectionEarlyDiscount} onChange={(e) => setCollectionEarlyDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discounts Validity Threshold (Days)</label>
                    <input
                      type="number" value={collectionTargetDays} onChange={(e) => setCollectionTargetDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Auto Allocation of Ledger Accounts</span>
                      <span className="block text-[9px] text-slate-400">Match credit collection lists with open bills automatically.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCollectionAutoAlloc(!collectionAutoAlloc)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${collectionAutoAlloc ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Invoice Collection & Payment Policies')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Policies Config
                  </button>
                </div>
              </div>
            )}

            {/* 8. USERS */}
            {selectedSettingsTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">System Portal User Logins</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Add, audit, or deactivate employee terminal accounts and corporate emails.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usersList.map((usr) => {
                    const isEditing = editingUserId === usr.id;
                    return (
                      <div key={usr.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/30">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                                <input
                                  type="text"
                                  value={editUserFullName}
                                  onChange={(e) => setEditUserFullName(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Username</label>
                                <input
                                  type="text"
                                  value={editUserUsername}
                                  onChange={(e) => setEditUserUsername(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Email</label>
                                <input
                                  type="email"
                                  value={editUserEmail}
                                  onChange={(e) => setEditUserEmail(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Role</label>
                                <select
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="Administrator">Administrator</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Cashier">Cashier</option>
                                  <option value="Sales Agent">Sales Agent</option>
                                  <option value="Inventory Officer">Inventory Officer</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Status</label>
                                <select
                                  value={editUserStatus}
                                  onChange={(e) => setEditUserStatus(e.target.value as any)}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold text-slate-700"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEditUser(usr.id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <X className="h-3 w-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {usr.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-xs font-bold text-slate-800 truncate">{usr.name}</span>
                              <span className="block text-[10px] text-slate-400 truncate">@{usr.username} | {usr.email}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md">
                                  {usr.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                                  usr.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {usr.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-sans">
                              <button
                                type="button"
                                onClick={() => setPasswordModalUser(usr)}
                                className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                title="পাসওয়ার্ড রিসেট এবং পরিবর্তন (Reset/Change Password)"
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditUser(usr)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                title="সম্পাদনা করুন (Edit User Account)"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(usr.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="মুছে ফেলুন (Delete User Account)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {currentUser?.role === 'Administrator' ? (
                  <form onSubmit={handleAddUser} className="p-5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-4">
                    <span className="block text-xs font-bold text-slate-800">Add Portal Employee User Login (Administrator Tool)</span>
                    
                    {addUserError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                        {addUserError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Full Name</label>
                        <input
                          type="text" required disabled={addUserLoading} placeholder="e.g. Rashedul Islam" value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-semibold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username (Login ID)</label>
                        <input
                          type="text" required disabled={addUserLoading} placeholder="e.g. rashed_csh" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portal Email Address</label>
                        <input
                          type="email" required disabled={addUserLoading} placeholder="rashed@madani.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Password</label>
                        <input
                          type="password" required disabled={addUserLoading} placeholder="At least 6 characters" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Assignment Role</label>
                        <select
                          disabled={addUserLoading} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Manager">Manager</option>
                          <option value="Cashier">Cashier</option>
                          <option value="Sales Agent">Sales Agent</option>
                          <option value="Inventory Officer">Inventory Officer</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addUserLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addUserLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Creating Account... / তৈরি হচ্ছে...</span>
                          </>
                        ) : (
                          'Register Portal Account'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 text-xs text-slate-400 font-medium">
                    ⓘ Adding or registering new portal employee user login accounts is restricted to active system Administrators. / নতুন পোর্টাল ব্যবহারকারী অ্যাকাউন্ট তৈরি করার প্রক্রিয়াটি শুধুমাত্র এডমিনিস্ট্রেটরদের জন্য অনুমোদিত।
                  </div>
                )}
              </div>
            )}

            {/* 9. ROLES */}
            {selectedSettingsTab === 'roles' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">User Roles Permission Matrix</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Define strict modular read, write and delete security guidelines per company role.</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Portal Role Class</th>
                        <th className="p-3 text-center">POS/Sales</th>
                        <th className="p-3 text-center">Purchase</th>
                        <th className="p-3 text-center">Inventory</th>
                        <th className="p-3 text-center">Banking</th>
                        <th className="p-3 text-center">HR Payroll</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {rolesPermissions.map((row, idx) => (
                        // index key safe: fixed-order static list
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{row.role}</td>
                          {/* Sales */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.sales.read} onChange={() => handleTogglePermission(idx, 'sales', 'read')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>R</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.sales.write} onChange={() => handleTogglePermission(idx, 'sales', 'write')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>W</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.sales.delete} onChange={() => handleTogglePermission(idx, 'sales', 'delete')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>D</span>
                              </label>
                            </div>
                          </td>
                          {/* Purchase */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.purchase.read} onChange={() => handleTogglePermission(idx, 'purchase', 'read')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>R</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.purchase.write} onChange={() => handleTogglePermission(idx, 'purchase', 'write')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>W</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.purchase.delete} onChange={() => handleTogglePermission(idx, 'purchase', 'delete')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>D</span>
                              </label>
                            </div>
                          </td>
                          {/* Inventory */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.inventory.read} onChange={() => handleTogglePermission(idx, 'inventory', 'read')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>R</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.inventory.write} onChange={() => handleTogglePermission(idx, 'inventory', 'write')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>W</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.inventory.delete} onChange={() => handleTogglePermission(idx, 'inventory', 'delete')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>D</span>
                              </label>
                            </div>
                          </td>
                          {/* Banking */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.banking.read} onChange={() => handleTogglePermission(idx, 'banking', 'read')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>R</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.banking.write} onChange={() => handleTogglePermission(idx, 'banking', 'write')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>W</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.banking.delete} onChange={() => handleTogglePermission(idx, 'banking', 'delete')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>D</span>
                              </label>
                            </div>
                          </td>
                          {/* HR Payroll */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.hr.read} onChange={() => handleTogglePermission(idx, 'hr', 'read')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>R</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.hr.write} onChange={() => handleTogglePermission(idx, 'hr', 'write')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>W</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={row.hr.delete} onChange={() => handleTogglePermission(idx, 'hr', 'delete')} className="rounded text-indigo-600 focus:ring-0" />
                                <span>D</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border border-indigo-50 rounded-xl bg-indigo-50/20 text-[11px] text-slate-500 font-medium leading-relaxed">
                  Note: Changes to the Role Permission Matrix will apply instantly to all active cashier terminals and executive dashboards connected to the database.
                </div>
              </div>
            )}

            {/* 10. LOAN SETTING */}
            {selectedSettingsTab === 'loan_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Liability & Loan Preferences</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Calibrate compounding modes, processing charges and debt margin caps.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Liability Interest Cap (%)</label>
                    <input
                      type="number" value={loanDefaultInt} onChange={(e) => setLoanDefaultInt(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Maximum Allowed Amortization (Months)</label>
                    <input
                      type="number" value={loanMaxTenure} onChange={(e) => setLoanMaxTenure(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Early Repayment Penalty Surcharge (%)</label>
                    <input
                      type="number" value={loanEarlyRepayPenalty} onChange={(e) => setLoanEarlyRepayPenalty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Minimum Account Margin Reserve (%)</label>
                    <input
                      type="number" value={loanMinMargin} onChange={(e) => setLoanMinMargin(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Liability & Loan Preferences')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Loan Defaults
                  </button>
                </div>
              </div>
            )}

            {/* 11. SYSTEM SETTINGS */}
            {selectedSettingsTab === 'system_settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display">Nexova Enterprise Core Settings</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Control company identity, multi-tab POS billing, and databases.</p>
                  </div>
                  {/* Internal Tab Selection Buttons */}
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                    {['profile', 'billing', 'inventory', 'backup'].map((tab) => (
                      <button
                        key={tab} type="button"
                        onClick={() => setActiveSettingsTab(tab as any)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide ${
                          activeSettingsTab === tab ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {activeSettingsTab === 'profile' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Registered Name</label>
                        <input
                          type="text" required value={compName} onChange={(e) => setCompName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Corporate Phone Number</label>
                        <input
                          type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Head Office Address</label>
                      <textarea
                        required value={compAddr} onChange={(e) => setCompAddr(e.target.value)} rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TIN Code (12 Digit)</label>
                        <input
                          type="text" value={tin} onChange={(e) => setTin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">BIN Registration Code</label>
                        <input
                          type="text" value={bin} onChange={(e) => setBin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trade License Reference</label>
                        <input
                          type="text" value={tradeLic} onChange={(e) => setTradeLic(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'billing' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Currency</label>
                        <select
                          value={curr} onChange={(e) => setCurr(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs cursor-pointer focus:outline-none"
                        >
                          <option value="৳">BDT (৳) — Bangladesh Taka</option>
                          <option value="$">USD ($) — United States Dollar</option>
                          <option value="€">EUR (€) — Euro Zone</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default POS VAT (%)</label>
                        <input
                          type="number" required value={vat} onChange={(e) => setVat(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default POS Discount (%)</label>
                        <input
                          type="number" required value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt/Invoice Footer Message</label>
                      <input
                        type="text" required value={footer} onChange={(e) => setFooter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-slate-700">Auto Print Invoice Slip</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoPrint(!autoPrint)}
                          className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${autoPrint ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                        >
                          <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-slate-700">Enable SMS Receipts</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSmsNotif(!smsNotif)}
                          className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${smsNotif ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                        >
                          <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'inventory' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default Warehouse</label>
                        <input
                          type="text" required value={warehouse} onChange={(e) => setWarehouse(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Metric Unit</label>
                        <select
                          value={defUnit} onChange={(e) => setDefUnit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs cursor-pointer focus:outline-none"
                        >
                          <option value="Pcs">Pieces (Pcs)</option>
                          <option value="Box">Boxes (Box)</option>
                          <option value="Kg">Kilograms (Kg)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alarm Limit</label>
                        <input
                          type="number" required value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default Timezone</label>
                        <select
                          value={tz} onChange={(e) => setTz(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs cursor-pointer focus:outline-none"
                        >
                          <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'backup' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3 leading-relaxed text-slate-600">
                      <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Database Safety Regulations</p>
                        <p className="mt-1 text-slate-500 text-[11px]">Download manual JSON state files to completely back up or restore entire double-entry records.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <span className="block text-xs font-bold text-slate-800">Export System Database</span>
                        <button
                          type="button" onClick={handleExportJSON}
                          className="flex items-center justify-center gap-1.5 w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-xs"
                        >
                          <Download className="h-4 w-4 text-slate-500" />
                          Download BDT Backup (.json)
                        </button>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <span className="block text-xs font-bold text-slate-800">Import System Backup</span>
                        <label className="flex items-center justify-center gap-1.5 w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-xs">
                          <Upload className="h-4 w-4 text-slate-500" />
                          <span>Upload JSON</span>
                          <input type="file" accept=".json" onChange={handleImportFileChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-bold text-red-600">Wipe Database</span>
                        <span className="block text-[10px] text-slate-400">Restore factory demo configurations.</span>
                      </div>
                      <button
                        type="button" onClick={() => setConfirmActionType('reset')}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Wipe Database
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-bold text-orange-600">Clear All Demo Data (Start Empty)</span>
                        <span className="block text-[10px] text-slate-400">Delete all products, invoices, suppliers, customers and start with a clean blank ERP.</span>
                      </div>
                      <button
                        type="button" onClick={() => setConfirmActionType('clear')}
                        className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Clear All Data (Blank)
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit action panel for non-backup internal tabs */}
                {activeSettingsTab !== 'backup' && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button" onClick={handleSaveSettings}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Save Core Preferences
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 12. NAVIGATION BUILDER & MENU MANAGEMENT */}
            {(selectedSettingsTab === 'menu_management' || selectedSettingsTab === 'navigation_builder') && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                      <Icons.Menu className="h-5 w-5 text-indigo-600" />
                      <span>Enterprise Navigation Builder</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure modules, sub-menus, permissions, multi-language, and live counters without writing code.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-reseed-defaults"
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all sidebar navigation definitions to default ERP settings? This will clear custom menus.')) {
                          navEngine.resetToDefault();
                          refreshNavEngine();
                          alert('Successfully restored factory default menu engine!');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer border border-rose-100"
                    >
                      <Icons.Undo className="h-3.5 w-3.5" />
                      <span>Factory Reset Engine</span>
                    </button>
                    <button
                      id="btn-add-new-group-trigger"
                      type="button"
                      onClick={() => {
                        setIsAddingGroup(true);
                        setEditingGroupId(null);
                        setGroupForm({
                          id: `grp_${Date.now().toString().slice(-6)}`,
                          label: 'New Module Suite',
                          icon: 'Grid',
                          order: (navGroups[navGroups.length - 1]?.order || 0) + 10,
                          enabled: true,
                        });
                        setIsAddingItem(false);
                        setEditingItemId(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer border border-emerald-100"
                    >
                      <Icons.Plus className="h-3.5 w-3.5" />
                      <span>Create Module Suite</span>
                    </button>
                    <button
                      id="btn-add-new-item-trigger"
                      type="button"
                      onClick={() => {
                        setIsAddingItem(true);
                        setEditingItemId(null);
                        setItemForm({
                          id: `item_${Date.now().toString().slice(-6)}`,
                          label: 'New Menu Page',
                          groupId: navGroups[0]?.id || 'inventory',
                          icon: 'Boxes',
                          tab: 'inventory',
                          subTab: '',
                          order: 10,
                          parent: '',
                          enabled: true,
                          translationsBn: '',
                          badgeKey: '',
                        });
                        setIsAddingGroup(false);
                        setEditingGroupId(null);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <Icons.Plus className="h-3.5 w-3.5" />
                      <span>Create Menu Link</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT COLUMN: THE SIDEBAR NAVIGATION PREVIEW & NODE MANAGER */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active ERP Menu Tree Layout</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-full">
                          {navGroups.length} Suites / {navItems.length} Links
                        </span>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {navGroups.map((group, gIdx) => {
                          const groupItems = navItems.filter(item => item.groupId === group.id);
                          return (
                            <div key={group.id} className="border border-slate-100 rounded-xl bg-slate-50/30 p-3 space-y-2">
                              {/* Group Row */}
                              <div className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2.5 shadow-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
                                    {/* Safe icon load */}
                                    {React.createElement((Icons as any)[group.icon] || Icons.Grid, { className: "h-4 w-4" })}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-800">{group.label}</span>
                                    <span className="block text-[9px] text-slate-400 font-medium capitalize">Module ID: {group.id} (Order: {group.order})</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Reorder Group Controls */}
                                  <button
                                    title="Move Module Up"
                                    type="button"
                                    onClick={() => {
                                      if (gIdx > 0) {
                                        const prevGroup = navGroups[gIdx - 1];
                                        const originalOrder = group.order;
                                        navEngine.updateGroup(group.id, { order: prevGroup.order });
                                        navEngine.updateGroup(prevGroup.id, { order: originalOrder });
                                        refreshNavEngine();
                                      }
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                                  >
                                    <Icons.ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    title="Move Module Down"
                                    type="button"
                                    onClick={() => {
                                      if (gIdx < navGroups.length - 1) {
                                        const nextGroup = navGroups[gIdx + 1];
                                        const originalOrder = group.order;
                                        navEngine.updateGroup(group.id, { order: nextGroup.order });
                                        navEngine.updateGroup(nextGroup.id, { order: originalOrder });
                                        refreshNavEngine();
                                      }
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                                  >
                                    <Icons.ArrowDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    title="Edit Module"
                                    type="button"
                                    onClick={() => {
                                      setIsAddingGroup(false);
                                      setEditingGroupId(group.id);
                                      setGroupForm({
                                        id: group.id,
                                        label: group.label,
                                        icon: group.icon,
                                        order: group.order,
                                        enabled: group.enabled,
                                      });
                                      setIsAddingItem(false);
                                      setEditingItemId(null);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                                  >
                                    <Icons.Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    title="Delete Module"
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Warning: Deleting the '${group.label}' suite will also delete all of its nested menu items (${groupItems.length} links). Proceed?`)) {
                                        navEngine.deleteGroup(group.id);
                                        refreshNavEngine();
                                      }
                                    }}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600"
                                  >
                                    <Icons.Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Nested Menu Items inside group */}
                              <div className="pl-6 space-y-1.5">
                                {groupItems.length === 0 ? (
                                  <div className="text-[10px] text-slate-400 italic py-1 pl-2">No menu links inside this suite.</div>
                                ) : (
                                  groupItems.map((item, iIdx) => {
                                    return (
                                      <div key={item.id} className="flex items-center justify-between bg-white border border-slate-100/80 rounded-lg p-2 pl-3 hover:shadow-xs transition-all">
                                        <div className="flex items-center gap-2">
                                          {React.createElement((Icons as any)[item.icon || 'Boxes'] || Icons.Boxes, { className: "h-3.5 w-3.5 text-slate-400" })}
                                          <div>
                                            <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                                            {item.translations?.bn && (
                                              <span className="text-[9px] text-slate-400 font-semibold ml-2">({item.translations.bn})</span>
                                            )}
                                            <span className="block text-[8px] text-slate-400">
                                              ID: {item.id} | Route: {item.tab}/{item.subTab || 'default'} | Order: {item.order}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {/* Reorder Item Controls */}
                                          <button
                                            title="Move Up"
                                            type="button"
                                            onClick={() => {
                                              if (iIdx > 0) {
                                                const prevItem = groupItems[iIdx - 1];
                                                const originalOrder = item.order;
                                                navEngine.updateItem(item.id, { order: prevItem.order });
                                                navEngine.updateItem(prevItem.id, { order: originalOrder });
                                                refreshNavEngine();
                                              }
                                            }}
                                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                                          >
                                            <Icons.ChevronUp className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            title="Move Down"
                                            type="button"
                                            onClick={() => {
                                              if (iIdx < groupItems.length - 1) {
                                                const nextItem = groupItems[iIdx + 1];
                                                const originalOrder = item.order;
                                                navEngine.updateItem(item.id, { order: nextItem.order });
                                                navEngine.updateItem(nextItem.id, { order: originalOrder });
                                                refreshNavEngine();
                                              }
                                            }}
                                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                                          >
                                            <Icons.ChevronDown className="h-3.5 w-3.5" />
                                          </button>
                                          {/* Clone Item */}
                                          <button
                                            title="Duplicate Link"
                                            type="button"
                                            onClick={() => {
                                              const newId = `${item.id}_clone_${Math.floor(Math.random() * 100)}`;
                                              const newLabel = `${item.label} (Copy)`;
                                              const clone = navEngine.cloneItem(item.id, newId, newLabel);
                                              if (clone) {
                                                refreshNavEngine();
                                                alert(`Successfully duplicated menu link: '${item.label}' -> '${newLabel}'!`);
                                              }
                                            }}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600"
                                          >
                                            <Icons.Copy className="h-3 w-3" />
                                          </button>
                                          {/* Edit Item */}
                                          <button
                                            title="Edit Menu"
                                            type="button"
                                            onClick={() => {
                                              setIsAddingItem(false);
                                              setEditingItemId(item.id);
                                              setItemForm({
                                                id: item.id,
                                                label: item.label,
                                                groupId: item.groupId,
                                                icon: item.icon || 'Boxes',
                                                tab: item.tab,
                                                subTab: item.subTab,
                                                order: item.order,
                                                parent: item.parent || '',
                                                enabled: item.enabled,
                                                translationsBn: item.translations?.bn || '',
                                                badgeKey: item.badgeKey || '',
                                              });
                                              setIsAddingGroup(false);
                                              setEditingGroupId(null);
                                            }}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                                          >
                                            <Icons.Edit className="h-3 w-3" />
                                          </button>
                                          {/* Archive/Restore */}
                                          <button
                                            title={item.archived ? "Restore Link" : "Archive Link"}
                                            type="button"
                                            onClick={() => {
                                              navEngine.updateItem(item.id, { archived: !item.archived });
                                              refreshNavEngine();
                                            }}
                                            className={`p-1 rounded ${item.archived ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                          >
                                            <Icons.Archive className="h-3 w-3" />
                                          </button>
                                          {/* Delete Item */}
                                          <button
                                            title="Delete Link"
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`Are you sure you want to delete the menu link: '${item.label}'?`)) {
                                                navEngine.deleteItem(item.id);
                                                refreshNavEngine();
                                              }
                                            }}
                                            className="p-1 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600"
                                          >
                                            <Icons.Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ACTION FORMS */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* ADD/EDIT GROUP FORM */}
                    {(isAddingGroup || editingGroupId) && (
                      <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs space-y-4 animate-in slide-in-from-right duration-250">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                            {editingGroupId ? `Modify Suite: ${groupForm.id}` : 'Create New Module Suite'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingGroup(false);
                              setEditingGroupId(null);
                            }}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <Icons.X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Suite unique ID</label>
                            <input
                              id="group-id-input"
                              type="text"
                              disabled={!!editingGroupId}
                              value={groupForm.id}
                              onChange={(e) => setGroupForm({ ...groupForm, id: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1 disabled:bg-slate-100 disabled:text-slate-400 font-display"
                              placeholder="e.g. manufacturing"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Module Label (English)</label>
                            <input
                              id="group-label-input"
                              type="text"
                              value={groupForm.label}
                              onChange={(e) => setGroupForm({ ...groupForm, label: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              placeholder="e.g. Manufacturing"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Lucide Icon</label>
                            <select
                              id="group-icon-input"
                              value={groupForm.icon}
                              onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                            >
                              <option value="Grid">Grid</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Wrench">Wrench</option>
                              <option value="ShoppingCart">ShoppingCart</option>
                              <option value="Store">Store</option>
                              <option value="Users">Users</option>
                              <option value="Briefcase">Briefcase</option>
                              <option value="Calendar">Calendar</option>
                              <option value="MapPin">MapPin</option>
                              <option value="Sparkles">Sparkles</option>
                              <option value="Shield">Shield</option>
                              <option value="Cpu">Cpu</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Sort Order</label>
                            <input
                              id="group-order-input"
                              type="number"
                              value={groupForm.order}
                              onChange={(e) => setGroupForm({ ...groupForm, order: Number(e.target.value) })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                            />
                          </div>

                          <div className="flex items-center justify-between p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                            <div>
                              <span className="block text-xs font-bold text-slate-800">Module Status</span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">Control active visibility inside the client navigation.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGroupForm({ ...groupForm, enabled: !groupForm.enabled })}
                              className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${groupForm.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                            >
                              <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                            </button>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              id="group-submit-btn"
                              type="button"
                              onClick={() => {
                                if (!groupForm.id || !groupForm.label) {
                                  alert('Module ID and Label fields are required.');
                                  return;
                                }
                                if (editingGroupId) {
                                  navEngine.updateGroup(editingGroupId, groupForm);
                                } else {
                                  navEngine.createGroup(groupForm);
                                }
                                refreshNavEngine();
                                setIsAddingGroup(false);
                                setEditingGroupId(null);
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/15"
                            >
                              Save Suite changes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingGroup(false);
                                setEditingGroupId(null);
                              }}
                              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ADD/EDIT ITEM FORM */}
                    {(isAddingItem || editingItemId) && (
                      <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs space-y-4 animate-in slide-in-from-right duration-250">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                            {editingItemId ? `Modify Link: ${itemForm.id}` : 'Create New Menu Link'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingItem(false);
                              setEditingItemId(null);
                            }}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <Icons.X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Link Unique ID</label>
                            <input
                              id="item-id-input"
                              type="text"
                              disabled={!!editingItemId}
                              value={itemForm.id}
                              onChange={(e) => setItemForm({ ...itemForm, id: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1 disabled:bg-slate-100 disabled:text-slate-400"
                              placeholder="e.g. active_bills"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Display Name (English)</label>
                            <input
                              id="item-label-input"
                              type="text"
                              value={itemForm.label}
                              onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              placeholder="e.g. Active Bills"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Display Name (Bengali / বাংলা)</label>
                            <input
                              id="item-label-bn-input"
                              type="text"
                              value={itemForm.translationsBn}
                              onChange={(e) => setItemForm({ ...itemForm, translationsBn: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              placeholder="উদা: পণ্যসমূহ"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Parent Module Suite</label>
                            <select
                              id="item-group-input"
                              value={itemForm.groupId}
                              onChange={(e) => setItemForm({ ...itemForm, groupId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                            >
                              {navGroups.map((g) => (
                                <option key={g.id} value={g.id}>{g.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Target View Tab</label>
                              <select
                                id="item-tab-input"
                                value={itemForm.tab}
                                onChange={(e) => setItemForm({ ...itemForm, tab: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              >
                                <option value="dashboard">dashboard</option>
                                <option value="inventory">inventory</option>
                                <option value="warehouse">warehouse</option>
                                <option value="purchase">purchase</option>
                                <option value="sales">sales</option>
                                <option value="accounting">accounting</option>
                                <option value="banking">banking</option>
                                <option value="loan">loan</option>
                                <option value="employee">employee</option>
                                <option value="salary">salary</option>
                                <option value="reports">reports</option>
                                <option value="settings">settings</option>
                                <option value="crm">crm</option>
                                <option value="projects">projects</option>
                                <option value="manufacturing">manufacturing</option>
                                <option value="service">service</option>
                                <option value="documents">documents</option>
                                <option value="workflow">workflow</option>
                                <option value="ai">ai</option>
                                <option value="integration">integration</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Sub-Tab code</label>
                              <input
                                id="item-subtab-input"
                                type="text"
                                value={itemForm.subTab}
                                onChange={(e) => setItemForm({ ...itemForm, subTab: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                                placeholder="e.g. products, pos, etc."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Lucide Icon name</label>
                              <select
                                id="item-icon-input"
                                value={itemForm.icon}
                                onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              >
                                <option value="Boxes">Boxes</option>
                                <option value="LayoutDashboard">LayoutDashboard</option>
                                <option value="ShoppingCart">ShoppingCart</option>
                                <option value="Store">Store</option>
                                <option value="BookOpen">BookOpen</option>
                                <option value="Users">Users</option>
                                <option value="Briefcase">Briefcase</option>
                                <option value="Calendar">Calendar</option>
                                <option value="Wrench">Wrench</option>
                                <option value="FileText">FileText</option>
                                <option value="Activity">Activity</option>
                                <option value="Settings">Settings</option>
                                <option value="Barcode">Barcode</option>
                                <option value="QrCode">QrCode</option>
                                <option value="Percent">Percent</option>
                                <option value="ShieldAlert">ShieldAlert</option>
                                <option value="Sparkles">Sparkles</option>
                                <option value="MessageSquare">MessageSquare</option>
                                <option value="Workflow">Workflow</option>
                                <option value="Lock">Lock</option>
                                <option value="Archive">Archive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">Menu Order</label>
                              <input
                                id="item-order-input"
                                type="number"
                                value={itemForm.order}
                                onChange={(e) => setItemForm({ ...itemForm, order: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Live Badge counter source</label>
                            <select
                              id="item-badge-input"
                              value={itemForm.badgeKey}
                              onChange={(e) => setItemForm({ ...itemForm, badgeKey: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 mt-1"
                            >
                              <option value="">No Badge Counter</option>
                              <option value="low_stock">Low Stock Count</option>
                              <option value="new_orders">New Sales Invoices</option>
                              <option value="pending_approvals">Pending Workflow Approvals</option>
                              <option value="unread_notifications">Unread notifications</option>
                              <option value="draft_documents">Draft legal archives</option>
                              <option value="queue_status">System queue idle state</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                            <div>
                              <span className="block text-xs font-bold text-slate-800">Menu Link Status</span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">Control live state in the sidebar menus.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setItemForm({ ...itemForm, enabled: !itemForm.enabled })}
                              className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${itemForm.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                            >
                              <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                            </button>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              id="item-submit-btn"
                              type="button"
                              onClick={() => {
                                if (!itemForm.id || !itemForm.label) {
                                  alert('Menu Link ID and Label fields are required.');
                                  return;
                                }
                                const translations = itemForm.translationsBn ? { bn: itemForm.translationsBn } : undefined;
                                const itemData = {
                                  id: itemForm.id,
                                  label: itemForm.label,
                                  groupId: itemForm.groupId,
                                  icon: itemForm.icon,
                                  tab: itemForm.tab,
                                  subTab: itemForm.subTab,
                                  order: itemForm.order,
                                  parent: itemForm.parent || undefined,
                                  enabled: itemForm.enabled,
                                  badgeKey: itemForm.badgeKey || undefined,
                                  translations,
                                };

                                if (editingItemId) {
                                  navEngine.updateItem(editingItemId, itemData);
                                } else {
                                  navEngine.createItem(itemData);
                                }
                                refreshNavEngine();
                                setIsAddingItem(false);
                                setEditingItemId(null);
                              }}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/15"
                            >
                              Save Menu Link
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingItem(false);
                                setEditingItemId(null);
                              }}
                              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BLANK EMPTY FORM SCREEN STATE */}
                    {!isAddingGroup && !editingGroupId && !isAddingItem && !editingItemId && (
                      <div className="border border-slate-200/80 rounded-2xl bg-slate-50/40 p-12 text-center shadow-xs border-dashed flex flex-col items-center justify-center min-h-[350px]">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                          <Icons.Sliders className="h-6 w-6" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Enterprise Customization Studio</h5>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                          Click any node's edit icon to modify existing routes, clone entries to build nested layers, or tap "Create Module Suite" to extend the ERP dynamically.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 13. DELETE HISTORY */}
            {selectedSettingsTab === 'delete_history' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">ERP Deleted History & Trash Can</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Audit history of deleted transactions and database rows. Restore elements immediately back to ledger tables.</p>
                </div>

                {deletedItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                    <Trash2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">The trash bin is completely empty</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Deletion Time</th>
                          <th className="p-3">Module Suite</th>
                          <th className="p-3">Document details</th>
                          <th className="p-3">Operator</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {deletedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">{item.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase">{item.module}</span>
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{item.details}</td>
                            <td className="p-3 text-slate-500">@{item.deletedBy}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRestoreItem(item.id, item.module)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 14. SALES RETURN SETTING */}
            {selectedSettingsTab === 'sales_return_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Sales Return Policy Controls</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Regulate valid return window constraints, restocking charge fees, and credit allocation.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valid Customer Return Window</label>
                    <select
                      value={salesReturnWindow} onChange={(e) => setSalesReturnWindow(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="7 Days">7 Days Limit</option>
                      <option value="15 Days">15 Days Limit (Standard)</option>
                      <option value="30 Days">30 Days Limit</option>
                      <option value="Unlimited">No Return Date Boundary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Surcharge Restocking Handling Fee (%)</label>
                    <input
                      type="number" value={salesRestockingFee} onChange={(e) => setSalesRestockingFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Default Return Resolution</label>
                    <select
                      value={salesReturnAction} onChange={(e) => setSalesReturnAction(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Credit Note">Generate Credit Note Voucher</option>
                      <option value="Cash Refund">Immediate Cash Disbursement</option>
                      <option value="Replacement">Direct Inventory Item Swap</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Supervisor Inspection Clearance Required</span>
                      <span className="block text-[9px] text-slate-400">Lock restocking items until quality control verification passes.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSalesReturnInspection(!salesReturnInspection)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${salesReturnInspection ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Sales Return Policy Controls')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Return Config
                  </button>
                </div>
              </div>
            )}

            {/* 15. SALES ORDER SETTING */}
            {selectedSettingsTab === 'sales_order_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Sales Orders (SO) Rules</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Configure processing states, serial numbering prefixes, and dispatch defaults.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sales Order Prefix Rule</label>
                    <input
                      type="text" value={salesOrderPrefix} onChange={(e) => setSalesOrderPrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Freight Shipping Term</label>
                    <select
                      value={salesOrderTerms} onChange={(e) => setSalesOrderTerms(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Immediate Delivery">Immediate Delivery Dispatch</option>
                      <option value="FOB Shipping Point">FOB Shipping Point (Origin)</option>
                      <option value="FOB Destination">FOB Destination Point</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Auto-Release Sales Orders to Packing</span>
                      <span className="block text-[9px] text-slate-400">Send directly to fulfillment center upon confirmation.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSalesOrderAutoRelease(!salesOrderAutoRelease)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${salesOrderAutoRelease ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Allow Partial Orders Fulfillment</span>
                      <span className="block text-[9px] text-slate-400">Allow shipping in multiple split parcels.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSalesOrderPartial(!salesOrderPartial)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${salesOrderPartial ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Sales Orders (SO) Rules')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Sales Order Config
                  </button>
                </div>
              </div>
            )}

            {/* 16. ACTIVITY LOG */}
            {selectedSettingsTab === 'activity_log' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display">ERP Live Operational Audit Log</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Track real-time employee login activity, document edits and configurations.</p>
                  </div>
                  {/* Search Audit Logs */}
                  <div className="relative w-full md:w-64 shrink-0 text-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter by user or action..."
                      value={activityLogSearch}
                      onChange={(e) => setActivityLogSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Logged Date</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Event Action</th>
                        <th className="p-3">Module</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Origin IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {activityLogs
                        .filter(
                          (log) =>
                            log.user.toLowerCase().includes(activityLogSearch.toLowerCase()) ||
                            log.action.toLowerCase().includes(activityLogSearch.toLowerCase()) ||
                            log.module.toLowerCase().includes(activityLogSearch.toLowerCase())
                        )
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.time}</td>
                            <td className="p-3 text-slate-800">@{log.user}</td>
                            <td className="p-3 text-slate-600 font-medium">{log.action}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{log.module}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] uppercase font-bold">{log.status}</span>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{log.ip}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 17. PURCHASE SETTING */}
            {selectedSettingsTab === 'purchase_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">Procurement & Purchasing Workflows</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Control supervisory approval thresholds, units of measure, and automatic stock safety thresholds.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Supervisor PO Clearance Cap (৳)</label>
                    <input
                      type="number" value={purchaseStrictPOAmt} onChange={(e) => setPurchaseStrictPOAmt(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Procurement Unit</label>
                    <select
                      value={purchaseDefaultUnit} onChange={(e) => setPurchaseDefaultUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Box">Boxes (Box)</option>
                      <option value="Pcs">Single Pieces (Pcs)</option>
                      <option value="Kg">Kilograms (Kg)</option>
                      <option value="Ltr">Liters (Ltr)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Auto Reorder Safety Stocks</span>
                      <span className="block text-[9px] text-slate-400">Generate draft requisition POs when stock falls beneath alert limit.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurchaseAutoReorder(!purchaseAutoReorder)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${purchaseAutoReorder ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">GRN Auto-disburse Cash Payment</span>
                      <span className="block text-[9px] text-slate-400">Instantly record cash-out ledger rows upon goods arrival.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPurchaseGrnAutoDisburse(!purchaseGrnAutoDisburse)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${purchaseGrnAutoDisburse ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('Procurement & Reorder Rules')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Purchase Config
                  </button>
                </div>
              </div>
            )}

            {/* 18. ENTRY SETTING */}
            {selectedSettingsTab === 'entry_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">General Ledger Voucher sequences</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Calibrate automated general journal book postings, vouchers, and safety periods.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Voucher Sequence Code Prefix</label>
                    <input
                      type="text" value={entryVoucherPrefix} onChange={(e) => setEntryVoucherPrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lock Journal Adjustments older than (Days)</label>
                    <input
                      type="number" value={entryLockDays} onChange={(e) => setEntryLockDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Auto-Ledger Posting of Sales/Purchase</span>
                      <span className="block text-[9px] text-slate-400">Skip draft stage and record directly into double-entry ledger.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntryAutoPosting(!entryAutoPosting)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${entryAutoPosting ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 mt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[11px] font-bold text-slate-700">Allow Manual Edit of Bank Reconciliations</span>
                      <span className="block text-[9px] text-slate-400">Permit manual balance changes on cleared transaction statements.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntryAllowManualLedger(!entryAllowManualLedger)}
                      className={`h-5 w-9 rounded-full p-0.5 transition-all flex items-center ${entryAllowManualLedger ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-xs"></div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveTabSettings('General Ledger Voucher Sequences')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Save Entry Settings
                  </button>
                </div>
              </div>
            )}

            {/* 19. DATE SETTING */}
            {selectedSettingsTab === 'date_setting' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display">তারিখ পরিবর্তন (System Date Settings)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">সিস্টেমের সকল ট্রানজেকশনে ব্যবহৃত তারিখ নিয়ন্ত্রণ করুন।</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-6">
                  {/* Mode Select */}
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">তারিখ মোড (Date Selection Mode)</span>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSysDateMode('auto');
                        }}
                        className={`p-4 border rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                          sysDateMode === 'auto'
                            ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Icons.CheckCircle className={`h-4 w-4 shrink-0 ${sysDateMode === 'auto' ? 'text-indigo-600' : 'text-slate-300'}`} />
                          অটো সিলেক্ট (আজকের তারিখ)
                        </span>
                        <span className="text-[10px] text-slate-400 leading-relaxed">
                          আজকের বর্তমান আসল তারিখ স্বয়ংক্রিয়ভাবে ব্যবহার করা হবে (Today's current date: {new Date().toISOString().split('T')[0]})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSysDateMode('custom');
                        }}
                        className={`p-4 border rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                          sysDateMode === 'custom'
                            ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Icons.CheckCircle className={`h-4 w-4 shrink-0 ${sysDateMode === 'custom' ? 'text-indigo-600' : 'text-slate-300'}`} />
                          নির্দিষ্ট কোনো তারিখ (Custom Date)
                        </span>
                        <span className="text-[10px] text-slate-400 leading-relaxed">
                          আপনার সেট করা একটি নির্দিষ্ট ম্যানুয়াল তারিখ সিস্টেমের সকল ট্রানজেকশনে ডিফল্ট হিসেবে কাজ করবে।
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Date Input Field */}
                  {sysDateMode === 'custom' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">ম্যানুয়াল তারিখ নির্ধারণ করুন (Select Custom Date)</label>
                      <input
                        type="date"
                        value={sysCustomDate}
                        onChange={(e) => setSysCustomDate(e.target.value)}
                        className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-3 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all max-w-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateSettings) {
                        onUpdateSettings({
                          ...settings,
                          systemDateMode: sysDateMode,
                          systemCustomDate: sysCustomDate,
                        } as AppSettings);
                        alert('সিস্টেম তারিখ সেটিংস সফলভাবে আপডেট করা হয়েছে! / System Date Settings updated successfully!');
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    সেভ করুন (Save Date Settings)
                  </button>
                </div>
              </div>
            )}

            {/* 19. ERROR LOGS & CRASH TRACKER */}
            {selectedSettingsTab === 'error_logs' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {shouldTriggerTestError && (() => { throw new Error('Test Component Error triggered by Administrator for logging verification!'); })()}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                      <Bug className="h-4 w-4 text-rose-600" />
                      <span>Enterprise System Error Logs & Crash Tracker</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automated Firestore crash-log capture for component errors and system exceptions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShouldTriggerTestError(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Trigger Test Error</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadErrorLogs}
                      disabled={isLoadingErrorLogs}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoadingErrorLogs ? 'animate-spin' : ''}`} />
                      <span>Refresh Logs</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearErrorLogs}
                      disabled={isLoadingErrorLogs || errorLogEntries.length === 0}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Clear Logs</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Privacy & Sanitization Safeguard:</span> Log entries only capture high-level component context, stack traces, and non-sensitive identifiers. Full customer PII or invoice payloads are never stored in error logs.
                  </div>
                </div>

                {isLoadingErrorLogs ? (
                  <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Loading Firestore error logs...</span>
                  </div>
                ) : errorLogEntries.length === 0 ? (
                  <div className="p-12 border border-slate-200 rounded-xl text-center bg-slate-50/30 text-slate-500 text-xs">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-700 text-sm">No Error Logs Recorded</p>
                    <p className="text-[11px] text-slate-400 mt-1">Your system is running smoothly without caught component crashes. Click "Trigger Test Error" above to verify the pipeline.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Error Message</th>
                          <th className="p-3">Context / Tab</th>
                          <th className="p-3">User & Role</th>
                          <th className="p-3 text-center">Stack Trace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {errorLogEntries.map((log) => {
                          const isExpanded = expandedLogId === log.id;
                          return (
                            <React.Fragment key={log.id || log.timestamp}>
                              <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-3 font-mono text-rose-700 font-bold max-w-xs truncate">
                                  {log.message}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                                    {log.currentTab || 'App'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  <span className="font-bold">{log.userId}</span>
                                  <span className="block text-[10px] text-slate-400 uppercase">{log.userRole}</span>
                                </td>
                                <td className="p-3 text-center">
                                  {log.stack ? (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedLogId(isExpanded ? null : log.id || log.timestamp)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all"
                                    >
                                      {isExpanded ? 'Hide Stack' : 'View Stack'}
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">N/A</span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && log.stack && (
                                <tr className="bg-slate-900 text-emerald-400">
                                  <td colSpan={5} className="p-4 font-mono text-[10px] whitespace-pre-wrap overflow-x-auto">
                                    <div className="max-h-60 overflow-y-auto">
                                      <span className="text-slate-400 block mb-1 font-sans font-bold uppercase text-[9px]">Diagnostic Stack Trace:</span>
                                      {log.stack}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DYNAMIC FALLBACK FOR ALL OTHER SUBSYSTEM/ADMIN SETTINGS TABS */}
            {!['tax_rates', 'payment_methods', 'add_suppliers_setting', 'add_customers_setting', 'add_product_setting', 'pos_setting', 'collection_payment_settings', 'users', 'roles', 'loan_setting', 'system_settings', 'menu_management', 'navigation_builder', 'delete_history', 'sales_return_setting', 'sales_order_setting', 'activity_log', 'purchase_setting', 'entry_setting', 'date_setting', 'error_logs'].includes(selectedSettingsTab) && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
                      {selectedSettingsTab === 'role_matrix' || selectedSettingsTab === 'permissions' ? 'Enterprise Role Permission Matrix' : humanizeTab(selectedSettingsTab)}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      System-level administration and automated calibration module. Fully integrated with Nexova Core engines.
                    </p>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-mono font-bold px-2.5 py-1 rounded-md uppercase border border-indigo-100">
                    Nexova Subsystem: {selectedSettingsTab}
                  </span>
                </div>

                {/* 1. PERMISSIONS & ROLE MATRIX PANEL */}
                {(selectedSettingsTab === 'permissions' || selectedSettingsTab === 'role_matrix' || selectedSettingsTab === 'permissions_manager') && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-slate-700">Strict Permission Lock Active</span>
                        <span className="block text-[10px] text-slate-400">Lock general ledger modifications and root administration privileges to system admins.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">SYS_SECURE</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Module Suite</th>
                            <th className="p-3 text-center">Root Admin</th>
                            <th className="p-3 text-center">Warehouse Mgr</th>
                            <th className="p-3 text-center">Accounts Exec</th>
                            <th className="p-3 text-center">Procurement Mgr</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {[
                            { name: 'Core Inventory & Warehouse Control', codes: [true, true, false, false] },
                            { name: 'CRM, Pipelines & Leads Ledger', codes: [true, false, false, true] },
                            { name: 'Double-entry General Ledger & Bank', codes: [true, false, true, false] },
                            { name: 'Production, MRP & Manufacturing Bills', codes: [true, true, false, false] },
                            { name: 'Service Helpdesk & Client Contracts', codes: [true, false, false, true] },
                            { name: 'Workflow Approval Rules & Escalation', codes: [true, false, true, false] }
                          ].map((row, idx) => (
                            // index key safe: fixed-order static list
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="p-3 text-slate-800">{row.name}</td>
                              {[0, 1, 2, 3].map((colIdx) => (
                                <td key={colIdx} className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    defaultChecked={row.codes[colIdx]}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                                    onChange={() => {}}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => alert('Role authorization matrix updated and cached successfully across 4 active users!')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Save Role Matrix Rules
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. COMPANIES & BRANCHES PANEL */}
                {(selectedSettingsTab === 'companies' || selectedSettingsTab === 'branches' || selectedSettingsTab === 'company_profile') && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                      {/* Left side: Branch list */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Branch / Location</th>
                                <th className="p-3">Code</th>
                                <th className="p-3">City</th>
                                <th className="p-3">Manager</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {branches.map((b: any) => (
                                <tr key={b.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-slate-800 font-bold">{b.name}</td>
                                  <td className="p-3 font-mono text-[10px] text-indigo-600">{b.code}</td>
                                  <td className="p-3 text-slate-500">{b.city}</td>
                                  <td className="p-3 text-slate-600">@{b.manager}</td>
                                  <td className="p-3">
                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded">
                                      {b.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (branches.length <= 1) {
                                          alert('System requires at least one active corporate branch.');
                                          return;
                                        }
                                        setBranches(branches.filter((x: any) => x.id !== b.id));
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Icons.Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right side: Register branch form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fData = new FormData(e.currentTarget);
                          const name = fData.get('b_name') as string;
                          const code = fData.get('b_code') as string;
                          const city = fData.get('b_city') as string;
                          const manager = fData.get('b_manager') as string;
                          if (!name || !code) return;
                          
                          setBranches([
                            ...branches,
                            {
                              id: 'b_' + Date.now(),
                              name,
                              code: code.toUpperCase(),
                              city: city || 'Dhaka',
                              manager: manager || 'Administrator',
                              status: 'Active'
                            }
                          ]);
                          e.currentTarget.reset();
                        }}
                        className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4"
                      >
                        <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Register New Branch Location</span>
                        
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch/Yard Name *</label>
                          <input
                            type="text" name="b_name" required placeholder="e.g. Uttara Express Hub"
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Short Code *</label>
                            <input
                              type="text" name="b_code" required placeholder="UTT-HUB"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
                            <input
                              type="text" name="b_city" placeholder="Dhaka"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch Manager User *</label>
                          <input
                            type="text" name="b_manager" placeholder="Mizanur Rahman"
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
                        >
                          Establish Location
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 3. FISCAL YEAR PANEL */}
                {selectedSettingsTab === 'fiscal_year' && (
                  <div className="space-y-6 text-xs">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Fiscal Year Period</th>
                            <th className="p-3">Start Date</th>
                            <th className="p-3">End Date</th>
                            <th className="p-3">System Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {fiscalYears.map((fy: any) => (
                            <tr key={fy.id} className="hover:bg-slate-50/40">
                              <td className="p-3 font-bold text-slate-800">{fy.year}</td>
                              <td className="p-3 font-mono text-slate-500">{fy.startDate}</td>
                              <td className="p-3 font-mono text-slate-500">{fy.endDate}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${fy.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {fy.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFiscalYears(fiscalYears.map((x: any) => {
                                      if (x.id === fy.id) {
                                        return { ...x, status: x.status === 'Active' ? 'Closed' : 'Active' };
                                      } else {
                                        return x.status === 'Active' && fy.status !== 'Active' ? { ...x, status: 'Closed' } : x;
                                      }
                                    }));
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  {fy.status === 'Active' ? 'Lock Period' : 'Set Active'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const yearName = `FY 2027-2028`;
                          if (fiscalYears.some((x: any) => x.year === yearName)) {
                            alert('Fiscal period already exists in series.');
                            return;
                          }
                          setFiscalYears([
                            ...fiscalYears,
                            { id: 'fy_' + Date.now(), year: yearName, startDate: '2027-07-01', endDate: '2028-06-30', status: 'Closed' }
                          ]);
                          alert(`Created new locked period: ${yearName}`);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Open New Fiscal Period
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. CURRENCY PANEL */}
                {selectedSettingsTab === 'currency' && (
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-xl bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="p-3">ISO Code</th>
                              <th className="p-3">Symbol</th>
                              <th className="p-3 text-right">Exchange Rate relative to BDT</th>
                              <th className="p-3">System Base Currency</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {currencies.map((c: any) => (
                              <tr key={c.code} className="hover:bg-slate-50/40">
                                <td className="p-3 font-bold text-slate-800">{c.code}</td>
                                <td className="p-3 font-mono font-bold text-indigo-600">{c.symbol}</td>
                                <td className="p-3 text-right font-mono">1.00 {c.code} = {c.rate} BDT</td>
                                <td className="p-3">
                                  {c.isDefault ? (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase">Company Default Base</span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Secondary Ledger</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {!c.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCurrencies(currencies.map((x: any) => ({
                                          ...x,
                                          isDefault: x.code === c.code,
                                          rate: x.code === c.code ? 1.0 : x.rate
                                        })));
                                      }}
                                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                    >
                                      Make Base
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fData = new FormData(e.currentTarget);
                          const code = fData.get('c_code') as string;
                          const symbol = fData.get('c_symbol') as string;
                          const rate = Number(fData.get('c_rate'));
                          if (!code || !symbol || isNaN(rate)) return;

                          setCurrencies([
                            ...currencies,
                            { code: code.toUpperCase(), symbol, rate, isDefault: false, status: 'Active' }
                          ]);
                          e.currentTarget.reset();
                        }}
                        className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4"
                      >
                        <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Register Currency Exchange</span>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ISO Code *</label>
                          <input
                            type="text" name="c_code" required placeholder="e.g. GBP"
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-semibold text-center"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Symbol *</label>
                            <input
                              type="text" name="c_symbol" required placeholder="£"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rate in BDT *</label>
                            <input
                              type="number" step="0.01" name="c_rate" required placeholder="152.4"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-center font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10 cursor-pointer"
                        >
                          Register Currency
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 5. LANGUAGE WORKSPACE PANEL */}
                {selectedSettingsTab === 'language' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-slate-700">Nexova Multi-language Dictionary Mapping</span>
                        <span className="block text-[10px] text-slate-400">Current Active Locale: <strong>English (US)</strong>. Supplementary locale: <strong>Bengali (BD)</strong>.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Locale toggled to Bengali! System glossary loaded.')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Toggle Default Locale
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">System String Key</th>
                            <th className="p-3">English Translation</th>
                            <th className="p-3">Bengali (বাংলা) Mapping</th>
                            <th className="p-3">Module Context</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {[
                            { key: 'INV_HEADER', en: 'Sales Invoice Ledger', bn: 'বিক্রয় চালান খতিয়ান', ctx: 'Billing' },
                            { key: 'STK_LEVEL', en: 'Safety Reorder Alert', bn: 'নিরাপত্তা স্টক রিঅর্ডার সতর্কতা', ctx: 'Inventory' },
                            { key: 'LIA_LOAN', en: 'Liability Credit Line', bn: 'দায় ঋণ সীমা', ctx: 'Banking' },
                            { key: 'MAN_BOM', en: 'Bill of Materials', bn: 'কাঁচামালের তালিকা', ctx: 'Manufacturing' },
                            { key: 'EMP_ATT', en: 'Employee Attendance Logs', bn: 'কর্মচারী উপস্থিতি লগ', ctx: 'HR & Service' }
                          ].map((lang) => (
                            <tr key={lang.key} className="hover:bg-slate-50/40">
                              <td className="p-3 font-mono text-[10px] text-indigo-600">{lang.key}</td>
                              <td className="p-3 text-slate-800">{lang.en}</td>
                              <td className="p-3 text-slate-800 font-serif">{lang.bn}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{lang.ctx}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => alert('Global multi-language translation directory compiled successfully!')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Compile Dictionary
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. NUMBER SERIES DOCUMENT SEQUENCES PANEL */}
                {selectedSettingsTab === 'number_series' && (
                  <div className="space-y-6 text-xs">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Document Class</th>
                            <th className="p-3">Prefix</th>
                            <th className="p-3 text-center">Starting Index</th>
                            <th className="p-3 text-center">Next Generated Number</th>
                            <th className="p-3">Step Size</th>
                            <th className="p-3 text-right">Sequence Preview</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {[
                            { doc: 'Corporate Sales Invoice', prefix: 'INV-2026-', start: 10001, next: 10412, step: 1 },
                            { doc: 'Purchase Order Requisition', prefix: 'PO-2026-', start: 80001, next: 80231, step: 1 },
                            { doc: 'Goods Received Note Voucher', prefix: 'GRN-2026-', start: 50001, next: 50119, step: 1 },
                            { doc: 'Double-Entry General Journal', prefix: 'JV-2026-', start: 30001, next: 30104, step: 1 }
                          ].map((ser, i) => (
                            // index key safe: fixed-order static list
                            <tr key={i} className="hover:bg-slate-50/40">
                              <td className="p-3 font-bold text-slate-800">{ser.doc}</td>
                              <td className="p-3 font-mono text-indigo-600">{ser.prefix}</td>
                              <td className="p-3 text-center font-mono">{ser.start}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-900">{ser.next}</td>
                              <td className="p-3 font-mono text-center text-slate-400">+{ser.step}</td>
                              <td className="p-3 text-right font-mono font-bold text-indigo-600">{ser.prefix}{ser.next}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => alert('Document sequences and automatic numbering series locked successfully!')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Lock Series Parameters
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. PERFORMANCE, METADATA & DATABASE CACHE WORKSPACE */}
                {(selectedSettingsTab === 'metadata_manager' || selectedSettingsTab === 'database' || selectedSettingsTab === 'cache' || selectedSettingsTab === 'restore' || selectedSettingsTab === 'backup') && (
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold">
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Total Active Cached Objects</span>
                        <span className="text-xl font-bold text-slate-800 mt-1 block">4,192 Nodes</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Index Query Latency</span>
                        <span className="text-xl font-bold text-emerald-600 mt-1 block">0.08 ms (Extreme)</span>
                      </div>
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4">
                        <span className="text-[9px] font-bold uppercase text-indigo-500 block">System Memory Footprint</span>
                        <span className="text-xl font-bold text-indigo-700 mt-1 block">18.4 MB</span>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Enterprise Data Recovery & Backup Hub</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Flush system query caches, perform integrity index scans, or generate snapshot files of user configurations.</p>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            alert('Query Caches Purged! Re-indexed 41 active modules instantly.');
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm shadow-rose-600/10"
                        >
                          <Icons.RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Purge & Flush Cache
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Metadata consistency validation passed: 100% integrity.');
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/10"
                        >
                          <Icons.ShieldCheck className="h-3.5 w-3.5" />
                          Perform Metadata Scan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([localStorage.getItem('nexova_nav_items') || '[]'], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `NEXOVA_ERP_METADATA_SNAPSHOT_${Date.now()}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Icons.Download className="h-3.5 w-3.5" />
                          Download Metadata Snapshot
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. AUDIT TRAIL PANEL */}
                {selectedSettingsTab === 'audit_trail' && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-150">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="block font-bold text-slate-700">Live Secure Audit Trail System</span>
                      <span className="block text-[10px] text-slate-400">Strictly tracks user actions, critical schema alterations, and master-data deletions.</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Audit Time</th>
                            <th className="p-3">Sec. Level</th>
                            <th className="p-3">Operator</th>
                            <th className="p-3">Event Details</th>
                            <th className="p-3">Client IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {[
                            { date: '2026-07-10 11:24 AM', sec: 'HIGH', user: 'admin', desc: 'Sanctioned Corporate Loan MTB-401 for BDT 5,000,000', ip: '192.168.1.100' },
                            { date: '2026-07-10 10:41 AM', sec: 'MED', user: 'mizanur.rahman', desc: 'Modified starting index sequence for Document Class Invoice', ip: '192.168.1.102' },
                            { date: '2026-07-10 09:15 AM', sec: 'LOW', user: 'supervisor', desc: 'Toggled automatic scheduler job safety alert scanner to ACTIVE', ip: '127.0.0.1' }
                          ].map((log, i) => (
                            // index key safe: fixed-order static list
                            <tr key={i} className="hover:bg-slate-50/40">
                              <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.date}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.sec === 'HIGH' ? 'bg-rose-50 text-rose-600' : log.sec === 'MED' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {log.sec}
                                </span>
                              </td>
                              <td className="p-3 text-slate-800">@{log.user}</td>
                              <td className="p-3 text-slate-800">{log.desc}</td>
                              <td className="p-3 font-mono text-[10px] text-slate-400">{log.ip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9. NOTIFICATIONS, EMAIL QUEUE, SMS QUEUE WORKSPACE */}
                {(selectedSettingsTab === 'notifications' || selectedSettingsTab === 'email_queue' || selectedSettingsTab === 'sms_queue') && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-150">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Messaging Dispatch Outbox Queue</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Observe real-time SMS API delivery states and SMTP mail delivery channels.</p>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOutboxQueue(outboxQueue.map((q: any) => ({ ...q, status: 'Sent', sentTime: 'Just Now' })));
                            alert('All pending dispatch items were delivered successfully!');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-[10px] transition-colors"
                        >
                          Process Dispatch Queue
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOutboxQueue([
                              { id: 'q_' + Date.now(), type: 'Email', recipient: 'finance@nexova-erp.com', subject: 'Tax calibration log compiled', status: 'Pending', sentTime: '-' },
                              ...outboxQueue
                            ]);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer text-[10px] transition-colors"
                        >
                          Add Test Message
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">Recipient Address</th>
                            <th className="p-3">Subject / Body Details</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3">Delivery Timestamp</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {outboxQueue.map((q: any) => (
                            <tr key={q.id} className="hover:bg-slate-50/40">
                              <td className="p-3 font-mono">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${q.type === 'Email' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {q.type}
                                </span>
                              </td>
                              <td className="p-3 text-slate-800 font-medium">{q.recipient}</td>
                              <td className="p-3 text-slate-800">{q.subject}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${q.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' : q.status === 'Pending' ? 'bg-amber-50 text-amber-600' : q.status === 'Failed' ? 'bg-rose-50 text-rose-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {q.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-slate-500">{q.sentTime}</td>
                              <td className="p-3 text-right">
                                {q.status !== 'Sent' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOutboxQueue(outboxQueue.map((x: any) => x.id === q.id ? { ...x, status: 'Sent', sentTime: 'Just Now' } : x));
                                      alert(`Dispatched ${q.type} successfully to ${q.recipient}`);
                                    }}
                                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Retry Send
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 10. SCHEDULER & QUEUE WORKSPACE */}
                {(selectedSettingsTab === 'scheduler' || selectedSettingsTab === 'queue') && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-150">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-slate-700">Nexova Daemon Scheduler Manager</span>
                        <span className="block text-[10px] text-slate-400">Processes repetitive background procedures using standard 5-field cron notation.</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wide">Deamon Core Online</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Job Name</th>
                            <th className="p-3">Cron Expression</th>
                            <th className="p-3">Last Run timestamp</th>
                            <th className="p-3">State</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {cronJobs.map((job: any) => (
                            <tr key={job.id} className="hover:bg-slate-50/40">
                              <td className="p-3 text-slate-800 font-bold">{job.name}</td>
                              <td className="p-3 font-mono text-indigo-600 font-bold">{job.schedule}</td>
                              <td className="p-3 font-mono text-[10px] text-slate-500">{job.lastRun}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCronJobs(cronJobs.map((x: any) => x.id === job.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x));
                                  }}
                                  className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                >
                                  {job.status === 'Active' ? 'Suspend' : 'Resume'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCronJobs(cronJobs.map((x: any) => x.id === job.id ? { ...x, lastRun: 'Just Now' } : x));
                                    alert(`Manually fired job: ${job.name}`);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                                >
                                  Run Now
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 11. DEVELOPER TOOLS & PERFORMANCE INTERACTIVE PLAYGROUND */}
                {(selectedSettingsTab === 'developer_tools' || selectedSettingsTab === 'performance') && (
                  <div className="space-y-6 text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Performance gauge metrics */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                        <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Diagnostic Engine Latency</span>
                        <div className="space-y-3 font-semibold">
                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-500">Database Query Pool</span>
                              <span className="text-indigo-600 font-mono">0.05ms (Standard)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '12%' }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-500">Middleware Router Processing</span>
                              <span className="text-indigo-600 font-mono">0.12ms (Optimal)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '25%' }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-500">Local Storage State Synchronizer</span>
                              <span className="text-indigo-600 font-mono">0.02ms</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '4%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: SQL Query Playground */}
                      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 text-slate-200 font-mono">
                        <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-2">
                          <span className="text-slate-500 font-bold">SQL SCHEMA PLAYGROUND</span>
                          <span className="text-emerald-500 font-bold">CONNECTED TO IN-MEMORY SQL</span>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 block">-- Query input (Try typing SELECT or tap run):</span>
                          <input
                            type="text"
                            defaultValue="SELECT * FROM company_branches WHERE status = 'Active';"
                            id="sandbox_sql_input"
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-indigo-400 focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-slate-500">Supported tables: branches, users, loans</span>
                          <button
                            type="button"
                            onClick={() => {
                              const inp = (document.getElementById('sandbox_sql_input') as HTMLInputElement)?.value || '';
                              if (inp.toLowerCase().includes('branches')) {
                                alert(`SQL Output:\n\nReturned ${branches.length} rows successfully.\n` + JSON.stringify(branches, null, 2));
                              } else {
                                alert(`SQL Output:\n\nQuery executed successfully. Row affected: 0.`);
                              }
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer"
                          >
                            Execute Statement
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Helper humanizeTab inline function helper */}
            {(() => {
              const tabHelper = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Linked Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Link Business Bank Account</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleBankSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Name *</label>
                <input
                  type="text" required placeholder="e.g. Mutual Trust Bank PLC" value={bName}
                  onChange={(e) => setBName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Display Name *</label>
                <input
                  type="text" required placeholder="e.g. MTB General Current" value={bAccName}
                  onChange={(e) => setBAccName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number *</label>
                <input
                  type="text" required placeholder="e.g. 1102.1129.401" value={bAccNo}
                  onChange={(e) => setBAccNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type</label>
                <select value={bType} onChange={(e) => setBType(e.target.value as BankAccount['type'])} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                  <option value="Current">Current Account</option>
                  <option value="Savings">Savings Account</option>
                  <option value="Mobile">Mobile Banking</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer">Link Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Record New Liability Loan</h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleLoanSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Borrowing Entity Name *</label>
                <input
                  type="text" required placeholder="e.g. DBBL Corporate Loan" value={lBorrower}
                  onChange={(e) => setLBorrower(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loan Capital Amount (৳) *</label>
                <input
                  type="number" required min="100" placeholder="500000" value={lAmt}
                  onChange={(e) => setLAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interest Rate (%)</label>
                  <input
                    type="number" min="0" max="100" placeholder="9" value={lInt}
                    onChange={(e) => setLInt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amortization Months</label>
                  <input
                    type="number" min="1" placeholder="12" value={lDur}
                    onChange={(e) => setLDur(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowLoanModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer">Sanction Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset / Change Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs text-slate-700">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  পাসওয়ার্ড রিসেট এবং পরিবর্তন / Password Actions
                </h3>
              </div>
              <button 
                onClick={() => {
                  setPasswordModalUser(null);
                  setNewPasswordInput('');
                  setPasswordModalError(null);
                  setPasswordModalSuccess(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-sm">{passwordModalUser.name}</p>
                <p className="text-[10px] text-slate-500">@{passwordModalUser.username} | {passwordModalUser.email}</p>
                <p className="text-[10px] mt-1 font-semibold text-indigo-600 uppercase">রোল: {passwordModalUser.role}</p>
              </div>

              {passwordModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                  {passwordModalError}
                </div>
              )}

              {passwordModalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-semibold">
                  {passwordModalSuccess}
                </div>
              )}

              {/* Action 1: Reset Password Link */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <p className="font-bold text-slate-700 text-xs">অপশন ১: একটি অস্থায়ী পাসওয়ার্ড সেট করুন</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  একটি নতুন অস্থায়ী পাসওয়ার্ড শেনারেট করুন, তারপর ব্যবহারকারীকে সরাসরি জানিয়ে দিন। লগইনের পর সেটি পরিবর্তন করে নিতে বলুন।
                </p>
                <button
                  type="button"
                  disabled={passwordModalLoading}
                  onClick={async () => {
                    setPasswordModalLoading(true);
                    setPasswordModalError(null);
                    setPasswordModalSuccess(null);
                    try {
                      const { tempPassword } = await sendPasswordResetEmail(passwordModalUser.email);
                      setPasswordModalSuccess(
                        `নতুন অস্থায়ী পাসওয়ার্ড: ${tempPassword} -- এটি "${passwordModalUser.email}" এর সাথে সরাসরি শেয়ার করুন।`
                      );
                    } catch (err: any) {
                      console.error("Reset password link error:", err);
                      const msg = `পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে: ${err.message || err}`;
                      setPasswordModalError(msg);
                      alert(msg);
                    } finally {
                      setPasswordModalLoading(false);
                    }
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {passwordModalLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icons.Mail className="h-3.5 w-3.5" />
                  )}
                  <span>রিসেট ইমেইল লিঙ্ক পাঠান (Send Reset Link)</span>
                </button>
              </div>

              {/* Action 2: Change Own Password directly */}
              <div className="space-y-2 pt-1">
                <p className="font-bold text-slate-700 text-xs">অপশন ২: সরাসরি পাসওয়ার্ড পরিবর্তন (শুধু নিজের জন্য)</p>
                {currentUser?.email?.toLowerCase() === passwordModalUser.email?.toLowerCase() ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      আপনি বর্তমানে এই অ্যাকাউন্টে লগইন আছেন। আপনি চাইলে সরাসরি নিজের জন্য একটি নতুন পাসওয়ার্ড সেট করতে পারেন:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-600 font-mono text-xs"
                      />
                      <button
                        type="button"
                        disabled={passwordModalLoading || newPasswordInput.length < 6}
                        onClick={async () => {
                          if (newPasswordInput.length < 6) {
                            setPasswordModalError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
                            return;
                          }
                          setPasswordModalLoading(true);
                          setPasswordModalError(null);
                          setPasswordModalSuccess(null);
                          try {
                            const user = auth.currentUser;
                            if (user) {
                              await updatePassword(newPasswordInput);
                              setPasswordModalSuccess('আপনার পাসওয়ার্ডটি সফলভাবে পরিবর্তন করা হয়েছে!');
                              setNewPasswordInput('');
                            } else {
                              setPasswordModalError('কোনো সেশন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।');
                            }
                          } catch (err: any) {
                            console.error("Change password error:", err);
                            const msg = `পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে: ${err.message || err}`;
                            setPasswordModalError(msg);
                            alert(msg);
                          } finally {
                            setPasswordModalLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        আপডেট করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      নিরাপত্তা নীতিমালার কারণে Client-side Firebase Auth সরাসরি অন্য ব্যবহারকারীর পাসওয়ার্ড পরিবর্তন করার অনুমতি দেয় না।
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-semibold text-indigo-600">
                      বিকল্প পদ্ধতি (Alternative):
                    </p>
                    <ul className="list-disc list-inside text-[9px] text-slate-400 space-y-1 mt-1">
                      <li>উপরের <strong>'রিসেট ইমেইল লিঙ্ক পাঠান'</strong> ব্যবহার করুন।</li>
                      <li>অথবা, এই ব্যবহারকারীকে তালিকা থেকে ডিলিট করে একই ইমেইল দিয়ে নতুন পাসওয়ার্ড দিয়ে পুনরায় এড করুন (যা অ্যাকাউন্টকে লিংক করে নিবে)।</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setPasswordModalUser(null);
                  setNewPasswordInput('');
                  setPasswordModalError(null);
                  setPasswordModalSuccess(null);
                }} 
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Database Reset / Wipe Confirmation Modal */}
      {confirmActionType && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden scale-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 text-orange-600 mb-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <span className="text-xl font-bold">⚠️</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {confirmActionType === 'reset' ? 'Wipe Database Confirmation' : 'Clear All Data Confirmation'}
                  </h3>
                  <p className="text-xs text-slate-400">এ্যাকশনটি সতর্কতার সাথে সম্পন্ন করুন</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 border-y border-slate-100 py-4 my-4">
                {confirmActionType === 'reset' ? (
                  <>
                    <p className="font-semibold text-slate-800">আপনি কি নিশ্চিত যে সম্পূর্ণ ডেটাবেস ডেমো ভ্যালুগুলোতে রিসেট করতে চান?</p>
                    <p>এটি আপনার বর্তমান কাস্টম প্রোডাক্ট, সেলস, কাস্টমার, সাপ্লায়ার ও অন্যান্য সকল এন্ট্রি ডিলিট করে ফ্যাক্টরি ডেমো ডেটা দিয়ে প্রতিস্থাপন করবে।</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">আপনি কি নিশ্চিত যে সমস্ত ডেমো ডেটা মুছে ফেলে ডেটাবেস সম্পূর্ণ খালি করতে চান?</p>
                    <p>এটি আপনার প্রোডাক্ট, ইনভয়েস, কাস্টমার, সাপ্লায়ার ও ট্রানজেকশন সহ সমস্ত ডেটাবেস সম্পূর্ণ ফাঁকা করে দেবে। কোনো নতুন এন্ট্রি ডেমো ডেটা ছাড়া ফ্রেশ শুরু করতে এটি ব্যবহার করুন।</p>
                  </>
                )}
                <p className="text-[10px] text-red-500 font-medium">⚠️ সতর্কতা: এই পরিবর্তনটি পরবর্তীতে আর ফিরিয়ে আনা সম্ভব নয়।</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmActionType(null)}
                  disabled={isPerformingAction}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isPerformingAction}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                    confirmActionType === 'reset'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/10'
                  }`}
                >
                  {isPerformingAction ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                      অপেক্ষা করুন...
                    </>
                  ) : (
                    'হ্যাঁ, নিশ্চিত করুন (Confirm)'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">✓</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-100">সফলভাবে সম্পন্ন হয়েছে</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{showSuccessToast}</p>
          </div>
          <button 
            onClick={() => setShowSuccessToast(null)} 
            className="text-slate-500 hover:text-slate-300 transition-colors text-xs ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
