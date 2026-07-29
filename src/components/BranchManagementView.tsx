import React, { useState, useEffect } from 'react';
import { Branch, BranchEnabledFeatures, BranchSharedFeatures } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  MapPin,
  Phone,
  User,
  RefreshCw,
  AlertTriangle,
  Info,
  Check,
  X,
  Lock,
  Boxes,
  Store,
  ShoppingCart,
  Users,
  Briefcase,
  FileText,
  Wrench,
  Calendar,
  BookOpen,
  FolderClosed,
} from 'lucide-react';

interface BranchManagementViewProps {
  currentUser?: any;
  onBranchChange?: () => void;
}

const DEFAULT_ENABLED_FEATURES: BranchEnabledFeatures = {
  sales: true,
  purchase: true,
  inventory: true,
  accounting: true,
  banking: true,
  crm: true,
  employee: true,
  manufacturing: false,
  projects: false,
  documents: true,
};

const DEFAULT_SHARED_FEATURES: BranchSharedFeatures = {
  productCatalog: true,
  customerList: true,
  supplierList: true,
  chartOfAccounts: true,
};

export const INITIAL_DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'main_hq',
    name: 'ঢাকা প্রধান কার্যালয় (Dhaka Head Office)',
    branchCode: 'DHK-HQ',
    address: 'মিরপুর ১১, ঢাকা ১২১৬',
    phone: '+880 1711-000111',
    managerName: 'আরিফুল ইসলাম',
    status: 'Active',
    isMainBranch: true,
    stockMode: 'shared',
    enabledFeatures: DEFAULT_ENABLED_FEATURES,
    sharedFeatures: DEFAULT_SHARED_FEATURES,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'br_narayanganj',
    name: 'নারায়ণগঞ্জ শাখা ও শো-রুম',
    branchCode: 'NYG-01',
    address: 'চাষাড়া মোড়, নারায়ণগঞ্জ',
    phone: '+880 1711-000222',
    managerName: 'সাব্বির হোসেন',
    status: 'Active',
    isMainBranch: false,
    stockMode: 'independent',
    enabledFeatures: DEFAULT_ENABLED_FEATURES,
    sharedFeatures: DEFAULT_SHARED_FEATURES,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'br_chittagong',
    name: 'চট্টগ্রাম পোর্ট পয়েন্ট ডিপো',
    branchCode: 'CTG-01',
    address: 'আগ্রাবাদ সি/এ, চট্টগ্রাম',
    phone: '+880 1711-000333',
    managerName: 'ফারহানা পারভীন',
    status: 'Active',
    isMainBranch: false,
    stockMode: 'independent',
    enabledFeatures: DEFAULT_ENABLED_FEATURES,
    sharedFeatures: DEFAULT_SHARED_FEATURES,
    createdAt: new Date().toISOString(),
  },
];

