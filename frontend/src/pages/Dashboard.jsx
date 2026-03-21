import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  AlertTriangle, 
  X,
  ArrowRight,
  Package,
  Activity,
  DollarSign 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import api from '@/services/api';
import { formatNPR, formatDate, getExpiryStatus } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const Dashboard = () => {
  const [showAlerts, setShowAlerts] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => api.get('/reports/dashboard'),
  });

  if (isLoading) return <div className="h-full flex items-center justify-center p-8 text-gray-400">Loading dashboard data...</div>;
  if (error) return <div className="p-8 text-red-500">Failed to load dashboard</div>;

  const summary = data?.data?.today || {};
  const alerts = data?.data?.alerts || {};
  const stockHealth = data?.data?.stockHealth || {};
  const recentSales = data?.data?.recentSales || [];

  const totalExpiring = alerts.expiry?.expired + alerts.expiry?.days30;
  const isAlertVisible = showAlerts && (totalExpiring > 0 || alerts.lowStock > 0);

  // Recharts Data Transformation
  const healthData = [
    { name: 'Normal', value: stockHealth.normal || 0, color: '#10B981' },
    { name: 'High', value: stockHealth.high || 0, color: '#3B82F6' },
    { name: 'Overstock', value: stockHealth.overstock || 0, color: '#8B5CF6' },
    { name: 'Low', value: stockHealth.low || 0, color: '#F59E0B' },
    { name: 'Critical', value: stockHealth.critical || 0, color: '#EF4444' },
    { name: 'Out Stock', value: stockHealth.out_of_stock || 0, color: '#991B1B' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-[20px] font-semibold text-medstore-text-main">Dashboard</h1>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search medicine..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal focus:border-medstore-teal transition-all"
            />
          </div>
        </div>

        <div className="text-sm font-medium text-medstore-text-muted hidden md:block">
          {dayjs().format('ddd, D MMM YYYY')} · Kathmandu
        </div>
      </div>

      {/* Alert Banner */}
      {isAlertVisible && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 px-4 flex items-center justify-between text-amber-800 animate-in fade-in duration-300">
          <div className="flex items-center">
            <AlertTriangle className="mr-3 text-amber-500" size={20} />
            <span className="text-sm font-medium">
              {totalExpiring > 0 && <span>{totalExpiring} medicines expiring within 30 days &nbsp;·&nbsp;</span>}
              {alerts.lowStock > 0 && <span>{alerts.lowStock} medicines critically low stock</span>}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghostTeal" size="sm" className="bg-white border-transparent text-sm h-8 hidden sm:flex">
              View All Alerts
            </Button>
            <button onClick={() => setShowAlerts(false)} className="text-amber-500 hover:text-amber-700 transition">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards - 4 Column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's sales"
          value={formatNPR(summary.revenue)}
          subValue={`+${summary.revenueChange || 0}% vs yesterday`}
          subValuePositive={summary.revenueChange >= 0}
          topColor="bg-medstore-teal"
        />
        <StatCard 
          title="Today's margin"
          value={formatNPR(summary.profit)}
          badgeValue={summary.revenue ? `${Math.round((summary.profit / summary.revenue) * 100)}%` : '0%'}
          badgeColor="green"
          topColor="bg-emerald-500"
        />
        <StatCard 
          title="Units today"
          value={summary.itemsSold || 0}
          subValue={`${summary.salesCount || 0} transactions`}
          topColor="bg-blue-500"
        />
        <StatCard 
          title="Today's losses"
          value={formatNPR(summary.damageValue)}
          subValue={`${summary.damageBatches || 0} batches written off`}
          subValuePositive={false}
          topColor="bg-red-500"
        />
      </div>

      {/* Main Grid: Expiry Table (Left 60%) & Stock Chart (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Expiring Medicines List */}
        <div className="lg:col-span-3 bg-white border border-medstore-border rounded-xl card-shadow overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              Expiring Medicines
            </h2>
            <button className="text-sm font-medium text-medstore-teal hover:text-medstore-teal-hover">View All</button>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                  <th className="py-3 px-5 whitespace-nowrap">Medicine name</th>
                  <th className="py-3 px-3 whitespace-nowrap">Batch no</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Qty left</th>
                  <th className="py-3 px-3 whitespace-nowrap">Expiry</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.expiringBatches?.length === 0 ? (
                 <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">No batches expiring soon</td>
                 </tr> 
                ) : (
                  alerts.expiringBatches?.slice(0, 5).map((batch, i) => {
                    const status = batch.expiryStatus;
                    const isUrgent = status.urgent;
                    return (
                      <tr key={batch._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-5 font-medium text-gray-900">{batch.medicineId?.name}</td>
                        <td className="py-3 px-3 text-gray-500">{batch.batchNumber}</td>
                        <td className="py-3 px-3 text-right font-medium">{batch.quantity}</td>
                        <td className="py-3 px-3 text-gray-600">{formatDate(batch.expiryDate)}</td>
                        <td className="py-3 px-3">
                           <Badge color={status.color}>{status.label}</Badge>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Button variant={isUrgent ? 'danger' : 'ghostTeal'} size="sm" className={isUrgent ? 'h-7 text-xs px-2' : 'h-7 text-xs px-2'}>
                            {isUrgent ? 'Write Off' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Health Overview Chart */}
        <div className="lg:col-span-2 bg-white border border-medstore-border rounded-xl card-shadow p-5 flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Stock Health Overview</h2>
          
          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={75} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E3DE', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-3 tracking-wider">Critical Items</h3>
            <div className="space-y-2">
              {alerts.lowStockMedicines?.length === 0 ? (
                <div className="text-sm text-gray-400 italic">No low stock items</div>
              ) : (
                alerts.lowStockMedicines?.slice(0, 3).map((item) => (
                  <div key={item._id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 leading-tight">{item.name}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{item.currentStock} left</span>
                    </div>
                    <Badge color={item.stockStatus.color}>{item.stockStatus.label}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-medstore-border rounded-xl card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Sales</h2>
          <Button variant="ghostTeal" size="sm" className="h-8">
            View All <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                <th className="py-3 px-5">Invoice</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-5 font-medium text-gray-900">{sale.invoiceNumber}</td>
                  <td className="py-3 px-4 text-gray-500">{dayjs(sale.saleDate).format('hh:mm A')}</td>
                  <td className="py-3 px-4 text-gray-500">{sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">{formatNPR(sale.totalAmount)}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge 
                      color={
                        sale.paymentMethod === 'cash' ? 'green' : 
                        sale.paymentMethod === 'esewa' ? 'blue' : 
                        sale.paymentMethod === 'khalti' ? 'purple' : 'gray'
                      }
                      className="uppercase text-[10px] px-2 py-1 tracking-wider"
                    >
                      {sale.paymentMethod}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-medstore-teal hover:underline font-medium text-sm">View</button>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">No sales recorded today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-component for small stat cards
function StatCard({ title, value, subValue, subValuePositive, badgeValue, badgeColor, topColor }) {
  return (
    <div className={`bg-white rounded-xl border border-medstore-border card-shadow p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-full h-[3px] ${topColor}`}></div>
      <div className="flex flex-col h-full">
        <h3 className="text-sm font-medium text-medstore-text-muted mb-2">{title}</h3>
        
        <div className="flex items-end justify-between mt-1">
          <div className="text-[28px] font-semibold text-medstore-text-main leading-none">
            {value}
          </div>
          {badgeValue && (
            <Badge color={badgeColor} className="mb-1 text-[11px] font-bold px-2">{badgeValue}</Badge>
          )}
        </div>
        
        {subValue !== undefined && (
          <div className="mt-4 flex items-center text-xs">
            {subValuePositive !== undefined ? (
              <span className={`flex items-center ${subValuePositive ? 'text-emerald-600' : 'text-red-600 font-medium'}`}>
                {subValuePositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {subValue}
              </span>
            ) : (
              <span className="text-gray-500">{subValue}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
