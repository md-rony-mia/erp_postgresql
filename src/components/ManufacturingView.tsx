import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Boxes,
  FileText,
  GitBranch,
  Wrench,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  Warehouse
} from 'lucide-react';

import PageStandardsWrapper from './PageStandardsWrapper';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';
import { Product, Transaction, AccountHead } from '../types';

interface ManufacturingViewProps {
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  transactions?: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  accountHeads?: AccountHead[];
  setAccountHeads?: React.Dispatch<React.SetStateAction<AccountHead[]>>;
}

interface BOMItem {
  id: string;
  productName: string; // End product
  sku: string;
  rawMaterials: { name: string; qty: number; unit: string }[];
  estimatedCost: number;
}

interface WorkCenter {
  id: string;
  name: string;
  operation: string;
  hourlyCost: number;
  capacity: string;
  status: 'Operational' | 'Maintenance' | 'Idle';
}

interface ProductionOrder {
  id: string;
  bomId: string;
  productName: string;
  quantityToProduce: number;
  workcenter: string;
  startDate: string;
  status: 'Draft' | 'Queued' | 'In Progress' | 'Completed' | 'Quality Held';
  batchNo: string;
}

interface QualityInspection {
  id: string;
  productionOrderNo: string;
  productName: string;
  inspectedBy: string;
  date: string;
  parameters: { name: string; value: string; pass: boolean }[];
  finalDecision: 'Passed' | 'Rejected' | 'Rework';
}

interface MRPReportItem {
  materialName: string;
  currentStock: number;
  requiredForOrders: number;
  deficit: number;
  suggestedAction: string;
}

const DEFAULT_BOMS: BOMItem[] = [
  {
    id: 'bom1',
    productName: 'TMT Steel Bar 12mm (Ton)',
    sku: 'STL-12MM-TMT',
    rawMaterials: [
      { name: 'Iron Ore Billets', qty: 1.05, unit: 'Tons' },
      { name: 'Coal Coke Catalyst', qty: 0.12, unit: 'Tons' },
      { name: 'Hardening Chemical Compound', qty: 5, unit: 'Liters' }
    ],
    estimatedCost: 65000
  },
  {
    id: 'bom2',
    productName: 'Portland Composite Cement (100 Bags)',
    sku: 'CMT-PCC-50KG',
    rawMaterials: [
      { name: 'Clinker Raw Powder', qty: 3.8, unit: 'Tons' },
      { name: 'Gypsum Stabilizer', qty: 0.2, unit: 'Tons' },
      { name: 'Fly Ash Filler', qty: 1.0, unit: 'Tons' }
    ],
    estimatedCost: 32000
  }
];

const DEFAULT_WORKCENTERS: WorkCenter[] = [
  { id: 'wc1', name: 'Rolling Mill Workcenter 01', operation: 'Steel heating, rolling, and rapid cooling', hourlyCost: 4500, capacity: '20 Tons/Hr', status: 'Operational' },
  { id: 'wc2', name: 'Cement Blending Station 03', operation: 'Raw clinker, gypsum, and ash mixing', hourlyCost: 2800, capacity: '50 Bags/Min', status: 'Operational' },
  { id: 'wc3', name: 'Chemical Treatment Unit', operation: 'Additive liquid spraying and micro audits', hourlyCost: 1500, capacity: '100 Liters/Hr', status: 'Maintenance' }
];

const DEFAULT_PRODUCTION_ORDERS: ProductionOrder[] = [
  { id: 'po1', bomId: 'bom1', productName: 'TMT Steel Bar 12mm (Ton)', quantityToProduce: 150, workcenter: 'Rolling Mill Workcenter 01', startDate: '2026-07-01', status: 'In Progress', batchNo: 'BCH-STL-202607-A' },
  { id: 'po2', bomId: 'bom2', productName: 'Portland Composite Cement (100 Bags)', quantityToProduce: 50, workcenter: 'Cement Blending Station 03', startDate: '2026-07-05', status: 'Queued', batchNo: 'BCH-CMT-202607-F' }
];

