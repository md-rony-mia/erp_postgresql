import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Edit2,
  Archive,
  RotateCcw,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  User,
  Users,
  Grid,
  Lock,
  History,
  Shield,
  Layers,
  HelpCircle,
  Database,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  X,
  PlusCircle,
  Filter,
  Check,
  Building,
  Activity,
  GitMerge,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Wrench,
  Sparkles
} from 'lucide-react';
import MetadataFormEngine from './MetadataFormEngine';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

// ==========================================
// UNIVERSAL CRUD SCHEMAS & TYPES
// ==========================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'select'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'richText'
  | 'image'
  | 'attachment'
  | 'barcode'
  | 'qr'
  | 'gps'
  | 'signature'
  | 'colorPicker'
  | 'jsonEditor'
  | 'repeatable'
  | 'nested';

export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

export interface FieldValidation {
  ruleType: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'regex';
  ruleValue?: any;
  errorMessage: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  options?: FieldOption[];
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  validationRules?: FieldValidation[];
  dependsOn?: { field: string; value: any; operator?: 'equals' | 'contains' | 'notEquals' };
  formula?: string;
  lookupTable?: string;
  lookupField?: string;
  autocompletePresets?: string[];
  subFields?: FieldDef[];
}

export interface DeleteBlockingRule {
  localStorageKey: string;
  referenceField: string;
  entityLabelEn: string;
  entityLabelBn: string;
}

export interface ModuleConfig {
  moduleKey: string;
  moduleName: string;
  iconName: string;
  primaryKey: string;
  fields: FieldDef[];
  workflowStatuses?: string[];
  deleteBlockingRules?: DeleteBlockingRule[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'ARCHIVE' | 'RESTORE' | 'BULK_UPDATE' | 'BULK_DELETE' | 'APPROVE';
  recordId: string;
  recordName: string;
  details: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  ipAddress: string;
  browser: string;
}

export interface RevisionHistory {
  id: string;
  recordId: string;
  timestamp: string;
  snapshot: any;
  action: string;
  user: string;
}

interface UniversalCrudEngineProps {
  config: ModuleConfig;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
  initialSeedData?: any[];
  onDataChange?: (data: any[]) => void;
}

// ==========================================
// SEED GENERATOR HELPER
// ==========================================
const getSeedDataForModule = (moduleKey: string): any[] => {
  switch (moduleKey) {
    case 'leads':
      return [
        { id: 'lead_1', name: 'Al-Amin Rahman', company: 'Baitul Mukarram Builders', value: 350000, email: 'amin@bmbuilders.com', phone: '01712345678', assignedRep: 'Siam Hossain', campaign: 'Q3 Discount', status: 'Approved', notes: 'Interested in Grade-A Lafarge cement bulk supply.', isArchived: false, createdAt: '2026-06-15' },
        { id: 'lead_2', name: 'Kamal Uddin', company: 'Crown Tower Associates', value: 1200000, email: 'kamal@crowntower.bd', phone: '01811223344', assignedRep: 'Al-Amin Rahman', campaign: 'Summer Promo', status: 'Pending Approval', notes: 'Requires high strength concrete admixture. 50% advance terms.', isArchived: false, createdAt: '2026-07-02' },
        { id: 'lead_3', name: 'Nadia Yasmin', company: 'Dhaka Airport Expansion', value: 4500000, email: 'nadia@daep.gov.bd', phone: '01911998877', assignedRep: 'Siam Hossain', campaign: 'None', status: 'Draft', notes: 'Government infrastructure project tender. Heavy verification required.', isArchived: false, createdAt: '2026-07-08' },
        { id: 'lead_4', name: 'Rashedul Islam', company: 'Mirpur Metro Rail Group', value: 2800000, email: 'rashed@mmrg.org', phone: '01511554433', assignedRep: 'Kamal Uddin', campaign: 'Q3 Discount', status: 'Approved', notes: 'SLA discussion ongoing. Wants customized packaging bags.', isArchived: true, createdAt: '2026-05-20' },
      ];
    case 'employees':
      return [
        { id: 'emp_1', name: 'Arif Hossain', department: 'Engineering', designation: 'Lead QA Officer', salary: 45000, email: 'arif@nexovaerp.com', phone: '01712999888', status: 'Approved', workStatus: 'Active', joiningDate: '2024-03-01', isArchived: false },
        { id: 'emp_2', name: 'Tasnim Jahan', department: 'HR', designation: 'Senior Talent Acquisition', salary: 38000, email: 'tasnim@nexovaerp.com', phone: '01815123456', status: 'Approved', workStatus: 'Active', joiningDate: '2025-01-15', isArchived: false },
        { id: 'emp_3', name: 'Sajid Iqbal', department: 'Sales', designation: 'Accounts representative', salary: 32000, email: 'sajid@nexovaerp.com', phone: '01912334455', status: 'Approved', workStatus: 'Active', joiningDate: '2025-06-01', isArchived: false },
        { id: 'emp_4', name: 'Farhan Mahmud', department: 'Accounts', designation: 'Finance Executive', salary: 55000, email: 'farhan@nexovaerp.com', phone: '01616778899', status: 'Pending Approval', workStatus: 'Active', joiningDate: '2026-05-10', isArchived: false },
      ];
    case 'assets':
      return [
        { id: 'ast_1', code: 'AST-CLNK-01', name: 'Dry Clinker Crusher v3', category: 'Machinery', purchasePrice: 8500000, purchaseDate: '2023-05-12', usefulLife: 10, depreciationMethod: 'Double Declining', status: 'Approved', condition: 'Active', isArchived: false },
        { id: 'ast_2', code: 'AST-SERV-09', name: 'Enterprise Cloud Rack Host', category: 'IT Equipment', purchasePrice: 1200000, purchaseDate: '2025-10-01', usefulLife: 5, depreciationMethod: 'Straight Line', status: 'Approved', condition: 'Active', isArchived: false },
        { id: 'ast_3', code: 'AST-TRK-085', name: 'Tata Prime 40T Hauler', category: 'Vehicles', purchasePrice: 3200000, purchaseDate: '2024-08-20', usefulLife: 8, depreciationMethod: 'Straight Line', status: 'Approved', condition: 'In Maintenance', isArchived: false },
        { id: 'ast_4', code: 'AST-BLD-012', name: 'Mirpur Cement Silo Plot', category: 'Land & Buildings', purchasePrice: 18000000, purchaseDate: '2022-01-05', usefulLife: 30, depreciationMethod: 'Straight Line', status: 'Approved', condition: 'Active', isArchived: false },
      ];
    case 'projects':
      return [
        { id: 'prj_1', code: 'PRJ-MDT-01', projectName: 'Madani Tower Foundation', clientFirm: 'Meghna Housing Ltd', budget: 12500000, manager: 'Engr. Jamil Chowdhury', priority: 'High', status: 'Approved', stage: 'Active', isArchived: false },
        { id: 'prj_2', code: 'PRJ-PMR-02', projectName: 'Purbachal Metro Ring', clientFirm: 'Rajuk Civil Dept', budget: 48000000, manager: 'Engr. Shuvro Dey', priority: 'High', status: 'Approved', stage: 'Active', isArchived: false },
        { id: 'prj_3', code: 'PRJ-SGL-14', projectName: 'Siam Glass Kiln Refractory', clientFirm: 'Siam Glass Ltd', budget: 6500000, manager: 'Engr. Rashedul Alam', priority: 'Medium', status: 'Pending Approval', stage: 'Planned', isArchived: false },
      ];
    case 'service':
      return [
        { id: 'svc_1', ticketNo: 'SVC-2026-102', clientName: 'Baitul Mukarram Builders', productRef: 'Deformed Bar 60G', issueType: 'Micro deflections during slab pour', urgency: 'High', assignedTech: 'Engr. Kamal Hasan', costEstimate: 120000, status: 'Approved', completionStage: 'Review', isArchived: false },
        { id: 'svc_2', ticketNo: 'SVC-2026-145', clientName: 'Siam Glass Ltd', productRef: 'Portland Composite Cement', issueType: 'Fast setting time anomaly', urgency: 'Medium', assignedTech: 'Chemist Sajib Roy', costEstimate: 45000, status: 'Approved', completionStage: 'Active', isArchived: false },
      ];
    default:
      return [];
  }
};

// ==========================================
// RENDER LUCIDE ICONS
// ==========================================
const renderModuleIcon = (iconName: string, className: string = 'w-5 h-5') => {
  const allIcons = { Settings, Users, Briefcase, Database, Calendar, Wrench, Activity, Sparkles, Building, Layers, GitMerge };
  const IconComponent = (allIcons as any)[iconName] || Database;
  return <IconComponent className={className} />;
};

export default function UniversalCrudEngine({
  config,
  currentUser = { name: 'Rony Mia', role: 'Administrator', email: 'ronymia2022@gmail.com' },
  initialSeedData,
  onDataChange,
}: UniversalCrudEngineProps) {
  
  const { moduleKey, moduleName, primaryKey, fields, workflowStatuses = ['Draft', 'Pending Approval', 'Approved'] } = config;

  // --- STATE CORE ---
  const [data, setData] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  
  // --- PAGINATION & SORTING ---
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- INTERACTIVE COLUMN FILTERS ---
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    fields.forEach(f => {
      initial[f.key] = true;
    });
    return initial;
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // --- ADVANCED SEARCH BUILDER ---
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{ id: string; field: string; operator: string; value: string }[]>([]);

  // --- REVISION HISTORY & AUDIT ---
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [revisions, setRevisions] = useState<RevisionHistory[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);

  // --- MODAL CONTROLS ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any | null>(null); // Null for Add, Record for Edit/View
  const [viewOnly, setViewOnly] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- BULK OPERATIONS ---
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFieldToUpdate, setBulkFieldToUpdate] = useState('');
  const [bulkValueToUpdate, setBulkValueToUpdate] = useState<any>('');

