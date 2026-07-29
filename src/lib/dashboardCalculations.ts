import {
  Invoice,
  Product,
  Customer,
  Supplier,
  BankAccount,
  LoanAccount,
  Employee,
  PurchaseOrder,
  Transaction,
} from '../types';

export type DateRangeType = 'today' | 'this_week' | 'this_month' | 'ytd' | 'last_12_months';

export interface DateFilterOptions {
  range: DateRangeType;
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Filter items by date range safely
 */
export function isDateInRange(
  dateStr: string,
  range: DateRangeType,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return itemDate >= startOfDay;

    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      return itemDate >= startOfWeek;
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return itemDate >= startOfMonth;
    }

    case 'ytd': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return itemDate >= startOfYear;
    }

    case 'last_12_months': {
      const past12Months = new Date();
      past12Months.setFullYear(now.getFullYear() - 1);
      return itemDate >= past12Months;
    }

    default:
      if (customStart && customEnd) {
        return itemDate >= new Date(customStart) && itemDate <= new Date(customEnd);
      }
      return true;
  }
}

/**
 * Helper to check if date falls in the prior comparison period
 */
export function isDateInPriorPeriod(dateStr: string, range: DateRangeType): boolean {
  if (!dateStr) return false;
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;

  const now = new Date();

  switch (range) {
    case 'today': {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
    }

    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfThisWeek = new Date(now.setDate(diff));
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      return itemDate >= startOfLastWeek && itemDate < startOfThisWeek;
    }

    case 'this_month': {
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return itemDate >= startOfLastMonth && itemDate < startOfThisMonth;
    }

    case 'ytd': {
      const startOfThisYear = new Date(now.getFullYear(), 0, 1);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      return itemDate >= startOfLastYear && itemDate < startOfThisYear;
    }

    case 'last_12_months': {
      const past12Months = new Date();
      past12Months.setFullYear(now.getFullYear() - 1);
      const past24Months = new Date();
      past24Months.setFullYear(now.getFullYear() - 2);
      return itemDate >= past24Months && itemDate < past12Months;
    }

    default:
      return false;
  }
}

/**
 * Revenue Metrics Calculation
 */
export function calculateRevenueMetrics(invoices: Invoice[], range: DateRangeType = 'ytd') {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const ytdInvoices = invoices.filter((inv) => {
    const d = new Date(inv.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
  });

  const mtdInvoices = invoices.filter((inv) => {
    const d = new Date(inv.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const todayInvoices = invoices.filter((inv) => {
    const d = new Date(inv.date);
    return (
      !isNaN(d.getTime()) &&
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth &&
      d.getDate() === now.getDate()
    );
  });

  const filteredInvoices = invoices.filter((inv) => isDateInRange(inv.date, range));
  const priorInvoices = invoices.filter((inv) => isDateInPriorPeriod(inv.date, range));

  const totalRevenueYTD = ytdInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalRevenueMTD = mtdInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalRevenueToday = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalFilteredRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const priorFilteredRevenue = priorInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  let changePercent = 0;
  if (priorFilteredRevenue > 0) {
    changePercent = Number((((totalFilteredRevenue - priorFilteredRevenue) / priorFilteredRevenue) * 100).toFixed(1));
  } else if (totalFilteredRevenue > 0) {
    changePercent = 100;
  }

  return {
    totalRevenueYTD,
    totalRevenueMTD,
    totalRevenueToday,
    totalFilteredRevenue,
    changePercent,
    invoiceCount: filteredInvoices.length,
  };
}

/**
 * Gross Profit Margin % Calculation
 * Formula: ((Revenue - COGS) / Revenue) * 100
 * COGS = Sum(Product.cost * quantity_sold)
 */
export function calculateGrossProfitMargin(
  invoices: Invoice[],
  products: Product[],
  range: DateRangeType = 'ytd'
) {
  const filteredInvoices = invoices.filter((inv) => isDateInRange(inv.date, range));
  const priorInvoices = invoices.filter((inv) => isDateInPriorPeriod(inv.date, range));

  const productCostMap = new Map<string, number>();
  products.forEach((p) => productCostMap.set(p.id, p.cost || 0));

  let totalRevenue = 0;
  let totalCogs = 0;

  filteredInvoices.forEach((inv) => {
    totalRevenue += inv.total || 0;
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item) => {
        const itemCost = productCostMap.get(item.productId) ?? item.price * 0.7;
        totalCogs += itemCost * (item.quantity || 1);
      });
    }
  });

  let priorRevenue = 0;
  let priorCogs = 0;

  priorInvoices.forEach((inv) => {
    priorRevenue += inv.total || 0;
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item) => {
        const itemCost = productCostMap.get(item.productId) ?? item.price * 0.7;
        priorCogs += itemCost * (item.quantity || 1);
      });
    }
  });

  const grossProfit = totalRevenue - totalCogs;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const priorGrossProfit = priorRevenue - priorCogs;
  const priorMarginPercent = priorRevenue > 0 ? (priorGrossProfit / priorRevenue) * 100 : 0;

  let changePercent = 0;
  if (priorRevenue > 0) {
    changePercent = Number((marginPercent - priorMarginPercent).toFixed(1));
  } else if (totalRevenue > 0) {
    changePercent = Number(marginPercent.toFixed(1));
  }

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    marginPercent: Number(marginPercent.toFixed(1)),
    changePercent,
  };
}

