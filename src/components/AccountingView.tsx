import React, { useState } from 'react';
import { validateRequired, validatePositiveNumber } from '../lib/validation';
import { AccountHead, Transaction, BankAccount, AppSettings, getSystemDate } from '../types';
import {
  BookOpen,
  Calculator,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  Briefcase,
  Users,
  Settings,
  Edit3,
  Trash2,
} from 'lucide-react';

interface AccountingViewProps {
  accountHeads: AccountHead[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  onLogTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  activeSubTab?: string;
  settings?: AppSettings;
}

export default function AccountingView({
  accountHeads,
  transactions,
  bankAccounts,
  onLogTransaction,
  activeSubTab = 'chart_accounts',
  settings,
}: AccountingViewProps) {
  // Map sidebar activeSubTab to internal views
  const currentTab = ['chart_accounts', 'journal_entries', 'payments', 'income', 'income_categories', 'expenses', 'expense_categories', 'ledger', 'budget'].includes(activeSubTab)
    ? activeSubTab
    : 'chart_accounts';

  // --- LOCAL PERSISTENCE FOR CATEGORIES ---
  const [incomeCategories, setIncomeCategories] = useState<string[]>([
    'Sales Income',
    'Other Revenue',
    'Interest Credit',
    'Rental Income',
    'Service Commission',
  ]);

  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'Office Supplies',
    'Cost of Goods Sold',
    'Utilities Expense',
    'Marketing Expense',
    'Office Rent',
    'Wages & Salaries',
    'Entertainment',
  ]);

  // Ledger Audit State & Budget Allocation State
  const [ledgerAuditEntries, setLedgerAuditEntries] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_ledger_audit_entries');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "tx_01", date: "2026-07-01", refNo: "JV-2026-001", debitAccount: "Cash in Hand", creditAccount: "Sales Income", amount: 25000, status: "Matched", notes: "Standard cash sale ledger match" },
      { id: "tx_02", date: "2026-07-04", refNo: "JV-2026-002", debitAccount: "Office Rent Expense", creditAccount: "MTB Bank Account", amount: 15000, status: "Matched", notes: "Monthly rental settlement" },
      { id: "tx_03", date: "2026-07-05", refNo: "JV-2026-003", debitAccount: "Raw Materials Purchase", creditAccount: "Accounts Payable", amount: 48000, status: "Discrepancy", notes: "Pending supplier invoice matching" }
    ];
  });

  const [budgetAllocations, setBudgetAllocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_budget_allocations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "b_1", department: "Marketing", allocated: 120000, spent: 85000, quarter: "Q3 2026" },
      { id: "b_2", department: "Operations", allocated: 350000, spent: 310000, quarter: "Q3 2026" },
      { id: "b_3", department: "IT & Infrastructure", allocated: 200000, spent: 145000, quarter: "Q3 2026" },
      { id: "b_4", department: "HR & Admin", allocated: 90000, spent: 88000, quarter: "Q3 2026" }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('nexova_ledger_audit_entries', JSON.stringify(ledgerAuditEntries));
  }, [ledgerAuditEntries]);

  React.useEffect(() => {
    localStorage.setItem('nexova_budget_allocations', JSON.stringify(budgetAllocations));
  }, [budgetAllocations]);

  // Ledger Add Entry Forms
  const [showNewLedgerModal, setShowNewLedgerModal] = useState(false);
  const [newLgRef, setNewLgRef] = useState('');
  const [newLgDebit, setNewLgDebit] = useState('');
  const [newLgCredit, setNewLgCredit] = useState('');
  const [newLgAmount, setNewLgAmount] = useState(0);
  const [newLgNotes, setNewLgNotes] = useState('');
  const [ledgerFilterStatus, setLedgerFilterStatus] = useState('All');

  // Budget Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBgDept, setNewBgDept] = useState('');
  const [newBgAllocated, setNewBgAllocated] = useState(0);
  const [newBgQuarter, setNewBgQuarter] = useState('Q3 2026');
  const [budgetEditObj, setBudgetEditObj] = useState<any>(null);

  // Account Heads state extension
  const [localAccountHeads, setLocalAccountHeads] = useState<AccountHead[]>(accountHeads);

  React.useEffect(() => {
    setLocalAccountHeads(accountHeads);
  }, [accountHeads]);

  // --- FORM MODAL STATES ---
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catModalType, setCatModalType] = useState<'income' | 'expense'>('income');

  // --- INPUT FIELD STATES ---
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Transaction Entry
  const [desc, setDesc] = useState('');
  const [txType, setTxType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id || '');
  const [category, setCategory] = useState('Office Supplies');

  // Account Head Entry
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountHead['type']>('Asset');
  const [accBalance, setAccBalance] = useState('');

  // Category Entry
  const [newCatName, setNewCatName] = useState('');

  // --- EDIT CATEGORIES STATE ---
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatType, setEditingCatType] = useState<'income' | 'expense'>('income');
  const [editingCatNewName, setEditingCatNewName] = useState('');

  // --- EDIT & DELETE HANDLERS ---
  const handleDeleteCategory = (catName: string, type: 'income' | 'expense') => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      if (type === 'income') {
        setIncomeCategories(incomeCategories.filter(c => c !== catName));
      } else {
        setExpenseCategories(expenseCategories.filter(c => c !== catName));
      }
    }
  };

  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatName || !editingCatNewName) return;
    if (editingCatType === 'income') {
      setIncomeCategories(incomeCategories.map(c => c === editingCatName ? editingCatNewName : c));
    } else {
      setExpenseCategories(expenseCategories.map(c => c === editingCatName ? editingCatNewName : c));
    }
    setEditingCatName(null);
    setEditingCatNewName('');
  };

  // --- SUBMIT HANDLERS ---
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const descVal = validateRequired(desc, 'Transaction Description', 'লেনদেনের বিবরণ');
    if (!descVal.isValid) errors.desc = descVal.message;

    const amountVal = validatePositiveNumber(parseFloat(amount) || 0, 'Amount', 'পরিমাণ', false);
    if (!amountVal.isValid) errors.amount = amountVal.message;

    if (!accountId) {
      errors.accountId = 'Please select a bank account/asset (অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট সিলেক্ট করুন)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    onLogTransaction({
      description: desc,
      type: txType,
      amount: parseFloat(amount),
      accountId: accountId,
      category: category,
      referenceNo: `JV-${1000 + transactions.length + 1}`,
    });

    // Update the local account head balance dynamically for instant visual updates
    const headToUpdate = localAccountHeads.find(ah => ah.name === category);
    if (headToUpdate) {
      setLocalAccountHeads(prev => prev.map(ah => {
        if (ah.id === headToUpdate.id) {
          const delta = txType === 'Income' ? parseFloat(amount) : -parseFloat(amount);
          return { ...ah, balance: ah.balance + delta };
        }
        return ah;
      }));
    }

    setDesc('');
    setAmount('');
    setShowTxModal(false);
  };

  const handleAccSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accCode || !accName || !accBalance) return;

    const newHead: AccountHead = {
      id: `acc_head_${Date.now()}`,
      code: accCode,
      name: accName,
      type: accType,
      balance: parseFloat(accBalance),
    };

    setLocalAccountHeads([...localAccountHeads, newHead]);
    setAccCode('');
    setAccName('');
    setAccBalance('');
    setShowAccModal(false);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    if (catModalType === 'income') {
      setIncomeCategories([...incomeCategories, newCatName]);
    } else {
      setExpenseCategories([...expenseCategories, newCatName]);
    }

    setNewCatName('');
    setShowCatModal(false);
  };

  // --- DERIVE PROFIT & LOSS STATS ---
  const totalSalesRevenue = transactions
    .filter((t) => t.category === 'Sales Income' || t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const costOfGoods = transactions
    .filter((t) => t.category === 'Cost of Goods Sold' || t.category === 'Inventory Procurement')
    .reduce((sum, t) => sum + t.amount, 0);

  const operatingExpenses = transactions
    .filter((t) => t.type === 'Expense' && t.category !== 'Cost of Goods Sold' && t.category !== 'Manufacturing Cost')
    .reduce((sum, t) => sum + t.amount, 0);

  const grossProfit = totalSalesRevenue - costOfGoods;
  const netProfit = grossProfit - operatingExpenses;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* =========================================
          TAB 1: CHART OF ACCOUNTS
          ========================================= */}
      {currentTab === 'chart_accounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Chart of Accounts (COA)</h2>
              <p className="text-xs text-slate-400 mt-1">General ledger ledger index organizing assets, liabilities, equities, revenues, and operating expenses.</p>
            </div>
            <button
              onClick={() => setShowAccModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all self-start"
            >
              <Plus className="h-4 w-4" />
              <span>Add Account Head</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assets Valuation</span>
                <span className="text-lg font-bold text-slate-800 block mt-1">
                  ৳{localAccountHeads.filter(ah => ah.type === 'Asset').reduce((sum, ah) => sum + ah.balance, 0).toLocaleString()}
                </span>
              </div>
              <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Liabilities</span>
                <span className="text-lg font-bold text-slate-800 block mt-1">
                  ৳{localAccountHeads.filter(ah => ah.type === 'Liability').reduce((sum, ah) => sum + ah.balance, 0).toLocaleString()}
                </span>
              </div>
              <div className="h-9 w-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Net Equity</span>
                <span className="text-lg font-bold text-slate-800 block mt-1">
                  ৳{localAccountHeads.filter(ah => ah.type === 'Equity').reduce((sum, ah) => sum + ah.balance, 0).toLocaleString()}
                </span>
              </div>
              <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-200 font-bold uppercase block">Financial Health</span>
                <span className="text-lg font-bold block mt-1">৳{netProfit.toLocaleString()} Net</span>
              </div>
              <div className="h-9 w-9 bg-indigo-500 text-white rounded-lg flex items-center justify-center">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Account Code</th>
                  <th className="py-3.5 px-6">Account Head Name</th>
                  <th className="py-3.5 px-6">Account Category Type</th>
                  <th className="py-3.5 px-6 text-right">Ledger Vault Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localAccountHeads.map((ah) => (
                  <tr key={ah.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">{ah.code}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{ah.name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        ah.type === 'Asset' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        ah.type === 'Liability' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        ah.type === 'Equity' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        ah.type === 'Revenue' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {ah.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-800">
                      ৳{ah.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 2: JOURNAL ENTRIES (GENERAL LEDGER)
          ========================================= */}
      {currentTab === 'journal_entries' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">General Ledger Journal Entries</h2>
              <p className="text-xs text-slate-400 mt-1">Chronological ledger log of debit and credit postings with full audits.</p>
            </div>
            <button
              onClick={() => {
                setTxType('Expense');
                setCategory(expenseCategories[0]);
                setShowTxModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Record Journal Posting</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date Posted</th>
                  <th className="py-3 px-6">Reference No</th>
                  <th className="py-3 px-6">Description Ledger Entry</th>
                  <th className="py-3 px-6">Category Allocation</th>
                  <th className="py-3 px-6 text-right">Debit / Credit Posting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{t.date || 'N/A'}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">{t.referenceNo || `JV-${String(t.id || '').slice(-4).toUpperCase().padStart(4, '0')}`}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{t.description}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.category}</td>
                    <td className="py-3.5 px-6 text-right">
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

      {/* =========================================
          TAB 3: PAYMENTS OUTFLOW
          ========================================= */}
      {currentTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Vendor & Expense Payments</h2>
              <p className="text-xs text-slate-400 mt-1">Review outgoing cashflows, vendor bill pay logs, and general operating expense vouchers.</p>
            </div>
            <button
              onClick={() => {
                setTxType('Expense');
                setCategory('Office Supplies');
                setShowTxModal(true);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Record Payment Outflow</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Debit Outflows Ledger</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Payment Ref</th>
                  <th className="py-3 px-6">Paid For / Description</th>
                  <th className="py-3 px-6">Account Settled</th>
                  <th className="py-3 px-6 text-right">Amount Paid Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.type === 'Expense').slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.date || '2026-07-06'}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-600">{t.referenceNo || 'PAY-REF'}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{t.description} <span className="text-[10px] text-slate-400 font-normal">({t.category})</span></td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">Corporate Bank A/C</td>
                    <td className="py-3.5 px-6 text-right font-black text-rose-600">-৳{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 4: INCOME INFLOW
          ========================================= */}
      {currentTab === 'income' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Revenue & Deposits Inflow</h2>
              <p className="text-xs text-slate-400 mt-1">Log interest credits, rentals, sales revenues, and secondary capital inflows.</p>
            </div>
            <button
              onClick={() => {
                setTxType('Income');
                setCategory('Other Revenue');
                setShowTxModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Record Capital Inflow</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Credit Inflows Ledger</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Ref Number</th>
                  <th className="py-3 px-6">Inflow Description</th>
                  <th className="py-3 px-6">Income Category</th>
                  <th className="py-3 px-6 text-right">Amount Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.type === 'Income' || t.type === 'Deposit').slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.date || '2026-07-06'}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-600">{t.referenceNo || 'INC-REF'}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{t.description}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{t.category}</td>
                    <td className="py-3.5 px-6 text-right font-black text-emerald-600">+৳{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 5: INCOME CATEGORIES
          ========================================= */}
      {currentTab === 'income_categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Revenue & Income Categories</h2>
              <p className="text-xs text-slate-400 mt-1">Configure allocation tags for systematic sorting of core and non-operating revenue.</p>
            </div>
            <button
              onClick={() => {
                setCatModalType('income');
                setShowCatModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Income Category</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6">System Prefix</th>
                  <th className="py-3 px-6 text-center">Transactions Count</th>
                  <th className="py-3 px-6 text-right">Sum Credited Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeCategories.map((cat, idx) => {
                  const matchingTxs = transactions.filter(t => t.category === cat);
                  const totalAmt = matchingTxs.reduce((sum, t) => sum + t.amount, 0);
                  return (
                    <tr key={cat} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{cat}</td>
                      <td className="py-4 px-6 font-mono text-indigo-600 font-bold">INC-CAT-00{idx + 1}</td>
                      <td className="py-4 px-6 text-center font-medium text-slate-600">{matchingTxs.length} journal postings</td>
                      <td className="py-4 px-6 text-right font-black text-slate-800">৳{totalAmt.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">Active</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatName(cat);
                              setEditingCatType('income');
                              setEditingCatNewName(cat);
                            }}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Edit Category Name"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat, 'income')}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 6: EXPENSES LOGS
          ========================================= */}
      {currentTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Operational Business Expenses</h2>
              <p className="text-xs text-slate-400 mt-1">Audit office rent, utilities, wage bills, and ad-hoc procurement spendings.</p>
            </div>
            <button
              onClick={() => {
                setTxType('Expense');
                setCategory('Utilities Expense');
                setShowTxModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Record Expense Voucher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Office Utilities Total</span>
              <span className="text-lg font-bold text-slate-800 block">৳25,000.00</span>
              <span className="text-[10px] text-slate-400">Regular Rent + Internet bills</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Wage & Salaries Roll</span>
              <span className="text-lg font-bold text-slate-800 block">৳112,000.00</span>
              <span className="text-[10px] text-emerald-600 font-bold">Paid on July 01</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-display text-indigo-600">Other Ad-hoc Expenditures</span>
              <span className="text-lg font-bold text-slate-800 block">
                ৳{transactions.filter(t => t.type === 'Expense' && !['Office Rent', 'Salaries', 'Cost of Goods Sold', 'Manufacturing Cost'].includes(t.category)).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Dynamically compiled from general ledger postings</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">OPEX Ledger Rows</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Debit Ref No</th>
                  <th className="py-3 px-6">Expense Description</th>
                  <th className="py-3 px-6">Expense category</th>
                  <th className="py-3 px-6 text-right">Sum Debited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.type === 'Expense' && t.category !== 'Cost of Goods Sold' && t.category !== 'Manufacturing Cost').slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{t.date || '2026-07-06'}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-600">{t.referenceNo || 'EXP-JV'}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">{t.description}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.category}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-rose-600">৳{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 7: EXPENSE CATEGORIES
          ========================================= */}
      {currentTab === 'expense_categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Business Expense Categories</h2>
              <p className="text-xs text-slate-400 mt-1">Configure customized expense heads to segment your administrative overhead cost channels.</p>
            </div>
            <button
              onClick={() => {
                setCatModalType('expense');
                setShowCatModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense Category</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6">Ledger Account Code</th>
                  <th className="py-3 px-6 text-center">Transactions Count</th>
                  <th className="py-3 px-6 text-right">Sum Debited Spend</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseCategories.map((cat, idx) => {
                  const matchingTxs = transactions.filter(t => t.category === cat);
                  const totalAmt = matchingTxs.reduce((sum, t) => sum + t.amount, 0);
                  return (
                    <tr key={cat} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{cat}</td>
                      <td className="py-4 px-6 font-mono text-indigo-600 font-bold">EXP-CAT-00{idx + 1}</td>
                      <td className="py-4 px-6 text-center font-medium text-slate-600">{matchingTxs.length} journal postings</td>
                      <td className="py-4 px-6 text-right font-black text-rose-600">৳{totalAmt.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">Active</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatName(cat);
                              setEditingCatType('expense');
                              setEditingCatNewName(cat);
                            }}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Edit Category Name"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat, 'expense')}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 8: LEDGER AUDIT (লেজার অডিট ও ডাবল এন্ট্রি)
          ========================================= */}
      {currentTab === 'ledger' && (() => {
        const filteredLedgers = ledgerAuditEntries.filter(entry => {
          if (ledgerFilterStatus !== 'All' && entry.status !== ledgerFilterStatus) return false;
          return true;
        });

        const totalAuditMatched = ledgerAuditEntries.filter(e => e.status === 'Matched').reduce((sum, e) => sum + e.amount, 0);
        const totalDiscrepancies = ledgerAuditEntries.filter(e => e.status === 'Discrepancy').reduce((sum, e) => sum + e.amount, 0);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">General Ledger Audit & Double-Entry</h2>
                <p className="text-xs text-slate-400 mt-1">Cross-examine ledger postings, verify debit-credit alignment, and reconcile accounting discrepancies.</p>
              </div>
              <button
                onClick={() => {
                  const randomSuffix = Math.floor(100 + Math.random() * 900);
                  setNewLgRef(`JV-2026-${randomSuffix}`);
                  setShowNewLedgerModal(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন লেজার এডজাস্টমেন্ট যোগ করুন</span>
              </button>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-slate-400 font-medium">মোট অডিটেড ভলিউম (Total Audited Volume)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  ৳{ledgerAuditEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-emerald-700 font-medium">মিলিত পোস্ট (Matched Postings)</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">৳{totalAuditMatched.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-rose-700 font-medium">মিলহীন পোস্ট (Active Discrepancies)</p>
                <p className="text-2xl font-bold text-rose-800 mt-1">৳{totalDiscrepancies.toLocaleString()}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">স্ট্যাটাস ফিল্টার:</span>
                <select
                  value={ledgerFilterStatus}
                  onChange={(e) => setLedgerFilterStatus(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Postings (সব লেজার এন্ট্রি)</option>
                  <option value="Matched">Matched</option>
                  <option value="Discrepancy">Discrepancy</option>
                </select>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                লেজার অডিটিং সিস্টেমে ডাবল-এন্ট্রি নিয়মকানুন যাচাই করা হয়।
              </span>
            </div>

            {/* Ledger Audit Table */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                    <th className="py-3 px-4">Ref No</th>
                    <th className="py-3 px-4">Post Date</th>
                    <th className="py-3 px-4">Debit Account (Dr.)</th>
                    <th className="py-3 px-4">Credit Account (Cr.)</th>
                    <th className="py-3 px-4 text-right">Transaction Amount</th>
                    <th className="py-3 px-4">Compliance Audit Notes</th>
                    <th className="py-3 px-4 text-center">Audit Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">কোনো লেজার রেকর্ড পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    filteredLedgers.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-bold text-rose-600 font-mono">{e.refNo}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono font-medium">{e.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{e.debitAccount}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{e.creditAccount}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-700 font-mono">৳{e.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{e.notes}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                            e.status === 'Matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {e.status === 'Discrepancy' && (
                              <button
                                onClick={() => {
                                  const updated = ledgerAuditEntries.map(itm => itm.id === e.id ? { ...itm, status: 'Matched', notes: 'Manually Audited & Verified ' + itm.notes } : itm);
                                  setLedgerAuditEntries(updated);
                                  localStorage.setItem('nexova_ledger_audit_entries', JSON.stringify(updated));
                                }}
                                className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[10px] text-emerald-700 hover:bg-emerald-100 font-bold cursor-pointer"
                              >
                                Approve Match
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm('আপনি কি এই লেজার এন্ট্রি ডিলিট করতে চান?')) {
                                  const updated = ledgerAuditEntries.filter(itm => itm.id !== e.id);
                                  setLedgerAuditEntries(updated);
                                  localStorage.setItem('nexova_ledger_audit_entries', JSON.stringify(updated));
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* New Ledger Entry Modal */}
            {showNewLedgerModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowNewLedgerModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">নতুন লেজার পোস্ট ফরম</h4>
                    <button onClick={() => setShowNewLedgerModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newLgDebit || !newLgCredit) {
                      window.alert('ডেবিট এবং ক্রেডিট অ্যাকাউন্ট নির্বাচন করুন!');
                      return;
                    }
                    if (newLgAmount <= 0) {
                      window.alert('পরিমাণ অবশ্যই ০ এর বেশি হতে হবে!');
                      return;
                    }

                    const newEntry = {
                      id: `lg_${Date.now()}`,
                      date: getSystemDate(settings),
                      refNo: newLgRef || `JV-2026-${Math.floor(100+Math.random()*900)}`,
                      debitAccount: newLgDebit,
                      creditAccount: newLgCredit,
                      amount: Number(newLgAmount),
                      status: 'Matched',
                      notes: newLgNotes || 'Manual audit ledger reconciliation adjustment'
                    };

                    const updated = [newEntry, ...ledgerAuditEntries];
                    setLedgerAuditEntries(updated);
                    localStorage.setItem('nexova_ledger_audit_entries', JSON.stringify(updated));

                    setShowNewLedgerModal(false);
                    setNewLgDebit('');
                    setNewLgCredit('');
                    setNewLgAmount(0);
                    setNewLgNotes('');
                  }} className="p-5 space-y-4 text-xs text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">জার্নাল রেফারেন্স নম্বর (Ref No) *</label>
                      <input
                        type="text"
                        required
                        value={newLgRef}
                        onChange={(e) => setNewLgRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ডেবিট অ্যাকাউন্ট (Debit Dr.) *</label>
                        <select
                          value={newLgDebit}
                          onChange={(e) => setNewLgDebit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                        >
                          <option value="">-- Select Account --</option>
                          <option value="Cash in Hand">Cash in Hand</option>
                          <option value="Office Rent Expense">Office Rent Expense</option>
                          <option value="Raw Materials Purchase">Raw Materials Purchase</option>
                          <option value="Salary & Wages">Salary & Wages</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ক্রেডিট অ্যাকাউন্ট (Credit Cr.) *</label>
                        <select
                          value={newLgCredit}
                          onChange={(e) => setNewLgCredit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                        >
                          <option value="">-- Select Account --</option>
                          <option value="Sales Income">Sales Income</option>
                          <option value="MTB Bank Account">MTB Bank Account</option>
                          <option value="Accounts Payable">Accounts Payable</option>
                          <option value="Bkash Merchant Wallet">Bkash Merchant Wallet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">লেনদেনের মোট পরিমাণ (Amount) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="৳"
                        value={newLgAmount}
                        onChange={(e) => setNewLgAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">লেনদেনের নোট (Audit Notes) *</label>
                      <textarea
                        required
                        value={newLgNotes}
                        onChange={(e) => setNewLgNotes(e.target.value)}
                        placeholder="পদ্ধতি বা পরিবর্তনের কারণ লিখুন..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 h-16"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setShowNewLedgerModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">সংরক্ষণ করুন</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================
          TAB 9: BUDGET ALLOCATOR (বাজেট বরাদ্দ ও নিয়ন্ত্রণ)
          ========================================= */}
      {currentTab === 'budget' && (() => {
        const totalBudget = budgetAllocations.reduce((sum, b) => sum + b.allocated, 0);
        const totalSpent = budgetAllocations.reduce((sum, b) => sum + b.spent, 0);
        const totalRemaining = totalBudget - totalSpent;

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Departmental Budget Allocations</h2>
                <p className="text-xs text-slate-400 mt-1">Configure financial limits for departments, track live operational spent metrics, and adjust resource funding.</p>
              </div>
              <button
                onClick={() => {
                  setBudgetEditObj(null);
                  setNewBgDept('');
                  setNewBgAllocated(0);
                  setShowBudgetModal(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন বাজেট বরাদ্দ করুন</span>
              </button>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-slate-400 font-medium">মোট বাজেট বরাদ্দ (Total Budget Allocated)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">৳{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-yellow-700 font-medium">মোট খরচ (Total Budget Spent)</p>
                <p className="text-2xl font-bold text-yellow-800 mt-1">৳{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-emerald-700 font-medium">অব্যবহৃত বাজেট (Remaining Resource Balance)</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">৳{totalRemaining.toLocaleString()}</p>
              </div>
            </div>

            {/* Budget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgetAllocations.map((b) => {
                const spentPct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
                let pctColor = 'bg-emerald-500';
                if (spentPct > 90) pctColor = 'bg-rose-500';
                else if (spentPct > 70) pctColor = 'bg-amber-500';

                return (
                  <div key={b.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">{b.quarter}</span>
                        <h3 className="text-base font-extrabold text-slate-800 mt-1">{b.department}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setBudgetEditObj(b);
                            setNewBgDept(b.department);
                            setNewBgAllocated(b.allocated);
                            setNewBgQuarter(b.quarter);
                            setShowBudgetModal(true);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Revise
                        </button>
                        <button
                          onClick={() => {
                            const spentAmtStr = window.prompt(`৳${b.department} বিভাগের খরচের তথ্য যোগ করুন (Enter Spent Amount to ADD):`);
                            if (spentAmtStr) {
                              const spentAmt = Number(spentAmtStr);
                              if (isNaN(spentAmt) || spentAmt <= 0) {
                                window.alert('সঠিক পজিটিভ সংখ্যা দিন!');
                                return;
                              }
                              const updated = budgetAllocations.map(itm => itm.id === b.id ? { ...itm, spent: itm.spent + spentAmt } : itm);
                              setBudgetAllocations(updated);
                              localStorage.setItem('nexova_budget_allocations', JSON.stringify(updated));
                              window.alert('খরচের তথ্য সফলভাবে আপডেট হয়েছে!');
                            }
                          }}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Add Spent
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('আপনি কি এই বাজেটটি ডিলিট করতে চান?')) {
                              const updated = budgetAllocations.filter(itm => itm.id !== b.id);
                              setBudgetAllocations(updated);
                              localStorage.setItem('nexova_budget_allocations', JSON.stringify(updated));
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>বাজেট খরচ প্রগ্রেস (Spent Progress)</span>
                        <span className="font-mono">{spentPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-350 ${pctColor}`} style={{ width: `${Math.min(spentPct, 100)}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50 text-left font-mono">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Allocated</span>
                        <span className="text-xs font-bold text-slate-800">৳{b.allocated.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Spent Total</span>
                        <span className="text-xs font-bold text-rose-600">৳{b.spent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                        <span className="text-xs font-bold text-emerald-600">৳{(b.allocated - b.spent).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Budget Form Modal */}
            {showBudgetModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowBudgetModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {budgetEditObj ? 'বাজেট সংশোধন করুন (Revise Budget)' : 'নতুন বাজেট বরাদ্দ করুন (Allocate Budget)'}
                    </h4>
                    <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newBgDept) {
                      window.alert('বিভাগের নাম লিখুন!');
                      return;
                    }
                    if (newBgAllocated <= 0) {
                      window.alert('বরাদ্দ মূল্য অবশ্যই ০ এর বেশি হতে হবে!');
                      return;
                    }

                    if (budgetEditObj) {
                      const updated = budgetAllocations.map(itm => itm.id === budgetEditObj.id ? { ...itm, department: newBgDept, allocated: Number(newBgAllocated), quarter: newBgQuarter } : itm);
                      setBudgetAllocations(updated);
                      localStorage.setItem('nexova_budget_allocations', JSON.stringify(updated));
                    } else {
                      const newBg = {
                        id: `b_${Date.now()}`,
                        department: newBgDept,
                        allocated: Number(newBgAllocated),
                        spent: 0,
                        quarter: newBgQuarter
                      };
                      const updated = [newBg, ...budgetAllocations];
                      setBudgetAllocations(updated);
                      localStorage.setItem('nexova_budget_allocations', JSON.stringify(updated));
                    }

                    setShowBudgetModal(false);
                    setNewBgDept('');
                    setNewBgAllocated(0);
                    setBudgetEditObj(null);
                  }} className="p-5 space-y-4 text-xs text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বিভাগ (Department / Sector) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Research & Development"
                        value={newBgDept}
                        onChange={(e) => setNewBgDept(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বরাদ্দকৃত ফান্ডের পরিমাণ BDT *</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        placeholder="৳"
                        value={newBgAllocated}
                        onChange={(e) => setNewBgAllocated(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">অর্থবছরের কোয়ার্টার (Quarter) *</label>
                      <select
                        value={newBgQuarter}
                        onChange={(e) => setNewBgQuarter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold cursor-pointer"
                      >
                        <option value="Q3 2026">Q3 2026</option>
                        <option value="Q4 2026">Q4 2026</option>
                        <option value="Q1 2027">Q1 2027</option>
                        <option value="Q2 2027">Q2 2027</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">সংরক্ষণ করুন</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================
          MODALS & RECORDERS
          ========================================= */}

      {/* Record Ledger Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Record Ledger Posting</h3>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleTxSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction description *</label>
                <input
                  type="text" placeholder="e.g. Bought office computers" value={desc}
                  onChange={(e) => setDesc(e.target.value)} className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs focus:outline-none ${formErrors.desc ? 'border-rose-500 text-rose-600 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-600'}`}
                />
                {formErrors.desc && (
                  <span className="block text-[10px] text-rose-600 font-bold mt-1 leading-tight">{formErrors.desc}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type *</label>
                  <select
                    value={txType} onChange={(e) => {
                      const typeVal = e.target.value as 'Income' | 'Expense';
                      setTxType(typeVal);
                      setCategory(typeVal === 'Income' ? incomeCategories[0] : expenseCategories[0]);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Expense">Expense / Outflow</option>
                    <option value="Income">Income / Inflow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Head</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer text-slate-700"
                  >
                    {txType === 'Expense' ? (
                      expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    ) : (
                      incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Settlement Account</label>
                  <select
                    value={accountId} onChange={(e) => setAccountId(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer text-slate-700 ${formErrors.accountId ? 'border-rose-500' : 'border-slate-200'}`}
                  >
                    <option value="">-- Choose Account --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.accountName} (৳{b.balance.toLocaleString()})</option>
                    ))}
                  </select>
                  {formErrors.accountId && (
                    <span className="block text-[9px] text-rose-600 font-bold mt-1 leading-tight">{formErrors.accountId}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount (৳) *</label>
                  <input
                    type="number" placeholder="1500" value={amount}
                    onChange={(e) => setAmount(e.target.value)} className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs focus:outline-none font-extrabold ${formErrors.amount ? 'border-rose-500 text-rose-600 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-600 text-indigo-600'}`}
                  />
                  {formErrors.amount && (
                    <span className="block text-[9px] text-rose-600 font-bold mt-1 leading-tight">{formErrors.amount}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow">Post Posting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Head Modal */}
      {showAccModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Account Head</h4>
              <button onClick={() => setShowAccModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAccSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Code *</label>
                <input
                  type="text" required placeholder="e.g. 1010-05" value={accCode}
                  onChange={(e) => setAccCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Name *</label>
                <input
                  type="text" required placeholder="e.g. Advance Rent Payment" value={accName}
                  onChange={(e) => setAccName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Category Type</label>
                <select value={accType} onChange={(e) => setAccType(e.target.value as AccountHead['type'])} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer">
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Starting Balance *</label>
                <input
                  type="number" required placeholder="0" value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAccModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Add Ledger Head</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Add {catModalType === 'income' ? 'Income' : 'Expense'} Category Tag
              </h4>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text" required placeholder="e.g. Consulting Fees / Freight Charges" value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Create Tag</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCatName !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                Edit {editingCatType === 'income' ? 'Income' : 'Expense'} Category
              </h4>
              <button onClick={() => setEditingCatName(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handleEditCategorySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text" required value={editingCatNewName}
                  onChange={(e) => setEditingCatNewName(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingCatName(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
