import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Undo2, Search, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import { formatNPR, formatDateTime } from '@/utils/formatters';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const PurchaseReturn = () => {
  const [searchParams] = useSearchParams();
  const preselectedBatchId = searchParams.get('batchId');

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || null);
  const [viewHistory, setViewHistory] = useState(true); // Default to history
  
  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['activeBatches'],
    queryFn: () => api.get('/stock/history?limit=100').then(res => res.data), // Fetch robust history
    enabled: !viewHistory
  });

  const { data: returnsData, isLoading: isReturnsLoading } = useQuery({
    queryKey: ['purchaseReturns'],
    queryFn: () => api.get('/returns/purchases').then(res => res.data),
    enabled: viewHistory
  });

  const { data: batchDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['batch', selectedBatchId],
    queryFn: () => api.get(`/stock/batch/${selectedBatchId}`).then(res => res.data),
    enabled: !!selectedBatchId,
  });

  const deleteReturnMutation = useMutation({
    mutationFn: (id) => api.delete(`/returns/purchases/${id}`),
    onSuccess: () => {
      toast.success('Return record deleted');
      queryClient.invalidateQueries(['purchaseReturns']);
    },
    onError: (err) => toast.error('Failed to delete return: ' + err.message)
  });

  const batches = batchesData?.data || [];
  const returns = returnsData?.data || [];

  const filteredBatches = batches.filter(b => 
    b.quantity > 0 && (
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.medicineId?.name && b.medicineId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const filteredReturns = returns.filter(r => 
    r.batchId?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { reason: '', quantity: '' }
  });

  useEffect(() => {
    if (batchDetail) {
      reset({ reason: '', quantity: '' });
    }
  }, [batchDetail, reset]);

  const returnQuantity = parseInt(watch('quantity')) || 0;
  const maxReturn = batchDetail ? batchDetail.quantity : 0;
  const refundAmount = batchDetail ? returnQuantity * batchDetail.purchasePrice : 0;

  const returnMutation = useMutation({
    mutationFn: (data) => api.post('/returns/purchases', data),
    onSuccess: () => {
      toast.success('Purchase return processed successfully');
      queryClient.invalidateQueries(['activeBatches']);
      queryClient.invalidateQueries(['purchaseHistory']);
      queryClient.invalidateQueries(['purchaseReturns']);
      queryClient.invalidateQueries(['dashboardData']);
      setSelectedBatchId(null);
      setViewHistory(true);
    },
    onError: (err) => toast.error(err.message || 'Failed to process return')
  });

  const onSubmitReturn = (data) => {
    if (data.quantity > maxReturn) {
      toast.error('Return quantity cannot exceed current stock');
      return;
    }

    returnMutation.mutate({
      batchId: selectedBatchId,
      reason: data.reason,
      quantity: parseInt(data.quantity)
    });
  };

  const handleDeleteReturn = (id) => {
    if (window.confirm('Are you sure you want to delete this purchase return record?')) {
      deleteReturnMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <Undo2 className="mr-3 text-medstore-teal" size={24} />
          Purchase Return {viewHistory ? 'History' : 'Processing'}
        </h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {viewHistory ? (
            <Button onClick={() => setViewHistory(false)}>
              <Undo2 size={16} className="mr-2" />
              Add Purchase Return
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setViewHistory(true)}>
              Back to History
            </Button>
          )}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by batch or item..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-medstore-border rounded-xl card-shadow flex-1 overflow-hidden flex flex-col">
        {!viewHistory ? (
          // NEW RETURN VIEW (List of Batches)
          isBatchesLoading ? (
            <div className="p-8 text-center text-gray-400">Loading purchase records...</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                    <th className="py-3 px-5">Batch Number</th>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">Remaining Stock</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr key={batch._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{batch.batchNumber}</td>
                      <td className="py-3.5 px-4 font-medium">{batch.medicineId?.name}</td>
                      <td className="py-3.5 px-4 text-gray-600">{batch.supplierId?.name || '-'}</td>
                      <td className="py-3.5 px-4 text-center text-red-500 font-bold">{batch.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">{formatNPR(batch.purchasePrice)}</td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                         <Button variant="ghostTeal" size="sm" className="h-8 shadow-sm" onClick={() => setSelectedBatchId(batch._id)}>
                           <Undo2 size={14} className="mr-1.5" /> Return to Supplier
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredBatches.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No batches with active stock found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // RETURN HISTORY VIEW
          isReturnsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading return history...</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                     <th className="py-3 px-5">Date</th>
                     <th className="py-3 px-4">Batch Number</th>
                     <th className="py-3 px-4">Medicine</th>
                     <th className="py-3 px-4">Supplier</th>
                     <th className="py-3 px-4 text-center">Returned Qty</th>
                     <th className="py-3 px-5 text-right">Refund Amount</th>
                     <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr key={ret._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 text-gray-600">{formatDateTime(ret.returnDate)}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{ret.batchId?.batchNumber || 'Unknown'}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{ret.medicineId?.name || 'Unknown'}</td>
                      <td className="py-3.5 px-4 text-gray-600">{ret.supplierId?.name || '-'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-900">{ret.quantity}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-red-500">{formatNPR(ret.refundAmount)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button onClick={() => handleDeleteReturn(ret._id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded bg-white border border-transparent hover:border-red-100 shadow-sm transition-all" title="Delete Return">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No purchase return records found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* RETURN MODAL */}
      <Modal 
        isOpen={!!selectedBatchId && !viewHistory} 
        onClose={() => {
          setSelectedBatchId(null);
          // remove query param if exists without reload
          if (preselectedBatchId) window.history.replaceState({}, '', '/purchases/return');
        }} 
        title={`Return to Supplier - Batch ${batchDetail?.batchNumber}`}
        maxWidth="max-w-xl"
      >
        {isLoadingDetail ? (
          <div className="p-12 text-center text-gray-400">Loading batch details...</div>
        ) : batchDetail ? (
          <form onSubmit={handleSubmit(onSubmitReturn)} className="p-1 space-y-6">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm flex items-start">
              <FileText className="mr-2 mt-0.5 shrink-0" size={16} />
              <div>
                Specify the quantity to return to the supplier. This will be permanently deducted from your inventory.
              </div>
            </div>

            <div className="grid grid-cols-2 bg-gray-50 p-4 rounded-xl gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Medicine</label>
                <div className="text-sm font-medium">{batchDetail.medicineId?.name}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Current Stock</label>
                <div className="text-sm font-medium text-red-600">{batchDetail.quantity}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Unit Cost</label>
                <div className="text-sm font-medium">{formatNPR(batchDetail.purchasePrice)}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Supplier</label>
                <div className="text-sm font-medium">{batchDetail.supplierId?.name || '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Return Quantity" 
                type="number" 
                max={maxReturn}
                min="1"
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Minimum 1' },
                  max: { value: maxReturn, message: `Maximum ${maxReturn}` }
                })}
                error={errors.quantity?.message}
              />
              <div className="flex flex-col justify-end pb-1 text-right">
                <span className="text-xs text-gray-500 mb-1">Expected Refund</span>
                <span className="text-2xl font-bold text-medstore-teal">{formatNPR(refundAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Reason for Return <span className="text-red-500">*</span></label>
              <textarea 
                {...register('reason', { required: 'Reason is required' })}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-medstore-teal outline-none min-h-[80px]"
                placeholder="e.g., Damaged on arrival, near expiry, excess stock..."
              />
              {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
            </div>

            <div className="flex justify-end pt-2 space-x-3 border-t border-gray-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedBatchId(null)}>Cancel</Button>
              <Button type="submit" disabled={returnQuantity === 0 || returnMutation.isPending} isLoading={returnMutation.isPending}>
                <CheckCircle size={16} className="mr-2" />
                Process Return
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
};

export default PurchaseReturn;
