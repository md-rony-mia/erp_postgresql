import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  CheckSquare,
  Zap,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  UserCheck,
  TrendingUp,
  FileText,
  ArrowUp,
  ArrowDown,
  Edit,
  Shield
} from 'lucide-react';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

interface WorkflowViewProps {
  activeSubTab?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  role: string;
  minAmount: number;
  description: string;
}

interface ApprovalRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditionThreshold: number; // e.g. amount > 500000 BDT
  approverRole: string;
  status: 'Active' | 'Inactive';
}

interface AutomationRule {
  id: string;
  name: string;
  eventTrigger: 'Stock Alert' | 'Invoice Generated' | 'New Lead';
  actionChannel: 'Email' | 'SMS' | 'Webhook';
  status: 'Active' | 'Inactive';
}

interface PendingApproval {
  id: string;
  documentNo: string;
  documentType: 'Purchase Order' | 'Invoice' | 'Asset Requisition';
  amount: number;
  requestedBy: string;
  dateRequested: string;
  status: 'Awaiting Sign-off' | 'Approved' | 'Rejected';
  notes?: string;
}

export default function WorkflowView({ activeSubTab = 'pending_approval' }: WorkflowViewProps) {
  const currentTab = ['designer', 'approval_rules', 'automation_rules', 'pending_approval'].includes(activeSubTab)
    ? activeSubTab
    : 'pending_approval';

  // --- LOCAL PERSISTED STATES ---
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. approvalRules
        const legacyRules = localStorage.getItem('nexova_wf_rules');
        let initialRules = [
          { id: 'ar1', name: 'High Value PO Overrides', triggerEvent: 'Purchase Order Total', conditionThreshold: 500000, approverRole: 'Managing Director', status: 'Active' as const },
          { id: 'ar2', name: 'Credit Sale Authorization', triggerEvent: 'Credit Invoice Total', conditionThreshold: 200000, approverRole: 'CFO', status: 'Active' as const }
        ];
        if (legacyRules) {
          try { initialRules = JSON.parse(legacyRules); } catch (e) {}
        }
        const seededRules = await seedCollectionIfEmpty('wfRules', initialRules);
        setApprovalRules(seededRules || []);
        if (legacyRules) {
          localStorage.removeItem('nexova_wf_rules');
        }

        // 2. automationRules
        const legacyAutos = localStorage.getItem('nexova_wf_automations');
        let initialAutos = [
          { id: 'atr1', name: 'Low Stock Supervisor Email Alert', eventTrigger: 'Stock Alert' as const, actionChannel: 'Email' as const, status: 'Active' as const },
          { id: 'atr2', name: 'Sales Lead Webhook Payload', eventTrigger: 'New Lead' as const, actionChannel: 'Webhook' as const, status: 'Inactive' as const }
        ];
        if (legacyAutos) {
          try { initialAutos = JSON.parse(legacyAutos); } catch (e) {}
        }
        const seededAutos = await seedCollectionIfEmpty('wfAutomations', initialAutos);
        setAutomationRules(seededAutos || []);
        if (legacyAutos) {
          localStorage.removeItem('nexova_wf_automations');
        }

        // 3. pendingApprovals
        const legacyPending = localStorage.getItem('nexova_wf_pending');
        let initialPending = [
          { id: 'pa1', documentNo: 'PO-2026-9021', documentType: 'Purchase Order' as const, amount: 820000, requestedBy: 'Tasnim Ahmed', dateRequested: '2026-07-08', status: 'Awaiting Sign-off' as const },
          { id: 'pa2', documentNo: 'INV-2026-0412', documentType: 'Invoice' as const, amount: 450000, requestedBy: 'Rony Mia', dateRequested: '2026-07-09', status: 'Awaiting Sign-off' as const }
        ];
        if (legacyPending) {
          try { initialPending = JSON.parse(legacyPending); } catch (e) {}
        }
        const seededPending = await seedCollectionIfEmpty('wfPending', initialPending);
        setPendingApprovals(seededPending || []);
        if (legacyPending) {
          localStorage.removeItem('nexova_wf_pending');
        }

        // 4. workflowStages (Designer)
        const legacyStages = localStorage.getItem('nexova_wf_stages');
        let initialStages = [
          { id: 'st1', name: 'Purchase Request Initiation', role: 'Department Executive', minAmount: 0, description: 'Procurement is initiated and budget code is logged.' },
          { id: 'st2', name: 'Division Manager Clearance', role: 'Manager', minAmount: 10000, description: 'Assesses cost necessity and team resource availability.' },
          { id: 'st3', name: 'Commercial CFO Auditing', role: 'CFO', minAmount: 200000, description: 'Checks cash flow capacity and tax deductibles.' },
          { id: 'st4', name: 'Board Executive Approval', role: 'Managing Director', minAmount: 1000000, description: 'Ensures board covenants are followed for large expenditures.' }
        ];
        if (legacyStages) {
          try { initialStages = JSON.parse(legacyStages); } catch (e) {}
        }
        const seededStages = await seedCollectionIfEmpty('wfStages', initialStages);
        setWorkflowStages(seededStages || []);
        if (legacyStages) {
          localStorage.removeItem('nexova_wf_stages');
        }
      } catch (err) {
        // Intentionally silent: background local workflow data migration on component mount
        console.error("Workflow migration failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('wfRules', approvalRules);
  }, [approvalRules, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('wfAutomations', automationRules);
  }, [automationRules, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('wfPending', pendingApprovals);
  }, [pendingApprovals, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('wfStages', workflowStages);
  }, [workflowStages, loading]);

  // --- MODALS FORM STATES ---
  const [showApprovalRuleModal, setShowApprovalRuleModal] = useState(false);
  const [approvalRuleForm, setApprovalRuleForm] = useState({
    name: '', triggerEvent: 'Purchase Order Total', threshold: '', role: 'CFO'
  });

  const [showAutomationRuleModal, setShowAutomationRuleModal] = useState(false);
  const [automationRuleForm, setAutomationRuleForm] = useState({
    name: '', eventTrigger: 'Stock Alert' as AutomationRule['eventTrigger'], actionChannel: 'Email' as AutomationRule['actionChannel']
  });

  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState({
    name: '', role: 'Manager', minAmount: '', description: ''
  });
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  // --- ACTIONS ---
  const handleCreateApprovalRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalRuleForm.name || !approvalRuleForm.threshold) return;
    const newRule: ApprovalRule = {
      id: `ar_${Date.now()}`,
      name: approvalRuleForm.name,
      triggerEvent: approvalRuleForm.triggerEvent,
      conditionThreshold: parseFloat(approvalRuleForm.threshold) || 0,
      approverRole: approvalRuleForm.role,
      status: 'Active'
    };
    setApprovalRules([...approvalRules, newRule]);
    setApprovalRuleForm({ name: '', triggerEvent: 'Purchase Order Total', threshold: '', role: 'CFO' });
    setShowApprovalRuleModal(false);
  };

  const handleCreateAutomationRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!automationRuleForm.name) return;
    const newAuto: AutomationRule = {
      id: `atr_${Date.now()}`,
      name: automationRuleForm.name,
      eventTrigger: automationRuleForm.eventTrigger,
      actionChannel: automationRuleForm.actionChannel,
      status: 'Active'
    };
    setAutomationRules([...automationRules, newAuto]);
    setAutomationRuleForm({ name: '', eventTrigger: 'Stock Alert', actionChannel: 'Email' });
    setShowAutomationRuleModal(false);
  };

  const handleProcessApproval = (id: string, action: 'Approved' | 'Rejected', notes: string = 'Approved on system audit') => {
    setPendingApprovals(pendingApprovals.map(p => p.id === id ? {
      ...p,
      status: action,
      notes: notes
    } : p));
  };

  const toggleApprovalRule = (id: string) => {
    setApprovalRules(approvalRules.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a));
  };

  const toggleAutomationRule = (id: string) => {
    setAutomationRules(automationRules.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a));
  };

  const handleCreateOrUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageForm.name) return;

    if (editingStageId) {
      setWorkflowStages(workflowStages.map(s => s.id === editingStageId ? {
        ...s,
        name: stageForm.name,
        role: stageForm.role,
        minAmount: parseFloat(stageForm.minAmount) || 0,
        description: stageForm.description
      } : s));
      setEditingStageId(null);
    } else {
      const newStage: WorkflowStage = {
        id: `st_${Date.now()}`,
        name: stageForm.name,
        role: stageForm.role,
        minAmount: parseFloat(stageForm.minAmount) || 0,
        description: stageForm.description
      };
      setWorkflowStages([...workflowStages, newStage]);
    }
    setStageForm({ name: '', role: 'Manager', minAmount: '', description: '' });
    setShowStageModal(false);
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workflowStages.length) return;
    
    const updated = [...workflowStages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setWorkflowStages(updated);
  };

  const handleDeleteStage = (id: string) => {
    setWorkflowStages(workflowStages.filter(s => s.id !== id));
  };

  const handleEditStage = (stage: WorkflowStage) => {
    setEditingStageId(stage.id);
    setStageForm({
      name: stage.name,
      role: stage.role,
      minAmount: stage.minAmount.toString(),
      description: stage.description
    });
    setShowStageModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Enterprise Workflow Designer & Approvals Queue</h2>
          <p className="text-xs text-slate-400 mt-1">Nurture and customize multi-phase document sign-off pathways, configure triggers, and approve active corporate expenses.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentTab === 'designer' && (
            <button
              onClick={() => {
                setEditingStageId(null);
                setStageForm({ name: '', role: 'Manager', minAmount: '', description: '' });
                setShowStageModal(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workflow Stage</span>
            </button>
          )}
          {currentTab === 'approval_rules' && (
            <button
              onClick={() => setShowApprovalRuleModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Define Approval Rule</span>
            </button>
          )}
          {currentTab === 'automation_rules' && (
            <button
              onClick={() => setShowAutomationRuleModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Define Automation</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE PENDING QUEUE */}
      {currentTab === 'pending_approval' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Approvals Queue</h3>
          <div className="space-y-3">
            {pendingApprovals.filter(p => p.status === 'Awaiting Sign-off').length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                All document requisitions have been processed. Queue empty!
              </div>
            ) : (
              pendingApprovals.filter(p => p.status === 'Awaiting Sign-off').map(p => (
                <div key={p.id} className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{p.documentType} Req</span>
                      <h4 className="font-bold text-xs text-slate-800 mt-0.5">{p.documentNo}</h4>
                    </div>
                    <span className="text-sm font-extrabold text-indigo-600">৳{p.amount.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Requested by: <strong className="text-slate-600">{p.requestedBy}</strong></span>
                    <span>Date: <strong className="font-mono">{p.dateRequested}</strong></span>
                  </div>
                  <div className="border-t border-slate-100/60 pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleProcessApproval(p.id, 'Rejected')}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-3 py-1 rounded cursor-pointer transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleProcessApproval(p.id, 'Approved')}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-150 text-emerald-700 font-bold text-[11px] px-3 py-1 rounded cursor-pointer transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Approve Sign-off
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentTab === 'designer' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Visual Transaction Pathway Sequence</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define multi-phase verification levels. Transactions dynamically route through active sign-off channels.</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 mt-2 md:mt-0">
                <CheckCircle className="h-3 w-3 text-emerald-600" /> Sequence Active & Live
              </span>
            </div>

            <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto relative">
              {workflowStages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-xl w-full">
                  No workflow stages defined yet. Click "Create Workflow Stage" to get started.
                </div>
              ) : (
                workflowStages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    {/* Visual Stage Card */}
                    <div className="w-full bg-white border border-slate-200 hover:border-indigo-500 shadow-sm rounded-2xl p-5 relative group transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left Block: Index & Icon */}
                      <div className="flex items-start gap-4">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 text-sm">{stage.name}</h4>
                            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              {stage.role}
                            </span>
                            {stage.minAmount > 0 ? (
                              <span className="bg-amber-50 border border-amber-150 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded">
                                Min: ৳{stage.minAmount.toLocaleString()} BDT
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded">
                                No Minimum
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">{stage.description}</p>
                        </div>
                      </div>

                      {/* Right Block: Actions */}
                      <div className="flex items-center gap-2 sm:self-center">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveStage(index, 'up')}
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          title="Move Stage Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          disabled={index === workflowStages.length - 1}
                          onClick={() => handleMoveStage(index, 'down')}
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          title="Move Stage Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStage(stage)}
                          className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-indigo-600 cursor-pointer transition-colors"
                          title="Edit Stage Parameters"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-1.5 rounded border border-slate-200 hover:bg-rose-50 text-rose-500 cursor-pointer transition-colors"
                          title="Delete Stage"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Connector Arrow (unless it's the last stage) */}
                    {index < workflowStages.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <div className="w-0.5 h-6 bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 -mt-1" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'approval_rules' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Document Approval Rules</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Rule Name</th>
                  <th className="py-2.5 px-4">Trigger Action Event</th>
                  <th className="py-2.5 px-4 text-right font-bold">BDT Deflection Threshold</th>
                  <th className="py-2.5 px-4">Authorized Approver</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {approvalRules.map(ar => (
                  <tr key={ar.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-bold text-slate-800">{ar.name}</td>
                    <td className="py-3 px-4 text-slate-600">{ar.triggerEvent}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">৳{ar.conditionThreshold.toLocaleString()} BDT</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{ar.approverRole}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleApprovalRule(ar.id)}
                        className={`font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                          ar.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ar.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'automation_rules' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Automated Triggers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Automation Name</th>
                  <th className="py-2.5 px-4">Trigger Core Event</th>
                  <th className="py-2.5 px-4">System Notification Channel</th>
                  <th className="py-2.5 px-4">Automation Status</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map(atr => (
                  <tr key={atr.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-bold text-slate-800">{atr.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{atr.eventTrigger}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{atr.actionChannel}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleAutomationRule(atr.id)}
                        className={`font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                          atr.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {atr.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVAL RULE MODAL */}
      {showApprovalRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateApprovalRule} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Create Document Approval Rule</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Approval Rule Name *</label>
                <input
                  type="text"
                  required
                  value={approvalRuleForm.name}
                  onChange={e => setApprovalRuleForm({ ...approvalRuleForm, name: e.target.value })}
                  placeholder="e.g., Heavy Raw Supply Invoices"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Trigger Event</label>
                  <select
                    value={approvalRuleForm.triggerEvent}
                    onChange={e => setApprovalRuleForm({ ...approvalRuleForm, triggerEvent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Purchase Order Total">Purchase Order Total</option>
                    <option value="Credit Invoice Total">Credit Invoice Total</option>
                    <option value="Asset Requisition">Asset Requisition</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Threshold (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={approvalRuleForm.threshold}
                    onChange={e => setApprovalRuleForm({ ...approvalRuleForm, threshold: e.target.value })}
                    placeholder="e.g., 500000"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Authorized Signatory</label>
                <select
                  value={approvalRuleForm.role}
                  onChange={e => setApprovalRuleForm({ ...approvalRuleForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                >
                  <option value="CFO">Chief Financial Officer (CFO)</option>
                  <option value="Managing Director">Managing Director</option>
                  <option value="Logistics Head">Logistics Head</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalRuleModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Save Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AUTOMATION RULE MODAL */}
      {showAutomationRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateAutomationRule} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Define Event Automation Rule</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Automation Rule Name *</label>
                <input
                  type="text"
                  required
                  value={automationRuleForm.name}
                  onChange={e => setAutomationRuleForm({ ...automationRuleForm, name: e.target.value })}
                  placeholder="e.g., Email alerts when cement low"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Core Event Trigger</label>
                  <select
                    value={automationRuleForm.eventTrigger}
                    onChange={e => setAutomationRuleForm({ ...automationRuleForm, eventTrigger: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Stock Alert">Inventory Low Stock Alert</option>
                    <option value="Invoice Generated">Sales Invoice Generated</option>
                    <option value="New Lead">New Lead Registered</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Notification Channel</label>
                  <select
                    value={automationRuleForm.actionChannel}
                    onChange={e => setAutomationRuleForm({ ...automationRuleForm, actionChannel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Email">Email SMTP Push</option>
                    <option value="SMS">SMS Gateway Broadcast</option>
                    <option value="Webhook">JSON Webhook Payload</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowAutomationRuleModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Save Automation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE/EDIT WORKFLOW STAGE MODAL */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <form onSubmit={handleCreateOrUpdateStage} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              {editingStageId ? 'Edit Workflow Stage' : 'Create Workflow Stage'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Stage Name *</label>
                <input
                  type="text"
                  required
                  value={stageForm.name}
                  onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
                  placeholder="e.g., Regional CFO Clearance"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Approver Role</label>
                  <select
                    value={stageForm.role}
                    onChange={e => setStageForm({ ...stageForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Manager">Department Manager</option>
                    <option value="CFO">Chief Financial Officer (CFO)</option>
                    <option value="Managing Director">Managing Director</option>
                    <option value="Auditor">Compliance Auditor</option>
                    <option value="Board Member">Board of Directors</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Min Amount Trigger (BDT)</label>
                  <input
                    type="number"
                    value={stageForm.minAmount}
                    onChange={e => setStageForm({ ...stageForm, minAmount: e.target.value })}
                    placeholder="e.g., 50000 (0 for always)"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">SLA or Step Guidelines</label>
                <textarea
                  rows={3}
                  value={stageForm.description}
                  onChange={e => setStageForm({ ...stageForm, description: e.target.value })}
                  placeholder="Summarize standard operating procedures, authorization rules, or regulatory checkpoints for this step..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowStageModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                {editingStageId ? 'Update Stage' : 'Add Stage'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
