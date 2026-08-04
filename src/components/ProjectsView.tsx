import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FolderGit2,
  Calendar,
  Layers,
  Sparkles,
  CheckSquare,
  Flag,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Search,
  Filter,
  UserCheck,
  Percent
} from 'lucide-react';
import PageStandardsWrapper from './PageStandardsWrapper';
import UniversalCrudEngine from './UniversalCrudEngine';
import { PROJECTS_CONFIG } from '../metadata/configs';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

interface ProjectsViewProps {
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

interface ProjectTask {
  id: string;
  title: string;
  projectName: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  deadline: string;
  description: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  projectName: string;
  targetDate: string;
  progress: number; // 0-100
  status: 'Draft' | 'Active' | 'Approved';
}

interface ProjectTimesheet {
  id: string;
  date: string;
  projectName: string;
  employeeName: string;
  hours: number;
  activityType: string;
  description: string;
}

const DEFAULT_PROJECTS = [
  { id: 'proj_1', name: 'Purbachal Concrete Tower (Phase 1)', code: 'PCT-01', budget: 3500000, priority: 'High', stage: 'Active' },
  { id: 'proj_2', name: 'Narayanganj Yard Expansion', code: 'NYE-02', budget: 1800000, priority: 'Medium', stage: 'Active' },
  { id: 'proj_3', name: 'Meghna Bulk Distribution', code: 'MBD-03', budget: 1250000, priority: 'Medium', stage: 'Review' }
];

const DEFAULT_TASKS: ProjectTask[] = [
  { id: 'task_1', title: 'Excavation and Soil Compaction', projectName: 'Purbachal Concrete Tower (Phase 1)', assignee: 'Engr. Jamil Chowdhury', priority: 'High', status: 'Completed', deadline: '2026-07-05', description: 'Ensure compaction meets 98% dry density standards.' },
  { id: 'task_2', title: 'Rebar Binding and Formwork', projectName: 'Purbachal Concrete Tower (Phase 1)', assignee: 'Sabbir Rahman', priority: 'High', status: 'In Progress', deadline: '2026-07-20', description: 'Bind heavy 16mm rebar cage structure for core columns.' },
  { id: 'task_3', title: 'Aisle Setup & Rack Installation', projectName: 'Narayanganj Yard Expansion', assignee: 'Tasnim Ahmed', priority: 'Medium', status: 'To Do', deadline: '2026-07-25', description: 'Erect structural metal racking systems along Zone A.' },
  { id: 'task_4', title: 'Bulk Load Dispatch Logistics', projectName: 'Meghna Bulk Distribution', assignee: 'Farhana Yasmin', priority: 'Medium', status: 'Review', deadline: '2026-07-15', description: 'Coordinate dispatch manifests for 40-ton container trucks.' }
];

const DEFAULT_MILESTONES: ProjectMilestone[] = [
  { id: 'mile_1', title: 'Substructure Completion', projectName: 'Purbachal Concrete Tower (Phase 1)', targetDate: '2026-07-15', progress: 90, status: 'Active' },
  { id: 'mile_2', title: 'Superstructure Framing', projectName: 'Purbachal Concrete Tower (Phase 1)', targetDate: '2026-09-01', progress: 10, status: 'Draft' },
  { id: 'mile_3', title: 'Fencing & Boundary Gate Set', projectName: 'Narayanganj Yard Expansion', targetDate: '2026-07-24', progress: 100, status: 'Approved' },
  { id: 'mile_4', title: 'Racking & Bin Configurations', projectName: 'Narayanganj Yard Expansion', targetDate: '2026-08-15', progress: 0, status: 'Active' }
];

const DEFAULT_TIMESHEETS: ProjectTimesheet[] = [
  { id: 'time_1', date: '2026-07-09', projectName: 'Purbachal Concrete Tower (Phase 1)', employeeName: 'Engr. Jamil Chowdhury', hours: 8, activityType: 'Supervision', description: 'Supervised concrete pouring and test cylinder sampling.' },
  { id: 'time_2', date: '2026-07-08', projectName: 'Narayanganj Yard Expansion', employeeName: 'Tasnim Ahmed', hours: 6, activityType: 'Design', description: 'Drafted layout maps for Zone B racking allocator.' },
  { id: 'time_3', date: '2026-07-10', projectName: 'Meghna Bulk Distribution', employeeName: 'Farhana Yasmin', hours: 4, activityType: 'Operations', description: 'Dispatched cement lot freight trucks.' }
];

export default function ProjectsView({ activeSubTab = 'projects', currentUser }: ProjectsViewProps) {
  const [currentTab, setCurrentTab] = useState<string>(activeSubTab);

  // Sync subTab with sidebar selection
  useEffect(() => {
    if (['projects', 'tasks', 'kanban', 'calendar', 'milestones', 'timesheets'].includes(activeSubTab)) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  // --- LOCAL STATE ---
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [timesheets, setTimesheets] = useState<ProjectTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalBudget: 0,
    totalProjects: 0,
    highPriority: 0,
    activeStage: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Projects
      const legacyProjs = localStorage.getItem('nexova_crud_projects');
      let initialProjs = DEFAULT_PROJECTS;
      if (legacyProjs) {
        try { initialProjs = JSON.parse(legacyProjs); } catch (e) {}
      }
      const parsedProjs = await seedCollectionIfEmpty('projects', initialProjs);
      setProjects(parsedProjs || []);
      if (legacyProjs) {
        localStorage.removeItem('nexova_crud_projects');
      }

      // 2. Tasks
      const legacyTasks = localStorage.getItem('nexova_project_tasks');
      let initialTasks = DEFAULT_TASKS;
      if (legacyTasks) {
        try { initialTasks = JSON.parse(legacyTasks); } catch (e) {}
      }
      const parsedTasks = await seedCollectionIfEmpty('projectTasks', initialTasks);
      setTasks(parsedTasks || []);
      if (legacyTasks) {
        localStorage.removeItem('nexova_project_tasks');
      }

      // 3. Milestones
      const legacyMiles = localStorage.getItem('nexova_project_milestones');
      let initialMiles = DEFAULT_MILESTONES;
      if (legacyMiles) {
        try { initialMiles = JSON.parse(legacyMiles); } catch (e) {}
      }
      const parsedMiles = await seedCollectionIfEmpty('projectMilestones', initialMiles);
      setMilestones(parsedMiles || []);
      if (legacyMiles) {
        localStorage.removeItem('nexova_project_milestones');
      }

      // 4. Timesheets
      const legacyTimes = localStorage.getItem('nexova_project_timesheets');
      let initialTimes = DEFAULT_TIMESHEETS;
      if (legacyTimes) {
        try { initialTimes = JSON.parse(legacyTimes); } catch (e) {}
      }
      const parsedTimes = await seedCollectionIfEmpty('projectTimesheets', initialTimes);
      setTimesheets(parsedTimes || []);
      if (legacyTimes) {
        localStorage.removeItem('nexova_project_timesheets');
      }

      // Calculations for metrics
      const totalBudget = (parsedProjs || []).reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
      const totalProjects = (parsedProjs || []).length;
      const highPriority = (parsedTasks || []).filter(t => t.priority === 'High' && t.status !== 'Completed').length;
      const activeStage = (parsedProjs || []).filter(p => p.stage === 'Active' || p.stage === 'In Progress').length;

      setMetrics({
        totalBudget,
        totalProjects,
        highPriority,
        activeStage
      });
    } catch (e: any) {
      console.error(e);
      window.alert(`Error loading projects portfolio registry data: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [currentTab]);

  // --- ACTIONS ---
  // A. Tasks
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectName: 'Purbachal Concrete Tower (Phase 1)',
    assignee: 'Engr. Jamil Chowdhury',
    priority: 'Medium' as ProjectTask['priority'],
    status: 'To Do' as ProjectTask['status'],
    deadline: '2026-07-15',
    description: ''
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    const newTask: ProjectTask = {
      id: `task_${Date.now()}`,
      title: taskForm.title,
      projectName: taskForm.projectName,
      assignee: taskForm.assignee,
      priority: taskForm.priority,
      status: taskForm.status,
      deadline: taskForm.deadline,
      description: taskForm.description
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    syncCollectionToFirestore('projectTasks', updated);
    setShowTaskModal(false);
    setTaskForm({
      title: '',
      projectName: 'Purbachal Concrete Tower (Phase 1)',
      assignee: 'Engr. Jamil Chowdhury',
      priority: 'Medium',
      status: 'To Do',
      deadline: '2026-07-15',
      description: ''
    });
    loadData();
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Permanently remove this task from project roster?')) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      syncCollectionToFirestore('projectTasks', updated);
      loadData();
    }
  };

  const handleAdvanceTask = (taskId: string) => {
    const statuses: ProjectTask['status'][] = ['To Do', 'In Progress', 'Review', 'Completed'];
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const idx = statuses.indexOf(t.status);
        const nextIdx = Math.min(idx + 1, statuses.length - 1);
        return { ...t, status: statuses[nextIdx] };
      }
      return t;
    });
    setTasks(updated);
    syncCollectionToFirestore('projectTasks', updated);
    loadData();
  };

  const handleDemoteTask = (taskId: string) => {
    const statuses: ProjectTask['status'][] = ['To Do', 'In Progress', 'Review', 'Completed'];
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const idx = statuses.indexOf(t.status);
        const prevIdx = Math.max(idx - 1, 0);
        return { ...t, status: statuses[prevIdx] };
      }
      return t;
    });
    setTasks(updated);
    syncCollectionToFirestore('projectTasks', updated);
    loadData();
  };

  // B. Milestones
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    projectName: 'Purbachal Concrete Tower (Phase 1)',
    targetDate: '2026-07-30',
    progress: '50',
    status: 'Active' as ProjectMilestone['status']
  });

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.title) return;

    const newMile: ProjectMilestone = {
      id: `mile_${Date.now()}`,
      title: milestoneForm.title,
      projectName: milestoneForm.projectName,
      targetDate: milestoneForm.targetDate,
      progress: parseInt(milestoneForm.progress) || 0,
      status: milestoneForm.status
    };

    const updated = [...milestones, newMile];
    setMilestones(updated);
    syncCollectionToFirestore('projectMilestones', updated);
    setShowMilestoneModal(false);
    setMilestoneForm({
      title: '',
      projectName: 'Purbachal Concrete Tower (Phase 1)',
      targetDate: '2026-07-30',
      progress: '50',
      status: 'Active'
    });
    loadData();
  };

  const handleProgressChange = (id: string, diff: number) => {
    const updated = milestones.map(m => {
      if (m.id === id) {
        const nextProg = Math.max(0, Math.min(100, m.progress + diff));
        const nextStatus = nextProg === 100 ? 'Approved' as const : m.status;
        return { ...m, progress: nextProg, status: nextStatus };
      }
      return m;
    });
    setMilestones(updated);
    syncCollectionToFirestore('projectMilestones', updated);
    loadData();
  };

  const handleDeleteMilestone = (id: string) => {
    if (confirm('Archive this project milestone?')) {
      const updated = milestones.filter(m => m.id !== id);
      setMilestones(updated);
      syncCollectionToFirestore('projectMilestones', updated);
      loadData();
    }
  };

  // C. Timesheets
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [timesheetForm, setTimesheetForm] = useState({
    projectName: 'Purbachal Concrete Tower (Phase 1)',
    hours: '8',
    activityType: 'Supervision',
    description: ''
  });

  const handleCreateTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetForm.description) return;

    const newTime: ProjectTimesheet = {
      id: `time_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      projectName: timesheetForm.projectName,
      employeeName: currentUser?.name || 'Guest Auditor',
      hours: parseFloat(timesheetForm.hours) || 8,
      activityType: timesheetForm.activityType,
      description: timesheetForm.description
    };

    const updated = [newTime, ...timesheets];
    setTimesheets(updated);
    syncCollectionToFirestore('projectTimesheets', updated);
    setShowTimesheetModal(false);
    setTimesheetForm({
      projectName: 'Purbachal Concrete Tower (Phase 1)',
      hours: '8',
      activityType: 'Supervision',
      description: ''
    });
    loadData();
  };

  const handleDeleteTimesheet = (id: string) => {
    if (confirm('Delete timesheet entry?')) {
      const updated = timesheets.filter(t => t.id !== id);
      setTimesheets(updated);
      syncCollectionToFirestore('projectTimesheets', updated);
      loadData();
    }
  };

  // D. Calendar Logic (Generates days in July 2026 for a highly professional representation)
  const getDaysInJuly2026 = () => {
    const days: Array<{
      blank?: boolean;
      day?: number;
      dateStr?: string;
      tasks?: typeof tasks;
      milestones?: typeof milestones;
    }> = [];
    // Start offset: Wed July 1st 2026 is Wed (offset index 3, if Sun is 0)
    const offset = 3; 
    for (let i = 1; i <= offset; i++) {
      days.push({ blank: true, tasks: [], milestones: [] });
    }
    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
      const dayTasks = tasks.filter(t => t.deadline === dateStr);
      const dayMilestones = milestones.filter(m => m.targetDate === dateStr);
      days.push({
        day,
        dateStr,
        tasks: dayTasks,
        milestones: dayMilestones
      });
    }
    return days;
  };

  // Helpers
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'Review': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-150';
      default: return 'bg-slate-50 text-slate-500 border-slate-150';
    }
  };

  return (
    <PageStandardsWrapper
      title="Corporate Project Board Registry"
      subtitle="Register portfolios, execute operations checklists, monitor deadlines via interactive calendar maps, and verify worker timesheets."
      loading={false}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager', 'Sales Agent']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'Project Portfolios', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* PROJECTS METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Project Portfolios</div>
            <div className="text-xl font-extrabold text-slate-800">{metrics.totalProjects} Portfolios</div>
            <div className="text-[11px] text-indigo-500 font-medium">Under active tracking</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Aggregated Budgets</div>
            <div className="text-xl font-extrabold text-slate-800">৳{metrics.totalBudget.toLocaleString()} BDT</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Fully governed capitals
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">High Priority Criticals</div>
            <div className="text-xl font-extrabold text-rose-600">{metrics.highPriority} Tasks</div>
            <div className="text-[11px] text-rose-500 font-medium">Require executive reviews</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Board Stages</div>
            <div className="text-xl font-extrabold text-indigo-600">{metrics.activeStage} In-Progress</div>
            <div className="text-[11px] text-slate-400">Daily deployments</div>
          </div>
        </div>

        {/* SUB-TAB SELECTOR */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setCurrentTab('projects')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'projects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Projects Registry</span>
          </button>
          <button
            onClick={() => setCurrentTab('tasks')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks Roster</span>
          </button>
          <button
            onClick={() => setCurrentTab('kanban')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'kanban' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'calendar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendar Grid</span>
          </button>
          <button
            onClick={() => setCurrentTab('milestones')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'milestones' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Milestones Tracker</span>
          </button>
          <button
            onClick={() => setCurrentTab('timesheets')}
            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'timesheets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Employee Timesheets</span>
          </button>
        </div>

        {/* CORE VIEWS */}
        <div>
          {/* A. PROJECTS CRUD */}
          {currentTab === 'projects' && (
            <UniversalCrudEngine
              config={PROJECTS_CONFIG}
              currentUser={currentUser}
              onDataChange={loadData}
            />
          )}

          {/* B. TASKS ROSTER */}
          {currentTab === 'tasks' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Project Action Items</h3>
                  <p className="text-[11px] text-slate-400">Configure assignees, review timelines, and record operational task completions.</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Assign Action Item</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-2.5 px-4">Action Item</th>
                      <th className="py-2.5 px-4">Associated Portfolio</th>
                      <th className="py-2.5 px-4">Field Assignee</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Stage Status</th>
                      <th className="py-2.5 px-4 font-mono">Deadline</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                          No registered project tasks. Add one to begin.
                        </td>
                      </tr>
                    ) : (
                      tasks.map(task => (
                        <tr key={task.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{task.title}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1">{task.description}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{task.projectName}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded">
                              {task.assignee}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] border uppercase ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${getTaskStatusBadge(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{task.deadline}</td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleDemoteTask(task.id)}
                              disabled={task.status === 'To Do'}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 disabled:opacity-25"
                              title="Demote status"
                            >
                              Demote
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleAdvanceTask(task.id)}
                              disabled={task.status === 'Completed'}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-25"
                              title="Advance status"
                            >
                              Advance
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Archive Task"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
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

          {/* C. KANBAN BOARD */}
          {currentTab === 'kanban' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Agile Visual Task Board</h3>
                  <p className="text-[11px] text-slate-400">Progress operational tasks visually from planning blocks through quality reviews and final deliveries.</p>
                </div>
                <div className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Stateful Drag Operations Simulators</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['To Do', 'In Progress', 'Review', 'Completed'] as const).map(status => {
                  const columnTasks = tasks.filter(t => t.status === status);
                  return (
                    <div key={status} className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[420px]">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">{status}</span>
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-full">{columnTasks.length}</span>
                      </div>

                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px]">
                        {columnTasks.length === 0 ? (
                          <div className="text-[10px] text-slate-400 text-center py-10 bg-white/40 rounded-lg border border-dashed border-slate-200">
                            No tasks in this lane
                          </div>
                        ) : (
                          columnTasks.map(t => (
                            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2.5 hover:border-indigo-400 transition-colors">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase block truncate">{t.projectName}</span>
                                <h4 className="font-bold text-xs text-slate-800 mt-1">{t.title}</h4>
                              </div>

                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Assignee: <strong className="text-indigo-600 font-semibold">{t.assignee}</strong></span>
                                <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase border ${getPriorityStyle(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </div>

                              {t.description && (
                                <p className="text-[10px] text-slate-400 bg-slate-50 p-1.5 rounded border border-slate-100/50 line-clamp-2">{t.description}</p>
                              )}

                              <div className="flex justify-between border-t border-slate-100/80 pt-2 text-[10px]">
                                <button
                                  disabled={status === 'To Do'}
                                  onClick={() => handleDemoteTask(t.id)}
                                  className="text-slate-400 hover:text-indigo-600 font-bold disabled:opacity-20 cursor-pointer"
                                >
                                  Back
                                </button>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">Due: {t.deadline.split('-')[2]} Jul</span>
                                <button
                                  disabled={status === 'Completed'}
                                  onClick={() => handleAdvanceTask(t.id)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 disabled:opacity-20 cursor-pointer"
                                >
                                  <span>Next</span>
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

          {/* D. CALENDAR GRID */}
          {currentTab === 'calendar' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Project Schedule Map - July 2026</h3>
                  <p className="text-[11px] text-slate-400">Analyze deliverables and target milestones chronologically on a standard monthly dispatcher calendar.</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] text-slate-400 font-bold mr-3">Tasks</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-bold">Milestones</span>
                </div>
              </div>

              {/* Monthly Grid Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 py-1.5 rounded-md">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Monthly Grid Days */}
              <div className="grid grid-cols-7 gap-1.5 min-h-[400px]">
                {getDaysInJuly2026().map((dayObj, idx) => {
                  if (dayObj.blank) {
                    // index key safe: fixed-order static list
                    return <div key={`blank_${idx}`} className="bg-slate-50/20 border border-slate-100 rounded-lg min-h-[70px]"></div>;
                  }

                  const tasksList = dayObj.tasks || [];
                  const milestonesList = dayObj.milestones || [];
                  const hasEvents = tasksList.length > 0 || milestonesList.length > 0;

                  return (
                    <div
                      key={`day_${dayObj.day}`}
                      className={`border rounded-lg p-1.5 min-h-[85px] flex flex-col justify-between transition-colors bg-white hover:bg-slate-50/50 ${
                        hasEvents ? 'border-indigo-200/80 shadow-xs' : 'border-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-extrabold text-slate-400">{dayObj.day}</span>
                      
                      <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                        {tasksList.map(t => (
                          <div
                            key={t.id}
                            className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8px] font-bold px-1 py-0.5 rounded truncate"
                            title={`Task: ${t.title} (${t.projectName})`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {milestonesList.map(m => (
                          <div
                            key={m.id}
                            className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-[8px] font-bold px-1 py-0.5 rounded truncate"
                            title={`Milestone: ${m.title} (${m.projectName})`}
                          >
                            ⭐ {m.title}
                          </div>
                        ))}
                      </div>

                      {hasEvents && (
                        <div className="text-[8px] font-mono font-extrabold text-indigo-600 tracking-wider">
                          {tasksList.length + milestonesList.length} Events
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* E. MILESTONES TRACKER */}
          {currentTab === 'milestones' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Strategic Portfolio Milestones</h3>
                  <p className="text-[11px] text-slate-400">Track key phases and civil handovers with automated linear progression calculators.</p>
                </div>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Establish Milestone</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestones.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-400">
                    No active strategic milestones logged.
                  </div>
                ) : (
                  milestones.map(m => (
                    <div key={m.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase">{m.projectName}</span>
                          <h4 className="font-bold text-xs text-slate-800 mt-0.5">{m.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                            m.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {m.status}
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="Archive Milestone"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Progress Tracker</span>
                          <span className="font-bold text-slate-800 flex items-center gap-0.5">
                            <Percent className="h-2.5 w-2.5 text-indigo-500" /> {m.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${m.progress}%` }}></div>
                        </div>
                      </div>

                      {/* Manual Progression buttons */}
                      <div className="flex justify-between items-center border-t border-slate-100/80 pt-2 text-[10px]">
                        <span className="font-mono text-slate-400">Target Date: <strong className="font-semibold text-slate-600">{m.targetDate}</strong></span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleProgressChange(m.id, -10)}
                            disabled={m.progress === 0}
                            className="bg-white hover:bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 cursor-pointer font-bold disabled:opacity-20"
                          >
                            -10%
                          </button>
                          <button
                            onClick={() => handleProgressChange(m.id, 10)}
                            disabled={m.progress === 100}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded cursor-pointer font-bold disabled:opacity-20"
                          >
                            +10%
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* F. TIMESHEETS */}
          {currentTab === 'timesheets' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Employee Labor Allocations</h3>
                  <p className="text-[11px] text-slate-400">Audit clocked hours, project tasks breakdowns, and activity logs matching payroll periods.</p>
                </div>
                <button
                  onClick={() => setShowTimesheetModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Operational Hours</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                      <th className="py-2.5 px-4">Date Logged</th>
                      <th className="py-2.5 px-4">Portfolio Link</th>
                      <th className="py-2.5 px-4">Staff Member</th>
                      <th className="py-2.5 px-4">Activity Category</th>
                      <th className="py-2.5 px-4">Work Descriptions</th>
                      <th className="py-2.5 px-4 text-right">Hours Logged</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                          No timesheet registers logged for this fiscal block.
                        </td>
                      </tr>
                    ) : (
                      timesheets.map(t => (
                        <tr key={t.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-400">{t.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{t.projectName}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{t.employeeName}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[9px] bg-slate-100 text-slate-500 border border-slate-200/50 px-2 py-0.5 rounded">
                              {t.activityType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{t.description}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-indigo-600 font-mono">{t.hours} hrs</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteTimesheet(t.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>


      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateTask} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Assign Project Action Item</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Action Item Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g., Concrete slumping compliance assay"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Associated Portfolio</label>
                  <select
                    value={taskForm.projectName}
                    onChange={e => setTaskForm({ ...taskForm, projectName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Deadline Target</label>
                  <input
                    type="date"
                    required
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Assignee</label>
                  <input
                    type="text"
                    required
                    value={taskForm.assignee}
                    onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                    placeholder="Engr Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Priority Level</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Action Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task scope details, materials requirements, or safety hazards..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMilestone} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Define Portfolio Milestone</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  placeholder="e.g., Core Framing Handover"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Portfolio</label>
                  <select
                    value={milestoneForm.projectName}
                    onChange={e => setMilestoneForm({ ...milestoneForm, projectName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Target Date</label>
                  <input
                    type="date"
                    required
                    value={milestoneForm.targetDate}
                    onChange={e => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Initial Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={milestoneForm.progress}
                    onChange={e => setMilestoneForm({ ...milestoneForm, progress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Initial Stage</label>
                  <select
                    value={milestoneForm.status}
                    onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Draft">Draft Stage</option>
                    <option value="Active">Active Tracking</option>
                    <option value="Approved">Approved / Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Milestone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TIMESHEET MODAL */}
      {showTimesheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateTimesheet} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Log Operational Labor Hours</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Project Portfolio</label>
                  <select
                    value={timesheetForm.projectName}
                    onChange={e => setTimesheetForm({ ...timesheetForm, projectName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Activity Type</label>
                  <select
                    value={timesheetForm.activityType}
                    onChange={e => setTimesheetForm({ ...timesheetForm, activityType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Supervision">Field Supervision</option>
                    <option value="Design">Structural Design</option>
                    <option value="Operations">Freight Operations</option>
                    <option value="Quality Assay">QC Testing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Hours Logged *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={timesheetForm.hours}
                  onChange={e => setTimesheetForm({ ...timesheetForm, hours: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Logged Work Description *</label>
                <textarea
                  rows={3}
                  required
                  value={timesheetForm.description}
                  onChange={e => setTimesheetForm({ ...timesheetForm, description: e.target.value })}
                  placeholder="Precisely specify daily accomplishments, team safety sweeps, or logistics logs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none resize-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowTimesheetModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Log Labor Sheet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  </PageStandardsWrapper>
  );
}