  const [loading, setLoading] = useState(true);
  const isMigrated = useMemo(() => ['projects', 'leads', 'campaigns', 'assets'].includes(moduleKey), [moduleKey]);

  // --- LOAD INITIAL DATA ---
  useEffect(() => {
    async function loadAndMigrate() {
      try {
        setLoading(true);
        if (isMigrated) {
          const legacyData = localStorage.getItem(`nexova_crud_${moduleKey}`);
          let initialData = initialSeedData || getSeedDataForModule(moduleKey);
          if (legacyData) {
            try { initialData = JSON.parse(legacyData); } catch (e) {
              // Intentionally silent: legacy local CRUD migration parse error fallback
              console.error(e);
            }
          }
          const seeded = await seedCollectionIfEmpty(moduleKey, initialData);
          setData(seeded || []);
          
          // Clear legacy so we don't migrate again
          localStorage.setItem(`nexova_crud_${moduleKey}_migrated`, 'true');
          localStorage.removeItem(`nexova_crud_${moduleKey}`);
        } else {
          const savedData = localStorage.getItem(`nexova_crud_${moduleKey}`);
          if (savedData) {
            try {
              setData(JSON.parse(savedData));
            } catch (e) {
              // Intentionally silent: legacy local saved CRUD parse error fallback
              console.error(e);
            }
          } else {
            const seed = initialSeedData || getSeedDataForModule(moduleKey);
            setData(seed);
            localStorage.setItem(`nexova_crud_${moduleKey}`, JSON.stringify(seed));
          }
        }
      } catch (err) {
        // Intentionally silent: background data migration on mount of dynamic CRUD module
        console.error("Failed to load / migrate CRUD collection:", moduleKey, err);
      } finally {
        setLoading(false);
      }
    }

    loadAndMigrate();

    // Load Audit Logs
    const savedAudits = localStorage.getItem(`nexova_crud_audit_${moduleKey}`);
    if (savedAudits) {
      try { setAuditLogs(JSON.parse(savedAudits)); } catch (e) {}
    }

    // Load Revisions
    const savedRevs = localStorage.getItem(`nexova_crud_revs_${moduleKey}`);
    if (savedRevs) {
      try { setRevisions(JSON.parse(savedRevs)); } catch (e) {}
    }
  }, [moduleKey, initialSeedData, isMigrated]);

