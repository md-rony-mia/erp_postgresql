import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Save, Download } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';

// Resilient lazy load helper with retry logic for transient dynamic import failures
const lazyWithRetry = (factory: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('Dynamic module import failed, attempting retry...', error);
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await factory();
      } catch (retryError) {
        console.error('Module reload failed:', retryError);
        // Force soft refresh on chunk error
        window.location.reload();
        return new Promise(() => {}) as any;
      }
    }
  });

// Lazy load large per-module view components (>2000 lines) to support optimal bundle size split
const InventoryView = lazyWithRetry(() => import('./components/InventoryView'));
const SalesView = lazyWithRetry(() => import('./components/SalesView'));
const PurchaseView = lazyWithRetry(() => import('./components/PurchaseView'));
const EmployeeView = lazyWithRetry(() => import('./components/EmployeeView'));
const BankingAndLoanView = lazyWithRetry(() => import('./components/BankingAndLoanView'));
const ReportsView = lazyWithRetry(() => import('./components/ReportsView'));

import AccountingView from './components/AccountingView';
import { getUnitCostForSale, consumeBatchesForSale, DEFAULT_BATCHES } from './lib/inventoryCosting';
import GridReportView from './components/GridReportView';
import RdlReportView from './components/RdlReportView';
import Login from './components/Login';
import CRMView from './components/CRMView';
import ProjectsView from './components/ProjectsView';
import ManufacturingView from './components/ManufacturingView';
import ServiceView from './components/ServiceView';
import DocumentsView from './components/DocumentsView';
import WorkflowView from './components/WorkflowView';
import AIView from './components/AIView';
import IntegrationView from './components/IntegrationView';
import FixedAssetsView from './components/FixedAssetsView';
import { navEngine } from './lib/navigationEngine';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import WindowHeader from './components/WindowHeader';
import Taskbar from './components/Taskbar';

import {
  seedCollectionIfEmpty,
  fetchCollectionFromFirestore,
  subscribeToCollection,
  saveSettingsToFirestore,
  syncCollectionToFirestore,
  db,
  onAuthStateChange,
  signOutUser,
  isFirebaseConfigured,
  Unsubscribe,
} from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  AppSettings,
  getSystemDate,
  Branch,
} from './types';
import { INITIAL_DEFAULT_BRANCHES } from './components/BranchManagementView';

import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_INVOICES,
  INITIAL_PO,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_ACCOUNT_HEADS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LOANS,
} from './data';

const LazyLoadingFallback = () => (
  <div className="flex h-[450px] w-full flex-col items-center justify-center gap-3">
    <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
    <span className="text-xs text-slate-400 font-mono">মডিউল লোড হচ্ছে...</span>
  </div>
);

