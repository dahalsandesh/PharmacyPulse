import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Pill, ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';

const AddMedicine = () => {
  const navigate = useNavigate();
  const queryClient = new QueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      category: '',
      manufacturer: '',
      minStockLevel: 10,
    },
  });

  const createMedicineMutation = useMutation({
    mutationFn: (data) => api.post('/medicines', data),
    onSuccess: () => {
      toast.success('Medicine catalog entry created successfully');
      queryClient.invalidateQueries(['medicines']);
      navigate('/medicines');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create medicine');
    },
  });

  const onSubmit = (data) => {
    createMedicineMutation.mutate({
      name: data.name,
      category: data.category,
      manufacturer: data.manufacturer,
      minStockLevel: parseInt(data.minStockLevel),
    });
  };

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
            <Pill className="mr-3 text-medstore-teal" size={24} />
            Add New Medicine
          </h1>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-medstore-border card-shadow mt-4 text-left">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            
            <Input
              label="Medicine Name"
              type="text"
              placeholder="e.g. Paracetamol 500mg"
              error={errors.name?.message}
              {...register('name', { required: 'Medicine name is required' })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Category"
                type="text"
                placeholder="e.g. Tablet, Syrup, Capsule"
                error={errors.category?.message}
                {...register('category', { required: 'Category is required' })}
              />
              <Input
                label="Manufacturer / Brand"
                type="text"
                placeholder="e.g. Nepal Pharma"
                error={errors.manufacturer?.message}
                {...register('manufacturer', { required: 'Manufacturer is required' })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Stock Alert Level"
                type="number"
                placeholder="10"
                min="0"
                error={errors.minStockLevel?.message}
                {...register('minStockLevel', { 
                  required: 'Minimum stock level is required',
                  valueAsNumber: true,
                })}
              />
            </div>
            
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={createMedicineMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={createMedicineMutation.isPending}
              isLoading={createMedicineMutation.isPending}
            >
              <Save size={16} className="mr-2" />
              Save Medicine
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicine;
