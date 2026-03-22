import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Search, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import { formatNPR, formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const SalesReturn = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [viewHistory, setViewHistory] = useState(true); // Default to history
  
  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then(res => res.data),
    enabled: !viewHistory
  });

  const { data: returnsData, isLoading: isReturnsLoading } = useQuery({
    queryKey: ['salesReturns'],
    queryFn: () => api.get('/returns/sales').then(res => res.data),
    enabled: viewHistory
  });

  const { data: saleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['sale', selectedSaleId],
    queryFn: () => api.get(`/sales/${selectedSaleId}`).then(res => res.data),
    enabled: !!selectedSaleId,
  });

  const deleteReturnMutation = useMutation({
    mutationFn: (id) => api.delete(`/returns/sales/${id}`),
    onSuccess: () => {
      toast.success('Return record deleted');
      queryClient.invalidateQueries(['salesReturns']);
    },
    onError: (err) => toast.error('Failed to delete return: ' + err.message)
  });

  const sales = salesData?.data || [];
  const returns = returnsData?.data || [];

  const filteredSales = sales.filter(s => 
    !s.isVoided && s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReturns = returns.filter(r => 
    r.saleId?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form for returning items
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { reason: '', items: [] }
  });

  // Pre-fill form when saleDetail loads
  React.useEffect(() => {
    if (saleDetail && saleDetail.items) {
      reset({
        reason: '',
        items: saleDetail.items.map(item => ({
          saleItemId: item._id,
          medicineName: item.medicineName,
          unitPrice: item.unitPrice,
          maxQuantity: item.quantity,
          returnQuantity: 0
        }))
      });
    }
  }, [saleDetail, reset]);

  const returnItems = watch('items') || [];
  const totalReturnAmount = returnItems.reduce((sum, item) => sum + ((parseInt(item.returnQuantity) || 0) * item.unitPrice), 0);
  const hasItemsToReturn = returnItems.some(item => (parseInt(item.returnQuantity) || 0) > 0);

  const returnMutation = useMutation({
    mutationFn: (data) => api.post('/returns/sales', data),
    onSuccess: () => {
      toast.success('Sales return processed successfully');
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['salesReturns']);
      queryClient.invalidateQueries(['dashboardData']);
      setSelectedSaleId(null);
      setViewHistory(true);
    },
    onError: (err) => toast.error(err.message || 'Failed to process return')
  });

  const onSubmitReturn = (data) => {
    const itemsToReturn = data.items
      .filter(i => parseInt(i.returnQuantity) > 0)
      .map(i => ({
        saleItemId: i.saleItemId,
        quantity: parseInt(i.returnQuantity)
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Please specify at least one item quantity to return');
      return;
    }

    returnMutation.mutate({
      saleId: selectedSaleId,
      reason: data.reason,
      items: itemsToReturn
    });
  };

  const handleDeleteReturn = (id) => {
    if (window.confirm('Are you sure you want to delete this return record?')) {
      deleteReturnMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <RotateCcw className="mr-3 text-medstore-teal" size={24} />
          Sales Return {viewHistory ? 'History' : 'Processing'}
        </h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {viewHistory ? (
            <Button onClick={() => setViewHistory(false)}>
              <RotateCcw size={16} className="mr-2" />
              Add Sales Return
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
              placeholder="Search by invoice..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-medstore-border rounded-xl card-shadow flex-1 overflow-hidden flex flex-col">
        {!viewHistory ? (
          // NEW RETURN VIEW (List of Sales)
          isSalesLoading ? (
            <div className="p-8 text-center text-gray-400">Loading recent sales...</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                    <th className="py-3 px-5">Invoice</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{sale.invoiceNumber}</td>
                      <td className="py-3.5 px-4 text-gray-600">{formatDateTime(sale.saleDate)}</td>
                      <td className="py-3.5 px-4 text-center text-gray-600 font-medium">{sale.itemCount}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">{formatNPR(sale.totalAmount)}</td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                         <Button variant="ghostTeal" size="sm" className="h-8 shadow-sm" onClick={() => setSelectedSaleId(sale._id)}>
                           <RotateCcw size={14} className="mr-1.5" /> Return Items
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-400">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No suitable sales found for return</p>
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
                     <th className="py-3 px-4">Original Invoice</th>
                     <th className="py-3 px-4">Reason</th>
                     <th className="py-3 px-4">Processed By</th>
                     <th className="py-3 px-5 text-right">Refund Amount</th>
                     <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr key={ret._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 text-gray-600">{formatDateTime(ret.returnDate)}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{ret.saleId?.invoiceNumber || 'Unknown'}</td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate" title={ret.reason}>{ret.reason}</td>
                      <td className="py-3.5 px-4 text-gray-600">{ret.processedBy?.name || '-'}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-red-500">{formatNPR(ret.totalRefund)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button onClick={() => handleDeleteReturn(ret._id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded bg-white border border-transparent hover:border-red-100 shadow-sm transition-all" title="Delete Return">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No return records found</p>
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
        isOpen={!!selectedSaleId && !viewHistory} 
        onClose={() => setSelectedSaleId(null)} 
        title={`Process Return - Invoice ${saleDetail?.invoiceNumber}`}
        maxWidth="max-w-3xl"
      >
        {isLoadingDetail ? (
          <div className="p-12 text-center text-gray-400">Loading order details...</div>
        ) : saleDetail ? (
          <form onSubmit={handleSubmit(onSubmitReturn)} className="p-1 space-y-6">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm flex items-start">
              <FileText className="mr-2 mt-0.5 shrink-0" size={16} />
              <div>
                Specify the quantity of each item you wish to return. Stock will be added back to the inventory automatically.
              </div>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500 font-medium">
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4 text-center">Purchased Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center w-32">Return Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item, index) => (
                    <tr key={item.saleItemId} className="border-t border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.medicineName}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-500">{item.maxQuantity}</td>
                      <td className="py-3 px-4 text-right">{formatNPR(item.unitPrice)}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max={item.maxQuantity}
                          className="w-full text-center border border-gray-300 rounded-md py-1 focus:ring-2 focus:ring-medstore-teal outline-none"
                          {...register(`items.${index}.returnQuantity`, { 
                            valueAsNumber: true,
                            max: item.maxQuantity,
                            min: 0
                          })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-gray-700">Reason for Return <span className="text-red-500">*</span></label>
                <textarea 
                  {...register('reason', { required: 'Reason is required' })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-medstore-teal outline-none min-h-[80px]"
                  placeholder="e.g., Customer changed mind, wrong item sold..."
                />
                {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
              </div>

              <div className="w-full md:w-64 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                <div className="text-sm text-gray-500 mb-1">Total Refund Amount</div>
                <div className="text-3xl font-bold text-red-500">{formatNPR(totalReturnAmount)}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 space-x-3 border-t border-gray-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedSaleId(null)}>Cancel</Button>
              <Button type="submit" disabled={!hasItemsToReturn || returnMutation.isPending} isLoading={returnMutation.isPending}>
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

export default SalesReturn;