/**
 * Inventory Turnover Ratio Calculation
 * Formula: COGS / Average Inventory Value
 * Average Inventory Value = Sum(Product.stock * Product.cost)
 */
export function calculateInventoryTurnover(invoices: Invoice[], products: Product[]) {
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.cost || 0), 0);

  const past12MonthsInvoices = invoices.filter((inv) => isDateInRange(inv.date, 'last_12_months'));
  const prior12MonthsInvoices = invoices.filter((inv) => isDateInPriorPeriod(inv.date, 'last_12_months'));

  let annualCogs = 0;
  past12MonthsInvoices.forEach((inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const cost = product ? product.cost : item.price * 0.7;
        annualCogs += cost * (item.quantity || 1);
      });
    }
  });

  let priorAnnualCogs = 0;
  prior12MonthsInvoices.forEach((inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const cost = product ? product.cost : item.price * 0.7;
        priorAnnualCogs += cost * (item.quantity || 1);
      });
    }
  });

  const turnoverRatio = totalInventoryValue > 0 ? annualCogs / totalInventoryValue : 0;
  const priorTurnoverRatio = totalInventoryValue > 0 ? priorAnnualCogs / totalInventoryValue : 0;

  let changePercent = 0;
  if (priorTurnoverRatio > 0) {
    changePercent = Number((((turnoverRatio - priorTurnoverRatio) / priorTurnoverRatio) * 100).toFixed(1));
  } else if (turnoverRatio > 0) {
    changePercent = 100;
  }

  return {
    turnoverRatio: Number(turnoverRatio.toFixed(2)),
    totalInventoryValue,
    annualCogs,
    changePercent,
  };
}

/**
 * Cash Position Calculation
 */
export function calculateCashPosition(bankAccounts: BankAccount[], transactions: Transaction[] = []) {
  const totalCash = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const liquidAccounts = bankAccounts.length;

  let changePercent = 0;
  if (transactions.length > 0) {
    const past30DaysTx = transactions.filter((tx) => isDateInRange(tx.date, 'this_month'));
    const netChange = past30DaysTx.reduce((sum, tx) => {
      if (tx.type === 'Income' || tx.type === 'Deposit') return sum + (tx.amount || 0);
      if (tx.type === 'Expense' || tx.type === 'Withdrawal') return sum - (tx.amount || 0);
      return sum;
    }, 0);
    const priorCash = totalCash - netChange;
    if (priorCash > 0) {
      changePercent = Number((((totalCash - priorCash) / priorCash) * 100).toFixed(1));
    }
  }

  return {
    totalCash,
    liquidAccounts,
    changePercent,
  };
}

