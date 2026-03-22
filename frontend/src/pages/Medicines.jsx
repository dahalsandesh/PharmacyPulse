import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, PackagePlus, MoreVertical, Save, AlertCircle, Settings, Image as ImageIcon, Building2, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/utils/formatters';

const Medicines = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'stock' | 'delete' | 'catalog'
  const [isCatalogOpen, setIsCatalogOpen] = useState(false); // Separate state so it can overlay Add Medicine
  const [selectedMed, setSelectedMed] = useState(null);
  const [catalogInitialTab, setCatalogInitialTab] = useState('manufacturer');

  const { data, isLoading } = useQuery({
    queryKey: ['medicines', filter, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('stockStatus', filter);
      if (searchTerm) params.append('search', searchTerm);
      return api.get(`/medicines?${params.toString()}`);
    },
  });

  const { data: catalogData } = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then(res => res.data),
  });

  const medicines = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/medicines/${id}`),
    onSuccess: () => {
      toast.success('Medicine deleted successfully');
      queryClient.invalidateQueries(['medicines']);
      setActiveModal(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete medicine')
  });

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'low', label: 'Low Stock' },
    { id: 'expiring', label: 'Expiring' },
    { id: 'overstock', label: 'Overstock' }
  ];

  const handleOpenEdit = (med) => {
    setSelectedMed(med);
    setActiveModal('edit');
  };

  const handleOpenStock = (med) => {
    setSelectedMed(med);
    setActiveModal('stock');
  };

  const handleOpenDelete = (med) => {
    setSelectedMed(med);
    setActiveModal('delete');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-medstore-text-main">Medicines</h1>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setActiveModal('catalog')}>
            <Settings size={18} className="mr-2" />
            Manage Catalog
          </Button>
          <Button className="shrink-0" onClick={() => setActiveModal('add')}>
            <Plus size={18} className="mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

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

      <div className="bg-white rounded-xl border border-medstore-border card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                  <th className="py-4 px-6">Medicine</th>
                  <th className="py-4 px-4 text-center">In Stock</th>
                  <th className="py-4 px-4 text-center text-medstore-teal">Selling Price</th>
                  <th className="py-4 px-4">Category / Type</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4">Nearest Expiry</th>
                  <th className="py-4 px-4 text-right">Actions</th>
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
                  <tr key={med._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {med.image ? (
                          <img 
                            src={med.image} 
                            alt={med.name} 
                            className="w-10 h-10 rounded-lg border border-gray-100 object-cover bg-white shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900">{med.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{med.manufacturer || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${med.totalQuantity <= med.lowStockThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                          {med.totalQuantity}
                        </span>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter flex flex-col items-center leading-tight">
                          <span>{med.unit}s</span>
                          {med.packSize > 1 && <span>(x{med.packSize})</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-bold text-medstore-teal">
                        Rs. {med.sellingPrice?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        Avg Cost: Rs. {med.avgPurchasePrice?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="capitalize text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold w-fit mb-1">{med.category}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{med.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge color={med.stockStatus?.color}>{med.stockStatus?.label}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {med.nearestExpiry ? (
                        <div className="flex items-center text-gray-600">
                          {formatDate(med.nearestExpiry)}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenStock(med)}
                          className="p-1.5 text-medstore-teal hover:bg-teal-50 rounded-md transition-colors"
                          title="Add Stock"
                        >
                          <PackagePlus size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(med)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Catalog"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(med)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <Modal 
        isOpen={activeModal === 'add' || activeModal === 'edit'} 
        onClose={() => setActiveModal(null)}
        title={activeModal === 'edit' ? 'Edit Medicine entry' : 'Add New Medicine entry'}
      >
        <MedicineForm 
          medicine={selectedMed} 
          onSuccess={() => setActiveModal(null)} 
          isEdit={activeModal === 'edit'}
          catalogData={catalogData}
          onOpenCatalog={(tab) => {
            setCatalogInitialTab(tab);
            setIsCatalogOpen(true);
          }}
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'stock'} 
        onClose={() => setActiveModal(null)}
        title={`Add Stock: ${selectedMed?.name}`}
        maxWidth="max-w-xl"
      >
        <AddStockForm 
          medicine={selectedMed} 
          onSuccess={() => setActiveModal(null)} 
        />
      </Modal>

      <Modal 
        isOpen={activeModal === 'delete'} 
        onClose={() => setActiveModal(null)} 
        title="Delete Medicine"
        maxWidth="max-w-md"
      >
        <div className="p-6 text-center">
          <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
          <p className="text-gray-500 mb-6">This will permanently remove <span className="font-bold">{selectedMed?.name}</span> and all its batches from the system.</p>
          <div className="flex space-x-3">
            <Button variant="outline" fullWidth onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={() => deleteMutation.mutate(selectedMed._id)} isLoading={deleteMutation.isPending}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'catalog' || isCatalogOpen}
        onClose={() => {
          if (isCatalogOpen) setIsCatalogOpen(false);
          else setActiveModal(null);
        }}
        title="Manage Catalog Metadata"
        maxWidth="max-w-3xl"
      >
        <CatalogManager initialTab={catalogInitialTab} />
      </Modal>
    </div>
  );
};

// --- SEARCHABLE SELECT COMPONENT ---

const SearchableSelect = ({ label, options, value, onChange, onAddClick, placeholder, error, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optName) => {
    onChange(optName);
    setSearchTerm(optName);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
          {icon && <img src={icon} className="w-4 h-4 mr-1.5 rounded-sm" />}
          {label}
        </label>
        {onAddClick && (
          <button type="button" onClick={onAddClick} className="text-medstore-teal hover:text-medstore-teal-dark">
            <Plus size={14} />
          </button>
        )}
      </div>
      
      <div className="relative group">
        <input 
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medstore-teal pr-10 transition-all ${error ? 'border-red-500' : 'focus:border-transparent'}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in duration-100">
          {filteredOptions.length > 0 ? (
            <div className="p-1.5">
              {filteredOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(opt.name)}
                  className="w-full text-left px-3 py-2.5 hover:bg-teal-50 rounded-lg flex items-center transition-colors group"
                >
                  {opt.image ? (
                    <img src={opt.image} className="w-6 h-6 rounded border border-gray-100 mr-2.5 bg-white object-contain" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center mr-2.5 text-gray-400 border border-gray-100">
                      <ImageIcon size={12} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-medstore-teal">{opt.name}</div>
                    {opt.description && <div className="text-[10px] text-gray-400 line-clamp-1">{opt.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400 italic">
              No matches found. You can keep typing to use "{searchTerm}".
            </div>
          )}
        </div>
      )}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
};

const MedicineForm = ({ medicine, onSuccess, isEdit, catalogData, onOpenCatalog }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      name: medicine.name,
      category: medicine.category,
      type: medicine.type || 'tablet',
      manufacturer: medicine.manufacturer,
      unit: medicine.unit || 'tablet',
      packSize: medicine.packSize || 1,
      minStockLevel: medicine.minStockLevel || 10,
      sellingPrice: medicine.sellingPrice || 0,
      image: medicine.image || '',
    } : {
      name: '',
      category: '',
      type: 'tablet',
      manufacturer: '',
      unit: 'tablet',
      packSize: 1,
      minStockLevel: 10,
      sellingPrice: 0,
      image: '',
    }
  });

  const selectedCategory = watch('category');
  const selectedManufacturer = watch('manufacturer');

  const categoryIcon = catalogData?.find(c => c.type === 'category' && c.name === selectedCategory)?.image;
  const manufacturerLogo = catalogData?.find(c => c.type === 'manufacturer' && c.name === selectedManufacturer)?.image;

  const categoryOptions = (catalogData?.filter(c => c.type === 'category') || []).sort((a,b) => a.name.localeCompare(b.name));
  const typeOptions = (catalogData?.filter(c => c.type === 'type') || []).sort((a,b) => a.name.localeCompare(b.name));
  const manufacturerOptions = (catalogData?.filter(c => c.type === 'manufacturer') || []).sort((a,b) => a.name.localeCompare(b.name));
  const unitOptions = (catalogData?.filter(c => c.type === 'unit') || []).sort((a,b) => a.name.localeCompare(b.name));

  const mutation = useMutation({
    mutationFn: (data) => isEdit 
      ? api.put(`/medicines/${medicine._id}`, data)
      : api.post('/medicines', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Medicine updated' : 'Medicine created');
      queryClient.invalidateQueries(['medicines', 'catalog']);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Failed to save medicine')
  });

  const onSubmit = (data) => mutation.mutate({
    ...data,
    minStockLevel: parseInt(data.minStockLevel)
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
      <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg flex items-start text-[11px] text-teal-800">
        <AlertCircle size={14} className="mr-2 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Pro Tip:</span> You can create new categories, types, and manufacturers by simply typing them in the fields below!
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input label="Medicine Name" {...register('name', { required: true })} error={errors.name && 'Name is required'} />
        </div>
        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          {watch('image') ? (
            <img src={watch('image')} className="w-12 h-12 rounded object-cover" />
          ) : (
            <ImageIcon size={24} className="text-gray-400" />
          )}
          <span className="text-[9px] text-gray-400 mt-1">Preview</span>
        </div>
      </div>

      <Input label="Medicine Image URL" {...register('image')} placeholder="https://example.com/med.png" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect 
          label="Category"
          options={categoryOptions}
          value={watch('category')}
          onChange={val => setValue('category', val)}
          onAddClick={() => onOpenCatalog('category')}
          placeholder="Select category..."
          icon={categoryIcon}
          error={errors.category?.message}
        />
        <SearchableSelect 
          label="Type"
          options={typeOptions}
          value={watch('type')}
          onChange={val => setValue('type', val)}
          onAddClick={() => onOpenCatalog('type')}
          placeholder="Select type..."
          error={errors.type?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect 
          label="Manufacturer"
          options={manufacturerOptions}
          value={watch('manufacturer')}
          onChange={val => setValue('manufacturer', val)}
          onAddClick={() => onOpenCatalog('manufacturer')}
          placeholder="Select manufacturer..."
          icon={manufacturerLogo}
        />
        <SearchableSelect 
          label="Unit"
          options={unitOptions}
          value={watch('unit')}
          onChange={val => setValue('unit', val)}
          onAddClick={() => onOpenCatalog('unit')}
          placeholder="Select unit..."
          error={errors.unit?.message}
        />
        <Input 
          label="Pack Size (e.g. 100)" 
          type="number" 
          min="1"
          {...register('packSize', { required: true, valueAsNumber: true })} 
          error={errors.packSize?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Selling Price (Base)" type="number" step="0.01" {...register('sellingPrice', { required: true })} />
        <Input label="Min Alert Level" type="number" {...register('minStockLevel')} />
      </div>

      <Button type="submit" fullWidth isLoading={mutation.isPending} className="mt-2">
        <Save size={18} className="mr-2" />
        {isEdit ? 'Update Medicine' : 'Save Medicine'}
      </Button>
    </form>
  </div>
);
};

// --- CATALOG MANAGER COMPONENT ---

const CatalogManager = ({ initialTab = 'manufacturer' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: catalogItems, isLoading } = useQuery({
    queryKey: ['catalog', activeTab],
    queryFn: () => api.get(`/catalog?type=${activeTab}`).then(res => res.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/catalog', { ...data, type: activeTab }),
    onSuccess: () => {
      toast.success('Catalog updated');
      queryClient.invalidateQueries(['catalog', activeTab]);
      queryClient.invalidateQueries([`${activeTab}s`]); // For dropdowns
      setEditingItem(null);
      setIsFormOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.message || 'Error updating catalog')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalog/${id}`),
    onSuccess: () => {
      toast.success('Item removed');
      queryClient.invalidateQueries(['catalog', activeTab]);
      queryClient.invalidateQueries([`${activeTab}s`]);
    }
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setValue('name', item.name);
    setValue('image', item.image || '');
    setValue('description', item.description || '');
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    reset();
    setIsFormOpen(true);
  };

  const onSubmit = (data) => mutation.mutate(data);

  const tabs = [
    { id: 'manufacturer', label: 'Manufacturers' },
    { id: 'category', label: 'Categories' },
    { id: 'type', label: 'Types' },
    { id: 'unit', label: 'Units' }
  ];

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label.slice(0, -1) || activeTab;

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between border-b border-gray-200 mb-4 pr-2 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditingItem(null); reset(); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id ? 'border-medstore-teal text-medstore-teal' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={handleAddNew} className="ml-4 h-8 px-3 text-xs shrink-0">
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading items...</div> :
         catalogItems?.length === 0 ? <div className="p-12 text-center text-gray-400">No {activeTab}s added yet.</div> :
         catalogItems?.map(item => (
          <div key={item._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow group">
            <div className="flex items-center space-x-3">
              {activeTab === 'manufacturer' && (
                item.image ? (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg border border-gray-100 object-contain bg-gray-50" />
                ) : (
                  <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                    <Building2 size={16} />
                  </div>
                )
              )}
              <div>
                <div className="text-sm font-bold text-gray-900">{item.name}</div>
                {activeTab === 'manufacturer' && item.description && (
                  <div className="text-[10px] text-gray-400">{item.description}</div>
                )}
              </div>
            </div>
            <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
              <button onClick={() => deleteMutation.mutate(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
         ))
        }
      </div>

      {/* NESTED ADD/EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={`${editingItem ? 'Edit' : 'Add New'} ${currentTabLabel}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-1 space-y-4">
          <Input label={`${currentTabLabel} Name`} {...register('name', { required: true })} placeholder={`Enter name...`} />
          
          {activeTab === 'manufacturer' && (
            <>
              <Input label="Logo URL" {...register('image')} placeholder="https://example.com/logo.png" />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Description / Country</label>
                <textarea 
                  {...register('description')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medstore-teal h-20"
                  placeholder="e.g. Nepal, India..."
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" fullWidth isLoading={mutation.isPending}>
              {editingItem ? 'Update' : 'Save Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const AddStockForm = ({ medicine, onSuccess }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      batchNumber: '',
      expiryDate: '',
      quantity: 1,
      purchasePrice: 0,
    }
  });

  const generateBatch = () => {
    const prefix = medicine.name?.substring(0, 3).toUpperCase() || 'MED';
    const date = dayjs().format('DDMMYY');
    setValue('batchNumber', `${prefix}-${date}`);
  };

  React.useEffect(() => {
    generateBatch();
  }, [medicine._id]);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/stock', { ...data, medicineId: medicine._id }),
    onSuccess: () => {
      toast.success('Stock added successfully');
      queryClient.invalidateQueries(['medicines', 'dashboardData']);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || 'Failed to add stock')
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase">Batch Number</label>
            <div className="space-x-2 flex">
              <button 
                type="button" 
                onClick={generateBatch}
                className="text-[10px] text-medstore-teal hover:underline font-bold"
              >
                Auto-Generate
              </button>
              <button 
                type="button" 
                onClick={() => setValue('batchNumber', '')}
                className="text-[10px] text-red-500 hover:underline font-bold"
              >
                Clear
              </button>
            </div>
          </div>
          <Input {...register('batchNumber', { required: true })} placeholder="e.g. B12345" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Expiry Month</label>
          <input type="month" {...register('expiryDate', { required: true })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-medstore-teal" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label={`Quantity (${medicine?.unit}s)`} 
          type="number" 
          {...register('quantity', { required: true })} 
          placeholder="Number of packs..."
        />
        <Input label="Purchase Price (per unit)" type="number" step="0.01" {...register('purchasePrice', { required: true })} />
      </div>
      {medicine?.packSize > 1 && watch('quantity') > 0 && (
        <div className="text-xs text-medstore-teal font-medium bg-teal-50 p-2 rounded border border-teal-100 flex justify-between items-center">
          <span>Total {medicine.name} (pieces):</span>
          <span className="font-bold">{watch('quantity')} {medicine.unit}s x {medicine.packSize} = {watch('quantity') * medicine.packSize} total pieces</span>
        </div>
      )}
      <div className="bg-blue-50 p-3 rounded-lg flex items-start text-[11px] text-blue-700">
        <AlertCircle size={14} className="mr-2 shrink-0 mt-0.5" />
        This stock will be added to the catalog for {medicine?.name}. Oldest batches will be sold first (FIFO).
      </div>
      <Button type="submit" fullWidth isLoading={mutation.isPending}>
        Confirm & Add Stock
      </Button>
    </form>
  );
};


export default Medicines;
