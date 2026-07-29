import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ShoppingBag } from 'lucide-react';

export interface SalesByCategoryProps {
  data: { category: string; sales: number; itemsCount?: number }[];
  isLoading?: boolean;
}

const BAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{item.category}</p>
        <p className="text-emerald-400 font-mono font-bold">
          Sales: ৳{item.sales?.toLocaleString()}
        </p>
        {item.itemsCount !== undefined && (
          <p className="text-slate-400">Est Units: {item.itemsCount}</p>
        )}
      </div>
    );
  }
  return null;
};

export const SalesByCategory: React.FC<SalesByCategoryProps> = React.memo(({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 h-[380px] animate-pulse flex flex-col justify-between">
        <div className="h-5 w-48 bg-slate-800 rounded"></div>
        <div className="h-56 w-full bg-slate-800/60 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-200 font-display">
              Sales by Product Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Top performing product categories by total billing volume
            </p>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="category"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

SalesByCategory.displayName = 'SalesByCategory';
