import React, { useState, useEffect } from 'react';
import { DEMO_SEED_ENABLED } from '../lib/dataClient';
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
  Move,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Undo2,
  Redo2,
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
  Cpu,
  Globe,
  Mail,
  Phone,
  Barcode,
  QrCode,
  Image as ImageIcon,
  File as FileIcon,
  Check,
  Search,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';

// ==========================================
// ENTERPRISE TYPES & INTERFACES
// ==========================================

export interface CustomField {
  id: string;
  internalName: string;
  displayName: string;
  type: string; // 'Text' | 'Textarea' | 'Rich Text' | 'Number' | 'Decimal' | 'Currency' | 'Percentage' | 'Date' | 'Time' | 'DateTime' | 'Dropdown' | 'Multi Select' | 'Checkbox' | 'Radio' | 'Toggle' | 'Color Picker' | 'Email' | 'Phone' | 'URL' | 'Barcode' | 'QR Code' | 'Image' | 'Multiple Images' | 'File' | 'PDF' | 'Video' | 'Lookup' | 'Formula' | 'JSON' | 'User' | 'Employee' | 'Warehouse' | 'Supplier' | 'Customer' | 'Product Relation';
  placeholder?: string;
  helpText?: string;
  tooltip?: string;
  required?: boolean;
  unique?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  exportable?: boolean;
  importable?: boolean;
  printable?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  regexValidation?: string;
  conditionalVisibleField?: string;
  conditionalVisibleValue?: string;
  conditionalRequiredField?: string;
  conditionalRequiredValue?: string;
  conditionalReadOnlyField?: string;
  conditionalReadOnlyValue?: string;
  formulaExpression?: string;
  displayOrder: number;
  columnWidth: 'Full' | 'Half' | 'Third' | 'Quarter';
  tabAssignment: string;
  sectionAssignment: string;
  icon?: string;
  color?: string;
  auditEnabled?: boolean;
  historyEnabled?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  options?: string[]; // For dropdown, radio, multi-select, etc.
}

export interface FormSection {
  id: string;
  title: string;
  tabId: string;
  displayOrder: number;
  isCollapsed?: boolean;
}

export interface FormTab {
  id: string;
  title: string;
  displayOrder: number;
  icon?: string;
}

export interface AuditLogEntry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  fieldChanged: string;
  displayName: string;
  oldValue: string;
  newValue: string;
  user: string;
  role: string;
  date: string;
  time: string;
  ip: string;
  browser: string;
  reason: string;
  approvalStatus: 'Approved' | 'Pending' | 'Auto-Approved';
}

export interface RolePermission {
  role: string; // 'Administrator' | 'Manager' | 'Cashier' | 'Sales Agent' | 'Warehouse Staff'
  fieldPermissions: Record<string, 'None' | 'View' | 'Edit'>;
}

// ==========================================
// SEED DATA FOR ENTERPRISE INTEGRATION
// ==========================================

export const DEFAULT_TABS: FormTab[] = [
  { id: 'general', title: 'General Info', displayOrder: 1 },
  { id: 'classification', title: 'Classification', displayOrder: 2 },
  { id: 'units', title: 'Units & Pack', displayOrder: 3 },
  { id: 'inventory', title: 'Inventory Levels', displayOrder: 4 },
  { id: 'purchase', title: 'Procurement', displayOrder: 5 },
  { id: 'sales', title: 'Sales Pricing', displayOrder: 6 },
  { id: 'accounting', title: 'Financials', displayOrder: 7 },
  { id: 'manufacturing', title: 'BOM / Production', displayOrder: 8 },
  { id: 'quality', title: 'Quality Assurance', displayOrder: 9 },
  { id: 'logistics', title: 'Shipping & Logistics', displayOrder: 10 },
  { id: 'ecommerce', title: 'Ecommerce SEO', displayOrder: 11 },
  { id: 'custom', title: 'Dynamic Custom Fields', displayOrder: 12 },
];

export const DEFAULT_SECTIONS: FormSection[] = [
  { id: 'sec_gen_basic', title: 'Core Definitions', tabId: 'general', displayOrder: 1 },
  { id: 'sec_gen_media', title: 'Media & Attachments', tabId: 'general', displayOrder: 2 },
  { id: 'sec_class_cat', title: 'Category Classification', tabId: 'classification', displayOrder: 1 },
  { id: 'sec_units_pack', title: 'Packaging Configuration', tabId: 'units', displayOrder: 1 },
  { id: 'sec_inv_limits', title: 'Safety Levels & Bins', tabId: 'inventory', displayOrder: 1 },
  { id: 'sec_pur_supplier', title: 'Preferred Vendor Config', tabId: 'purchase', displayOrder: 1 },
  { id: 'sec_sal_tiers', title: 'Pricing & Discount Matrices', tabId: 'sales', displayOrder: 1 },
  { id: 'sec_acc_ledger', title: 'Ledger Mapping & Standard Costing', tabId: 'accounting', displayOrder: 1 },
  { id: 'sec_mfg_bom', title: 'Bill of Materials & Workstations', tabId: 'manufacturing', displayOrder: 1 },
  { id: 'sec_qa_cert', title: 'QA Grades & Auditing', tabId: 'quality', displayOrder: 1 },
  { id: 'sec_log_pack', title: 'Dimension & Freight Estimates', tabId: 'logistics', displayOrder: 1 },
  { id: 'sec_ecom_seo', title: 'SEO Rankings & Metas', tabId: 'ecommerce', displayOrder: 1 },
  { id: 'sec_custom_dyn', title: 'Custom Runtime Fields', tabId: 'custom', displayOrder: 1 },
];

