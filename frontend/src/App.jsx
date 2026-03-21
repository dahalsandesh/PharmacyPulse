import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Medicines from '@/pages/Medicines';
import NewSale from '@/pages/NewSale';
import AdminPharmacies from '@/pages/AdminPharmacies';
import Profile from '@/pages/Profile';
import SaleHistory from '@/pages/SaleHistory';
import DamageLog from '@/pages/DamageLog';
import Reports from '@/pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            {/* Pharmacy Staff Routes */}
            <Route path="medicines" element={<Medicines />} />
            <Route path="sales/history" element={<SaleHistory />} />
            <Route path="sales" element={<NewSale />} />
            <Route path="damage" element={<DamageLog />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            
            {/* SuperAdmin Routes */}
            {/* <Route path="admin" element={<AdminDashboard />} /> */}
            <Route path="admin/pharmacies" element={<AdminPharmacies />} />
            {/* <Route path="admin/users" element={<AdminUsers />} /> */}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
