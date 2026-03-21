import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import api from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

const Medicines = () => {
  const [filter, setFilter] = useState('all'); // all, low, expiring, overstock
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['medicines', filter, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('stockStatus', filter);
      if (searchTerm) params.append('search', searchTerm);
      return api.get(`/medicines?${params.toString()}`);
    },
  });

  const medicines = data?.data || [];

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'low', label: 'Low Stock' },
    { id: 'expiring', label: 'Expiring' }, // This would ideally call the /expiring endpoint, but simplified here
    { id: 'overstock', label: 'Overstock' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-medstore-text-main">Medicines</h1>
        <Button className="shrink-0">
          <Plus size={18} className="mr-2" />
          Add Medicine
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-medstore-border card-shadow p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
                ${filter === opt.id 
                  ? 'bg-medstore-teal border-medstore-teal text-white' 
                  : 'bg-white border-medstore-border text-medstore-text-muted hover:bg-gray-50'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search medicine..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-medstore-teal focus:border-medstore-teal transition-all"
          />
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-medstore-border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                <th className="py-4 px-6">Medicine</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4 text-right">Stock</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Nearest Expiry</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">Loading medicines...</td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No medicines found. 
                    {searchTerm && " Try adjusting your search."}
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr key={med._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{med.genericName || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize text-gray-600">{med.category}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {med.currentStock} <span className="text-gray-400 font-normal text-xs">{med.unit}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge color={med.stockStatus?.color}>{med.stockStatus?.label}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {med.nearestExpiry ? (
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">{formatDate(med.nearestExpiry)}</span>
                          {/* Alert pill logic would go here if within 90 days */}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="secondary" size="sm" className="h-8 shadow-sm">
                        Manage
                      </Button>
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

export default Medicines;
