import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Paperclip,
  Cpu,
  Signature,
  Archive,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  FileText,
  Eye,
  Download,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

interface DocumentsViewProps {
  activeSubTab?: string;
}

interface ERPDocument {
  id: string;
  name: string;
  category: 'Finance' | 'HR' | 'Logistics' | 'Legal' | 'General';
  type: string; // PDF, XLSX, DOCX
  uploadedBy: string;
  date: string;
  size: string;
  version: string;
  isArchived?: boolean;
  archivedDate?: string;
}

interface SignatureContract {
  id: string;
  title: string;
  clientName: string;
  dateSent: string;
  status: 'Pending Signature' | 'Signed' | 'Rejected';
  signedTimestamp?: string;
}

export default function DocumentsView({ activeSubTab = 'document_center' }: DocumentsViewProps) {
  const currentTab = ['document_center', 'attachments', 'ocr', 'digital_signature', 'archive'].includes(activeSubTab)
    ? activeSubTab
    : 'document_center';

  // --- LOCAL PERSISTED STATES ---
  const [documents, setDocuments] = useState<ERPDocument[]>([]);
  const [contracts, setContracts] = useState<SignatureContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Documents
        const legacyDocs = localStorage.getItem('nexova_docs');
        let initialDocs: ERPDocument[] = [
          { id: 'doc1', name: 'Raw Steel Supply Agreement 2026.pdf', category: 'Legal', type: 'PDF', uploadedBy: 'Farhana Yasmin', date: '2026-07-01', size: '2.4 MB', version: 'v1.2' },
          { id: 'doc2', name: 'Q2 Financial Balance Audit Spreadsheet.xlsx', category: 'Finance', type: 'XLSX', uploadedBy: 'Sabbir Rahman', date: '2026-07-04', size: '14.1 MB', version: 'v2.0' },
          { id: 'doc3', name: 'Staff Code of Conduct Handbook.docx', category: 'HR', type: 'DOCX', uploadedBy: 'Tasnim Ahmed', date: '2026-06-15', size: '840 KB', version: 'v1.0' }
        ];
        if (legacyDocs) {
          try { initialDocs = JSON.parse(legacyDocs); } catch (e) {}
        }
        const seededDocs = await seedCollectionIfEmpty('documents', initialDocs);
        setDocuments(seededDocs || []);
        if (legacyDocs) {
          localStorage.removeItem('nexova_docs');
        }

        // 2. Contracts
        const legacyContracts = localStorage.getItem('nexova_doc_contracts');
        let initialContracts: SignatureContract[] = [
          { id: 'ct1', title: 'Cement Bulk Distribution Indemnity Deed', clientName: 'Purbachal Housing Ltd', dateSent: '2026-07-02', status: 'Pending Signature' },
          { id: 'ct2', title: 'Narayanganj Yard Leasing Contract', clientName: 'Nexova Logistics', dateSent: '2026-06-25', status: 'Signed', signedTimestamp: '2026-06-26 10:45 AM' }
        ];
        if (legacyContracts) {
          try { initialContracts = JSON.parse(legacyContracts); } catch (e) {}
        }
        const seededContracts = await seedCollectionIfEmpty('docContracts', initialContracts);
        setContracts(seededContracts || []);
        if (legacyContracts) {
          localStorage.removeItem('nexova_doc_contracts');
        }
      } catch (err) {
        // Intentionally silent: background local document data migration on component mount
        console.error("Documents migration failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('documents', documents);
  }, [documents, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('docContracts', contracts);
  }, [contracts, loading]);

  // --- SEARCH QUERY & FOLDER FILTER ---
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // --- OCR SCANNER STATES ---
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrFileName, setOcrFileName] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [ocrResult, setOcrResult] = useState<any>(null);

  // --- MODAL FORM STATES ---
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '', category: 'Finance' as ERPDocument['category'], type: 'PDF'
  });

  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    title: '', clientName: ''
  });

  // --- ACTIONS ---
  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name) return;
    const newDoc: ERPDocument = {
      id: `doc_${Date.now()}`,
      name: docForm.name.endsWith(`.${docForm.type.toLowerCase()}`) ? docForm.name : `${docForm.name}.${docForm.type.toLowerCase()}`,
      category: docForm.category,
      type: docForm.type,
      uploadedBy: 'System Auditor',
      date: new Date().toISOString().split('T')[0],
      size: '1.2 MB',
      version: 'v1.0'
    };
    setDocuments([newDoc, ...documents]);
    setDocForm({ name: '', category: 'Finance', type: 'PDF' });
    setShowDocModal(false);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.title || !contractForm.clientName) return;
    const newC: SignatureContract = {
      id: `ct_${Date.now()}`,
      title: contractForm.title,
      clientName: contractForm.clientName,
      dateSent: new Date().toISOString().split('T')[0],
      status: 'Pending Signature'
    };
    setContracts([newC, ...contracts]);
    setContractForm({ title: '', clientName: '' });
    setShowContractModal(false);
  };

  const handleSignContract = (id: string) => {
    setContracts(contracts.map(c => c.id === id ? {
      ...c,
      status: 'Signed' as const,
      signedTimestamp: new Date().toLocaleString()
    } : c));
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this document? This cannot be undone.')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleArchiveDoc = (id: string) => {
    setDocuments(documents.map(d => d.id === id ? {
      ...d,
      isArchived: true,
      archivedDate: new Date().toISOString().split('T')[0]
    } : d));
  };

  const handleRestoreDoc = (id: string) => {
    setDocuments(documents.map(d => d.id === id ? {
      ...d,
      isArchived: false
    } : d));
  };

  // --- OCR TRIGGER ---
  const triggerOcrScan = () => {
    if (!ocrFileName) {
      alert('Please enter a mock document file name to scan.');
      return;
    }
    setOcrStatus('scanning');
    setTimeout(() => {
      setOcrStatus('completed');
      setOcrResult({
        vendorName: 'Meghna Cement Mills Ltd',
        tin: '109281039829',
        subtotal: 450000,
        tax: 22500,
        grandTotal: 472500,
        currency: 'BDT',
        extractedItems: [
          { item: 'Portland cement (Grade 50)', qty: '1000 bags', rate: '450 BDT' }
        ]
      });
    }, 2000);
  };

  // --- FILTERS ---
  const filteredDocs = documents.filter(d => {
    if (d.isArchived) return false;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const archivedDocs = documents.filter(d => d.isArchived);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Document Management System (DMS)</h2>
          <p className="text-xs text-slate-400 mt-1">Nurture and archive legal agreements, verify audit records, scan receipts with AI OCR, and manage secure digital signboards.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentTab === 'document_center' && (
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </button>
          )}
          {currentTab === 'digital_signature' && (
            <button
              onClick={() => setShowContractModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Send Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER CONTENT */}
      {currentTab === 'document_center' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search document archives, files, names or uploaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                <option value="All">All Vaults</option>
                <option value="Finance">Finance Folder</option>
                <option value="HR">HR Folder</option>
                <option value="Logistics">Logistics Folder</option>
                <option value="Legal">Legal Folder</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Document File Name</th>
                  <th className="py-2.5 px-4">Vault Folder</th>
                  <th className="py-2.5 px-4">File Format</th>
                  <th className="py-2.5 px-4">Uploaded By</th>
                  <th className="py-2.5 px-4">Date Added</th>
                  <th className="py-2.5 px-4 text-right">File Size</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No documents found in the selected folder.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(d => (
                    <tr key={d.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span>{d.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1 rounded">{d.version}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {d.category} Folder
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{d.type}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{d.uploadedBy}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{d.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{d.size}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => alert(`Downloading file: ${d.name}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Download File"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveDoc(d.id)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Archive Document"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'attachments' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">ERP Attachment Map</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Attach scan vouchers, driver license files, or raw freight documents directly inside sales invoices, supplier purchase orders, and employee payroll slips.
          </p>
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex gap-3">
            <Paperclip className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-800 leading-normal font-medium">
              Files uploaded to the document repository are automatically linked across the financial ledger, ensuring quick auditor reviews.
            </p>
          </div>
        </div>
      )}

      {currentTab === 'ocr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">AI OCR Receipt Scanner</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Virtual Bill File Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Meghna_Cement_Lot_789.pdf"
                  value={ocrFileName}
                  onChange={e => setOcrFileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/20 hover:border-indigo-400 transition-colors">
                <Paperclip className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Drag & Drop Bill Scan File Here</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
              </div>
              <button
                type="button"
                onClick={triggerOcrScan}
                disabled={ocrStatus === 'scanning'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Cpu className="h-4 w-4" />
                <span>{ocrStatus === 'scanning' ? 'Scanning receipt...' : 'Run AI OCR Extraction'}</span>
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>OCR Structured Output</span>
            </h3>
            {ocrStatus === 'idle' && (
              <p className="text-xs text-slate-400 text-center py-12">Upload a mock file and trigger the scanner to see extracted parameters.</p>
            )}
            {ocrStatus === 'scanning' && (
              <div className="space-y-3 animate-pulse py-12 text-center">
                <div className="h-2.5 bg-slate-200 rounded-full w-24 mx-auto"></div>
                <div className="h-2 bg-slate-200 rounded-full max-w-[120px] mx-auto"></div>
              </div>
            )}
            {ocrStatus === 'completed' && ocrResult && (
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-400">VENDOR</span>
                  <span className="font-extrabold text-slate-800">{ocrResult.vendorName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-400">TIN NUMBER</span>
                  <span className="font-mono text-slate-800">{ocrResult.tin}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-400">SUBTOTAL</span>
                  <span className="font-semibold text-slate-800">৳{ocrResult.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-400">VAT/TAX AMOUNT</span>
                  <span className="font-semibold text-slate-800">৳{ocrResult.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-400">TOTAL BDT AMOUNT</span>
                  <span className="font-extrabold text-emerald-600">৳{ocrResult.grandTotal.toLocaleString()} BDT</span>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-150 rounded mt-3">
                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Parsed Items</span>
                  <p className="font-medium text-slate-700">{ocrResult.extractedItems[0].item} x {ocrResult.extractedItems[0].qty} @ {ocrResult.extractedItems[0].rate}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'digital_signature' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Digital Signature & Contracts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map(c => (
              <div key={c.id} className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{c.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Recipient: {c.clientName}</p>
                  </div>
                  <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full ${
                    c.status === 'Signed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="border-t border-slate-100/60 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Sent: {c.dateSent}</span>
                  {c.status === 'Signed' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Signed {c.signedTimestamp}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSignContract(c.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Sign Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'archive' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Operational Audit Archive Logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Documents moved to cold storage. Retained for corporate governance and regulatory compliance.</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold border border-amber-100 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-center">
              Total Archived: {archivedDocs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Document File Name</th>
                  <th className="py-2.5 px-4">Vault Folder</th>
                  <th className="py-2.5 px-4">Original Date</th>
                  <th className="py-2.5 px-4">Archived Date</th>
                  <th className="py-2.5 px-4 text-right">File Size</th>
                  <th className="py-2.5 px-4 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      <Archive className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      No archived documents in cold storage.
                    </td>
                  </tr>
                ) : (
                  archivedDocs.map(d => (
                    <tr key={d.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600 bg-slate-50/10">
                      <td className="py-3 px-4 font-semibold text-slate-500 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="line-through">{d.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-1 rounded">{d.version}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {d.category} Folder
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{d.date}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 font-bold">{d.archivedDate || d.date}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-400">{d.size}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleRestoreDoc(d.id)}
                          className="px-2.5 py-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg cursor-pointer transition-colors"
                          title="Restore to Document Center"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(d.id)}
                          className="px-2.5 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg cursor-pointer transition-colors"
                          title="Delete Permanently"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateDoc} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Upload DMS Archive File</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Document Name *</label>
                <input
                  type="text"
                  required
                  value={docForm.name}
                  onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="e.g., Steel_Standard_Report"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Vault Folder</label>
                  <select
                    value={docForm.category}
                    onChange={e => setDocForm({ ...docForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">File Type Extension</label>
                  <select
                    value={docForm.type}
                    onChange={e => setDocForm({ ...docForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="XLSX">Excel Sheet</option>
                    <option value="DOCX">Word Document</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Save Archive
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTRACT MODAL */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateContract} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Send Secure Contract Link</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Contract Deed Title *</label>
                <input
                  type="text"
                  required
                  value={contractForm.title}
                  onChange={e => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="e.g., Raw Steel Freight Indemnity Deed"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Recipient Customer Firm *</label>
                <input
                  type="text"
                  required
                  value={contractForm.clientName}
                  onChange={e => setContractForm({ ...contractForm, clientName: e.target.value })}
                  placeholder="e.g., Baitul Mukarram Builders"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Send Contract
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