/**
 * Customer Metrics Calculation
 */
export function calculateCustomerMetrics(customers: Customer[], invoices: Invoice[]) {
  const totalCustomers = customers.length;
  const customerPaidIds = new Set(invoices.filter((inv) => inv.isPaid).map((inv) => inv.customerId));
  const activeCustomersCount = customerPaidIds.size;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const priorCustomersCount = customers.filter((c) => {
    if (!(c as any).createdAt) return true;
    const d = new Date((c as any).createdAt);
    return !isNaN(d.getTime()) && d < startOfThisMonth;
  }).length;

  let changePercent = 0;
  if (priorCustomersCount > 0 && priorCustomersCount < totalCustomers) {
    changePercent = Number((((totalCustomers - priorCustomersCount) / priorCustomersCount) * 100).toFixed(1));
  }

  return {
    totalCustomers,
    activeCustomersCount,
    activeRatio: totalCustomers > 0 ? Number(((activeCustomersCount / totalCustomers) * 100).toFixed(0)) : 0,
    changePercent,
  };
}

/**
 * Revenue Trend Data for Line Chart (Last 12 Months or selected range)
 */
export function getRevenueTrendData(invoices: Invoice[], range: DateRangeType = 'last_12_months') {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  if (range === 'today' || range === 'this_week') {
    // Return daily breakdown
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap: Record<string, { sales: number; cogs: number }> = {};
    days.forEach((d) => (dailyMap[d] = { sales: 0, cogs: 0 }));

    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (!isNaN(d.getTime())) {
        const dayName = days[d.getDay()];
        if (dailyMap[dayName]) {
          dailyMap[dayName].sales += inv.total || 0;
          dailyMap[dayName].cogs += (inv.total || 0) * 0.65;
        }
      }
    });

    return Object.keys(dailyMap).map((day) => ({
      name: day,
      Revenue: dailyMap[day].sales,
      Profit: dailyMap[day].sales - dailyMap[day].cogs,
    }));
  }

  // Monthly breakdown for YTD & Last 12 Months
  const monthlyData: { name: string; Revenue: number; Profit: number; Invoices: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    const yr = d.getFullYear() % 100;
    const label = `${mName} '${yr}`;

    let rev = 0;
    let cogs = 0;
    let invCount = 0;

    invoices.forEach((inv) => {
      const invD = new Date(inv.date);
      if (
        !isNaN(invD.getTime()) &&
        invD.getMonth() === d.getMonth() &&
        invD.getFullYear() === d.getFullYear()
      ) {
        rev += inv.total || 0;
        invCount++;
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item) => {
            cogs += ((item as any).cost || item.price * 0.7) * (item.quantity || 1);
          });
        } else {
          cogs += (inv.total || 0) * 0.7;
        }
      }
    });

    monthlyData.push({
      name: label,
      Revenue: Math.round(rev),
      Profit: Math.round(rev - cogs),
      Invoices: invCount,
    });
  }

  return monthlyData;
}

/**
 * Sales by Category Data for Bar Chart
 */
export function getSalesByCategoryData(invoices: Invoice[], products: Product[]) {
  const categoryMap: Record<string, number> = {};
  const categoryItemCountMap: Record<string, number> = {};
  const productCatMap = new Map<string, string>();

  products.forEach((p) => productCatMap.set(p.id, p.category || 'General'));

  invoices.forEach((inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item) => {
        const cat = productCatMap.get(item.productId) || 'General';
        const itemTotal = item.subtotal || (item.price || 0) * (item.quantity || 1);
        categoryMap[cat] = (categoryMap[cat] || 0) + itemTotal;
        categoryItemCountMap[cat] = (categoryItemCountMap[cat] || 0) + (item.quantity || 1);
      });
    } else {
      categoryMap['General'] = (categoryMap['General'] || 0) + (inv.total || 0);
    }
  });

  const categories = Object.keys(categoryMap);
  if (categories.length === 0) {
    return [];
  }

  return categories.map((cat) => ({
    category: cat,
    sales: Math.round(categoryMap[cat]),
    itemsCount: Math.round(categoryItemCountMap[cat] || 0),
  }));
}

