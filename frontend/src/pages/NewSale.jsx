import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, Plus, Trash2, ShieldCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import api from '@/services/api';
import { useSalesStore } from '@/stores/salesStore';
import { formatNPR } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { Users } from 'lucide-react';

const NewSale = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountVal, setDiscountVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [soldById, setSoldById] = useState(user?._id || '');
  
  const { cart, addToCart, removeFromCart, updateQuantity, updatePrice, clearCart } = useSalesStore();

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['medicinesSearch', searchTerm],
    queryFn: () => {
      if (searchTerm.length === 1) return [];
      return api.get(`/medicines?search=${searchTerm}&limit=20`).then(res => res.data);
    },
  });

  const { data: staffData } = useQuery({
    queryKey: ['pharmacyUsers'],
    queryFn: () => api.get('/auth/pharmacy/users').then(res => res.data),
    enabled: !!user,
  });

  const staffMembers = staffData?.data || [];

  React.useEffect(() => {
    if (user?._id && !soldById) setSoldById(user._id);
  }, [user]);

  const handleAddToCart = (medicine) => {
    if (medicine.currentStock <= 0) {
      toast.error('Item is out of stock!');
      return;
    }
    
    addToCart({
      medicineId: medicine._id,
      medicineName: medicine.name,
      availableStock: medicine.currentStock,
      unitPrice: medicine.sellingPrice || 0,
      nearestExpiry: medicine.nearestExpiry,
      quantity: 1
    });
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    try {
      setIsSubmitting(true);
      const payload = {
        items: cart.map(i => ({ medicineId: i.medicineId, quantity: i.quantity, medicineName: i.medicineName, unitPrice: i.unitPrice })),
        paymentMethod,
        discount: parseFloat(discountVal) || 0,
        soldById: soldById || user._id,
      };

      await api.post('/sales', payload);
      toast.success('Sale completed successfully!');
      clearCart();
      setDiscountVal('');
    } catch (err) {
      toast.error(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discountAmount = parseFloat(discountVal) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  
  const hasExpiryWarning = cart.some(i => i.nearestExpiry && new Date(i.nearestExpiry).getTime() < new Date().getTime() + 30*24*60*60*1000);

  const handleBlur = () => setTimeout(() => setIsSearchFocused(false), 200);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      
      {/* Left Panel: Cart & Search */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-medstore-border card-shadow overflow-hidden min-h-[400px]">
        
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 relative z-20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search medicine name or generic name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={handleBlur}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medstore-teal focus:border-transparent transition-all shadow-sm"
            />
            
            {/* Autocomplete Dropdown */}
            {isSearchFocused && (searchTerm.length === 0 || searchTerm.length > 1) && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto w-full">
                <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {searchTerm ? 'Search Results' : 'Available Medicines'}
                </div>
                {isSearching ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Loading medicines...</div>
                ) : !searchResults || searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No medicines found</div>
                ) : (
                  searchResults.map(med => (
                    <button 
                      key={med._id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                        handleAddToCart(med);
                      }}
                      className="w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between transition-colors focus:bg-gray-50 outline-none"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{med.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{med.currentStock} {med.unit} left</div>
                      </div>
                      <div className="text-medstore-teal font-medium tabular-nums">
                        {formatNPR(med.sellingPrice || 0)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Area */}
        <div className="flex-1 overflow-auto p-0 min-h-[300px]">
          {cart.length === 0 ? (
            <div className="h-full py-12 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-900">Sale Cart is Empty</p>
              <p className="text-sm mt-1">Search for a medicine above to add it to the cart</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100 text-gray-500 font-medium tracking-wide">
                    <th className="py-3 px-5">Medicine</th>
                    <th className="py-3 px-4 w-28 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-5 text-right font-semibold text-gray-900">Total</th>
                    <th className="py-3 px-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.medicineId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900">{item.medicineName}</div>
                        {item.nearestExpiry && new Date(item.nearestExpiry).getTime() < new Date().getTime() + 30*24*60*60*1000 && (
                          <div className="text-xs font-semibold text-amber-600 mt-1 flex items-center bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <AlertCircle size={10} className="mr-1" />
                            Expiring Soon
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <input 
                            type="number" 
                            min="1"
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-gray-300 rounded-md py-1.5 focus:ring-1 focus:ring-medstore-teal focus:border-medstore-teal outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end">
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.medicineId, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right border-b border-dashed border-gray-300 hover:border-medstore-teal focus:border-medstore-teal outline-none py-1 text-gray-800 font-medium bg-transparent"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-gray-900 text-base">
                        {formatNPR(item.unitPrice * item.quantity)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => removeFromCart(item.medicineId)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Banner Bottom */}
        {cart.length > 0 && hasExpiryWarning && (
          <div className="bg-amber-50 border-t border-amber-100 p-3 px-5 flex flex-col md:flex-row md:items-center text-sm text-amber-800 gap-2">
            <span className="font-semibold flex items-center">
               <AlertCircle size={16} className="mr-1.5" />
               FIFO Processing active
            </span>
            <span className="opacity-90">Oldest batches will be sold automatically.</span>
          </div>
        )}
      </div>

      {/* Right Panel: Summary */}
      <div className="w-full lg:w-96 flex flex-col shrink-0">
        <div className="bg-white rounded-xl border border-medstore-border card-shadow flex flex-col lg:sticky lg:top-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          </div>
          
          <div className="p-5 border-b border-gray-100 bg-teal-50/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                <Users size={14} className="mr-1.5" /> Sold By
              </label>
            </div>
            <select 
              value={soldById}
              onChange={(e) => setSoldById(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medstore-teal transition-all"
            >
              {staffMembers.map(staff => (
                <option key={staff._id} value={staff._id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
              {!staffMembers.some(s => s._id === user?._id) && user && (
                <option value={user._id}>{user.name} (Me)</option>
              )}
            </select>
          </div>
          
          <div className="p-5 space-y-4 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal ({cart.length} items)</span>
              <span className="font-semibold text-gray-900">{formatNPR(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Discount (NPR)</span>
              <div className="w-24">
                <input 
                  type="number"
                  placeholder="0"
                  min="0"
                  value={discountVal}
                  onChange={e => setDiscountVal(e.target.value)}
                  className="w-full text-right border-b border-gray-300 focus:border-medstore-teal outline-none py-1 text-red-600 font-medium placeholder-gray-300"
                />
              </div>
            </div>

            <hr className="border-gray-100 my-2" />
            
            <div className="flex justify-between items-end">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-2xl sm:text-3xl font-bold text-medstore-teal tracking-tight">{formatNPR(total)}</span>
            </div>

            <div className="pt-4 space-y-3">
              <span className="text-sm font-medium text-gray-700 block mb-2">Payment Method</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-emerald-500' },
                  { id: 'esewa', label: 'eSewa', color: 'bg-blue-50 border-blue-200 text-blue-700 ring-blue-500' },
                  { id: 'khalti', label: 'Khalti', color: 'bg-purple-50 border-purple-200 text-purple-700 ring-purple-500' },
                  { id: 'card', label: 'Card', color: 'bg-gray-50 border-gray-200 text-gray-700 ring-gray-900' }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`
                      py-2.5 px-3 border rounded-lg text-sm font-semibold transition-all flex justify-center items-center
                      ${paymentMethod === pm.id 
                        ? pm.color + ' ring-1 opacity-100 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-500 opacity-60 hover:opacity-100 hover:bg-gray-50'
                      }
                    `}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
             <Button 
               size="lg" 
               fullWidth 
               className="h-14 text-base font-bold shadow-md shadow-teal-500/20"
               onClick={handleCheckout}
               isLoading={isSubmitting}
               disabled={cart.length === 0}
             >
               <ShieldCheck size={20} className="mr-2" />
               COMPLETE SALE
             </Button>
             
             {cart.length > 0 && (
               <button 
                onClick={clearCart}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 mt-4 underline decoration-gray-300 underline-offset-4"
               >
                 Cancel Sale
               </button>
             )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default NewSale;
