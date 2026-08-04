import React, { useState, useEffect } from 'react';
import { Employee, Attendance } from '../types';
import {
  Users,
  UserCheck,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Briefcase,
  Award,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Star
} from 'lucide-react';
import PageStandardsWrapper from './PageStandardsWrapper';
import UniversalCrudEngine from './UniversalCrudEngine';
import { EMPLOYEES_CONFIG } from '../metadata/configs';

interface EmployeeViewProps {
  employees?: Employee[];
  attendances?: Attendance[];
  onAddEmployee?: (emp: Omit<Employee, 'id'>) => void;
  onUpdateAttendance?: (employeeId: string, status: Attendance['status']) => void;
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

export default function EmployeeView({
  employees = [],
  attendances = [],
  onAddEmployee,
  onUpdateAttendance,
  activeSubTab = 'employees_list',
  currentUser
}: EmployeeViewProps) {
  // --- STATE PERSISTENCE HANDLERS ---
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [recruitmentCandidates, setRecruitmentCandidates] = useState<any[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [appraisalLogs, setAppraisalLogs] = useState<any[]>([]);

  // Selected date for attendance logging
  const [attendanceDate, setAttendanceDate] = useState<string>('2026-07-11');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  
  // Modals / Form overlays
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showPaySlipModal, setShowPaySlipModal] = useState<any | null>(null);

  // Forms
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'Annual Leave',
    startDate: '2026-07-15',
    endDate: '2026-07-20',
    reason: ''
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Engineering',
    salaryRange: '৳80,000 - ৳1,20,000',
    openings: '1',
    status: 'Open'
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    expectedSalary: '',
    experienceYears: '',
    notes: ''
  });

  const [appraisalForm, setAppraisalForm] = useState({
    employeeId: '',
    workQuality: 5,
    attendanceRating: 5,
    teamwork: 5,
    initiative: 5,
    kpiTarget: '',
    comments: ''
  });

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeCount: 0,
    presentToday: 0,
    payroll: 0
  });

  // --- HR & WAGE ALLOCATION REPORT STATES ---
  const [allocationForm, setAllocationForm] = useState({
    employeeId: '',
    overtimeHours: 0,
    overtimeRate: 500,
    bonus: 0,
    taxRate: 10
  });
  const [allocSearch, setAllocSearch] = useState('');
  const [allocDept, setAllocDept] = useState('All');
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const handleUpdateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationForm.employeeId) return;

    const updated = employeesList.map(emp => {
      if (emp.id === allocationForm.employeeId) {
        return {
          ...emp,
          overtimeHours: Number(allocationForm.overtimeHours) || 0,
          overtimeRate: Number(allocationForm.overtimeRate) || 0,
          bonus: Number(allocationForm.bonus) || 0,
          taxRate: Number(allocationForm.taxRate) || 0
        };
      }
      return emp;
    });

    setEmployeesList(updated);
    localStorage.setItem('nexova_crud_employees', JSON.stringify(updated));

    // Reset form
    setAllocationForm({
      employeeId: '',
      overtimeHours: 0,
      overtimeRate: 500,
      bonus: 0,
      taxRate: 10
    });
  };

  const handleResetAllocations = () => {
    if (window.confirm('Are you sure you want to clear overtime and bonuses for all employees? (আপনি কি নিশ্চিত সব কর্মীর ওভারটাইম এবং বোনাস মুছে ফেলতে চান?)')) {
      const updated = employeesList.map(emp => ({
        ...emp,
        overtimeHours: 0,
        overtimeRate: 500,
        bonus: 0,
        taxRate: 10
      }));
      setEmployeesList(updated);
      localStorage.setItem('nexova_crud_employees', JSON.stringify(updated));
    }
  };

  // --- COMPUTE ACTIVE TAB ---
  const currentTab = ['employees_list', 'attendance', 'leave', 'payroll', 'recruitment', 'appraisal', 'employee_report'].includes(activeSubTab)
    ? activeSubTab
    : 'employees_list';

  // --- INITIAL SEEDING & LOADING CONTROLLERS ---
  const loadAllData = () => {
    // 1. Employees Directory
    const rawEmps = localStorage.getItem('nexova_crud_employees');
    let emps: any[] = [];
    if (rawEmps) {
      try { emps = JSON.parse(rawEmps); } catch (e) { emps = []; }
    }
    // If empty, generate standard demo set to support user testing instantly
    if (emps.length === 0) {
      emps = [
        { id: 'emp_1', name: 'Arif Hossain', department: 'Engineering', designation: 'Senior Software Engineer', salary: 125000, email: 'arif@nexovaerp.com', phone: '01712345678', workStatus: 'Active', joiningDate: '2023-04-10' },
        { id: 'emp_2', name: 'Shamima Nasrin', department: 'HR', designation: 'HR & Operations Lead', salary: 85000, email: 'shamima@nexovaerp.com', phone: '01812345678', workStatus: 'Active', joiningDate: '2024-01-15' },
        { id: 'emp_3', name: 'Zahid Hasan', department: 'Sales', designation: 'Regional Sales Manager', salary: 65000, email: 'zahid@nexovaerp.com', phone: '01912345678', workStatus: 'Active', joiningDate: '2024-11-01' },
        { id: 'emp_4', name: 'Mominul Islam', department: 'Logistics', designation: 'Warehouse Supervisor', salary: 60000, email: 'mominul@nexovaerp.com', phone: '01512345678', workStatus: 'Active', joiningDate: '2025-02-20' }
      ];
      localStorage.setItem('nexova_crud_employees', JSON.stringify(emps));
    }
    setEmployeesList(emps);

    // 2. Attendance database
    const rawAtt = localStorage.getItem('nexova_hr_attendance');
    let attLogs: any[] = [];
    if (rawAtt) {
      try { attLogs = JSON.parse(rawAtt); } catch (e) {}
    }
    if (attLogs.length === 0) {
      attLogs = [
        { id: 'att_1', employeeId: 'emp_1', employeeName: 'Arif Hossain', date: '2026-07-11', status: 'Present', checkIn: '08:52 AM', checkOut: '05:05 PM' },
        { id: 'att_2', employeeId: 'emp_2', employeeName: 'Shamima Nasrin', date: '2026-07-11', status: 'Present', checkIn: '08:58 AM', checkOut: '05:00 PM' },
        { id: 'att_3', employeeId: 'emp_3', employeeName: 'Zahid Hasan', date: '2026-07-11', status: 'Late', checkIn: '09:24 AM', checkOut: '05:15 PM' },
        { id: 'att_4', employeeId: 'emp_4', employeeName: 'Mominul Islam', date: '2026-07-11', status: 'Present', checkIn: '08:45 AM', checkOut: '04:45 PM' },
        { id: 'att_5', employeeId: 'emp_1', employeeName: 'Arif Hossain', date: '2026-07-10', status: 'Present', checkIn: '08:55 AM', checkOut: '05:10 PM' },
        { id: 'att_6', employeeId: 'emp_2', employeeName: 'Shamima Nasrin', date: '2026-07-10', status: 'Present', checkIn: '08:45 AM', checkOut: '05:00 PM' }
      ];
      localStorage.setItem('nexova_hr_attendance', JSON.stringify(attLogs));
    }
    setAttendanceLogs(attLogs);

    // 3. Leave Register database
    const rawLeave = localStorage.getItem('nexova_hr_leaves');
    let leaves: any[] = [];
    if (rawLeave) {
      try { leaves = JSON.parse(rawLeave); } catch (e) {}
    }
    if (leaves.length === 0) {
      leaves = [
        { id: 'lv_1', employeeId: 'emp_1', employeeName: 'Arif Hossain', leaveType: 'Casual Leave', startDate: '2026-07-15', endDate: '2026-07-17', reason: 'Family engagement in Sylhet', status: 'Pending' },
        { id: 'lv_2', employeeId: 'emp_4', employeeName: 'Mominul Islam', leaveType: 'Annual Leave', startDate: '2026-08-01', endDate: '2026-08-07', reason: 'Annual holiday trip', status: 'Approved' },
        { id: 'lv_3', employeeId: 'emp_3', employeeName: 'Zahid Hasan', leaveType: 'Sick Leave', startDate: '2026-07-01', endDate: '2026-07-02', reason: 'High fever', status: 'Approved' }
      ];
      localStorage.setItem('nexova_hr_leaves', JSON.stringify(leaves));
    }
    setLeaveRequests(leaves);

    // 4. Job Openings
    const rawJobs = localStorage.getItem('nexova_hr_jobs');
    let jobs: any[] = [];
    if (rawJobs) {
      try { jobs = JSON.parse(rawJobs); } catch (e) {}
    }
    if (jobs.length === 0) {
      jobs = [
        { id: 'job_1', title: 'Senior AI Core Architect', department: 'Engineering', salaryRange: '৳1,50,000 - ৳2,20,000', openings: '2', status: 'Open' },
        { id: 'job_2', title: 'Corporate Relations Executive', department: 'Sales', salaryRange: '৳45,000 - ৳60,000', openings: '3', status: 'Open' },
        { id: 'job_3', title: 'Lead Ledger Accountant', department: 'Accounts', salaryRange: '৳80,000 - ৳1,00,000', openings: '1', status: 'Filled' }
      ];
      localStorage.setItem('nexova_hr_jobs', JSON.stringify(jobs));
    }
    setJobPostings(jobs);

    // 5. Candidates
    const rawCand = localStorage.getItem('nexova_hr_candidates');
    let candidates: any[] = [];
    if (rawCand) {
      try { candidates = JSON.parse(rawCand); } catch (e) {}
    }
    if (candidates.length === 0) {
      candidates = [
        { id: 'cand_1', name: 'Tahmid Rahman', email: 'tahmid@outlook.com', phone: '01700112233', jobId: 'job_1', jobTitle: 'Senior AI Core Architect', expectedSalary: '180000', experienceYears: '6', notes: 'Expert in large transformer models. Clear recommendation from tech panel.', stage: 'Interviewing' },
        { id: 'cand_2', name: 'Sabrina Jahan', email: 'sabrina.j@gmail.com', phone: '01899887766', jobId: 'job_2', jobTitle: 'Corporate Relations Executive', expectedSalary: '50000', experienceYears: '3', notes: 'Good communications skills, corporate client portfolio from fintech background.', stage: 'Offered' },
        { id: 'cand_3', name: 'Abdur Rahim', email: 'rahim.audit@gmail.com', phone: '01955443322', jobId: 'job_3', jobTitle: 'Lead Ledger Accountant', expectedSalary: '90000', experienceYears: '8', notes: 'CA intermediate passed. Joined last week.', stage: 'Hired' }
      ];
      localStorage.setItem('nexova_hr_candidates', JSON.stringify(candidates));
    }
    setRecruitmentCandidates(candidates);

    // 6. Appraisal Ratings
    const rawApp = localStorage.getItem('nexova_hr_appraisals');
    let appraisals: any[] = [];
    if (rawApp) {
      try { appraisals = JSON.parse(rawApp); } catch (e) {}
    }
    if (appraisals.length === 0) {
      appraisals = [
        { id: 'ap_1', employeeId: 'emp_1', employeeName: 'Arif Hossain', workQuality: 5, attendanceRating: 5, teamwork: 4, initiative: 5, average: 4.75, kpiTarget: 'Launch V2.0 of Ledger Core and setup offline cache.', comments: 'Outstanding performance. Highly technical and helpful lead.', reviewDate: '2026-06-30' },
        { id: 'ap_2', employeeId: 'emp_2', employeeName: 'Shamima Nasrin', workQuality: 4, attendanceRating: 5, teamwork: 5, initiative: 4, average: 4.5, kpiTarget: 'Streamline campus recruitment pipeline and reduce onboarding time.', comments: 'Extremely dependable HR Lead. Drives compliance flawlessly.', reviewDate: '2026-06-28' }
      ];
      localStorage.setItem('nexova_hr_appraisals', JSON.stringify(appraisals));
    }
    setAppraisalLogs(appraisals);

    // 7. Calculate HRM summary statistics
    const totalEmployees = emps.length;
    const activeCount = emps.filter(e => e.workStatus === 'Active').length;
    
    // Calculate daily attendance status based on selected date
    const attendanceRecordsForDate = attLogs.filter(a => a.date === attendanceDate);
    const presentTodayCount = attendanceRecordsForDate.filter(r => r.status === 'Present' || r.status === 'Late').length || activeCount;
    
    // Total salaries sum
    const payrollAmount = emps.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

    setMetrics({
      totalEmployees,
      activeCount,
      presentToday: presentTodayCount,
      payroll: payrollAmount
    });
  };

  useEffect(() => {
    loadAllData();
    window.addEventListener('storage', loadAllData);
    return () => window.removeEventListener('storage', loadAllData);
  }, [attendanceDate]);

  // --- ATTENDANCE ACTIONS ---
  const handleToggleAttendanceStatus = (employeeId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    const matchedEmp = employeesList.find(e => e.id === employeeId);
    if (!matchedEmp) return;

    let updated = [...attendanceLogs];
    const matchIdx = updated.findIndex(log => log.employeeId === employeeId && log.date === attendanceDate);

    // Default times based on status
    let checkIn = '';
    let checkOut = '';
    if (status === 'Present') { checkIn = '08:50 AM'; checkOut = '05:00 PM'; }
    if (status === 'Late') { checkIn = '09:25 AM'; checkOut = '05:00 PM'; }

    const record = {
      id: matchIdx !== -1 ? updated[matchIdx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      employeeId,
      employeeName: matchedEmp.name,
      date: attendanceDate,
      status,
      checkIn: matchIdx !== -1 && updated[matchIdx].checkIn ? updated[matchIdx].checkIn : checkIn,
      checkOut: matchIdx !== -1 && updated[matchIdx].checkOut ? updated[matchIdx].checkOut : checkOut
    };

    if (matchIdx !== -1) {
      updated[matchIdx] = record;
    } else {
      updated.unshift(record);
    }

    localStorage.setItem('nexova_hr_attendance', JSON.stringify(updated));
    setAttendanceLogs(updated);

    // Trigger update handler prop if it exists
    if (onUpdateAttendance) {
      onUpdateAttendance(employeeId, status);
    }

    // Refresh core counters
    loadAllData();
  };

  const handleTimeChange = (employeeId: string, field: 'checkIn' | 'checkOut', val: string) => {
    let updated = [...attendanceLogs];
    const matchIdx = updated.findIndex(log => log.employeeId === employeeId && log.date === attendanceDate);
    if (matchIdx !== -1) {
      updated[matchIdx] = { ...updated[matchIdx], [field]: val };
      localStorage.setItem('nexova_hr_attendance', JSON.stringify(updated));
      setAttendanceLogs(updated);
    }
  };

  // --- LEAVE ACTIONS ---
  const handleApproveLeave = (id: string, status: 'Approved' | 'Rejected') => {
    const updated = leaveRequests.map(req => {
      if (req.id === id) {
        // If approved, optionally shift employee work status
        if (status === 'Approved') {
          const emps = employeesList.map(e => e.id === req.employeeId ? { ...e, workStatus: 'On Leave' } : e);
          localStorage.setItem('nexova_crud_employees', JSON.stringify(emps));
          setEmployeesList(emps);
        }
        return { ...req, status };
      }
      return req;
    });
    localStorage.setItem('nexova_hr_leaves', JSON.stringify(updated));
    setLeaveRequests(updated);
    loadAllData();
  };

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.employeeId) {
      alert('Please select an employee.');
      return;
    }
    const matchedEmp = employeesList.find(e => e.id === leaveForm.employeeId);
    if (!matchedEmp) return;

    const newReq = {
      id: `lv_${Date.now()}`,
      employeeId: leaveForm.employeeId,
      employeeName: matchedEmp.name,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'Pending'
    };

    const updated = [newReq, ...leaveRequests];
    localStorage.setItem('nexova_hr_leaves', JSON.stringify(updated));
    setLeaveRequests(updated);
    setShowLeaveModal(false);
    setLeaveForm({ employeeId: '', leaveType: 'Annual Leave', startDate: '2026-07-15', endDate: '2026-07-20', reason: '' });
    loadAllData();
  };

  // --- PAYROLL ACTIONS ---
  const [payrollStatus, setPayrollStatus] = useState<Record<string, 'Paid' | 'Unpaid' | 'Processing'>>(() => {
    const saved = localStorage.getItem('nexova_hr_payroll_status');
    return saved ? JSON.parse(saved) : { emp_1: 'Paid', emp_2: 'Paid', emp_3: 'Unpaid', emp_4: 'Unpaid' };
  });

  const handleDisbursePayroll = () => {
    const confirmDisburse = confirm('Are you sure you want to disburse the net salaries for all active roster employees? This will update ledger records and debit accounts.');
    if (!confirmDisburse) return;

    const updatedStatus: Record<string, 'Paid'> = {};
    employeesList.forEach(e => {
      updatedStatus[e.id] = 'Paid';
    });
    localStorage.setItem('nexova_hr_payroll_status', JSON.stringify(updatedStatus));
    setPayrollStatus(updatedStatus);

    // Save transactional audit log automatically in banking history if possible
    const accountsRaw = localStorage.getItem('nexova_accounts') || '[]';
    // Add success feedback and refresh
    alert('৳' + metrics.payroll.toLocaleString() + ' disbursed successfully to staff accounts. Corporate Payslips have been prepared!');
  };

  const handlePayIndividual = (id: string) => {
    const updated = { ...payrollStatus, [id]: 'Paid' as const };
    localStorage.setItem('nexova_hr_payroll_status', JSON.stringify(updated));
    setPayrollStatus(updated);
  };

  // --- RECRUITMENT ACTIONS ---
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title) return;

    const newJob = {
      id: `job_${Date.now()}`,
      ...jobForm
    };
    const updated = [newJob, ...jobPostings];
    localStorage.setItem('nexova_hr_jobs', JSON.stringify(updated));
    setJobPostings(updated);
    setShowJobModal(false);
    setJobForm({ title: '', department: 'Engineering', salaryRange: '৳80,000 - ৳1,20,000', openings: '1', status: 'Open' });
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.name || !candidateForm.jobId) {
      alert('Please enter candidate name and select targeted opening.');
      return;
    }
    const matchedJob = jobPostings.find(j => j.id === candidateForm.jobId);
    const newCandidate = {
      id: `cand_${Date.now()}`,
      name: candidateForm.name,
      email: candidateForm.email,
      phone: candidateForm.phone,
      jobId: candidateForm.jobId,
      jobTitle: matchedJob ? matchedJob.title : 'General Roster',
      expectedSalary: candidateForm.expectedSalary,
      experienceYears: candidateForm.experienceYears,
      notes: candidateForm.notes,
      stage: 'Applied'
    };

    const updated = [newCandidate, ...recruitmentCandidates];
    localStorage.setItem('nexova_hr_candidates', JSON.stringify(updated));
    setRecruitmentCandidates(updated);
    setShowCandidateModal(false);
    setCandidateForm({ name: '', email: '', phone: '', jobId: '', expectedSalary: '', experienceYears: '', notes: '' });
  };

  const handleCandidateStageChange = (candId: string, nextStage: string) => {
    const updated = recruitmentCandidates.map(c => {
      if (c.id === candId) {
        // If hired, prompt manager to convert candidate to employee directly!
        if (nextStage === 'Hired') {
          const matchedJob = jobPostings.find(j => j.id === c.jobId);
          const confirmAdd = confirm(`Would you like to add ${c.name} directly to the Nexova Active Employee Directory now?`);
          if (confirmAdd) {
            const newEmp = {
              id: `emp_${Date.now()}`,
              name: c.name,
              department: matchedJob ? matchedJob.department : 'Engineering',
              designation: matchedJob ? matchedJob.title : 'Software Specialist',
              salary: Number(c.expectedSalary) || 60000,
              email: c.email,
              phone: c.phone,
              workStatus: 'Active',
              joiningDate: '2026-07-11'
            };
            const updatedEmps = [...employeesList, newEmp];
            localStorage.setItem('nexova_crud_employees', JSON.stringify(updatedEmps));
            setEmployeesList(updatedEmps);
            
            // Mark job as filled
            if (matchedJob) {
              const updatedJobs = jobPostings.map(j => j.id === matchedJob.id ? { ...j, status: 'Filled' } : j);
              localStorage.setItem('nexova_hr_jobs', JSON.stringify(updatedJobs));
              setJobPostings(updatedJobs);
            }
          }
        }
        return { ...c, stage: nextStage };
      }
      return c;
    });
    localStorage.setItem('nexova_hr_candidates', JSON.stringify(updated));
    setRecruitmentCandidates(updated);
    loadAllData();
  };

  // --- APPRAISAL ACTIONS ---
  const handleCreateAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appraisalForm.employeeId) {
      alert('Please select an employee.');
      return;
    }
    const matchedEmp = employeesList.find(e => e.id === appraisalForm.employeeId);
    if (!matchedEmp) return;

    const scores = [appraisalForm.workQuality, appraisalForm.attendanceRating, appraisalForm.teamwork, appraisalForm.initiative];
    const average = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));

    const newApp = {
      id: `ap_${Date.now()}`,
      employeeId: appraisalForm.employeeId,
      employeeName: matchedEmp.name,
      workQuality: appraisalForm.workQuality,
      attendanceRating: appraisalForm.attendanceRating,
      teamwork: appraisalForm.teamwork,
      initiative: appraisalForm.initiative,
      average,
      kpiTarget: appraisalForm.kpiTarget,
      comments: appraisalForm.comments,
      reviewDate: '2026-07-11'
    };

    const updated = [newApp, ...appraisalLogs];
    localStorage.setItem('nexova_hr_appraisals', JSON.stringify(updated));
    setAppraisalLogs(updated);
    setShowAppraisalModal(false);
    setAppraisalForm({ employeeId: '', workQuality: 5, attendanceRating: 5, teamwork: 5, initiative: 5, kpiTarget: '', comments: '' });
  };


  return (
    <PageStandardsWrapper
      title="HRM Personnel & Payroll Ledger"
      subtitle="Govern full-time workforce registries, departments, salaries, security clearance classifications, and contracts."
      loading={false}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'Employee Ledger', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* HRM TOP SUMMARY BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Staff Strength</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{metrics.totalEmployees} Employees</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Roster</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{metrics.activeCount} Personnel</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance on {attendanceDate}</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{metrics.presentToday} Present</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-200 font-bold uppercase block">Monthly Payroll</span>
              <span className="text-base font-bold block mt-1">৳{metrics.payroll.toLocaleString()}</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* SUBTAB CONTENT SWITCHING ROUTER */}

        {/* 1. EMPLOYEES DIRECTORY TAB */}
        {currentTab === 'employees_list' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <UniversalCrudEngine
              config={EMPLOYEES_CONFIG}
              currentUser={currentUser}
              onDataChange={loadAllData}
            />
          </div>
        )}

        {/* 2. ATTENDANCE LOGGING TAB */}
        {currentTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Dynamic Attendance Register</h3>
                <p className="text-xs text-slate-400 mt-0.5">Check-in active personnel, log precise arrival hours, and calculate late penalties in real-time.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Log Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or department..."
                value={attendanceSearch}
                onChange={e => setAttendanceSearch(e.target.value)}
                className="bg-transparent focus:outline-none w-full"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-50/50">
                    <th className="p-3">Staff Details</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Status Action</th>
                    <th className="p-3">Check In Time</th>
                    <th className="p-3">Check Out Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeesList
                    .filter(e => e.workStatus === 'Active' && e.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
                    .map(emp => {
                      const log = attendanceLogs.find(l => l.employeeId === emp.id && l.date === attendanceDate);
                      const status = log ? log.status : 'Absent';
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 block">{emp.designation}</span>
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600 text-[10px]">
                              {emp.department}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center items-center gap-1.5">
                              {(['Present', 'Late', 'Absent', 'Leave'] as const).map(s => {
                                let theme = 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50';
                                if (s === status) {
                                  if (s === 'Present') theme = 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold';
                                  if (s === 'Late') theme = 'bg-amber-50 text-amber-600 border-amber-200 font-bold';
                                  if (s === 'Absent') theme = 'bg-rose-50 text-rose-600 border-rose-200 font-bold';
                                  if (s === 'Leave') theme = 'bg-blue-50 text-blue-600 border-blue-200 font-bold';
                                }
                                return (
                                  <button
                                    key={s}
                                    onClick={() => handleToggleAttendanceStatus(emp.id, s)}
                                    className={`border px-2.5 py-1 rounded-md text-[10px] cursor-pointer transition-all ${theme}`}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              disabled={status === 'Absent' || status === 'Leave'}
                              value={log?.checkIn || ''}
                              onChange={e => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                              placeholder="e.g., 08:50 AM"
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none w-24 font-mono disabled:opacity-50 text-center"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              disabled={status === 'Absent' || status === 'Leave'}
                              value={log?.checkOut || ''}
                              onChange={e => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                              placeholder="e.g., 05:00 PM"
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none w-24 font-mono disabled:opacity-50 text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150/60 rounded-xl leading-relaxed text-xs text-slate-500">
              <span className="font-bold text-slate-700 block mb-1">Corporate Shift Compliance policy:</span>
              Standard check-in hours run between <strong>08:30 AM - 09:00 AM</strong>. Arrivals after 09:00 AM automatically record as <strong>Late</strong>, unless prior leave request exists in system.
            </div>
          </div>
        )}

        {/* 3. LEAVE APPLICATIONS REGISTER */}
        {currentTab === 'leave' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Leave Application Registry</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track sickness logs, annual holidays, casual absences, and authorize approvals with active roster sync.</p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Apply for Leave
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-50/50">
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3">Leave Category</th>
                    <th className="p-3">Duration (Dates)</th>
                    <th className="p-3">Reason / Description</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{req.employeeName}</td>
                      <td className="p-3 font-semibold text-slate-500">{req.leaveType}</td>
                      <td className="p-3 font-mono text-slate-600">{req.startDate} to {req.endDate}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{req.reason || 'No description provided'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-600'
                            : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-amber-50 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveLeave(req.id, 'Approved')}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveLeave(req.id, 'Rejected')}
                              className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No action required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PAYROLL & CORPORATE PAYSLIPS TAB */}
        {currentTab === 'payroll' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Corporate Staff Payroll Sheet</h3>
                <p className="text-xs text-slate-400 mt-0.5">Recalculate base salaries, house rent, medical allowances, and taxes to trigger direct bank disbursements.</p>
              </div>
              <button
                onClick={handleDisbursePayroll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" /> Disburse Roster Salaries
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-50/50">
                    <th className="p-3">Staff / Designation</th>
                    <th className="p-3">Basic Salary</th>
                    <th className="p-3">Allowances (15%+5%)</th>
                    <th className="p-3">Tax Deductions (10%)</th>
                    <th className="p-3">Provident Fund (5%)</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Corporate payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {employeesList.map(emp => {
                    const basic = Number(emp.salary) || 0;
                    const houseRent = basic * 0.15;
                    const medical = basic * 0.05;
                    const tax = basic * 0.10;
                    const pf = basic * 0.05;
                    const net = basic + houseRent + medical - tax - pf;
                    const status = payrollStatus[emp.id] || 'Unpaid';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-800 font-sans text-xs block">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-sans block">{emp.designation}</span>
                        </td>
                        <td className="p-3 text-slate-700 font-bold">৳{basic.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600">+৳{(houseRent + medical).toLocaleString()}</td>
                        <td className="p-3 text-rose-500">-৳{tax.toLocaleString()}</td>
                        <td className="p-3 text-slate-500">-৳{pf.toLocaleString()}</td>
                        <td className="p-3 text-slate-800 font-extrabold text-xs">৳{net.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] font-sans ${
                            status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {status === 'Unpaid' && (
                              <button
                                onClick={() => handlePayIndividual(emp.id)}
                                className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-2 py-1 rounded cursor-pointer font-sans"
                              >
                                Disburse
                              </button>
                            )}
                            <button
                              onClick={() => setShowPaySlipModal({ emp, basic, houseRent, medical, tax, pf, net, status })}
                              className="text-[10px] font-bold text-indigo-600 hover:text-white border border-indigo-200 hover:bg-indigo-600 px-2 py-1 rounded cursor-pointer font-sans flex items-center gap-1"
                            >
                              <Printer className="h-3 w-3" /> Payslip
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

        {/* 5. RECRUITMENT PIPELINE BOARD */}
        {currentTab === 'recruitment' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Recruitment & Hiring Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Control job postings, organize applicant interviews, and hire directly into the active staff list.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJobModal(true)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Briefcase className="h-3.5 w-3.5" /> Create Job Post
                </button>
                <button
                  onClick={() => setShowCandidateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Candidate
                </button>
              </div>
            </div>

            {/* JOB OPENINGS LIST */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Corporate Openings</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {jobPostings.map(job => (
                  <div key={job.id} className="border border-slate-150 rounded-xl p-3.5 space-y-2 hover:border-indigo-500 transition-all bg-slate-50/20">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{job.department}</span>
                      <span className={`text-[10px] font-bold ${job.status === 'Open' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ● {job.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs">{job.title}</h4>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Salary: {job.salaryRange}</span>
                      <span>{job.openings} Seat(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CANDIDATES PIPELINE */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Stages & Screening</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['Applied', 'Interviewing', 'Offered', 'Hired'] as const).map(stage => {
                  const stageCand = recruitmentCandidates.filter(c => c.stage === stage);
                  
                  return (
                    <div key={stage} className="bg-slate-50 rounded-2xl p-4 border border-slate-150/40 space-y-3 min-h-[250px]">
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                        <span className="font-bold text-slate-700 text-xs">{stage}</span>
                        <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-extrabold">
                          {stageCand.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {stageCand.map(cand => (
                          <div key={cand.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs space-y-2 hover:shadow transition-all">
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">{cand.name}</span>
                              <span className="text-[10px] text-slate-400 block">{cand.jobTitle}</span>
                            </div>
                            
                            <p className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-1.5 rounded border border-slate-100/50 font-sans italic">
                              "{cand.notes || 'No interview evaluation notes yet.'}"
                            </p>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono text-slate-400">Exp: {cand.experienceYears} yrs</span>
                              <select
                                value={cand.stage}
                                onChange={e => handleCandidateStageChange(cand.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 outline-none"
                              >
                                <option value="Applied">Applied</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Offered">Offered</option>
                                <option value="Hired">Hired</option>
                              </select>
                            </div>
                          </div>
                        ))}

                        {stageCand.length === 0 && (
                          <div className="text-center py-10 text-slate-300 italic text-[11px]">No candidate at this stage.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. STAFF PERFORMANCE APPRAISAL TAB */}
        {currentTab === 'appraisal' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Staff Performance Appraisals</h3>
                <p className="text-xs text-slate-400 mt-0.5">Evaluate workforce performance, grade qualitative KPI parameters, and establish target milestones.</p>
              </div>
              <button
                onClick={() => setShowAppraisalModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Award className="h-3.5 w-3.5" /> Log Appraisal Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appraisalLogs.map(app => (
                <div key={app.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-indigo-500 hover:shadow-xs transition-all relative overflow-hidden bg-gradient-to-br from-white to-slate-50/30">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{app.employeeName}</h4>
                      <span className="text-[10px] text-slate-400">Reviewed on: {app.reviewDate}</span>
                    </div>
                    <div className="bg-indigo-50 px-2.5 py-1 rounded-xl text-indigo-700 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600" />
                      <span className="font-mono font-bold text-xs">{app.average}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center bg-white border border-slate-150 rounded-xl p-2.5 text-[10px]">
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold">Quality</span>
                      <span className="font-bold text-slate-700">{app.workQuality}/5</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold">Attendance</span>
                      <span className="font-bold text-slate-700">{app.attendanceRating}/5</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold">Teamwork</span>
                      <span className="font-bold text-slate-700">{app.teamwork}/5</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold">Initiative</span>
                      <span className="font-bold text-slate-700">{app.initiative}/5</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wide">Key KPI Target:</span>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-100/50 p-2 rounded-lg border border-slate-150/50">
                      {app.kpiTarget}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wide">Manager Comments:</span>
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                      "{app.comments}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. HR & WAGE ALLOCATIONS REPORT TAB */}
        {currentTab === 'employee_report' && (
          <div className="space-y-6">
            {/* Top Stats Row */}
            {(() => {
              // Calculate live aggregates from filtered list
              const filteredEmps = employeesList.filter(emp => {
                const matchesSearch = emp.name.toLowerCase().includes(allocSearch.toLowerCase()) || 
                                     (emp.designation || '').toLowerCase().includes(allocSearch.toLowerCase());
                const matchesDept = allocDept === 'All' || emp.department === allocDept;
                return matchesSearch && matchesDept;
              });

              const totalBase = employeesList.reduce((acc, emp) => acc + (Number(emp.salary) || 0), 0);
              const totalOtAndBonus = employeesList.reduce((acc, emp) => {
                const ot = (Number(emp.overtimeHours) || 0) * (Number(emp.overtimeRate) || 0);
                const bonus = Number(emp.bonus) || 0;
                return acc + ot + bonus;
              }, 0);
              const totalTax = employeesList.reduce((acc, emp) => {
                const base = Number(emp.salary) || 0;
                const ot = (Number(emp.overtimeHours) || 0) * (Number(emp.overtimeRate) || 0);
                const bonus = Number(emp.bonus) || 0;
                const gross = base + ot + bonus;
                const rate = emp.taxRate !== undefined ? Number(emp.taxRate) : 10;
                return acc + (gross * rate) / 100;
              }, 0);
              const netWageBill = totalBase + totalOtAndBonus - totalTax;

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">মোট বেসিক বেতন (Base Payroll)</span>
                      <h3 className="text-xl font-extrabold text-slate-800 mt-1 font-mono">৳{totalBase.toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">সব কর্মকর্তার মাসিক মূল বেতন</p>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ওভারটাইম ও বোনাস (OT & Bonus)</span>
                      <h3 className="text-xl font-extrabold text-slate-800 mt-1 font-mono">৳{totalOtAndBonus.toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">অতিরিক্ত কর্মঘণ্টা ও উৎসব ভাতা</p>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">মোট ট্যাক্স কর্তন (Tax Deductions)</span>
                      <h3 className="text-xl font-extrabold text-slate-800 mt-1 font-mono">৳{totalTax.toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">১০% হারে আনুমানিক উবাদা কর্তন</p>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full translate-x-4 -translate-y-4"></div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">মোট নিট প্রদেয় (Net Payroll Bill)</span>
                      <h3 className="text-xl font-extrabold text-indigo-600 mt-1 font-mono">৳{netWageBill.toLocaleString('en-IN')}</h3>
                      <p className="text-[10px] text-indigo-400 mt-1">কর্তন পরবর্তী চূড়ান্ত ব্যাংক পে-রোল</p>
                    </div>
                  </div>

                  {/* Form and Filters Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Allocation Form */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm h-fit">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-indigo-600" />
                          <span>ভাতা ও বোনাস বন্টন (Wage Allocation Form)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">কোনো কর্মকর্তার ওভারটাইম ও ইনসেনティブ বোনাস আপডেট করতে এই ফর্ম ব্যবহার করুন।</p>
                      </div>

                      <form onSubmit={handleUpdateAllocation} className="space-y-3.5 text-xs font-sans">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">কর্মকর্তা নির্বাচন করুন (Select Employee) *</label>
                          <select
                            required
                            value={allocationForm.employeeId}
                            onChange={e => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700 font-sans"
                          >
                            <option value="">-- কর্মকর্তা নির্বাচন করুন --</option>
                            {employeesList.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.department} - {emp.designation})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">ওভারটাইম ঘণ্টা (Hours)</label>
                            <input
                              type="number"
                              min="0"
                              value={allocationForm.overtimeHours || ''}
                              onChange={e => setAllocationForm({ ...allocationForm, overtimeHours: Math.max(0, Number(e.target.value)) })}
                              placeholder="e.g. 15"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">ঘণ্টাপ্রতি হার (Rate/Hr)</label>
                            <input
                              type="number"
                              min="0"
                              value={allocationForm.overtimeRate || ''}
                              onChange={e => setAllocationForm({ ...allocationForm, overtimeRate: Math.max(0, Number(e.target.value)) })}
                              placeholder="e.g. 500"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">উৎসব / পারফরম্যান্স বোনাস</label>
                            <input
                              type="number"
                              min="0"
                              value={allocationForm.bonus || ''}
                              onChange={e => setAllocationForm({ ...allocationForm, bonus: Math.max(0, Number(e.target.value)) })}
                              placeholder="৳ e.g. 15000"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">ট্যাক্স কর্তন হার (Tax %)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={allocationForm.taxRate}
                              onChange={e => setAllocationForm({ ...allocationForm, taxRate: Math.min(100, Math.max(0, Number(e.target.value))) })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleResetAllocations}
                            className="w-1/3 border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 rounded-lg text-center cursor-pointer text-xs font-sans"
                          >
                            রিসেট অল
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs font-sans shadow-xs"
                          >
                            ডিস্ট্রিবিউশন আপডেট
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Right: Roster / Table and Filters */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">कर्मকর্তা বেতন বিল তালিকা (HR Wage Roster)</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">সব কর্মকর্তার বন্টনকৃত ভাতাদি ও চূড়ান্ত নিট প্রদেয় বেতনের হিসাব তালিকা।</p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 self-start cursor-pointer font-sans"
                        >
                          <Printer className="h-3.5 w-3.5" /> প্রিন্ট তালিকা (Print List)
                        </button>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="कर्मকর্তার নাম বা পদবি দিয়ে খুঁজুন..."
                            value={allocSearch}
                            onChange={e => setAllocSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white text-slate-700 font-sans"
                          />
                        </div>
                        <select
                          value={allocDept}
                          onChange={e => setAllocDept(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none text-slate-700 font-sans min-w-[120px]"
                        >
                          <option value="All">সকল ডিপার্টমেন্ট</option>
                          <option value="Engineering">Engineering</option>
                          <option value="HR">HR & Operations</option>
                          <option value="Sales">Sales & Marketing</option>
                          <option value="Accounts">Finance & Ledger</option>
                          <option value="Logistics">Logistics</option>
                        </select>
                      </div>

                      {/* Data Table */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              <th className="py-3 px-4">কর্মকর্তা (Employee)</th>
                              <th className="py-3 px-4 text-right">মূল বেতন (Base)</th>
                              <th className="py-3 px-4 text-center">ওভারটাইম ঘণ্টা/হার</th>
                              <th className="py-3 px-4 text-right">বোনাস (Bonus)</th>
                              <th className="py-3 px-4 text-right">ট্যাক্স কর্তন</th>
                              <th className="py-3 px-4 text-right font-bold text-indigo-600">চূড়ান্ত প্রদেয় (Net)</th>
                              <th className="py-3 px-4 text-center">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                            {filteredEmps.map(emp => {
                              const baseSalary = Number(emp.salary) || 0;
                              const otHrs = Number(emp.overtimeHours) || 0;
                              const otRate = Number(emp.overtimeRate) || 0;
                              const otPay = otHrs * otRate;
                              const bonus = Number(emp.bonus) || 0;
                              const taxRate = emp.taxRate !== undefined ? Number(emp.taxRate) : 10;
                              const gross = baseSalary + otPay + bonus;
                              const deduction = (gross * taxRate) / 100;
                              const net = gross - deduction;

                              return (
                                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-slate-800 block text-xs">{emp.name}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">{emp.department} • {emp.designation}</span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-medium">৳{baseSalary.toLocaleString('en-IN')}</td>
                                  <td className="py-3 px-4 text-center">
                                    {otHrs > 0 ? (
                                      <div className="inline-block">
                                        <span className="font-bold text-slate-700 font-mono block text-[11px]">{otHrs} hrs</span>
                                        <span className="text-[9px] text-slate-400 font-mono block">@ ৳{otRate}/hr</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 font-mono">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono">
                                    {bonus > 0 ? (
                                      <span className="text-emerald-600 font-medium">৳{bonus.toLocaleString('en-IN')}</span>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                                    {deduction > 0 ? (
                                      <div className="inline-block">
                                        <span className="text-red-500 font-medium block text-[11px]">৳{deduction.toLocaleString('en-IN')}</span>
                                        <span className="text-[9px] text-slate-400 font-mono block">{taxRate}% rate</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 text-[13px]">
                                    ৳{Math.round(net).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => setSelectedPayslip({
                                        ...emp,
                                        baseSalary,
                                        otHrs,
                                        otRate,
                                        otPay,
                                        bonus,
                                        taxRate,
                                        deduction,
                                        net
                                      })}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-all cursor-pointer font-sans"
                                    >
                                      পে-স্লিপ (Payslip)
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            {filteredEmps.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 italic font-sans">
                                  কোনো কর্মকর্তা পাওয়া যায়নি। (No employee matching active filters)
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>

      {/* --- LEAVE MODAL OVERLAY --- */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateLeaveRequest} className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in duration-150">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>Apply for Official Leave</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Employee *</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Leave Category *</label>
                <select
                  required
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Leave Reason / Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g., Medical treatment, urgent family matter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CREATE JOB OPENING MODAL --- */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateJob} className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in duration-150">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <span>Create Corporate Job Opening</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Official Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g., Procurement Assistant"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Hiring Department *</label>
                <select
                  required
                  value={jobForm.department}
                  onChange={e => setJobForm({ ...jobForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR & Operations</option>
                  <option value="Sales">Sales & Marketing</option>
                  <option value="Accounts">Finance & Ledger</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Salary Budget Range *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.salaryRange}
                    onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Open Vacancies *</label>
                  <input
                    type="number"
                    required
                    value={jobForm.openings}
                    onChange={e => setJobForm({ ...jobForm, openings: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Post Opening
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD CANDIDATE MODAL --- */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateCandidate} className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in duration-150">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-indigo-600" />
              <span>Add Candidate Profile</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={candidateForm.name}
                  onChange={e => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  placeholder="e.g., Tahmid Rahman"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Target Opening *</label>
                <select
                  required
                  value={candidateForm.jobId}
                  onChange={e => setCandidateForm({ ...candidateForm, jobId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                >
                  <option value="">-- Choose Job Posting --</option>
                  {jobPostings.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Corporate Email</label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Mobile Phone</label>
                  <input
                    type="text"
                    value={candidateForm.phone}
                    onChange={e => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    placeholder="017..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Expected Salary (BDT)</label>
                  <input
                    type="number"
                    value={candidateForm.expectedSalary}
                    onChange={e => setCandidateForm({ ...candidateForm, expectedSalary: e.target.value })}
                    placeholder="e.g., 90000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Experience (Years) *</label>
                  <input
                    type="number"
                    required
                    value={candidateForm.experienceYears}
                    onChange={e => setCandidateForm({ ...candidateForm, experienceYears: e.target.value })}
                    placeholder="5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Interview evaluation notes</label>
                <textarea
                  rows={2}
                  value={candidateForm.notes}
                  onChange={e => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                  placeholder="Key observations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Register Candidate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- LOG PERFORMANCE APPRAISAL MODAL --- */}
      {showAppraisalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateAppraisal} className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-lg space-y-4 animate-in zoom-in duration-150">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              <span>Log Performance Appraisal</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Select Employee *</label>
                <select
                  required
                  value={appraisalForm.employeeId}
                  onChange={e => setAppraisalForm({ ...appraisalForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700"
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Quality of Work (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={appraisalForm.workQuality}
                    onChange={e => setAppraisalForm({ ...appraisalForm, workQuality: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Attendance (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={appraisalForm.attendanceRating}
                    onChange={e => setAppraisalForm({ ...appraisalForm, attendanceRating: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Teamwork (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={appraisalForm.teamwork}
                    onChange={e => setAppraisalForm({ ...appraisalForm, teamwork: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Initiative (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={appraisalForm.initiative}
                    onChange={e => setAppraisalForm({ ...appraisalForm, initiative: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Set Future KPI Target Goal *</label>
                <input
                  type="text"
                  required
                  value={appraisalForm.kpiTarget}
                  onChange={e => setAppraisalForm({ ...appraisalForm, kpiTarget: e.target.value })}
                  placeholder="e.g., Increase pipeline closures by 15%..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Manager Comments & Evaluation *</label>
                <textarea
                  required
                  rows={2}
                  value={appraisalForm.comments}
                  onChange={e => setAppraisalForm({ ...appraisalForm, comments: e.target.value })}
                  placeholder="Summary..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-700 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAppraisalModal(false)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs"
              >
                Log Appraisal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CORPORATE PAYSLIP MODAL DETAIL OVERLAY --- */}
      {showPaySlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-in zoom-in duration-150">
            
            {/* Stamp branding background decoration */}
            <div className="absolute top-12 right-6 opacity-[0.03] select-none pointer-events-none transform rotate-12">
              <div className="border-[8px] border-indigo-700 rounded-full h-32 w-32 flex items-center justify-center font-bold text-2xl">NEXOVA ERP</div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Nexova Corporate Group Ltd</h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Corporate Headquarters, Dhaka, Bangladesh</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-150 rounded px-2.5 py-1">
                Ref: PS-2026-{String(showPaySlipModal.emp?.id || '').slice(-4).toUpperCase().padStart(4, '0')}
              </span>
            </div>

            <div className="my-5 space-y-4 font-sans">
              <h5 className="text-center font-extrabold text-xs text-slate-700 uppercase tracking-wider bg-slate-50 border border-slate-150/50 py-1.5 rounded-lg">
                Official Monthly Pay Slip
              </h5>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs border-b border-slate-100 pb-4">
                <div>
                  <span className="text-slate-400 block text-[10px]">Staff Member:</span>
                  <span className="font-bold text-slate-800">{showPaySlipModal.emp.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Designation:</span>
                  <span className="font-bold text-slate-800">{showPaySlipModal.emp.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Department:</span>
                  <span className="font-semibold text-slate-600">{showPaySlipModal.emp.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tax / BIN Identifier:</span>
                  <span className="font-mono text-slate-500">BIN-8822019-923</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Earnings & Deductions Summary</span>
                
                <div className="bg-slate-50/50 border border-slate-150/50 rounded-xl divide-y divide-slate-100/50 text-xs font-mono">
                  <div className="flex justify-between p-2">
                    <span className="text-slate-500 font-sans">Basic Monthly Salary</span>
                    <span className="font-bold text-slate-700">৳{showPaySlipModal.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-slate-500 font-sans">House Rent Allowance (15%)</span>
                    <span className="font-bold text-emerald-600">+৳{showPaySlipModal.houseRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-slate-500 font-sans">Medical Support Allowance (5%)</span>
                    <span className="font-bold text-emerald-600">+৳{showPaySlipModal.medical.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-rose-600 font-sans">Tax Deductions (10%)</span>
                    <span className="font-bold text-rose-500">-৳{showPaySlipModal.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-rose-600 font-sans">Provident Fund Contribution (5%)</span>
                    <span className="font-bold text-rose-500">-৳{showPaySlipModal.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-indigo-50/30 text-indigo-900 font-sans">
                    <span className="font-bold">Net Disbursed Amount</span>
                    <span className="font-black font-mono">৳{showPaySlipModal.net.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 italic pt-2">
                <span>Disbursed via Corporate Bank Ingress</span>
                <span>Security Stamp Approved</span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowPaySlipModal(null)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2 rounded-lg text-center cursor-pointer text-xs font-sans"
              >
                Close Payslip
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Generating PDF and triggering system print dialogue channel...');
                }}
                className="w-1/2 bg-slate-900 hover:bg-black text-white font-bold py-2 rounded-lg text-center cursor-pointer text-xs font-sans flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- WAGE PAYSLIP VIEW & PRINT MODAL --- */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:bg-white print:relative print:z-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-6 animate-in zoom-in duration-150 print:border-none print:shadow-none print:p-0 print:max-w-full">
            
            {/* Header / Company Branding */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-800 tracking-tight font-display">NEXOVA ERP SOLUTION</h3>
                <span className="text-[10px] text-slate-400 block font-sans tracking-wide">HR & CORPORATE PAYROLL DEPT</span>
                <span className="text-[9px] text-slate-400 block font-mono">Issued On: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="text-right">
                <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-[10px] border border-indigo-100/50 print:hidden">
                  অফিসিয়াল পে-স্লিপ
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 block mt-1">SLIP #{selectedPayslip.id?.toUpperCase()}</span>
              </div>
            </div>

            {/* Employee Information card */}
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-sans print:bg-slate-50 print:border">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">কর্মকর্তার নাম (Employee)</span>
                <span className="font-extrabold text-slate-800 block text-sm mt-0.5">{selectedPayslip.name}</span>
                <span className="text-slate-500 block mt-0.5">{selectedPayslip.designation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">ডিপার্টমেন্ট (Department)</span>
                <span className="font-extrabold text-slate-800 block text-sm mt-0.5">{selectedPayslip.department}</span>
                <span className="text-slate-500 block mt-0.5">যোগদানের তারিখ: {selectedPayslip.joiningDate || 'N/A'}</span>
              </div>
            </div>

            {/* Earnings and Deductions Breakdowns */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
                বেতন ও ভাতাদি বিবরণী (Salary Breakdown)
              </h4>
              <div className="divide-y divide-slate-100 text-xs font-sans">
                <div className="flex justify-between py-2 text-slate-600">
                  <span>মাসিক মূল বেতন (Basic Salary)</span>
                  <span className="font-mono font-medium text-slate-800">৳{selectedPayslip.baseSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span>ওভারটাইম ভাতা (Overtime Allowance) {selectedPayslip.otHrs > 0 ? `(${selectedPayslip.otHrs} hrs @ ৳${selectedPayslip.otRate}/hr)` : ''}</span>
                  <span className="font-mono font-medium text-slate-800">
                    ৳{selectedPayslip.otPay > 0 ? selectedPayslip.otPay.toLocaleString('en-IN') : '0'}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span>উৎসব ও পারফরম্যান্স বোনাস (Bonus)</span>
                  <span className="font-mono font-medium text-emerald-600">
                    ৳{selectedPayslip.bonus > 0 ? selectedPayslip.bonus.toLocaleString('en-IN') : '0'}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span>সর্বমোট অর্জিত বেতন (Gross Earnings)</span>
                  <span className="font-mono font-bold text-slate-800">
                    ৳{(selectedPayslip.baseSalary + selectedPayslip.otPay + selectedPayslip.bonus).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-red-600 font-medium">
                  <span>ট্যাক্স কর্তন (Tax Deduction - {selectedPayslip.taxRate}%)</span>
                  <span className="font-mono">
                    - ৳{selectedPayslip.deduction > 0 ? selectedPayslip.deduction.toLocaleString('en-IN') : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable */}
            <div className="bg-indigo-600 text-white rounded-xl p-4 flex justify-between items-center print:bg-slate-800 print:text-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-80">চূড়ান্ত প্রদেয় নিট বেতন (Net Payable)</span>
                <span className="text-xs opacity-75 font-sans mt-0.5">সব কর্তন পরবর্তী ব্যাংক ট্রান্সফার পরিমাণ</span>
              </div>
              <span className="text-2xl font-black font-mono">৳{Math.round(selectedPayslip.net).toLocaleString('en-IN')}</span>
            </div>

            {/* Corporate Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-sans">
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-200"></div>
                <span className="block mt-1 font-bold">কর্মকর্তার স্বাক্ষর (Employee Signature)</span>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-200"></div>
                <span className="block mt-1 font-bold">অনুমোদনকারী স্বাক্ষর (HR / Finance Lead)</span>
              </div>
            </div>

            {/* Print Instructions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="w-1/2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-2.5 rounded-xl text-center cursor-pointer text-xs transition-all font-sans"
              >
                বন্ধ করুন (Close)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-center cursor-pointer text-xs transition-all shadow-md flex items-center justify-center gap-1.5 font-sans"
              >
                <Printer className="h-4 w-4" /> স্লিপ প্রিন্ট করুন (Print Slip)
              </button>
            </div>

          </div>
        </div>
      )}
    </PageStandardsWrapper>
  );
}

