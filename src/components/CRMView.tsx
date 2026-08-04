import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Megaphone,
  Calendar,
  Layers,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import PageStandardsWrapper from './PageStandardsWrapper';
import UniversalCrudEngine from './UniversalCrudEngine';
import { LEADS_CONFIG, MEETINGS_CONFIG, CAMPAIGNS_CONFIG } from '../metadata/configs';
import { DEMO_SEED_ENABLED } from '../lib/dataClient';

interface CRMViewProps {
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

interface ActivityItem {
  id: string;
  subject: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Presentation';
  leadName: string;
  repName: string;
  date: string;
  notes: string;
}

const DEFAULT_LEADS = [
  { id: 'lead_1', name: 'Bashundhara Group Cement Deal', company: 'Bashundhara Group', value: 1200000, email: 'procurement@bashundhara.com', phone: '01711223344', assignedRep: 'Al-Amin Rahman', status: 'Pending Approval', notes: 'Requires custom composite mix formulation.' },
  { id: 'lead_2', name: 'Purbachal Housing Supply', company: 'Purbachal Housing Ltd', value: 450000, email: 'info@purbachal.com', phone: '01822334455', assignedRep: 'Kamal Uddin', status: 'Submitted', notes: 'Initial quote sent. Awaiting feedback.' },
  { id: 'lead_3', name: 'Narayanganj Dockyard Repair', company: 'Dockyard Eng.', value: 90000, email: 'engineering@dockyard.com', phone: '01933445566', assignedRep: 'Siam Hossain', status: 'Draft', notes: 'First contact made. Needs on-site audit.' },
  { id: 'lead_4', name: 'Mirpur Tower Steel Rebar', company: 'Mirpur Builders', value: 2500000, email: 'construction@mirpur.com', phone: '01544556677', assignedRep: 'Rony Mia', status: 'Approved', notes: 'Deal closed. PO received.' }
];

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: 'act_1', subject: 'Initial Technical Consultation', type: 'Meeting', leadName: 'Bashundhara Group Cement Deal', repName: 'Al-Amin Rahman', date: '2026-07-09 11:30 AM', notes: 'Reviewed concrete slump flow standards and tensile capacity needs.' },
  { id: 'act_2', subject: 'Price Quote Delivery Email', type: 'Email', leadName: 'Purbachal Housing Supply', repName: 'Kamal Uddin', date: '2026-07-08 04:15 PM', notes: 'Emailed comprehensive discount breakdown based on bulk quantity.' },
  { id: 'act_3', subject: 'Cold Outreach Followup Call', type: 'Call', leadName: 'Narayanganj Dockyard Repair', repName: 'Siam Hossain', date: '2026-07-07 10:00 AM', notes: 'Discussed drydock requirements. Scheduled yard survey.' }
];