/**
 * Accounts Receivable (AR) vs Accounts Payable (AP) Aging Breakdown
 */
export function getARvsAPData(
  customers: Customer[],
  suppliers: Supplier[],
  invoices: Invoice[],
  purchaseOrders: PurchaseOrder[] = []
) {
  const arBuckets = { current: 0, days30: 0, days60: 0, days90: 0 };
  const apBuckets = { current: 0, days30: 0, days60: 0, days90: 0 };

  const now = Date.now();

  invoices.forEach((inv) => {
    if (!inv.isPaid) {
      const invDate = new Date(inv.date).getTime();
      const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) arBuckets.current += inv.total || 0;
      else if (diffDays <= 60) arBuckets.days30 += inv.total || 0;
      else if (diffDays <= 90) arBuckets.days60 += inv.total || 0;
      else arBuckets.days90 += inv.total || 0;
    }
  });

  purchaseOrders.forEach((po) => {
    if ((po.status as string) === 'Pending' || (po.status as string) === 'Approved' || (po.status as string) === 'Sent' || po.status === 'Ordered') {
      const poDate = new Date(po.date).getTime();
      const diffDays = Math.floor((now - poDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) apBuckets.current += po.total || 0;
      else if (diffDays <= 60) apBuckets.days30 += po.total || 0;
      else if (diffDays <= 90) apBuckets.days60 += po.total || 0;
      else apBuckets.days90 += po.total || 0;
    }
  });

  const unpaidInvoiceSum = Object.values(arBuckets).reduce((s, x) => s + x, 0);
  const totalAR = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  if (totalAR > unpaidInvoiceSum) {
    arBuckets.current += (totalAR - unpaidInvoiceSum);
  }

  const unpaidPOSum = Object.values(apBuckets).reduce((s, x) => s + x, 0);
  const totalAP = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  if (totalAP > unpaidPOSum) {
    apBuckets.current += (totalAP - unpaidPOSum);
  }

  return [
    { bucket: '0-30 Days', Receivables: Math.round(arBuckets.current), Payables: Math.round(apBuckets.current) },
    { bucket: '31-60 Days', Receivables: Math.round(arBuckets.days30), Payables: Math.round(apBuckets.days30) },
    { bucket: '61-90 Days', Receivables: Math.round(arBuckets.days60), Payables: Math.round(apBuckets.days60) },
    { bucket: '> 90 Days', Receivables: Math.round(arBuckets.days90), Payables: Math.round(apBuckets.days90) },
  ];
}

/**
 * Inventory Health Breakdown (Donut Chart)
 * Buckets: Critical (stock <= alertQty), Low (stock <= alertQty * 1.5), Optimal, Excess
 */
export function getInventoryHealthData(products: Product[]) {
  let critical = 0;
  let low = 0;
  let optimal = 0;
  let excess = 0;

  products.forEach((p) => {
    const alert = p.alertQty || 5;
    if (p.stock <= alert) {
      critical++;
    } else if (p.stock <= alert * 1.8) {
      low++;
    } else if (p.stock <= alert * 6) {
      optimal++;
    } else {
      excess++;
    }
  });

  const total = products.length || 1;

  return [
    { name: 'Critical Stock', value: critical, color: '#ef4444', percent: Math.round((critical / total) * 100) },
    { name: 'Low Warning', value: low, color: '#f59e0b', percent: Math.round((low / total) * 100) },
    { name: 'Optimal Level', value: optimal, color: '#10b981', percent: Math.round((optimal / total) * 100) },
    { name: 'Excess Stock', value: excess, color: '#6366f1', percent: Math.round((excess / total) * 100) },
  ];
}

