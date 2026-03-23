import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import api from '@/services/api';
import { formatNPR, formatDate } from '@/utils/formatters';

const Reports = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss-reports'],
    queryFn: () => api.get('/reports/profit-loss?days=30'),
  });

  const summary = data?.data || {};
  const reportData = summary.dailyBreakdown || [];
  
  // Quick aggregates
  const totalRevenue = summary.totalRevenue || 0;
  const totalCost = summary.totalCOGS || 0;
  const totalProfit = summary.grossProfit || 0;
  const totalDamage = summary.damageWriteOffs || 0;

  // Recharts payload
  const chartData = reportData.map(d => ({
    name: formatDate(d.reportDate).split(',')[0], // Truncate 'YYYY' part if needed, or just standard format
    Revenue: d.revenue,
    Cost: d.cogs,
    Profit: d.profit,
  })).reverse(); // Oldest to newest for the chart timeline

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <BarChartIcon className="mr-3 text-medstore-teal" size={24} />
          Financial Reports & Analytics (Last 30 Days)
        </h1>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Loading analytical data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard 
              title="Total Revenue (30d)"
              value={formatNPR(totalRevenue)}
              icon={<DollarSign size={20} className="text-blue-500" />}
              color="border-blue-500"
            />
            <ReportCard 
              title="Net Profit (30d)"
              value={formatNPR(totalProfit)}
              icon={<TrendingUp size={20} className="text-emerald-500" />}
              color="border-emerald-500"
            />
            <ReportCard 
              title="Cost of Goods Sold"
              value={formatNPR(totalCost)}
              icon={<TrendingDown size={20} className="text-amber-500" />}
              color="border-amber-500"
            />
            <ReportCard 
              title="Total Damage Loss"
              value={formatNPR(totalDamage)}
              icon={<TrendingDown size={20} className="text-red-500" />}
              color="border-red-500"
            />
          </div>

          <div className="bg-white border border-medstore-border rounded-xl card-shadow p-6 flex flex-col flex-1 min-h-[400px]">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Revenue & Profit Trends</h2>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6B7280' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#6B7280' }} 
                    tickFormatter={(value) => `Rs.${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E3DE', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatNPR(value), undefined]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Profit" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function ReportCard({ title, value, icon, color }) {
  return (
    <div className={`bg-white rounded-xl border border-medstore-border card-shadow p-5 relative overflow-hidden flex items-center`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color}`}></div>
      <div className="ml-3 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">{title}</h3>
        <div className="text-xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export default Reports;