  // --- FIRESTORE AUTO-SYNCHRONIZER ---
  useEffect(() => {
    if (loading || !isMigrated) return;
    syncCollectionToFirestore(moduleKey, data);
  }, [data, loading, moduleKey, isMigrated]);

  // --- SYNC DATA SAVER ---
  const syncAndSave = (updatedData: any[]) => {
    setData(updatedData);
    if (!isMigrated) {
      localStorage.setItem(`nexova_crud_${moduleKey}`, JSON.stringify(updatedData));
    } else {
      syncCollectionToFirestore(moduleKey, updatedData);
    }
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const syncAuditLogs = (updatedAudits: AuditEntry[]) => {
    setAuditLogs(updatedAudits);
    localStorage.setItem(`nexova_crud_audit_${moduleKey}`, JSON.stringify(updatedAudits));
  };

  const syncRevisions = (updatedRevs: RevisionHistory[]) => {
    setRevisions(updatedRevs);
    localStorage.setItem(`nexova_crud_revs_${moduleKey}`, JSON.stringify(updatedRevs));
  };

  // --- LOG AUDIT ENTRY ---
  const logAuditEvent = (
    action: AuditEntry['action'],
    recordId: string,
    recordName: string,
    details: string,
    changes?: AuditEntry['changes']
  ) => {
    const newEntry: AuditEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString(),
      user: currentUser.name || 'System Operator',
      role: currentUser.role || 'Guest',
      action,
      recordId,
      recordName,
      details,
      changes,
      ipAddress: `192.168.12.${Math.floor(Math.random() * 254) + 1}`,
      browser: 'Chrome 124.0.0 Enterprise Secure Link',
    };
    const updatedAudits = [newEntry, ...auditLogs];
    syncAuditLogs(updatedAudits);
  };

