import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, 
  Pill, 
  PlusCircle, 
  Receipt, 
  AlertTriangle, 
  BarChart, 
  LogOut,
  Bell,
  Users,
  Store
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'superadmin';

  const { data: expiringData } = useQuery({
    queryKey: ['expiringCount'],
    queryFn: () => api.get('/medicines/expiring?days=30'),
    enabled: !!user && !isAdmin,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 mins
  });

  const expiringCount = expiringData?.data?.length || 0;

  const navItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Pharmacies', path: '/admin/pharmacies', icon: Store },
    { name: 'Users', path: '/admin/users', icon: Users },
  ] : [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Medicines', path: '/medicines', icon: Pill },
    { name: 'New Sale', path: '/sales', icon: PlusCircle },
    { name: 'Sales History', path: '/sales/history', icon: Receipt },
    { name: 'Damage Log', path: '/damage', icon: AlertTriangle },
    { name: 'Reports', path: '/reports', icon: BarChart },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!isAdmin && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div 
        className={`
          fixed md:static inset-y-0 left-0 z-30
          ${isOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full md:translate-x-0 md:w-[70px]'}
          bg-[#1A1D23] text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        `}
      >
        <div className={`p-4 flex items-center mb-4 ${isOpen ? 'justify-start space-x-3 px-5' : 'justify-center'}`}>
          <img src="/logo.svg" alt="PharmacyPulse" className="w-8 h-8 shrink-0" />
          {isOpen && <span className="font-semibold text-lg tracking-wide whitespace-nowrap">PharmacyPulse</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1 overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isOpen ? item.name : undefined}
              className={({ isActive }) => `
                flex items-center rounded-md transition-colors text-sm font-medium
                ${isOpen ? 'px-3 py-2.5' : 'justify-center p-2.5 w-10 mx-auto'}
                ${isActive 
                  ? 'bg-[#0D9488] text-white border-l-4 border-white' 
                  : `text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 ${isOpen ? 'border-transparent' : 'border-[#1A1D23]'}`
                }
              `}
            >
              <item.icon size={18} className={isOpen ? 'mr-3 shrink-0' : 'shrink-0'} />
              {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className={`p-4 border-t border-gray-800 space-y-4 ${isOpen ? '' : 'px-2'}`}>
          {!isAdmin && isOpen && expiringCount > 0 && (
            <div className="space-y-2 mb-4">
              <NavLink 
                to="/medicines?filter=expiring"
                className="flex items-center space-x-2 text-xs text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded-md hover:bg-amber-500/20 transition-colors"
              >
                <Bell size={14} />
                <span>{expiringCount} Expiring</span>
              </NavLink>
              <div className="h-px bg-gray-800 my-2" />
            </div>
          )}
          
          <div className={`flex items-center ${isOpen ? 'justify-between' : 'flex-col space-y-3'}`}>
            <div className={`flex items-center ${isOpen ? 'space-x-2' : ''}`}>
              <div title={user?.name || 'User'} className="w-8 h-8 shrink-0 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium uppercase text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {isOpen && (
                <div className="flex flex-col whitespace-nowrap overflow-hidden pr-2 text-left">
                  <span className="text-sm font-medium leading-none truncate">{user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>
              )}
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
