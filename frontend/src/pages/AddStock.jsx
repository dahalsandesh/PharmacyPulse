import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PackagePlus, ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import dayjs from 'dayjs';
import api from '@/services/api';

const AddStock = () => {
  const navigate = useNavigate();
  const queryClient = new QueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
    },
  });

  const { data: medicinesData, isLoading: isLoadingMed } = useQuery({
    queryKey: ['medicines', { limit: 1000 }], // Fetch all for short dropdown prototyping
    queryFn: () => api.get('/medicines?limit=1000'),
  });

  const createBatchMutation = useMutation({
    mutationFn: (data) => api.post('/stock', data),
    onSuccess: () => {
      toast.success('Stock added successfully');
      queryClient.invalidateQueries(['dashboardData', 'medicines']);
      navigate('/medicines');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    },
  });

  const onSubmit = (data) => {
    // MM/YYYY standard format in Nepal for expiries, but UI inputs as YYYY-MM
    // The backend parsers handle MM/YYYY natively, so we convert from native HTML5 'month' picker (YYYY-MM)
    const [year, month] = data.expiryDate.split('-');
    
    createBatchMutation.mutate({
      medicineId: data.medicineId,
      batchNumber: data.batchNumber.toUpperCase(),
      expiryDate: `${month}/${year}`,
      quantity: parseInt(data.quantity),
      purchasePrice: parseFloat(data.purchasePrice),
      sellingPrice: parseFloat(data.sellingPrice),
    });
  };

  const medicinesList = medicinesData?.data?.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <PackagePlus className="mr-3 text-medstore-teal" size={24} />
            Add New Stock (Batch)
          </h1>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-medstore-border card-shadow mt-4 text-left">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Select Medicine <span className="text-red-500">*</span></label>
              <select
                className={`w-full bg-gray-50 border ${errors.medicineId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-medstore-teal focus:border-medstore-teal'} rounded-lg px-4 py-2.5 outline-none focus:ring-2`}
                {...register('medicineId', { required: 'Please select a medicine' })}
              >
                <option value="">-- Select a medicine --</option>
                {medicinesList.map((med) => (
                  <option key={med._id} value={med._id}>
                    {med.name} ({med.category})
                  </option>
                ))}
              </select>
              {errors.medicineId && <p className="text-sm text-red-500 mt-1">{errors.medicineId.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Batch Number"
                type="text"
                placeholder="e.g. BATCH-001"
                error={errors.batchNumber?.message}
                {...register('batchNumber', { required: 'Batch Number is required' })}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Expiry Month <span className="text-red-500">*</span></label>
                <input
                  type="month"
                  className={`w-full bg-gray-50 border ${errors.expiryDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-medstore-teal focus:border-medstore-teal'} rounded-lg px-4 py-2.5 outline-none focus:ring-2`}
                  {...register('expiryDate', { required: 'Expiry date is required' })}
                />
                {errors.expiryDate && <p className="text-sm text-red-500 mt-1">{errors.expiryDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Quantity added"
                type="number"
                min="1"
                error={errors.quantity?.message}
                {...register('quantity', { required: 'Quantity required', min: 1 })}
              />
              <Input
                label="Purchase Price (NPR)"
                type="number"
                min="0"
                step="0.01"
                error={errors.purchasePrice?.message}
                {...register('purchasePrice', { required: 'Purchase Price required' })}
              />
              <Input
                label="Selling Price (NPR)"
                type="number"
                min="0"
                step="0.01"
                error={errors.sellingPrice?.message}
                {...register('sellingPrice', { required: 'Selling Price required' })}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={createBatchMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={createBatchMutation.isPending}
              isLoading={createBatchMutation.isPending}
            >
              <Save size={16} className="mr-2" />
              Save Stock Batch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStock;
