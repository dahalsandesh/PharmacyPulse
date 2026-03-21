import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Pill, 
  PlusCircle, 
  Receipt, 
  AlertTriangle, 
  BarChart, 
  LogOut,
  Bell,
  AlertOctagon,
  Users,
  Store
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'superadmin';

  const navItems = isAdmin ? [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Pharmacies', path: '/admin/pharmacies', icon: Store },
    { name: 'Users', path: '/admin/users', icon: Users },
  ] : [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Medicines', path: '/medicines', icon: Pill },
    { name: 'Add Stock', path: '/stock/new', icon: PlusCircle },
    { name: 'Sales', path: '/sales', icon: Receipt },
    { name: 'Damage Log', path: '/damage', icon: AlertTriangle },
    { name: 'Reports', path: '/reports', icon: BarChart },
  ];

  return (
    <div className="w-[220px] h-screen bg-[#1A1D23] text-white flex flex-col flex-shrink-0">
      <div className="p-5 flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center">
          <Pill size={18} className="text-white" />
        </div>
        <span className="font-semibold text-lg tracking-wide">MedStore</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-medium
              ${isActive 
                ? 'bg-[#0D9488] text-white border-l-4 border-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }
            `}
          >
            <item.icon size={18} className="mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-gray-800 space-y-4">
        {!isAdmin && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded-md">
              <Bell size={14} />
              <span>3 Expiring Soon</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-red-500 bg-red-500/10 px-2 py-1.5 rounded-md">
              <AlertOctagon size={14} />
              <span>2 Low Stock</span>
            </div>
            <div className="h-px bg-gray-800 my-2" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
