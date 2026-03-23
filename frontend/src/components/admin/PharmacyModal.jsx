import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';

const PharmacyModal = ({ isOpen, onClose, pharmacy }) => {
  const isEditing = !!pharmacy;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      ownerName: '',
      phone: '',
      email: '',
      address: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (pharmacy) {
        reset({
          name: pharmacy.name || '',
          ownerName: pharmacy.ownerName || '',
          phone: pharmacy.phone || '',
          email: pharmacy.email || '',
          address: pharmacy.address || ''
        });
      } else {
        reset({
          name: '',
          ownerName: '',
          phone: '',
          email: '',
          address: ''
        });
      }
    }
  }, [isOpen, pharmacy, reset]);

  const mutation = useMutation({
    mutationFn: (data) => 
      isEditing 
        ? api.put(`/admin/pharmacies/${pharmacy._id}`, data)
        : api.post('/admin/pharmacies', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      toast.success(isEditing ? 'Pharmacy updated' : 'Pharmacy added');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Pharmacy' : 'Add Pharmacy'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Pharmacy Name *" 
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input 
            label="Owner Name *" 
            {...register('ownerName', { required: 'Owner Name is required' })}
            error={errors.ownerName?.message}
          />
          <Input 
            label="Phone" 
            {...register('phone')}
          />
          <Input 
            label="Email" 
            type="email"
            {...register('email')}
          />
          <Input 
            label="Address" 
            className="md:col-span-2"
            {...register('address')}
          />
        </div>
        <div className="flex items-center justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {isEditing ? 'Update Pharmacy' : 'Add Pharmacy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PharmacyModal;