/**
 * Consolidated Executive Alerts List
 */
export interface ExecutiveAlertItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'inventory' | 'finance' | 'loan' | 'payroll' | 'workflow';
  moduleTab: string;
  moduleSubTab?: string;
  timestamp?: string;
  metricBadge?: string;
}

export function getAlertsData(
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[],
  loanAccounts: LoanAccount[],
  employees: Employee[],
  purchaseOrders: PurchaseOrder[] = []
): ExecutiveAlertItem[] {
  const alerts: ExecutiveAlertItem[] = [];

  // Low stock alerts
  const lowStock = products.filter((p) => p.stock <= p.alertQty);
  if (lowStock.length > 0) {
    alerts.push({
      id: 'alert-low-stock',
      title: `${lowStock.length} Products Below Safety Threshold`,
      description: `Critical inventory shortage detected on items: ${lowStock.slice(0, 3).map((p) => p.name).join(', ')}${lowStock.length > 3 ? '...' : ''}`,
      severity: 'critical',
      category: 'inventory',
      moduleTab: 'inventory',
      moduleSubTab: 'products',
      metricBadge: `${lowStock.length} Low Items`,
    });
  }

  // Overdue receivables
  const overdueCustomers = customers.filter((c) => c.outstandingBalance > 5000);
  if (overdueCustomers.length > 0) {
    const totalOverdue = overdueCustomers.reduce((s, c) => s + c.outstandingBalance, 0);
    alerts.push({
      id: 'alert-overdue-ar',
      title: `Overdue Receivables Exceeding 30 Days`,
      description: `${overdueCustomers.length} customer accounts have overdue balances totaling ৳${totalOverdue.toLocaleString()}`,
      severity: 'critical',
      category: 'finance',
      moduleTab: 'sales',
      moduleSubTab: 'customers',
      metricBadge: `৳${totalOverdue.toLocaleString()}`,
    });
  }

  // Upcoming loan repayments
  const activeLoans = loanAccounts.filter((l) => l.status === 'Active');
  if (activeLoans.length > 0) {
    alerts.push({
      id: 'alert-loan-due',
      title: `Upcoming Loan Installment Payments Due`,
      description: `${activeLoans.length} active credit facilities require monthly principal & interest servicing.`,
      severity: 'warning',
      category: 'loan',
      moduleTab: 'banking',
      moduleSubTab: 'loan_list',
      metricBadge: `${activeLoans.length} Loans Active`,
    });
  }

  // Employee Payroll Due
  const activeEmployees = employees.filter((e) => e.status === 'Active');
  if (activeEmployees.length > 0) {
    const estPayroll = activeEmployees.reduce((s, e) => s + (e.salary || 0), 0);
    alerts.push({
      id: 'alert-payroll',
      title: `Monthly Staff Payroll Disbursement Scheduled`,
      description: `Disbursement budget of ৳${estPayroll.toLocaleString()} for ${activeEmployees.length} active team members.`,
      severity: 'info',
      category: 'payroll',
      moduleTab: 'employee',
      moduleSubTab: 'payroll',
      metricBadge: `${activeEmployees.length} Staff`,
    });
  }

  // Real Pending approval workflow instances
  const pendingApprovals = purchaseOrders.filter((po) => (po.status as string) === 'Pending' || (po.status as string) === 'Pending Approval' || po.status === 'Ordered');
  if (pendingApprovals.length > 0) {
    alerts.push({
      id: 'alert-workflow',
      title: `${pendingApprovals.length} Pending Requisition & PO Approvals`,
      description: `Requires executive signature authorization before purchase dispatch.`,
      severity: 'warning',
      category: 'workflow',
      moduleTab: 'workflow',
      moduleSubTab: 'designer',
      metricBadge: `${pendingApprovals.length} Approvals`,
    });
  }

  return alerts;
}
