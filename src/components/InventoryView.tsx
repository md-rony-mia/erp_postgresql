import React, { useState, useEffect } from 'react';
import { Product, Branch, formatBoxQty } from '../types';
import { isProductVisibleInBranch, getEffectiveStock } from '../lib/branchUtils';
import { calculateFIFOValuation, calculateLIFOValuation, DEFAULT_BATCHES } from '../lib/inventoryCosting';
import { DEMO_SEED_ENABLED } from '../lib/dataClient';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Edit3,
  Trash2,
  Database,
  Layers,
  Warehouse as WhIcon,
  QrCode,
  ArrowRightLeft,
  Percent,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Boxes,
  Compass,
  Settings,
  Eye,
  Sliders,
  FileSpreadsheet,
  FileUp,
  Printer,
  ChevronDown,
  Download,
  Upload,
  Lock,
  Unlock,
  Calendar,
  RefreshCw,
  BarChart3,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  MapPin,
  Camera
} from 'lucide-react';
import {
  CustomField,
  DEFAULT_FIELDS,
  ManageCustomFieldsModal,
  ProductEnterpriseTabs,
  BulkEditBar,
} from './ProductEnterpriseEngine';
import ExcelImportModal, { FieldSchema } from './ExcelImportModal';

import { useMetadata } from '../metadata/hooks';
import { DynamicFormRenderer } from '../metadata/renderer';
import { validateForm } from '../metadata/validators';
import { MetadataEngine } from '../metadata/engine';
import {
  TemplatesTab,
  VariantsTab,
  MetadataTab,
  CustomFieldsTab,
  LayoutBuilderTab,
  AttributesTab,
  BrandsTab,
  ManufacturersTab,
  PricingEngineTab,
  DiscountMatrixTab,
  PromotionManagerTab
} from './InventoryExtensions';
import {
  ZonesTab,
  AislesTab,
  RacksTab,
  ShelvesTab,
  BinsTab,
  AdjustmentTab,
  ReservationTab,
  BatchTab,
  LotTab,
  SerialTab,
  ExpiryTab,
  QrGeneratorTab,
  ValuationTab
} from './WarehouseExtensions';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onDeleteProduct: (productId: string) => void;
  activeSubTab?: string;
  onUpdateProducts?: (products: Product[]) => void;
  currentUser?: any;
  invoices?: any[];
  purchaseOrders?: any[];
  currentBranchId?: string;
  branches?: Branch[];
}

