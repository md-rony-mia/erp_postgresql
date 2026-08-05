import React, { useState } from 'react';
import { validateRequired, validatePositiveNumber } from '../lib/validation';
import { AccountHead, Transaction, BankAccount, Customer, Supplier, AppSettings } from '../types';
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
  Repeat,
  ReceiptText,
} from 'lucide-react';

interface AccountingViewProps {
  accountHeads: AccountHead[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  onLogTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  onAddAccountHead: (head: Omit<AccountHead, 'id'>) => void;
  onContraTransfer: (fromAccountId: string, toAccountId: string, amount: number, narration: string) => void;
  onIssueNote: (note: { noteType: 'Debit' | 'Credit'; partyId: string; amount: number; reason: string }) => void;
  activeSubTab?: string;
  settings?: AppSettings;
}

export default function AccountingView({
  accountHeads,
  transactions,
  bankAccounts,
  customers,
  suppliers,
  onLogTransaction,
  onAddAccountHead,
  onContraTransfer,
  onIssueNote,
  activeSubTab = 'chart_accounts',
  settings,
}: AccountingViewProps) {
  // Sidebar keys that are really the same feature under a different accounting-standard name
  const SUBTAB_ALIASES: Record<string, string> = {
    payment_voucher: 'payments',
    receipt_voucher: 'income',
  };
  const resolvedSubTab = SUBTAB_ALIASES[activeSubTab] || activeSubTab;
  // Map sidebar activeSubTab to internal views
  const currentTab = [
    'chart_accounts', 'journal_entries', 'payments', 'income', 'income_categories',
    'expenses', 'expense_categories', 'ledger', 'budget',
    'contra_voucher', 'debit_note', 'credit_note',
  ].includes(resolvedSubTab)
    ? resolvedSubTab
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

  const [budgetAllocations, setBudgetAllocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_budget_allocations_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "b_1", department: "Marketing", allocated: 120000, quarter: "Q3 2026", categories: ["Marketing Expense"] },
      { id: "b_2", department: "Operations", allocated: 350000, quarter: "Q3 2026", categories: ["Office Rent", "Utilities Expense"] },
      { id: "b_3", department: "IT & Infrastructure", allocated: 200000, quarter: "Q3 2026", categories: ["Office Supplies"] },
      { id: "b_4", department: "HR & Admin", allocated: 90000, quarter: "Q3 2026", categories: ["Wages & Salaries"] }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('nexova_budget_allocations_v2', JSON.stringify(budgetAllocations));
  }, [budgetAllocations]);

  const [ledgerFilterStatus, setLedgerFilterStatus] = useState('All');

  // Budget Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBgDept, setNewBgDept] = useState('');
  const [newBgAllocated, setNewBgAllocated] = useState(0);
  const [newBgQuarter, setNewBgQuarter] = useState('Q3 2026');
  const [newBgCategories, setNewBgCategories] = useState<string[]>([]);
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
  const [showContraModal, setShowContraModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Contra Voucher Entry
  const [contraFrom, setContraFrom] = useState(bankAccounts[0]?.id || '');
  const [contraTo, setContraTo] = useState(bankAccounts[1]?.id || bankAccounts[0]?.id || '');
  const [contraAmount, setContraAmount] = useState('');
  const [contraNarration, setContraNarration] = useState('');

  // Debit/Credit Note Entry
  const [noteType, setNoteType] = useState<'Debit' | 'Credit'>('Debit');
  const [notePartyId, setNotePartyId] = useState('');
  const [noteAmount, setNoteAmount] = useState('');
  const [noteReason, setNoteReason] = useState('');

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
    // Note: the matching Chart-of-Accounts head (both the cash/bank side and the
    // income/expense side) is updated centrally in App.tsx's handleLogTransaction,
    // and flows back here through the accountHeads prop — no local patch needed.

    setDesc('');
    setAmount('');
    setShowTxModal(false);
  };

  const handleAccSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accCode || !accName || !accBalance) return;

    onAddAccountHead({
      code: accCode,
      name: accName,
      type: accType,
      balance: parseFloat(accBalance),
    });
    setAccCode('');
    setAccName('');
    setAccBalance('');
    setShowAccModal(false);
  };

  const handleContraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(contraAmount);
    if (!contraFrom || !contraTo || !amt || amt <= 0 || contraFrom === contraTo) return;
    onContraTransfer(contraFrom, contraTo, amt, contraNarration || 'Inter-account fund transfer');
    setContraAmount('');
    setContraNarration('');
    setShowContraModal(false);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(noteAmount);
    if (!notePartyId || !amt || amt <= 0) return;
    onIssueNote({ noteType, partyId: notePartyId, amount: amt, reason: noteReason });
    setNoteAmount('');
    setNoteReason('');
    setNotePartyId('');
    setShowNoteModal(false);
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
          TAB: CONTRA VOUCHER (own account transfers)
          ========================================= */}
      {currentTab === 'contra_voucher' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Contra Voucher</h2>
              <p className="text-xs text-slate-400 mt-1">নিজেদের ব্যাংক/ক্যাশ অ্যাকাউন্টের মধ্যে ফান্ড ট্রান্সফার — কোনো income/expense তৈরি করে না।</p>
            </div>
            <button
              onClick={() => {
                setContraFrom(bankAccounts[0]?.id || '');
                setContraTo(bankAccounts[1]?.id || bankAccounts[0]?.id || '');
                setShowContraModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Repeat className="h-4 w-4" />
              <span>New Contra Voucher</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Voucher No</th>
                  <th className="py-3 px-6">From Account</th>
                  <th className="py-3 px-6">To Account</th>
                  <th className="py-3 px-6">Narration</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.type === 'Transfer').slice().reverse().map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.date}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">{t.referenceNo}</td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">{bankAccounts.find(b => b.id === t.accountId)?.bankName || t.accountId}</td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">{bankAccounts.find(b => b.id === t.toAccountId)?.bankName || t.toAccountId}</td>
                    <td className="py-3.5 px-6 text-slate-500">{t.description}</td>
                    <td className="py-3.5 px-6 text-right font-black text-indigo-600">৳{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {transactions.filter(t => t.type === 'Transfer').length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">কোনো Contra Voucher পাওয়া যায়নি।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB: DEBIT NOTE (purchase return, reduces payable)
          TAB: CREDIT NOTE (sales return, reduces receivable)
          ========================================= */}
      {(currentTab === 'debit_note' || currentTab === 'credit_note') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">
                {currentTab === 'debit_note' ? 'Debit Note (Purchase Return)' : 'Credit Note (Sales Return)'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentTab === 'debit_note'
                  ? 'সাপ্লায়ারকে ইস্যু করা — Accounts Payable ও Cost of Goods Sold কমায়।'
                  : 'কাস্টমারকে ইস্যু করা — Accounts Receivable ও Sales Revenue কমায়।'}
              </p>
            </div>
            <button
              onClick={() => {
                setNoteType(currentTab === 'debit_note' ? 'Debit' : 'Credit');
                setNotePartyId('');
                setShowNoteModal(true);
              }}
              className={`flex items-center gap-2 ${currentTab === 'debit_note' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all`}
            >
              <ReceiptText className="h-4 w-4" />
              <span>New {currentTab === 'debit_note' ? 'Debit' : 'Credit'} Note</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Note No</th>
                  <th className="py-3 px-6">Party</th>
                  <th className="py-3 px-6">Reason</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter(t => t.type === 'Adjustment' && t.category === (currentTab === 'debit_note' ? 'Debit Note' : 'Credit Note'))
                  .slice().reverse().map((t) => {
                    const party = currentTab === 'debit_note'
                      ? suppliers.find(s => s.id === t.partyId)
                      : customers.find(c => c.id === t.partyId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-6 text-slate-500 font-semibold">{t.date}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{t.referenceNo}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{party?.name || t.partyId}</td>
                        <td className="py-3.5 px-6 text-slate-500">{t.description}</td>
                        <td className={`py-3.5 px-6 text-right font-black ${currentTab === 'debit_note' ? 'text-rose-600' : 'text-emerald-600'}`}>৳{t.amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                {transactions.filter(t => t.type === 'Adjustment' && t.category === (currentTab === 'debit_note' ? 'Debit Note' : 'Credit Note')).length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">কোনো {currentTab === 'debit_note' ? 'Debit' : 'Credit'} Note পাওয়া যায়নি।</td></tr>
                )}
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
                ৳{transactions.filter(t => t.type === 'Expense' && !['Office Rent', 'Wages & Salaries', 'Cost of Goods Sold', 'Manufacturing Cost'].includes(t.category)).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
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
        // Real double-entry accounts derived from live transactions — not manually-entered demo data.
        const CATEGORY_HEAD_NAME: Record<string, string> = {
          'Sales Income': 'Sales Revenue',
          'Cost of Goods Sold': 'Cost of Goods Sold',
          'Office Rent': 'Office Rent Expense',
          'Wages & Salaries': 'Salary & Wages Expense',
        };

        type LedgerRow = { id: string; date: string; refNo: string; debitAccount: string; creditAccount: string; amount: number; notes: string; status: 'Matched' | 'Unclassified' };

        const derivedLedgerEntries: LedgerRow[] = transactions.map((t) => {
          const acctName = bankAccounts.find(b => b.id === t.accountId)?.accountName || t.accountId;
          if (t.type === 'Income' || t.type === 'Deposit') {
            const headName = CATEGORY_HEAD_NAME[t.category];
            return { id: t.id, date: t.date, refNo: t.referenceNo || t.id, debitAccount: acctName, creditAccount: headName || `${t.category} (কোনো Chart of Accounts head সেট করা নেই)`, amount: t.amount, notes: t.description, status: (headName ? 'Matched' : 'Unclassified') as 'Matched' | 'Unclassified' };
          }
          if (t.type === 'Expense' || t.type === 'Withdrawal') {
            const headName = CATEGORY_HEAD_NAME[t.category];
            return { id: t.id, date: t.date, refNo: t.referenceNo || t.id, debitAccount: headName || `${t.category} (কোনো Chart of Accounts head সেট করা নেই)`, creditAccount: acctName, amount: t.amount, notes: t.description, status: (headName ? 'Matched' : 'Unclassified') as 'Matched' | 'Unclassified' };
          }
          if (t.type === 'Transfer') {
            const toName = bankAccounts.find(b => b.id === t.toAccountId)?.accountName || t.toAccountId || '—';
            return { id: t.id, date: t.date, refNo: t.referenceNo || t.id, debitAccount: toName, creditAccount: acctName, amount: t.amount, notes: t.description, status: 'Matched' as const };
          }
          // Adjustment (Debit/Credit Note)
          if (t.category === 'Debit Note') {
            return { id: t.id, date: t.date, refNo: t.referenceNo || t.id, debitAccount: 'Accounts Payable', creditAccount: 'Cost of Goods Sold', amount: t.amount, notes: t.description, status: 'Matched' as const };
          }
          return { id: t.id, date: t.date, refNo: t.referenceNo || t.id, debitAccount: 'Sales Revenue', creditAccount: 'Accounts Receivable', amount: t.amount, notes: t.description, status: 'Matched' as const };
        }).reverse();

        const filteredLedgers = derivedLedgerEntries.filter(entry => ledgerFilterStatus === 'All' || entry.status === ledgerFilterStatus);
        const totalAuditMatched = derivedLedgerEntries.filter(e => e.status === 'Matched').reduce((sum, e) => sum + e.amount, 0);
        const totalDiscrepancies = derivedLedgerEntries.filter(e => e.status === 'Unclassified').reduce((sum, e) => sum + e.amount, 0);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">General Ledger</h2>
                <p className="text-xs text-slate-400 mt-1">Journal/Payment/Income/Contra/Note থেকে সরাসরি derive করা প্রতিটা লেনদেনের ডাবল-এন্ট্রি ভিউ।</p>
              </div>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-slate-400 font-medium">মোট লেনদেন ভলিউম (Total Ledger Volume)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  ৳{derivedLedgerEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-emerald-700 font-medium">Chart of Accounts-এ Matched</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">৳{totalAuditMatched.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xs">
                <p className="text-xs text-rose-700 font-medium">Unclassified (কোনো head match হয়নি)</p>
                <p className="text-2xl font-bold text-rose-800 mt-1">৳{totalDiscrepancies.toLocaleString()}</p>
              </div>
            </div>

            {totalDiscrepancies > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                "Unclassified" মানে এই ক্যাটাগরির কোনো matching Chart of Accounts head নেই, তাই এই লেনদেন সেই account-এর balance-এ যোগ হয়নি। Chart of Accounts ট্যাবে গিয়ে ওই category-র নামে একটা account head যোগ করলে ভবিষ্যতের লেনদেন সঠিকভাবে classify হবে।
              </div>
            )}

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
                  <option value="Unclassified">Unclassified</option>
                </select>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                প্রতিটা এন্ট্রি সরাসরি আসল লেনদেন থেকে derive করা — ম্যানুয়ালি এডিট করা যায় না।
              </span>
            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50 uppercase tracking-wider">
                    <th className="py-3 px-4">Ref No</th>
                    <th className="py-3 px-4">Post Date</th>
                    <th className="py-3 px-4">Debit Account (Dr.)</th>
                    <th className="py-3 px-4">Credit Account (Cr.)</th>
                    <th className="py-3 px-4 text-right">Transaction Amount</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">কোনো লেজার রেকর্ড পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    filteredLedgers.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-bold text-indigo-600 font-mono">{e.refNo}</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* =========================================
          TAB 9: BUDGET ALLOCATOR (বাজেট বরাদ্দ ও নিয়ন্ত্রণ)
          ========================================= */}
      {currentTab === 'budget' && (() => {
        const spentFor = (b: any) => transactions
          .filter(t => t.type === 'Expense' && (b.categories || []).includes(t.category))
          .reduce((sum, t) => sum + t.amount, 0);

        const totalBudget = budgetAllocations.reduce((sum, b) => sum + b.allocated, 0);
        const totalSpent = budgetAllocations.reduce((sum, b) => sum + spentFor(b), 0);
        const totalRemaining = totalBudget - totalSpent;

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 font-display">Departmental Budget Allocations</h2>
                <p className="text-xs text-slate-400 mt-1">Allocated amount নিজে সেট করুন; Spent প্রতিটা বিভাগের সাথে যুক্ত expense category-র আসল লেনদেন থেকে সরাসরি হিসাব হয়।</p>
              </div>
              <button
                onClick={() => {
                  setBudgetEditObj(null);
                  setNewBgDept('');
                  setNewBgAllocated(0);
                  setNewBgCategories([]);
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
                <p className="text-xs text-yellow-700 font-medium">মোট খরচ (Total Budget Spent — লাইভ লেনদেন থেকে)</p>
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
                const spent = spentFor(b);
                const spentPct = b.allocated > 0 ? (spent / b.allocated) * 100 : 0;
                let pctColor = 'bg-emerald-500';
                if (spentPct > 90) pctColor = 'bg-rose-500';
                else if (spentPct > 70) pctColor = 'bg-amber-500';

                return (
                  <div key={b.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">{b.quarter}</span>
                        <h3 className="text-base font-extrabold text-slate-800 mt-1">{b.department}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{(b.categories || []).length > 0 ? (b.categories as string[]).join(', ') : 'কোনো ক্যাটাগরি যুক্ত নেই — Spent সবসময় ৳0 দেখাবে'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setBudgetEditObj(b);
                            setNewBgDept(b.department);
                            setNewBgAllocated(b.allocated);
                            setNewBgQuarter(b.quarter);
                            setNewBgCategories(b.categories || []);
                            setShowBudgetModal(true);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Revise
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('আপনি কি এই বাজেটটি ডিলিট করতে চান?')) {
                              setBudgetAllocations(prev => prev.filter(itm => itm.id !== b.id));
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
                        <span className="text-xs font-bold text-rose-600">৳{spent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                        <span className="text-xs font-bold text-emerald-600">৳{(b.allocated - spent).toLocaleString()}</span>
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
                      setBudgetAllocations(prev => prev.map(itm => itm.id === budgetEditObj.id ? { ...itm, department: newBgDept, allocated: Number(newBgAllocated), quarter: newBgQuarter, categories: newBgCategories } : itm));
                    } else {
                      const newBg = {
                        id: `b_${Date.now()}`,
                        department: newBgDept,
                        allocated: Number(newBgAllocated),
                        quarter: newBgQuarter,
                        categories: newBgCategories,
                      };
                      setBudgetAllocations(prev => [newBg, ...prev]);
                    }

                    setShowBudgetModal(false);
                    setNewBgDept('');
                    setNewBgAllocated(0);
                    setNewBgCategories([]);
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">এই বাজেট কোন Expense Category ট্র্যাক করবে? *</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        {expenseCategories.map(cat => (
                          <label key={cat} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newBgCategories.includes(cat)}
                              onChange={(e) => {
                                setNewBgCategories(prev => e.target.checked ? [...prev, cat] : prev.filter(c => c !== cat));
                              }}
                            />
                            {cat}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">অর্থবছরের কোয়ার্টার (Quarter) *</label>
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

      {/* Contra Voucher Modal */}
      {showContraModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Contra Voucher</h4>
              <button onClick={() => setShowContraModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleContraSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From Account *</label>
                <select required value={contraFrom} onChange={(e) => setContraFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600">
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} — {b.accountName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To Account *</label>
                <select required value={contraTo} onChange={(e) => setContraTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600">
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} — {b.accountName}</option>)}
                </select>
              </div>
              {contraFrom === contraTo && (
                <p className="text-[10px] text-rose-500 font-semibold">From ও To একই account হতে পারবে না।</p>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount *</label>
                <input
                  type="number" required min="1" step="0.01" placeholder="0.00" value={contraAmount}
                  onChange={(e) => setContraAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Narration</label>
                <input
                  type="text" placeholder="e.g. Cash deposited to bank" value={contraNarration}
                  onChange={(e) => setContraNarration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowContraModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={contraFrom === contraTo} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold cursor-pointer">Post Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debit/Credit Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New {noteType} Note</h4>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleNoteSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {noteType === 'Debit' ? 'Supplier' : 'Customer'} *
                </label>
                <select required value={notePartyId} onChange={(e) => setNotePartyId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600">
                  <option value="">নির্বাচন করুন</option>
                  {(noteType === 'Debit' ? suppliers : customers).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount *</label>
                <input
                  type="number" required min="1" step="0.01" placeholder="0.00" value={noteAmount}
                  onChange={(e) => setNoteAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason *</label>
                <input
                  type="text" required placeholder={noteType === 'Debit' ? 'e.g. Purchase return — damaged tiles' : 'e.g. Sales return — wrong item'} value={noteReason}
                  onChange={(e) => setNoteReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {noteType === 'Debit'
                  ? 'এই সাপ্লায়ারকে যা দেনা তা এই পরিমাণ কমে যাবে।'
                  : 'এই কাস্টমারের কাছে যা পাওনা তা এই পরিমাণ কমে যাবে।'}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNoteModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className={`px-3.5 py-1.5 ${noteType === 'Debit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-md text-xs font-bold cursor-pointer`}>Issue {noteType} Note</button>
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
