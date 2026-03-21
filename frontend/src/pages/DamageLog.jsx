import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import api from '@/services/api';
import { formatNPR, formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const DamageLog = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['damageLogs'],
    queryFn: () => api.get('/damage'),
  });

  const logs = data?.data?.data || [];

  const filteredLogs = logs.filter(log => 
    log.medicineId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="mr-3 text-red-500" size={24} />
          Damage & Write-off Logs
        </h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by medicine or batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal"
            />
          </div>
          <Button variant="danger" className="h-10 shrink-0">
            <Plus size={18} className="mr-2" /> 
            Record Damage
          </Button>
        </div>
      </div>

      <div className="bg-white border border-medstore-border rounded-xl card-shadow flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading damage logs...</div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-4">Medicine Item</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Estimated Loss</th>
                  <th className="py-3 px-5 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-gray-600 font-medium">{formatDateTime(log.logDate)}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{log.medicineId?.name}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">{log.batchNumber}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">-{log.quantity}</td>
                    <td className="py-3.5 px-4">
                      <Badge color={log.reason === 'expired' ? 'orange' : 'red'} className="uppercase text-[10px]">
                        {log.reason}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-900 font-medium">{formatNPR(log.totalLossValue)}</td>
                    <td className="py-3.5 px-5 text-right text-gray-500">{log.loggedBy?.name || 'System'}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No damage logs recorded</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageLog;
