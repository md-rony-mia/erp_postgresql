import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { DEMO_SEED_ENABLED } from '../lib/dataClient';
import {
  Copy,
  Layers,
  Database,
  FileCode,
  Grid,
  Tags,
  Award,
  Factory,
  DollarSign,
  Percent,
  Sparkles,
  Sliders,
  CheckCircle,
  Edit3,
  Trash2,
  Plus,
  Search,
  HelpCircle,
  Save,
  ArrowUp,
  ArrowDown,
  Calculator,
  Calendar,
  Ticket,
  RefreshCw,
  Star,
  Check,
  AlertCircle
} from 'lucide-react';

interface TabProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  customFields?: any[];
  setCustomFields?: (fields: any) => void;
}

// ==========================================
// 1. PRODUCT TEMPLATES TAB
// ==========================================
export function TemplatesTab({ products }: TabProps) {
  const [templates, setTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_templates');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 't1', name: 'Electronics Gadget Base', category: 'Electronics', defaultCost: 150, defaultPrice: 249, defaultUnit: 'pcs', defaultWarehouse: 'Main Warehouse', alertQty: 5, taxRate: 15 },
      { id: 't2', name: 'Apparel Standard Fit', category: 'Apparel', defaultCost: 12, defaultPrice: 35, defaultUnit: 'pcs', defaultWarehouse: 'Main Warehouse', alertQty: 20, taxRate: 5 },
      { id: 't3', name: 'Raw Materials Bundle', category: 'Raw Materials', defaultCost: 8, defaultPrice: 15, defaultUnit: 'kg', defaultWarehouse: 'Storage Yard', alertQty: 100, taxRate: 0 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_templates', JSON.stringify(templates));
  }, [templates]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [warehouse, setWarehouse] = useState('Main Warehouse');
  const [alertQty, setAlertQty] = useState('10');
  const [taxRate, setTaxRate] = useState('15');
  const [search, setSearch] = useState('');

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newTemplate = {
      id: 'temp_' + Date.now(),
      name,
      category,
      defaultCost: Number(cost) || 0,
      defaultPrice: Number(price) || 0,
      defaultUnit: unit,
      defaultWarehouse: warehouse,
      alertQty: Number(alertQty) || 5,
      taxRate: Number(taxRate) || 0
    };
    setTemplates([...templates, newTemplate]);
    setName('');
    setCost('');
    setPrice('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Product Templates Blueprint</h2>
          <p className="text-xs text-slate-400 mt-1">Configure pre-defined blueprints to accelerate new product registration with default settings.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Blueprint Template</span>
        </button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTemplate} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Create New Product Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Template Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Premium Smart Watch Base"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Electronics">Electronics</option>
                <option value="Apparel">Apparel</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging">Packaging</option>
                <option value="Chemicals">Chemicals</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Default Price</label>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Default Cost</label>
              <input
                type="number"
                placeholder="0.00"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Stock Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alert Quantity</label>
              <input
                type="number"
                value={alertQty}
                onChange={e => setAlertQty(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
            >
              Save Template Blueprint
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-full -mr-4 -mt-4" />
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {t.category}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  {t.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Default Warehouse: <span className="font-semibold text-slate-600">{t.defaultWarehouse}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Price</span>
                  <span className="font-bold text-indigo-600">${t.defaultPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Cost</span>
                  <span className="font-bold text-slate-700">${t.defaultCost}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Unit</span>
                  <span className="font-semibold text-slate-600">{t.defaultUnit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Alert Level</span>
                  <span className="font-bold text-slate-700">{t.alertQty}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. PRODUCT VARIANTS TAB
// ==========================================
export function VariantsTab({ products, onUpdateProducts }: TabProps) {
  const [variants, setVariants] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_variants');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'v1', parentName: 'Enterprise Laptop Pro', sku: 'LAP-PRO-S-BLK', attributes: 'Size: 14", Color: Jet Black', pricePremium: 0, costAdjustment: 0, stock: 15 },
      { id: 'v2', parentName: 'Enterprise Laptop Pro', sku: 'LAP-PRO-L-SLV', attributes: 'Size: 16", Color: Cosmic Silver', pricePremium: 200, costAdjustment: 120, stock: 8 },
      { id: 'v3', parentName: 'Ergonomic Office Chair', sku: 'CHR-ERG-ORG', attributes: 'Material: Mesh, Color: Coral Orange', pricePremium: 25, costAdjustment: 15, stock: 32 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_variants', JSON.stringify(variants));
  }, [variants]);

  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedParent, setSelectedParent] = useState(products[0]?.name || '');
  const [attrName1, setAttrName1] = useState('Size');
  const [attrVals1, setAttrVals1] = useState('Standard, Premium');
  const [attrName2, setAttrName2] = useState('Color');
  const [attrVals2, setAttrVals2] = useState('Carbon Gray, Arctic White');
  const [search, setSearch] = useState('');

  const generateMatrix = () => {
    if (!selectedParent) return;
    const vals1 = attrVals1.split(',').map(s => s.trim()).filter(Boolean);
    const vals2 = attrVals2.split(',').map(s => s.trim()).filter(Boolean);

    const newRows: any[] = [];
    const prefix = selectedParent.substring(0, 3).toUpperCase();

    if (vals1.length > 0 && vals2.length > 0) {
      vals1.forEach(v1 => {
        vals2.forEach(v2 => {
          const skuCode = `${prefix}-${v1.substring(0,3).toUpperCase()}-${v2.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          newRows.push({
            id: 'var_' + Date.now() + Math.random().toString(36).substr(2, 5),
            parentName: selectedParent,
            sku: skuCode,
            attributes: `${attrName1}: ${v1}, ${attrName2}: ${v2}`,
            pricePremium: 0,
            costAdjustment: 0,
            stock: 0
          });
        });
      });
    } else if (vals1.length > 0) {
      vals1.forEach(v1 => {
        const skuCode = `${prefix}-${v1.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        newRows.push({
          id: 'var_' + Date.now() + Math.random().toString(36).substr(2, 5),
          parentName: selectedParent,
          sku: skuCode,
          attributes: `${attrName1}: ${v1}`,
          pricePremium: 0,
          costAdjustment: 0,
          stock: 0
        });
      });
    }

    setVariants([...newRows, ...variants]);
    setShowGenerator(false);
  };

  const updateVariantValue = (id: string, key: string, val: number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [key]: val } : v));
  };

  const deleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const filtered = variants.filter(v => 
    v.parentName.toLowerCase().includes(search.toLowerCase()) || 
    v.sku.toLowerCase().includes(search.toLowerCase()) || 
    v.attributes.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Product Variants Matrix</h2>
          <p className="text-xs text-slate-400 mt-1">Manage multiple sizes, colors, and material profiles derived from primary product masters.</p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Layers className="h-4 w-4" />
          <span>Generate Variant Matrix</span>
        </button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search variants, parents, or attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {showGenerator && (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">SKU Variants Generator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Parent Product</label>
              <select
                value={selectedParent}
                onChange={e => setSelectedParent(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                {products.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Dimension 1</label>
                <input
                  type="text"
                  placeholder="e.g., Size"
                  value={attrName1}
                  onChange={e => setAttrName1(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Values (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., S, M, L"
                  value={attrVals1}
                  onChange={e => setAttrVals1(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Dimension 2</label>
                <input
                  type="text"
                  placeholder="e.g., Color"
                  value={attrName2}
                  onChange={e => setAttrName2(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Values (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Black, White"
                  value={attrVals2}
                  onChange={e => setAttrVals2(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowGenerator(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={generateMatrix}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Compile Matrix Rows
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <th className="p-4">Parent Product</th>
              <th className="p-4">Variant SKU</th>
              <th className="p-4">Attributes Option</th>
              <th className="p-4 text-center w-28">Price Premium ($)</th>
              <th className="p-4 text-center w-28">Cost Premium ($)</th>
              <th className="p-4 text-center w-24">On-Hand Stock</th>
              <th className="p-4 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{v.parentName}</td>
                <td className="p-4 font-mono text-slate-500 font-bold">{v.sku}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200/50">
                    {v.attributes}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <input
                    type="number"
                    value={v.pricePremium}
                    onChange={e => updateVariantValue(v.id, 'pricePremium', Number(e.target.value))}
                    className="w-20 text-center p-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 bg-white"
                  />
                </td>
                <td className="p-4 text-center">
                  <input
                    type="number"
                    value={v.costAdjustment}
                    onChange={e => updateVariantValue(v.id, 'costAdjustment', Number(e.target.value))}
                    className="w-20 text-center p-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 bg-white"
                  />
                </td>
                <td className="p-4 text-center">
                  <input
                    type="number"
                    value={v.stock}
                    onChange={e => updateVariantValue(v.id, 'stock', Number(e.target.value))}
                    className="w-16 text-center p-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 bg-white"
                  />
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteVariant(v.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-400 font-medium">No variants found matching filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. ENTERPRISE METADATA SCHEMA TAB
// ==========================================
export function MetadataTab() {
  const [metadata, setMetadata] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_metadata');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'm1', key: 'hsn_code', displayName: 'HSN / Harmonized Code', type: 'String', entity: 'products', regex: '^\\d{4,8}$', isRequired: false, isSearchable: true },
      { id: 'm2', key: 'warranty_months', displayName: 'Warranty Period (Months)', type: 'Integer', entity: 'products', regex: '', isRequired: false, isSearchable: false },
      { id: 'm3', key: 'is_fragile', displayName: 'Fragile Material', type: 'Boolean', entity: 'products', regex: '', isRequired: true, isSearchable: true },
      { id: 'm4', key: 'storage_temp', displayName: 'Recommended Temperature (°C)', type: 'Float', entity: 'products', regex: '', isRequired: false, isSearchable: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_metadata', JSON.stringify(metadata));
  }, [metadata]);

  const [showAdd, setShowAdd] = useState(false);
  const [key, setKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState('String');
  const [entity, setEntity] = useState('products');
  const [regex, setRegex] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isSearchable, setIsSearchable] = useState(true);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !displayName) return;
    const newMeta = {
      id: 'meta_' + Date.now(),
      key: key.toLowerCase().replace(/\s+/g, '_'),
      displayName,
      type,
      entity,
      regex,
      isRequired,
      isSearchable
    };
    setMetadata([...metadata, newMeta]);
    setKey('');
    setDisplayName('');
    setRegex('');
    setIsRequired(false);
    setShowAdd(false);
  };

  const deleteMeta = (id: string) => {
    setMetadata(metadata.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Metadata & Database Schemas</h2>
          <p className="text-xs text-slate-400 mt-1">Configure backend custom field database registries, structural types, indexes, and validation rules.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Database className="h-4 w-4" />
          <span>Add Meta Property</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register Metadata Property</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Property Key Name (System ID)</label>
              <input
                type="text"
                required
                placeholder="e.g., custom_hsn_code"
                value={key}
                onChange={e => setKey(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Human Readable Label</label>
              <input
                type="text"
                required
                placeholder="e.g., Harmonized System Code"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Data Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="String">String</option>
                <option value="Integer">Integer</option>
                <option value="Float">Float</option>
                <option value="Boolean">Boolean</option>
                <option value="Date">Date</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Registry Table</label>
              <select
                value={entity}
                onChange={e => setEntity(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="products">products (Product Master)</option>
                <option value="warehouses">warehouses (Warehouse Master)</option>
                <option value="suppliers">suppliers (Suppliers Master)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Validation Regex Constraint</label>
              <input
                type="text"
                placeholder="e.g., ^\d{6}$"
                value={regex}
                onChange={e => setRegex(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Required Value
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isSearchable}
                  onChange={e => setIsSearchable(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Indexed/Searchable
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Save Schema Key
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="h-4 w-4 text-slate-500" />
            Meta Registry Table (products)
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">ACTIVE SCHEMAS</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <th className="p-4">Key ID</th>
              <th className="p-4">Display Label</th>
              <th className="p-4">Data Type</th>
              <th className="p-4">Required</th>
              <th className="p-4">Search/Index</th>
              <th className="p-4">Regex Validation</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metadata.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-mono text-slate-500 font-bold">{m.key}</td>
                <td className="p-4 font-semibold text-slate-700">{m.displayName}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {m.type}
                  </span>
                </td>
                <td className="p-4 font-medium">
                  {m.isRequired ? (
                    <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold">YES</span>
                  ) : (
                    <span className="text-slate-400">Optional</span>
                  )}
                </td>
                <td className="p-4 font-medium">
                  {m.isSearchable ? (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">INDEXED</span>
                  ) : (
                    <span className="text-slate-400">Excluded</span>
                  )}
                </td>
                <td className="p-4 font-mono text-xs text-slate-400">{m.regex || 'N/A'}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteMeta(m.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 4. CUSTOM FIELDS REGISTER TAB
// ==========================================
export function CustomFieldsTab({ customFields = [], setCustomFields }: TabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [internalName, setInternalName] = useState('');
  const [type, setType] = useState('text');
  const [helpText, setHelpText] = useState('');
  const [required, setRequired] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !internalName || !setCustomFields) return;

    const newField = {
      id: 'cf_' + Date.now(),
      displayName,
      internalName: internalName.toLowerCase().replace(/\s+/g, '_'),
      type,
      helpText,
      required,
      unique: false,
      readOnly: false,
      hidden: false,
      displayOrder: customFields.length + 1,
      tabAssignment: 'custom',
      sectionAssignment: 'sec_custom_dyn'
    };

    setCustomFields([...customFields, newField]);
    setDisplayName('');
    setInternalName('');
    setHelpText('');
    setRequired(false);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (setCustomFields) {
      setCustomFields(customFields.filter(f => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Specification Fields Customizer</h2>
          <p className="text-xs text-slate-400 mt-1">Design user-friendly specification entry forms, text areas, number boxes, and flags.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <FileCode className="h-4 w-4" />
          <span>New Custom Field</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Form Custom Input</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Display Label</label>
              <input
                type="text"
                required
                placeholder="e.g., Fabric Composition"
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value);
                  setInternalName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                }}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Internal Database Key</label>
              <input
                type="text"
                required
                placeholder="e.g., fabric_composition"
                value={internalName}
                onChange={e => setInternalName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono text-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Input Field Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="text">text (Single Line Text)</option>
                <option value="number">number (Integer or Decimal)</option>
                <option value="date">date (Calendar Date picker)</option>
                <option value="boolean">boolean (Checkbox Toggle)</option>
                <option value="textarea">textarea (Multi-line text block)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tooltip Helper Guide</label>
              <input
                type="text"
                placeholder="e.g., Mention 100% Cotton, etc"
                value={helpText}
                onChange={e => setHelpText(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={e => setRequired(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Require validation prior to product save
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Mount Custom Field
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customFields.map((f) => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-indigo-500" />
                  {f.displayName}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1">DB Key: <span className="text-indigo-600">{f.internalName}</span></p>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Input Element Type</span>
                <span className="font-semibold text-slate-600">{f.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Validation Checks</span>
                <span className={`font-semibold text-[10px] ${f.required ? 'text-amber-600' : 'text-slate-400'}`}>
                  {f.required ? 'Required Block' : 'No Constraints'}
                </span>
              </div>
              {f.helpText && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Help Text Description</span>
                  <span className="text-slate-500 text-[11px] font-medium block mt-0.5">{f.helpText}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. PRODUCT FORM LAYOUT BUILDER TAB
// ==========================================
export function LayoutBuilderTab() {
  const [layouts, setLayouts] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_layouts');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'l1', sectionName: 'General Information Block', tabAssignment: 'general', order: 1, columns: 'Half', visible: true },
      { id: 'l2', sectionName: 'Financials & Tax Markup Engine', tabAssignment: 'pricing', order: 2, columns: 'Half', visible: true },
      { id: 'l3', sectionName: 'Base Stock Warehouses Allocations', tabAssignment: 'stock', order: 3, columns: 'Full', visible: true },
      { id: 'l4', sectionName: 'Custom Specification Parameters', tabAssignment: 'custom', order: 4, columns: 'Full', visible: true },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_layouts', JSON.stringify(layouts));
  }, [layouts]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= layouts.length) return;
    const reordered = [...layouts];
    const tmp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = tmp;
    // reassign order sequence
    reordered.forEach((l, idx) => {
      l.order = idx + 1;
    });
    setLayouts(reordered);
  };

  const toggleVisibility = (id: string) => {
    setLayouts(layouts.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const changeColumnSpan = (id: string, col: string) => {
    setLayouts(layouts.map(l => l.id === id ? { ...l, columns: col } : l));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-display">Product Form Layout Designer</h2>
        <p className="text-xs text-slate-400 mt-1">Design user form flow, hide unneeded tabs, and optimize input widths (grid grid-cols) for tablet vs desktop displays.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SECTION ARRANGEMENT MATRIX</span>
          {layouts.map((l, index) => (
            <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-indigo-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveItem(index, 'up')}
                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    disabled={index === layouts.length - 1}
                    onClick={() => moveItem(index, 'down')}
                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{l.sectionName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: <span className="font-semibold text-slate-600 font-mono">Tab - {l.tabAssignment}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Column Width</span>
                  <select
                    value={l.columns}
                    onChange={e => changeColumnSpan(l.id, e.target.value)}
                    className="text-xs p-1 border border-slate-200 rounded bg-slate-50 font-semibold text-slate-600"
                  >
                    <option value="Full">Full (1 Column)</option>
                    <option value="Half">Half (2 Columns)</option>
                    <option value="Third">Third (3 Columns)</option>
                    <option value="Quarter">Quarter (4 Columns)</option>
                  </select>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Form Visible</span>
                  <button
                    onClick={() => toggleVisibility(l.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.visible ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                  >
                    {l.visible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 h-fit">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Grid className="h-4 w-4 text-indigo-500" />
            VIRTUAL SHEET PREVIEW
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">Here is a mockup sequence of sections in the live registration sheet:</p>
          
          <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3 text-xs">
            {layouts.filter(l => l.visible).map(l => (
              <div key={l.id} className="p-2 border border-dashed border-indigo-200 bg-indigo-50/20 rounded font-semibold text-indigo-700 flex items-center justify-between">
                <span>{l.sectionName}</span>
                <span className="text-[9px] bg-indigo-100 px-1.5 py-0.5 rounded font-bold">{l.columns} Span</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. PRODUCT ATTRIBUTES DIRECTORY TAB
// ==========================================
export function AttributesTab() {
  const [attributes, setAttributes] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_attributes');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'a1', code: 'opt_size', label: 'Size Dimensions', type: 'Select', values: 'S, M, L, XL, XXL' },
      { id: 'a2', code: 'opt_color', label: 'Body Color Tone', type: 'Select', values: 'Jet Black, Cosmic Silver, Royal Blue, Rose Gold' },
      { id: 'a3', code: 'opt_voltage', label: 'Voltage Power Input', type: 'Select', values: '110V, 220V, Universal USB-C' },
      { id: 'a4', code: 'opt_material', label: 'Upholstery Material', type: 'Text', values: 'Mesh Fabric, Full Grain Leather, Alcantara Suede' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_attributes', JSON.stringify(attributes));
  }, [attributes]);

  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Select');
  const [values, setValues] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !label) return;
    const newAttr = {
      id: 'attr_' + Date.now(),
      code: code.toLowerCase().replace(/\s+/g, '_'),
      label,
      type,
      values
    };
    setAttributes([...attributes, newAttr]);
    setCode('');
    setLabel('');
    setValues('');
    setShowAdd(false);
  };

  const deleteAttr = (id: string) => {
    setAttributes(attributes.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Attributes Option Index</h2>
          <p className="text-xs text-slate-400 mt-1">Configure drop-down attributes option arrays like Color, Fabric, size, voltage and load limits.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Tags className="h-4 w-4" />
          <span>Add Global Attribute</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Option Dictionary Row</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Unique Option Code</label>
              <input
                type="text"
                required
                placeholder="e.g., opt_voltage"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono text-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Display Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Input Voltage Power"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Data Display Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="Select">Dropdown list selection</option>
                <option value="Multiselect">Checkbox Multiselect list</option>
                <option value="Text">Arbitrary User-Entered Text field</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Option Values (comma separated)</label>
              <input
                type="text"
                placeholder="e.g., 110V, 220V, 380V Industrial"
                value={values}
                onChange={e => setValues(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Compile Option
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attributes.map((a) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Tags className="h-4 w-4 text-indigo-500" />
                  {a.label}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Property Code: <span className="text-indigo-600">{a.code}</span></p>
              </div>
              <button
                onClick={() => deleteAttr(a.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5">Allowed Values Matrix</span>
              <div className="flex flex-wrap gap-1.5">
                {a.values.split(',').map((v: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/50">
                    {v.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 7. BRAND MASTER DIRECTORY TAB
// ==========================================
export function BrandsTab() {
  const [brands, setBrands] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_brands');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'b1', name: 'Nexova Tech', code: 'BR-NXV', country: 'United States', productsCount: 45, status: 'Active', bg: 'bg-indigo-500 text-white' },
      { id: 'b2', name: 'AeroFiber Wear', code: 'BR-AFB', country: 'Germany', productsCount: 22, status: 'Active', bg: 'bg-emerald-500 text-white' },
      { id: 'b3', name: 'RawPack Materials', code: 'BR-RPK', country: 'Japan', productsCount: 8, status: 'Active', bg: 'bg-amber-500 text-white' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_brands', JSON.stringify(brands));
  }, [brands]);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [status, setStatus] = useState('Active');
  const [accent, setAccent] = useState('indigo');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    const bgMap: Record<string, string> = {
      indigo: 'bg-indigo-500 text-white',
      emerald: 'bg-emerald-500 text-white',
      amber: 'bg-amber-500 text-white',
      rose: 'bg-rose-500 text-white',
      purple: 'bg-purple-500 text-white'
    };
    const newBrand = {
      id: 'brand_' + Date.now(),
      name,
      code: code.toUpperCase(),
      country,
      productsCount: 0,
      status,
      bg: bgMap[accent] || 'bg-indigo-500 text-white'
    };
    setBrands([...brands, newBrand]);
    setName('');
    setCode('');
    setShowAdd(false);
  };

  const deleteBrand = (id: string) => {
    setBrands(brands.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Brands Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage global brand assignments, country profiles, website domains, and catalog associations.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Award className="h-4 w-4" />
          <span>New Brand Master</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Create Brand Registry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Brand Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Nike Inc"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Prefix SKU Code</label>
              <input
                type="text"
                required
                placeholder="e.g., BR-NKE"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono text-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country of Origin</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Visual Color Theme</label>
              <select
                value={accent}
                onChange={e => setAccent(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="indigo">Indigo Blue</option>
                <option value="emerald">Emerald Green</option>
                <option value="amber">Amber Gold</option>
                <option value="rose">Rose Red</option>
                <option value="purple">Purple Haze</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Audit Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Active">Active / Approved</option>
                <option value="Review">Under Corporate Review</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Save Brand
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {brands.map((b) => (
          <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${b.bg} flex items-center justify-center font-bold text-xs uppercase tracking-wide`}>
                {b.code.substring(3, 6) || b.code.substring(0, 3)}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-slate-400" />
                  {b.name}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Code: <span className="text-indigo-600 font-bold">{b.code}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 mt-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Country Profile</span>
                <span className="font-semibold text-slate-600">{b.country}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Products</span>
                <span className="font-bold text-indigo-600">{b.productsCount} catalog items</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {b.status}
              </span>
              <button
                onClick={() => deleteBrand(b.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 8. MANUFACTURERS REGISTER TAB
// ==========================================
export function ManufacturersTab() {
  const [manufacturers, setManufacturers] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_manufacturers');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'mf1', name: 'AeroSpace Global Corp', country: 'United States', rating: 5, contact: 'ops@aerospace.com', phone: '+1 (555) 489-0012', status: 'Approved' },
      { id: 'mf2', name: 'Tokyo Electronics Lab', country: 'Japan', rating: 4, contact: 'supply@tel-japan.jp', phone: '+81 3-5555-1234', status: 'Approved' },
      { id: 'mf3', name: 'Deutsche Werkzeuge GmbH', country: 'Germany', rating: 5, contact: 'procurement@deutsche.de', phone: '+49 89 555-6789', status: 'Approved' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_manufacturers', JSON.stringify(manufacturers));
  }, [manufacturers]);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United States');
  const [rating, setRating] = useState('5');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Approved');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newMfg = {
      id: 'mfg_' + Date.now(),
      name,
      country,
      rating: Number(rating) || 5,
      contact,
      phone,
      status
    };
    setManufacturers([...manufacturers, newMfg]);
    setName('');
    setContact('');
    setPhone('');
    setShowAdd(false);
  };

  const deleteMfg = (id: string) => {
    setManufacturers(manufacturers.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Manufacturers Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage external OEM partners, factory compliance audits, quality ratings, and raw materials suppliers.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Factory className="h-4 w-4" />
          <span>New Manufacturer Master</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Create Manufacturer Registry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Factory / Corporate Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Intel Corp"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country of Operations</label>
              <input
                type="text"
                required
                placeholder="e.g., Taiwan"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trust Rating (1-5 Stars)</label>
              <select
                value={rating}
                onChange={e => setRating(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="5">⭐⭐⭐⭐⭐ (5 - Elite Class)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Highly Compliant)</option>
                <option value="3">⭐⭐⭐ (3 - Audited OK)</option>
                <option value="2">⭐⭐ (2 - Suspended/Risk)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Corporate Email</label>
              <input
                type="email"
                placeholder="procurement@factory.com"
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Direct Phone</label>
              <input
                type="text"
                placeholder="+886 2 5555 1234"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Approval status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Approved">Approved Partner</option>
                <option value="Suspended">Suspended / Pending Audit</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Save Registry
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {manufacturers.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {m.country}
                </span>
                <span className="text-amber-500 text-xs font-bold font-mono">{'⭐'.repeat(m.rating)}</span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Factory className="h-4 w-4 text-slate-400" />
                  {m.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Email: <span className="text-slate-600 font-bold">{m.contact || 'N/A'}</span></p>
                <p className="text-[10px] text-slate-400">Phone: <span className="text-slate-600 font-bold">{m.phone || 'N/A'}</span></p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {m.status}
              </span>
              <button
                onClick={() => deleteMfg(m.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 9. PRICING ENGINE TAB
// ==========================================
export function PricingEngineTab({ products, onUpdateProducts }: TabProps) {
  const [markupRules, setMarkupRules] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_pricing_rules');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'p1', category: 'Electronics', standardMarkup: 30, discountLimit: 10, roundingRule: 'Round up to nearest 0.99' },
      { id: 'p2', category: 'Apparel', standardMarkup: 150, discountLimit: 25, roundingRule: 'Round down to nearest 0.95' },
      { id: 'p3', category: 'Raw Materials', standardMarkup: 15, discountLimit: 5, roundingRule: 'No rounding' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_pricing_rules', JSON.stringify(markupRules));
  }, [markupRules]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [cost, setCost] = useState(selectedProduct?.cost.toString() || '0');
  const [markup, setMarkup] = useState('30');
  const [suggested, setSuggested] = useState(0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    if (selectedProduct) {
      setCost(selectedProduct.cost.toString());
    }
  }, [selectedProduct]);

  useEffect(() => {
    const costVal = Number(cost) || 0;
    const markupVal = Number(markup) || 0;
    const markupAmt = costVal * (markupVal / 100);
    const suggestedPrice = costVal + markupAmt;
    setSuggested(Number(suggestedPrice.toFixed(2)));
    setProfit(Number(markupAmt.toFixed(2)));
  }, [cost, markup]);

  const updateProductPrice = () => {
    if (!selectedProduct || !onUpdateProducts) return;
    const updated = products.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          price: suggested,
          cost: Number(cost) || p.cost
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    alert(`Successfully compiled & updated pricing for: ${selectedProduct.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Markup pricing & Margins Engine</h2>
          <p className="text-xs text-slate-400 mt-1">Configure default profit percentage guidelines per category or run our interactive margin simulator.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CATEGORY BASE RULES</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {markupRules.map((rule) => (
              <div key={rule.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {rule.category}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Markup: <span className="text-indigo-600">+{rule.standardMarkup}%</span></h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Max allowed discount: <span className="font-semibold text-rose-600">{rule.discountLimit}%</span></p>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">{rule.roundingRule}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-4 h-fit">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100 pb-2">
            <Calculator className="h-4 w-4 text-indigo-600" />
            MARGIN SIMULATOR LAB
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-indigo-700 mb-1">Target Product Master</label>
              <select
                value={selectedProduct?.id || ''}
                onChange={e => {
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod) setSelectedProduct(prod);
                }}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-indigo-700 mb-1">Base Cost ($)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-indigo-700 mb-1">Target Markup (%)</label>
                <input
                  type="number"
                  value={markup}
                  onChange={e => setMarkup(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-indigo-600"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span>Calculated Gross Profit:</span>
                <span className="font-bold text-slate-700">+${profit}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-700 font-bold border-t border-indigo-50 pt-2 text-sm">
                <span>Target Retail Price:</span>
                <span>${suggested}</span>
              </div>
            </div>

            <button
              onClick={updateProductPrice}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Apply Pricing to Product Master</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. DISCOUNT MATRIX TAB
// ==========================================
export function DiscountMatrixTab() {
  const [matrix, setMatrix] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_discount_matrix');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'dm1', tier: 'Wholesale Buyer', category: 'Electronics', minQty: 10, type: 'Percentage', value: 10, validity: 'Dec 2026' },
      { id: 'dm2', tier: 'Distributor VIP', category: 'Electronics', minQty: 50, type: 'Percentage', value: 18, validity: 'Dec 2026' },
      { id: 'dm3', tier: 'Standard Retail', category: 'Apparel', minQty: 5, type: 'Percentage', value: 5, validity: 'Jul 2026' },
      { id: 'dm4', tier: 'Distributor VIP', category: 'Apparel', minQty: 25, type: 'Percentage', value: 15, validity: 'Jul 2026' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_discount_matrix', JSON.stringify(matrix));
  }, [matrix]);

  const [showAdd, setShowAdd] = useState(false);
  const [tier, setTier] = useState('Wholesale Buyer');
  const [category, setCategory] = useState('Electronics');
  const [minQty, setMinQty] = useState('10');
  const [type, setType] = useState('Percentage');
  const [value, setValue] = useState('10');
  const [validity, setValidity] = useState('Dec 2026');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule = {
      id: 'disc_' + Date.now(),
      tier,
      category,
      minQty: Number(minQty) || 1,
      type,
      value: Number(value) || 0,
      validity
    };
    setMatrix([...matrix, newRule]);
    setShowAdd(false);
  };

  const deleteRule = (id: string) => {
    setMatrix(matrix.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Corporate Discount Matrix</h2>
          <p className="text-xs text-slate-400 mt-1">Manage wholesale tier volume criteria, percentage cuts, and customer category exceptions.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Percent className="h-4 w-4" />
          <span>New Discount Rule</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Tier Discount Bracket</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer Group Tier</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Standard Retail">Standard Retail</option>
                <option value="Wholesale Buyer">Wholesale Buyer</option>
                <option value="Distributor VIP">Distributor VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Electronics">Electronics</option>
                <option value="Apparel">Apparel</option>
                <option value="Raw Materials">Raw Materials</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Min Order Quantity Threshold</label>
              <input
                type="number"
                required
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Discount Unit</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat">Flat Price Cut ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Discount Value</label>
              <input
                type="number"
                required
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Validity Period</label>
              <input
                type="text"
                value={validity}
                onChange={e => setValidity(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Mount Bracket
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <th className="p-4">Customer Tier</th>
              <th className="p-4">Product Category</th>
              <th className="p-4 text-center">Minimum Vol (Qty)</th>
              <th className="p-4 text-center">Discount Value</th>
              <th className="p-4 text-center">Validity End</th>
              <th className="p-4 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{rule.tier}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {rule.category}
                  </span>
                </td>
                <td className="p-4 text-center font-semibold text-slate-600">{rule.minQty} units</td>
                <td className="p-4 text-center font-bold text-indigo-600">
                  {rule.type === 'Percentage' ? `${rule.value}% Off` : `$${rule.value} Flat Off`}
                </td>
                <td className="p-4 text-center font-mono text-xs text-slate-400">{rule.validity}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 11. PROMOTION MANAGER TAB
// ==========================================
export function PromotionManagerTab() {
  const [promos, setPromos] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_inventory_promotions');
    if (saved) return JSON.parse(saved);
    if (!DEMO_SEED_ENABLED) return [];
    return [
      { id: 'pr1', name: 'Summer Carnival Deal', code: 'SUMMER30', type: 'Flat Percentage', value: 30, active: true },
      { id: 'pr2', name: 'Raw Procurement Bonus', code: 'RAWFREE', type: 'Buy X Get Y (BOGO)', value: 1, active: true },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nexova_inventory_promotions', JSON.stringify(promos));
  }, [promos]);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('Flat Percentage');
  const [value, setValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    const newPromo = {
      id: 'pr_' + Date.now(),
      name,
      code: code.toUpperCase().replace(/\s+/g, ''),
      type,
      value: Number(value) || 0,
      active: true
    };
    setPromos([...promos, newPromo]);
    setName('');
    setCode('');
    setValue('');
    setShowAdd(false);
  };

  const toggleStatus = (id: string) => {
    setPromos(promos.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const deletePromo = (id: string) => {
    setPromos(promos.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Campaign & Promotion Manager</h2>
          <p className="text-xs text-slate-400 mt-1">Deploy seasonal coupon vouchers, BOGO rules, and scheduled discount campaigns.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate Promo Code</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Coupon Promotion Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Campaign Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Black Friday Madness"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alphanumeric Code</label>
              <input
                type="text"
                required
                placeholder="e.g., BLACKFRI50"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono text-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Promo Class</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
              >
                <option value="Flat Percentage">Percentage off (%)</option>
                <option value="Buy X Get Y (BOGO)">Buy X Get Y (BOGO Free items)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reward Multiplier / Value</label>
              <input
                type="number"
                required
                placeholder="e.g., 15"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-md"
            >
              Deploy Coupon
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-indigo-500" />
                  {p.name}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Coupon code: <span className="text-indigo-600 font-bold">{p.code}</span></p>
              </div>
              <button
                onClick={() => deletePromo(p.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Offer Class</span>
                <span className="font-semibold text-slate-600">{p.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Reward Impact</span>
                <span className="font-bold text-indigo-600">{p.type === 'Flat Percentage' ? `${p.value}% Cut` : `Get ${p.value} Gift Unit`}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
              <button
                onClick={() => toggleStatus(p.id)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
              >
                {p.active ? 'Active & Serving' : 'Inactive / Suspended'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
