import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageSearch, Search, FileText, Undo2, Plus, Trash2, CheckCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '@/services/api';
import { formatNPR, formatDateTime, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const AddPurchaseForm = ({ onSuccess, medicines }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      purchasePrice: 0,
    }
  });

  const selectedMedId = watch('medicineId');
  const selectedMed = medicines.find(m => m._id === selectedMedId);

  const generateBatch = () => {
    if (!selectedMed) return toast.error('Please select a medicine first');
    const prefix = selectedMed.name?.substring(0, 3).toUpperCase() || 'MED';
    const date = dayjs().format('DDMMYY');
    setValue('batchNumber', `${prefix}-${date}`);
  };

  const mutation = useMutation({
    mutationFn: (data) => api.post('/stock', data),
    onSuccess: () => {
      toast.success('Purchase added successfully');
      queryClient.invalidateQueries(['purchaseHistory']);
      queryClient.invalidateQueries(['dashboardData']);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Failed to add purchase')
  });

  const onSubmit = (data) => {
    const [year, month] = data.expiryDate.split('-');
    mutation.mutate({
      ...data,
      batchNumber: data.batchNumber.toUpperCase(),
      expiryDate: `${month}/${year}`,
      quantity: parseInt(data.quantity),
      purchasePrice: parseFloat(data.purchasePrice),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase">Select Medicine</label>
        <select 
          {...register('medicineId', { required: 'Medicine is required' })}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medstore-teal"
        >
          <option value="">-- Select Medicine --</option>
          {medicines.map(med => (
             <option key={med._id} value={med._id}>{med.name} ({med.unit}s) - Stock: {med.totalQuantity}</option>
          ))}
        </select>
        {errors.medicineId && <p className="text-[10px] text-red-500">{errors.medicineId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase">Batch Number</label>
            <button type="button" onClick={generateBatch} className="text-[10px] text-medstore-teal hover:underline font-bold">Auto-Generate</button>
          </div>
          <Input {...register('batchNumber', { required: true })} placeholder="e.g. B12345" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Expiry Month</label>
          <input type="month" {...register('expiryDate', { required: true })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-medstore-teal" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Intake Quantity (Packs/Units)" type="number" {...register('quantity', { required: true, min: 1 })} />
        <Input label="Unit Cost (NPR)" type="number" step="0.01" {...register('purchasePrice', { required: true, min: 0 })} />
      </div>

      <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" isLoading={mutation.isPending}>
          <CheckCircle size={16} className="mr-2" /> Save Purchase
        </Button>
      </div>
    </form>
  );
};

const EditPurchaseForm = ({ batch, onSuccess }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      batchNumber: batch.batchNumber,
      expiryDate: dayjs(batch.expiryDate).format('YYYY-MM'),
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice,
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.put(`/stock/batch/${batch._id}`, data),
    onSuccess: () => {
      toast.success('Purchase updated successfully');
      queryClient.invalidateQueries(['purchaseHistory']);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Failed to update purchase')
  });

  const onSubmit = (data) => {
    const [year, month] = data.expiryDate.split('-');
    mutation.mutate({
      ...data,
      batchNumber: data.batchNumber.toUpperCase(),
      expiryDate: `${month}/${year}`,
      quantity: parseInt(data.quantity),
      purchasePrice: parseFloat(data.purchasePrice),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Batch Number" {...register('batchNumber', { required: true })} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Expiry Month</label>
          <input type="month" {...register('expiryDate', { required: true })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-medstore-teal" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Current Quantity" type="number" {...register('quantity', { required: true, min: 0 })} />
        <Input label="Unit Cost (NPR)" type="number" step="0.01" {...register('purchasePrice', { required: true, min: 0 })} />
      </div>

      <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" isLoading={mutation.isPending}>
          <CheckCircle size={16} className="mr-2" /> Update Purchase
        </Button>
      </div>
    </form>
  );
};

const PurchaseHistory = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  
  const { data: purchaseData, isLoading } = useQuery({
    queryKey: ['purchaseHistory'],
    queryFn: () => api.get('/stock/history'),
  });

  const { data: medicinesData } = useQuery({
    queryKey: ['medicines', 'all', ''],
    queryFn: () => api.get('/medicines?limit=1000'),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id) => api.delete(`/stock/batch/${id}`),
    onSuccess: () => {
      toast.success('Purchase record deleted globally');
      queryClient.invalidateQueries(['purchaseHistory']);
      queryClient.invalidateQueries(['medicines']);
    },
    onError: (err) => toast.error('Failed to delete purchase: ' + err.message)
  });

  const batches = purchaseData?.data || [];
  const medicinesList = medicinesData?.data || [];

  const filteredBatches = batches.filter(b => 
    b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.medicineId?.name && b.medicineId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you SURE you want to explicitly delete this purchase batch? This skips normal return workflows.')) {
      deleteBatchMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <PackageSearch className="mr-3 text-medstore-teal" size={24} />
          Purchase / Intake History
        </h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Add Purchase
          </Button>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search medicine or batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-medstore-border rounded-xl card-shadow flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading purchase history...</div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                   <th className="py-3 px-5">Date</th>
                   <th className="py-3 px-4">Batch Number</th>
                   <th className="py-3 px-4">Medicine</th>
                   <th className="py-3 px-4">Supplier</th>
                   <th className="py-3 px-4 text-center">Intake Qty</th>
                   <th className="py-3 px-4 text-center">Current Qty</th>
                   <th className="py-3 px-4 text-right">Unit Cost</th>
                   <th className="py-3 px-4 text-center">Expiry</th>
                   <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-gray-600">{formatDateTime(batch.createdAt)}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{batch.batchNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{batch.medicineId?.name || 'Unknown'}</td>
                    <td className="py-3.5 px-4 text-gray-600">{batch.supplierId?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-center text-gray-600">{batch.initialQuantity}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-900">{batch.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">{formatNPR(batch.purchasePrice)}</td>
                    <td className="py-3.5 px-4 text-center">
                       <span className={new Date(batch.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-gray-600'}>
                         {formatDate(batch.expiryDate)}
                       </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                       <div className="flex justify-end space-x-1">
                         <Link to={`/purchases/return?batchId=${batch._id}`}>
                           <Button variant="ghostTeal" size="sm" className="h-8 shadow-sm flex items-center" disabled={batch.quantity === 0}>
                             <Undo2 size={14} className="mr-1.5" /> Return
                           </Button>
                         </Link>
                         <button onClick={() => setEditingBatch(batch)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded bg-white border border-transparent hover:border-blue-100 shadow-sm transition-all" title="Edit Purchase">
                            <Pencil size={16} />
                         </button>
                         <button onClick={() => handleDelete(batch._id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded bg-white border border-transparent hover:border-red-100 shadow-sm transition-all" title="Delete Formally">
                            <Trash2 size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-400">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No purchase records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Record New Purchase Intake"
        maxWidth="max-w-xl"
      >
        <AddPurchaseForm onSuccess={() => setIsAddModalOpen(false)} medicines={medicinesList} />
      </Modal>

      <Modal 
        isOpen={!!editingBatch} 
        onClose={() => setEditingBatch(null)} 
        title="Edit Purchase Intake"
        maxWidth="max-w-xl"
      >
        {editingBatch && <EditPurchaseForm batch={editingBatch} onSuccess={() => setEditingBatch(null)} />}
      </Modal>
    </div>
  );
};

export default PurchaseHistory;