export default function BranchManagementView({ currentUser, onBranchChange }: BranchManagementViewProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formIsMain, setFormIsMain] = useState(false);
  const [formStockMode, setFormStockMode] = useState<'shared' | 'independent'>('independent');
  const [formFeatures, setFormFeatures] = useState<BranchEnabledFeatures>(DEFAULT_ENABLED_FEATURES);
  const [formShared, setFormShared] = useState<BranchSharedFeatures>(DEFAULT_SHARED_FEATURES);

  // Subscribe to Firestore branches collection
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const branchesRef = collection(db, 'branches');
      unsubscribe = onSnapshot(
        branchesRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Branch[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Branch);
            });
            // Ensure main branch is first
            list.sort((a, b) => (b.isMainBranch ? 1 : 0) - (a.isMainBranch ? 1 : 0));
            setBranches(list);
          } else {
            // Seed default initial branches to Firestore if empty
            seedInitialBranches();
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore branches realtime sync error, fallback to local default:', error);
          const saved = localStorage.getItem('nexova_branches_v2');
          if (saved) {
            try { setBranches(JSON.parse(saved)); } catch (e) { setBranches(INITIAL_DEFAULT_BRANCHES); }
          } else {
            setBranches(INITIAL_DEFAULT_BRANCHES);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error attaching branch listener:', err);
      setBranches(INITIAL_DEFAULT_BRANCHES);
      setLoading(false);
    }
    return () => unsubscribe();
  }, []);

  const seedInitialBranches = async () => {
    try {
      for (const branch of INITIAL_DEFAULT_BRANCHES) {
        await setDoc(doc(db, 'branches', branch.id), branch, { merge: true });
      }
      setBranches(INITIAL_DEFAULT_BRANCHES);
    } catch (e) {
      console.warn('Could not seed initial branches to Firestore:', e);
      setBranches(INITIAL_DEFAULT_BRANCHES);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormCode(`BR-${Math.floor(Math.random() * 900) + 100}`);
    setFormAddress('');
    setFormPhone('');
    setFormManager('');
    setFormStatus('Active');
    setFormIsMain(false);
    setFormStockMode('independent');
    setFormFeatures(DEFAULT_ENABLED_FEATURES);
    setFormShared(DEFAULT_SHARED_FEATURES);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Branch) => {
    setEditingBranch(b);
    setFormName(b.name);
    setFormCode(b.branchCode);
    setFormAddress(b.address);
    setFormPhone(b.phone);
    setFormManager(b.managerName);
    setFormStatus(b.status);
    setFormIsMain(b.isMainBranch);
    setFormStockMode(b.stockMode);
    setFormFeatures(b.enabledFeatures || DEFAULT_ENABLED_FEATURES);
    setFormShared(b.sharedFeatures || DEFAULT_SHARED_FEATURES);
    setIsModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('অনুগ্রহ করে শাখার নাম ও কোড পূরণ করুন।');
      return;
    }

    const branchId = editingBranch ? editingBranch.id : `branch_${Date.now()}`;
    const newBranchData: Branch = {
      id: branchId,
      name: formName.trim(),
      branchCode: formCode.trim().toUpperCase(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      managerName: formManager.trim(),
      status: formStatus,
      isMainBranch: formIsMain,
      stockMode: editingBranch ? editingBranch.stockMode : formStockMode, // Stock mode locked after creation
      enabledFeatures: formFeatures,
      sharedFeatures: formShared,
      createdAt: editingBranch ? editingBranch.createdAt : new Date().toISOString(),
    };

    try {
      // If marking as main branch, unmark others
      if (formIsMain) {
        for (const b of branches) {
          if (b.id !== branchId && b.isMainBranch) {
            try {
              await updateDoc(doc(db, 'branches', b.id), { isMainBranch: false });
            } catch (e) {
              console.warn('Firestore update isMainBranch failed:', e);
            }
          }
        }
      }

      try {
        await setDoc(doc(db, 'branches', branchId), newBranchData, { merge: true });
      } catch (e) {
        console.warn('Firestore setDoc branch failed, falling back to local persistence:', e);
      }

      // Save locally as primary/backup
      const updatedList = editingBranch
        ? branches.map(b => b.id === branchId ? newBranchData : (formIsMain ? { ...b, isMainBranch: false } : b))
        : [...branches.map(b => formIsMain ? { ...b, isMainBranch: false } : b), newBranchData];
      
      setBranches(updatedList);
      localStorage.setItem('nexova_branches_v2', JSON.stringify(updatedList));

      setIsModalOpen(false);
      setShowToast(editingBranch ? 'শাখা সফলভাবে আপডেট করা হয়েছে!' : 'নতুন শাখা সফলভাবে যোগ করা হয়েছে!');
      if (onBranchChange) onBranchChange();
      setTimeout(() => setShowToast(null), 4000);
    } catch (err) {
      console.error('Error saving branch:', err);
      // Fallback local save so user operation never fails unexpectedly
      const updatedList = editingBranch
        ? branches.map(b => b.id === branchId ? newBranchData : (formIsMain ? { ...b, isMainBranch: false } : b))
        : [...branches.map(b => formIsMain ? { ...b, isMainBranch: false } : b), newBranchData];
      setBranches(updatedList);
      localStorage.setItem('nexova_branches_v2', JSON.stringify(updatedList));
      setIsModalOpen(false);
      setShowToast(editingBranch ? 'শাখা সফলভাবে আপডেট করা হয়েছে!' : 'নতুন শাখা সফলভাবে যোগ করা হয়েছে!');
      if (onBranchChange) onBranchChange();
      setTimeout(() => setShowToast(null), 4000);
    }
  };

  const handleDeleteBranch = async (b: Branch) => {
    if (b.isMainBranch) {
      alert('প্রধান শাখা (Main Branch) মুছে ফেলা সম্ভব নয়!');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${b.name}" শাখাটি মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      try {
        await deleteDoc(doc(db, 'branches', b.id));
      } catch (e) {
        console.warn('Firestore deleteDoc failed:', e);
      }
      const filtered = branches.filter(x => x.id !== b.id);
      setBranches(filtered);
      localStorage.setItem('nexova_branches_v2', JSON.stringify(filtered));
      setShowToast('শাখাটি সফলভাবে মুছে ফেলা হয়েছে।');
      if (onBranchChange) onBranchChange();
      setTimeout(() => setShowToast(null), 4000);
    } catch (err) {
      console.error('Error deleting branch:', err);
    }
  };

  const handleToggleStatus = async (b: Branch) => {
    if (b.isMainBranch && b.status === 'Active') {
      alert('প্রধান শাখা নিষ্ক্রিয় করা যাবে না!');
      return;
    }
    const newStatus: 'Active' | 'Inactive' = b.status === 'Active' ? 'Inactive' : 'Active';
    try {
      try {
        await updateDoc(doc(db, 'branches', b.id), { status: newStatus });
      } catch (e) {
        console.warn('Firestore updateDoc status failed:', e);
      }
      setBranches(prev => {
        const updated = prev.map(x => x.id === b.id ? { ...x, status: newStatus } : x);
        localStorage.setItem('nexova_branches_v2', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Status toggle failed:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800 font-display">মাল্টি-ব্রাঞ্চ সেটিংস ও ব্যবস্থাপনা (Multi-Branch Management)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আপনার ব্যবসার সকল শাখা তৈরি, স্টক কানেকশন মোড, মডিউল অ্যাক্সেস ও ম্যানেজার অ্যাসাইনমেন্ট নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন শাখা যোগ করুন</span>
        </button>
      </div>

      {/* Info Card / Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-xs">
          <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-indigo-950">শেয়ার্ড স্টক মোড (Shared Stock)</h4>
            <p className="text-indigo-800/80 text-[11px] mt-0.5 leading-relaxed">
              কেন্দ্রীয় ইনভেন্টরি ক্যাটালগ ব্যবহার করে। যেকোনো শাখা থেকে পণ্য বিক্রি বা রিসিভ করা হলে প্রধান সেন্ট্রাল স্টক সরাসরি আপডেট হবে।
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs">
          <Boxes className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950">স্বাধীন / পৃথক স্টক মোড (Independent Stock)</h4>
            <p className="text-amber-800/80 text-[11px] mt-0.5 leading-relaxed">
              প্রতিটি শাখায় নিজস্ব পৃথক স্টক সংখ্যা সংরক্ষিত থাকবে। এক শাখার স্টক বিক্রিতে অন্য শাখার স্টকে কোনো প্রভাব পড়বে না।
            </p>
          </div>
        </div>
      </div>

      {/* Branches Table List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2 font-medium">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>শাখার তথ্য লোড হচ্ছে...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-semibold text-xs">কোনো শাখা পাওয়া যায়নি।</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
            >
              প্রথম শাখা তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">শাখার নাম ও কোড</th>
                  <th className="py-3.5 px-4">ব্যবস্থাপক (Manager)</th>
                  <th className="py-3.5 px-4">ঠিকানা ও ফোন</th>
                  <th className="py-3.5 px-4 text-center">স্টক মোড</th>
                  <th className="py-3.5 px-4 text-center">সক্রিয় মডিউলসমূহ</th>
                  <th className="py-3.5 px-4 text-center">অবস্থা (Status)</th>
                  <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Branch Name & Code */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          b.isMainBranch
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {b.branchCode.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                            {b.isMainBranch && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-full text-[9px] font-black uppercase tracking-wider">
                                প্রধান কার্যালয় (Main)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            কোড: <span className="font-bold text-slate-600">{b.branchCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="py-4 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{b.managerName || 'নির্ধারিত হয়নি'}</span>
                      </div>
                    </td>

                    {/* Address & Phone */}
                    <td className="py-4 px-4 text-slate-600 text-[11px]">
                      <div className="space-y-0.5">
                        {b.address && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{b.address}</span>
                          </div>
                        )}
                        {b.phone && (
                          <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{b.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Stock Mode */}
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        b.stockMode === 'shared'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {b.stockMode === 'shared' ? '🔗 শেয়ার্ড স্টক' : '📦 পৃথক স্টক'}
                      </span>
                    </td>

                    {/* Enabled Modules */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[180px] mx-auto">
                        {Object.entries(b.enabledFeatures || DEFAULT_ENABLED_FEATURES)
                          .filter(([_, enabled]) => enabled)
                          .slice(0, 4)
                          .map(([key]) => (
                            <span key={key} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">
                              {key}
                            </span>
                          ))}
                        {Object.values(b.enabledFeatures || {}).filter(Boolean).length > 4 && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            +{Object.values(b.enabledFeatures || {}).filter(Boolean).length - 4} আরও
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(b)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                          b.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {b.status === 'Active' ? '● সক্রিয় (Active)' : '○ নিষ্ক্রিয়'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="শাখা এডিট করুন"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!b.isMainBranch && (
                          <button
                            onClick={() => handleDeleteBranch(b)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="শাখা মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT BRANCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display">
                    {editingBranch ? 'শাখা সম্পাদনা করুন (Edit Branch)' : 'নতুন শাখা যোগ করুন (Add New Branch)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    শাখার নাম, স্টক মোড এবং অনুমোদিত মডিউলসমূহ কনফিগার করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveBranch} className="p-6 space-y-6 text-xs">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">১. মূল শাখা সংক্রান্ত তথ্য</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      শাখার নাম (Branch Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. উত্তর জোন শাখা"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      শাখা ইউনিক কোড (Branch Code) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DHK-02"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      শাখা ব্যবস্থাপক (Branch Manager)
                    </label>
                    <input
                      type="text"
                      placeholder="ম্যানেজারের নাম লিখুন"
                      value={formManager}
                      onChange={(e) => setFormManager(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ফোন নম্বর (Phone Number)
                    </label>
                    <input
                      type="text"
                      placeholder="+880 17..."
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    শাখার অবস্থান / পূর্ণাঙ্গ ঠিকানা (Address)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="রোড, এলাকা, জেলা..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">প্রধান শাখা হিসেবে চিহ্নিত করুন (Main Branch)</span>
                    <span className="block text-[10px] text-slate-400">ব্যবসার প্রধান হেড অফিস শাখা যা কেন্দ্রীয় রিপোর্টিং নিয়ন্ত্রণে থাকে</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsMain}
                    onChange={(e) => setFormIsMain(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Stock Linking Mode */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ২. ইনভেন্টরি স্টক কানেকশন মোড (Stock Linking Mode)
                  </h4>
                  {editingBranch && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      <span>তৈরির পর স্টক মোড পরিবর্তনযোগ্য নয়</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Shared Stock */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formStockMode === 'shared'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    } ${editingBranch ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <input
                          type="radio"
                          name="stockMode"
                          disabled={!!editingBranch}
                          checked={formStockMode === 'shared'}
                          onChange={() => setFormStockMode('shared')}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>🔗 শেয়ার্ড স্টক (Shared Stock)</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      প্রধান সেন্ট্রাল স্টক সরাসরি কানেক্টেড থাকবে। পণ্য বিক্রি/ক্রয় করলে কেন্দ্রীয় স্টক পরিবর্তন হবে।
                    </p>
                  </label>

                  {/* Option 2: Independent Stock */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formStockMode === 'independent'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    } ${editingBranch ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <input
                          type="radio"
                          name="stockMode"
                          disabled={!!editingBranch}
                          checked={formStockMode === 'independent'}
                          onChange={() => setFormStockMode('independent')}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>📦 স্বাধীন/পৃথক স্টক (Independent)</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      এই শাখার জন্য আলাদা ইনভেন্টরি স্টক ট্র্যাকিং করা হবে। শাখা অনুযায়ী ইনভেন্টরি রিপোর্ট আলাদা থাকবে।
                    </p>
                  </label>
                </div>
              </div>

              {/* Enabled Modules Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ৩. শাখায় সক্রিয় মডিউল অনুমতি (Enabled Branch Modules)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'sales', label: 'বিক্রয় (Sales & POS)' },
                    { key: 'purchase', label: 'ক্রয় (Purchase Order)' },
                    { key: 'inventory', label: 'ইনভেন্টরি (Inventory)' },
                    { key: 'accounting', label: 'হিসাববিজ্ঞান (Accounting)' },
                    { key: 'banking', label: 'ব্যাংকিং (Banking)' },
                    { key: 'crm', label: 'সিআরএম (CRM / Leads)' },
                    { key: 'employee', label: 'এইচআর ও বেতন (HRM)' },
                    { key: 'manufacturing', label: 'উৎপাদন (Manufacturing)' },
                    { key: 'projects', label: 'প্রকল্প (Projects)' },
                    { key: 'documents', label: 'ডকুমেন্ট (Documents)' },
                  ].map((mod) => {
                    const isChecked = (formFeatures as any)[mod.key];
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          isChecked ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{mod.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setFormFeatures({ ...formFeatures, [mod.key]: e.target.checked })}
                          className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Shared Data Config */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ৪. কেন্দ্রীয় শেয়ার্ড ডাটা সংযোগ (Central Shared Master Data)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'productCatalog', label: 'কেন্দ্রীয় পণ্য ক্যাটালগ (Shared Product Catalog)' },
                    { key: 'customerList', label: 'কেন্দ্রীয় গ্রাহক তালিকা (Shared Customer List)' },
                    { key: 'supplierList', label: 'কেন্দ্রীয় সরবরাহকারী তালিকা (Shared Supplier List)' },
                    { key: 'chartOfAccounts', label: 'কেন্দ্রীয় হিসাব তালিকা (Shared Chart of Accounts)' },
                  ].map((item) => {
                    const isChecked = (formShared as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          isChecked ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{item.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setFormShared({ ...formShared, [item.key]: e.target.checked })}
                          className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingBranch ? 'পরিবর্তন সংরক্ষণ করুন' : 'নতুন শাখা তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