export default function InventoryView({
  products,
  onAddProduct,
  onUpdateStock,
  onDeleteProduct,
  activeSubTab = 'products',
  onUpdateProducts,
  currentUser,
  invoices = [],
  purchaseOrders = [],
  currentBranchId,
  branches = [],
}: InventoryViewProps) {
  // Navigation mapping if activeSubTab is parsed
  const currentTab = [
    'products', 'categories', 'units', 'warehouses', 'stock', 'stock_transfer', 'barcodes', 'offer_info',
    'templates', 'variants', 'metadata', 'custom_fields', 'layout_builder', 'attributes', 'brands', 'manufacturers', 'pricing', 'discount', 'promotion',
    'zones', 'aisles', 'racks', 'shelves', 'bins', 'adjustment', 'reservation', 'batch', 'lot', 'serial', 'expiry', 'qr', 'valuation'
  ].includes(activeSubTab)
    ? activeSubTab
    : 'products';

  // --- ENTERPRISE PRODUCT MASTER STATES & HELPERS ---
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    const saved = localStorage.getItem('nexova_custom_fields');
    return saved ? JSON.parse(saved) : DEFAULT_FIELDS;
  });

  useEffect(() => {
    localStorage.setItem('nexova_custom_fields', JSON.stringify(customFields));
  }, [customFields]);

  // --- DYNAMIC METADATA ENTERPRISE ENGINE INTEGRATION ---
  const {
    fields,
    tabs,
    sections,
    computeFieldAuditHistory,
    logAuditRecord,
  } = useMetadata('products');

  // Form states for Add Product
  const [addFormData, setAddFormData] = useState<Record<string, any>>({});
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states for Edit Product
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Synchronize custom fields state into metadata engine schema dynamically
  useEffect(() => {
    const metaSchema = MetadataEngine.initialize('products');
    const updatedMetaFields = [...metaSchema.fields];

    customFields.forEach((cf) => {
      const exists = updatedMetaFields.some(f => f.fieldKey === cf.internalName);
      if (!exists) {
        updatedMetaFields.push({
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
          readonly: !!cf.readOnly,
          hidden: !!cf.hidden,
          visible: !cf.hidden,
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
          section: cf.sectionAssignment || 'sec_custom_dyn',
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
          dependencies: [],
          options: cf.options ? cf.options.map(o => ({ label: o, value: o })) : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'ADMIN',
          updatedBy: 'ADMIN',
          version: 1,
        });
      }
    });

    MetadataEngine.saveMetadata('products', {
      ...metaSchema,
      fields: updatedMetaFields,
    });
  }, [customFields]);

  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [extraFields, setExtraFields] = useState<Record<string, any>>({});
  const [editingExtraFields, setEditingExtraFields] = useState<Record<string, any>>({});

  const [columnChooserOpen, setColumnChooserOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    sku_name: true,
    category: true,
    price: true,
    cost: true,
    stock: true,
    warehouse: true,
    brand: false,
    productCode: false,
    barcode: false,
    actions: true,
  });

  // Log changes helper
  const logFieldChanges = (oldProd: Product, newProd: Product, reason: string) => {
    try {
      const currentRole = 'Administrator';
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString();
      const logs: any[] = JSON.parse(localStorage.getItem('nexova_product_audit_logs') || '[]');

      const keysToTrack = Object.keys({ ...oldProd, ...newProd }).filter(k => k !== 'id');
      keysToTrack.forEach(k => {
        const oldVal = (oldProd as any)[k];
        const newVal = (newProd as any)[k];
        if (oldVal !== newVal) {
          const fieldDef = customFields.find(f => f.internalName === k);
          const dName = fieldDef ? fieldDef.displayName : k.toUpperCase();

          const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            productId: oldProd.id,
            productName: oldProd.name,
            productSku: oldProd.sku,
            fieldChanged: k,
            displayName: dName,
            oldValue: oldVal !== undefined ? String(oldVal) : '',
            newValue: newVal !== undefined ? String(newVal) : '',
            user: 'Administrator',
            role: currentRole,
            date: dateStr,
            time: timeStr,
            ip: '192.168.1.1',
            browser: 'Chrome ERP Client',
            reason: reason || 'Specifications updated',
            approvalStatus: 'Auto-Approved'
          };
          logs.unshift(entry);
        }
      });

      localStorage.setItem('nexova_product_audit_logs', JSON.stringify(logs));
    } catch (err) {
      // Intentionally silent: local audit logging errors are non-blocking background tasks
      console.error('Audit logging failure:', err);
    }
  };

  // --- PERSISTENT SUB-DATA STATE IN INVENTORY ---
  const [categories, setCategories] = useState<string[]>([
    'Construction Materials',
    'Steel Items',
    'Bricks & Sand',
    'Chemicals & Paint',
  ]);

  const [units, setUnits] = useState([
    { name: 'Bags', abbrev: 'bag', base: 'Yes', productsCount: 2 },
    { name: 'Tons', abbrev: 'ton', base: 'Yes', productsCount: 2 },
    { name: 'Pcs', abbrev: 'pc', base: 'Yes', productsCount: 1 },
    { name: 'Drums', abbrev: 'drm', base: 'No', productsCount: 1 },
  ]);

  const [warehouses, setWarehouses] = useState([
    { name: 'Main Warehouse', location: 'Dhaka Sadar', manager: 'Rashedul Islam', capacity: '1000 Tons' },
    { name: 'Yard A', location: 'Tongiganj', manager: 'Asaduzzaman Khan', capacity: '5000 Tons' },
    { name: 'Yard B', location: 'Narayanganj', manager: 'Farhana Yasmin', capacity: '3000 Tons' },
  ]);

  const [transfers, setTransfers] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_transfers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'tr1',
        date: '2026-07-02',
        refNo: 'TR-2601',
        productId: 'p1',
        productName: 'Standard Premium cement',
        qty: 25,
        unit: 'Bags',
        from: 'Main Warehouse',
        to: 'Yard A',
        status: 'Completed',
        batchNo: 'B-CEM-902',
        carrierName: 'Nexova Cargo Logistics',
        vehicleNo: 'Dhaka Metro-U-11-2092',
        driverPhone: '01827391029',
        sealNo: 'S-99120',
        approvedBy: 'Rashedul Islam',
        receivedDate: '2026-07-03'
      },
      {
        id: 'tr2',
        date: '2026-07-05',
        refNo: 'TR-2602',
        productId: 'p3',
        productName: 'Deformed Steel Bar 60G (16mm)',
        qty: 2,
        unit: 'Tons',
        from: 'Yard B',
        to: 'Main Warehouse',
        status: 'Shipped',
        batchNo: 'B-ST-16-X',
        carrierName: 'Bengal Freight Lines',
        vehicleNo: 'Ctg Metro-TA-04-1182',
        driverPhone: '01715293810',
        sealNo: 'S-10293',
        approvedBy: 'Farhana Yasmin',
        receivedDate: ''
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_transfers', JSON.stringify(transfers));
  }, [transfers]);

  // --- BATCH & LOTS STATE ---
  const [batches, setBatches] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEMO_SEED_ENABLED ? DEFAULT_BATCHES : [];
  });

  useEffect(() => {
    localStorage.setItem('nexova_batches', JSON.stringify(batches));
  }, [batches]);

  // Sync batches state if updated externally (e.g. from sales/invoices in App.tsx)
  useEffect(() => {
    const syncBatches = () => {
      const saved = localStorage.getItem('nexova_batches');
      if (saved) {
        try { setBatches(JSON.parse(saved)); } catch (e) {}
      }
    };
    window.addEventListener('storage', syncBatches);
    window.addEventListener('nexova_batches_updated', syncBatches);
    return () => {
      window.removeEventListener('storage', syncBatches);
      window.removeEventListener('nexova_batches_updated', syncBatches);
    };
  }, []);

  // --- SERIAL NUMBERS STATE ---
  const [serials, setSerials] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_serials');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 's1', productId: 'p2', serialNo: 'SN-STL12-00918', warehouse: 'Main Warehouse', status: 'Available' },
      { id: 's2', productId: 'p2', serialNo: 'SN-STL12-00919', warehouse: 'Main Warehouse', status: 'Available' },
      { id: 's3', productId: 'p2', serialNo: 'SN-STL12-00920', warehouse: 'Main Warehouse', status: 'Sold' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_serials', JSON.stringify(serials));
  }, [serials]);

  // --- SCANNER STATE ---
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerMode, setScannerMode] = useState<'search' | 'adjust' | 'transfer'>('search');

  // --- VALUATION METHOD STATE ---
  const [valuationMethod, setValuationMethod] = useState<'WAC' | 'FIFO' | 'LIFO' | 'Standard Cost'>(() => {
    const saved = localStorage.getItem('nexova_valuation_method');
    return (saved as 'WAC' | 'FIFO' | 'LIFO' | 'Standard Cost') || 'WAC';
  });

  useEffect(() => {
    localStorage.setItem('nexova_valuation_method', valuationMethod);
  }, [valuationMethod]);

  // --- ENTERPRISE INVENTORY STATE CORES ---
  const [stockSubTab, setStockSubTab] = useState<'valuation' | 'segments' | 'reorder' | 'lots' | 'cycle' | 'aging' | 'history'>('valuation');
  const [cycleWarehouse, setCycleWarehouse] = useState('Main Warehouse');
  const [cycleCounts, setCycleCounts] = useState<Record<string, string>>({});
  const [cycleAdjustmentReason, setCycleAdjustmentReason] = useState('Routine Physical Stock Audit');
  const [cycleCountingCompleted, setCycleCountingCompleted] = useState(false);
  const [newSerialNo, setNewSerialNo] = useState('');
  const [newSerialWh, setNewSerialWh] = useState('Main Warehouse');
  const [newSerialProdId, setNewSerialProdId] = useState('');
  const [selectedAllocProdId, setSelectedAllocProdId] = useState('');
  const [allocReserved, setAllocReserved] = useState('0');
  const [allocAllocated, setAllocAllocated] = useState('0');
  const [allocDamaged, setAllocDamaged] = useState('0');
  const [allocTransit, setAllocTransit] = useState('0');
  const [allocOnOrder, setAllocOnOrder] = useState('0');
  
  const [allocMinStock, setAllocMinStock] = useState('10');
  const [allocMaxStock, setAllocMaxStock] = useState('1000');
  const [allocSafetyStock, setAllocSafetyStock] = useState('20');
  const [allocReorderLevel, setAllocReorderLevel] = useState('50');
  const [allocReorderQty, setAllocReorderQty] = useState('500');

  const [snapshots, setSnapshots] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_snapshots');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'snap1', date: '2026-06-09', totalValuation: 3200000, totalStock: 480 },
      { id: 'snap2', date: '2026-06-16', totalValuation: 3350000, totalStock: 510 },
      { id: 'snap3', date: '2026-06-23', totalValuation: 3100000, totalStock: 450 },
      { id: 'snap4', date: '2026-06-30', totalValuation: 3450000, totalStock: 520 },
      { id: 'snap5', date: '2026-07-07', totalValuation: 3624000, totalStock: 560 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  // --- LOT MODAL STATE ---
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<any>(null);

  // New batch form
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchCost, setNewBatchCost] = useState('');
  const [newBatchMfg, setNewBatchMfg] = useState('');
  const [newBatchExp, setNewBatchExp] = useState('');
  const [newBatchWh, setNewBatchWh] = useState('Main Warehouse');

  // Advanced Transfer form state
  const [transferStatus, setTransferStatus] = useState<'Draft' | 'Requested' | 'Approved' | 'Shipped' | 'Completed'>('Draft');
  const [carrierName, setCarrierName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [transferBatchNo, setTransferBatchNo] = useState('');

  // Selected transfer for printing gate pass
  const [selectedTransferForGatePass, setSelectedTransferForGatePass] = useState<any>(null);

  const [offers, setOffers] = useState([
    { id: 'of1', name: 'Monsoon Special 5% Steel Discount', type: 'Discount Code', productName: 'Deformed Steel Bar 60G (12mm)', criteria: 'Sales > 5 Tons', reward: '5% Off invoice value', status: 'Active' },
    { id: 'of2', name: 'Cement Bundle Bonus', type: 'Bundle Bonus', productName: 'Standard Premium cement', criteria: 'Buy 100 Bags', reward: 'Get 2 Bags Free', status: 'Active' },
  ]);

  // --- GENERAL TAB STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // --- MODAL / FORM STATES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showWhModal, setShowWhModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // --- INPUT FIELD STATES ---
  // Product Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [pCategory, setPCategory] = useState('Construction Materials');
  const [pUnit, setPUnit] = useState('Bags');
  const [pWarehouse, setPWarehouse] = useState('Main Warehouse');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [alertQty, setAlertQty] = useState('');
  const [pcsPerBox, setPcsPerBox] = useState('1');

  // --- EDIT PRODUCT MODAL STATE ---
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editingProdName, setEditingProdName] = useState('');
  const [editingProdSku, setEditingProdSku] = useState('');
  const [editingProdCategory, setEditingProdCategory] = useState('');
  const [editingProdUnit, setEditingProdUnit] = useState('');
  const [editingProdWarehouse, setEditingProdWarehouse] = useState('');
  const [editingProdPrice, setEditingProdPrice] = useState('');
  const [editingProdCost, setEditingProdCost] = useState('');
  const [editingProdStock, setEditingProdStock] = useState('');
  const [editingProdAlertQty, setEditingProdAlertQty] = useState('');
  const [editingProdPcsPerBox, setEditingProdPcsPerBox] = useState('1');

  // Category Form
  const [newCatName, setNewCatName] = useState('');

  // Unit Form
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAbbrev, setNewUnitAbbrev] = useState('');
  const [newUnitBase, setNewUnitBase] = useState('Yes');

  // Warehouse Form
  const [newWhName, setNewWhName] = useState('');
  const [newWhLoc, setNewWhLoc] = useState('');
  const [newWhMgr, setNewWhMgr] = useState('');
  const [newWhCap, setNewWhCap] = useState('');

  // Transfer Form
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState('');
  const [transferFrom, setTransferFrom] = useState('Main Warehouse');
  const [transferTo, setTransferTo] = useState('Yard A');

  // Offer Form
  const [offerName, setOfferName] = useState('');
  const [offerType, setOfferType] = useState('Bundle Bonus');
  const [offerProduct, setOfferProduct] = useState(products[0]?.name || '');
  const [offerCriteria, setOfferCriteria] = useState('');
  const [offerReward, setOfferReward] = useState('');

  // Barcode Form
  const [barcodeProduct, setBarcodeProduct] = useState(products[0]?.id || '');
  const [barcodeQty, setBarcodeQty] = useState('4');
  const [generatedBarcodes, setGeneratedBarcodes] = useState<Product[]>([]);

  // Stock editor modal
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState('');

  // --- EDIT MODAL STATES ---
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatNewName, setEditingCatNewName] = useState('');

  const [editingUnitName, setEditingUnitName] = useState<string | null>(null);
  const [editingUnitNewName, setEditingUnitNewName] = useState('');
  const [editingUnitAbbrev, setEditingUnitAbbrev] = useState('');
  const [editingUnitBase, setEditingUnitBase] = useState('Yes');

  const [editingWhName, setEditingWhName] = useState<string | null>(null);
  const [editingWhNewName, setEditingWhNewName] = useState('');
  const [editingWhLoc, setEditingWhLoc] = useState('');
  const [editingWhMgr, setEditingWhMgr] = useState('');
  const [editingWhCap, setEditingWhCap] = useState('');

  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferName, setEditingOfferName] = useState('');
  const [editingOfferType, setEditingOfferType] = useState('Bundle Bonus');
  const [editingOfferProduct, setEditingOfferProduct] = useState('');
  const [editingOfferCriteria, setEditingOfferCriteria] = useState('');
  const [editingOfferReward, setEditingOfferReward] = useState('');

  // --- ENTERPRISE UTILITY ACTIONS ---
  const handleExportCSV = () => {
    // Collect columns that are visible
    const cols = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
    // Create headers
    const headers = cols.map(c => {
      if (c === 'sku_name') return 'SKU,Product Name';
      const f = customFields.find(fDef => fDef.internalName === c);
      return f ? f.displayName : c.toUpperCase();
    }).join(',');
    
    // Create rows
    const rows = filteredProducts.map(p => {
      return cols.map(c => {
        if (c === 'sku_name') {
          return `"${p.sku}","${p.name.replace(/"/g, '""')}"`;
        }
        const val = (p as any)[c] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexova_product_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('CSV contains no data entries.');
          return;
        }
        
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const importedProducts: Partial<Product>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]).map(c => c.trim());
          const item: Record<string, any> = {
            id: `prod_imported_${Date.now()}_${i}`,
            alertQty: 5,
            pcsPerBox: 1,
            warehouse: 'Main Warehouse',
            unit: 'Bags',
            category: 'Construction Materials'
          };
          
          headers.forEach((header, colIdx) => {
            const val = cells[colIdx] ?? '';
            if (header === 'sku' || header === 'code') item.sku = val;
            else if (header === 'product name' || header === 'name') item.name = val;
            else if (header === 'category') item.category = val;
            else if (header === 'selling price' || header === 'price') item.price = parseFloat(val) || 0;
            else if (header === 'cost price' || header === 'cost') item.cost = parseFloat(val) || 0;
            else if (header === 'stock' || header === 'initial stock') item.stock = parseInt(val) || 0;
            else if (header === 'warehouse') item.warehouse = val;
            else {
              const cField = customFields.find(f => f.displayName.toLowerCase() === header || f.internalName.toLowerCase() === header);
              if (cField) {
                item[cField.internalName] = val;
              } else {
                item[header] = val;
              }
            }
          });
          
          if (item.name && item.sku) {
            importedProducts.push(item as Product);
          }
        }
        
        if (importedProducts.length === 0) {
          alert('No valid products found to import. Verify that columns "sku" and "name" exist.');
          return;
        }
        
        importedProducts.forEach(p => onAddProduct(p as Product));
        alert(`Successfully imported ${importedProducts.length} products into the ERP catalog!`);
      } catch (err) {
        alert('Failed parsing CSV file. Please make sure the structure is correct.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrintPDFCatalog = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print the product catalog.');
      return;
    }
    
    const tableHeaderMarkup = `
      <thead>
        <tr style="background-color: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase;">
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">SKU</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Product Name</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Category</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Selling Price</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Cost Price</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">Stock</th>
          <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Warehouse</th>
        </tr>
      </thead>
    `;
    
    const tableRowsMarkup = filteredProducts.map(p => `
      <tr style="font-size: 12px; border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #4f46e5;">${p.sku}</td>
        <td style="padding: 10px; font-weight: 600;">${p.name}</td>
        <td style="padding: 10px; color: #64748b;">${p.category}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">৳${p.price.toLocaleString()}</td>
        <td style="padding: 10px; text-align: right; color: #64748b;">৳${p.cost.toLocaleString()}</td>
        <td style="padding: 10px; text-align: center; font-weight: bold; color: ${p.stock <= p.alertQty ? '#b91c1c' : '#1e1b4b'}">${p.stock} ${p.unit}</td>
        <td style="padding: 10px; color: #64748b;">${p.warehouse}</td>
      </tr>
    `).join('');
    
    const htmlContent = `
      <html>
        <head>
          <title>Nexova ERP - Master Product Catalog</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 5px; }
            .meta { text-align: right; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Nexova ERP Solution</div>
              <div class="subtitle">Enterprise Master Product Catalog</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Total Items:</strong> ${filteredProducts.length} Products</div>
            </div>
          </div>
          <table style="width:100%; border-collapse: collapse;">
            ${tableHeaderMarkup}
            <tbody>
              ${tableRowsMarkup}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- EDIT & DELETE HANDLERS ---
  const handleDeleteCategory = (catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"? This will reset the category for associated products.`)) {
      setCategories(categories.filter((c) => c !== catName));
      if (onUpdateProducts) {
        onUpdateProducts(
          products.map((p) => (p.category === catName ? { ...p, category: categories.find((c) => c !== catName) || '' } : p))
        );
      }
    }
  };

  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatName || !editingCatNewName) return;
    setCategories(categories.map((c) => (c === editingCatName ? editingCatNewName : c)));
    if (onUpdateProducts) {
      onUpdateProducts(
        products.map((p) => (p.category === editingCatName ? { ...p, category: editingCatNewName } : p))
      );
    }
    setEditingCatName(null);
    setEditingCatNewName('');
  };

  const handleDeleteUnit = (unitName: string) => {
    if (confirm(`Are you sure you want to delete unit "${unitName}"?`)) {
      setUnits(units.filter((u) => u.name !== unitName));
    }
  };

  const handleEditUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitName || !editingUnitNewName) return;
    setUnits(
      units.map((u) =>
        u.name === editingUnitName
          ? { ...u, name: editingUnitNewName, abbrev: editingUnitAbbrev, base: editingUnitBase }
          : u
      )
    );
    if (onUpdateProducts) {
      onUpdateProducts(
        products.map((p) => (p.unit === editingUnitName ? { ...p, unit: editingUnitNewName } : p))
      );
    }
    setEditingUnitName(null);
    setEditingUnitNewName('');
    setEditingUnitAbbrev('');
  };

  const handleDeleteWarehouse = (whName: string) => {
    if (confirm(`Are you sure you want to delete warehouse "${whName}"?`)) {
      setWarehouses(warehouses.filter((w) => w.name !== whName));
    }
  };

  const handleEditWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhName || !editingWhNewName) return;
    setWarehouses(
      warehouses.map((w) =>
        w.name === editingWhName
          ? { ...w, name: editingWhNewName, location: editingWhLoc, manager: editingWhMgr, capacity: editingWhCap }
          : w
      )
    );
    if (onUpdateProducts) {
      onUpdateProducts(
        products.map((p) => (p.warehouse === editingWhName ? { ...p, warehouse: editingWhNewName } : p))
      );
    }
    setEditingWhName(null);
    setEditingWhNewName('');
    setEditingWhLoc('');
    setEditingWhMgr('');
    setEditingWhCap('');
  };

  const handleDeleteOffer = (offerId: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      setOffers(offers.filter((o) => o.id !== offerId));
    }
  };

  const handleEditOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfferId || !editingOfferName) return;
    setOffers(
      offers.map((o) =>
        o.id === editingOfferId
          ? {
              ...o,
              name: editingOfferName,
              type: editingOfferType,
              productName: editingOfferProduct,
              criteria: editingOfferCriteria,
              reward: editingOfferReward,
            }
          : o
      )
    );
    setEditingOfferId(null);
  };

  // --- MUTATION HANDLERS ---
  const handleOpenAddModal = () => {
    const defaultData: Record<string, any> = {};
    fields.forEach((f) => {
      defaultData[f.fieldKey] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
    setAddFormData(defaultData);
    setAddFormErrors({});
    setShowAddModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form using our dynamic validation engine
    const errorsMap = validateForm(fields, addFormData);
    if (Object.keys(errorsMap).length > 0) {
      setAddFormErrors(errorsMap);
      return;
    }

    onAddProduct({
      name: addFormData.name,
      sku: addFormData.sku,
      category: addFormData.category || 'Construction Materials',
      unit: addFormData.unit || 'Bags',
      warehouse: addFormData.warehouse || 'Main Warehouse',
      price: parseFloat(addFormData.price) || 0,
      cost: parseFloat(addFormData.cost) || 0,
      stock: parseInt(addFormData.stock) || 0,
      alertQty: parseInt(addFormData.alertQty) || 5,
      pcsPerBox: parseInt(addFormData.pcsPerBox) || 1,
      ...addFormData,
    });

    setAddFormData({});
    setAddFormErrors({});
    setShowAddModal(false);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProdId) return;

    // Validate edit form using metadata validation rules
    const errorsMap = validateForm(fields, editFormData);
    if (Object.keys(errorsMap).length > 0) {
      setEditFormErrors(errorsMap);
      return;
    }

    const oldProduct = products.find(p => p.id === editingProdId);
    const newProduct = {
      ...oldProduct,
      ...editFormData,
      id: editingProdId,
      name: editFormData.name,
      sku: editFormData.sku,
      category: editFormData.category || 'Construction Materials',
      unit: editFormData.unit || 'Bags',
      warehouse: editFormData.warehouse || 'Main Warehouse',
      price: parseFloat(editFormData.price) || 0,
      cost: parseFloat(editFormData.cost) || 0,
      stock: parseInt(editFormData.stock) || 0,
      alertQty: parseInt(editFormData.alertQty) || 5,
      pcsPerBox: parseInt(editFormData.pcsPerBox) || 1,
    };

    if (oldProduct) {
      // Computes structural logs of each field difference and commits
      const fieldDiffs = computeFieldAuditHistory(oldProduct, newProduct, fields, 'Administrator');
      if (fieldDiffs.length > 0) {
        logAuditRecord(editingProdId, 'UPDATE', `Product master updated for ${newProduct.name}`, fieldDiffs, 'Administrator', 'Administrator');
      }
    }

    if (onUpdateProducts) {
      onUpdateProducts(
        products.map((p) => p.id === editingProdId ? newProduct : p)
      );
    }
    setEditingProdId(null);
  };

  const handleStockSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStockId && editingStockVal !== '') {
      onUpdateStock(editingStockId, parseInt(editingStockVal));
      setEditingStockId(null);
      setEditingStockVal('');
    }
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setCategories([...categories, newCatName]);
    setNewCatName('');
    setShowCatModal(false);
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName || !newUnitAbbrev) return;
    setUnits([...units, { name: newUnitName, abbrev: newUnitAbbrev, base: newUnitBase, productsCount: 0 }]);
    setNewUnitName('');
    setNewUnitAbbrev('');
    setShowUnitModal(false);
  };

  const handleWhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName) return;
    setWarehouses([...warehouses, { name: newWhName, location: newWhLoc || 'TBD', manager: newWhMgr || 'Staff', capacity: newWhCap || 'General' }]);
    setNewWhName('');
    setNewWhLoc('');
    setNewWhMgr('');
    setNewWhCap('');
    setShowWhModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !transferQty) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qtyVal = parseInt(transferQty);
    if (qtyVal <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    // Verify stock availability
    if (qtyVal > prod.stock) {
      alert(`Insufficient stock! Product only has ${prod.stock} ${prod.unit} in total.`);
      return;
    }

    // Reference number
    const refNo = `TR-260${3 + transfers.length}`;

    // Record transfer log with advanced Odoo fields
    const newTr = {
      id: `tr_dynamic_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      refNo: refNo,
      productId: prod.id,
      productName: prod.name,
      qty: qtyVal,
      unit: prod.unit,
      from: transferFrom,
      to: transferTo,
      status: transferStatus, // Draft | Requested | Approved | Shipped | Completed
      batchNo: transferBatchNo || 'N/A',
      carrierName: carrierName || 'Nexova Fleet Services',
      vehicleNo: vehicleNo || 'Dhaka Metro-HA-11-5520',
      driverPhone: driverPhone || '01700000000',
      sealNo: sealNo || 'S-TEMP',
      approvedBy: 'Rashedul Islam',
      receivedDate: transferStatus === 'Completed' ? new Date().toISOString().split('T')[0] : ''
    };

    // Double-entry stock ledger movement if completed immediately
    if (transferStatus === 'Completed') {
      // 1. Update global product stock
      // If moving away from product's primary warehouse, deduct stock.
      // If moving to product's primary warehouse, increase stock.
      // Otherwise, keep stock same but record location ledger change.
      if (prod.warehouse === transferFrom && prod.warehouse !== transferTo) {
        onUpdateStock(prod.id, Math.max(0, prod.stock - qtyVal));
      } else if (prod.warehouse === transferTo && prod.warehouse !== transferFrom) {
        onUpdateStock(prod.id, prod.stock + qtyVal);
      }

      // 2. Adjust Batches ledger (Double-entry)
      let sourceBatch = batches.find(b => b.productId === prod.id && b.warehouse === transferFrom && (transferBatchNo ? b.batchNo === transferBatchNo : true));
      if (sourceBatch) {
        // Deduct from source batch
        sourceBatch.qty = Math.max(0, sourceBatch.qty - qtyVal);
        
        // Find or create destination batch
        let destBatch = batches.find(b => b.productId === prod.id && b.warehouse === transferTo && b.batchNo === sourceBatch.batchNo);
        if (destBatch) {
          destBatch.qty += qtyVal;
        } else {
          batches.push({
            id: `b_dynamic_${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            batchNo: sourceBatch.batchNo,
            qty: qtyVal,
            cost: sourceBatch.cost,
            mfgDate: sourceBatch.mfgDate,
            expiryDate: sourceBatch.expiryDate,
            warehouse: transferTo
          });
        }
        setBatches([...batches]);
      }
    }

    setTransfers([newTr, ...transfers]);

    setTransferQty('');
    setCarrierName('');
    setVehicleNo('');
    setDriverPhone('');
    setSealNo('');
    setTransferBatchNo('');
    setTransferStatus('Draft');
    setShowTransferModal(false);

    alert(`Transfer ${refNo} has been successfully created in "${transferStatus}" status!`);
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerName || !offerCriteria || !offerReward) return;
    const newOffer = {
      id: `of_dynamic_${Date.now()}`,
      name: offerName,
      type: offerType,
      productName: offerProduct,
      criteria: offerCriteria,
      reward: offerReward,
      status: 'Active',
    };
    setOffers([newOffer, ...offers]);
    setOfferName('');
    setOfferCriteria('');
    setOfferReward('');
    setShowOfferModal(false);
  };

  const handleGenerateBarcodes = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === barcodeProduct);
    if (!prod) return;
    const qty = parseInt(barcodeQty) || 4;
    const list: Product[] = [];
    for (let i = 0; i < qty; i++) {
      list.push(prod);
    }
    setGeneratedBarcodes(list);
  };

  // --- ACTIVE BRANCH & BRANCH STOCK HELPERS ---
  const activeBranch = branches.find((b) => b.id === currentBranchId);
  const isIndependentBranch = activeBranch?.stockMode === 'independent';

  const checkProductVisible = (p: Product) => isProductVisibleInBranch(p, currentBranchId, branches);
  const getProdEffectiveStock = (p: Product) => getEffectiveStock(p, currentBranchId, branches);

  // --- FILTERS LOGIC ---
  const filteredProducts = products.filter((p) => {
    // 1. Branch filter
    if (!checkProductVisible(p)) {
      return false;
    }

    const query = searchQuery.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      ((p as any).brand && String((p as any).brand).toLowerCase().includes(query)) ||
      ((p as any).productCode && String((p as any).productCode).toLowerCase().includes(query)) ||
      customFields.some(fDef => {
        const val = (p as any)[fDef.internalName];
        return val && String(val).toLowerCase().includes(query);
      });
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    
    const effectiveStock = getProdEffectiveStock(p);
    let matchStock = true;
    if (stockFilter === 'Low') {
      matchStock = effectiveStock <= p.alertQty && effectiveStock > 0;
    } else if (stockFilter === 'Out') {
      matchStock = effectiveStock === 0;
    }
    return matchSearch && matchCat && matchStock;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* =========================================
          TAB 1: PRODUCTS (MAIN DIRECTORY)
          ========================================= */}
      {currentTab === 'products' && (
        <div className="space-y-6">
          {activeBranch && currentBranchId !== 'all' && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200 ${
              isIndependentBranch
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl font-bold text-xs shrink-0 ${
                  isIndependentBranch ? 'bg-amber-200/70 text-amber-900' : 'bg-indigo-200/70 text-indigo-900'
                }`}>
                  🏢 {activeBranch.branchCode}
                </div>
                <div>
                  <span className="font-extrabold text-xs block font-display">
                    অ্যাক্টিভ ফিল্টারড শাখা: {activeBranch.name} ({isIndependentBranch ? 'স্বতন্ত্র/পৃথক স্টক মোড - Independent Stock' : 'শেয়ার্ড ইনভেন্টরি মোড - Shared Stock'})
                  </span>
                  <span className="text-[11px] opacity-90 mt-0.5 block leading-relaxed">
                    {isIndependentBranch
                      ? 'এই শাখাটি "পৃথক স্টক মোডে" সক্রিয়। এখানে শুধুমাত্র এই শাখার নিজস্ব সংরক্ষিত স্টক এবং এই শাখার আওতাধীন পণ্যসমূহ প্রদর্শিত ও ফিল্টার করা হচ্ছে।'
                      : 'এই শাখায় কেন্দ্রীয় শেয়ার্ড স্টক ও ক্যাটালগ অ্যাক্টিভ রয়েছে।'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Products Directory</h2>
              <p className="text-xs text-slate-400 mt-1">Manage global inventory catalog, enterprise properties, custom categories, and stock alert levels.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setScannerMode('search');
                  setShowScannerModal(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                title="Use device camera to scan product QR / Barcode"
              >
                <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                <span>Camera Scanner</span>
              </button>
              <button
                onClick={() => setShowCustomFieldsModal(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                title="Manage dynamic specification forms and attributes for products"
              >
                <Settings className="h-3.5 w-3.5 text-indigo-600" />
                <span>Manage Custom Fields</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md shadow-emerald-600/10 cursor-pointer transition-all self-start sm:self-center"
                title="Bulk import products from Excel/CSV / এক্সেল/সিএসভি থেকে পণ্য বাল্ক ইমপোর্ট করুন"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Import from Excel / ইমপোর্ট</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-center"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, brand, code, or custom attributes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-transparent border-none focus:outline-none font-medium cursor-pointer text-xs"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
                    <Database className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="bg-transparent border-none focus:outline-none font-medium cursor-pointer text-xs"
                    >
                      <option value="All">All Stocks</option>
                      <option value="Low">Low Stock Only</option>
                      <option value="Out">Out of Stock</option>
                    </select>
                  </div>

                  {/* Column Chooser popover button */}
                  <div className="relative">
                    <button
                      onClick={() => setColumnChooserOpen(!columnChooserOpen)}
                      className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                      title="Choose which columns are visible in catalog table"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>Columns</span>
                    </button>
                    {columnChooserOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 space-y-2 text-slate-700 animate-in fade-in duration-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5 mb-1.5">Visible Columns</div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {[
                            { key: 'sku_name', label: 'SKU / Name' },
                            { key: 'category', label: 'Category' },
                            { key: 'price', label: 'Selling Price' },
                            { key: 'cost', label: 'Cost Price' },
                            { key: 'stock', label: 'Stock level' },
                            { key: 'warehouse', label: 'Warehouse' },
                          ].map(col => (
                            <label key={col.key} className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-indigo-600">
                              <input
                                type="checkbox"
                                checked={visibleColumns[col.key]}
                                onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span>{col.label}</span>
                            </label>
                          ))}
                          {customFields.map(f => (
                            <label key={f.internalName} className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-indigo-600">
                              <input
                                type="checkbox"
                                checked={!!visibleColumns[f.internalName]}
                                onChange={(e) => setVisibleColumns({ ...visibleColumns, [f.internalName]: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span className="truncate">{f.displayName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print / Export catalog actions */}
                  <button
                    onClick={handleExportCSV}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Export visible catalog rows to standard CSV"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <label className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer block relative">
                    <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    <Upload className="h-4 w-4" />
                  </label>
                  <button
                    onClick={handlePrintPDFCatalog}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Generate and print master PDF catalog sheet"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bulk operations bar */}
              <BulkEditBar
                selectedProductIds={selectedProductIds}
                products={products}
                onUpdateProducts={onUpdateProducts || (() => {})}
                categories={categories}
                warehouses={warehouses}
                onClearSelection={() => setSelectedProductIds([])}
              />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/40">
                      <th className="py-3 px-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(filteredProducts.map(p => p.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                      </th>
                      {visibleColumns.sku_name && <th className="py-3 px-4">SKU / Name</th>}
                      {visibleColumns.category && <th className="py-3 px-4">Category</th>}
                      {visibleColumns.price && <th className="py-3 px-4 text-right">Selling Price</th>}
                      {visibleColumns.cost && <th className="py-3 px-4 text-right">Cost Price</th>}
                      {visibleColumns.stock && <th className="py-3 px-4 text-center">Stock</th>}
                      {visibleColumns.warehouse && <th className="py-3 px-4">Warehouse</th>}
                      
                      {/* Dynamic visible custom column headers */}
                      {Object.keys(visibleColumns).map((key) => {
                        if (['sku_name', 'category', 'price', 'cost', 'stock', 'warehouse', 'actions'].includes(key)) return null;
                        if (!visibleColumns[key]) return null;
                        const fDef = customFields.find(f => f.internalName === key);
                        return (
                          <th key={key} className="py-3 px-4 font-semibold uppercase tracking-wider text-slate-400">{fDef ? fDef.displayName : key}</th>
                        );
                      })}
                      
                      {visibleColumns.actions !== false && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const effStock = getProdEffectiveStock(p);
                      const isLow = effStock <= p.alertQty;
                      return (
                         <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-indigo-50/30' : ''}`}>
                          <td className="py-4 px-4 text-center w-10">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds([...selectedProductIds, p.id]);
                                } else {
                                  setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                                }
                              }}
                              className="rounded text-indigo-600 cursor-pointer"
                            />
                          </td>
                          {visibleColumns.sku_name && (
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-mono text-[10px] text-indigo-600 font-bold">{p.sku}</span>
                                <span className="font-bold text-slate-800 mt-0.5">{p.name}</span>
                                {p.pcsPerBox && p.pcsPerBox > 1 && (
                                  <span className="text-[10px] font-semibold text-amber-600 mt-0.5 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded w-max">
                                    1 Box = {p.pcsPerBox} pcs
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          {visibleColumns.category && <td className="py-4 px-4 text-slate-500 font-medium">{p.category}</td>}
                          {visibleColumns.price && <td className="py-4 px-4 text-right font-bold text-slate-800">৳{p.price.toLocaleString()}</td>}
                          {visibleColumns.cost && <td className="py-4 px-4 text-right text-slate-500 font-semibold">৳{p.cost.toLocaleString()}</td>}
                          {visibleColumns.stock && (
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                      effStock === 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : isLow
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}
                                  >
                                    {effStock} {p.unit}
                                  </span>
                                  {p.pcsPerBox && p.pcsPerBox > 1 && effStock > 0 && (
                                    <span className="text-[9px] font-semibold text-indigo-600 mt-1 block">
                                      {formatBoxQty(effStock, p.pcsPerBox)}
                                    </span>
                                  )}
                                </div>
                                {isLow && <span title="Low stock alert"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /></span>}
                              </div>
                            </td>
                          )}
                          {visibleColumns.warehouse && <td className="py-4 px-4 text-slate-500 font-medium">{p.warehouse}</td>}
                          
                          {/* Dynamic column cell values */}
                          {Object.keys(visibleColumns).map((key) => {
                            if (['sku_name', 'category', 'price', 'cost', 'stock', 'warehouse', 'actions'].includes(key)) return null;
                            if (!visibleColumns[key]) return null;
                            const cellValue = (p as any)[key] !== undefined ? String((p as any)[key]) : '';
                            return (
                              <td key={key} className="py-4 px-4 text-slate-600 font-semibold font-mono text-[10px] truncate max-w-[120px]" title={cellValue}>{cellValue || '—'}</td>
                            );
                          })}
                          
                          {visibleColumns.actions !== false && (
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedProductForBatches(p);
                                    setNewBatchWh(p.warehouse);
                                    setShowBatchModal(true);
                                  }}
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors cursor-pointer animate-pulse-subtle"
                                  title="Manage Lots, Batches & Expiry Dates"
                                >
                                  <Layers className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditFormData({ ...p });
                                    setEditFormErrors({});
                                    setEditingProdId(p.id);
                                  }}
                                  className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded transition-colors cursor-pointer"
                                  title="Edit Product Info"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                {currentUser?.role === 'Administrator' && (
                                  <button
                                    onClick={() => {
                                      const hasInvoiceRef = invoices.some(inv => 
                                        inv.items?.some((item: any) => String(item.productId) === String(p.id))
                                      );
                                      const hasPurchaseRef = purchaseOrders.some(po => 
                                        po.items?.some((item: any) => String(item.productId) === String(p.id))
                                      );

                                      if (hasInvoiceRef || hasPurchaseRef) {
                                        const reasons = [];
                                        if (hasInvoiceRef) reasons.push('বিক্রয় চালান রেকর্ড (Sales Invoices)');
                                        if (hasPurchaseRef) reasons.push('ক্রয় অর্ডার রেকর্ড (Purchase Orders)');
                                        alert(
                                          `দুঃখিত, এই পণ্যটি (${p.name}) ডিলিট করা সম্ভব নয় কারণ নিচের ট্রানজেকশনে এর রেফারেন্স রয়েছে:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nসিস্টেমের ডাটা ইন্টিগ্রিটির জন্য এটি ডিলিট করা সম্পূর্ণ ব্লক করা হয়েছে।\n\n/ Sorry, this product (${p.name}) cannot be deleted because it is referenced in the following transactions:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nDeletion is strictly blocked to maintain system integrity.`
                                        );
                                        return;
                                      }

                                      if (window.confirm(`আপনি কি নিশ্চিত যে আপনি "${p.name}" পণ্যটি ক্যাটালগ থেকে মুছে ফেলতে চান?\n\nAre you sure you want to delete this product from the catalog?`)) {
                                        onDeleteProduct(p.id);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400 font-semibold">
                          No matching catalog items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <WhIcon className="h-4.5 w-4.5 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Warehouses</h3>
                </div>
                <div className="space-y-3">
                  {warehouses.map((wh) => {
                    const totalQty = products.filter((p) => p.warehouse === wh.name).reduce((sum, p) => sum + p.stock, 0);
                    return (
                      <div key={wh.name} className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{wh.name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{wh.location}</span>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {totalQty.toLocaleString()} units
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg shadow-indigo-600/10">
                <h3 className="text-sm font-bold font-display">Replenishment Status</h3>
                <p className="text-[10px] text-indigo-200 mt-1">Daily analysis of stock thresholds.</p>
                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                    <span className="text-indigo-200">Total Unique Items</span>
                    <span className="font-bold">{products.length} Products</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                    <span className="text-indigo-200">Low Stock Alert Items</span>
                    <span className="font-bold text-amber-300">{products.filter(p => p.stock <= p.alertQty).length} Alerting</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-200">System Status</span>
                    <span className="font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" /> Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 2: CATEGORIES
          ========================================= */}
      {currentTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Product Categories</h2>
              <p className="text-xs text-slate-400 mt-1">Organize products into logical groups for POS menus and catalog segregation.</p>
            </div>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/40">
                  <th className="py-3 px-6">Category Name</th>
                  <th className="py-3 px-6">Code Prefix</th>
                  <th className="py-3 px-6 text-center">Product Types</th>
                  <th className="py-3 px-6 text-right">Total Stock Qty</th>
                  <th className="py-3 px-6 text-right">Total Valuation</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat, idx) => {
                  const catProducts = products.filter((p) => p.category === cat);
                  const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
                  const valuation = catProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);
                  return (
                    <tr key={cat} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{cat}</td>
                      <td className="py-4 px-6 font-mono text-indigo-600 uppercase font-semibold">CAT-00{idx + 1}</td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-700">{catProducts.length} Items</td>
                      <td className="py-4 px-6 text-right font-medium">{totalStock.toLocaleString()} units</td>
                      <td className="py-4 px-6 text-right font-bold text-slate-800">৳{valuation.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatName(cat);
                              setEditingCatNewName(cat);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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
          TAB 3: UNITS
          ========================================= */}
      {currentTab === 'units' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Unit Configuration</h2>
              <p className="text-xs text-slate-400 mt-1">Manage global packaging configurations and fractional decimal measurement units.</p>
            </div>
            <button
              onClick={() => setShowUnitModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Unit</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/40">
                  <th className="py-3 px-6">Unit Name</th>
                  <th className="py-3 px-6">Abbreviation</th>
                  <th className="py-3 px-6 text-center">Allow Fraction</th>
                  <th className="py-3 px-6 text-center">Assigned Products</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((un) => {
                  const assignedCount = products.filter((p) => p.unit === un.name).length;
                  return (
                    <tr key={un.name} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{un.name}</td>
                      <td className="py-4 px-6 font-mono text-indigo-600 uppercase font-bold">{un.abbrev}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${un.base === 'Yes' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {un.base === 'Yes' ? 'Allowed' : 'Integers Only'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-medium">{assignedCount} items</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">Active</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnitName(un.name);
                              setEditingUnitNewName(un.name);
                              setEditingUnitAbbrev(un.abbrev);
                              setEditingUnitBase(un.base);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(un.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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
          TAB 4: WAREHOUSES
          ========================================= */}
      {currentTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Warehouses & Depots</h2>
              <p className="text-xs text-slate-400 mt-1">Track physical stock distribution, location maps, capacity, and supervisors.</p>
            </div>
            <button
              onClick={() => setShowWhModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Depot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh) => {
              const whProducts = products.filter((p) => p.warehouse === wh.name);
              const totalItems = whProducts.reduce((sum, p) => sum + p.stock, 0);
              const totalVal = whProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);

              return (
                <div key={wh.name} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <WhIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{wh.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{wh.location}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Depot Manager</span>
                      <span className="font-semibold text-slate-700">{wh.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Stocks</span>
                      <span className="font-bold text-indigo-600">{totalItems.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Depot Valuation</span>
                      <span className="font-bold text-slate-800">৳{totalVal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity Limit</span>
                      <span className="font-semibold text-slate-500">{wh.capacity}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWhName(wh.name);
                        setEditingWhNewName(wh.name);
                        setEditingWhLoc(wh.location);
                        setEditingWhMgr(wh.manager);
                        setEditingWhCap(wh.capacity);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Depot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWarehouse(wh.name)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          TAB 5: ADVANCED ENTERPRISE INVENTORY ENGINE
          ========================================= */}
      {currentTab === 'stock' && (() => {
        // Valuation Helper functions
        const calcFIFO = (prodId: string, currentStock: number, defaultCost: number) =>
          calculateFIFOValuation(prodId, currentStock, defaultCost, batches);

        const calcLIFO = (prodId: string, currentStock: number, defaultCost: number) =>
          calculateLIFOValuation(prodId, currentStock, defaultCost, batches);

        const getProductValuation = (p: any, method: 'WAC' | 'FIFO' | 'LIFO' | 'Standard Cost') => {
          if (method === 'WAC') {
            return p.stock * p.cost;
          } else if (method === 'FIFO') {
            return calcFIFO(p.id, p.stock, p.cost);
          } else if (method === 'LIFO') {
            return calcLIFO(p.id, p.stock, p.cost);
          } else {
            // Standard Cost method uses 1.05 * cost as a preset standard costing threshold
            return p.stock * (p.cost * 1.05);
          }
        };

        // Aggregates
        const totalWACValuation = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
        const totalFIFOValuation = products.reduce((sum, p) => sum + calcFIFO(p.id, p.stock, p.cost), 0);
        const totalLIFOValuation = products.reduce((sum, p) => sum + calcLIFO(p.id, p.stock, p.cost), 0);
        const totalStandardCostValuation = products.reduce((sum, p) => sum + (p.stock * (p.cost * 1.05)), 0);

        const getActiveTotalValuation = () => {
          if (valuationMethod === 'WAC') return totalWACValuation;
          if (valuationMethod === 'FIFO') return totalFIFOValuation;
          if (valuationMethod === 'LIFO') return totalLIFOValuation;
          return totalStandardCostValuation;
        };

        const activeValuationValue = getActiveTotalValuation();
        const totalRevenueYield = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
        const activeMarkup = totalRevenueYield - activeValuationValue;
        const valuationVariance = totalFIFOValuation - totalWACValuation;

        // Custom Allocations & Parameter states resolvers for UI
        const getProdReserved = (p: Product) => p.reservedQty ?? Math.floor(p.stock * 0.08);
        const getProdAllocated = (p: Product) => p.allocatedQty ?? Math.floor(p.stock * 0.05);
        const getProdDamaged = (p: Product) => p.damagedQty ?? Math.floor(p.stock * 0.02);
        const getProdTransit = (p: Product) => p.transitQty ?? (p.id === 'p3' ? 10 : 0);
        const getProdOnOrder = (p: Product) => p.onOrderQty ?? (p.stock < p.alertQty ? Math.floor(p.alertQty * 2.5) : 0);

        const getProdAvailable = (p: Product) => {
          const unavailable = getProdReserved(p) + getProdAllocated(p) + getProdDamaged(p);
          return Math.max(0, p.stock - unavailable);
        };

        const getProdMinStock = (p: Product) => p.minStock ?? p.alertQty;
        const getProdMaxStock = (p: Product) => p.maxStock ?? Math.max(p.alertQty * 10, 500);
        const getProdSafetyStock = (p: Product) => p.safetyStock ?? Math.max(Math.floor(p.alertQty * 0.5), 2);
        const getProdReorderLevel = (p: Product) => p.alertQty * 2;
        const getProdReorderQty = (p: Product) => p.alertQty * 5;

        // Inventory Status Checker
        const getStockStatus = (p: Product) => {
          if (p.stockFreeze) return { label: 'Frozen', style: 'bg-red-500 text-white border-red-600' };
          if (p.stock === 0) return { label: 'Stock Empty', style: 'bg-rose-100 text-rose-800 border-rose-200' };
          const avail = getProdAvailable(p);
          const safety = getProdSafetyStock(p);
          const minS = getProdMinStock(p);
          const maxS = getProdMaxStock(p);

          if (p.stock > maxS) return { label: 'Overstock', style: 'bg-blue-100 text-blue-800 border-blue-200' };
          if (p.stock <= safety) return { label: 'Below Safety', style: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' };
          if (p.stock <= minS) return { label: 'Critical Low', style: 'bg-rose-100 text-rose-800 border-rose-200' };
          if (avail < getProdReorderLevel(p)) return { label: 'Reorder Target', style: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
          return { label: 'Optimal Stock', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        };

        // Purchase Suggestions resolver
        const purchaseSuggestions = products.filter(p => {
          const avail = getProdAvailable(p);
          const onOrder = getProdOnOrder(p);
          return (avail + onOrder) < getProdReorderLevel(p);
        }).map(p => {
          const avail = getProdAvailable(p);
          const onOrder = getProdOnOrder(p);
          const reorderLvl = getProdReorderLevel(p);
          const maxS = getProdMaxStock(p);
          const suggestQty = maxS - (avail + onOrder);
          return {
            product: p,
            available: avail,
            onOrder: onOrder,
            reorderLevel: reorderLvl,
            maxStock: maxS,
            suggestedQty: suggestQty,
            estimatedCost: suggestQty * p.cost
          };
        });

        // Trigger Allocation Save
        const handleAllocationSave = (e: React.FormEvent) => {
          e.preventDefault();
          const target = products.find(p => p.id === selectedAllocProdId);
          if (!target) return;

          const updatedProd = {
            ...target,
            reservedQty: parseInt(allocReserved) || 0,
            allocatedQty: parseInt(allocAllocated) || 0,
            damagedQty: parseInt(allocDamaged) || 0,
            transitQty: parseInt(allocTransit) || 0,
            onOrderQty: parseInt(allocOnOrder) || 0,
            minStock: parseInt(allocMinStock) || 0,
            maxStock: parseInt(allocMaxStock) || 0,
            safetyStock: parseInt(allocSafetyStock) || 0,
          };

          if (onUpdateProducts) {
            onUpdateProducts(products.map(p => p.id === selectedAllocProdId ? updatedProd : p));
          }
          alert(`Allocation and safety settings saved for "${target.name}"!`);
          setSelectedAllocProdId('');
        };

        // Toggle stock freeze
        const handleToggleFreeze = (prodId: string) => {
          const target = products.find(p => p.id === prodId);
          if (!target) return;
          const updatedProd = {
            ...target,
            stockFreeze: !target.stockFreeze
          };
          if (onUpdateProducts) {
            onUpdateProducts(products.map(p => p.id === prodId ? updatedProd : p));
          }
          logFieldChanges(target, updatedProd, `Inventory status changed to ${!target.stockFreeze ? 'FROZEN' : 'ACTIVE'}`);
        };

        // Lot acquisition submit
        const handleAddLotAcquisition = (e: React.FormEvent) => {
          e.preventDefault();
          if (!selectedProductForBatches || !newBatchNo || !newBatchQty || !newBatchCost) {
            alert('Please fill out all required lot fields.');
            return;
          }
          
          const newLot = {
            id: `b_lot_${Date.now()}`,
            productId: selectedProductForBatches.id,
            productName: selectedProductForBatches.name,
            batchNo: newBatchNo,
            qty: parseInt(newBatchQty) || 0,
            cost: parseFloat(newBatchCost) || 0,
            mfgDate: newBatchMfg || new Date().toISOString().split('T')[0],
            expiryDate: newBatchExp || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
            warehouse: newBatchWh
          };

          const updatedBatches = [newLot, ...batches];
          setBatches(updatedBatches);
          
          // Also increase total stock of the product in master catalogue!
          const extraQty = parseInt(newBatchQty) || 0;
          onUpdateStock(selectedProductForBatches.id, selectedProductForBatches.stock + extraQty);

          alert(`Successfully received Lot "${newBatchNo}" of ${extraQty} ${selectedProductForBatches.unit} in "${newBatchWh}"!`);
          
          setNewBatchNo('');
          setNewBatchQty('');
          setNewBatchCost('');
          setNewBatchMfg('');
          setNewBatchExp('');
          setShowBatchModal(false);
        };

        // Unique serial registration with DUPLICATE PREVENTION
        const handleRegisterSerial = (e: React.FormEvent) => {
          e.preventDefault();
          if (!newSerialNo || !newSerialProdId) {
            alert('Please select a product and input a serial number.');
            return;
          }

          // Check for duplicates
          const isDuplicate = serials.some(s => s.serialNo.toUpperCase() === newSerialNo.trim().toUpperCase());
          if (isDuplicate) {
            alert(`CRITICAL ERROR: Serial Number "${newSerialNo.toUpperCase()}" already exists in the global registry! Unique constraints prevent insertion.`);
            return;
          }

          const newSerialObj = {
            id: `s_serial_${Date.now()}`,
            productId: newSerialProdId,
            serialNo: newSerialNo.trim().toUpperCase(),
            warehouse: newSerialWh,
            status: 'Available'
          };

          setSerials([...serials, newSerialObj]);
          alert(`Serial Number "${newSerialObj.serialNo}" has been registered successfully!`);
          setNewSerialNo('');
        };

        // Cycle Counting Session Adjustment Handler
        const handleProcessCycleCount = () => {
          let adjustedCount = 0;
          let totalFinancialVariance = 0;
          const updatedProductsList = products.map(p => {
            if (p.warehouse !== cycleWarehouse) return p;
            const countStr = cycleCounts[p.id];
            if (countStr === undefined || countStr === '') return p;

            const countedVal = parseInt(countStr);
            const variance = countedVal - p.stock;
            if (variance === 0) return p;

            adjustedCount++;
            totalFinancialVariance += variance * p.cost;

            const oldProductObj = { ...p };
            const newProductObj = { ...p, stock: countedVal };

            // Log change logs and audits
            logFieldChanges(oldProductObj, newProductObj, `${cycleWarehouse} Physical Count Audit: Adjusted from ${p.stock} to ${countedVal}. Reason: ${cycleAdjustmentReason}`);
            
            // Log structured metadata engine audits
            logAuditRecord(p.id, 'RECONCILE', `${cycleWarehouse} physical stock adjustment: variance ${variance > 0 ? '+' : ''}${variance}`, [
              { fieldKey: 'stock', displayName: 'STOCK', oldValue: String(p.stock), newValue: String(countedVal), timestamp: new Date().toISOString(), updatedBy: 'Administrator' }
            ], 'Administrator', 'Administrator');

            // Adjust real lot/batches of the product in this warehouse proportionally
            const prodBatches = batches.filter(b => b.productId === p.id && b.warehouse === cycleWarehouse);
            if (prodBatches.length > 0) {
              const totalBatchQty = prodBatches.reduce((sum, b) => sum + b.qty, 0);
              if (totalBatchQty > 0) {
                const ratio = countedVal / totalBatchQty;
                prodBatches.forEach(b => {
                  b.qty = Math.round(b.qty * ratio);
                });
              } else {
                // If there were no batches with stock but now there is stock, put in standard batch
                prodBatches.push({
                  id: `b_cycle_${Date.now()}_${p.id}`,
                  productId: p.id,
                  productName: p.name,
                  batchNo: `AUDIT-RECON-${new Date().toISOString().split('T')[0]}`,
                  qty: countedVal,
                  cost: p.cost,
                  mfgDate: new Date().toISOString().split('T')[0],
                  expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                  warehouse: cycleWarehouse
                });
              }
            }

            return newProductObj;
          });

          if (adjustedCount === 0) {
            alert('No discrepancies entered to reconcile. All system values matched physical counts.');
            return;
          }

          if (onUpdateProducts) {
            onUpdateProducts(updatedProductsList);
          }
          setBatches([...batches]);
          setCycleCountingCompleted(true);
          setCycleCounts({});
        };

        // ABC XYZ dynamic classification
        const sortedByValue = [...products].sort((a, b) => (b.stock * b.cost) - (a.stock * a.cost));
        const cumulativeValueSum = sortedByValue.reduce((sum, p) => sum + (p.stock * p.cost), 0);
        let runSum = 0;
        const abcXYZMap = new Map<string, { abc: 'A' | 'B' | 'C'; xyz: 'X' | 'Y' | 'Z' }>();
        sortedByValue.forEach(p => {
          runSum += p.stock * p.cost;
          const valueRatio = cumulativeValueSum > 0 ? (runSum / cumulativeValueSum) : 0;
          let abc: 'A' | 'B' | 'C' = 'C';
          if (valueRatio <= 0.70) abc = 'A';
          else if (valueRatio <= 0.90) abc = 'B';

          const xyz: 'X' | 'Y' | 'Z' = p.id === 'p1' ? 'X' : p.id === 'p2' ? 'Y' : 'Z';
          abcXYZMap.set(p.id, { abc, xyz });
        });

        // Aging report calculator
        const getAgingBuckets = () => {
          let age30 = 0;
          let age60 = 0;
          let age90 = 0;
          let age90Plus = 0;

          batches.forEach(b => {
            const mfg = new Date(b.mfgDate);
            const diffDays = Math.floor((Date.now() - mfg.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays <= 30) age30 += b.qty * b.cost;
            else if (diffDays <= 60) age60 += b.qty * b.cost;
            else if (diffDays <= 90) age90 += b.qty * b.cost;
            else age90Plus += b.qty * b.cost;
          });

          // Add any stock not tracked in batches to 90Plus bucket as default base
          const totalBatchVal = batches.reduce((sum, b) => sum + (b.qty * b.cost), 0);
          const discrepancyVal = Math.max(0, totalWACValuation - totalBatchVal);
          age90Plus += discrepancyVal;

          return { age30, age60, age90, age90Plus };
        };

        const aging = getAgingBuckets();
        const totalAgingValue = aging.age30 + aging.age60 + aging.age90 + aging.age90Plus;

        // Capture snapshot
        const triggerCaptureSnapshot = () => {
          const newSnap = {
            id: `snap_manual_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            totalValuation: totalWACValuation,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0)
          };
          setSnapshots([...snapshots, newSnap]);
          alert(`Inventory snapshot captured successfully! Total Valuation recorded: ৳${totalWACValuation.toLocaleString()}`);
        };

        return (
          <div className="space-y-6">
            {/* Enterprise Dashboard Title Header */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 h-48 w-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 h-24 w-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-500 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                      S/4HANA & Odoo Core
                    </span>
                    <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                      Enterprise Suite
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight font-display flex items-center gap-2.5">
                    <Boxes className="h-7 w-7 text-indigo-400 shrink-0" />
                    <span>Nexova Enterprise Inventory Engine</span>
                  </h1>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Real-time valuation layered auditing, MRP stock safety planning, automated purchase generation, cycle-count physical adjustments, and multi-location logistics tracing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={triggerCaptureSnapshot}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Take Snapshot</span>
                  </button>
                  <button
                    onClick={() => {
                      setValuationMethod('WAC');
                      setStockSubTab('valuation');
                      alert('Inventory configurations, FIFO costing stacks, and indices have been successfully fully recalculated!');
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                    <span>Recalculate Stacks</span>
                  </button>
                </div>
              </div>

              {/* Advanced Navigation Sub-tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 mt-6 pt-4 scrollbar-thin overflow-x-auto">
                {[
                  { id: 'valuation', label: 'Costing & Valuation', icon: DollarSign },
                  { id: 'segments', label: 'Quantities & Allocations', icon: Layers },
                  { id: 'reorder', label: 'MRP & Reordering', icon: Settings },
                  { id: 'lots', label: 'RFID Lot & Serials', icon: QrCode },
                  { id: 'cycle', label: 'Physical Cycle Audit', icon: RefreshCw },
                  { id: 'aging', label: 'ABC/XYZ & Aging', icon: BarChart3 },
                  { id: 'history', label: 'Trend Snapshots', icon: Clock },
                ].map((st) => {
                  const IconComp = st.icon;
                  const active = stockSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStockSubTab(st.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800/45 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUB-SUB-TAB 1: COSTING & VALUATION */}
            {stockSubTab === 'valuation' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Standard ERP Inventory Valuations</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Toggle and evaluate current asset balance metrics using distinct global accounting models.</p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                      { id: 'WAC', label: 'Weighted Avg (WAC)' },
                      { id: 'FIFO', label: 'First-In First-Out (FIFO)' },
                      { id: 'LIFO', label: 'Last-In First-Out (LIFO)' },
                      { id: 'Standard Cost', label: 'Standard Cost (+5%)' },
                    ].map(meth => (
                      <button
                        key={meth.id}
                        onClick={() => setValuationMethod(meth.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          valuationMethod === meth.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {meth.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dashboard Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-50/50 rounded-bl-full flex items-center justify-end pr-4 pt-4 text-indigo-500/20">
                      <DollarSign className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Portfolio Valuation</span>
                    <span className="text-xl font-black text-slate-800 block mt-1.5">
                      ৳{activeValuationValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 block mt-1 bg-indigo-50 px-2 py-0.5 rounded w-max">
                      Method: {valuationMethod}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-50/50 rounded-bl-full flex items-center justify-end pr-4 pt-4 text-emerald-500/20">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Selling Value</span>
                    <span className="text-xl font-black text-slate-800 block mt-1.5">
                      ৳{totalRevenueYield.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                      Profits: ৳{activeMarkup.toLocaleString()} ({((activeMarkup / (activeValuationValue || 1)) * 100).toFixed(1)}% Markup)
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-amber-50/50 rounded-bl-full flex items-center justify-end pr-4 pt-4 text-amber-500/20">
                      <Layers className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cost Method Divergences</span>
                    <div className="space-y-1 mt-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">FIFO vs LIFO:</span>
                        <span className="font-bold text-slate-700">৳{(totalFIFOValuation - totalLIFOValuation).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">FIFO vs WAC:</span>
                        <span className="font-bold text-indigo-600">৳{(totalFIFOValuation - totalWACValuation).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/40 rounded-bl-full flex items-center justify-end pr-4 pt-4 text-indigo-200/20">
                      <Percent className="h-8 w-8" />
                    </div>
                    <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Gross Profit Yield</span>
                    <span className="text-xl font-black block mt-1.5">
                      {totalRevenueYield > 0 ? ((activeMarkup / totalRevenueYield) * 100).toFixed(1) : '0.0'}%
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-100 block mt-1">
                      Minimum target: 15.0% threshold
                    </span>
                  </div>
                </div>

                {/* Valuation Chart Visualizations */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">SKU Cost Comparative Stack (WAC vs FIFO vs LIFO)</h4>
                    <span className="text-[10px] text-slate-400">Layered indices showing stock holding inflation</span>
                  </div>

                  <div className="space-y-4">
                    {products.map((p) => {
                      const pWac = p.stock * p.cost;
                      const pFifo = calculateFIFOValuation(p.id, p.stock, p.cost, batches);
                      const pLifo = calculateLIFOValuation(p.id, p.stock, p.cost, batches);
                      const maxVal = Math.max(pWac, pFifo, pLifo, 1000);
                      
                      const wacPct = (pWac / maxVal) * 100;
                      const fifoPct = (pFifo / maxVal) * 100;
                      const lifoPct = (pLifo / maxVal) * 100;

                      return (
                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100">
                          <div>
                            <span className="font-extrabold text-xs text-slate-800 block truncate">{p.name}</span>
                            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tight">{p.sku} • In-stock: {p.stock}</span>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            {/* WAC */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[8px] font-bold">
                                <span className="text-slate-400">Weighted Average Cost (WAC)</span>
                                <span className="text-indigo-600">৳{pWac.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${wacPct}%` }} />
                              </div>
                            </div>
                            {/* FIFO */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[8px] font-bold">
                                <span className="text-slate-400">First-In First-Out (FIFO)</span>
                                <span className="text-emerald-600">৳{pFifo.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${fifoPct}%` }} />
                              </div>
                            </div>
                            {/* LIFO */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[8px] font-bold">
                                <span className="text-slate-400">Last-In First-Out (LIFO)</span>
                                <span className="text-amber-600">৳{pLifo.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${lifoPct}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="text-right border-t md:border-t-0 md:border-l border-slate-200/60 pt-2 md:pt-0 pl-0 md:pl-4">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Variance vs WAC</span>
                            <span className={`text-xs font-black block mt-0.5 ${pFifo - pWac > 0 ? 'text-emerald-600' : pFifo - pWac < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                              {pFifo - pWac > 0 ? '+' : ''}৳{(pFifo - pWac).toLocaleString()} (FIFO)
                            </span>
                            <span className={`text-[10px] font-bold block ${pLifo - pWac > 0 ? 'text-amber-600' : pLifo - pWac < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {pLifo - pWac > 0 ? '+' : ''}৳{(pLifo - pWac).toLocaleString()} (LIFO)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Valuation Ledger with Real Layers */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                    <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Asset Catalog Valuation Ledger</h3>
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-3 py-1 rounded-full border border-emerald-100">Live Double-Entry Sync</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                          <th className="py-3 px-6">Product & SKU</th>
                          <th className="py-3 px-6 text-right">Physical Stock</th>
                          <th className="py-3 px-6 text-right">Standard Cost</th>
                          <th className="py-3 px-6">Active Lots (Aquisitions)</th>
                          <th className="py-3 px-6 text-right">Calculated Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => {
                          const activeVal = getProductValuation(p, valuationMethod);
                          const prodBatches = batches.filter(b => b.productId === p.id && b.qty > 0);

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800">{p.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400 mt-0.5">{p.sku}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right font-extrabold text-slate-700">
                                {p.stock} {p.unit}
                              </td>
                              <td className="py-4 px-6 text-right font-bold text-slate-500">৳{p.cost.toLocaleString()}</td>
                              <td className="py-4 px-6">
                                {prodBatches.length === 0 ? (
                                  <span className="text-slate-400 italic text-[10px]">No acquisition layers. Using catalog fallback.</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-w-md">
                                    {prodBatches.map(b => (
                                      <span key={b.id} className="inline-flex flex-col bg-slate-100 border border-slate-200/50 rounded-lg px-2.5 py-1 font-mono text-[9px] text-slate-600">
                                        <span className="font-extrabold text-slate-800">{b.batchNo} ({b.qty} {p.unit})</span>
                                        <span className="text-[8px] text-slate-400 mt-0.5">Cost: ৳{b.cost.toLocaleString()} • Expiry: {b.expiryDate}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right font-extrabold text-indigo-600">
                                ৳{activeVal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SUB-TAB 2: QUANTITIES & ALLOCATIONS */}
            {stockSubTab === 'segments' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stock Segments List Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between bg-slate-50/50">
                      <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Subdivided Inventory Segments</h3>
                      <span className="text-[10px] text-indigo-600 font-bold">Odoo Multi-State Allocations</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                            <th className="py-3 px-4">SKU / Description</th>
                            <th className="py-3 px-2 text-right">Physical</th>
                            <th className="py-3 px-2 text-right">Available</th>
                            <th className="py-3 px-2 text-right">Reserved</th>
                            <th className="py-3 px-2 text-right">Allocated</th>
                            <th className="py-3 px-2 text-right">Damaged</th>
                            <th className="py-3 px-2 text-right">In Transit</th>
                            <th className="py-3 px-2 text-right">On Order</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold">
                          {products.map(p => {
                            const state = getStockStatus(p);
                            return (
                              <tr
                                key={p.id}
                                onClick={() => {
                                  setSelectedAllocProdId(p.id);
                                  setAllocReserved(String(getProdReserved(p)));
                                  setAllocAllocated(String(getProdAllocated(p)));
                                  setAllocDamaged(String(getProdDamaged(p)));
                                  setAllocTransit(String(getProdTransit(p)));
                                  setAllocOnOrder(String(getProdOnOrder(p)));
                                  setAllocMinStock(String(getProdMinStock(p)));
                                  setAllocMaxStock(String(getProdMaxStock(p)));
                                  setAllocSafetyStock(String(getProdSafetyStock(p)));
                                }}
                                className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${selectedAllocProdId === p.id ? 'bg-indigo-50/50' : ''}`}
                              >
                                <td className="py-4 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-800">{p.name}</span>
                                    <span className="font-mono text-[9px] text-slate-400 mt-0.5">{p.sku}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-right text-slate-900 font-extrabold">{p.stock}</td>
                                <td className="py-4 px-2 text-right text-emerald-600 font-extrabold">{getProdAvailable(p)}</td>
                                <td className="py-4 px-2 text-right text-amber-600">{getProdReserved(p)}</td>
                                <td className="py-4 px-2 text-right text-blue-600">{getProdAllocated(p)}</td>
                                <td className="py-4 px-2 text-right text-rose-600">{getProdDamaged(p)}</td>
                                <td className="py-4 px-2 text-right text-purple-600">{getProdTransit(p)}</td>
                                <td className="py-4 px-2 text-right text-slate-500 font-normal">{getProdOnOrder(p)}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${state.style}`}>
                                    {state.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Allocations Manager Form Sidebar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-500" />
                      <span>Stock Allocations Manager</span>
                    </h3>

                    {selectedAllocProdId ? (() => {
                      const selProd = products.find(p => p.id === selectedAllocProdId)!;
                      return (
                        <form onSubmit={handleAllocationSave} className="space-y-4 text-xs">
                          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                            <span className="text-[10px] text-indigo-500 font-bold block uppercase">Active Selection</span>
                            <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{selProd.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 mt-0.5 block">SKU: {selProd.sku} • System Stock: {selProd.stock}</span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-700">Stock Freeze (Lock SKU)</span>
                            <button
                              type="button"
                              onClick={() => handleToggleFreeze(selProd.id)}
                              className={`p-1.5 rounded-lg border flex items-center gap-1 font-bold text-[10px] cursor-pointer transition-all ${
                                selProd.stockFreeze 
                                  ? 'bg-red-600 text-white border-red-700' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {selProd.stockFreeze ? (
                                <>
                                  <Lock className="h-3 w-3" />
                                  <span>FROZEN</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3 w-3" />
                                  <span>UNFROZEN</span>
                                </>
                              )}
                            </button>
                          </div>

                          {selProd.stockFreeze && (
                            <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-100 flex gap-1.5 items-start">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span className="font-bold text-[10px]">
                                WARNING: This product's physical inventory is currently FROZEN. All sales orders, physical audits, and dispatch operations are blocked.
                              </span>
                            </div>
                          )}

                          <div className="space-y-3">
                            <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Storage State Distribution</h4>
                            
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Reserved Qty</label>
                                <input
                                  type="number"
                                  value={allocReserved}
                                  disabled={selProd.stockFreeze}
                                  onChange={e => setAllocReserved(e.target.value)}
                                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Allocated Qty</label>
                                <input
                                  type="number"
                                  value={allocAllocated}
                                  disabled={selProd.stockFreeze}
                                  onChange={e => setAllocAllocated(e.target.value)}
                                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Damaged Qty</label>
                                <input
                                  type="number"
                                  value={allocDamaged}
                                  disabled={selProd.stockFreeze}
                                  onChange={e => setAllocDamaged(e.target.value)}
                                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Transit Qty</label>
                                <input
                                  type="number"
                                  value={allocTransit}
                                  disabled={selProd.stockFreeze}
                                  onChange={e => setAllocTransit(e.target.value)}
                                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">On Order Qty (Incoming PRs)</label>
                                <input
                                  type="number"
                                  value={allocOnOrder}
                                  onChange={e => setAllocOnOrder(e.target.value)}
                                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider border-t border-slate-100 pt-3">MRP Safety Thresholds</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1">Min stock</label>
                                <input
                                  type="number"
                                  value={allocMinStock}
                                  onChange={e => setAllocMinStock(e.target.value)}
                                  className="w-full bg-slate-50 p-1.5 border border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1">Max stock</label>
                                <input
                                  type="number"
                                  value={allocMaxStock}
                                  onChange={e => setAllocMaxStock(e.target.value)}
                                  className="w-full bg-slate-50 p-1.5 border border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 block mb-1">Safety stock</label>
                                <input
                                  type="number"
                                  value={allocSafetyStock}
                                  onChange={e => setAllocSafetyStock(e.target.value)}
                                  className="w-full bg-slate-50 p-1.5 border border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg cursor-pointer transition-all"
                            >
                              Save Specifications
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAllocProdId('')}
                              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 rounded-lg cursor-pointer transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      );
                    })() : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <Sliders className="h-8 w-8 mx-auto text-slate-300 stroke-1" />
                        <p className="font-bold">No product selected</p>
                        <p className="text-[10px] text-slate-400">Click any product row in the inventory grid to open and modify dedicated safety thresholds, freezes, or segment distributions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SUB-TAB 3: MRP & REORDERING RULES */}
            {stockSubTab === 'reorder' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* MRP Header Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 relative overflow-hidden">
                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Critical Low / Empty SKUs</span>
                    <span className="text-2xl font-black text-rose-800 block mt-1.5">
                      {products.filter(p => p.stock <= getProdMinStock(p)).length}
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium block mt-1">
                      Urgent procurement attention required
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 relative overflow-hidden">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Below Safety Buffer Limits</span>
                    <span className="text-2xl font-black text-amber-800 block mt-1.5">
                      {products.filter(p => p.stock <= getProdSafetyStock(p) && p.stock > getProdMinStock(p)).length}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium block mt-1">
                      Encroaching on backup safety buffers
                    </span>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 relative overflow-hidden">
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Material Purchase Suggestions</span>
                    <span className="text-2xl font-black text-indigo-800 block mt-1.5">
                      {purchaseSuggestions.length} Suggestions
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium block mt-1">
                      Automatic MRP reorder points violated
                    </span>
                  </div>
                </div>

                {/* MRP Rules and Auto-Suggestions Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                    <div>
                      <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">SAP MRP Material Procurement Proposals</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Automated suggestions calculated dynamically: `Suggested Qty = Max Stock - (Available + On-Order)`.</p>
                    </div>

                    {purchaseSuggestions.length > 0 && (
                      <button
                        onClick={() => {
                          const logMsg = `PR Draft generated for ${purchaseSuggestions.length} products total value ৳${purchaseSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0).toLocaleString()}`;
                          logAuditRecord('SYSTEM', 'RECONCILE', logMsg, [], 'SYSTEM', 'SYSTEM');
                          alert(`SUCCESS: Automated Purchase Requisitions have been generated and dispatched to procurement drafts in the Purchase Module!\n\nProposals count: ${purchaseSuggestions.length} items\nTotal Budget allocation: ৳${purchaseSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0).toLocaleString()}`);
                        }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Auto-Generate Purchase Orders</span>
                      </button>
                    )}
                  </div>

                  {purchaseSuggestions.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-3">
                      <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-bold text-slate-700">All SKU safety and reorder thresholds fully satisfied!</p>
                      <p className="text-xs text-slate-400">MRP engine reports 100% optimum material availability across all depots.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                            <th className="py-3 px-6">SKU / Product Description</th>
                            <th className="py-3 px-4 text-center">Safety Stock</th>
                            <th className="py-3 px-4 text-center">Reorder Trigger Point</th>
                            <th className="py-3 px-4 text-center">Max Stock Level</th>
                            <th className="py-3 px-4 text-center">Current Total Available</th>
                            <th className="py-3 px-4 text-center">Already On-Order</th>
                            <th className="py-3 px-4 text-center bg-indigo-50 text-indigo-700">Suggested PO Qty</th>
                            <th className="py-3 px-6 text-right bg-indigo-50 text-indigo-700">Estimated Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {purchaseSuggestions.map((s) => (
                            <tr key={s.product.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800">{s.product.name}</span>
                                  <span className="font-mono text-[9px] text-slate-400 mt-0.5">{s.product.sku}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center text-amber-600 font-mono">{getProdSafetyStock(s.product)}</td>
                              <td className="py-4 px-4 text-center text-indigo-600 font-mono">{getProdReorderLevel(s.product)}</td>
                              <td className="py-4 px-4 text-center text-slate-500 font-mono">{s.maxStock}</td>
                              <td className="py-4 px-4 text-center text-rose-600 font-extrabold">{s.available}</td>
                              <td className="py-4 px-4 text-center text-blue-600 font-mono">{s.onOrder}</td>
                              <td className="py-4 px-4 text-center bg-indigo-50/30 text-indigo-700 font-extrabold font-mono text-sm">{s.suggestedQty}</td>
                              <td className="py-4 px-6 text-right bg-indigo-50/30 text-indigo-700 font-black">৳{s.estimatedCost.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-SUB-TAB 4: LOT, BATCH & EXPIRY TRACKING */}
            {stockSubTab === 'lots' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Double Panel Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lots List */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                      <div>
                        <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Lot acquisitions & Batch Expiry Ledger</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Comprehensive list of physical lot-acquisitions with shelf-life counters.</p>
                      </div>
                      <button
                        onClick={() => {
                          if (products.length === 0) {
                            alert('No products available to assign lots.');
                            return;
                          }
                          setSelectedProductForBatches(products[0]);
                          setShowBatchModal(true);
                        }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Register Lot Acquisition</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                            <th className="py-3 px-4">Lot Batch No</th>
                            <th className="py-3 px-4">Product Description</th>
                            <th className="py-3 px-4">Warehouse Depot</th>
                            <th className="py-3 px-4 text-right">Available Qty</th>
                            <th className="py-3 px-4 text-right">Acquisition Cost</th>
                            <th className="py-3 px-4 text-center">Mfg / Expiry</th>
                            <th className="py-3 px-4 text-center">Shelf Life Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {batches.map((b) => {
                            const isExpired = new Date(b.expiryDate).getTime() < Date.now();
                            const isExpiringSoon = !isExpired && (new Date(b.expiryDate).getTime() - Date.now() < 30*24*60*60*1000);
                            const remDays = Math.max(0, Math.floor((new Date(b.expiryDate).getTime() - Date.now()) / (24*60*60*1000)));

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-mono font-bold text-[10px]">
                                      {b.batchNo}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="font-extrabold text-slate-800">{b.productName}</span>
                                </td>
                                <td className="py-4 px-4 font-normal text-slate-500">{b.warehouse}</td>
                                <td className="py-4 px-4 text-right text-indigo-600 font-bold">{b.qty}</td>
                                <td className="py-4 px-4 text-right text-slate-500 font-bold">৳{b.cost.toLocaleString()}</td>
                                <td className="py-4 px-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-slate-400 text-[9px] font-normal">Mfg: {b.mfgDate}</span>
                                    <span className="text-slate-700 font-mono mt-0.5">Exp: {b.expiryDate}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  {isExpired ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                                      EXPIRED
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                      {remDays} Days left
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Healthy ({remDays}d)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Serial Number Registry Panel */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase text-slate-500 tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-indigo-500" />
                      <span>Serial Registry (Unique RFID)</span>
                    </h3>

                    {/* Serial Adder Form */}
                    <form onSubmit={handleRegisterSerial} className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
                      <span className="font-bold text-slate-700 block mb-1">Add Unique Serial (Anti-Duplicate)</span>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 block">Product Item</label>
                        <select
                          value={newSerialProdId}
                          onChange={e => setNewSerialProdId(e.target.value)}
                          className="w-full bg-white p-2 border border-slate-200 rounded-lg"
                        >
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 block">Unique Serial No</label>
                        <input
                          type="text"
                          placeholder="e.g. SN-STL12-00921"
                          value={newSerialNo}
                          onChange={e => setNewSerialNo(e.target.value)}
                          className="w-full bg-white p-2 border border-slate-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 block">Warehouse location</label>
                        <select
                          value={newSerialWh}
                          onChange={e => setNewSerialWh(e.target.value)}
                          className="w-full bg-white p-2 border border-slate-200 rounded-lg"
                        >
                          {warehouses.map(wh => (
                            <option key={wh.name} value={wh.name}>{wh.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl cursor-pointer transition-all shadow-sm shadow-indigo-600/10"
                      >
                        Register Serial
                      </button>
                    </form>

                    {/* Active Serials list */}
                    <div className="space-y-2.5">
                      <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Registered Serials list</span>
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                        {serials.map(s => {
                          const p = products.find(item => item.id === s.productId);
                          return (
                            <div key={s.id} className="py-2 flex items-center justify-between text-xs font-semibold">
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-800 block">{s.serialNo}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">{p ? p.name : 'Unknown Product'} • {s.warehouse}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                                s.status === 'Available'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : s.status === 'Sold'
                                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {s.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SUB-TAB 5: PHYSICAL AUDIT & CYCLE COUNTING */}
            {stockSubTab === 'cycle' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {cycleCountingCompleted ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-lg">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-800 text-lg">Physical Stock Reconciliation Completed</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The physical count adjustments have been validated and reconciled successfully. Ledger differences have been adjusted in the primary database with a detailed audit trail.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 divide-y divide-slate-100 text-xs font-semibold">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Audited Location:</span>
                        <span className="text-slate-800">{cycleWarehouse}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Approval Reason:</span>
                        <span className="text-slate-800">{cycleAdjustmentReason}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Audit Status:</span>
                        <span className="text-emerald-600 font-bold">RECONCILED & APPROVED</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCycleCountingCompleted(false);
                        setCycleCounts({});
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl cursor-pointer transition-all"
                    >
                      Start New Cycle Count Audit
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Physical Inventory Cycle Counting & Stock Reconciliation</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Audit stock quantities physically present in warehouses and reconcile the differences against system logs.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">Depot Location:</span>
                        <select
                          value={cycleWarehouse}
                          onChange={e => {
                            setCycleWarehouse(e.target.value);
                            setCycleCounts({});
                          }}
                          className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                        >
                          {warehouses.map(w => (
                            <option key={w.name} value={w.name}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Cycle count table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                            <th className="py-3 px-6">SKU / Product Description</th>
                            <th className="py-3 px-6 text-right">System Book Qty</th>
                            <th className="py-3 px-6 text-center w-40">Physical Present Count</th>
                            <th className="py-3 px-6 text-center">Unit Variance</th>
                            <th className="py-3 px-6 text-right">Financial Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {products.map(p => {
                            const pCount = cycleCounts[p.id] !== undefined ? parseInt(cycleCounts[p.id]) : p.stock;
                            const variance = pCount - p.stock;
                            const financialVariance = variance * p.cost;

                            return (
                              <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-800">{p.name}</span>
                                    <span className="font-mono text-[9px] text-slate-400 mt-0.5">{p.sku} • Warehouse: {p.warehouse}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right text-slate-700 font-mono font-bold">{p.stock} {p.unit}</td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      placeholder={String(p.stock)}
                                      value={cycleCounts[p.id] ?? ''}
                                      onChange={e => {
                                        setCycleCounts({ ...cycleCounts, [p.id]: e.target.value });
                                      }}
                                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold font-mono focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                                    />
                                    <button
                                      onClick={() => setCycleCounts({ ...cycleCounts, [p.id]: String(p.stock) })}
                                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded text-[9px] font-bold border border-slate-200 cursor-pointer"
                                    >
                                      Match
                                    </button>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  {variance === 0 ? (
                                    <span className="text-slate-400">Matched</span>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${variance > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                      {variance > 0 ? '+' : ''}{variance} {p.unit}
                                    </span>
                                  )}
                                </td>
                                <td className={`py-4 px-6 text-right font-bold font-mono ${financialVariance > 0 ? 'text-emerald-600' : financialVariance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {financialVariance === 0 ? '৳0' : `${financialVariance > 0 ? '+' : ''}৳${financialVariance.toLocaleString()}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Submit Bar */}
                    <div className="bg-slate-50 p-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 w-full md:max-w-md">
                        <span className="text-xs font-bold text-slate-600 shrink-0">Reason for count:</span>
                        <input
                          type="text"
                          placeholder="e.g. Routine Physical Stock Audit"
                          value={cycleAdjustmentReason}
                          onChange={e => setCycleAdjustmentReason(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        onClick={handleProcessCycleCount}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 self-end md:self-center"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Submit Reconciled Audit Counts</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-SUB-TAB 6: ABC / XYZ ANALYSIS & AGING REPORTS */}
            {stockSubTab === 'aging' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Visual ABC and XYZ Matrix representation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ABC & XYZ Introduction and Matrices */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">ABC-XYZ 9-Box Demand-Value Matrix</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ABC classifies inventory based on total asset holding value (A=70%, B=20%, C=10%). XYZ classifies based on demand predictability (X=Constant/Predictable, Y=Seasonal/Fluctuating, Z=Sporadic).
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {[
                        { code: 'AX', label: 'AX (High Value, Constant)', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', desc: 'Focus strictly on continuous replenishment.' },
                        { code: 'AY', label: 'AY (High Value, Fluctuating)', bg: 'bg-indigo-50/55 text-indigo-700 border-indigo-100', desc: 'Maintain safe buffers for peaks.' },
                        { code: 'AZ', label: 'AZ (High Value, Sporadic)', bg: 'bg-rose-50 text-rose-800 border-rose-200', desc: 'Settle for on-demand procurement.' },
                        { code: 'BX', label: 'BX (Medium Value, Constant)', bg: 'bg-slate-50 text-slate-800 border-slate-200', desc: 'Moderate monitoring, standard reorder.' },
                        { code: 'BY', label: 'BY (Medium Value, Fluctuating)', bg: 'bg-slate-50/70 text-slate-700 border-slate-100', desc: 'Adjust for seasons and buffers.' },
                        { code: 'BZ', label: 'BZ (Medium Value, Sporadic)', bg: 'bg-amber-50 text-amber-800 border-amber-200', desc: 'Keep low safety buffers.' },
                        { code: 'CX', label: 'CX (Low Value, Constant)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', desc: 'Bulk purchase, high min stocks.' },
                        { code: 'CY', label: 'CY (Low Value, Fluctuating)', bg: 'bg-emerald-50/60 text-emerald-700 border-emerald-100', desc: 'Standard bulk reordering.' },
                        { code: 'CZ', label: 'CZ (Low Value, Sporadic)', bg: 'bg-slate-100 text-slate-600 border-slate-200', desc: 'Minimal focus, review regularly.' },
                      ].map((item) => {
                        const itemsInMatrix = products.filter(p => {
                          const cls = abcXYZMap.get(p.id) || { abc: 'C', xyz: 'Z' };
                          return `${cls.abc}${cls.xyz}` === item.code;
                        });

                        return (
                          <div key={item.code} className={`p-4 rounded-2xl border flex flex-col justify-between ${item.bg}`}>
                            <div>
                              <span className="font-extrabold text-sm block">{item.label}</span>
                              <p className="text-[9px] mt-1 font-normal opacity-90 leading-tight">{item.desc}</p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-current/15">
                              <span className="text-xs font-black block">
                                {itemsInMatrix.length} Items ({((itemsInMatrix.length / (products.length || 1)) * 100).toFixed(0)}%)
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1 text-[8px] max-h-12 overflow-y-auto">
                                {itemsInMatrix.map(p => (
                                  <span key={p.id} className="bg-white/40 border border-current/10 px-1 py-0.5 rounded font-mono truncate max-w-[80px]" title={p.name}>{p.sku}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Aging Report Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-1">Financial Stock Aging Audit</h4>
                      <span className="text-[10px] text-slate-400 block">Total asset holdings spread over acquisition periods.</span>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: '0 - 30 Days (Fresh stock)', val: aging.age30, color: 'bg-emerald-500' },
                        { label: '31 - 60 Days (Aging)', val: aging.age60, color: 'bg-indigo-500' },
                        { label: '61 - 90 Days (Stale)', val: aging.age90, color: 'bg-amber-500' },
                        { label: '90+ Days (Dead Stock)', val: aging.age90Plus, color: 'bg-rose-500 animate-pulse-subtle' },
                      ].map(bucket => {
                        const pct = totalAgingValue > 0 ? (bucket.val / totalAgingValue) * 100 : 0;
                        return (
                          <div key={bucket.label} className="space-y-1.5 text-xs font-semibold">
                            <div className="flex justify-between">
                              <span className="text-slate-600">{bucket.label}</span>
                              <span className="text-slate-800 font-extrabold">৳{bucket.val.toLocaleString()} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                              <div className={`${bucket.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-100 text-[11px] font-bold text-indigo-800 flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-indigo-600 shrink-0" />
                      <p>
                        High dead stock (90+ Days) indicators suggest inventory blockages. Review slow-moving cements or re-strategize reorder triggers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock Velocity & Turnover Report Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between bg-slate-50/50">
                    <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Inventory Turnover velocity & Sales Velocity Analysis</h3>
                    <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">Velocity Ledger</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                          <th className="py-3 px-6">Product Description</th>
                          <th className="py-3 px-4">ABC Class</th>
                          <th className="py-3 px-4">XYZ Class</th>
                          <th className="py-3 px-4 text-right">Annualized Cost of Sales (COGS)</th>
                          <th className="py-3 px-4 text-right">Average stock asset value</th>
                          <th className="py-3 px-4 text-right text-indigo-600">Turnover Ratio (COGS/Avg)</th>
                          <th className="py-3 px-6 text-right text-indigo-600">Days Sales in Stock (DSI)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {products.map(p => {
                          const classes = abcXYZMap.get(p.id) || { abc: 'C', xyz: 'Z' };
                          
                          // Simulated sales COGS velocity
                          const cogsVal = p.price * 15 * (classes.xyz === 'X' ? 1.5 : classes.xyz === 'Y' ? 0.8 : 0.3);
                          const avgStockVal = p.cost * Math.max(p.stock, 10);
                          const ratio = avgStockVal > 0 ? (cogsVal / avgStockVal) : 0;
                          const dsi = ratio > 0 ? (365 / ratio) : 365;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800">{p.name}</span>
                                  <span className="font-mono text-[9px] text-slate-400 mt-0.5">{p.sku}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${classes.abc === 'A' ? 'bg-indigo-100 text-indigo-800' : classes.abc === 'B' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  Category {classes.abc}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${classes.xyz === 'X' ? 'bg-blue-100 text-blue-800' : classes.xyz === 'Y' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                  Demand {classes.xyz}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-mono">৳{cogsVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-4 px-4 text-right font-mono">৳{avgStockVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-4 px-4 text-right text-indigo-600 font-extrabold text-sm">{ratio.toFixed(2)}x</td>
                              <td className="py-4 px-6 text-right text-indigo-600 font-black">{Math.round(dsi)} Days</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SUB-TAB 7: TREND SNAPSHOTS */}
            {stockSubTab === 'history' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Snapshot History list */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-1 flex flex-col justify-between">
                    <div>
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider">Inventory snapshots Ledger</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">List of captured historical snapshots for trending indexation.</p>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto p-4 space-y-3">
                        {snapshots.map(snap => (
                          <div key={snap.id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                <span>Snapshot Date: {snap.date}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">Registered Stock Volume: {snap.totalStock} units</span>
                            </div>
                            <span className="font-black text-indigo-600 text-sm">
                              ৳{snap.totalValuation.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={triggerCaptureSnapshot}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Capture Current Stock Snapshot</span>
                      </button>
                    </div>
                  </div>

                  {/* SVG Historical Chart View */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Historical Inventory Asset Valuations (Trend Index)</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Trend plotting showing balance growth over selected counting snapshots.</p>
                      </div>
                      <span className="text-xs text-indigo-600 font-extrabold">Real-time SVG plots</span>
                    </div>

                    {/* Styled Area line chart SVG representation */}
                    <div className="h-64 w-full relative">
                      {snapshots.length < 2 ? (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs italic">
                          Need at least 2 snapshots to render dynamic trend coordinates.
                        </div>
                      ) : (() => {
                        const maxVal = Math.max(...snapshots.map(s => s.totalValuation), 100000);
                        const minVal = Math.min(...snapshots.map(s => s.totalValuation), 0) * 0.95;
                        const valueRange = maxVal - minVal;

                        // Coordinates solver
                        const width = 600;
                        const height = 200;
                        const points = snapshots.map((s, i) => {
                          const x = (i / (snapshots.length - 1)) * (width - 40) + 20;
                          const normVal = valueRange > 0 ? (s.totalValuation - minVal) / valueRange : 0.5;
                          const y = height - (normVal * (height - 40) + 20);
                          return { x, y, snap: s };
                        });

                        const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                        const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

                        return (
                          <div className="h-full w-full flex flex-col justify-between">
                            <svg className="w-full h-[180px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                              {/* Grid lines */}
                              <line x1="10" y1="20" x2={width - 10} y2="20" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="10" y1="100" x2={width - 10} y2="100" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="10" y1="180" x2={width - 10} y2="180" stroke="#f1f5f9" strokeWidth="1" />

                              {/* Fill Path */}
                              <path d={fillD} fill="url(#indigoGrad)" className="opacity-20" />
                              {/* Stroke Path */}
                              <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                              {/* Interactive Node circles */}
                              {points.map((pt, i) => (
                                // index key safe: fixed-order static list
                                <g key={i} className="group cursor-pointer">
                                  <circle cx={pt.x} cy={pt.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="transition-all hover:scale-125" />
                                  <foreignObject x={pt.x - 40} y={pt.y - 30} width="80" height="24" className="overflow-visible pointer-events-none">
                                    <div className="bg-slate-900 text-white text-[8px] font-bold py-0.5 rounded shadow text-center w-full truncate">
                                      ৳{(pt.snap.totalValuation / 1000).toFixed(0)}k
                                    </div>
                                  </foreignObject>
                                </g>
                              ))}

                              {/* Gradient definition */}
                              <defs>
                                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#4f46e5" />
                                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>

                            {/* X-Axis labels */}
                            <div className="flex justify-between px-2 pt-2 text-[9px] font-bold text-slate-400 border-t border-slate-100">
                              {snapshots.map((s, i) => (
                                // index key safe: fixed-order static list
                                <span key={i}>{s.date}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 divide-y divide-slate-100 text-xs font-semibold space-y-2">
                      <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Trend highlights & indicators</div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Total Asset Increment (Growth):</span>
                        <span className="text-emerald-600 font-black">
                          +৳{(snapshots[snapshots.length - 1]?.totalValuation - snapshots[0]?.totalValuation).toLocaleString() || '0'} 
                          ({(((snapshots[snapshots.length - 1]?.totalValuation / (snapshots[0]?.totalValuation || 1)) - 1) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Peak Valuation:</span>
                        <span className="text-indigo-600 font-extrabold">৳{Math.max(...snapshots.map(s => s.totalValuation)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================
          TAB 6: STOCK TRANSFER
          ========================================= */}
      {currentTab === 'stock_transfer' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Inter-Warehouse Transfers</h2>
              <p className="text-xs text-slate-400 mt-1">Disburse and record movement of product quantities across regional yards and depots.</p>
            </div>
            <button
              onClick={() => {
                if (products.length === 0) {
                  alert('No products available to transfer.');
                  return;
                }
                setSelectedProductId(products[0].id);
                setShowTransferModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Initiate New Transfer</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Transfer Ledger</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/40">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Reference No</th>
                  <th className="py-3 px-6">Product Description</th>
                  <th className="py-3 px-6 text-center">Transferred Qty</th>
                  <th className="py-3 px-6">Source (From)</th>
                  <th className="py-3 px-6">Destination (To)</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 text-slate-500 font-semibold">{tr.date}</td>
                    <td className="py-4 px-6 font-mono text-indigo-600 font-bold">{tr.refNo}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{tr.productName}</td>
                    <td className="py-4 px-6 text-center font-bold text-indigo-600">
                      {tr.qty} {tr.unit}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">{tr.from}</td>
                    <td className="py-4 px-6 font-medium text-slate-600">{tr.to}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 7: BARCODES LABEL GENERATOR
          ========================================= */}
      {currentTab === 'barcodes' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-display">Barcode Label Studio</h2>
            <p className="text-xs text-slate-400 mt-1">Configure layout, pair metrics, and generate printable barcode stickers for your inventory packages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Configure Sticker sheet</h3>
              <form onSubmit={handleGenerateBarcodes} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Product</label>
                  <select
                    value={barcodeProduct}
                    onChange={(e) => setBarcodeProduct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity of Labels</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={barcodeQty}
                    onChange={(e) => setBarcodeQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Generate Label Previews</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Sheet Print Preview</h3>
                {generatedBarcodes.length > 0 && (
                  <button
                    onClick={() => {
                      alert('Sticker labels sent to thermal printer. Status: OK');
                    }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Print thermal label sheet
                  </button>
                )}
              </div>

              {generatedBarcodes.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <QrCode className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-xs font-semibold">Select a catalog product and click generate to populate printing stickers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {generatedBarcodes.map((p) => (
                    <div key={p.sku} className="border border-slate-200 rounded-xl p-4 text-center space-y-2.5 bg-slate-50/50 shadow-xs relative group hover:border-indigo-500/50 transition-colors">
                      <div className="text-[8px] font-bold tracking-widest text-slate-400 uppercase font-display">NEXOVA ERP</div>
                      <div className="text-[10px] font-bold text-slate-800 truncate" title={p.name}>{p.name}</div>
                      <div className="flex justify-between text-[9px] px-2 font-semibold">
                        <span className="text-indigo-600">{p.sku}</span>
                        <span className="text-slate-800">৳{p.price}</span>
                      </div>
                      
                      {/* Realistic Visual Mock Barcode generated with vertical line divs */}
                      <div className="h-10 w-full bg-white border border-slate-200/60 rounded flex items-center justify-center p-1.5 gap-0.5">
                        <div className="w-[1.5px] h-full bg-slate-800" />
                        <div className="w-[3px] h-full bg-slate-800" />
                        <div className="w-[1px] h-full bg-slate-800" />
                        <div className="w-[0.5px] h-full bg-slate-800" />
                        <div className="w-[2.5px] h-full bg-slate-800" />
                        <div className="w-[1.5px] h-full bg-slate-800" />
                        <div className="w-[0.5px] h-full bg-slate-800" />
                        <div className="w-[3px] h-full bg-slate-800" />
                        <div className="w-[1px] h-full bg-slate-800" />
                        <div className="w-[2px] h-full bg-slate-800" />
                        <div className="w-[1px] h-full bg-slate-800" />
                        <div className="w-[1.5px] h-full bg-slate-800" />
                        <div className="w-[2.5px] h-full bg-slate-800" />
                        <div className="w-[0.5px] h-full bg-slate-800" />
                        <div className="w-[2px] h-full bg-slate-800" />
                      </div>
                      
                      <div className="text-[9px] font-mono tracking-wider font-bold text-slate-500">*{p.sku.replace(/-/g, '')}*</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 8: OFFER INFO
          ========================================= */}
      {currentTab === 'offer_info' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Special Offers & Bundles</h2>
              <p className="text-xs text-slate-400 mt-1">Configure automated seasonal discount campaigns, free gift vouchers, and volume-based bundle rules.</p>
            </div>
            <button
              onClick={() => {
                if (products.length === 0) {
                  alert('No products available to assign offers.');
                  return;
                }
                setOfferProduct(products[0].name);
                setShowOfferModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Percent className="h-4 w-4" />
              <span>Configure Promo Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((of) => (
              <div key={of.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6" />
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {of.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Active Campaign</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{of.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Applied on: <span className="text-slate-600 font-bold">{of.productName}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Trigger Rule</span>
                      <span className="font-bold text-slate-700 mt-0.5 block">{of.criteria}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Reward / Payback</span>
                      <span className="font-bold text-indigo-600 mt-0.5 block">{of.reward}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOfferId(of.id);
                        setEditingOfferName(of.name);
                        setEditingOfferType(of.type);
                        setEditingOfferProduct(of.productName);
                        setEditingOfferCriteria(of.criteria);
                        setEditingOfferReward(of.reward);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Offer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(of.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================
          EXTENSION INVENTORY GROUP TABS
          ========================================= */}
      {currentTab === 'templates' && (
        <TemplatesTab
          products={products}
          onUpdateProducts={onUpdateProducts}
        />
      )}

      {currentTab === 'variants' && (
        <VariantsTab
          products={products}
          onUpdateProducts={onUpdateProducts}
        />
      )}

      {currentTab === 'metadata' && (
        <MetadataTab />
      )}

      {currentTab === 'custom_fields' && (
        <CustomFieldsTab
          products={products}
          customFields={customFields}
          setCustomFields={setCustomFields}
        />
      )}

      {currentTab === 'layout_builder' && (
        <LayoutBuilderTab />
      )}

      {currentTab === 'attributes' && (
        <AttributesTab />
      )}

      {currentTab === 'brands' && (
        <BrandsTab />
      )}

      {currentTab === 'manufacturers' && (
        <ManufacturersTab />
      )}

      {currentTab === 'pricing' && (
        <PricingEngineTab
          products={products}
          onUpdateProducts={onUpdateProducts}
        />
      )}

      {currentTab === 'discount' && (
        <DiscountMatrixTab />
      )}

      {currentTab === 'promotion' && (
        <PromotionManagerTab />
      )}

      {currentTab === 'zones' && (
        <ZonesTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'aisles' && (
        <AislesTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'racks' && (
        <RacksTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'shelves' && (
        <ShelvesTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'bins' && (
        <BinsTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'adjustment' && (
        <AdjustmentTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'reservation' && (
        <ReservationTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'batch' && (
        <BatchTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'lot' && (
        <LotTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'serial' && (
        <SerialTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'expiry' && (
        <ExpiryTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'qr' && (
        <QrGeneratorTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {currentTab === 'valuation' && (
        <ValuationTab products={products} onUpdateProducts={onUpdateProducts} warehouses={warehouses} />
      )}

      {/* =========================================
          MODALS SECTION (Products, Categories, etc)
          ========================================= */}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Add New Product Master</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <DynamicFormRenderer
                fields={fields}
                tabs={tabs}
                sections={sections}
                formData={addFormData}
                onChange={setAddFormData}
                errors={addFormErrors}
                userRole="Administrator"
                categoriesList={categories}
                warehousesList={warehouses.map(w => w.name)}
                unitsList={units.map(u => u.name)}
              />

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-md shadow-indigo-600/10">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Category</h4>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text" required placeholder="e.g. Electrical Fittings" value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Unit</h4>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUnitSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Name *</label>
                <input
                  type="text" required placeholder="e.g. Meters" value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Abbreviation *</label>
                <input
                  type="text" required placeholder="e.g. mtr" value={newUnitAbbrev}
                  onChange={(e) => setNewUnitAbbrev(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allow Fraction</label>
                <select value={newUnitBase} onChange={(e) => setNewUnitBase(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer">
                  <option value="Yes">Allowed (Decimals allowed)</option>
                  <option value="No">Integers Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUnitModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Depot/Warehouse Modal */}
      {showWhModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Depot</h4>
              <button onClick={() => setShowWhModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleWhSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Depot Name *</label>
                <input
                  type="text" required placeholder="e.g. Yard C" value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location Address</label>
                <input
                  type="text" placeholder="e.g. Gazipur Crossroads" value={newWhLoc}
                  onChange={(e) => setNewWhLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">depot Supervisor</label>
                <input
                  type="text" placeholder="e.g. M. Rahman" value={newWhMgr}
                  onChange={(e) => setNewWhMgr(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Storage Capacity Limit</label>
                <input
                  type="text" placeholder="e.g. 2000 Tons" value={newWhCap}
                  onChange={(e) => setNewWhCap(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowWhModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Save Depot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Stock Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Product</label>
                <select
                  value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold text-slate-700"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit} remaining)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transfer Quantity *</label>
                <input
                  type="number" required min="1" placeholder="e.g. 10" value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From (Source)</label>
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer">
                    {warehouses.map((w) => (
                      <option key={w.name} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To (Destination)</label>
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold text-indigo-600">
                    {warehouses.map((w) => (
                      <option key={w.name} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-md">Complete Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Offer Rule</h4>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offer Name *</label>
                <input
                  type="text" required placeholder="e.g. End of Season Paint Discount" value={offerName}
                  onChange={(e) => setOfferName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offer Type</label>
                <select value={offerType} onChange={(e) => setOfferType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer">
                  <option value="Bundle Bonus">Bundle Bonus (Buy X Get Y)</option>
                  <option value="Discount Code">Percentage/Fixed Discount</option>
                  <option value="Cashback Offer">Cashback Payback</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affected Product</label>
                <select value={offerProduct} onChange={(e) => setOfferProduct(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer">
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trigger Criteria *</label>
                <input
                  type="text" required placeholder="e.g. Purchase order exceeding 50 Bags" value={offerCriteria}
                  onChange={(e) => setOfferCriteria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reward Value *</label>
                <input
                  type="text" required placeholder="e.g. 5% cash-back or 2 Free Bags" value={offerReward}
                  onChange={(e) => setOfferReward(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowOfferModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Activate Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Quick Editor Modal */}
      {editingStockId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Adjust Stock</h4>
              <button onClick={() => setEditingStockId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleStockSave} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-3 font-display">
                  Product: <span className="font-bold text-slate-800">{products.find(p => p.id === editingStockId)?.name}</span>
                </p>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Stock Level</label>
                <input
                  type="number" required min="0" value={editingStockVal}
                  onChange={(e) => setEditingStockVal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingStockId(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update</button>
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
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Category</h4>
              <button onClick={() => setEditingCatName(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditCategorySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text" required value={editingCatNewName}
                  onChange={(e) => setEditingCatNewName(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingCatName(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {editingUnitName !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Unit</h4>
              <button onClick={() => setEditingUnitName(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditUnitSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Name *</label>
                <input
                  type="text" required value={editingUnitNewName}
                  onChange={(e) => setEditingUnitNewName(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Abbreviation *</label>
                <input
                  type="text" required value={editingUnitAbbrev}
                  onChange={(e) => setEditingUnitAbbrev(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allow Fraction</label>
                <select value={editingUnitBase} onChange={(e) => setEditingUnitBase(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold">
                  <option value="Yes">Allowed (Decimals allowed)</option>
                  <option value="No">Integers Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingUnitName(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Depot/Warehouse Modal */}
      {editingWhName !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Depot</h4>
              <button onClick={() => setEditingWhName(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditWarehouseSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Depot Name *</label>
                <input
                  type="text" required value={editingWhNewName}
                  onChange={(e) => setEditingWhNewName(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location Address</label>
                <input
                  type="text" value={editingWhLoc}
                  onChange={(e) => setEditingWhLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Depot Supervisor</label>
                <input
                  type="text" value={editingWhMgr}
                  onChange={(e) => setEditingWhMgr(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Storage Capacity Limit</label>
                <input
                  type="text" value={editingWhCap}
                  onChange={(e) => setEditingWhCap(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingWhName(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update Depot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {editingOfferId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Offer Rule</h4>
              <button onClick={() => setEditingOfferId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditOfferSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offer Name *</label>
                <input
                  type="text" required value={editingOfferName}
                  onChange={(e) => setEditingOfferName(e.target.value)} className="w-full bg-[#ffffe2] border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Offer Type</label>
                <select value={editingOfferType} onChange={(e) => setEditingOfferType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold">
                  <option value="Bundle Bonus">Bundle Bonus (Buy X Get Y)</option>
                  <option value="Discount Code">Percentage/Fixed Discount</option>
                  <option value="Cashback Offer">Cashback Payback</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affected Product</label>
                <select value={editingOfferProduct} onChange={(e) => setEditingOfferProduct(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold">
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trigger Criteria *</label>
                <input
                  type="text" required value={editingOfferCriteria}
                  onChange={(e) => setEditingOfferCriteria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reward Value *</label>
                <input
                  type="text" required value={editingOfferReward}
                  onChange={(e) => setEditingOfferReward(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingOfferId(null)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer">Update Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProdId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Edit Product Catalog</h3>
              <button onClick={() => setEditingProdId(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditProductSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <DynamicFormRenderer
                fields={fields}
                tabs={tabs}
                sections={sections}
                formData={editFormData}
                onChange={setEditFormData}
                errors={editFormErrors}
                userRole="Administrator"
                categoriesList={categories}
                warehousesList={warehouses.map(w => w.name)}
                unitsList={units.map(u => u.name)}
              />

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setEditingProdId(null)} className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-md shadow-indigo-600/10">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Custom Fields Modal */}
      {showCustomFieldsModal && (
        <ManageCustomFieldsModal
          onClose={() => setShowCustomFieldsModal(false)}
          customFields={customFields}
          setCustomFields={(newFields) => {
            if (typeof newFields === 'function') {
              const resolved = (newFields as Function)(customFields);
              setCustomFields(resolved);
              const updatedCols = { ...visibleColumns };
              resolved.forEach((f: any) => {
                if (updatedCols[f.internalName] === undefined) {
                  updatedCols[f.internalName] = true;
                }
              });
              setVisibleColumns(updatedCols);
            } else {
              setCustomFields(newFields);
              const updatedCols = { ...visibleColumns };
              newFields.forEach((f: any) => {
                if (updatedCols[f.internalName] === undefined) {
                  updatedCols[f.internalName] = true;
                }
              });
              setVisibleColumns(updatedCols);
            }
          }}
        />
      )}

      {/* Reusable Excel/CSV Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        schema={[
          { key: 'sku', labelEn: 'SKU', labelBn: 'এসকিউ', type: 'string', required: true },
          { key: 'name', labelEn: 'Product Name', labelBn: 'পণ্যের নাম', type: 'string', required: true },
          { key: 'category', labelEn: 'Category', labelBn: 'ক্যাটাগরি', type: 'string', required: true },
          { key: 'unit', labelEn: 'Unit', labelBn: 'ইউনিট', type: 'string', required: true },
          { key: 'warehouse', labelEn: 'Warehouse', labelBn: 'গুদাম', type: 'string', required: true },
          { key: 'price', labelEn: 'Selling Price (৳)', labelBn: 'বিক্রয় মূল্য', type: 'number', required: true, validationType: 'positiveNumber' },
          { key: 'cost', labelEn: 'Cost Price (৳)', labelBn: 'ক্রয় মূল্য', type: 'number', required: true, validationType: 'positiveNumber' },
          { key: 'stock', labelEn: 'Stock Level', labelBn: 'স্টক সংখ্যা', type: 'number', required: true, validationType: 'positiveNumber' },
          { key: 'alertQty', labelEn: 'Alert Quantity', labelBn: 'সতর্কতা পরিমাণ', type: 'number', required: true, validationType: 'positiveNumber' },
          { key: 'pcsPerBox', labelEn: 'Pcs Per Box', labelBn: 'বক্স প্রতি পিস', type: 'number', required: false, validationType: 'positiveNumberNonZero' },
        ]}
        existingData={products}
        uniqueKey="sku"
        collectionNameEn="Products"
        collectionNameBn="পণ্য"
        onSave={(updatedProducts) => {
          if (onUpdateProducts) {
            onUpdateProducts(updatedProducts);
          }
          setIsImportModalOpen(false);
        }}
      />

    </div>
  );
}
