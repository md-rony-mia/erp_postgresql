import React, { useState, useEffect } from 'react';
import {
  Wrench,
  TrendingUp,
  Clock,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  AlertCircle,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  FileText
} from 'lucide-react';
import PageStandardsWrapper from './PageStandardsWrapper';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

interface ServiceViewProps {
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

interface WarrantyRecord {
  id: string;
  customerName: string;
  serialNumber: string;
  productCode: string;
  activationDate: string;
  durationYears: number;
  status: 'Active' | 'Expired';
}

interface RepairRMARecord {
  id: string;
  customerName: string;
  issueDescription: string;
  technicianAssigned: string;
  costEstimate: number;
  stage: 'Assigned' | 'Diagnostics' | 'Repairing' | 'Review' | 'Dispatched';
}

interface ComplaintRecord {
  id: string;
  customerName: string;
  subject: string;
  severity: 'Low' | 'Medium' | 'Critical';
  status: 'Opened' | 'Investigating' | 'Resolved';
  dateOpened: string;
  feedbackScore?: number; // 1-5
}

interface TechnicianRecord {
  id: string;
  name: string;
  specialization: 'Concrete QC' | 'Mechanical' | 'Pneumatics' | 'Electrical';
  status: 'Available' | 'On Site' | 'Busy' | 'Leave';
  activeTicketsCount: number;
}

interface AMCRecord {
  id: string;
  corporateClient: string;
  contractType: 'Standard' | 'Gold' | 'Platinum';
  monthlyVisitDay: number;
  lastAuditDate: string;
  nextServiceDate: string;
  status: 'Active' | 'Suspended';
}

// DEFAULT MOCK SEEDS
const DEFAULT_WARRANTIES: WarrantyRecord[] = [
  { id: 'war_1', customerName: 'Mirpur Builders Ltd', serialNumber: 'SN-10294-CONCRETE', productCode: 'PC-CEM-V1', activationDate: '2026-01-10', durationYears: 3, status: 'Active' },
  { id: 'war_2', customerName: 'Savar ReadyMix Co.', serialNumber: 'SN-55310-MIXER', productCode: 'PC-MIX-X4', activationDate: '2023-05-15', durationYears: 2, status: 'Expired' },
  { id: 'war_3', customerName: 'Dhaka Airport Expansion', serialNumber: 'SN-90812-REBAR', productCode: 'PC-ST-R16', activationDate: '2026-03-01', durationYears: 5, status: 'Active' }
];

const DEFAULT_REPAIRS: RepairRMARecord[] = [
  { id: 'rep_1', customerName: 'Savar ReadyMix Co.', issueDescription: 'Hydraulic drum mixer gear alignment deviation.', technicianAssigned: 'Md. Rafiqul Islam', costEstimate: 45000, stage: 'Repairing' },
  { id: 'rep_2', customerName: 'Mirpur Builders Ltd', issueDescription: 'Silo load cell moisture sensor recalibration.', technicianAssigned: 'Anisur Rahman', costEstimate: 12000, stage: 'Diagnostics' }
];

const DEFAULT_COMPLAINTS: ComplaintRecord[] = [
  { id: 'comp_1', customerName: 'Sajib Block Factory', subject: 'Curing strength batch #44 density mismatch.', severity: 'Critical', status: 'Investigating', dateOpened: '2026-07-08', feedbackScore: 3 },
  { id: 'comp_2', customerName: 'Meghna Dredging Allied', subject: 'Dispatch manifest transit lag of 4 hours.', severity: 'Medium', status: 'Resolved', dateOpened: '2026-07-05', feedbackScore: 5 }
];

const DEFAULT_TECHNICIANS: TechnicianRecord[] = [
  { id: 'tech_1', name: 'Md. Rafiqul Islam', specialization: 'Mechanical', status: 'Busy', activeTicketsCount: 2 },
  { id: 'tech_2', name: 'Anisur Rahman', specialization: 'Concrete QC', status: 'On Site', activeTicketsCount: 1 },
  { id: 'tech_3', name: 'Sajid Khan', specialization: 'Electrical', status: 'Available', activeTicketsCount: 0 },
  { id: 'tech_4', name: 'Zahid Ahmed', specialization: 'Pneumatics', status: 'Available', activeTicketsCount: 0 }
];

const DEFAULT_AMCS: AMCRecord[] = [
  { id: 'amc_1', corporateClient: 'Bashundhara ReadyMix', contractType: 'Platinum', monthlyVisitDay: 12, lastAuditDate: '2026-06-12', nextServiceDate: '2026-07-12', status: 'Active' },
  { id: 'amc_2', corporateClient: 'Purbachal Precast Ltd', contractType: 'Gold', monthlyVisitDay: 20, lastAuditDate: '2026-06-20', nextServiceDate: '2026-07-20', status: 'Active' }
];

export default function ServiceView({ activeSubTab = 'warranty', currentUser }: ServiceViewProps) {
  const [currentTab, setCurrentTab] = useState<string>(activeSubTab);

  // Sync subTab with sidebar selection
  useEffect(() => {
    if (['warranty', 'repairs', 'complaints', 'technicians', 'amc'].includes(activeSubTab)) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  // --- COMPONENT STATE ---
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [repairs, setRepairs] = useState<RepairRMARecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianRecord[]>([]);
  const [amcs, setAmcs] = useState<AMCRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalClaims: 0,
    activeRepairs: 0,
    remediationCost: 0,
    slaCompliance: 'N/A'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Warranties
      const legacyWar = localStorage.getItem('nexova_service_warranties');
      let initialWar = DEFAULT_WARRANTIES;
      if (legacyWar) {
        try { initialWar = JSON.parse(legacyWar); } catch (e) {}
      }
      const parsedWar = await seedCollectionIfEmpty('serviceWarranties', initialWar);
      setWarranties(parsedWar || []);
      if (legacyWar) {
        localStorage.removeItem('nexova_service_warranties');
      }

      // 2. Repairs
      const legacyRep = localStorage.getItem('nexova_service_repairs');
      let initialRep = DEFAULT_REPAIRS;
      if (legacyRep) {
        try { initialRep = JSON.parse(legacyRep); } catch (e) {}
      }
      const parsedRep = await seedCollectionIfEmpty('serviceRepairs', initialRep);
      setRepairs(parsedRep || []);
      if (legacyRep) {
        localStorage.removeItem('nexova_service_repairs');
      }

      // 3. Complaints
      const legacyComp = localStorage.getItem('nexova_service_complaints');
      let initialComp = DEFAULT_COMPLAINTS;
      if (legacyComp) {
        try { initialComp = JSON.parse(legacyComp); } catch (e) {}
      }
      const parsedComp = await seedCollectionIfEmpty('serviceComplaints', initialComp);
      setComplaints(parsedComp || []);
      if (legacyComp) {
        localStorage.removeItem('nexova_service_complaints');
      }

      // 4. Technicians
      const legacyTech = localStorage.getItem('nexova_service_technicians');
      let initialTech = DEFAULT_TECHNICIANS;
      if (legacyTech) {
        try { initialTech = JSON.parse(legacyTech); } catch (e) {}
      }
      const parsedTech = await seedCollectionIfEmpty('serviceTechnicians', initialTech);
      setTechnicians(parsedTech || []);
      if (legacyTech) {
        localStorage.removeItem('nexova_service_technicians');
      }

      // 5. AMCs
      const legacyAmc = localStorage.getItem('nexova_service_amcs');
      let initialAmc = DEFAULT_AMCS;
      if (legacyAmc) {
        try { initialAmc = JSON.parse(legacyAmc); } catch (e) {}
      }
      const parsedAmc = await seedCollectionIfEmpty('serviceAmcs', initialAmc);
      setAmcs(parsedAmc || []);
      if (legacyAmc) {
        localStorage.removeItem('nexova_service_amcs');
      }

      // Calculations for metrics
      const totalClaims = (parsedComp || []).filter(c => c.status !== 'Resolved').length + (parsedRep || []).length;
      const activeRepairs = (parsedRep || []).filter(r => r.stage !== 'Dispatched').length;
      const remediationCost = (parsedRep || []).reduce((sum, r) => sum + (Number(r.costEstimate) || 0), 0);

      const totalComplaintsForSla = (parsedComp || []).length;
      const resolvedComplaints = (parsedComp || []).filter(c => c.status === 'Resolved').length;
      const slaCompliance = totalComplaintsForSla > 0
        ? `${((resolvedComplaints / totalComplaintsForSla) * 100).toFixed(1)}%`
        : 'N/A';

      setMetrics({
        totalClaims,
        activeRepairs,
        remediationCost,
        slaCompliance
      });
    } catch (e: any) {
      console.error(e);
      window.alert(`Error loading service registry data: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentTab]);

  // --- INTERACTIVE WARRANTY VALIDATOR ---
  const [validateSerial, setValidateSerial] = useState('');
  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'expired' | 'not_found' | null;
    record?: WarrantyRecord;
  }>({ status: null });

  const handleValidateWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSerial) return;
    const matched = warranties.find(w => w.serialNumber.trim().toUpperCase() === validateSerial.trim().toUpperCase());
    if (matched) {
      if (matched.status === 'Active') {
        setValidationResult({ status: 'success', record: matched });
      } else {
        setValidationResult({ status: 'expired', record: matched });
      }
    } else {
      setValidationResult({ status: 'not_found' });
    }
  };

  // --- WARRANTY REGISTRATION FORM ---
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState({
    customerName: '',
    serialNumber: '',
    productCode: 'PC-CEM-V1',
    durationYears: '3'
  });

  const handleRegisterWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyForm.customerName || !warrantyForm.serialNumber) return;

    const newWar: WarrantyRecord = {
      id: `war_${Date.now()}`,
      customerName: warrantyForm.customerName,
      serialNumber: warrantyForm.serialNumber.trim().toUpperCase(),
      productCode: warrantyForm.productCode,
      activationDate: new Date().toISOString().split('T')[0],
      durationYears: parseInt(warrantyForm.durationYears) || 3,
      status: 'Active'
    };

    const updated = [...warranties, newWar];
    setWarranties(updated);
    syncCollectionToFirestore('serviceWarranties', updated);
    setShowWarrantyModal(false);
    setWarrantyForm({
      customerName: '',
      serialNumber: '',
      productCode: 'PC-CEM-V1',
      durationYears: '3'
    });
    loadData();
  };

  // --- INTERACTIVE RMA COST ESTIMATOR ---
  const [estimator, setEstimator] = useState({
    materials: 'sensor', // sensor (12000), pump (45000), valve (8000)
    laborHours: '4', // 1500 BDT/hour
    dispatchFee: '2500'
  });

  const calculateEstimate = () => {
    let materialCost = 8000;
    if (estimator.materials === 'sensor') materialCost = 12000;
    if (estimator.materials === 'pump') materialCost = 45000;
    const laborCost = (parseInt(estimator.laborHours) || 0) * 1500;
    const travel = parseInt(estimator.dispatchFee) || 0;
    return materialCost + laborCost + travel;
  };

  const [showRMAPreparationModal, setShowRMAPreparationModal] = useState(false);
  const [rmaForm, setRmaForm] = useState({
    customerName: 'Savar ReadyMix Co.',
    issueDescription: 'Faulty sensor trigger replacement.',
    technicianAssigned: 'Md. Rafiqul Islam'
  });

  const handleLogRMAJob = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCost = calculateEstimate();
    const newRMA: RepairRMARecord = {
      id: `rep_${Date.now()}`,
      customerName: rmaForm.customerName,
      issueDescription: rmaForm.issueDescription,
      technicianAssigned: rmaForm.technicianAssigned,
      costEstimate: finalCost,
      stage: 'Assigned'
    };

    const updatedRepairs = [...repairs, newRMA];
    setRepairs(updatedRepairs);
    syncCollectionToFirestore('serviceRepairs', updatedRepairs);
    
    // Increment active ticket count for technician
    const updatedTechs = technicians.map(t => {
      if (t.name === rmaForm.technicianAssigned) {
        return { ...t, status: 'Busy' as const, activeTicketsCount: t.activeTicketsCount + 1 };
      }
      return t;
    });
    setTechnicians(updatedTechs);
    syncCollectionToFirestore('serviceTechnicians', updatedTechs);

    setShowRMAPreparationModal(false);
    loadData();
  };

  // --- COMPLAINTS MANAGER ---
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    customerName: '',
    subject: '',
    severity: 'Medium' as ComplaintRecord['severity']
  });

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.customerName || !complaintForm.subject) return;

    const newComp: ComplaintRecord = {
      id: `comp_${Date.now()}`,
      customerName: complaintForm.customerName,
      subject: complaintForm.subject,
      severity: complaintForm.severity,
      status: 'Opened',
      dateOpened: new Date().toISOString().split('T')[0],
      feedbackScore: 5
    };

    const updated = [newComp, ...complaints];
    setComplaints(updated);
    syncCollectionToFirestore('serviceComplaints', updated);
    setShowComplaintModal(false);
    setComplaintForm({ customerName: '', subject: '', severity: 'Medium' });
    loadData();
  };

  const handleResolveComplaint = (id: string, stars: number) => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        return { ...c, status: 'Resolved' as const, feedbackScore: stars };
      }
      return c;
    });
    setComplaints(updated);
    syncCollectionToFirestore('serviceComplaints', updated);
    loadData();
  };

  // --- DISPATCH SPECIALISTS BOARD ---
  const [dispatcher, setDispatcher] = useState({
    techId: '',
    ticketSubject: '',
    customerLink: '',
    location: ''
  });

  const handleDispatchTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatcher.techId || !dispatcher.location) return;

    const updatedTechs = technicians.map(t => {
      if (t.id === dispatcher.techId) {
        return { ...t, status: 'On Site' as const, activeTicketsCount: t.activeTicketsCount + 1 };
      }
      return t;
    });
    setTechnicians(updatedTechs);
    syncCollectionToFirestore('serviceTechnicians', updatedTechs);

    // Also append an automated repair ticket
    const tech = technicians.find(t => t.id === dispatcher.techId);
    const autoRep: RepairRMARecord = {
      id: `rep_auto_${Date.now()}`,
      customerName: dispatcher.customerLink || 'On-Site Callout',
      issueDescription: `Field Callout: ${dispatcher.ticketSubject || 'SLA Inspection'} at ${dispatcher.location}`,
      technicianAssigned: tech ? tech.name : 'Unassigned',
      costEstimate: 8500, // standard trip fee
      stage: 'Assigned'
    };
    const updatedRepairs = [...repairs, autoRep];
    setRepairs(updatedRepairs);
    syncCollectionToFirestore('serviceRepairs', updatedRepairs);

    setDispatcher({ techId: '', ticketSubject: '', customerLink: '', location: '' });
    loadData();
  };

  // --- AMC CONSTRUCTORS ---
  const [showAmcModal, setShowAmcModal] = useState(false);
  const [amcForm, setAmcForm] = useState({
    corporateClient: '',
    contractType: 'Gold' as AMCRecord['contractType'],
    monthlyVisitDay: '15'
  });

  const handleCreateAMC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amcForm.corporateClient) return;

    const nextDay = parseInt(amcForm.monthlyVisitDay) || 15;
    const newAMC: AMCRecord = {
      id: `amc_${Date.now()}`,
      corporateClient: amcForm.corporateClient,
      contractType: amcForm.contractType,
      monthlyVisitDay: nextDay,
      lastAuditDate: '2026-06-15',
      nextServiceDate: `2026-07-${nextDay < 10 ? '0' + nextDay : nextDay}`,
      status: 'Active'
    };

    const updated = [...amcs, newAMC];
    setAmcs(updated);
    syncCollectionToFirestore('serviceAmcs', updated);
    setShowAmcModal(false);
    setAmcForm({ corporateClient: '', contractType: 'Gold', monthlyVisitDay: '15' });
    loadData();
  };

  const handleToggleAMC = (id: string) => {
    const updated = amcs.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Suspended' as const : 'Active' as const };
      }
      return a;
    });
    setAmcs(updated);
    syncCollectionToFirestore('serviceAmcs', updated);
    loadData();
  };

  return (
    <PageStandardsWrapper
      title="SLA Customer Aftermarket Support"
      subtitle="Govern aftermarket customer claims, validate serial warranties, run interactive cost estimators, and dispatch mechanical field technicians."
      loading={false}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager', 'Sales Agent']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'Aftermarket Services', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* SUPPORT METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Support Claims</div>
            <div className="text-xl font-extrabold text-slate-800">{metrics.totalClaims} Claims</div>
            <div className="text-[11px] text-indigo-500 font-medium">Active SLA matrix</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Remediations Dispatching</div>
            <div className="text-xl font-extrabold text-indigo-600">{metrics.activeRepairs} Repairs</div>
            <div className="text-[11px] text-slate-400">Under specialist diagnostics</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Claims Valuations</div>
            <div className="text-xl font-extrabold text-rose-600">৳{metrics.remediationCost.toLocaleString()} BDT</div>
            <div className="text-[11px] text-rose-500 font-medium">Estimated components cost</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">SLA compliance index</div>
            <div className="text-xl font-extrabold text-emerald-600">{metrics.slaCompliance}</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Exceeding standards
            </div>
          </div>
        </div>

        {/* SERVICE TABS */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setCurrentTab('warranty')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'warranty' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Warranty Register</span>
          </button>
          <button
            onClick={() => setCurrentTab('repairs')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'repairs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Repairs & RMA Center</span>
          </button>
          <button
            onClick={() => setCurrentTab('complaints')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'complaints' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Customer Complaints</span>
          </button>
          <button
            onClick={() => setCurrentTab('technicians')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'technicians' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Technician Dispatcher</span>
          </button>
          <button
            onClick={() => setCurrentTab('amc')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'amc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>AMC Maintenance Contracts</span>
          </button>
        </div>

        {/* TAB WORKSPACES */}
        <div className="space-y-6">
          {/* 1. WARRANTY WORKSPACE */}
          {currentTab === 'warranty' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Side: Warranty validation tool */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-1">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Warranty Validation Console</h4>
                  <p className="text-[11px] text-slate-400">Instantly audit serial numbers against registered industrial claims database.</p>
                </div>

                <form onSubmit={handleValidateWarranty} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">SLA Serial Number</label>
                    <input
                      type="text"
                      required
                      value={validateSerial}
                      onChange={e => setValidateSerial(e.target.value)}
                      placeholder="e.g., SN-10294-CONCRETE"
                      className="w-full bg-slate-50 border border-slate-250 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition-colors cursor-pointer"
                  >
                    Validate Warranty Claims
                  </button>
                </form>

                {/* Validation outcome message */}
                {validationResult.status !== null && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                    validationResult.status === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
                    validationResult.status === 'expired' ? 'bg-amber-50 border-amber-150 text-amber-800' :
                    'bg-rose-50 border-rose-150 text-rose-800'
                  }`}>
                    {validationResult.status === 'success' && validationResult.record && (
                      <>
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Warranty VALID & ACTIVE</span>
                        </div>
                        <p className="text-[11px]">Authorized Client: <strong>{validationResult.record.customerName}</strong></p>
                        <p className="text-[11px]">Product SKU: <strong>{validationResult.record.productCode}</strong></p>
                        <p className="text-[11px]">Fitted under standard {validationResult.record.durationYears}-year industrial protection.</p>
                      </>
                    )}
                    {validationResult.status === 'expired' && validationResult.record && (
                      <>
                        <div className="font-bold flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4 text-amber-600" />
                          <span>Coverage Protection EXPIRED</span>
                        </div>
                        <p className="text-[11px]">Client: <strong>{validationResult.record.customerName}</strong></p>
                        <p className="text-[11px]">Product activation: {validationResult.record.activationDate}. Contract expired after {validationResult.record.durationYears} years.</p>
                      </>
                    )}
                    {validationResult.status === 'not_found' && (
                      <>
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <span>Serial Record NOT Found</span>
                        </div>
                        <p className="text-[11px]">No active factory warranties match this serial string. Check typos or register a new warranty contract below.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Warranty Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Standard Warranty Registries</h4>
                    <p className="text-[11px] text-slate-400">Authorized structural and chemical aftermarket validation periods.</p>
                  </div>
                  <button
                    onClick={() => setShowWarrantyModal(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Register New Warranty</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-2 px-3">Serial/Code</th>
                        <th className="py-2 px-3">Corporate Client</th>
                        <th className="py-2 px-3">Product Link</th>
                        <th className="py-2 px-3">Activation</th>
                        <th className="py-2 px-3 text-center">Duration</th>
                        <th className="py-2 px-3 text-right">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warranties.map(war => (
                        <tr key={war.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-slate-600">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{war.serialNumber}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{war.customerName}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{war.productCode}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{war.activationDate}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600">{war.durationYears} Years</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                              war.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {war.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. REPAIRS & RMA CENTER */}
          {currentTab === 'repairs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Side: Cost Estimator */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-1">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">RMA Cost Estimator</h4>
                  <p className="text-[11px] text-slate-400">Generate on-the-fly component quotes matching warranty discounts.</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Core Defect Part / SKU</label>
                    <select
                      value={estimator.materials}
                      onChange={e => setEstimator({ ...estimator, materials: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                    >
                      <option value="valve">Structural Pressure Relief Valve (৳8,000)</option>
                      <option value="sensor">Heavy Silo Load Moisture Sensor (৳12,000)</option>
                      <option value="pump">40HP Concrete Drum Hydraulic Pump (৳45,000)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">Labor hours (৳1500/hr)</label>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={estimator.laborHours}
                        onChange={e => setEstimator({ ...estimator, laborHours: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">Dispatch Fee (BDT)</label>
                      <input
                        type="number"
                        step="500"
                        value={estimator.dispatchFee}
                        onChange={e => setEstimator({ ...estimator, dispatchFee: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Subtotal Parts & Labor:</span>
                      <span className="font-mono">৳{(calculateEstimate() - (parseInt(estimator.dispatchFee) || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Travel Dispatch Costs:</span>
                      <span className="font-mono">৳{(parseInt(estimator.dispatchFee) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                      <span>Estimated BDT Total:</span>
                      <span className="font-mono text-indigo-600">৳{calculateEstimate().toLocaleString()} BDT</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRMAPreparationModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate & Log RMA Job</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Repair claims queue */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-2">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Active Repair & RMA Worklist</h4>
                  <p className="text-[11px] text-slate-400">Diagnose defects, assign specialists, and tracking remediation stages.</p>
                </div>

                <div className="space-y-3">
                  {repairs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      No active RMA repair operations.
                    </div>
                  ) : (
                    repairs.map(rep => (
                      <div key={rep.id} className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 flex justify-between items-start gap-4 hover:border-slate-300 transition-colors">
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] bg-slate-200/60 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{rep.customerName}</span>
                            <h5 className="font-bold text-xs text-slate-800 mt-1">{rep.issueDescription}</h5>
                          </div>
                          
                          <div className="flex items-center gap-4 text-[10px] text-slate-400">
                            <span>Specialist: <strong className="text-slate-600 font-semibold">{rep.technicianAssigned}</strong></span>
                            <span>Est. Cost: <strong className="text-indigo-600 font-extrabold">৳{rep.costEstimate.toLocaleString()} BDT</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                            rep.stage === 'Diagnostics' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            rep.stage === 'Repairing' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {rep.stage}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. CUSTOMER COMPLAINTS */}
          {currentTab === 'complaints' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Corporate Customer Complaints Ledger</h3>
                  <p className="text-[11px] text-slate-400">Log client quality deviations, trigger deep root cause investigations, and collect resolving satisfaction scores.</p>
                </div>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register Client Complaint</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaints.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                    No active complaint tickets logged.
                  </div>
                ) : (
                  complaints.map(comp => (
                    <div key={comp.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">{comp.customerName}</span>
                          <h4 className="font-bold text-xs text-slate-800 mt-1.5">{comp.subject}</h4>
                        </div>
                        
                        <div className="flex gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                            comp.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            comp.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-500 border-slate-150'
                          }`}>
                            {comp.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                            comp.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] border-t border-slate-100/80 pt-2.5">
                        <span className="font-mono text-slate-400">Logged On: {comp.dateOpened}</span>
                        
                        {comp.status !== 'Resolved' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold mr-1">Resolve:</span>
                            {[3, 4, 5].map(stars => (
                              <button
                                key={stars}
                                onClick={() => handleResolveComplaint(comp.id, stars)}
                                className="bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                              >
                                {stars}⭐
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                            Resolved Satisfactorily (Score: {comp.feedbackScore} / 5)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. TECHNICIAN DISPATCHER */}
          {currentTab === 'technicians' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Side: Dispatch Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-1">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Specialist Dispatch Controller</h4>
                  <p className="text-[11px] text-slate-400">Coordinate and dispatch QA and repair experts for site consultations.</p>
                </div>

                <form onSubmit={handleDispatchTechnician} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Select Available Specialist *</label>
                    <select
                      required
                      value={dispatcher.techId}
                      onChange={e => setDispatcher({ ...dispatcher, techId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                    >
                      <option value="">-- Choose Field Specialist --</option>
                      {technicians.filter(t => t.status === 'Available').map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Site Location / Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={dispatcher.location}
                        onChange={e => setDispatcher({ ...dispatcher, location: e.target.value })}
                        placeholder="e.g., Savar Factory Zone, Gate #3"
                        className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-2.5 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Corporate Customer Linked</label>
                    <input
                      type="text"
                      value={dispatcher.customerLink}
                      onChange={e => setDispatcher({ ...dispatcher, customerLink: e.target.value })}
                      placeholder="e.g., Savar ReadyMix Co."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">Dispatch Task Summary</label>
                    <input
                      type="text"
                      value={dispatcher.ticketSubject}
                      onChange={e => setDispatcher({ ...dispatcher, ticketSubject: e.target.value })}
                      placeholder="e.g., Pressure calibration setup"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Dispatch Specialist</span>
                  </button>
                </form>
              </div>

              {/* Right Side: Technicians Board */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 md:col-span-2">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Site Specialist Dispatch Board</h4>
                  <p className="text-[11px] text-slate-400">Current status, specialization, and active workload logs of aftermarket engineers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {technicians.map(tech => (
                    <div key={tech.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center hover:border-slate-300 transition-colors">
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-slate-800">{tech.name}</h5>
                        <p className="text-[10px] text-indigo-600 font-semibold uppercase">{tech.specialization}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{tech.activeTicketsCount} Active site callouts</p>
                      </div>

                      <span className={`px-2 py-1 rounded text-[9px] font-bold border uppercase ${
                        tech.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        tech.status === 'On Site' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        tech.status === 'Busy' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {tech.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. AMC CONSTRUCTORS */}
          {currentTab === 'amc' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Annual Maintenance Contracts (AMC)</h3>
                  <p className="text-[11px] text-slate-400">Track recurring corporate site QA audits and trigger automatic inspection alerts.</p>
                </div>
                <button
                  onClick={() => setShowAmcModal(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Configure AMC Contract</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-4">Corporate Client</th>
                      <th className="py-2.5 px-4">Contract Class</th>
                      <th className="py-2.5 px-4 text-center">Visit Schedule</th>
                      <th className="py-2.5 px-4 font-mono">Last Audit Date</th>
                      <th className="py-2.5 px-4 font-mono">Next Due Audit</th>
                      <th className="py-2.5 px-4">AMC Status</th>
                      <th className="py-2.5 px-4 text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amcs.map(a => (
                      <tr key={a.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-slate-600">
                        <td className="py-3 px-4 font-bold text-slate-800">{a.corporateClient}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase ${
                            a.contractType === 'Platinum' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                            a.contractType === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {a.contractType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-600">Day {a.monthlyVisitDay} Monthly</td>
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{a.lastAuditDate}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-indigo-600">{a.nextServiceDate}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                            a.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleAMC(a.id)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            {a.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WARRANTY MODAL */}
      {showWarrantyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleRegisterWarranty} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Register Warranty Coverage</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Corporate Customer Name *</label>
                <input
                  type="text"
                  required
                  value={warrantyForm.customerName}
                  onChange={e => setWarrantyForm({ ...warrantyForm, customerName: e.target.value })}
                  placeholder="e.g., Mirpur Builders Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Unique Serial Number *</label>
                <input
                  type="text"
                  required
                  value={warrantyForm.serialNumber}
                  onChange={e => setWarrantyForm({ ...warrantyForm, serialNumber: e.target.value })}
                  placeholder="e.g., SN-10294-CONCRETE"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Product SKU / Code</label>
                  <select
                    value={warrantyForm.productCode}
                    onChange={e => setWarrantyForm({ ...warrantyForm, productCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="PC-CEM-V1">V1 Structural Cement</option>
                    <option value="PC-ST-R16">16mm Rebar Cage</option>
                    <option value="PC-MIX-X4">X4 ReadyMix</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Coverage (Years)</label>
                  <select
                    value={warrantyForm.durationYears}
                    onChange={e => setWarrantyForm({ ...warrantyForm, durationYears: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="1">1 Year Protection</option>
                    <option value="3">3 Years Protection</option>
                    <option value="5">5 Years Protection</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowWarrantyModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Register Claim
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ESTIMATOR LOG MODAL */}
      {showRMAPreparationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleLogRMAJob} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Establish RMA Claims Case</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Client Account *</label>
                <input
                  type="text"
                  required
                  value={rmaForm.customerName}
                  onChange={e => setRmaForm({ ...rmaForm, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Issue Diagnostic details *</label>
                <input
                  type="text"
                  required
                  value={rmaForm.issueDescription}
                  onChange={e => setRmaForm({ ...rmaForm, issueDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Assign Diagnostics Specialist</label>
                <select
                  value={rmaForm.technicianAssigned}
                  onChange={e => setRmaForm({ ...rmaForm, technicianAssigned: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-150 p-2.5 rounded-lg text-[11px] text-amber-800 font-medium">
                SLA Alert: This case will carry an estimated cost valuation of <strong>৳{calculateEstimate().toLocaleString()} BDT</strong>.
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowRMAPreparationModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Establish RMA Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COMPLAINTS MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateComplaint} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Register Customer Complaint</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Corporate Customer *</label>
                <input
                  type="text"
                  required
                  value={complaintForm.customerName}
                  onChange={e => setComplaintForm({ ...complaintForm, customerName: e.target.value })}
                  placeholder="e.g., Sajib Block Factory"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Quality / Performance Subject *</label>
                <input
                  type="text"
                  required
                  value={complaintForm.subject}
                  onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  placeholder="e.g., Batch #44 moisture content too high"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Impact Severity Level</label>
                <select
                  value={complaintForm.severity}
                  onChange={e => setComplaintForm({ ...complaintForm, severity: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                >
                  <option value="Low">Low - minor deviation</option>
                  <option value="Medium">Medium - site operations delayed</option>
                  <option value="Critical">Critical - structural integrity failure</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AMC MODAL */}
      {showAmcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateAMC} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Configure AMC Contract</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Corporate Client *</label>
                <input
                  type="text"
                  required
                  value={amcForm.corporateClient}
                  onChange={e => setAmcForm({ ...amcForm, corporateClient: e.target.value })}
                  placeholder="e.g., Purbachal Precast Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Contract Class</label>
                  <select
                    value={amcForm.contractType}
                    onChange={e => setAmcForm({ ...amcForm, contractType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Standard">Standard (Quarterly Visits)</option>
                    <option value="Gold">Gold (Bi-Weekly Visits)</option>
                    <option value="Platinum">Platinum (On-Demand + Weekly Visits)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Visit Scheduled Day</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    required
                    value={amcForm.monthlyVisitDay}
                    onChange={e => setAmcForm({ ...amcForm, monthlyVisitDay: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowAmcModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Contract
              </button>
            </div>
          </form>
        </div>
      )}
    </PageStandardsWrapper>
  );
}
