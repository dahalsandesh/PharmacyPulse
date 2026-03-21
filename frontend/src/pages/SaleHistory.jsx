import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Search, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import api from '@/services/api';
import { formatNPR, formatDateTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const SaleHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales'),
  });

  const { data: saleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['sale', selectedSaleId],
    queryFn: () => api.get(`/sales/${selectedSaleId}`).then(res => res.data.data),
    enabled: !!selectedSaleId,
  });

  const sales = data?.data || [];

  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.patientName && s.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-medstore-border card-shadow mt-2">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <Receipt className="mr-3 text-medstore-teal" size={24} />
          Sales History
        </h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
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
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading sales history...</div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
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
                    <td className="py-3.5 px-4 text-center">
                      <Badge 
                        color={
                          sale.paymentMethod === 'cash' ? 'green' : 
                          sale.paymentMethod === 'esewa' ? 'blue' : 'gray'
                        }
                        className="uppercase text-[10px]"
                      >
                        {sale.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {!sale.isVoided ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 tracking-tight">Completed</div>
                      ) : (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 tracking-tight">Voided</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                       <Button variant="ghostTeal" size="sm" className="h-8 shadow-sm" onClick={() => setSelectedSaleId(sale._id)}>
                         View Details
                       </Button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>No sales records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SALE DETAILS MODAL */}
      <Modal 
        isOpen={!!selectedSaleId} 
        onClose={() => setSelectedSaleId(null)} 
        title={`Invoice ${saleDetail?.invoiceNumber}`}
        maxWidth="max-w-2xl"
      >
        {isLoadingDetail ? (
          <div className="p-12 text-center text-gray-400">Loading order details...</div>
        ) : saleDetail ? (
          <div className="p-1 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Date</label>
                <div className="text-sm font-medium">{formatDate(saleDetail.saleDate)}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Payment</label>
                <div className="text-sm font-medium uppercase">{saleDetail.paymentMethod}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Sold By</label>
                <div className="text-sm font-medium">{saleDetail.soldBy?.name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Status</label>
                <div>
                   <Badge color={saleDetail.isVoided ? 'red' : 'green'}>
                     {saleDetail.isVoided ? 'VOIDED' : 'COMPLETED'}
                   </Badge>
                </div>
              </div>
            </div>

            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr className="text-gray-500 font-medium">
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {saleDetail.items?.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.medicineName}</td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{formatNPR(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatNPR(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end space-y-2 pr-4">
              <div className="flex justify-between w-48 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatNPR(saleDetail.totalAmount + (saleDetail.discount || 0))}</span>
              </div>
              <div className="flex justify-between w-48 text-sm text-red-500">
                <span>Discount</span>
                <span>-{formatNPR(saleDetail.discount || 0)}</span>
              </div>
              <div className="flex justify-between w-48 text-lg font-bold text-medstore-teal border-t border-gray-100 pt-2">
                <span>TOTAL</span>
                <span>{formatNPR(saleDetail.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-3">
              <Button variant="outline" onClick={() => setSelectedSaleId(null)}>Close</Button>
              <Button onClick={() => window.print()} variant="outline">Print Receipt</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default SaleHistory;