const DEFAULT_QUALITY_INSPECTIONS: QualityInspection[] = [
  {
    id: 'qi1',
    productionOrderNo: 'BCH-STL-202607-A',
    productName: 'TMT Steel Bar 12mm (Ton)',
    inspectedBy: 'Engr. Jamil Chowdhury',
    date: '2026-07-05',
    parameters: [
      { name: 'Yield Strength (Tension Test)', value: '520 MPa (Req: >500)', pass: true },
      { name: 'Elongation Percentage', value: '16.5% (Req: >15%)', pass: true },
      { name: 'Section Weight Deflection', value: '+0.2% (Req: +/- 1.5%)', pass: true }
    ],
    finalDecision: 'Passed'
  }
];

export default function ManufacturingView({
  activeSubTab = 'bom',
  currentUser,
  products = [],
  setProducts,
  transactions = [],
  setTransactions,
  accountHeads = [],
  setAccountHeads
}: ManufacturingViewProps) {
  const currentTab = ['bom', 'routing', 'production', 'mrp', 'quality'].includes(activeSubTab)
    ? activeSubTab
    : 'bom';

  // --- LOCAL PERSISTED STATES ---
  const [boms, setBoms] = useState<BOMItem[]>([]);
  const [workcenters, setWorkcenters] = useState<WorkCenter[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FIREBASE DATA LOAD & ONE-TIME MIGRATION HELPER ---
  useEffect(() => {
    async function loadAndMigrate() {
      try {
        setLoading(true);

        // Read legacy local storage data if present
        const legacyBoms = localStorage.getItem('nexova_mfg_boms');
        const legacyWorkcenters = localStorage.getItem('nexova_mfg_workcenters');
        const legacyOrders = localStorage.getItem('nexova_mfg_production_orders');
        const legacyInspections = localStorage.getItem('nexova_mfg_inspections');

        let initialBoms = DEFAULT_BOMS;
        let initialWorkcenters = DEFAULT_WORKCENTERS;
        let initialOrders = DEFAULT_PRODUCTION_ORDERS;
        let initialInspections = DEFAULT_QUALITY_INSPECTIONS;

        if (legacyBoms) {
          try { initialBoms = JSON.parse(legacyBoms); } catch (e) {
            // Intentionally silent: fallback to default if legacy storage string is corrupted
            console.error(e);
          }
        }
        if (legacyWorkcenters) {
          try { initialWorkcenters = JSON.parse(legacyWorkcenters); } catch (e) {
            // Intentionally silent: fallback to default if legacy storage string is corrupted
            console.error(e);
          }
        }
        if (legacyOrders) {
          try { initialOrders = JSON.parse(legacyOrders); } catch (e) {
            // Intentionally silent: fallback to default if legacy storage string is corrupted
            console.error(e);
          }
        }
        if (legacyInspections) {
          try { initialInspections = JSON.parse(legacyInspections); } catch (e) {
            // Intentionally silent: fallback to default if legacy storage string is corrupted
            console.error(e);
          }
        }

        // Load & seed Firestore collections
        const seededBoms = await seedCollectionIfEmpty('boms', initialBoms);
        setBoms(seededBoms || []);

        const seededWorkcenters = await seedCollectionIfEmpty('workcenters', initialWorkcenters);
        setWorkcenters(seededWorkcenters || []);

        const seededOrders = await seedCollectionIfEmpty('productionOrders', initialOrders);
        setProductionOrders(seededOrders || []);

        const seededInspections = await seedCollectionIfEmpty('qualityInspections', initialInspections);
        setQualityInspections(seededInspections || []);

        // Clean up legacy localStorage item so it doesn't run again
        localStorage.setItem('nexova_mfg_migrated', 'true');
        localStorage.removeItem('nexova_mfg_boms');
        localStorage.removeItem('nexova_mfg_workcenters');
        localStorage.removeItem('nexova_mfg_production_orders');
        localStorage.removeItem('nexova_mfg_inspections');

      } catch (err) {
        // Intentionally silent: background data migration on component mount
        console.error("Manufacturing data fetch/migration failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAndMigrate();
  }, []);

  // --- FIRESTORE PERSISTENCE SYNCHRONIZERS ---
  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('boms', boms);
  }, [boms, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('workcenters', workcenters);
  }, [workcenters, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('productionOrders', productionOrders);
  }, [productionOrders, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('qualityInspections', qualityInspections);
  }, [qualityInspections, loading]);

  // --- MODAL FORM STATES ---
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [bomForm, setBomForm] = useState({
    productName: '', sku: '', estimatedCost: '', materialName1: '', materialQty1: '', materialUnit1: ''
  });

  const [showProductionModal, setShowProductionModal] = useState(false);
  const [prodForm, setProdForm] = useState({
    bomId: '', quantityToProduce: '', workcenter: 'Rolling Mill Workcenter 01'
  });

  const [showQCModal, setShowQCModal] = useState(false);
  const [qcForm, setQcForm] = useState({
    productionOrderNo: '', productName: '', inspectedBy: 'Engr. Jamil Chowdhury', decision: 'Passed' as QualityInspection['finalDecision']
  });

  // --- MRP ENGINE CALCULATION ---
  const handleRunMRP = (): MRPReportItem[] => {
    // Collect raw material demands from active production orders
    const materialDemands: Record<string, { required: number; unit: string }> = {};

    productionOrders.forEach(order => {
      if (order.status === 'In Progress' || order.status === 'Queued') {
        const bom = boms.find(b => b.id === order.bomId);
        if (bom) {
          bom.rawMaterials.forEach(mat => {
            const totalRequired = mat.qty * order.quantityToProduce;
            if (materialDemands[mat.name]) {
              materialDemands[mat.name].required += totalRequired;
            } else {
              materialDemands[mat.name] = { required: totalRequired, unit: mat.unit };
            }
          });
        }
      }
    });

    // Mock stock comparison
    const rawStockValues: Record<string, number> = {
      'Iron Ore Billets': 120,
      'Coal Coke Catalyst': 10,
      'Hardening Chemical Compound': 800,
      'Clinker Raw Powder': 150,
      'Gypsum Stabilizer': 5,
      'Fly Ash Filler': 40
    };

    return Object.keys(materialDemands).map(matName => {
      const current = rawStockValues[matName] || 0;
      const req = materialDemands[matName].required;
      const deficit = Math.max(0, req - current);
      return {
        materialName: matName,
        currentStock: current,
        requiredForOrders: Math.round(req * 100) / 100,
        deficit: Math.round(deficit * 100) / 100,
        suggestedAction: deficit > 0
          ? `Draft Purchase Order for ${Math.ceil(deficit * 1.2)} ${materialDemands[matName].unit} from primary supplier`
          : 'Stock sufficient. No action needed.'
      };
    });
  };

  const mrpData = handleRunMRP();

  // --- ACTIONS ---
  const handleCreateBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomForm.productName || !bomForm.sku) return;
    const newBOM: BOMItem = {
      id: `bom_dynamic_${Date.now()}`,
      productName: bomForm.productName,
      sku: bomForm.sku,
      rawMaterials: bomForm.materialName1 ? [
        { name: bomForm.materialName1, qty: parseFloat(bomForm.materialQty1) || 1, unit: bomForm.materialUnit1 || 'Units' }
      ] : [],
      estimatedCost: parseFloat(bomForm.estimatedCost) || 0
    };
    setBoms([...boms, newBOM]);
    setBomForm({ productName: '', sku: '', estimatedCost: '', materialName1: '', materialQty1: '', materialUnit1: '' });
    setShowBOMModal(false);
  };

  const handleCreateProductionOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.bomId || !prodForm.quantityToProduce) return;
    const targetBom = boms.find(b => b.id === prodForm.bomId);
    const newPO: ProductionOrder = {
      id: `mfg_po_${Date.now()}`,
      bomId: prodForm.bomId,
      productName: targetBom ? targetBom.productName : 'Custom Assembly',
      quantityToProduce: parseInt(prodForm.quantityToProduce) || 10,
      workcenter: prodForm.workcenter,
      startDate: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      batchNo: `BCH-GEN-${Date.now().toString().slice(-4)}`
    };
    setProductionOrders([newPO, ...productionOrders]);
    setProdForm({ bomId: '', quantityToProduce: '', workcenter: 'Rolling Mill Workcenter 01' });
    setShowProductionModal(false);
  };

  const handleCompleteOrder = (id: string) => {
    const orderToComplete = productionOrders.find((p) => p.id === id);
    if (!orderToComplete || orderToComplete.status === 'Completed') return;

    const bom =
      boms.find((b) => b.id === orderToComplete.bomId) ||
      boms.find(
        (b) =>
          b.productName.toLowerCase().includes(orderToComplete.productName.toLowerCase()) ||
          orderToComplete.productName.toLowerCase().includes(b.productName.toLowerCase())
      );

    const qtyToProduce = orderToComplete.quantityToProduce || 1;
    let totalProductionCost = 0;

    // 1. Update stock for raw materials (decrease) & finished goods (increase)
    if (setProducts) {
      setProducts((prevProducts) => {
        const updated = [...prevProducts];

        // Process raw materials from BOM
        if (bom && bom.rawMaterials) {
          bom.rawMaterials.forEach((rm) => {
            const requiredQty = rm.qty * qtyToProduce;
            const rmIdx = updated.findIndex(
              (p) =>
                p.name.toLowerCase().includes(rm.name.toLowerCase()) ||
                rm.name.toLowerCase().includes(p.name.toLowerCase())
            );

            if (rmIdx !== -1) {
              const rawMat = updated[rmIdx];
              const matCost = rawMat.cost || 0;
              totalProductionCost += matCost * requiredQty;
              updated[rmIdx] = {
                ...rawMat,
                stock: Math.max(0, rawMat.stock - requiredQty),
              };
            } else {
              totalProductionCost +=
                (bom.estimatedCost / Math.max(1, bom.rawMaterials.length)) * requiredQty;
            }
          });
        }

        if (totalProductionCost === 0 && bom) {
          totalProductionCost = bom.estimatedCost * qtyToProduce;
        } else if (totalProductionCost === 0) {
          totalProductionCost = 5000 * qtyToProduce;
        }

        // Process Finished Goods product
        const fgIdx = updated.findIndex(
          (p) =>
            p.name.toLowerCase().includes(orderToComplete.productName.toLowerCase()) ||
            orderToComplete.productName.toLowerCase().includes(p.name.toLowerCase()) ||
            (bom && p.sku === bom.sku)
        );

        if (fgIdx !== -1) {
          const fg = updated[fgIdx];
          updated[fgIdx] = {
            ...fg,
            stock: fg.stock + qtyToProduce,
          };
        } else {
          // Add new finished goods product if not exists
          const unitCost = totalProductionCost / qtyToProduce;
          const newFG: Product = {
            id: `fg_${Date.now()}`,
            name: orderToComplete.productName,
            sku: bom?.sku || `FG-${Date.now().toString().slice(-4)}`,
            category: 'Finished Goods',
            unit: 'Pcs',
            warehouse: 'Main Warehouse',
            price: Math.round(unitCost * 1.25),
            cost: unitCost,
            stock: qtyToProduce,
            alertQty: 10,
          };
          updated.push(newFG);
        }

        return updated;
      });
    }

    if (totalProductionCost === 0) {
      totalProductionCost = (bom?.estimatedCost || 5000) * qtyToProduce;
    }

    // 2. Add Transaction record for manufacturing expense/journal
    if (setTransactions) {
      const newTx: Transaction = {
        id: `tx_mfg_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Completed production lot ${orderToComplete.batchNo} for ${orderToComplete.productName} (${qtyToProduce} Units)`,
        type: 'Expense',
        amount: totalProductionCost,
        accountId: 'ah11',
        category: 'Manufacturing Cost',
        referenceNo: orderToComplete.batchNo,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    // 3. Update Chart of Accounts (Account Heads): decrease Raw Materials Inventory & increase Finished Goods Inventory
    if (setAccountHeads) {
      setAccountHeads((prevHeads) => {
        return prevHeads.map((ah) => {
          if (
            ah.name.toLowerCase().includes('raw material') ||
            ah.code === '1041'
          ) {
            return { ...ah, balance: Math.max(0, ah.balance - totalProductionCost) };
          }
          if (
            ah.name.toLowerCase().includes('finished goods') ||
            ah.code === '1042'
          ) {
            return { ...ah, balance: ah.balance + totalProductionCost };
          }
          return ah;
        });
      });
    }

    // 4. Update status to Completed
    setProductionOrders((prevOrders) =>
      prevOrders.map((p) => {
        if (p.id === id) {
          return { ...p, status: 'Completed' as const };
        }
        return p;
      })
    );
  };

  const handleCreateQC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcForm.productionOrderNo || !qcForm.productName) return;
    const newQC: QualityInspection = {
      id: `qi_${Date.now()}`,
      productionOrderNo: qcForm.productionOrderNo,
      productName: qcForm.productName,
      inspectedBy: qcForm.inspectedBy,
      date: new Date().toISOString().split('T')[0],
      parameters: [
        { name: 'Slump Flow Audit', value: 'Passed', pass: true },
        { name: 'Chemical Concentration', value: 'Normal', pass: true }
      ],
      finalDecision: qcForm.decision
    };
    setQualityInspections([newQC, ...qualityInspections]);
    setQcForm({ productionOrderNo: '', productName: '', inspectedBy: 'Engr. Jamil Chowdhury', decision: 'Passed' });
    setShowQCModal(false);
  };

  return (
    <PageStandardsWrapper
      title="Manufacturing Control & MRP"
      subtitle="Design Bills of Materials (BOM), manage work centers, schedule runs, run automated MRP, and log QA inspections."
      loading={loading}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager', 'Production Supervisor']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'Manufacturing & MRP', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* ACTION BAR */}
        <div className="flex justify-end gap-2 pb-2">
          {currentTab === 'bom' && (
            <button
              onClick={() => setShowBOMModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure BOM</span>
            </button>
          )}
          {currentTab === 'production' && (
            <button
              onClick={() => setShowProductionModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start Production Run</span>
            </button>
          )}
          {currentTab === 'quality' && (
            <button
              onClick={() => setShowQCModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Log Quality Inspection</span>
            </button>
          )}
        </div>

      {/* CORE MATRIX TABS */}
      {currentTab === 'bom' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Bills of Materials (BOM)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map(b => (
              <div key={b.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-500 transition-colors space-y-3 bg-slate-50/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold font-mono">{b.sku}</span>
                    <h4 className="font-bold text-sm text-slate-800 mt-0.5">{b.productName}</h4>
                  </div>
                  <span className="text-xs font-extrabold text-slate-700">Cost: ৳{b.estimatedCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Material Allocation</h5>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {b.rawMaterials.map((rm) => (
                      <li key={rm.name} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded">
                        <span className="font-semibold text-slate-700">{rm.name}</span>
                        <span className="font-mono text-slate-500">{rm.qty} {rm.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'routing' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Industrial Workcenters & Operations Routing</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Workcenter Name</th>
                  <th className="py-2.5 px-4">Operation Mechanics</th>
                  <th className="py-2.5 px-4 text-right">Machine Overhead (/Hr)</th>
                  <th className="py-2.5 px-4">Throughput Capacity</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {workcenters.map(wc => (
                  <tr key={wc.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-bold text-slate-800">{wc.name}</td>
                    <td className="py-3 px-4 text-slate-600">{wc.operation}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">৳{wc.hourlyCost.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{wc.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                        wc.status === 'Operational' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        wc.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {wc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'production' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Production Lots</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Batch ID</th>
                  <th className="py-2.5 px-4">Product assembly</th>
                  <th className="py-2.5 px-4 text-center">Lot Quantity</th>
                  <th className="py-2.5 px-4">Assigned Workcenter</th>
                  <th className="py-2.5 px-4">Lot Start Date</th>
                  <th className="py-2.5 px-4">Batch Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productionOrders.map(po => (
                  <tr key={po.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{po.batchNo}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{po.productName}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">{po.quantityToProduce} Units</td>
                    <td className="py-3 px-4 font-medium text-slate-500">{po.workcenter}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{po.startDate}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                        po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        po.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status === 'In Progress' && (
                        <button
                          onClick={() => handleCompleteOrder(po.id)}
                          className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer ml-auto"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Complete Batch</span>
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

      {currentTab === 'mrp' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Material Requirements Planning (MRP Run)</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">AUTO-RUN DAILY</span>
          </div>
          <p className="text-xs text-slate-400">The MRP engine analyzes bill of materials of active production jobs against current warehouse stock quantities to calculate raw deficits.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Raw Material Name</th>
                  <th className="py-2.5 px-4 text-center">Warehouse Stock</th>
                  <th className="py-2.5 px-4 text-center">Required For Production</th>
                  <th className="py-2.5 px-4 text-center text-rose-600">Net Deficit</th>
                  <th className="py-2.5 px-4">MRP Automated Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {mrpData.map((item, idx) => (
                  <tr key={item.materialName} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-bold text-slate-800">{item.materialName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-500">{item.currentStock} Units</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{item.requiredForOrders} Units</td>
                    <td className={`py-3 px-4 text-center font-extrabold ${item.deficit > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {item.deficit > 0 ? `${item.deficit} Units` : '0'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {item.deficit > 0 ? (
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <AlertTriangle className="h-3 w-3" /> {item.suggestedAction}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">{item.suggestedAction}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'quality' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">QC Audit Trail</h3>
          <div className="space-y-4">
            {qualityInspections.map(qi => (
              <div key={qi.id} className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Lot ID: {qi.productionOrderNo}</span>
                    <h4 className="font-bold text-xs text-slate-800 mt-0.5">{qi.productName}</h4>
                  </div>
                  <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                    qi.finalDecision === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    Lot Status: {qi.finalDecision}
                  </span>
                </div>
                <div className="border-t border-slate-100/60 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lab Inspections Passed</h5>
                    <ul className="space-y-1 text-xs">
                      {qi.parameters.map((p, pIdx) => (
                        <li key={pIdx} className="flex justify-between items-center bg-white p-1.5 border border-slate-100 rounded">
                          <span className="text-slate-600">{p.name}</span>
                          <span className="font-bold text-emerald-600">{p.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col justify-end space-y-1 text-right">
                    <p>Inspected by: <strong className="text-slate-700">{qi.inspectedBy}</strong></p>
                    <p>Audit Timestamp: <strong className="font-mono text-slate-600">{qi.date}</strong></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOM MODAL */}
      {showBOMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateBOM} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Add Bill of Materials (BOM)</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Finished Product Name *</label>
                <input
                  type="text"
                  required
                  value={bomForm.productName}
                  onChange={e => setBomForm({ ...bomForm, productName: e.target.value })}
                  placeholder="e.g., Prefabricated Concrete Block (Lot)"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">System SKU *</label>
                  <input
                    type="text"
                    required
                    value={bomForm.sku}
                    onChange={e => setBomForm({ ...bomForm, sku: e.target.value })}
                    placeholder="e.g., CMT-BLOCK-A"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Estimated Production Cost</label>
                  <input
                    type="number"
                    value={bomForm.estimatedCost}
                    onChange={e => setBomForm({ ...bomForm, estimatedCost: e.target.value })}
                    placeholder="Cost (BDT)"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 space-y-2">
                <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Add Primary Ingredient</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    value={bomForm.materialName1}
                    onChange={e => setBomForm({ ...bomForm, materialName1: e.target.value })}
                    placeholder="Clinker powder"
                    className="bg-slate-50 border border-slate-200 rounded p-1 text-xs col-span-2 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={bomForm.materialQty1}
                    onChange={e => setBomForm({ ...bomForm, materialQty1: e.target.value })}
                    placeholder="Qty"
                    className="bg-slate-50 border border-slate-200 rounded p-1 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowBOMModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Save BOM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCTION MODAL */}
      {showProductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateProductionOrder} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Launch Production Run</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Bill of Materials *</label>
                <select
                  required
                  value={prodForm.bomId}
                  onChange={e => setProdForm({ ...prodForm, bomId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose BOM --</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.productName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Quantity to Manufacture *</label>
                <input
                  type="number"
                  required
                  value={prodForm.quantityToProduce}
                  onChange={e => setProdForm({ ...prodForm, quantityToProduce: e.target.value })}
                  placeholder="e.g., 100"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Assigned Workcenter Station</label>
                <select
                  value={prodForm.workcenter}
                  onChange={e => setProdForm({ ...prodForm, workcenter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                >
                  {workcenters.map(w => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowProductionModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Launch Run
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QC INSPECTION MODAL */}
      {showQCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateQC} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Log Quality Inspection</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Active Lot Batch No *</label>
                <select
                  required
                  value={qcForm.productionOrderNo}
                  onChange={e => {
                    const match = productionOrders.find(po => po.batchNo === e.target.value);
                    setQcForm({
                      ...qcForm,
                      productionOrderNo: e.target.value,
                      productName: match ? match.productName : ''
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Active Batch --</option>
                  {productionOrders.map(p => (
                    <option key={p.id} value={p.batchNo}>{p.batchNo} ({p.productName})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Inspecting Engineer</label>
                <input
                  type="text"
                  required
                  value={qcForm.inspectedBy}
                  onChange={e => setQcForm({ ...qcForm, inspectedBy: e.target.value })}
                  placeholder="e.g., Engr. Jamil Chowdhury"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Final Validation Decision</label>
                <select
                  value={qcForm.decision}
                  onChange={e => setQcForm({ ...qcForm, decision: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Passed">Passed - Release to Stock</option>
                  <option value="Rejected">Rejected - Scrap Raw Materials</option>
                  <option value="Rework">Rework Required</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowQCModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Inspection
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
    </PageStandardsWrapper>
  );
}
