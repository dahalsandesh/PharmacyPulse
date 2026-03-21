import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Building2, Plus, Edit, ShieldX, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const AdminPharmacies = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminPharmacies'],
    queryFn: () => api.get('/admin/pharmacies')
  });

  const toggleSubscription = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/admin/pharmacies/${id}`, { 
      subscription: { isActive } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      toast.success('Subscription status updated');
    },
    onError: (err) => toast.error(err.message || 'Update failed')
  });

  const pharmacies = data?.data || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-medstore-text-main flex items-center">
            <Building2 className="mr-3 text-medstore-teal" />
            Manage Pharmacies
          </h1>
          <p className="text-sm text-gray-500 mt-1">Super Admin Portal - Multi-Tenant Control</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Add Pharmacy
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-medstore-border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                <th className="py-4 px-6">Pharmacy Name</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4 text-center">Users</th>
                <th className="py-4 px-4">Plan / Expiry</th>
                <th className="py-4 px-4">Subscription</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">Loading pharmacies...</td>
                </tr>
              ) : pharmacies.length === 0 ? (
                <tr>
                   <td colSpan="6" className="py-12 text-center text-gray-400">No pharmacies found.</td>
                </tr>
              ) : (
                pharmacies.map((pharmacy) => (
                  <tr key={pharmacy._id} className="border-b border-gray-50 hover:bg-gray-50/80">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{pharmacy.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{pharmacy.ownerName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{pharmacy.phone || '—'}</div>
                      <div className="text-xs text-gray-500">{pharmacy.email || '—'}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-medium">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">{pharmacy.userCount || 0}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize font-medium block">{pharmacy.subscription?.plan || 'free'}</span>
                      {pharmacy.subscription?.endDate && (
                        <span className="text-xs text-gray-500">Exp: {formatDate(pharmacy.subscription.endDate)}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {pharmacy.subscription?.isActive ? (
                        <Badge color="green" className="flex w-fit items-center">
                          <ShieldCheck size={12} className="mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge color="red" className="flex w-fit items-center">
                          <ShieldX size={12} className="mr-1" /> Suspended
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-2">
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           className="h-8"
                           onClick={() => toggleSubscription.mutate({ 
                             id: pharmacy._id, 
                             isActive: !pharmacy.subscription?.isActive 
                           })}
                         >
                           {pharmacy.subscription?.isActive ? 'Suspend' : 'Activate'}
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPharmacies;