export const DEFAULT_FIELDS: CustomField[] = [
  // General Tab Fields
  { id: 'f_productCode', internalName: 'productCode', displayName: 'Product Code (SAP/D365)', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. SAP-PRD-1025', helpText: 'Primary identifier in ERP backbones' },
  { id: 'f_barcode', internalName: 'barcode', displayName: 'Barcode (EAN-13)', type: 'Barcode', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. 8901234567890', helpText: 'Scan code' },
  { id: 'f_qrCode', internalName: 'qrCode', displayName: 'QR Code', type: 'QR Code', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. https://nexova.erp/prd-1025' },
  { id: 'f_shortName', internalName: 'shortName', displayName: 'Short Print Name', type: 'Text', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'Short label for thermal POS slips' },
  { id: 'f_alternativeName', internalName: 'alternativeName', displayName: 'Alternative Name (Local / L10n)', type: 'Text', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. প্রিমিয়াম সিমেন্ট' },
  { id: 'f_brand', internalName: 'brand', displayName: 'Brand Name', type: 'Text', displayOrder: 6, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. Holcim / Lafarge' },
  { id: 'f_model', internalName: 'model', displayName: 'Model / Specification', type: 'Text', displayOrder: 7, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', placeholder: 'e.g. Type-II High Early Strength' },
  { id: 'f_productStatus', internalName: 'productStatus', displayName: 'Product Lifecycle Status', type: 'Dropdown', displayOrder: 8, columnWidth: 'Half', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic', options: ['Active', 'Draft', 'Obsolete', 'Archived'], defaultValue: 'Active' },
  { id: 'f_shortDescription', internalName: 'shortDescription', displayName: 'Short Description', type: 'Textarea', displayOrder: 9, columnWidth: 'Full', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic' },
  { id: 'f_internalNotes', internalName: 'internalNotes', displayName: 'Internal Operational Notes', type: 'Textarea', displayOrder: 10, columnWidth: 'Full', tabAssignment: 'general', sectionAssignment: 'sec_gen_basic' },

  // Classification Tab Fields
  { id: 'f_productGroup', internalName: 'productGroup', displayName: 'Product Group', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat', placeholder: 'e.g. Heavy Building Material' },
  { id: 'f_subGroup', internalName: 'subGroup', displayName: 'Sub Group', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat' },
  { id: 'f_department', internalName: 'department', displayName: 'Inventory Department', type: 'Text', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat' },
  { id: 'f_division', internalName: 'division', displayName: 'Business Division', type: 'Text', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat' },
  { id: 'f_businessUnit', internalName: 'businessUnit', displayName: 'Business Unit', type: 'Text', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat' },
  { id: 'f_productFamily', internalName: 'productFamily', displayName: 'Product Family Grouping', type: 'Text', displayOrder: 6, columnWidth: 'Half', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat' },
  { id: 'f_tags', internalName: 'tags', displayName: 'Semantic Tags', type: 'Text', displayOrder: 7, columnWidth: 'Full', tabAssignment: 'classification', sectionAssignment: 'sec_class_cat', placeholder: 'Comma-separated values: e.g. cement, raw, building, high-strength' },

  // Units Tab Fields
  { id: 'f_purchaseUnit', internalName: 'purchaseUnit', displayName: 'Procurement Unit', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack', placeholder: 'e.g. Metric Tons' },
  { id: 'f_salesUnit', internalName: 'salesUnit', displayName: 'Sales Delivery Unit', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack', placeholder: 'e.g. Bags' },
  { id: 'f_inventoryUnit', internalName: 'inventoryUnit', displayName: 'Stock Storage Unit', type: 'Text', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack', placeholder: 'e.g. Bags' },
  { id: 'f_unitConversion', internalName: 'unitConversion', displayName: 'Unit Conversion Factor', type: 'Decimal', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack', placeholder: 'e.g. 20 (20 Bags = 1 Metric Ton)' },
  { id: 'f_boxesPerPallet', internalName: 'boxesPerPallet', displayName: 'Boxes Per Storage Pallet', type: 'Number', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack' },
  { id: 'f_weight', internalName: 'weight', displayName: 'Unit Weight (kg)', type: 'Decimal', displayOrder: 6, columnWidth: 'Half', tabAssignment: 'units', sectionAssignment: 'sec_units_pack', placeholder: '50.00' },

  // Inventory Tab Fields
  { id: 'f_minimumStock', internalName: 'minimumStock', displayName: 'Minimum Stock Level', type: 'Number', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: '50' },
  { id: 'f_maximumStock', internalName: 'maximumStock', displayName: 'Maximum Cap Stock', type: 'Number', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: '1000' },
  { id: 'f_safetyStock', internalName: 'safetyStock', displayName: 'Safety Buffers', type: 'Number', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: '20' },
  { id: 'f_reorderLevel', internalName: 'reorderLevel', displayName: 'Reorder Level Threshold', type: 'Number', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: '100' },
  { id: 'f_reorderQuantity', internalName: 'reorderQuantity', displayName: 'Standard Reorder Purchase Qty', type: 'Number', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: '500' },
  { id: 'f_warehouseBin', internalName: 'warehouseBin', displayName: 'Warehouse Bin Code', type: 'Text', displayOrder: 6, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: 'BIN-C25' },
  { id: 'f_rack', internalName: 'rack', displayName: 'Storage Rack Number', type: 'Text', displayOrder: 7, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: 'RACK-04' },
  { id: 'f_shelf', internalName: 'shelf', displayName: 'Storage Shelf Code', type: 'Text', displayOrder: 8, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', placeholder: 'SHELF-A' },
  { id: 'f_serialNumber', internalName: 'serialNumber', displayName: 'Unique Batch Serial', type: 'Text', displayOrder: 9, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits' },
  { id: 'f_manufacturingDate', internalName: 'manufacturingDate', displayName: 'Manufacturing Date', type: 'Date', displayOrder: 10, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits' },
  { id: 'f_expiryDate', internalName: 'expiryDate', displayName: 'Expiry Date', type: 'Date', displayOrder: 11, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits' },
  { id: 'f_abcClassification', internalName: 'abcClassification', displayName: 'ABC Rank (Value Class)', type: 'Dropdown', displayOrder: 12, columnWidth: 'Half', tabAssignment: 'inventory', sectionAssignment: 'sec_inv_limits', options: ['A', 'B', 'C'], defaultValue: 'B' },

  // Purchase Tab Fields
  { id: 'f_preferredSupplier', internalName: 'preferredSupplier', displayName: 'Primary Lead Supplier', type: 'Supplier', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'purchase', sectionAssignment: 'sec_pur_supplier' },
  { id: 'f_purchaseDiscount', internalName: 'purchaseDiscount', displayName: 'Standard Procurement Discount (%)', type: 'Percentage', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'purchase', sectionAssignment: 'sec_pur_supplier' },
  { id: 'f_purchaseTax', internalName: 'purchaseTax', displayName: 'Default Purchase Tax / VAT (%)', type: 'Percentage', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'purchase', sectionAssignment: 'sec_pur_supplier' },
  { id: 'f_leadTime', internalName: 'leadTime', displayName: 'Supplier Fulfilment Lead Time', type: 'Text', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'purchase', sectionAssignment: 'sec_pur_supplier', placeholder: 'e.g. 5 Days' },
  { id: 'f_minimumOrderQuantity', internalName: 'minimumOrderQuantity', displayName: 'Minimum Purchase Order Qty', type: 'Number', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'purchase', sectionAssignment: 'sec_pur_supplier' },

  // Sales Tab Fields
  { id: 'f_retailPrice', internalName: 'retailPrice', displayName: 'Retail Customer Price', type: 'Currency', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers' },
  { id: 'f_wholesalePrice', internalName: 'wholesalePrice', displayName: 'Wholesale Deal Price', type: 'Currency', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers' },
  { id: 'f_dealerPrice', internalName: 'dealerPrice', displayName: 'Registered Dealer Price', type: 'Currency', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers' },
  { id: 'f_posPrice', internalName: 'posPrice', displayName: 'POS Counter Default Price', type: 'Currency', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers' },
  { id: 'f_minimumSellingPrice', internalName: 'minimumSellingPrice', displayName: 'Hard Stop Minimum Selling Price', type: 'Currency', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers', helpText: 'Sales representatives cannot discount below this' },
  { id: 'f_warranty', internalName: 'warranty', displayName: 'Product Warranty Policy', type: 'Text', displayOrder: 6, columnWidth: 'Half', tabAssignment: 'sales', sectionAssignment: 'sec_sal_tiers', placeholder: 'e.g. 1 Year Manufacturers Limited Warranty' },

  // Accounting Tab Fields
  { id: 'f_inventoryAccount', internalName: 'inventoryAccount', displayName: 'Inventory Asset Ledger Account', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'accounting', sectionAssignment: 'sec_acc_ledger', defaultValue: '120100 - Raw Materials stock' },
  { id: 'f_cogsAccount', internalName: 'cogsAccount', displayName: 'COGS Ledger Account', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'accounting', sectionAssignment: 'sec_acc_ledger', defaultValue: '500100 - Cost of Goods Sold' },
  { id: 'f_salesAccount', internalName: 'salesAccount', displayName: 'Operating Sales Revenue Account', type: 'Text', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'accounting', sectionAssignment: 'sec_acc_ledger', defaultValue: '400100 - Standard Product Revenue' },
  { id: 'f_costCenter', internalName: 'costCenter', displayName: 'Financial Cost Center', type: 'Text', displayOrder: 4, columnWidth: 'Half', tabAssignment: 'accounting', sectionAssignment: 'sec_acc_ledger', placeholder: 'e.g. CC-PRODUCTION-01' },
  { id: 'f_standardCost', internalName: 'standardCost', displayName: 'Standard Evaluated Cost', type: 'Currency', displayOrder: 5, columnWidth: 'Half', tabAssignment: 'accounting', sectionAssignment: 'sec_acc_ledger' },

  // Manufacturing Tab Fields
  { id: 'f_bom', internalName: 'bom', displayName: 'Primary BOM Reference', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'manufacturing', sectionAssignment: 'sec_mfg_bom', placeholder: 'e.g. BOM-CEM-STD-V1' },
  { id: 'f_productionTime', internalName: 'productionTime', displayName: 'Manufacturing Lead Time', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'manufacturing', sectionAssignment: 'sec_mfg_bom' },
  { id: 'f_productionCost', internalName: 'productionCost', displayName: 'Unit Machine Processing Cost', type: 'Currency', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'manufacturing', sectionAssignment: 'sec_mfg_bom' },

  // Quality Tab Fields
  { id: 'f_inspectionRequired', internalName: 'inspectionRequired', displayName: 'Mandatory QC Inspection Required', type: 'Toggle', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'quality', sectionAssignment: 'sec_qa_cert', defaultValue: 'false' },
  { id: 'f_qualityGrade', internalName: 'qualityGrade', displayName: 'Quality Rating Grade', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'quality', sectionAssignment: 'sec_qa_cert', placeholder: 'e.g. Grade-A Extra Fine' },

  // Logistics Tab Fields
  { id: 'f_shippingWeight', internalName: 'shippingWeight', displayName: 'Package Shipping Weight (kg)', type: 'Decimal', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'logistics', sectionAssignment: 'sec_log_pack' },
  { id: 'f_packagingType', internalName: 'packagingType', displayName: 'Freight Packaging Type', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'logistics', sectionAssignment: 'sec_log_pack', placeholder: 'e.g. Wooden Crate / Double Layer Bag' },

  // Ecommerce Tab Fields
  { id: 'f_seoTitle', internalName: 'seoTitle', displayName: 'Optimized Meta SEO Title', type: 'Text', displayOrder: 1, columnWidth: 'Half', tabAssignment: 'ecommerce', sectionAssignment: 'sec_ecom_seo' },
  { id: 'f_slug', internalName: 'slug', displayName: 'Web URL slug path', type: 'Text', displayOrder: 2, columnWidth: 'Half', tabAssignment: 'ecommerce', sectionAssignment: 'sec_ecom_seo', placeholder: 'standard-premium-cement' },
  { id: 'f_featuredProduct', internalName: 'featuredProduct', displayName: 'Feature on Web Homepage', type: 'Toggle', displayOrder: 3, columnWidth: 'Half', tabAssignment: 'ecommerce', sectionAssignment: 'sec_ecom_seo', defaultValue: 'false' },
];

export const INITIAL_PERMISSIONS: RolePermission[] = [
  {
    role: 'Administrator',
    fieldPermissions: {
      'cost': 'Edit',
      'price': 'Edit',
      'stock': 'Edit',
      'f_standardCost': 'Edit',
      'f_purchasePrice': 'Edit',
      'f_wholesalePrice': 'Edit',
      'f_retailPrice': 'Edit',
      '*': 'Edit'
    }
  },
  {
    role: 'Manager',
    fieldPermissions: {
      'cost': 'Edit',
      'price': 'Edit',
      'stock': 'Edit',
      'f_standardCost': 'Edit',
      'f_wholesalePrice': 'Edit',
      'f_retailPrice': 'Edit',
      '*': 'Edit'
    }
  },
  {
    role: 'Cashier',
    fieldPermissions: {
      'cost': 'None',
      'price': 'View',
      'stock': 'View',
      'f_standardCost': 'None',
      'f_purchasePrice': 'None',
      'f_wholesalePrice': 'View',
      'f_retailPrice': 'View',
      '*': 'View'
    }
  },
  {
    role: 'Sales Agent',
    fieldPermissions: {
      'cost': 'None',
      'price': 'Edit', // Sales can edit Selling Price only!
      'stock': 'View',
      'f_standardCost': 'None',
      'f_purchasePrice': 'None',
      'f_wholesalePrice': 'View',
      'f_retailPrice': 'Edit',
      '*': 'View'
    }
  },
  {
    role: 'Warehouse Staff',
    fieldPermissions: {
      'cost': 'None',
      'price': 'None',
      'stock': 'Edit', // Warehouse can edit Stock only!
      'f_standardCost': 'None',
      'f_purchasePrice': 'None',
      'f_wholesalePrice': 'None',
      'f_retailPrice': 'None',
      '*': 'View'
    }
  }
];

// ==========================================
// COMPONENT 1: MANAGE CUSTOM FIELDS MODAL / NO-CODE CUSTOM FIELD BUILDER
// ==========================================

interface ManageCustomFieldsModalProps {
  onClose: () => void;
  customFields: CustomField[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
}

interface SchemaVersion {
  version: number;
  timestamp: string;
  description: string;
  fields: CustomField[];
}

export function ManageCustomFieldsModal({ onClose, customFields, setCustomFields }: ManageCustomFieldsModalProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'preview' | 'permissions' | 'audit' | 'versions'>('fields');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Field edit/create states
  const [displayName, setDisplayName] = useState('');
  const [internalName, setInternalName] = useState('');
  const [type, setType] = useState('Text');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [tooltip, setTooltip] = useState('');
  const [required, setRequired] = useState(false);
  const [unique, setUnique] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [filterable, setFilterable] = useState(true);
  const [sortable, setSortable] = useState(true);
  const [exportable, setExportable] = useState(true);
  const [importable, setImportable] = useState(true);
  const [defaultValue, setDefaultValue] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [tabAssignment, setTabAssignment] = useState('custom');
  const [sectionAssignment, setSectionAssignment] = useState('sec_custom_fields');
  const [columnWidth, setColumnWidth] = useState<'Full' | 'Half' | 'Third' | 'Quarter'>('Half');
  
  // Advanced validations & dependencies
  const [regexValidation, setRegexValidation] = useState('');
  const [minLength, setMinLength] = useState<number | ''>('');
  const [maxLength, setMaxLength] = useState<number | ''>('');
  const [minValue, setMinValue] = useState<number | ''>('');
  const [maxValue, setMaxValue] = useState<number | ''>('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [conditionalVisibleField, setConditionalVisibleField] = useState('');
  const [conditionalVisibleValue, setConditionalVisibleValue] = useState('');

  // Search in Fields list
  const [fieldSearch, setFieldSearch] = useState('');

  // Schema drafts state (Unpublished draft)
  const [draftFields, setDraftFields] = useState<CustomField[]>(() => [...customFields]);

  // Version History state
  const [schemaVersions, setSchemaVersions] = useState<SchemaVersion[]>(() => {
    const saved = localStorage.getItem('nexova_custom_fields_versions');
    if (saved) return JSON.parse(saved);
    const initialVersions: SchemaVersion[] = [
      {
        version: 1,
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        description: 'Initial SAP Standard ERP Core Field Configuration',
        fields: [...customFields]
      }
    ];
    localStorage.setItem('nexova_custom_fields_versions', JSON.stringify(initialVersions));
    return initialVersions;
  });

  const [currentVersionNum, setCurrentVersionNum] = useState<number>(() => {
    const saved = localStorage.getItem('nexova_custom_fields_version_num');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Undo/Redo tracking
  const [history, setHistory] = useState<CustomField[][]>([[...customFields]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load permissions matrix
  const [permissions, setPermissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('nexova_field_permissions');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
  });

  // Load audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('nexova_product_audit_logs');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    const mockLogs: AuditLogEntry[] = [
      {
        id: `audit_init_1`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        user: 'M. Rahman',
        role: 'Administrator',
        productId: 'ALL',
        productName: 'ERP Master Schema',
        productSku: 'SYSTEM',
        fieldChanged: 'SCHEMA_PUBLISH',
        displayName: 'SCHEMA_PUBLISH',
        oldValue: 'None',
        newValue: 'v1.0.0 Active',
        reason: 'Bootstrap initial enterprise metadata engine',
        ip: '127.0.0.1',
        browser: 'System WebKit',
        approvalStatus: 'Auto-Approved'
      }
    ];
    localStorage.setItem('nexova_product_audit_logs', JSON.stringify(mockLogs));
    return mockLogs;
  });

  // Sandbox simulation values
  const [sandboxData, setSandboxData] = useState<Record<string, any>>({
    price: 1500,
    cost: 1100,
  });
  const [sandboxErrors, setSandboxErrors] = useState<Record<string, string>>({});

  const hasUnpublishedChanges = JSON.stringify(draftFields) !== JSON.stringify(customFields);

  const savePermissions = (newPerms: RolePermission[]) => {
    setPermissions(newPerms);
    localStorage.setItem('nexova_field_permissions', JSON.stringify(newPerms));
  };

  const pushHistory = (newFields: CustomField[]) => {
    const nextHist = history.slice(0, historyIndex + 1);
    setHistory([...nextHist, newFields]);
    setHistoryIndex(nextHist.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDraftFields(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDraftFields(history[historyIndex + 1]);
    }
  };

  // Drag and Drop State & Handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;

    const updated = [...draftFields];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(idx, 0, draggedItem);

    const reordered = updated.map((f, i) => ({ ...f, displayOrder: i + 1 }));
    setDraftFields(reordered);
    pushHistory(reordered);
    setDraggedIndex(null);
  };

  // Create or update dynamic field
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !internalName) return;

    const formattedInternal = internalName.trim().replace(/\s+/g, '_').toLowerCase();
    const finalKey = formattedInternal.startsWith('cust_') ? formattedInternal : `cust_${formattedInternal}`;
    const options = optionsStr ? optionsStr.split(',').map(o => o.trim()) : undefined;

    let updated: CustomField[];

    const fieldPayload: Omit<CustomField, 'id' | 'displayOrder'> = {
      displayName: displayName.trim(),
      internalName: finalKey,
      type,
      placeholder: placeholder.trim() || undefined,
      helpText: helpText.trim() || undefined,
      tooltip: tooltip.trim() || undefined,
      required,
      unique,
      readOnly,
      hidden,
      searchable,
      filterable,
      sortable,
      exportable,
      importable,
      defaultValue: defaultValue.trim() || undefined,
      options,
      tabAssignment,
      sectionAssignment,
      columnWidth,
      regexValidation: regexValidation.trim() || undefined,
      minLength: minLength !== '' ? minLength : undefined,
      maxLength: maxLength !== '' ? maxLength : undefined,
      minValue: minValue !== '' ? minValue : undefined,
      maxValue: maxValue !== '' ? maxValue : undefined,
      formulaExpression: formulaExpression.trim() || undefined,
      conditionalVisibleField: conditionalVisibleField || undefined,
      conditionalVisibleValue: conditionalVisibleValue.trim() || undefined,
      isActive: true,
      isArchived: false,
    };

    if (editingFieldId) {
      updated = draftFields.map((f) =>
        f.id === editingFieldId
          ? { ...f, ...fieldPayload, internalName: f.internalName } // slug immutable during edit
          : f
      );
    } else {
      const newField: CustomField = {
        id: `f_cust_${Date.now()}`,
        ...fieldPayload,
        displayOrder: draftFields.length + 1,
      };
      updated = [...draftFields, newField];
    }

    setDraftFields(updated);
    pushHistory(updated);
    resetForm();
  };

  const resetForm = () => {
    setEditingFieldId(null);
    setDisplayName('');
    setInternalName('');
    setType('Text');
    setPlaceholder('');
    setHelpText('');
    setTooltip('');
    setRequired(false);
    setUnique(false);
    setReadOnly(false);
    setHidden(false);
    setSearchable(true);
    setFilterable(true);
    setSortable(true);
    setExportable(true);
    setImportable(true);
    setDefaultValue('');
    setOptionsStr('');
    setTabAssignment('custom');
    setSectionAssignment('sec_custom_fields');
    setColumnWidth('Half');
    setRegexValidation('');
    setMinLength('');
    setMaxLength('');
    setMinValue('');
    setMaxValue('');
    setFormulaExpression('');
    setConditionalVisibleField('');
    setConditionalVisibleValue('');
  };

  const handleEditField = (f: CustomField) => {
    setEditingFieldId(f.id);
    setDisplayName(f.displayName);
    setInternalName(f.internalName.replace(/^cust_/, ''));
    setType(f.type);
    setPlaceholder(f.placeholder || '');
    setHelpText(f.helpText || '');
    setTooltip(f.tooltip || '');
    setRequired(!!f.required);
    setUnique(!!f.unique);
    setReadOnly(!!f.readOnly);
    setHidden(!!f.hidden);
    setSearchable(f.searchable !== false);
    setFilterable(f.filterable !== false);
    setSortable(f.sortable !== false);
    setExportable(f.exportable !== false);
    setImportable(f.importable !== false);
    setDefaultValue(f.defaultValue || '');
    setOptionsStr(f.options ? f.options.join(', ') : '');
    setTabAssignment(f.tabAssignment);
    setSectionAssignment(f.sectionAssignment);
    setColumnWidth(f.columnWidth);
    setRegexValidation(f.regexValidation || '');
    setMinLength(f.minLength !== undefined ? f.minLength : '');
    setMaxLength(f.maxLength !== undefined ? f.maxLength : '');
    setMinValue(f.minValue !== undefined ? f.minValue : '');
    setMaxValue(f.maxValue !== undefined ? f.maxValue : '');
    setFormulaExpression(f.formulaExpression || '');
    setConditionalVisibleField(f.conditionalVisibleField || '');
    setConditionalVisibleValue(f.conditionalVisibleValue || '');
  };

  const handleDeleteField = (id: string) => {
    const updated = draftFields.filter(f => f.id !== id);
    setDraftFields(updated);
    pushHistory(updated);
    if (editingFieldId === id) resetForm();
  };

  const handleToggleArchiveField = (id: string) => {
    const updated = draftFields.map(f => f.id === id ? { ...f, isArchived: !f.isArchived } : f);
    setDraftFields(updated);
    pushHistory(updated);
  };

  const handleToggleActiveField = (id: string) => {
    const updated = draftFields.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
    setDraftFields(updated);
    pushHistory(updated);
  };

  const handleDuplicateField = (f: CustomField) => {
    const cloned: CustomField = {
      ...f,
      id: `f_cust_cloned_${Date.now()}`,
      displayName: `${f.displayName} (Copy)`,
      internalName: `${f.internalName}_copy`,
      displayOrder: draftFields.length + 1,
    };
    const updated = [...draftFields, cloned];
    setDraftFields(updated);
    pushHistory(updated);
  };

  // Publish Draft Schema to Metadata DB
  const handlePublishSchema = () => {
    const changeReason = prompt('Provide a brief release note summary of this published metadata schema revision:', 'Injected dynamic attributes, updated formula logic mappings') || 'Published custom field schema changes';
    
    // Save to local storage for backward-compatibility customFields hooks
    localStorage.setItem('nexova_custom_fields', JSON.stringify(draftFields));
    setCustomFields(draftFields);

    // Sync into Metadata database
    try {
      const metaSchema = {
        formId: 'form_products',
        moduleKey: 'products',
        fields: draftFields.filter(f => !f.isArchived).map(cf => ({
          id: cf.id,
          uuid: cf.id,
          fieldKey: cf.internalName,
          fieldName: cf.internalName,
          displayName: cf.displayName,
          description: cf.helpText || '',
          placeholder: cf.placeholder || '',
          tooltip: cf.tooltip || '',
          helpText: cf.helpText || '',
          fieldType: cf.type as any,
          defaultValue: cf.defaultValue || '',
          required: !!cf.required,
          unique: !!cf.unique,
          readonly: !!cf.readOnly || !cf.isActive,
          hidden: !!cf.hidden || !cf.isActive,
          visible: !cf.hidden && !!cf.isActive,
          searchable: cf.searchable !== false,
          filterable: cf.filterable !== false,
          sortable: cf.sortable !== false,
          exportable: cf.exportable !== false,
          importable: cf.importable !== false,
          printable: cf.printable !== false,
          encrypted: false,
          mask: '',
          minLength: cf.minLength || 0,
          maxLength: cf.maxLength || 0,
          minimum: cf.minValue || 0,
          maximum: cf.maxValue || 0,
          regex: cf.regexValidation || '',
          tab: cf.tabAssignment || 'custom',
          section: cf.sectionAssignment || 'sec_custom_fields',
          group: 'default',
          order: cf.displayOrder || 1,
          icon: cf.icon || '',
          color: cf.color || '',
          width: cf.columnWidth || 'Half',
          responsiveWidth: '100%',
          formula: cf.formulaExpression || '',
          validationRules: [],
          workflow: [],
          permission: [],
          dependencies: cf.conditionalVisibleField ? [
            {
              id: `dep_${cf.id}_vis`,
              sourceFieldKey: cf.internalName,
              targetFieldKey: cf.conditionalVisibleField,
              conditionType: 'equals' as const,
              conditionValue: cf.conditionalVisibleValue || '',
              action: 'show' as const
            }
          ] : [],
          options: cf.options ? cf.options.map(o => ({ label: o, value: o })) : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
          version: currentVersionNum + 1,
        })),
        layout: {
          tabs: [...DEFAULT_TABS],
          sections: [...DEFAULT_SECTIONS],
          groups: [],
        }
      };
      
      localStorage.setItem('meta_form_products', JSON.stringify(metaSchema));
    } catch (e: any) {
      console.error('Metadata db sync failed', e);
      window.alert(`Error: Metadata db sync failed: ${e.message || e}`);
    }

    // Save version history entry
    const nextVersion = currentVersionNum + 1;
    const versionSnapshot: SchemaVersion = {
      version: nextVersion,
      timestamp: new Date().toISOString(),
      description: changeReason,
      fields: [...draftFields]
    };
    const updatedVersions = [versionSnapshot, ...schemaVersions];
    setSchemaVersions(updatedVersions);
    setCurrentVersionNum(nextVersion);
    localStorage.setItem('nexova_custom_fields_versions', JSON.stringify(updatedVersions));
    localStorage.setItem('nexova_custom_fields_version_num', nextVersion.toString());

    // Register audit log
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString();
    const nextAudit: AuditLogEntry = {
      id: `audit_pub_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      user: 'M. Rahman',
      role: 'Administrator',
      productId: 'ALL',
      productName: 'ERP Master Schema',
      productSku: 'SYSTEM',
      fieldChanged: 'SCHEMA_PUBLISH',
      displayName: 'SCHEMA_PUBLISH',
      oldValue: `v${currentVersionNum}.0.0`,
      newValue: `v${nextVersion}.0.0 Active`,
      reason: changeReason,
      ip: '127.0.0.1',
      browser: 'System WebKit',
      approvalStatus: 'Auto-Approved'
    };
    const updatedAudit = [nextAudit, ...auditLogs];
    setAuditLogs(updatedAudit);
    localStorage.setItem('nexova_product_audit_logs', JSON.stringify(updatedAudit));

    alert(`Successfully published custom field schema version v${nextVersion}.0.0 to the core ERP!`);
  };

  // Rollback to specific version snapshot
  const handleRollback = (ver: SchemaVersion) => {
    if (!confirm(`Are you absolutely sure you want to revert the entire ERP custom field configurations to v${ver.version}.0.0? Current unpublished draft edits will be overwritten.`)) return;

    setDraftFields(ver.fields);
    setCustomFields(ver.fields);
    localStorage.setItem('nexova_custom_fields', JSON.stringify(ver.fields));

    // Register audit log
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString();
    const nextAudit: AuditLogEntry = {
      id: `audit_roll_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      user: 'M. Rahman',
      role: 'Administrator',
      productId: 'ALL',
      productName: 'ERP Master Schema',
      productSku: 'SYSTEM',
      fieldChanged: 'SCHEMA_ROLLBACK',
      displayName: 'SCHEMA_ROLLBACK',
      oldValue: `v${currentVersionNum}.0.0`,
      newValue: `v${ver.version}.0.0 Active`,
      reason: `Rollback triggered to schema version v${ver.version}.0.0`,
      ip: '127.0.0.1',
      browser: 'System WebKit',
      approvalStatus: 'Auto-Approved'
    };
    const updatedAudit = [nextAudit, ...auditLogs];
    setAuditLogs(updatedAudit);
    localStorage.setItem('nexova_product_audit_logs', JSON.stringify(updatedAudit));

    alert(`Successfully rolled back and published schema version v${ver.version}.0.0!`);
  };

  const handleExportFields = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draftFields, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexova_metadata_schema_v${currentVersionNum}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFields = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setDraftFields(parsed);
            pushHistory(parsed);
            alert('Custom field schema imported into workspace. Review changes and click Publish!');
          }
        } catch (err) {
          alert('Failed to parse JSON file!');
        }
      };
    }
  };

  // Evaluate Sandbox Field dependency visibility
  const isSandboxFieldVisible = (f: CustomField) => {
    if (!f.conditionalVisibleField) return true;
    const condVal = sandboxData[f.conditionalVisibleField];
    return String(condVal) === String(f.conditionalVisibleValue);
  };

  // Evaluate Formulas in the Live Preview sandbox
  const evaluateSandboxFormulas = (fieldName: string, value: any, currentData: Record<string, any>) => {
    const updatedData = { ...currentData, [fieldName]: value };

    // Find any formula fields that depend on inputs
    draftFields.forEach(f => {
      if (f.type === 'Formula' && f.formulaExpression) {
        try {
          const expression = f.formulaExpression;
          const keys = Object.keys(updatedData);
          const values = keys.map(k => {
            const val = updatedData[k];
            return typeof val === 'number' ? val : (parseFloat(val) || 0);
          });
          const runner = new Function(...keys, `return (${expression});`);
          const result = runner(...values);
          updatedData[f.internalName] = isNaN(result) ? 0 : result;
        } catch (e) {
          updatedData[f.internalName] = 0;
        }
      }
    });

    return updatedData;
  };

  const handleSandboxFieldChange = (f: CustomField, val: any) => {
    let finalVal = val;
    let err = '';

    // Advanced Live Validation Simulators
    if (f.required && (val === '' || val === undefined)) {
      err = `${f.displayName} is a strictly required field.`;
    } else if (f.regexValidation && val !== '') {
      const rx = new RegExp(f.regexValidation);
      if (!rx.test(String(val))) {
        err = `Invalid format. Must match standard pattern: ${f.regexValidation}`;
      }
    } else if (f.type === 'Number' || f.type === 'Decimal' || f.type === 'Currency') {
      const num = Number(val);
      if (f.minValue !== undefined && num < f.minValue) {
        err = `Value cannot be less than the minimum required limit of ${f.minValue}`;
      } else if (f.maxValue !== undefined && num > f.maxValue) {
        err = `Value cannot exceed the maximum required ceiling limit of ${f.maxValue}`;
      }
    } else if (f.type === 'Text') {
      const len = String(val).length;
      if (f.minLength !== undefined && len < f.minLength) {
        err = `Text must be at least ${f.minLength} characters long.`;
      } else if (f.maxLength !== undefined && len > f.maxLength) {
        err = `Text cannot exceed ${f.maxLength} characters limit.`;
      }
    }

    setSandboxErrors(prev => ({ ...prev, [f.internalName]: err }));
    const computedData = evaluateSandboxFormulas(f.internalName, finalVal, sandboxData);
    setSandboxData(computedData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Nexova Dynamic Schema Configurator</h3>
                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-indigo-100">
                  SCHEMA V{currentVersionNum}.0.0
                </span>
                {hasUnpublishedChanges && (
                  <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded animate-pulse border border-amber-200">
                    ⚠️ UNPUBLISHED DRAFT EDITS PENDING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">SAP & Oracle-Grade No-Code ERP Metadata Custom Field Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'}`}
              title="Undo Action"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'}`}
              title="Redo Action"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            {hasUnpublishedChanges && (
              <button
                onClick={handlePublishSchema}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Publish Dynamic Schema</span>
              </button>
            )}

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer ml-2">✕</button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 shrink-0">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'fields' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Database className="h-4 w-4" />
            <span>Form Builder Layout</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'preview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Eye className="h-4 w-4" />
            <span>Live Sandbox Playground</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'permissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Shield className="h-4 w-4" />
            <span>Field Access Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'versions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <History className="h-4 w-4" />
            <span>Schema Versions & Rollbacks</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Layers className="h-4 w-4" />
            <span>Enterprise Audit Trail Logs</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50/20">
          
          {/* TAB 1: FORM BUILDER LAYOUT */}
          {activeTab === 'fields' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch overflow-hidden">
              
              {/* Left Column: Form Builder Panel */}
              <form onSubmit={handleSaveField} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-full overflow-y-auto space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-1.5 shrink-0">
                  <Plus className="h-4 w-4 text-indigo-600" />
                  <span>{editingFieldId ? 'Edit Metadata Field Specification' : 'Add New Custom Metadata Field'}</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field Label Name *</label>
                    <input
                      type="text" required placeholder="e.g. Brinell Hardness Value" value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (!editingFieldId) {
                          setInternalName(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Database Slug (Slug/Key) *</label>
                    <input
                      type="text" required disabled={!!editingFieldId} placeholder="e.g. brinell_hardness_value" value={internalName}
                      onChange={(e) => setInternalName(e.target.value)}
                      className="w-full bg-white disabled:bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-indigo-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field Type</label>
                    <select
                      value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold text-slate-700"
                    >
                      {['Text', 'Number', 'Decimal', 'Currency', 'Date', 'DateTime', 'Checkbox', 'Toggle', 'Dropdown', 'Multi-select', 'Radio', 'Email', 'Phone', 'URL', 'Barcode', 'QR Code', 'Image', 'Gallery', 'File', 'PDF', 'Formula', 'Lookup', 'Relations'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grid Width Size</label>
                    <select
                      value={columnWidth} onChange={(e) => setColumnWidth(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Full">Full width (100% block row)</option>
                      <option value="Half">Half width (50%)</option>
                      <option value="Third">Third width (33%)</option>
                      <option value="Quarter">Quarter width (25%)</option>
                    </select>
                  </div>
                </div>

                {/* Dropdown Options or Relational values configured */}
                {(type === 'Dropdown' || type === 'Multi-select' || type === 'Radio') && (
                  <div className="shrink-0 animate-in slide-in-from-top-1 duration-100">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Choices / Options (Comma separated list) *</label>
                    <input
                      type="text" required placeholder="Standard Grade, Premium Fit, Low Temp, Industrial" value={optionsStr}
                      onChange={(e) => setOptionsStr(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}

                {/* Formula Config */}
                {type === 'Formula' && (
                  <div className="shrink-0 animate-in slide-in-from-top-1 duration-100">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Formula Equation Expression (JavaScript formula evaluation) *</label>
                    <input
                      type="text" required placeholder="e.g. price - cost" value={formulaExpression}
                      onChange={(e) => setFormulaExpression(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Evaluates based on other product attributes. e.g. <code>price * 1.15</code></p>
                  </div>
                )}

                {/* Positions panel assignment */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Tab Segment</label>
                    <select
                      value={tabAssignment} onChange={(e) => setTabAssignment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {DEFAULT_TABS.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Form Section</label>
                    <select
                      value={sectionAssignment} onChange={(e) => setSectionAssignment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {DEFAULT_SECTIONS.map((s) => (
                        <option key={s.id} value={s.id}>{s.title} ({DEFAULT_TABS.find(t => t.id === s.tabId)?.title || s.tabId})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Helper UI Labels */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Help Text Guide</label>
                    <input
                      type="text" placeholder="Helper description shown below input" value={helpText}
                      onChange={(e) => setHelpText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input Placeholder</label>
                    <input
                      type="text" placeholder="e.g. Enter pH compounds..." value={placeholder}
                      onChange={(e) => setPlaceholder(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Constraints validations panel */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3 shrink-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Validations & Regex Constraints</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Regex Pattern Match</label>
                      <input
                        type="text" placeholder="^[a-zA-Z0-9]+$" value={regexValidation}
                        onChange={(e) => setRegexValidation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] font-mono focus:outline-none"
                      />
                    </div>
                    {type === 'Text' ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Min Length</label>
                          <input
                            type="number" placeholder="2" value={minLength}
                            onChange={(e) => setMinLength(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Max Length</label>
                          <input
                            type="number" placeholder="50" value={maxLength}
                            onChange={(e) => setMaxLength(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (type === 'Number' || type === 'Decimal' || type === 'Currency') ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Min Value</label>
                          <input
                            type="number" placeholder="0" value={minValue}
                            onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Max Value</label>
                          <input
                            type="number" placeholder="10000" value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-[10px] text-slate-400 italic">No min/max for {type}</div>
                    )}
                  </div>
                </div>

                {/* Conditional Visibility Group */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3 shrink-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">SAP Dynamic Visible Dependencies</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Visible Only If Field</label>
                      <select
                        value={conditionalVisibleField} onChange={(e) => setConditionalVisibleField(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                      >
                        <option value="">-- Always Visible --</option>
                        {draftFields.filter(f => f.id !== editingFieldId).map(f => (
                          <option key={f.id} value={f.internalName}>{f.displayName} ({f.internalName})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Equals Target Value</label>
                      <input
                        type="text" placeholder="e.g. Yes" value={conditionalVisibleValue}
                        onChange={(e) => setConditionalVisibleValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Attribute Toggles Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-200 shrink-0">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Required</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Unique Slug</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Read Only</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Hidden Form</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={searchable} onChange={(e) => setSearchable(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Searchable</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={filterable} onChange={(e) => setFilterable(e.target.checked)} className="rounded text-indigo-600" />
                    <span>Filterable</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 mt-auto shrink-0">
                  {editingFieldId && (
                    <button type="button" onClick={resetForm} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex-1">
                    {editingFieldId ? 'Apply Schema Attributes' : 'Inject Dynamic Field Draft'}
                  </button>
                </div>
              </form>

              {/* Right Column: Custom Fields Directory Grid with drag & drop */}
              <div className="lg:col-span-7 flex flex-col h-full overflow-hidden space-y-4">
                
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Search active schema fields by display name or DB slug..."
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExportFields}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON Schema</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import Schema</span>
                      <input type="file" accept=".json" onChange={handleImportFields} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl flex-1 overflow-hidden bg-white shadow-xs flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-xs table-fixed">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50/50 sticky top-0 backdrop-blur-xs z-10">
                          <th className="py-2.5 px-4 text-center w-12">Drag</th>
                          <th className="py-2.5 px-4 w-1/3">Field Definition Name</th>
                          <th className="py-2.5 px-4">Slug (Slug/Key)</th>
                          <th className="py-2.5 px-4 text-center">Type</th>
                          <th className="py-2.5 px-4 text-center">Constraints</th>
                          <th className="py-2.5 px-4 text-right w-36">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftFields
                          .filter(f => !fieldSearch || f.displayName.toLowerCase().includes(fieldSearch.toLowerCase()) || f.internalName.toLowerCase().includes(fieldSearch.toLowerCase()))
                          .map((f, idx) => {
                            const isSystem = !f.id.startsWith('f_cust_');
                            return (
                              <tr
                                key={f.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                                className={`hover:bg-slate-50/70 transition-colors cursor-move ${draggedIndex === idx ? 'bg-indigo-50/50' : ''} ${f.isArchived ? 'bg-slate-50 text-slate-400' : ''} ${!f.isActive ? 'bg-rose-50/10' : ''}`}
                              >
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <Move className="h-3.5 w-3.5 text-slate-300" />
                                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{f.displayOrder}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold">
                                  <div className="flex flex-col truncate">
                                    <span className={f.isArchived ? 'line-through text-slate-400' : 'text-slate-800'}>{f.displayName}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {isSystem ? (
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1 py-0.2 rounded w-max">ERP Core</span>
                                      ) : (
                                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1 py-0.2 rounded w-max">METADATA</span>
                                      )}
                                      {!f.isActive && (
                                        <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-1 py-0.2 rounded w-max">DISABLED</span>
                                      )}
                                      {f.isArchived && (
                                        <span className="text-[8px] font-bold text-amber-500 bg-amber-50 px-1 py-0.2 rounded uppercase">ARCHIVED</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-[10px] font-bold text-indigo-600 truncate">{f.internalName}</td>
                                <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500 font-semibold">{f.type}</td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-wrap gap-0.5 justify-center">
                                    {f.required && <span className="text-[7.5px] font-bold bg-rose-50 text-rose-600 px-1 py-0.2 rounded">REQ</span>}
                                    {f.unique && <span className="text-[7.5px] font-bold bg-amber-50 text-amber-700 px-1 py-0.2 rounded">UNQ</span>}
                                    {f.readOnly && <span className="text-[7.5px] font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded">R/O</span>}
                                    {f.hidden && <span className="text-[7.5px] font-bold bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded">HID</span>}
                                    {f.formulaExpression && <span className="text-[7.5px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded">EQ</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditField(f)}
                                      className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                                      title="Edit Attributes"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    {!isSystem && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleDuplicateField(f)}
                                          className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                                          title="Duplicate Field Config"
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleActiveField(f.id)}
                                          className={`p-1 rounded cursor-pointer ${f.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                          title={f.isActive ? 'Disable Field' : 'Enable Field'}
                                        >
                                          {f.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleArchiveField(f.id)}
                                          className={`p-1 rounded cursor-pointer ${f.isArchived ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                          title={f.isArchived ? 'Restore' : 'Archive'}
                                        >
                                          {f.isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteField(f.id)}
                                          className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                          title="Permanently Purge"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE PREVIEW PLAYGROUND */}
          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch overflow-hidden">
              
              {/* Left Column: Sandbox Forms Canvas */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Real-Time Metadata Generated Forms Sandbox</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Simulate interactive form values. Formulas evaluate and dependencies trigger immediately.</p>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {draftFields
                    .filter(f => !f.isArchived && f.isActive && !f.hidden && isSandboxFieldVisible(f))
                    .map((f) => {
                      const value = sandboxData[f.internalName] !== undefined ? sandboxData[f.internalName] : (f.defaultValue || '');
                      const error = sandboxErrors[f.internalName];

                      let spanClass = 'col-span-12';
                      if (f.columnWidth === 'Half') spanClass = 'col-span-12 sm:col-span-6';
                      if (f.columnWidth === 'Third') spanClass = 'col-span-12 sm:col-span-4';
                      if (f.columnWidth === 'Quarter') spanClass = 'col-span-12 sm:col-span-3';

                      return (
                        <div key={f.id} className={`${spanClass} space-y-1.5 animate-in fade-in zoom-in-95 duration-100`}>
                          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>{f.displayName}</span>
                            {f.required && <span className="text-rose-500 font-bold">*</span>}
                            {f.tooltip && (
                              <div className="relative group">
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 cursor-pointer" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded shadow z-50 whitespace-nowrap">
                                  {f.tooltip}
                                </div>
                              </div>
                            )}
                          </label>

                          <div className="relative">
                            {/* Standard text inputs */}
                            {(f.type === 'Text' || f.type === 'Rich Text' || f.type === 'Email' || f.type === 'Phone' || f.type === 'URL') && (
                              <input
                                type={f.type === 'Email' ? 'email' : f.type === 'Phone' ? 'tel' : f.type === 'URL' ? 'url' : 'text'}
                                placeholder={f.placeholder || `Enter ${f.displayName.toLowerCase()}`}
                                disabled={f.readOnly}
                                value={value}
                                onChange={(e) => handleSandboxFieldChange(f, e.target.value)}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 ${error ? 'border-rose-400 bg-rose-50/10' : ''}`}
                              />
                            )}

                            {/* Textarea */}
                            {f.type === 'Textarea' && (
                              <textarea
                                placeholder={f.placeholder}
                                disabled={f.readOnly}
                                value={value}
                                onChange={(e) => handleSandboxFieldChange(f, e.target.value)}
                                rows={3}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 ${error ? 'border-rose-400 bg-rose-50/10' : ''}`}
                              />
                            )}

                            {/* Number, Currency, Decimal, Percentage */}
                            {(f.type === 'Number' || f.type === 'Decimal' || f.type === 'Currency' || f.type === 'Percentage') && (
                              <div className="relative flex items-center">
                                {f.type === 'Currency' && <span className="absolute left-3 text-slate-400 text-xs font-bold">৳</span>}
                                <input
                                  type="number"
                                  placeholder={f.placeholder || '0'}
                                  disabled={f.readOnly}
                                  value={value}
                                  onChange={(e) => handleSandboxFieldChange(f, e.target.value === '' ? '' : Number(e.target.value))}
                                  className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 ${f.type === 'Currency' ? 'pl-7' : ''} ${error ? 'border-rose-400 bg-rose-50/10' : ''}`}
                                />
                                {f.type === 'Percentage' && <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>}
                              </div>
                            )}

                            {/* Dropdowns */}
                            {f.type === 'Dropdown' && (
                              <select
                                disabled={f.readOnly}
                                value={value}
                                onChange={(e) => handleSandboxFieldChange(f, e.target.value)}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer ${error ? 'border-rose-400 bg-rose-50/10' : ''}`}
                              >
                                <option value="">Select Option</option>
                                {f.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {/* Checkbox */}
                            {f.type === 'Checkbox' && (
                              <div className="flex items-center h-10">
                                <input
                                  type="checkbox"
                                  disabled={f.readOnly}
                                  checked={!!value}
                                  onChange={(e) => handleSandboxFieldChange(f, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="ml-2 text-xs text-slate-600 font-semibold">{value ? 'Checked' : 'Unchecked'}</span>
                              </div>
                            )}

                            {/* Toggle / Boolean */}
                            {(f.type === 'Toggle' || f.type === 'Boolean') && (
                              <div className="flex items-center h-10">
                                <button
                                  type="button"
                                  disabled={f.readOnly}
                                  onClick={() => handleSandboxFieldChange(f, !value)}
                                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <span className="ml-3 text-xs text-slate-600 font-semibold">{value ? 'Active' : 'Inactive'}</span>
                              </div>
                            )}

                            {/* Formula Field (Automatic computation) */}
                            {f.type === 'Formula' && (
                              <div className="flex items-center bg-indigo-50/30 border border-indigo-100 rounded-lg px-3 py-2.5">
                                <Cpu className="w-4 h-4 text-indigo-600 mr-2 animate-pulse" />
                                <span className="text-xs font-mono font-bold text-indigo-700">{value !== undefined ? value : '0.00'}</span>
                                <span className="ml-auto text-[8px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-mono font-bold">CALCULATED</span>
                              </div>
                            )}

                            {/* Date, DateTime */}
                            {(f.type === 'Date' || f.type === 'DateTime') && (
                              <input
                                type={f.type === 'Date' ? 'date' : 'datetime-local'}
                                disabled={f.readOnly}
                                value={value}
                                onChange={(e) => handleSandboxFieldChange(f, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                              />
                            )}

                            {/* Multi-select checkboxes */}
                            {(f.type === 'Multi-select' || f.type === 'Radio') && (
                              <div className="flex flex-wrap gap-2 py-1.5 border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                                {f.options?.map(opt => {
                                  const isSel = f.type === 'Radio' ? value === opt : String(value).split(',').filter(Boolean).includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={f.readOnly}
                                      onClick={() => {
                                        if (f.type === 'Radio') {
                                          handleSandboxFieldChange(f, opt);
                                        } else {
                                          const arr = String(value).split(',').filter(Boolean);
                                          const next = arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt];
                                          handleSandboxFieldChange(f, next.join(','));
                                        }
                                      }}
                                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-semibold ${isSel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                          </div>

                          {f.helpText && <p className="text-[9px] text-slate-400 font-medium">{f.helpText}</p>}
                          {error && <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">⚠️ {error}</p>}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Dynamic Controller Values Simulators */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col h-full overflow-y-auto space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Sandbox Variable Driver
                </h4>
                <p className="text-[10px] text-slate-400">Change values below to simulate variables inside formula equations.</p>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Selling Price (`price` variable)</label>
                    <input
                      type="number"
                      value={sandboxData.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const computed = evaluateSandboxFormulas('price', val, sandboxData);
                        setSandboxData(computed);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Cost Price (`cost` variable)</label>
                    <input
                      type="number"
                      value={sandboxData.cost}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const computed = evaluateSandboxFormulas('cost', val, sandboxData);
                        setSandboxData(computed);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-2">Live computed states payload:</span>
                    <pre className="bg-slate-950 text-emerald-400 font-mono text-[9px] p-3 rounded-lg overflow-x-auto border border-slate-800 leading-relaxed max-h-[250px]">
                      {JSON.stringify(sandboxData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FIELD PERMISSIONS MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
                <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">Role-Based Granular Field Permissions Matrix</h4>
                  Configure field access restrictions per employee security profile. Changes saved locally and applied on form renders.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                      <th className="py-3 px-6">Field Definition Name</th>
                      {permissions.map((p) => (
                        <th key={p.role} className="py-3 px-6 text-center">{p.role} Access</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { key: 'name', label: 'Product Name' },
                      { key: 'sku', label: 'SKU / Code' },
                      { key: 'category', label: 'Category' },
                      { key: 'price', label: 'Selling Price' },
                      { key: 'cost', label: 'Cost Price' },
                      { key: 'stock', label: 'Current Stock Qty' },
                      { key: 'warehouse', label: 'Warehouse Location' },
                    ].map((core) => (
                      <tr key={core.key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6 font-bold text-slate-800 flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-amber-500" />
                          <span>{core.label}</span>
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded uppercase">Core ERP</span>
                        </td>
                        {permissions.map((p) => {
                          const currentVal = p.fieldPermissions[core.key] || p.fieldPermissions['*'] || 'Edit';
                          return (
                            <td key={p.role} className="py-3 px-6 text-center">
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  const updatedPerms = permissions.map((rolePerm) => {
                                    if (rolePerm.role === p.role) {
                                      return {
                                        ...rolePerm,
                                        fieldPermissions: {
                                          ...rolePerm.fieldPermissions,
                                          [core.key]: val,
                                        },
                                      };
                                    }
                                    return rolePerm;
                                  });
                                  savePermissions(updatedPerms);
                                }}
                                className={`text-[11px] font-bold px-2 py-1 rounded border cursor-pointer ${
                                  currentVal === 'Edit'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : currentVal === 'View'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}
                              >
                                <option value="Edit">✏️ Edit</option>
                                <option value="View">👁️ View Only</option>
                                <option value="None">🔒 Denied</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {draftFields.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-6 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{f.displayName}</span>
                            <span className="font-mono text-[9px] text-slate-400 font-medium">{f.internalName}</span>
                          </div>
                        </td>
                        {permissions.map((p) => {
                          const currentVal = p.fieldPermissions[f.internalName] || p.fieldPermissions['*'] || 'Edit';
                          return (
                            <td key={p.role} className="py-3 px-6 text-center">
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  const updatedPerms = permissions.map((rolePerm) => {
                                    if (rolePerm.role === p.role) {
                                      return {
                                        ...rolePerm,
                                        fieldPermissions: {
                                          ...rolePerm.fieldPermissions,
                                          [f.internalName]: val,
                                        },
                                      };
                                    }
                                    return rolePerm;
                                  });
                                  savePermissions(updatedPerms);
                                }}
                                className={`text-[11px] font-bold px-2 py-1 rounded border cursor-pointer ${
                                  currentVal === 'Edit'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : currentVal === 'View'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}
                              >
                                <option value="Edit">✏️ Edit</option>
                                <option value="View">👁️ View Only</option>
                                <option value="None">🔒 Denied</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SCHEMA VERSIONS & ROLLBACK */}
          {activeTab === 'versions' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
                <History className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">Durable Schema Versioning Control & Snapshot Rollback</h4>
                  Keep an immutable history log of all published enterprise custom field metadata designs. Click <strong>Rollback</strong> next to any previous iteration to instantly restore the whole database fields structure!
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                      <th className="py-3 px-6 w-32">Version ID</th>
                      <th className="py-3 px-6">Release Date & Timestamp</th>
                      <th className="py-3 px-6">Description Release Notes</th>
                      <th className="py-3 px-6 text-center w-36">Total Fields Defined</th>
                      <th className="py-3 px-6 text-right w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {schemaVersions.map((v) => {
                      const isActive = v.version === currentVersionNum;
                      return (
                        <tr key={v.version} className={`hover:bg-slate-50/50 transition-colors ${isActive ? 'bg-indigo-50/20 font-semibold' : ''}`}>
                          <td className="py-3.5 px-6 font-mono text-[10px] font-bold text-indigo-700">
                            v{v.version}.0.0
                          </td>
                          <td className="py-3.5 px-6 font-mono text-slate-500 text-[10px]">
                            {new Date(v.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6 text-slate-700 font-sans">
                            {v.description}
                          </td>
                          <td className="py-3.5 px-6 text-center font-bold text-slate-600">
                            {v.fields.length} Fields
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                                <Check className="w-3 h-3" />
                                <span>Active Schema</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRollback(v)}
                                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                Rollback to V{v.version}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chronicled Master Schema Audit Log</h4>
                  <p className="text-[10px] text-slate-400">Verifiable operational changes tracking all published dynamic metadata schemas.</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Permanently purge audit logging history?')) {
                      setAuditLogs([]);
                      localStorage.setItem('nexova_product_audit_logs', '[]');
                    }
                  }}
                  className="px-3 py-1.5 hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Clear History Log
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="max-h-[55vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase bg-slate-50">
                        <th className="py-2.5 px-4 w-40">Timestamp</th>
                        <th className="py-2.5 px-4 w-32">Operator</th>
                        <th className="py-2.5 px-4 w-32">Role Profile</th>
                        <th className="py-2.5 px-4 w-40">Attribute Module</th>
                        <th className="py-2.5 px-4 w-40">Action Type</th>
                        <th className="py-2.5 px-4 text-center">Previous Value</th>
                        <th className="py-2.5 px-4 text-center">New Value State</th>
                        <th className="py-2.5 px-4">Release Note Summary / Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">
                            {log.date} {log.time}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {log.user}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{log.role}</span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">
                            {log.productName}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-[10px] text-indigo-600">
                            {log.fieldChanged}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-100">{log.oldValue || 'NULL'}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100 font-bold">{log.newValue || 'NULL'}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 italic font-medium leading-relaxed">
                            {log.reason || 'No description recorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Enterprise Metadata Engine Operational Status: Ready
          </span>
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer transition-colors">
            Exit Configurator Workspace
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 2: ENTERPRISE TABS RENDERING
// ==========================================

interface ProductEnterpriseTabsProps {
  productData: Record<string, any>;
  setProductData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  customFields: CustomField[];
  currentUserRole?: string;
}

export function ProductEnterpriseTabs({ productData, setProductData, customFields, currentUserRole = 'Administrator' }: ProductEnterpriseTabsProps) {
  const [activeTab, setActiveTab] = useState('general');

  // Load field permissions
  const [permissions] = useState<RolePermission[]>(() => {
    const saved = localStorage.getItem('nexova_field_permissions');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
  });

  const getPermission = (fieldName: string) => {
    const rolePerm = permissions.find(p => p.role === currentUserRole) || permissions[0];
    const perm = rolePerm.fieldPermissions[fieldName] ?? rolePerm.fieldPermissions['*'] ?? 'Edit';
    return perm;
  };

  const handleChange = (fieldName: string, val: any) => {
    setProductData(prev => ({
      ...prev,
      [fieldName]: val
    }));
  };

  const renderFieldInput = (f: CustomField) => {
    const perm = getPermission(f.internalName);
    if (perm === 'None' || f.hidden) return null;

    const disabled = perm === 'View' || f.readOnly;
    const value = productData[f.internalName] !== undefined ? productData[f.internalName] : (f.defaultValue || '');

    // Layout configuration
    let colSpanClass = 'col-span-12';
    if (f.columnWidth === 'Half') colSpanClass = 'col-span-12 sm:col-span-6';
    if (f.columnWidth === 'Third') colSpanClass = 'col-span-12 sm:col-span-4';
    if (f.columnWidth === 'Quarter') colSpanClass = 'col-span-12 sm:col-span-3';

    return (
      <div key={f.id} className={`${colSpanClass} space-y-1.5`}>
        <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span>{f.displayName}</span>
          {f.required && <span className="text-rose-500 font-bold">*</span>}
          {f.tooltip && (
            <div className="relative group">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 cursor-pointer" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block bg-slate-800 text-white text-[9px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                {f.tooltip}
              </div>
            </div>
          )}
        </label>

        {f.type === 'Textarea' || f.type === 'Rich Text' ? (
          <textarea
            disabled={disabled}
            placeholder={f.placeholder || `Enter ${f.displayName.toLowerCase()}`}
            value={value}
            onChange={(e) => handleChange(f.internalName, e.target.value)}
            className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
            rows={3}
          />
        ) : f.type === 'Dropdown' || f.type === 'User' || f.type === 'Employee' || f.type === 'Warehouse' || f.type === 'Supplier' || f.type === 'Customer' ? (
          <select
            disabled={disabled}
            value={value}
            onChange={(e) => handleChange(f.internalName, e.target.value)}
            className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
          >
            <option value="">-- Choose Option --</option>
            {f.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            {/* Hardcoded fallback options for lookups if options are missing */}
            {!f.options && f.type === 'Warehouse' && (
              <>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Yard A">Yard A</option>
                <option value="Yard B">Yard B</option>
              </>
            )}
            {!f.options && f.type === 'Supplier' && (
              <>
                <option value="Standard Supplier Ltd">Standard Supplier Ltd</option>
                <option value="Siam Cement Group">Siam Cement Group</option>
                <option value="BSRM Steel Corp">BSRM Steel Corp</option>
              </>
            )}
            {!f.options && f.internalName === 'abcClassification' && (
              <>
                <option value="A">A Rank (High Value)</option>
                <option value="B">B Rank (Medium Value)</option>
                <option value="C">C Rank (Low Value)</option>
              </>
            )}
          </select>
        ) : f.type === 'Toggle' ? (
          <div className="flex items-center h-10">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={value === 'true' || value === true}
                onChange={(e) => handleChange(f.internalName, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-600">{value === 'true' || value === true ? 'Enabled / Active' : 'Disabled / Inactive'}</span>
            </label>
          </div>
        ) : f.type === 'Date' ? (
          <input
            type="date"
            disabled={disabled}
            value={value}
            onChange={(e) => handleChange(f.internalName, e.target.value)}
            className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
          />
        ) : f.type === 'Number' || f.type === 'Decimal' || f.type === 'Currency' || f.type === 'Percentage' ? (
          <input
            type="number"
            step={f.type === 'Decimal' || f.type === 'Currency' ? '0.01' : '1'}
            disabled={disabled}
            placeholder={f.placeholder || '0'}
            value={value}
            onChange={(e) => handleChange(f.internalName, parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
          />
        ) : (
          <input
            type="text"
            disabled={disabled}
            placeholder={f.placeholder || `Enter ${f.displayName.toLowerCase()}`}
            value={value}
            onChange={(e) => handleChange(f.internalName, e.target.value)}
            className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
          />
        )}
        {f.helpText && <p className="text-[9px] text-slate-400">{f.helpText}</p>}
      </div>
    );
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Sub Tabs */}
      <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 scrollbar-none">
        {DEFAULT_TABS.map((tab) => {
          // Count active fields assigned to this tab
          const tabFields = customFields.filter(f => f.tabAssignment === tab.id && !f.isArchived);
          if (tabFields.length === 0) return null;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[10px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab.title} ({tabFields.length})
            </button>
          );
        })}
      </div>

      {/* Tabs fields list */}
      <div className="p-5 max-h-[40vh] overflow-y-auto">
        {DEFAULT_TABS.map((tab) => {
          if (activeTab !== tab.id) return null;

          const tabSections = DEFAULT_SECTIONS.filter(s => s.tabId === tab.id);
          const unsectionedFields = customFields.filter(f => f.tabAssignment === tab.id && !f.sectionAssignment && !f.isArchived);

          return (
            <div key={tab.id} className="space-y-6">
              {/* Render Sectioned Fields */}
              {tabSections.map((sec) => {
                const secFields = customFields.filter(f => f.sectionAssignment === sec.id && !f.isArchived);
                if (secFields.length === 0) return null;

                return (
                  <div key={sec.id} className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></div>
                      <span>{sec.title}</span>
                    </h4>
                    <div className="grid grid-cols-12 gap-4">
                      {secFields.map(renderFieldInput)}
                    </div>
                  </div>
                );
              })}

              {/* Render Unsectioned Fields */}
              {unsectionedFields.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></div>
                    <span>Additional Fields</span>
                  </h4>
                  <div className="grid grid-cols-12 gap-4">
                    {unsectionedFields.map(renderFieldInput)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 3: BULK UPDATE OPERATOR BAR
// ==========================================

interface BulkEditBarProps {
  selectedProductIds: string[];
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  categories: string[];
  warehouses: { name: string }[];
  onClearSelection: () => void;
}

export function BulkEditBar({ selectedProductIds, products, onUpdateProducts, categories, warehouses, onClearSelection }: BulkEditBarProps) {
  const [bulkPriceChange, setBulkPriceChange] = useState('');
  const [bulkCategoryChange, setBulkCategoryChange] = useState('');
  const [bulkWarehouseChange, setBulkWarehouseChange] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState<'Fixed' | 'PercentIncrease' | 'PercentDecrease'>('Fixed');

  if (selectedProductIds.length === 0) return null;

  const handleApplyBulkPrice = () => {
    if (!bulkPriceChange) return;
    const val = parseFloat(bulkPriceChange);
    if (isNaN(val)) return;

    const updated = products.map((p) => {
      if (selectedProductIds.includes(p.id)) {
        let finalPrice = p.price;
        if (bulkPriceType === 'Fixed') {
          finalPrice = val;
        } else if (bulkPriceType === 'PercentIncrease') {
          finalPrice = p.price * (1 + val / 100);
        } else if (bulkPriceType === 'PercentDecrease') {
          finalPrice = p.price * (1 - val / 100);
        }
        return {
          ...p,
          price: parseFloat(finalPrice.toFixed(2))
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setBulkPriceChange('');
    alert(`Bulk Selling Price applied to ${selectedProductIds.length} items!`);
  };

  const handleApplyBulkCategory = () => {
    if (!bulkCategoryChange) return;
    const updated = products.map((p) => {
      if (selectedProductIds.includes(p.id)) {
        return { ...p, category: bulkCategoryChange };
      }
      return p;
    });
    onUpdateProducts(updated);
    setBulkCategoryChange('');
    alert(`Bulk Category updated to "${bulkCategoryChange}" for ${selectedProductIds.length} items!`);
  };

  const handleApplyBulkWarehouse = () => {
    if (!bulkWarehouseChange) return;
    const updated = products.map((p) => {
      if (selectedProductIds.includes(p.id)) {
        return { ...p, warehouse: bulkWarehouseChange };
      }
      return p;
    });
    onUpdateProducts(updated);
    setBulkWarehouseChange('');
    alert(`Bulk Warehouse updated to "${bulkWarehouseChange}" for ${selectedProductIds.length} items!`);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you absolutely sure you want to permanently delete the ${selectedProductIds.length} selected products? This is irreversible!`)) {
      const updated = products.filter((p) => !selectedProductIds.includes(p.id));
      onUpdateProducts(updated);
      onClearSelection();
      alert('Selected products deleted successfully!');
    }
  };

  return (
    <div className="bg-[#1e293b] text-white p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600/30 text-indigo-400 p-2 rounded-lg font-mono text-xs font-bold">
          {selectedProductIds.length} Selected
        </div>
        <div className="text-xs">
          <span className="font-bold block text-slate-200">Bulk Operations Console</span>
          <span className="text-[10px] text-slate-400">Perform changes on selected catalog references</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        
        {/* Bulk Price Update */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60 text-xs">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider shrink-0 pl-1">Price:</span>
          <select value={bulkPriceType} onChange={(e) => setBulkPriceType(e.target.value as any)} className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer">
            <option value="Fixed">Set Price</option>
            <option value="PercentIncrease">+ % Raise</option>
            <option value="PercentDecrease">- % Slash</option>
          </select>
          <input
            type="number"
            placeholder="Val"
            value={bulkPriceChange}
            onChange={(e) => setBulkPriceChange(e.target.value)}
            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-100 focus:outline-none"
          />
          <button onClick={handleApplyBulkPrice} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-2 py-1 rounded cursor-pointer">Apply</button>
        </div>

        {/* Bulk Category Change */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60 text-xs">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider shrink-0 pl-1">Category:</span>
          <select
            value={bulkCategoryChange}
            onChange={(e) => setBulkCategoryChange(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer max-w-[120px]"
          >
            <option value="">-- Choose --</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleApplyBulkCategory} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-2 py-1 rounded cursor-pointer">Apply</button>
        </div>

        {/* Bulk Warehouse Change */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60 text-xs">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider shrink-0 pl-1">Warehouse:</span>
          <select
            value={bulkWarehouseChange}
            onChange={(e) => setBulkWarehouseChange(e.target.value)}
            className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer max-w-[120px]"
          >
            <option value="">-- Choose --</option>
            {warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
          <button onClick={handleApplyBulkWarehouse} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-2 py-1 rounded cursor-pointer">Apply</button>
        </div>

        <button
          onClick={handleBulkDelete}
          className="bg-rose-600 hover:bg-rose-500 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 shadow-md shadow-rose-600/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Bulk Delete</span>
        </button>

        <button
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1.5"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