function AppContent() {
  const { windows, openWindow } = useWindowManager();
  const hasActiveUnminimizedWindow = windows.some((win) => win.isActive && !win.isMinimized);
  const activeUnminimizedWindow = windows.find((win) => win.isActive && !win.isMinimized);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentSubTab, setCurrentSubTab] = useState('');
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);

  useEffect(() => {
    if (activeUnminimizedWindow) {
      setCurrentTab(activeUnminimizedWindow.tab);
      setCurrentSubTab(activeUnminimizedWindow.subTab || '');
    } else {
      setCurrentTab('dashboard');
      setCurrentSubTab('');
    }
  }, [
    activeUnminimizedWindow?.id,
    activeUnminimizedWindow?.tab,
    activeUnminimizedWindow?.subTab,
    windows,
  ]);

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [globalAlert, setGlobalAlert] = useState<{ message: string; title: string; type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      const msgStr = String(message);
      let alertType: 'info' | 'error' | 'success' = 'info';
      let alertTitle = 'Notification';
      
      const lower = msgStr.toLowerCase();
      if (
        lower.includes('error') || 
        lower.includes('cannot') || 
        lower.includes('invalid') || 
        lower.includes('insufficient') || 
        lower.includes('failed') || 
        lower.includes('required') || 
        lower.includes('please')
      ) {
        alertType = 'error';
        alertTitle = 'System Alert / Error';
      } else if (
        lower.includes('success') || 
        lower.includes('completed') || 
        lower.includes('registered') || 
        lower.includes('saved') || 
        lower.includes('dispatched') || 
        lower.includes('loaded') || 
        lower.includes('registered successfully') ||
        lower.includes('complete!')
      ) {
        alertType = 'success';
        alertTitle = 'Success Confirmation';
      }
      
      setGlobalAlert({
        message: msgStr,
        title: alertTitle,
        type: alertType,
      });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      if (fbUser) {
        let profileFound = false;
        if (isFirebaseConfigured) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const profile = userDocSnap.data();
              setCurrentUser(profile);
              localStorage.setItem('nexova_current_user', JSON.stringify(profile));
              profileFound = true;
            }
          } catch (err) {
            console.warn("Firestore user profile fetch notice:", err);
          }
        }
        if (!profileFound) {
          const stored = localStorage.getItem('nexova_current_user');
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
            } catch (e) {
              console.warn("Invalid local user json:", e);
            }
          }
        }
      } else {
        const stored = localStorage.getItem('nexova_current_user');
        if (!isFirebaseConfigured && stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('nexova_current_user');
        }
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('nexova_current_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error("Error during log out:", e);
    }
  };

  const DEFAULT_SETTINGS: AppSettings = {
    companyName: 'M/S Madani Traders',
    companyAddress: 'Dhaka Sadar Head Office, Dhaka, Bangladesh',
    phone: '01712345678',
    tinNumber: '382910384812',
    binNumber: '002849182-0201',
    tradeLicense: 'TRAD/DNCC/029103/2026',
    defaultVatRate: 5,
    defaultDiscountRate: 0,
    baseCurrency: '৳',
    receiptFooterMessage: 'Thank you for choosing Nexova ERP! Please visit again.',
    autoPrintReceipt: true,
    enableSmsNotification: false,
    defaultWarehouse: 'Main Depot, Dhaka',
    defaultUnit: 'Pcs',
    lowStockThreshold: 5,
    timezone: 'Asia/Dhaka',
    systemDateMode: 'auto',
    systemCustomDate: '',
    taxes: [
      { id: '1', name: 'Standard VAT', rate: 5, type: 'Sales', status: 'Active' },
      { id: '2', name: 'Supplementary Duty (SD)', rate: 10, type: 'Both', status: 'Active' },
      { id: '3', name: 'Import Custom Duty', rate: 15, type: 'Purchase', status: 'Active' },
      { id: '4', name: 'Zero Rated Tax', rate: 0, type: 'Both', status: 'Active' },
    ],
    paymentMethods: [
      { id: '1', name: 'Cash on Hand', type: 'Cash', charge: 0, status: 'Active' },
      { id: '2', name: 'bKash Merchant Pay', type: 'Mobile Wallet', charge: 1.5, status: 'Active' },
      { id: '3', name: 'Nagad Business Account', type: 'Mobile Wallet', charge: 1.0, status: 'Active' },
      { id: '4', name: 'Mutual Trust Bank Transfer', type: 'Bank', charge: 0, status: 'Active' },
      { id: '5', name: 'Visa/Mastercard Terminal', type: 'Card Gateway', charge: 2.0, status: 'Active' },
    ],
    usersList: [
      { id: '1', name: 'Rony Mia', username: 'admin_rony', email: 'ronymia2022@gmail.com', role: 'Administrator', status: 'Active', avatar: 'RM' },
      { id: '2', name: 'Tasnim Ahmed', username: 'tasnim_mgr', email: 'tasnim@madani.com', role: 'Manager', status: 'Active', avatar: 'TA' },
      { id: '3', name: 'Sabbir Rahman', username: 'sabbir_csh', email: 'sabbir@madani.com', role: 'Cashier', status: 'Active', avatar: 'SR' },
      { id: '4', name: 'Sumona Yasmin', username: 'sumona_sales', email: 'sumona@madani.com', role: 'Sales Agent', status: 'Inactive', avatar: 'SY' },
    ],
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('nexova_app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  });

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('nexova_app_settings', JSON.stringify(newSettings));
    try {
      await saveSettingsToFirestore(newSettings);
    } catch (e) {
      console.error("Error saving settings to Firestore:", e);
    }
  };

  // Core shared state engines
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loanAccounts, setLoanAccounts] = useState<LoanAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('nexova_branches_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error reading local branches:', e);
      }
    }
    return INITIAL_DEFAULT_BRANCHES;
  });
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    return localStorage.getItem('nexova_current_branch_id') || 'all';
  });

  // --- LIFTED DRAFT STATES (SALES POS) ---
  const generateDateTimeInvoiceNo = (prefix: string) => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${day}${month}${year}-${hours}${minutes}${seconds}-${rand}`;
  };

  const [posCart, setPosCart] = useState<any[]>([]);
  const [posSelectedCustomerId, setPosSelectedCustomerId] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'Credit' | 'Mobile Banking'>('Cash');
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posInvoiceNoInput, setPosInvoiceNoInput] = useState(() => generateDateTimeInvoiceNo('INV'));
  const [posInvoiceDateInput, setPosInvoiceDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [posReceivedByInput, setPosReceivedByInput] = useState('');
  const [posRecipientAddressInput, setPosRecipientAddressInput] = useState('');
  const [posMobileNoInput, setPosMobileNoInput] = useState('');
  const [posOrderIdInput, setPosOrderIdInput] = useState('');
  const [posLabourCost, setPosLabourCost] = useState<number>(0);
  const [posTransportCost, setPosTransportCost] = useState<number>(0);
  const [posNowPayInput, setPosNowPayInput] = useState<number>(0);
  const [posTransTypeInput, setPosTransTypeInput] = useState<string>('Credit Bill');

  // --- LIFTED DRAFT STATES (PROCUREMENT PO) ---
  const [purchasePoCart, setPurchasePoCart] = useState<any[]>([]);
  const [purchaseSelectedSupplierId, setPurchaseSelectedSupplierId] = useState('');
  const [purchasePoInvoiceNo, setPurchasePoInvoiceNo] = useState(() => generateDateTimeInvoiceNo('PO'));
  const [purchasePoDate, setPurchasePoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchasePoDiscount, setPurchasePoDiscount] = useState<number>(0);
  const [purchasePoTransport, setPurchasePoTransport] = useState<number>(0);
  const [purchasePoLabour, setPurchasePoLabour] = useState<number>(0);

  const [pendingNavigation, setPendingNavigation] = useState<{ tab: string; subTab: string } | null>(null);

  // Synchronize transaction form dates with global settings override date
  useEffect(() => {
    const sysDate = getSystemDate(settings);
    setPosInvoiceDateInput(sysDate);
    setPurchasePoDate(sysDate);
  }, [settings?.systemDateMode, settings?.systemCustomDate]);

  useEffect(() => {
    localStorage.setItem('nexova_products_count', String(products.length));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('nexova_invoices_count', String(invoices.length));
  }, [invoices]);

  const [loading, setLoading] = useState(true);

  // Track latest state values in a ref so snapshot listeners can compare without stale closures
  const latestStateRef = useRef({
    settings,
    products,
    customers,
    suppliers,
    invoices,
    purchaseOrders,
    bankAccounts,
    transactions,
    accountHeads,
    employees,
    attendances,
    loanAccounts,
  });

  useEffect(() => {
    latestStateRef.current = {
      settings,
      products,
      customers,
      suppliers,
      invoices,
      purchaseOrders,
      bankAccounts,
      transactions,
      accountHeads,
      employees,
      attendances,
      loanAccounts,
    };
  }, [
    settings,
    products,
    customers,
    suppliers,
    invoices,
    purchaseOrders,
    bankAccounts,
    transactions,
    accountHeads,
    employees,
    attendances,
    loanAccounts,
  ]);

  // Track if a state change was triggered by a remote Firestore subscription update
  const isRemoteUpdateRef = useRef<Record<string, boolean>>({});

  // Firestore real-time subscriptions & seed effect
  useEffect(() => {
    if (!authChecked) return;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const unsubs: Unsubscribe[] = [];

    async function initRealtimeSubscriptions() {
      setLoading(true);
      try {
        // 1. Fetch settings once to check seeding status
        const settingsDocs = await fetchCollectionFromFirestore<any>('settings');
        const appSettingsDoc = settingsDocs.find((d) => d.id === 'app');

        const isDbSeeded = appSettingsDoc?.isDbSeeded === true;

        if (!isDbSeeded) {
          // Brand new database, run initial seeding
          await Promise.all([
            seedCollectionIfEmpty('products', INITIAL_PRODUCTS),
            seedCollectionIfEmpty('customers', INITIAL_CUSTOMERS),
            seedCollectionIfEmpty('suppliers', INITIAL_SUPPLIERS),
            seedCollectionIfEmpty('invoices', INITIAL_INVOICES),
            seedCollectionIfEmpty('purchaseOrders', INITIAL_PO),
            seedCollectionIfEmpty('bankAccounts', INITIAL_BANK_ACCOUNTS),
            seedCollectionIfEmpty('transactions', INITIAL_TRANSACTIONS),
            seedCollectionIfEmpty('accountHeads', INITIAL_ACCOUNT_HEADS),
            seedCollectionIfEmpty('employees', INITIAL_EMPLOYEES),
            seedCollectionIfEmpty('attendances', INITIAL_ATTENDANCE),
            seedCollectionIfEmpty('loanAccounts', INITIAL_LOANS),
            seedCollectionIfEmpty('branches', INITIAL_DEFAULT_BRANCHES),
          ]);

          const initialSettingsWithSeed: AppSettings = {
            ...DEFAULT_SETTINGS,
            isDbSeeded: true,
          };
          await saveSettingsToFirestore(initialSettingsWithSeed);
        }

        if (!isSubscribed) return;

        // 2. Subscribe to real-time updates for all 11 core collections + settings
        unsubs.push(
          subscribeToCollection<any>('settings', (docs) => {
            const appSettingsDoc = docs.find((d) => d.id === 'app');
            if (appSettingsDoc) {
              const { id, ...sanitizedSettings } = appSettingsDoc;
              const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...sanitizedSettings,
                usersList:
                  sanitizedSettings.usersList && sanitizedSettings.usersList.length > 0
                    ? sanitizedSettings.usersList
                    : DEFAULT_SETTINGS.usersList,
              };
              if (JSON.stringify(mergedSettings) !== JSON.stringify(latestStateRef.current.settings)) {
                isRemoteUpdateRef.current['settings'] = true;
                setSettings(mergedSettings as AppSettings);
              }
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Product>('products', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.products)) {
              isRemoteUpdateRef.current['products'] = true;
              setProducts(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Customer>('customers', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.customers)) {
              isRemoteUpdateRef.current['customers'] = true;
              setCustomers(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Supplier>('suppliers', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.suppliers)) {
              isRemoteUpdateRef.current['suppliers'] = true;
              setSuppliers(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Invoice>('invoices', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.invoices)) {
              isRemoteUpdateRef.current['invoices'] = true;
              setInvoices(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<PurchaseOrder>('purchaseOrders', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.purchaseOrders)) {
              isRemoteUpdateRef.current['purchaseOrders'] = true;
              setPurchaseOrders(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<BankAccount>('bankAccounts', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.bankAccounts)) {
              isRemoteUpdateRef.current['bankAccounts'] = true;
              setBankAccounts(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Transaction>('transactions', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.transactions)) {
              isRemoteUpdateRef.current['transactions'] = true;
              setTransactions(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<AccountHead>('accountHeads', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.accountHeads)) {
              isRemoteUpdateRef.current['accountHeads'] = true;
              setAccountHeads(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Employee>('employees', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.employees)) {
              isRemoteUpdateRef.current['employees'] = true;
              setEmployees(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Attendance>('attendances', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.attendances)) {
              isRemoteUpdateRef.current['attendances'] = true;
              setAttendances(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<LoanAccount>('loanAccounts', (items) => {
            if (JSON.stringify(items || []) !== JSON.stringify(latestStateRef.current.loanAccounts)) {
              isRemoteUpdateRef.current['loanAccounts'] = true;
              setLoanAccounts(items || []);
            }
          })
        );

        unsubs.push(
          subscribeToCollection<Branch>('branches', (items) => {
            if (items && items.length > 0) {
              const sorted = [...items].sort((a, b) => (b.isMainBranch ? 1 : 0) - (a.isMainBranch ? 1 : 0));
              setBranches(sorted);
              try {
                localStorage.setItem('nexova_branches_v2', JSON.stringify(sorted));
              } catch (e) {}
            } else {
              const saved = localStorage.getItem('nexova_branches_v2');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setBranches(parsed);
                    return;
                  }
                } catch (e) {}
              }
              setBranches(INITIAL_DEFAULT_BRANCHES);
            }
          })
        );
      } catch (e) {
        console.error('Error initializing real-time subscriptions:', e);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    initRealtimeSubscriptions();

    return () => {
      isSubscribed = false;
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, [currentUser, authChecked]);

  // Synchronize changes to Firestore when states update, AFTER initial load is done!
  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['settings']) {
      isRemoteUpdateRef.current['settings'] = false;
      return;
    }
    saveSettingsToFirestore(settings);
  }, [settings, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['products']) {
      isRemoteUpdateRef.current['products'] = false;
      return;
    }
    syncCollectionToFirestore('products', products);
  }, [products, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['customers']) {
      isRemoteUpdateRef.current['customers'] = false;
      return;
    }
    syncCollectionToFirestore('customers', customers);
  }, [customers, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['suppliers']) {
      isRemoteUpdateRef.current['suppliers'] = false;
      return;
    }
    syncCollectionToFirestore('suppliers', suppliers);
  }, [suppliers, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['invoices']) {
      isRemoteUpdateRef.current['invoices'] = false;
      return;
    }
    syncCollectionToFirestore('invoices', invoices);
  }, [invoices, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['purchaseOrders']) {
      isRemoteUpdateRef.current['purchaseOrders'] = false;
      return;
    }
    syncCollectionToFirestore('purchaseOrders', purchaseOrders);
  }, [purchaseOrders, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['bankAccounts']) {
      isRemoteUpdateRef.current['bankAccounts'] = false;
      return;
    }
    syncCollectionToFirestore('bankAccounts', bankAccounts);
  }, [bankAccounts, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['transactions']) {
      isRemoteUpdateRef.current['transactions'] = false;
      return;
    }
    syncCollectionToFirestore('transactions', transactions);
  }, [transactions, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['accountHeads']) {
      isRemoteUpdateRef.current['accountHeads'] = false;
      return;
    }
    syncCollectionToFirestore('accountHeads', accountHeads);
  }, [accountHeads, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['employees']) {
      isRemoteUpdateRef.current['employees'] = false;
      return;
    }
    syncCollectionToFirestore('employees', employees);
  }, [employees, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['attendances']) {
      isRemoteUpdateRef.current['attendances'] = false;
      return;
    }
    syncCollectionToFirestore('attendances', attendances);
  }, [attendances, loading, currentUser]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (isRemoteUpdateRef.current['loanAccounts']) {
      isRemoteUpdateRef.current['loanAccounts'] = false;
      return;
    }
    syncCollectionToFirestore('loanAccounts', loanAccounts);
  }, [loanAccounts, loading, currentUser]);

  // --- STATE MUTATION HANDLERS ---

  // INVENTORY MUTATORS
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const branchStocksMap: Record<string, number> = { ...(newProd.branchStocks || {}) };
    if (currentBranchId && currentBranchId !== 'all') {
      branchStocksMap[currentBranchId] = newProd.stock;
    }
    const p: Product = {
      ...newProd,
      id: `p_dynamic_${Date.now()}`,
      branchId: newProd.branchId || (currentBranchId && currentBranchId !== 'all' ? currentBranchId : undefined),
      branchStocks: branchStocksMap,
    };
    setProducts((prev) => [...prev, p]);
  };

  const handleEditStock = (productId: string, newStockVal: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updatedBranchStocks = { ...(p.branchStocks || {}) };
          if (currentBranchId && currentBranchId !== 'all') {
            updatedBranchStocks[currentBranchId] = newStockVal;
          }
          return {
            ...p,
            stock: (!currentBranchId || currentBranchId === 'all') ? newStockVal : (p.branchId === currentBranchId ? newStockVal : p.stock),
            branchStocks: updatedBranchStocks,
          };
        }
        return p;
      })
    );
  };

  // CUSTOMER MUTATORS
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const c: Customer = {
      ...newCust,
      id: `c_dynamic_${Date.now()}`,
      outstandingBalance: 0,
    };
    setCustomers((prev) => [...prev, c]);
  };

  const handleRecordCollection = (customerId: string, amount: number) => {
    // 1. Subtract from customer outstanding
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) }
          : c
      )
    );

    const targetCustomer = customers.find((c) => c.id === customerId);
    if (!targetCustomer) return;

    // 2. Deposit into bank account (Default to first cash account)
    setBankAccounts((prev) =>
      prev.map((b, idx) => (idx === 0 ? { ...b, balance: b.balance + amount } : b))
    );

    // 3. Log transaction ledger entry
    const newTx: Transaction = {
      id: `tx_dynamic_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Collection receipt from ${targetCustomer.name}`,
      type: 'Deposit',
      amount: amount,
      accountId: bankAccounts[0]?.id || 'b1',
      category: 'Dues Collection',
      referenceNo: `REC-${Date.now().toString().slice(-4)}`,
    };
    setTransactions((prev) => [...prev, newTx]);

    // 4. Update ledger accounts balances
    setAccountHeads((prev) =>
      prev.map((ah) => {
        if (ah.code === '1010') {
          // Cash in Hand
          return { ...ah, balance: ah.balance + amount };
        }
        if (ah.code === '1030') {
          // Accounts Receivable
          return { ...ah, balance: Math.max(0, ah.balance - amount) };
        }
        return ah;
      })
    );
  };

  // SALES / POS MUTATORS
  const handleAddInvoice = (newInvoice: Invoice) => {
    const invBranchId = newInvoice.branchId || (currentBranchId !== 'all' ? currentBranchId : undefined);
    const invoiceWithBranch = { ...newInvoice, branchId: invBranchId };

    // 1. Append invoice
    setInvoices((prev) => [...prev, invoiceWithBranch]);

    // 2. Subtract product stocks
    const invBranch = branches.find((b) => b.id === invBranchId);
    const isIndep = invBranch?.stockMode === 'independent';

    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = newInvoice.items.find((it) => it.productId === p.id);
        if (soldItem) {
          if (isIndep && invBranchId) {
            const currentIndepStock = p.branchStocks?.[invBranchId] ?? (p.branchId === invBranchId ? p.stock : 0);
            const updatedBranchStocks = {
              ...(p.branchStocks || {}),
              [invBranchId]: Math.max(0, currentIndepStock - soldItem.quantity),
            };
            return {
              ...p,
              branchStocks: updatedBranchStocks,
            };
          } else {
            // Shared branch or central main stock
            return {
              ...p,
              stock: Math.max(0, p.stock - soldItem.quantity),
            };
          }
        }
        return p;
      })
    );

    // 3. Calculate COGS for sold items using selected valuation method & batch tracking
    const valuationMethod = localStorage.getItem('nexova_valuation_method') || 'WAC';

    let currentBatches: any[] = [];
    try {
      const savedBatches = localStorage.getItem('nexova_batches');
      if (savedBatches) {
        currentBatches = JSON.parse(savedBatches);
      }
    } catch (e) {
      console.error('Error reading nexova_batches', e);
    }
    if (!currentBatches || currentBatches.length === 0) {
      currentBatches = DEFAULT_BATCHES;
    }

    let updatedBatches = [...currentBatches];
    let totalCOGS = 0;

    for (const item of newInvoice.items) {
      const prod = products.find((p) => p.id === item.productId);
      const qtySold = item.quantity || 1;
      const productObj = prod || { cost: item.price * 0.7 };

      // Calculate sale unit cost according to valuationMethod
      const unitCost = getUnitCostForSale(
        item.productId,
        qtySold,
        valuationMethod,
        updatedBatches,
        productObj
      );
      totalCOGS += unitCost * qtySold;

      // Consume batches and update batch tracking
      const res = consumeBatchesForSale(
        item.productId,
        qtySold,
        valuationMethod,
        updatedBatches,
        productObj
      );
      updatedBatches = res.updatedBatches;
    }

    // Save updated batches to localStorage & notify components
    localStorage.setItem('nexova_batches', JSON.stringify(updatedBatches));
    window.dispatchEvent(new Event('nexova_batches_updated'));

    // 4. Add to accounts / transactions depending on payment method
    if (newInvoice.paymentMethod === 'Credit') {
      // Add outstanding credit to customer
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newInvoice.customerId
            ? { ...c, outstandingBalance: c.outstandingBalance + newInvoice.total }
            : c
        )
      );

      // Log transaction for sales income
      const newTx: Transaction = {
        id: `tx_dynamic_${Date.now()}`,
        date: newInvoice.date,
        description: `Credit sale matching invoice ${newInvoice.invoiceNo}`,
        type: 'Deposit',
        amount: newInvoice.total,
        accountId: 'b1', // references Cash in Hand
        category: 'Sales Income',
        referenceNo: newInvoice.invoiceNo,
      };

      const cogsTx: Transaction = {
        id: `tx_cogs_${Date.now()}`,
        date: newInvoice.date,
        description: `Cost of Goods Sold for invoice ${newInvoice.invoiceNo}`,
        type: 'Expense',
        amount: totalCOGS,
        accountId: 'b1',
        category: 'Cost of Goods Sold',
        referenceNo: newInvoice.invoiceNo,
      };

      setTransactions((prev) => [...prev, newTx, ...(totalCOGS > 0 ? [cogsTx] : [])]);

      // Update Chart of accounts (Accounts Receivable, Revenue, COGS, Inventory Asset)
      setAccountHeads((prev) =>
        prev.map((ah) => {
          if (ah.code === '1030') {
            // Accounts Receivable increases (Debit)
            return { ...ah, balance: ah.balance + newInvoice.total };
          }
          if (ah.code === '4010') {
            // Sales Revenue increases (Credit)
            return { ...ah, balance: ah.balance + newInvoice.total };
          }
          if (ah.code === '5010') {
            // Cost of Goods Sold increases (Debit)
            return { ...ah, balance: ah.balance + totalCOGS };
          }
          if (ah.code === '1040') {
            // Merchandise Inventory decreases (Credit)
            return { ...ah, balance: Math.max(0, ah.balance - totalCOGS) };
          }
          return ah;
        })
      );
    } else {
      // Cash/Mobile Deposit instantly
      const targetBankIdx = newInvoice.paymentMethod === 'Mobile Banking' ? 2 : 0; // index of bank to deposit
      setBankAccounts((prev) =>
        prev.map((b, idx) =>
          idx === targetBankIdx ? { ...b, balance: b.balance + newInvoice.total } : b
        )
      );

      const newTx: Transaction = {
        id: `tx_dynamic_${Date.now()}`,
        date: newInvoice.date,
        description: `${newInvoice.paymentMethod} sale matching invoice ${newInvoice.invoiceNo}`,
        type: 'Deposit',
        amount: newInvoice.total,
        accountId: bankAccounts[targetBankIdx]?.id || 'b1',
        category: 'Sales Income',
        referenceNo: newInvoice.invoiceNo,
      };

      const cogsTx: Transaction = {
        id: `tx_cogs_${Date.now()}`,
        date: newInvoice.date,
        description: `Cost of Goods Sold for invoice ${newInvoice.invoiceNo}`,
        type: 'Expense',
        amount: totalCOGS,
        accountId: 'b1',
        category: 'Cost of Goods Sold',
        referenceNo: newInvoice.invoiceNo,
      };

      setTransactions((prev) => [...prev, newTx, ...(totalCOGS > 0 ? [cogsTx] : [])]);

      // Update Chart of accounts (Cash, Revenue, COGS, Inventory Asset)
      setAccountHeads((prev) =>
        prev.map((ah) => {
          if (ah.code === '1010') {
            // Cash in Hand increases (Debit)
            return { ...ah, balance: ah.balance + newInvoice.total };
          }
          if (ah.code === '4010') {
            // Sales Revenue increases (Credit)
            return { ...ah, balance: ah.balance + newInvoice.total };
          }
          if (ah.code === '5010') {
            // Cost of Goods Sold increases (Debit)
            return { ...ah, balance: ah.balance + totalCOGS };
          }
          if (ah.code === '1040') {
            // Merchandise Inventory decreases (Credit)
            return { ...ah, balance: Math.max(0, ah.balance - totalCOGS) };
          }
          return ah;
        })
      );
    }
  };

  // PURCHASE MUTATORS
  const handleAddSupplier = (newSup: Omit<Supplier, 'id' | 'outstandingBalance'>) => {
    const s: Supplier = {
      ...newSup,
      id: `s_dynamic_${Date.now()}`,
      outstandingBalance: 0,
    };
    setSuppliers((prev) => [...prev, s]);
  };

  const handleAddPurchaseOrder = (newPO: PurchaseOrder) => {
    const poBranchId = newPO.branchId || (currentBranchId !== 'all' ? currentBranchId : undefined);
    setPurchaseOrders((prev) => [...prev, { ...newPO, branchId: poBranchId }]);
  };

  const handleReceivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    // 1. Change PO status
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'Received' as const } : p))
    );

    const poBranchId = po.branchId || (currentBranchId !== 'all' ? currentBranchId : undefined);
    const poBranch = branches.find((b) => b.id === poBranchId);
    const isIndep = poBranch?.stockMode === 'independent';

    // 2. Replenish inventory product stocks
    setProducts((prev) =>
      prev.map((p) => {
        const item = po.items.find((line) => line.productId === p.id);
        if (item) {
          if (isIndep && poBranchId) {
            const currentIndepStock = p.branchStocks?.[poBranchId] ?? (p.branchId === poBranchId ? p.stock : 0);
            const updatedBranchStocks = {
              ...(p.branchStocks || {}),
              [poBranchId]: currentIndepStock + item.quantity,
            };
            return {
              ...p,
              branchStocks: updatedBranchStocks,
            };
          } else {
            return { ...p, stock: p.stock + item.quantity };
          }
        }
        return p;
      })
    );

    // 3. Increase Supplier outstanding balance (Payables credit ledger)
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === po.supplierId ? { ...s, outstandingBalance: s.outstandingBalance + po.total } : s
      )
    );

    // 4. Log Inventory asset replenishment transaction ledger (NOT Cost of Goods Sold!)
    const newTx: Transaction = {
      id: `tx_dynamic_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Replenished merchandise inventory matching PO ${po.poNo}`,
      type: 'Deposit',
      amount: po.total,
      accountId: 'b1',
      category: 'Inventory',
      referenceNo: po.poNo,
    };
    setTransactions((prev) => [...prev, newTx]);

    // 5. Update chart of accounts (Accounts Payable increases & Merchandise Inventory Asset increases)
    setAccountHeads((prev) =>
      prev.map((ah) => {
        if (ah.code === '2010') {
          // Accounts Payable increases (Credit Liability)
          return { ...ah, balance: ah.balance + po.total };
        }
        if (ah.code === '1040') {
          // Merchandise Inventory increases (Debit Asset)
          return { ...ah, balance: ah.balance + po.total };
        }
        return ah;
      })
    );
  };

  // HRM MUTATORS
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const e: Employee = {
      ...newEmp,
      id: `e_dynamic_${Date.now()}`,
    };
    setEmployees((prev) => [...prev, e]);
  };

  const handleUpdateAttendance = (employeeId: string, status: Attendance['status']) => {
    const targetEmployee = employees.find((e) => e.id === employeeId);
    if (!targetEmployee) return;

    const todayDate = new Date().toISOString().split('T')[0];

    setAttendances((prev) => {
      const existing = prev.find((a) => a.employeeId === employeeId && a.date === todayDate);
      if (existing) {
        return prev.map((a) =>
          a.employeeId === employeeId && a.date === todayDate
            ? {
                ...a,
                status,
                checkIn: status === 'Present' ? '08:50 AM' : status === 'Late' ? '09:25 AM' : '—',
                checkOut: status === 'Present' || status === 'Late' ? '05:00 PM' : '—',
              }
            : a
        );
      } else {
        const newAtt: Attendance = {
          id: `att_dynamic_${Date.now()}`,
          employeeId,
          employeeName: targetEmployee.name,
          date: todayDate,
          status,
          checkIn: status === 'Present' ? '08:50 AM' : status === 'Late' ? '09:25 AM' : '—',
          checkOut: status === 'Present' || status === 'Late' ? '05:00 PM' : '—',
        };
        return [...prev, newAtt];
      }
    });
  };

  // BANKING & LOAN MUTATORS
  const handleAddBankAccount = (newBank: Omit<BankAccount, 'id' | 'balance'>) => {
    const b: BankAccount = {
      ...newBank,
      id: `b_dynamic_${Date.now()}`,
      balance: 0,
    };
    setBankAccounts((prev) => [...prev, b]);
  };

  const handleAddLoan = (newLoan: Omit<LoanAccount, 'id' | 'accountNo' | 'disbursedAmount' | 'outstandingAmount' | 'status'>) => {
    const accountNo = `LN-DBBL-2026-${400 + loanAccounts.length}`;
    const l: LoanAccount = {
      ...newLoan,
      id: `l_dynamic_${Date.now()}`,
      accountNo,
      disbursedAmount: newLoan.amount,
      outstandingAmount: newLoan.amount,
      status: 'Active',
    };
    setLoanAccounts((prev) => [...prev, l]);
  };

  const handleLogTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_dynamic_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions((prev) => [...prev, newTx]);

    // Deduct or deposit from bank account
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === tx.accountId) {
          const delta = tx.type === 'Deposit' || tx.type === 'Income' ? tx.amount : -tx.amount;
          return { ...b, balance: b.balance + delta };
        }
        return b;
      })
    );

    // Update Chart of accounts balances
    setAccountHeads((prev) =>
      prev.map((ah) => {
        if (ah.code === '1010') {
          // Cash in Hand adjusted
          const delta = tx.type === 'Deposit' || tx.type === 'Income' ? tx.amount : -tx.amount;
          return { ...ah, balance: ah.balance + delta };
        }
        return ah;
      })
    );
  };

  const handleResetData = async () => {
    setLoading(true);
    try {
      // Clear all localStorage keys starting with 'nexova_' except user login session
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nexova_') && key !== 'nexova_current_user') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Explicitly synchronize all collections to Firestore with the initial demo data
      await syncCollectionToFirestore('products', INITIAL_PRODUCTS);
      await syncCollectionToFirestore('customers', INITIAL_CUSTOMERS);
      await syncCollectionToFirestore('suppliers', INITIAL_SUPPLIERS);
      await syncCollectionToFirestore('invoices', INITIAL_INVOICES);
      await syncCollectionToFirestore('purchaseOrders', INITIAL_PO);
      await syncCollectionToFirestore('bankAccounts', INITIAL_BANK_ACCOUNTS);
      await syncCollectionToFirestore('transactions', INITIAL_TRANSACTIONS);
      await syncCollectionToFirestore('accountHeads', INITIAL_ACCOUNT_HEADS);
      await syncCollectionToFirestore('employees', INITIAL_EMPLOYEES);
      await syncCollectionToFirestore('attendances', INITIAL_ATTENDANCE);
      await syncCollectionToFirestore('loanAccounts', INITIAL_LOANS);

      const defaultSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        isDbSeeded: true
      };
      await saveSettingsToFirestore(defaultSettings);
      localStorage.setItem('nexova_app_settings', JSON.stringify(defaultSettings));

      setProducts(INITIAL_PRODUCTS);
      setCustomers(INITIAL_CUSTOMERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setInvoices(INITIAL_INVOICES);
      setPurchaseOrders(INITIAL_PO);
      setBankAccounts(INITIAL_BANK_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setAccountHeads(INITIAL_ACCOUNT_HEADS);
      setEmployees(INITIAL_EMPLOYEES);
      setAttendances(INITIAL_ATTENDANCE);
      setLoanAccounts(INITIAL_LOANS);
      setSettings(defaultSettings);

      window.location.reload();
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("ডেটা রিসেট করতে সমস্যা হয়েছে: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    setLoading(true);
    try {
      // Clear all localStorage keys starting with 'nexova_' except user login session
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nexova_') && key !== 'nexova_current_user') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Explicitly empty out all collections in Firestore
      await syncCollectionToFirestore('products', []);
      await syncCollectionToFirestore('customers', []);
      await syncCollectionToFirestore('suppliers', []);
      await syncCollectionToFirestore('invoices', []);
      await syncCollectionToFirestore('purchaseOrders', []);
      await syncCollectionToFirestore('bankAccounts', []);
      await syncCollectionToFirestore('transactions', []);
      await syncCollectionToFirestore('accountHeads', []);
      await syncCollectionToFirestore('employees', []);
      await syncCollectionToFirestore('attendances', []);
      await syncCollectionToFirestore('loanAccounts', []);

      const emptySettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        isDbSeeded: true
      };
      await saveSettingsToFirestore(emptySettings);
      localStorage.setItem('nexova_app_settings', JSON.stringify(emptySettings));

      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setInvoices([]);
      setPurchaseOrders([]);
      setBankAccounts([]);
      setTransactions([]);
      setAccountHeads([]);
      setEmployees([]);
      setAttendances([]);
      setLoanAccounts([]);
      setSettings(emptySettings);

      window.location.reload();
    } catch (error) {
      console.error("Error clearing all data:", error);
      alert("ডেটা মুছতে সমস্যা হয়েছে: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = (importedData: any) => {
    try {
      if (importedData.products) setProducts(importedData.products);
      if (importedData.customers) setCustomers(importedData.customers);
      if (importedData.suppliers) setSuppliers(importedData.suppliers);
      if (importedData.invoices) setInvoices(importedData.invoices);
      if (importedData.purchaseOrders) setPurchaseOrders(importedData.purchaseOrders);
      if (importedData.bankAccounts) setBankAccounts(importedData.bankAccounts);
      if (importedData.transactions) setTransactions(importedData.transactions);
      if (importedData.accountHeads) setAccountHeads(importedData.accountHeads);
      if (importedData.employees) setEmployees(importedData.employees);
      if (importedData.attendances) setAttendances(importedData.attendances);
      if (importedData.loanAccounts) setLoanAccounts(importedData.loanAccounts);
      if (importedData.settings) {
        setSettings(importedData.settings);
        localStorage.setItem('nexova_app_settings', JSON.stringify(importedData.settings));
      }
      alert('System Database imported successfully!');
    } catch (err) {
      alert('Failed to import database. Invalid JSON schema.');
    }
  };

  const systemData = {
    products,
    customers,
    suppliers,
    invoices,
    purchaseOrders,
    bankAccounts,
    transactions,
    accountHeads,
    employees,
    attendances,
    loanAccounts,
    settings,
  };

  // Handle high-level shortcut routing from Dashboard view
  const handleTabChange = (tab: string, subTab: string = '') => {
    // Check if navigating to a different tab or subtab
    if (currentTab !== tab || currentSubTab !== subTab) {
      let hasUnsavedChanges = false;
      if (currentTab === 'sales' && posCart.length > 0) {
        hasUnsavedChanges = true;
      }
      if (currentTab === 'purchase' && purchasePoCart.length > 0) {
        hasUnsavedChanges = true;
      }

      if (hasUnsavedChanges) {
        setPendingNavigation({ tab, subTab });
        return; // Open custom confirmation modal instead of blocking synchronously
      }
    }

    setCurrentTab(tab);
    setCurrentSubTab(subTab);
    openWindow(tab, subTab);
    
    // Track recent navigation item visits
    const matchedItem = navEngine.getAllItems().find(item => item.tab === tab && item.subTab === subTab);
    if (matchedItem) {
      navEngine.addRecent(matchedItem.id);
    }
  };

  const handleConfirmNavigation = () => {
    if (!pendingNavigation) return;
    const { tab, subTab } = pendingNavigation;
    setCurrentTab(tab);
    setCurrentSubTab(subTab);
    openWindow(tab, subTab);
    
    // Track recent navigation item visits
    const matchedItem = navEngine.getAllItems().find(item => item.tab === tab && item.subTab === subTab);
    if (matchedItem) {
      navEngine.addRecent(matchedItem.id);
    }
    setPendingNavigation(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4 font-sans select-none">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin"></div>
          <div className="absolute font-black text-xs text-indigo-400">A</div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-black tracking-tight text-slate-100">M/S Madani Traders Cloud</h2>
          <p className="text-[11px] text-slate-400 font-medium font-mono">Initializing Firestore Real-Time Database Connection (asia-southeast1)...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <ErrorBoundary variant="full">
        <Login settings={settings} onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary variant="full">
      <div className="flex h-screen bg-slate-50 text-slate-700 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} currentSubTab={currentSubTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header bar with Clock */}
        <Header
          currentTab={currentTab}
          currentSubTab={currentSubTab}
          onTabChange={handleTabChange}
          settings={settings}
          isVisualEditMode={isVisualEditMode}
          onToggleVisualEditMode={() => setIsVisualEditMode(!isVisualEditMode)}
          currentUser={currentUser}
          onLogout={handleLogout}
          branches={branches}
          currentBranchId={currentBranchId}
          onBranchSelect={(id) => {
            setCurrentBranchId(id);
            localStorage.setItem('nexova_current_branch_id', id);
          }}
        />

        {/* Dynamic content render views */}
        {(() => {
          const userRole = (currentUser?.role || '').toLowerCase();
          const isAdmin = !currentUser?.role || userRole === 'admin' || userRole === 'administrator';
          let isBackupOverdue = false;
          if (isAdmin) {
            if (!settings?.lastBackupAt) {
              isBackupOverdue = true;
            } else {
              const lastTime = new Date(settings.lastBackupAt).getTime();
              if (isNaN(lastTime)) {
                isBackupOverdue = true;
              } else {
                const daysElapsed = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
                isBackupOverdue = daysElapsed >= 7;
              }
            }
          }

          return (
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20">
              {/* Scheduled Backup Reminder Banner for Administrator */}
              {isBackupOverdue && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                      <Save className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-amber-800 uppercase tracking-wide text-[10px] block">
                        Automatic Backup Reminder (শিডিউলড ব্যাকআপ রিমাইন্ডার)
                      </span>
                      <span className="font-medium">
                        {settings?.lastBackupAt
                          ? `সর্বশেষ ব্যাকআপ নেওয়া হয়েছিল ${Math.floor((Date.now() - new Date(settings.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))} দিন আগে (${new Date(settings.lastBackupAt).toLocaleDateString()})। ডাটা নিরাপত্তার জন্য নতুন একটি ব্যাকআপ ডাউনলোড করুন।`
                          : 'এখনও পর্যন্ত কোনো ব্যাকআপ ডাউনলোড করা হয়নি। ডাটা নিরাপদ রাখতে এখন একটি ব্যাকআপ এক্সপোর্ট করুন।'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTabChange('banking', 'backup')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Backup Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DEFAULT DESKTOP WORKSPACE (EXECUTIVE DASHBOARD) WHEN ALL WINDOWS ARE MINIMIZED */}
              {!hasActiveUnminimizedWindow && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 text-slate-100 rounded-xl border border-slate-800 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-bold text-xs font-display text-slate-100">
                        নেক্সোভা ডেস্কটপ (Nexova Desktop) — নির্বাহী ড্যাশবোর্ড
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ডেস্কটপ ভিউ
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                      সব উইন্ডো মিনিমাইজড। নিচে টাস্কবার থেকে যেকোনো উইন্ডো নির্বাচন করুন।
                    </span>
                  </div>

                  <ErrorBoundary variant="section" sectionName="Dashboard Module">
                    <DashboardView
                      products={products}
                      customers={customers}
                      invoices={invoices}
                      suppliers={suppliers}
                      purchaseOrders={purchaseOrders}
                      bankAccounts={bankAccounts}
                      loanAccounts={loanAccounts}
                      employees={employees}
                      transactions={transactions}
                      attendances={attendances}
                      onTabChange={handleTabChange}
                      isVisualEditMode={isVisualEditMode}
                      activeSubTab={currentSubTab}
                      currentBranchId={currentBranchId}
                      branches={branches}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {windows.map((win) => {
                const isWinActive = win.isActive && !win.isMinimized;
                const tabKey = win.tab;
                const subTabKey = win.subTab || currentSubTab;

                return (
                  <div
                    key={win.id}
                    className={isWinActive ? "block space-y-4 animate-in fade-in duration-150" : "hidden"}
                  >
                    {tabKey !== 'excel-import' && (
                      <WindowHeader id={win.id} title={win.title} iconName={win.iconName} />
                    )}

                    {tabKey === 'dashboard' && (
            <ErrorBoundary variant="section" sectionName="Dashboard Module">
              <DashboardView
                products={products}
                customers={customers}
                invoices={invoices}
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                bankAccounts={bankAccounts}
                loanAccounts={loanAccounts}
                employees={employees}
                transactions={transactions}
                attendances={attendances}
                onTabChange={handleTabChange}
                isVisualEditMode={isVisualEditMode}
                activeSubTab={currentSubTab}
                currentBranchId={currentBranchId}
                branches={branches}
              />
            </ErrorBoundary>
          )}

          {tabKey === 'inventory' && (
            <ErrorBoundary variant="section" sectionName="Inventory Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <InventoryView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateStock={handleEditStock}
                  onDeleteProduct={(id: string) => setProducts((prev) => prev.filter((p) => p.id !== id))}
                  activeSubTab={subTabKey}
                  onUpdateProducts={setProducts}
                  currentUser={currentUser}
                  invoices={invoices}
                  purchaseOrders={purchaseOrders}
                  currentBranchId={currentBranchId}
                  branches={branches}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'sales' && (
            <ErrorBoundary variant="section" sectionName="Sales & Billing Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <SalesView
                  products={products}
                  customers={customers}
                  invoices={invoices}
                  onAddInvoice={handleAddInvoice}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomers={setCustomers}
                  onRecordCollection={handleRecordCollection}
                  activeSubTab={subTabKey}
                  onSubTabChange={setCurrentSubTab}
                  settings={settings}
                  currentUser={currentUser}
                  currentBranchId={currentBranchId}
                  branches={branches}

                  // Pass lifted states
                  cart={posCart}
                  setCart={setPosCart}
                  selectedCustomerId={posSelectedCustomerId}
                  setSelectedCustomerId={setPosSelectedCustomerId}
                  paymentMethod={posPaymentMethod}
                  setPaymentMethod={setPosPaymentMethod}
                  discount={posDiscount}
                  setDiscount={setPosDiscount}
                  invoiceNoInput={posInvoiceNoInput}
                  setInvoiceNoInput={setPosInvoiceNoInput}
                  invoiceDateInput={posInvoiceDateInput}
                  setInvoiceDateInput={setPosInvoiceDateInput}
                  receivedByInput={posReceivedByInput}
                  setReceivedByInput={setPosReceivedByInput}
                  recipientAddressInput={posRecipientAddressInput}
                  setRecipientAddressInput={setPosRecipientAddressInput}
                  mobileNoInput={posMobileNoInput}
                  setMobileNoInput={setPosMobileNoInput}
                  orderIdInput={posOrderIdInput}
                  setOrderIdInput={setPosOrderIdInput}
                  labourCost={posLabourCost}
                  setLabourCost={setPosLabourCost}
                  transportCost={posTransportCost}
                  setTransportCost={setPosTransportCost}
                  nowPayInput={posNowPayInput}
                  setNowPayInput={setPosNowPayInput}
                  transTypeInput={posTransTypeInput}
                  setTransTypeInput={setPosTransTypeInput}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'purchase' && (
            <ErrorBoundary variant="section" sectionName="Purchase & Inbound Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <PurchaseView
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  products={products}
                  onAddSupplier={handleAddSupplier}
                  onUpdateSuppliers={setSuppliers}
                  onAddPurchaseOrder={handleAddPurchaseOrder}
                  onReceivePurchaseOrder={handleReceivePurchaseOrder}
                  activeSubTab={subTabKey}
                  onTabChange={handleTabChange}
                  currentUser={currentUser}
                  settings={settings}
                  currentBranchId={currentBranchId}
                  branches={branches}

                  // Pass lifted states
                  poCart={purchasePoCart}
                  setPoCart={setPurchasePoCart}
                  selectedSupplierId={purchaseSelectedSupplierId}
                  setSelectedSupplierId={setPurchaseSelectedSupplierId}
                  poInvoiceNo={purchasePoInvoiceNo}
                  setPoInvoiceNo={setPurchasePoInvoiceNo}
                  poDate={purchasePoDate}
                  setPoDate={setPurchasePoDate}
                  poDiscount={purchasePoDiscount}
                  setPoDiscount={setPurchasePoDiscount}
                  poTransport={purchasePoTransport}
                  setPoTransport={setPurchasePoTransport}
                  poLabour={purchasePoLabour}
                  setPoLabour={setPurchasePoLabour}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'employee' && (
            <ErrorBoundary variant="section" sectionName="HR & Employee Management Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <EmployeeView
                  employees={employees}
                  attendances={attendances}
                  onAddEmployee={handleAddEmployee}
                  onUpdateAttendance={handleUpdateAttendance}
                  activeSubTab={subTabKey}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'accounting' && (
            <ErrorBoundary variant="section" sectionName="General Ledger & Accounting Module">
              {subTabKey === 'assets' ? (
                <FixedAssetsView activeSubTab={subTabKey} currentUser={currentUser} />
              ) : (
                <AccountingView
                  accountHeads={accountHeads}
                  transactions={transactions}
                  bankAccounts={bankAccounts}
                  onLogTransaction={handleLogTransaction}
                  activeSubTab={subTabKey}
                  settings={settings}
                />
              )}
            </ErrorBoundary>
          )}

          {(tabKey === 'banking' || tabKey === 'loan' || tabKey === 'settings') && (
            <ErrorBoundary variant="section" sectionName="Banking, Loans & Settings Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <BankingAndLoanView
                  bankAccounts={bankAccounts}
                  loanAccounts={loanAccounts}
                  transactions={transactions}
                  currentTab={tabKey as 'banking' | 'loan' | 'settings'}
                  activeSubTab={subTabKey}
                  onAddBankAccount={handleAddBankAccount}
                  onAddLoan={handleAddLoan}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onResetData={handleResetData}
                  onClearAllData={handleClearAllData}
                  onImportData={handleImportData}
                  systemData={systemData}
                  currentUser={currentUser}
                  onBranchChange={() => {
                    const saved = localStorage.getItem('nexova_branches_v2');
                    if (saved) {
                      try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          setBranches(parsed);
                        }
                      } catch (e) {}
                    }
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'reports' && (
            <ErrorBoundary variant="section" sectionName="Standard PDF & Ledger Reports Module">
              <Suspense fallback={<LazyLoadingFallback />}>
                <ReportsView
                  products={products}
                  customers={customers}
                  suppliers={suppliers}
                  invoices={invoices}
                  purchaseOrders={purchaseOrders}
                  bankAccounts={bankAccounts}
                  transactions={transactions}
                  accountHeads={accountHeads}
                  employees={employees}
                  activeSubTab={subTabKey}
                  currentUser={currentUser}
                  onUpdateInvoices={setInvoices}
                  onUpdateTransactions={setTransactions}
                  onUpdatePurchaseOrders={setPurchaseOrders}
                  onUpdateCustomers={setCustomers}
                  onUpdateSuppliers={setSuppliers}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {tabKey === 'gridReport' && (
            <ErrorBoundary variant="section" sectionName="Dynamic Custom Grid Reports Module">
              <GridReportView
                products={products}
                customers={customers}
                suppliers={suppliers}
                invoices={invoices}
                transactions={transactions}
                onUpdateProducts={setProducts}
                onUpdateInvoices={setInvoices}
                onUpdateCustomers={setCustomers}
                onUpdateSuppliers={setSuppliers}
                onUpdateTransactions={setTransactions}
                isVisualEditMode={isVisualEditMode}
                currentSubTab={subTabKey}
              />
            </ErrorBoundary>
          )}

          {tabKey === 'rdlReport' && (
            <ErrorBoundary variant="section" sectionName="RDL Template Report Builder Module">
              <RdlReportView
                products={products}
                customers={customers}
                suppliers={suppliers}
                invoices={invoices}
                transactions={transactions}
                isVisualEditMode={isVisualEditMode}
                currentSubTab={subTabKey}
              />
            </ErrorBoundary>
          )}

          {tabKey === 'crm' && (
            <ErrorBoundary variant="section" sectionName="CRM & Leads Module">
              <CRMView activeSubTab={subTabKey} currentUser={currentUser} />
            </ErrorBoundary>
          )}

          {tabKey === 'projects' && (
            <ErrorBoundary variant="section" sectionName="Projects & Timesheets Module">
              <ProjectsView activeSubTab={subTabKey} currentUser={currentUser} />
            </ErrorBoundary>
          )}

          {tabKey === 'manufacturing' && (
            <ErrorBoundary variant="section" sectionName="Manufacturing Production Module">
              <ManufacturingView
                activeSubTab={subTabKey}
                currentUser={currentUser}
                products={products}
                setProducts={setProducts}
                transactions={transactions}
                setTransactions={setTransactions}
                accountHeads={accountHeads}
                setAccountHeads={setAccountHeads}
              />
            </ErrorBoundary>
          )}

          {tabKey === 'service' && (
            <ErrorBoundary variant="section" sectionName="Service Tickets & Helpdesk Module">
              <ServiceView activeSubTab={subTabKey} currentUser={currentUser} />
            </ErrorBoundary>
          )}

          {tabKey === 'documents' && (
            <ErrorBoundary variant="section" sectionName="Document Repository & Contracts Module">
              <DocumentsView activeSubTab={subTabKey} />
            </ErrorBoundary>
          )}

          {tabKey === 'workflow' && (
            <ErrorBoundary variant="section" sectionName="Business Workflow Approval Engine">
              <WorkflowView activeSubTab={subTabKey} />
            </ErrorBoundary>
          )}

          {tabKey === 'ai' && (
            <ErrorBoundary variant="section" sectionName="Gemini AI Assistant Module">
              <AIView
                activeSubTab={subTabKey}
                settings={settings}
                products={products}
                customers={customers}
                suppliers={suppliers}
                invoices={invoices}
                purchaseOrders={purchaseOrders}
                bankAccounts={bankAccounts}
                transactions={transactions}
                employees={employees}
              />
            </ErrorBoundary>
          )}

          {tabKey === 'integration' && (
            <ErrorBoundary variant="section" sectionName="Third-Party Integration Engine">
              <IntegrationView activeSubTab={subTabKey} />
            </ErrorBoundary>
          )}

          {/* Quick empty fallback screen for other secondary/reports links to prevent app crashes */}
          {!['dashboard', 'inventory', 'sales', 'purchase', 'employee', 'accounting', 'banking', 'loan', 'settings', 'reports', 'gridReport', 'rdlReport', 'crm', 'projects', 'manufacturing', 'service', 'documents', 'workflow', 'ai', 'integration'].includes(
            tabKey
          ) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <span className="text-4xl">📊</span>
              <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wide">
                Interactive Analytical Module
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The requested sub-report is compiled dynamically on our cloud-ledger engine. Use the core operational screens in the sidebar to buy standard stock items, run checkouts, track staff check-ins, or check real-time P&L margins.
              </p>
              <button
                onClick={() => handleTabChange('dashboard')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Return to Dashboard View
              </button>
            </div>
          )}
                  </div>
                );
              })}
            </main>
      );
    })()}
      </div>

      {/* Taskbar OS-style dock */}
      <Taskbar currentUser={currentUser} />
    </div>

    {/* Beautiful Global Neo-brutalist Alert Modal */}
    {globalAlert && (
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in"
        onClick={() => setGlobalAlert(null)}
      >
        <div 
          className="bg-white border-2 border-slate-800 rounded-xl w-full max-w-md shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header depending on type */}
          <div className={`p-4 flex items-center gap-3 border-b-2 border-slate-800 ${
            globalAlert.type === 'error' ? 'bg-rose-50 text-rose-800' :
            globalAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
            'bg-indigo-50 text-indigo-800'
          }`}>
            <span className="text-xl">
              {globalAlert.type === 'error' ? '⚠️' :
               globalAlert.type === 'success' ? '✅' :
               'ℹ️'}
            </span>
            <h3 className="font-black text-xs uppercase tracking-wider font-display">
              {globalAlert.title}
            </h3>
          </div>

          {/* Message Body */}
          <div className="p-5">
            <p className="text-slate-700 font-bold text-xs leading-relaxed whitespace-pre-line text-left">
              {globalAlert.message}
            </p>
          </div>

          {/* Footer with action button */}
          <div className="bg-slate-50 px-4 py-3 border-t-2 border-slate-800 flex justify-end">
            <button
              onClick={() => setGlobalAlert(null)}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider rounded-lg border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer ${
                globalAlert.type === 'error' ? 'bg-rose-500 hover:bg-rose-600 text-white' :
                globalAlert.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              Okay, Understood
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Custom Unsaved Changes Confirmation Modal */}
    {pendingNavigation && (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden scale-in-95 duration-150">
          <div className="p-6 text-left">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <span className="text-xl font-bold">⚠️</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  অসংরক্ষিত পরিবর্তন! / Unsaved Changes!
                </h3>
                <p className="text-xs text-slate-400">এ্যাকশনটি সতর্কতার সাথে সম্পন্ন করুন</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 border-y border-slate-100 py-4 my-4">
              <p className="font-semibold text-slate-800">
                আপনার এই পাতায় অসংরক্ষিত পরিবর্তন আছে। আপনি কি নিশ্চিত পাতা ত্যাগ করতে চান?
              </p>
              <p className="text-slate-500">
                You have unsaved changes on this page. Are you sure you want to leave? Your in-progress cart items or draft data will remain in memory, but this action will transition you to the new tab.
              </p>
              <p className="text-[10px] text-orange-500 font-medium">⚠️ সতর্কতা: পাতা ত্যাগ করার পর পরবর্তী কাজগুলো ফ্রেশ শুরু করা সম্ভব হবে না।</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingNavigation(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                বাতিল করুন (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmNavigation}
                className="px-5 py-2 text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                চলে যান (Leave)
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <WindowManagerProvider>
      <AppContent />
    </WindowManagerProvider>
  );
}
