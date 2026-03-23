import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Search, Check, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import { formatNPR, formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const DamageLog = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['damageLogs'],
    queryFn: () => api.get('/damage'),
  });

  const logs = data?.data || [];

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
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by medicine or batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal"
            />
          </div>
          <Button variant="danger" className="h-10 w-full sm:w-auto shrink-0" onClick={() => setIsAddModalOpen(true)}>
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
            <table className="w-full text-left border-collapse text-sm min-w-[700px]">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium whitespace-nowrap">
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
                    <td className="py-3.5 px-5 text-gray-600 font-medium whitespace-nowrap">{formatDateTime(log.logDate)}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{log.medicineId?.name}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">{log.batchNumber}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">-{log.quantity}</td>
                    <td className="py-3.5 px-4">
                      <Badge color={log.reason === 'expired' ? 'orange' : 'red'} className="uppercase text-[10px]">
                        {log.reason}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-900 font-medium whitespace-nowrap">{formatNPR(log.totalLossValue)}</td>
                    <td className="py-3.5 px-5 text-right text-gray-500 whitespace-nowrap">{log.loggedBy?.name || 'System'}</td>
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

      {/* RECORD DAMAGE MODAL */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Record Stock Damage / Expiry"
        maxWidth="max-w-2xl sm:max-w-2xl"
      >
        <AddDamageForm onSuccess={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
};

// --- FORM SUB-COMPONENT ---

const AddDamageForm = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { reason: 'damaged', quantity: 1, notes: '' }
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['medicinesSearch', searchTerm],
    queryFn: () => {
      const q = searchTerm || '';
      return api.get(`/medicines?search=${q}&limit=10`);
    },
    enabled: searchTerm.length > 1 || isSearchFocused,
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/damage', data),
    onSuccess: () => {
      toast.success('Damage recorded');
      queryClient.invalidateQueries(['damageLogs', 'medicines', 'dashboardData']);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Error recording damage')
  });

  const handleSelectMed = (med) => {
    setSelectedMed(med);
    setSelectedBatch(null);
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  const onSubmit = (data) => {
    if (!selectedBatch) return toast.error('Select a batch');
    mutation.mutate({
      batchId: selectedBatch._id,
      quantity: parseInt(data.quantity),
      reason: data.reason,
      notes: data.notes
    });
  };

  const handleBlur = () => setTimeout(() => setIsSearchFocused(false), 200);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!selectedMed ? (
        <div className="relative">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">Search Medicine</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" placeholder="Type medicine name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={handleBlur}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-medstore-teal"
            />
          </div>
          {isSearchFocused && (
            <div className="absolute top-[76px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
              {isSearching ? <div className="p-3 text-center text-xs text-gray-500">Searching...</div> : 
               !searchResults || searchResults.length === 0 ? <div className="p-3 text-center text-xs text-gray-500">No meds found</div> :
               searchResults.map(m => (
                <button 
                  key={m._id} 
                  type="button" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectMed(m);
                  }} 
                  className="w-full text-left p-2.5 hover:bg-gray-50 border-b border-gray-50 text-sm flex justify-between"
                >
                  <span>{m.name}</span>
                  <span className="text-gray-400 text-xs">{m.currentStock} {m.unit}</span>
                </button>
               ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <Check size={16} className="text-teal-600 mr-2" />
            <span className="text-sm font-bold text-teal-900">{selectedMed.name}</span>
          </div>
          <button type="button" onClick={() => setSelectedMed(null)} className="text-[10px] font-bold text-teal-600 underline uppercase">Change</button>
        </div>
      )}

      {selectedMed && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Select Batch</label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
            {selectedMed.activeBatches?.map(b => (
              <button key={b.batchNumber} type="button" onClick={() => setSelectedBatch(b)}
                className={`p-3 text-left border-2 rounded-xl transition-all ${selectedBatch?.batchNumber === b.batchNumber ? 'border-medstore-teal bg-teal-50' : 'border-gray-100'}`}>
                <div className="text-[10px] font-mono font-bold text-gray-400 capitalize">{b.batchNumber}</div>
                <div className="font-bold text-gray-900">{b.quantity} <span className="text-[10px] font-normal text-gray-500">left</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBatch && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
              <select {...register('reason')} className="w-full p-2 sm:p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-medstore-teal">
                 <option value="damaged">Damaged</option>
                 <option value="expired">Expired</option>
                 <option value="lost">Lost</option>
              </select>
            </div>
            <Input label="Qty to remove" type="number" {...register('quantity', { required: true, max: selectedBatch.quantity })} error={errors.quantity && 'Invalid qty'} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Notes (Optional)</label>
            <textarea 
              {...register('notes')}
              className="w-full p-2 sm:p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-medstore-teal resize-none"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>
          <Button type="submit" variant="danger" fullWidth isLoading={mutation.isPending} className="py-3 sm:py-4">
            <Save size={18} className="mr-2" /> Confirm Write-off
          </Button>
        </div>
      )}
    </form>
  );
};

export default DamageLog;