export default function CRMView({ activeSubTab = 'leads', currentUser }: CRMViewProps) {
  const [currentTab, setCurrentTab] = useState<string>(activeSubTab);

  // Sync tab with sidebar clicks
  useEffect(() => {
    if (['leads', 'pipeline', 'activities', 'meetings', 'campaigns'].includes(activeSubTab)) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  // --- CORE STATE MANAGEMENT ---
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState({
    pipelineValue: 0,
    totalLeads: 0,
    wonDeals: 0,
    campaignsCount: 0
  });

  // Load and sync data across tabs
  const loadData = () => {
    try {
      // Load Leads
      const rawLeads = localStorage.getItem('nexova_crud_leads');
      let parsedLeads = [];
      if (rawLeads) {
        parsedLeads = JSON.parse(rawLeads);
      } else if (DEMO_SEED_ENABLED) {
        parsedLeads = DEFAULT_LEADS;
        localStorage.setItem('nexova_crud_leads', JSON.stringify(DEFAULT_LEADS));
      }
      setLeads(parsedLeads);

      // Load Activities
      const rawActivities = localStorage.getItem('nexova_crm_activities');
      let parsedActivities = [];
      if (rawActivities) {
        parsedActivities = JSON.parse(rawActivities);
      } else if (DEMO_SEED_ENABLED) {
        parsedActivities = DEFAULT_ACTIVITIES;
        localStorage.setItem('nexova_crm_activities', JSON.stringify(DEFAULT_ACTIVITIES));
      }
      setActivities(parsedActivities);

      // Load Campaigns
      const rawCampaigns = localStorage.getItem('nexova_crud_campaigns');
      const campaigns = rawCampaigns ? JSON.parse(rawCampaigns) : [];

      // Calculate Metrics
      const pipelineValue = parsedLeads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);
      const totalLeads = parsedLeads.length;
      const wonDeals = parsedLeads.filter((l: any) => l.status === 'Approved' || l.status === 'Closed Won').length;
      const campaignsCount = campaigns.length;

      setMetrics({
        pipelineValue,
        totalLeads,
        wonDeals,
        campaignsCount
      });
    } catch (e: any) {
      console.error(e);
      window.alert(`Error loading CRM database: ${e.message || e}`);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentTab]);

  // --- PIPELINE ACTIONS ---
  const handleAdvanceStage = (leadId: string) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        const stages = LEADS_CONFIG.workflowStatuses || ['Draft', 'Submitted', 'Pending Approval', 'Approved'];
        const currentIdx = stages.indexOf(l.status || 'Draft');
        const nextIdx = Math.min(currentIdx + 1, stages.length - 1);
        return { ...l, status: stages[nextIdx] };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('nexova_crud_leads', JSON.stringify(updated));
    loadData();
    
    // Log auto-activity for stage update
    const lead = updated.find(l => l.id === leadId);
    if (lead) {
      const autoAct: ActivityItem = {
        id: `act_auto_${Date.now()}`,
        subject: `Stage Advanced to ${lead.status}`,
        type: 'Presentation',
        leadName: lead.name,
        repName: currentUser?.name || 'System Auditor',
        date: new Date().toLocaleString(),
        notes: `Deal stage successfully advanced inside the interactive CRM pipeline board.`
      };
      const updatedActs = [autoAct, ...activities];
      setActivities(updatedActs);
      localStorage.setItem('nexova_crm_activities', JSON.stringify(updatedActs));
    }
  };

  const handleDemoteStage = (leadId: string) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        const stages = LEADS_CONFIG.workflowStatuses || ['Draft', 'Submitted', 'Pending Approval', 'Approved'];
        const currentIdx = stages.indexOf(l.status || 'Draft');
        const prevIdx = Math.max(currentIdx - 1, 0);
        return { ...l, status: stages[prevIdx] };
      }
      return l;
    });
    setLeads(updated);
    localStorage.setItem('nexova_crud_leads', JSON.stringify(updated));
    loadData();
  };

  // --- ACTIVITY ACTIONS ---
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    subject: '',
    type: 'Call' as ActivityItem['type'],
    leadId: '',
    repName: currentUser?.name || 'Al-Amin Rahman',
    notes: ''
  });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.subject || !activityForm.leadId) return;

    const matchedLead = leads.find(l => l.id === activityForm.leadId);
    const newAct: ActivityItem = {
      id: `act_${Date.now()}`,
      subject: activityForm.subject,
      type: activityForm.type,
      leadName: matchedLead ? matchedLead.name : 'General Account',
      repName: activityForm.repName,
      date: new Date().toLocaleString(),
      notes: activityForm.notes
    };

    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem('nexova_crm_activities', JSON.stringify(updated));
    setShowActivityModal(false);
    setActivityForm({
      subject: '',
      type: 'Call',
      leadId: '',
      repName: currentUser?.name || 'Al-Amin Rahman',
      notes: ''
    });
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm('Delete this sales interaction activity from audit history?')) {
      const updated = activities.filter(a => a.id !== id);
      setActivities(updated);
      localStorage.setItem('nexova_crm_activities', JSON.stringify(updated));
    }
  };

  // Helper styles for activity types
  const getActivityBadgeStyle = (type: string) => {
    switch (type) {
      case 'Meeting': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'Email': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'Call': return 'bg-amber-50 text-amber-700 border-amber-150';
      default: return 'bg-sky-50 text-sky-700 border-sky-150';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Meeting': return <Users className="h-3.5 w-3.5 text-indigo-600" />;
      case 'Email': return <Mail className="h-3.5 w-3.5 text-emerald-600" />;
      case 'Call': return <Phone className="h-3.5 w-3.5 text-amber-600" />;
      default: return <MessageSquare className="h-3.5 w-3.5 text-sky-600" />;
    }
  };

  return (
    <PageStandardsWrapper
      title="Customer Relationship Management (CRM)"
      subtitle="Govern and nurture corporate client relations, advance deals down the interactive sales board, and log customer meeting outcomes."
      loading={false}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager', 'Sales Agent']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'CRM Module', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* CRM BENTO METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Pipeline Value</div>
            <div className="text-xl font-extrabold text-slate-800">৳{metrics.pipelineValue.toLocaleString()} BDT</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Active pipeline potential
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Opportunities</div>
            <div className="text-xl font-extrabold text-slate-800">{metrics.totalLeads} Accounts</div>
            <div className="text-[11px] text-slate-400">Registered opportunities</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Approved Accounts</div>
            <div className="text-xl font-extrabold text-slate-800">
              {metrics.wonDeals} Deals
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">Auto-synced with Revenue</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Campaigns Active</div>
            <div className="text-xl font-extrabold text-indigo-600">{metrics.campaignsCount} Campaigns</div>
            <div className="text-[11px] text-indigo-500 font-medium">Marketing Outreaches</div>
          </div>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setCurrentTab('leads')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'leads' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Opportunities / Leads</span>
          </button>
          <button
            onClick={() => setCurrentTab('pipeline')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'pipeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Sales Pipeline Board</span>
          </button>
          <button
            onClick={() => setCurrentTab('activities')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'activities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Activities Feed</span>
          </button>
          <button
            onClick={() => setCurrentTab('meetings')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'meetings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Customer Meetings</span>
          </button>
          <button
            onClick={() => setCurrentTab('campaigns')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'campaigns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Marketing Campaigns</span>
          </button>
        </div>

        {/* CORE RENDERER */}
        <div>
          {currentTab === 'leads' && (
            <UniversalCrudEngine
              config={LEADS_CONFIG}
              currentUser={currentUser}
              onDataChange={loadData}
            />
          )}

          {currentTab === 'pipeline' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Opportunity Pipeline Board</h3>
                  <p className="text-[11px] text-slate-400">Advance leads through operational validation cycles using integrated quick stage triggers.</p>
                </div>
                <div className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Real-time Deal Progression Enabled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(LEADS_CONFIG.workflowStatuses || ['Draft', 'Submitted', 'Pending Approval', 'Approved']).map(status => {
                  const itemsInStatus = leads.filter(l => (l.status || 'Draft') === status);
                  const statusValueSum = itemsInStatus.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

                  return (
                    <div key={status} className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-3 flex flex-col min-h-[450px]">
                      {/* Column Header */}
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700">{status}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{itemsInStatus.length} Opportunities</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-indigo-600">৳{statusValueSum.toLocaleString()}</span>
                      </div>

                      {/* Opportunity Cards */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                        {itemsInStatus.length === 0 ? (
                          <div className="text-[10px] text-slate-400 text-center py-10 bg-white/40 rounded-lg border border-dashed border-slate-200">
                            No deals in {status}
                          </div>
                        ) : (
                          itemsInStatus.map(lead => (
                            <div key={lead.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2.5 hover:border-indigo-400 transition-colors">
                              <div>
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">{lead.company}</span>
                                <h4 className="font-bold text-xs text-slate-800 mt-1">{lead.name}</h4>
                              </div>
                              
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Rep: <strong className="text-slate-600 font-semibold">{lead.assignedRep}</strong></span>
                                <span className="font-extrabold text-indigo-600 font-mono">৳{Number(lead.value).toLocaleString()} BDT</span>
                              </div>

                              {lead.notes && (
                                <p className="text-[10px] text-slate-400 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100/50">{lead.notes}</p>
                              )}

                              <div className="flex justify-between border-t border-slate-100/80 pt-2 text-[10px]">
                                <button
                                  disabled={status === 'Draft'}
                                  onClick={() => handleDemoteStage(lead.id)}
                                  className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer disabled:opacity-20"
                                  title="Demote Stage"
                                >
                                  Demote
                                </button>

                                <button
                                  disabled={status === 'Approved'}
                                  onClick={() => handleAdvanceStage(lead.id)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-20"
                                  title="Advance Stage"
                                >
                                  <span>Advance</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentTab === 'activities' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Client Interactions Audit Trail</h3>
                  <p className="text-[11px] text-slate-400">Chronological history of registered cold calls, proposals, technical consults and emails.</p>
                </div>
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Sales Interaction</span>
                </button>
              </div>

              {/* TIMELINE FEED */}
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No registered sales activity logs yet.
                  </div>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="flex gap-4 items-start relative pl-1">
                      {/* Rounded Circle Icon */}
                      <div className="h-10 w-10 rounded-full border border-slate-200 bg-white shadow-xs flex items-center justify-center shrink-0 z-10">
                        {getActivityIcon(act.type)}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-800">{act.subject}</h4>
                              <span className={`text-[9px] px-1.5 rounded-full border font-bold uppercase ${getActivityBadgeStyle(act.type)}`}>
                                {act.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                              Account Link: <strong className="text-indigo-600 font-semibold">{act.leadName}</strong>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">{act.date}</span>
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer rounded transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-normal font-medium">{act.notes}</p>

                        <div className="flex items-center gap-1.5 border-t border-slate-150 pt-2 text-[10px] text-slate-400 font-bold">
                          <UserCheck className="h-3 w-3 text-indigo-500" />
                          <span>Audited by Representative: {act.repName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === 'meetings' && (
            <UniversalCrudEngine
              config={MEETINGS_CONFIG}
              currentUser={currentUser}
              onDataChange={loadData}
            />
          )}

          {currentTab === 'campaigns' && (
            <UniversalCrudEngine
              config={CAMPAIGNS_CONFIG}
              currentUser={currentUser}
              onDataChange={loadData}
            />
          )}
        </div>
      </div>

      {/* ACTIVITY MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateActivity} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Log Sales Interaction</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Interaction Subject *</label>
                <input
                  type="text"
                  required
                  value={activityForm.subject}
                  onChange={e => setActivityForm({ ...activityForm, subject: e.target.value })}
                  placeholder="e.g., Slump flow specification review"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Channel / Type</label>
                  <select
                    value={activityForm.type}
                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Email">Email Communication</option>
                    <option value="Meeting">In-Person Meeting</option>
                    <option value="Presentation">Technical Demo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Representative</label>
                  <input
                    type="text"
                    required
                    value={activityForm.repName}
                    onChange={e => setActivityForm({ ...activityForm, repName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Link Opportunity Lead *</label>
                <select
                  required
                  value={activityForm.leadId}
                  onChange={e => setActivityForm({ ...activityForm, leadId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Account Opportunity --</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Interaction Details & Notes</label>
                <textarea
                  rows={3}
                  value={activityForm.notes}
                  onChange={e => setActivityForm({ ...activityForm, notes: e.target.value })}
                  placeholder="Summarize key takeaways, client queries, or next milestones..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Interaction
              </button>
            </div>
          </form>
        </div>
      )}
    </PageStandardsWrapper>
  );
}