  // --- LOG REVISION SNAPSHOT ---
  const logRevisionSnapshot = (recordId: string, snapshot: any, action: string) => {
    const newRev: RevisionHistory = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recordId,
      timestamp: new Date().toLocaleString(),
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      action,
      user: currentUser.name || 'Rony Mia',
    };
    const updatedRevs = [newRev, ...revisions];
    syncRevisions(updatedRevs);
  };

  // --- ROLE PERMISSION CHECKER ---
  const canPerform = (action: 'read' | 'write' | 'delete' | 'duplicate' | 'archive' | 'audit') => {
    const role = currentUser.role || 'Guest';
    if (role === 'Administrator') return true;
    if (role === 'Manager') {
      return action !== 'delete' && action !== 'audit';
    }
    // Sales Agent / Staff
    if (role === 'Sales Agent' || role === 'Staff' || role === 'Warehouse Staff') {
      return action === 'read' || action === 'write' || action === 'duplicate';
    }
    return action === 'read';
  };

  // ==========================================
  // COMPREHENSIVE FILTER ENGINE (READ)
  // ==========================================
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Archive check
      const rowArchived = !!row.isArchived;
      if (showArchived && !rowArchived) return false;
      if (!showArchived && rowArchived) return false;

      // 2. Workflow status check
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;

      // 3. Fuzzy search across all searchable fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesFuzzy = fields.some((field) => {
          if (field.searchable === false) return false;
          const val = row[field.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
        if (!matchesFuzzy) return false;
      }

      // 4. Individual Column Header Filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const rowVal = row[key];
        if (rowVal === undefined || rowVal === null) return false;
        return String(rowVal).toLowerCase().includes(String(filterValue).toLowerCase());
      });
      if (!matchesColumnFilters) return false;

      // 5. Advanced filter constraints builder
      if (showAdvancedFilters && advancedFilters.length > 0) {
        const matchesAdvanced = advancedFilters.every((f) => {
          if (!f.field || !f.operator) return true;
          const rowVal = row[f.field];
          const queryVal = f.value;

          const numVal = Number(rowVal);
          const filterNumVal = Number(queryVal);

          switch (f.operator) {
            case 'equals':
              return String(rowVal).toLowerCase() === String(queryVal).toLowerCase();
            case 'contains':
              return String(rowVal).toLowerCase().includes(String(queryVal).toLowerCase());
            case 'startsWith':
              return String(rowVal).toLowerCase().startsWith(String(queryVal).toLowerCase());
            case 'greaterThan':
              return !isNaN(numVal) && numVal > filterNumVal;
            case 'lessThan':
              return !isNaN(numVal) && numVal < filterNumVal;
            case 'empty':
              return rowVal === undefined || rowVal === null || String(rowVal).trim() === '';
            default:
              return true;
          }
        });
        if (!matchesAdvanced) return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, showArchived, columnFilters, advancedFilters, showAdvancedFilters, fields]);

  // --- SORT DATA GRID ---
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // --- PAGINATED GRID VIEW ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

  // --- RESET PAGE IF EXCEEDS TOTAL ---
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    if (field?.sortable === false) return;
    if (sortField === fieldKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldKey);
      setSortDirection('asc');
    }
  };

  // ==========================================
  // EXPORT / REPORT GENERATION ENGINE
  // ==========================================
  const handleExportCSV = () => {
    if (!canPerform('read')) {
      alert('Access Restricted.');
      return;
    }
    // Filter active headers
    const exportableFields = fields.filter((f) => visibleColumns[f.key]);
    const headers = exportableFields.map((f) => `"${f.label}"`).join(',');
    const rows = sortedData.map((row) => {
      return exportableFields
        .map((f) => {
          const val = row[f.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nexova_ERP_${moduleKey}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('CREATE', 'export_csv', 'CSV Database', `Downloaded standard CSV export containing ${sortedData.length} records.`);
  };

  const handleExportExcel = () => {
    if (!canPerform('read')) {
      alert('Access Restricted.');
      return;
    }
    const exportableFields = fields.filter((f) => visibleColumns[f.key]);
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
            th { background-color: #6366f1; color: white; font-weight: bold; padding: 12px; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; font-size: 13px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .title { font-size: 18px; font-weight: bold; color: #1e1b4b; padding: 10px 0; }
          </style>
        </head>
        <body>
          <div class="title">Nexova Enterprise ERP — ${moduleName} Dataset</div>
          <table>
            <thead>
              <tr>
                ${exportableFields.map((f) => `<th>${f.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sortedData
                .map(
                  (row) => `
                <tr>
                  ${exportableFields
                    .map((f) => {
                      const val = row[f.key];
                      if (f.type === 'currency') {
                        return `<td style="mso-number-format:'৳#,##0.00'; font-weight:bold;">৳${Number(val || 0).toLocaleString()}</td>`;
                      }
                      return `<td>${val ?? ''}</td>`;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nexova_ERP_${moduleKey}_excel_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('CREATE', 'export_excel', 'Excel Spreadsheet', `Downloaded styled XML spreadsheet containing ${sortedData.length} records.`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const exportableFields = fields.filter((f) => visibleColumns[f.key]);

    printWindow.document.write(`
      <html>
        <head>
          <title>${moduleName} Matrix Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 24px; font-weight: 800; color: #1e1b4b; border-bottom: 3px solid #4f46e5; pb-2; margin-bottom: 4px; }
            h2 { font-size: 11px; text-transform: uppercase; tracking-wider; color: #64748b; margin-top: 0; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 10px; font-size: 11px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { font-weight: bold; padding: 2px 6px; border-radius: 9999px; font-size: 9px; text-transform: uppercase; }
            .badge-approved { background-color: #d1fae5; color: #065f46; }
            .badge-pending { background-color: #fef3c7; color: #d97706; }
            .badge-draft { background-color: #f1f5f9; color: #475569; }
            .currency { font-family: monospace; font-weight: bold; color: #0f172a; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; pt-15; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>NEXOVA ENTERPRISE ERP</h1>
          <h2>DYNAMIC OPERATIONS REGISTER: ${moduleName.toUpperCase()}</h2>
          <table>
            <thead>
              <tr>
                ${exportableFields.map((f) => `<th>${f.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sortedData
                .map(
                  (row) => `
                <tr>
                  ${exportableFields
                    .map((f) => {
                      const val = row[f.key];
                      if (f.type === 'currency') {
                        return `<td class="currency">৳${Number(val || 0).toLocaleString()}</td>`;
                      }
                      if (f.key === 'status') {
                        const statusClass = String(val).toLowerCase() === 'approved' ? 'badge-approved' : String(val).toLowerCase().includes('pending') ? 'badge-pending' : 'badge-draft';
                        return `<td><span class="badge ${statusClass}">${val}</span></td>`;
                      }
                      return `<td>${val ?? ''}</td>`;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            <span>AUDITED SYSTEM REPORT • STAMP SECURE</span>
            <span>DATE GENERATED: ${new Date().toLocaleString()}</span>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    logAuditEvent('CREATE', 'export_print', 'Print Layout', `Opened system print layout for ${sortedData.length} records.`);
  };

  const handleExportPDF = () => {
    // PDF simulated generation triggering printer in print mode
    handlePrint();
  };

  // ==========================================
  // DYNAMIC FORM VALIDATION ENGINE
  // ==========================================
  const validateForm = () => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const val = formData[field.key];

      // Required constraint
      if (field.required && (val === undefined || val === null || String(val).trim() === '')) {
        errors[field.key] = `${field.label} is required.`;
        return;
      }

      // Unique Constraint (during Creation)
      if (field.unique && !currentRecord) {
        const isDuplicated = data.some((item) => String(item[field.key]).toLowerCase().trim() === String(val || '').toLowerCase().trim());
        if (isDuplicated) {
          errors[field.key] = `${field.label} already exists in the system. Double entry rejected.`;
        }
      }

      // Format constraints
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val))) {
            errors[field.key] = `Invalid corporate email format.`;
          }
        }
        if (field.type === 'phone') {
          const phoneRegex = /^01[3-9]\d{8}$/;
          if (!phoneRegex.test(String(val))) {
            errors[field.key] = `Invalid Bangladesh phone (format: 017XXXXXXXX).`;
          }
        }
      }

      // Custom Validation rules matching config
      if (field.validationRules) {
        field.validationRules.forEach((rule) => {
          if (rule.ruleType === 'minLength' && String(val || '').length < Number(rule.ruleValue)) {
            errors[field.key] = rule.errorMessage;
          }
          if (rule.ruleType === 'maxLength' && String(val || '').length > Number(rule.ruleValue)) {
            errors[field.key] = rule.errorMessage;
          }
          if (rule.ruleType === 'min' && Number(val) < Number(rule.ruleValue)) {
            errors[field.key] = rule.errorMessage;
          }
          if (rule.ruleType === 'max' && Number(val) > Number(rule.ruleValue)) {
            errors[field.key] = rule.errorMessage;
          }
          if (rule.ruleType === 'regex') {
            const rx = new RegExp(rule.ruleValue);
            if (!rx.test(String(val))) {
              errors[field.key] = rule.errorMessage;
            }
          }
        });
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==========================================
  // CORE CRUD TRIGGER ACTIONS
  // ==========================================
  const handleOpenAddForm = () => {
    if (!canPerform('write')) {
      alert('Your current security clearance does not permit database write actions.');
      return;
    }
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      defaults[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    defaults.status = 'Draft';
    defaults.isArchived = false;

    setFormData(defaults);
    setCurrentRecord(null);
    setViewOnly(false);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEditForm = (record: any, viewMode = false) => {
    if (viewMode === false && !canPerform('write')) {
      alert('Your current security clearance does not permit database write actions.');
      return;
    }
    setFormData({ ...record });
    setCurrentRecord(record);
    setViewOnly(viewMode);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;

    if (!validateForm()) {
      return;
    }

    if (currentRecord) {
      // UPDATE
      const previousState = { ...currentRecord };
      const updatedList = data.map((item) => (item[primaryKey] === currentRecord[primaryKey] ? { ...item, ...formData } : item));
      syncAndSave(updatedList);

      // Log changes
      const fieldChanges: AuditEntry['changes'] = [];
      fields.forEach((f) => {
        if (previousState[f.key] !== formData[f.key]) {
          fieldChanges.push({
            field: f.key,
            oldValue: previousState[f.key],
            newValue: formData[f.key],
          });
        }
      });

      logAuditEvent(
        'UPDATE',
        currentRecord[primaryKey],
        formData.name || formData.projectName || formData.ticketNo || currentRecord[primaryKey],
        `Updated details on reference ID ${currentRecord[primaryKey]}.`,
        fieldChanges
      );
      logRevisionSnapshot(currentRecord[primaryKey], previousState, 'PRE_UPDATE_SNAPSHOT');
    } else {
      // CREATE
      const newId = `${moduleKey.substring(0, 3)}_${Date.now()}`;
      const newRecord = {
        ...formData,
        [primaryKey]: newId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updatedList = [newRecord, ...data];
      syncAndSave(updatedList);

      logAuditEvent(
        'CREATE',
        newId,
        newRecord.name || newRecord.projectName || newRecord.ticketNo || newId,
        `Created new operational record entry with reference ID ${newId}.`
      );
    }

    setShowFormModal(false);
  };

  const handleDeleteRecord = (id: string, name: string) => {
    if (!canPerform('delete')) {
      alert('Security violation: Only Administrators possess record deletion privileges.');
      return;
    }
    const record = data.find((r) => r[primaryKey] === id);
    if (!record) return;

    // --- GENERIC TRANSACTION REFERENCE SAFETY CHECKS ---
    if (config.deleteBlockingRules && config.deleteBlockingRules.length > 0) {
      for (const rule of config.deleteBlockingRules) {
        try {
          const rawRefData = localStorage.getItem(rule.localStorageKey);
          if (rawRefData) {
            const parsedRefData = JSON.parse(rawRefData);
            if (Array.isArray(parsedRefData)) {
              const hasReference = parsedRefData.some((item: any) => String(item[rule.referenceField]) === String(id));
              if (hasReference) {
                alert(
                  `দুঃখিত, এই রেকর্ডটি (${name}) ডিলিট করা সম্ভব নয় কারণ এটি নিম্নোক্ত ট্রানজেকশনে ব্যবহৃত হচ্ছে:\n\n` +
                  `* ${rule.entityLabelBn} (${rule.entityLabelEn})\n\n` +
                  `সিস্টেমের ডাটা ইন্টিগ্রিটির জন্য এটি ডিলিট করা সম্পূর্ণ ব্লক করা হয়েছে।\n\n` +
                  `/ Sorry, this record (${name}) cannot be deleted because it is referenced in the following operational data:\n\n` +
                  `* ${rule.entityLabelEn} (${rule.entityLabelBn})\n\n` +
                  `Deletion is strictly blocked to maintain database integrity.`
                );
                return;
              }
            }
          }
        } catch (e) {
          console.error("Failed to run delete blocking rule check:", rule, e);
        }
      }
    }

    if (confirm(`Are you sure you want to permanently delete record "${name}"? This is completely irreversible and logs auditing flags.`)) {
      const updated = data.filter((r) => r[primaryKey] !== id);
      syncAndSave(updated);

      logAuditEvent('DELETE', id, name, `Permanently purged record entry from core ERP database tables.`);
      logRevisionSnapshot(id, record, 'DELETED_RESTORE_POINT');
    }
  };

  const handleDuplicateRecord = (record: any) => {
    if (!canPerform('duplicate')) {
      alert('Access Restricted.');
      return;
    }
    const duplicateId = `${moduleKey.substring(0, 3)}_dup_${Date.now()}`;
    const duplicated = {
      ...record,
      [primaryKey]: duplicateId,
      name: record.name ? `${record.name} (Copy)` : undefined,
      projectName: record.projectName ? `${record.projectName} (Copy)` : undefined,
      ticketNo: record.ticketNo ? `${record.ticketNo}-DUP` : undefined,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Draft',
      isArchived: false,
    };

    const updated = [duplicated, ...data];
    syncAndSave(updated);

    logAuditEvent('DUPLICATE', duplicateId, duplicated.name || duplicated.projectName || duplicated.ticketNo || duplicateId, `Duplicated complete entry from template origin ${record[primaryKey]}.`);
  };

  const handleArchiveToggle = (record: any) => {
    if (!canPerform('archive')) {
      alert('Access Restricted.');
      return;
    }
    const nextArchivedState = !record.isArchived;
    const updated = data.map((r) => (r[primaryKey] === record[primaryKey] ? { ...r, isArchived: nextArchivedState } : r));
    syncAndSave(updated);

    const name = record.name || record.projectName || record.ticketNo || record[primaryKey];
    logAuditEvent(
      nextArchivedState ? 'ARCHIVE' : 'RESTORE',
      record[primaryKey],
      name,
      nextArchivedState
        ? `Transferred operational record into archived historical ledger tables.`
        : `Restored archived ledger record back into active live operations.`
    );
  };

  // ==========================================
  // BULK OPERATION ENGINE ACTIONS
  // ==========================================
  const handleBulkUpdateSubmit = () => {
    if (!bulkFieldToUpdate) return;
    const previousMap: Record<string, any> = {};
    data.forEach((r) => {
      if (selectedIds.includes(r[primaryKey])) {
        previousMap[r[primaryKey]] = { ...r };
      }
    });

    const updated = data.map((r) => {
      if (selectedIds.includes(r[primaryKey])) {
        let val: any = bulkValueToUpdate;
        const field = fields.find(f => f.key === bulkFieldToUpdate);
        if (field?.type === 'number' || field?.type === 'currency') {
          val = Number(bulkValueToUpdate);
        } else if (field?.type === 'boolean') {
          val = bulkValueToUpdate === 'true';
        }
        return { ...r, [bulkFieldToUpdate]: val };
      }
      return r;
    });

    syncAndSave(updated);
    logAuditEvent('BULK_UPDATE', 'bulk_update_set', `${selectedIds.length} Records`, `Executed bulk modification. Altered field "${bulkFieldToUpdate}" to "${bulkValueToUpdate}" across selected batch.`);
    setSelectedIds([]);
    setShowBulkModal(false);
    alert(`Successfully applied bulk update to ${selectedIds.length} rows.`);
  };

  const handleBulkDeleteSubmit = () => {
    if (!canPerform('delete')) {
      alert('Security violation: Only Administrators possess bulk deletion privileges.');
      return;
    }
    if (confirm(`Are you absolutely sure you want to permanently delete the ${selectedIds.length} selected records? This is non-reversible and is logged.`)) {
      const updated = data.filter((r) => !selectedIds.includes(r[primaryKey]));
      syncAndSave(updated);
      logAuditEvent('BULK_DELETE', 'bulk_delete_set', `${selectedIds.length} Records`, `Permanently purged selected dataset collection.`);
      setSelectedIds([]);
      alert(`Purged ${selectedIds.length} records successfully.`);
    }
  };

  const handleBulkApprovalSubmit = () => {
    const updated = data.map((r) => {
      if (selectedIds.includes(r[primaryKey])) {
        return { ...r, status: 'Approved' };
      }
      return r;
    });
    syncAndSave(updated);
    logAuditEvent('APPROVE', 'bulk_approval_set', `${selectedIds.length} Records`, `Batch processed workflow approval for selected entries.`);
    setSelectedIds([]);
    alert(`Approved ${selectedIds.length} records instantly.`);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((row) => row[primaryKey]));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // ==========================================
  // REVISION ROLLBACK CONTROLLER
  // ==========================================
  const handleRollbackRevision = (rev: RevisionHistory) => {
    if (!canPerform('write')) {
      alert('Access Restricted.');
      return;
    }
    const recordExists = data.some((r) => r[primaryKey] === rev.recordId);
    let updated: any[] = [];
    if (recordExists) {
      // Rollback current record
      updated = data.map((r) => (r[primaryKey] === rev.recordId ? rev.snapshot : r));
    } else {
      // Restore deleted record
      updated = [rev.snapshot, ...data];
    }
    syncAndSave(updated);

    logAuditEvent('RESTORE', rev.recordId, rev.snapshot.name || rev.snapshot.projectName || rev.snapshot.ticketNo || rev.recordId, `Executed rollback recovery. Restored record state to timestamp snapshot: [${rev.timestamp}].`);
    alert(`Success! Restored record state to ${rev.timestamp}.`);
    setShowRevisionPanel(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-[75vh] p-4 lg:p-6 space-y-6">
      
      {/* 1. COMPACT CONSOLE CONTROL HUB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm animate-in fade-in duration-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            {renderModuleIcon(config.iconName, 'h-5 w-5')}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
              <span>{moduleName}</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Universal CRUD</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Standardized metadata operations • Security Tier RBAC Active</p>
          </div>
        </div>

        {/* Dynamic controls panel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setShowAuditLogs(!showAuditLogs); setShowRevisionPanel(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
              showAuditLogs ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Audit trail tracking"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => { setShowRevisionPanel(!showRevisionPanel); setShowAuditLogs(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
              showRevisionPanel ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Revision recovery snapshots"
          >
            <History className="h-3.5 w-3.5" />
            <span>System Rollbacks ({revisions.length})</span>
          </button>

          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Record</span>
          </button>
        </div>
      </div>

      {/* 2. REVISION ROLLBACK & AUDIT TRAIL COLLAPSIBLES */}
      {showAuditLogs && (
        <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 space-y-4 animate-in slide-in-from-top-3 duration-200 max-h-[450px] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>Immutable Ledger Audit Logs — security database</span>
            </h4>
            <button onClick={() => setShowAuditLogs(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono py-4">No events logged in the current session.</p>
          ) : (
            <div className="space-y-2 font-mono text-[10px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-950 p-2.5 rounded border border-slate-800/60 leading-relaxed flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-indigo-900/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{log.action}</span>
                      <strong className="text-slate-100">{log.user} ({log.role})</strong>
                      <span className="text-slate-500">• IP: {log.ipAddress}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">Record: <strong className="text-white">{log.recordName}</strong> ({log.recordId}) — {log.details}</div>
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-1.5 pl-2.5 border-l-2 border-indigo-900/60 text-slate-400 space-y-0.5 text-[9px]">
                        {log.changes.map((ch, i) => (
                          // index key safe: fixed-order static list
                          <div key={i}>Altered [<strong>{ch.field}</strong>]: "{String(ch.oldValue ?? '')}" ➔ "<span className="text-indigo-400 font-bold">{String(ch.newValue ?? '')}</span>"</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-500 text-[9px] shrink-0">{log.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRevisionPanel && (
        <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 space-y-4 animate-in slide-in-from-top-3 duration-200 max-h-[450px] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History className="h-4 w-4 text-amber-500" />
              <span>Snapshot Rollback Points — operational security revision history</span>
            </h4>
            <button onClick={() => setShowRevisionPanel(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          {revisions.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono py-4">No rollback recovery points currently captured.</p>
          ) : (
            <div className="space-y-2 font-mono text-[10px]">
              {revisions.map((rev) => (
                <div key={rev.id} className="bg-slate-950 p-2.5 rounded border border-slate-800/60 leading-relaxed flex items-center justify-between gap-4">
                  <div>
                    <div className="text-slate-100 font-bold">Snapshot {rev.id}</div>
                    <div className="text-slate-400 text-[9px] mt-0.5">Captured during {rev.action} by {rev.user} on {rev.timestamp}</div>
                    <div className="mt-1 text-slate-300">Identity: <strong className="text-white">{rev.snapshot.name || rev.snapshot.projectName || rev.snapshot.ticketNo || rev.recordId}</strong></div>
                  </div>
                  <button
                    onClick={() => handleRollbackRevision(rev)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2 py-1 rounded text-[9px] cursor-pointer shrink-0"
                  >
                    Instantly Rollback
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. DYNAMIC DATA GRID BAR (SEARCH, EXPORT, COLUMNS, ADVANCED FILTERS) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          
          {/* Main search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Fuzzy search records on ${moduleName.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-800 pl-8 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Quick Filter tabs, column visibility dropdown, exports */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            
            {/* Status Quick Select */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 font-bold">
              <span className="text-[10px] text-slate-400">Workflow:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-700 font-bold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {workflowStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Archive Toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                showArchived
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Archive className="h-3 w-3" />
              <span>{showArchived ? 'View Active' : 'View Archived'}</span>
            </button>

            {/* Column Visibility Selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                <Grid className="h-3 w-3 text-slate-400" />
                <span>Columns</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showColumnDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show/Hide Columns</div>
                  <div className="max-h-48 overflow-y-auto px-1 py-1">
                    {fields.map((field) => (
                      <label key={field.key} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded text-xs text-slate-600 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={!!visibleColumns[field.key]}
                          onChange={() => setVisibleColumns({ ...visibleColumns, [field.key]: !visibleColumns[field.key] })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Trigger */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                showAdvancedFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Advanced Query</span>
            </button>

            {/* Download/Export Suite */}
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              title="Download RFC CSV document"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              title="Download Microsoft Excel stylesheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </button>
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              title="Audit Print Record Matrix"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 4. ADVANCED FILTER BUILDER CONTROL AREA */}
        {showAdvancedFilters && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-indigo-500" />
                <span>Dynamic Query Builder Block (Multi-Column)</span>
              </span>
              {advancedFilters.length > 0 && (
                <button
                  onClick={() => setAdvancedFilters([])}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  Clear All Conditions
                </button>
              )}
            </div>

            <div className="space-y-2">
              {advancedFilters.map((f, index) => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <select
                    value={f.field}
                    onChange={(e) => {
                      const updated = [...advancedFilters];
                      updated[index].field = e.target.value;
                      setAdvancedFilters(updated);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                  >
                    <option value="">-- Choose Field --</option>
                    {fields.filter(f => f.filterable !== false).map(fd => (
                      <option key={fd.key} value={fd.key}>{fd.label}</option>
                    ))}
                  </select>

                  <select
                    value={f.operator}
                    onChange={(e) => {
                      const updated = [...advancedFilters];
                      updated[index].operator = e.target.value;
                      setAdvancedFilters(updated);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="startsWith">Starts With</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="lessThan">Less Than</option>
                    <option value="empty">Is Empty</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Compare Value..."
                    value={f.value}
                    disabled={f.operator === 'empty'}
                    onChange={(e) => {
                      const updated = [...advancedFilters];
                      updated[index].value = e.target.value;
                      setAdvancedFilters(updated);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white focus:outline-none flex-1 max-w-[200px]"
                  />

                  <button
                    onClick={() => setAdvancedFilters(advancedFilters.filter((item) => item.id !== f.id))}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAdvancedFilters([...advancedFilters, { id: Math.random().toString(), field: fields[0]?.key || '', operator: 'contains', value: '' }])}
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-[10px] font-bold"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Query Condition</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. MULTI-ROW BATCH ACTIONS OPERATOR PANEL */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 animate-in zoom-in-95 duration-100 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{selectedIds.length} Selected</div>
            <div>
              <div className="text-xs font-bold text-slate-100">Batch Processing Console</div>
              <div className="text-[9px] text-slate-400">Perform changes on selected dataset references simultaneously</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Update Field Trigger */}
            <button
              onClick={() => {
                setBulkFieldToUpdate(fields[0]?.key || '');
                setBulkValueToUpdate('');
                setShowBulkModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="h-3 w-3 text-slate-400" />
              <span>Bulk Update</span>
            </button>

            {/* Bulk Approval Trigger */}
            <button
              onClick={handleBulkApprovalSubmit}
              className="bg-emerald-700 hover:bg-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-700/10"
            >
              <CheckCircle className="h-3 w-3" />
              <span>Bulk Approve</span>
            </button>

            {/* Bulk Delete Trigger */}
            {canPerform('delete') && (
              <button
                onClick={handleBulkDeleteSubmit}
                className="bg-rose-600 hover:bg-rose-500 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm shadow-rose-600/10"
              >
                <Trash2 className="h-3 w-3" />
                <span>Bulk Delete</span>
              </button>
            )}

            <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white text-[10px] font-bold px-2 py-1">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 6. PRIMARY DATA GRID TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Header Titles Row */}
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center select-none">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                {fields.map((field) => {
                  if (!visibleColumns[field.key]) return null;
                  const isSorted = sortField === field.key;
                  return (
                    <th
                      key={field.key}
                      onClick={() => handleSort(field.key)}
                      className={`py-3 px-4 select-none ${field.sortable !== false ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-700' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{field.label}</span>
                        {field.sortable !== false && (
                          <ArrowUpDown className={`h-3 w-3 ${isSorted ? 'text-indigo-600' : 'text-slate-300'}`} />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-4 w-28 text-right">Operations</th>
              </tr>

              {/* Sticky Column Filter Header Inputs Row */}
              <tr className="bg-slate-50 border-b border-slate-200/60">
                <td className="bg-slate-100/30"></td>
                {fields.map((field) => {
                  if (!visibleColumns[field.key]) return null;
                  if (field.filterable === false) {
                    return <td key={field.key} className="p-1.5 bg-slate-100/10"></td>;
                  }
                  return (
                    <td key={field.key} className="p-1.5 bg-slate-100/10">
                      {field.options ? (
                        <select
                          value={columnFilters[field.key] || ''}
                          onChange={(e) => setColumnFilters({ ...columnFilters, [field.key]: e.target.value })}
                          className="w-full bg-white text-[10px] text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="">Filter...</option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={`Filter ${field.label.toLowerCase()}...`}
                          value={columnFilters[field.key] || ''}
                          onChange={(e) => setColumnFilters({ ...columnFilters, [field.key]: e.target.value })}
                          className="w-full bg-white text-[10px] text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 placeholder-slate-300 font-medium"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="bg-slate-100/30 text-right py-1 px-4">
                  {Object.keys(columnFilters).length > 0 && (
                    <button
                      onClick={() => setColumnFilters({})}
                      className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                      title="Clear col filters"
                    >
                      Clear
                    </button>
                  )}
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 2} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-xl">📭</span>
                      <p className="text-xs font-bold text-slate-500">No database table entries match your filters.</p>
                      <p className="text-[10px] text-slate-400">Try loosening your search terms or clearing column filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isChecked = selectedIds.includes(row[primaryKey]);
                  return (
                    <tr
                      key={row[primaryKey]}
                      className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-indigo-50/20' : ''}`}
                    >
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(row[primaryKey])}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Display dynamically mapped fields */}
                      {fields.map((field) => {
                        if (!visibleColumns[field.key]) return null;
                        const val = row[field.key];

                        if (field.type === 'currency') {
                          return (
                            <td key={field.key} className="py-2.5 px-4 font-mono font-bold text-slate-800">
                              ৳{Number(val || 0).toLocaleString()}
                            </td>
                          );
                        }

                        if (field.type === 'boolean') {
                          return (
                            <td key={field.key} className="py-2.5 px-4">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {val ? 'Yes' : 'No'}
                              </span>
                            </td>
                          );
                        }

                        if (field.key === 'status') {
                          return (
                            <td key={field.key} className="py-2.5 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                String(val).toLowerCase() === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : String(val).toLowerCase().includes('pending')
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {val}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={field.key} className="py-2.5 px-4 truncate max-w-[200px] font-medium text-slate-700">
                            {val !== undefined && val !== null ? String(val) : '—'}
                          </td>
                        );
                      })}

                      {/* Dynamic operations panel */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(row, true)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Detailed view"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(row, false)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit row"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateRecord(row)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Duplicate record template"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(row)}
                            className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                            title={row.isArchived ? 'Restore record to active' : 'Archive record'}
                          >
                            {row.isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          </button>
                          {canPerform('delete') && (
                            <button
                              onClick={() => handleDeleteRecord(row[primaryKey], row.name || row.projectName || row.ticketNo || row[primaryKey])}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 7. PAGINATION FOOTER CONTROL TRACK */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
            <span className="text-slate-300">|</span>
            <span>Showing {sortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer transition-colors"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white cursor-pointer transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          8. MODAL 1: ADD / EDIT / DETAILED VIEW FORM
         ========================================== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wide">
                  {viewOnly ? 'Detailed Record Audit View' : currentRecord ? 'Modify Existing Entry' : 'Create New Record Entry'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Auto-validators running on save • ID auto-generated</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              <MetadataFormEngine
                fields={fields as any}
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                viewOnly={viewOnly}
                workflowStatuses={workflowStatuses}
                moduleKey={moduleKey}
              />

              {/* Revision snapshot history list inside the record modal */}
              {currentRecord && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <History className="h-3.5 w-3.5 text-amber-500" />
                    <span>Revision History for this Record</span>
                  </h5>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[10px] font-mono space-y-1.5 max-h-32 overflow-y-auto">
                    {revisions.filter((r) => r.recordId === currentRecord[primaryKey]).length === 0 ? (
                      <p className="text-slate-400 italic">No previous revision states captured for this record.</p>
                    ) : (
                      revisions
                        .filter((r) => r.recordId === currentRecord[primaryKey])
                        .map((rev) => (
                          <div key={rev.id} className="flex justify-between items-center border-b border-slate-100 pb-1 last:border-none">
                            <span className="text-slate-600">{rev.timestamp} — {rev.action} ({rev.user})</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...rev.snapshot });
                                setFormErrors({});
                                alert('Restored local form fields to captured snapshot state. Click Save to publish.');
                              }}
                              className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                            >
                              Load Snapshot
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                {viewOnly ? 'Close' : 'Cancel'}
              </button>
              {!viewOnly && (
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  Save Record State
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          9. MODAL 2: BULK FIELD UPDATE CONSOLE
         ========================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-xs font-display uppercase tracking-wide">Bulk Alter Fields</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Field</label>
                <select
                  value={bulkFieldToUpdate}
                  onChange={(e) => {
                    setBulkFieldToUpdate(e.target.value);
                    setBulkValueToUpdate('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none"
                >
                  {fields.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Specify Value</label>
                {fields.find(f => f.key === bulkFieldToUpdate)?.options ? (
                  <select
                    value={bulkValueToUpdate}
                    onChange={(e) => setBulkValueToUpdate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose --</option>
                    {fields.find(f => f.key === bulkFieldToUpdate)?.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : fields.find(f => f.key === bulkFieldToUpdate)?.type === 'boolean' ? (
                  <select
                    value={bulkValueToUpdate}
                    onChange={(e) => setBulkValueToUpdate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="true">True (Yes)</option>
                    <option value="false">False (No)</option>
                  </select>
                ) : (
                  <input
                    type={fields.find(f => f.key === bulkFieldToUpdate)?.type === 'number' || fields.find(f => f.key === bulkFieldToUpdate)?.type === 'currency' ? 'number' : 'text'}
                    placeholder="Enter value to broadcast..."
                    value={bulkValueToUpdate}
                    onChange={(e) => setBulkValueToUpdate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="bg-white border border-slate-200 text-slate-700 font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpdateSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Broadcast Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
