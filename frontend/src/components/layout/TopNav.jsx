import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { Calendar, User, Building2, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopNav = ({ toggleSidebar, isSidebarOpen }) => {
  const { dateSystem, setDateSystem } = useSettingsStore();
  const { user } = useAuthStore();

  const toggleDateSystem = () => {
    setDateSystem(dateSystem === 'AD' ? 'BS' : 'AD');
  };

  return (
    <header className="h-16 bg-white border-b border-medstore-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-medstore-teal"
        >
          <Menu size={20} />
        </button>

        {user?.pharmacyId?.name && (
          <div className="hidden sm:flex items-center text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Building2 size={14} className="mr-2 text-medstore-teal" />
            {user.pharmacyId.name}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* BS/AD Toggle Button */}
        <button 
          onClick={toggleDateSystem}
          className="flex items-center space-x-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition px-3 py-1.5 rounded-md focus:outline-none"
          title="Toggle Date System"
        >
          <Calendar size={16} className="text-gray-500" />
          <div className="flex bg-white rounded border border-gray-200 p-0.5 shadow-sm">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm transition-colors ${dateSystem === 'AD' ? 'bg-medstore-teal text-white' : 'text-gray-500'}`}>AD</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm transition-colors ${dateSystem === 'BS' ? 'bg-medstore-teal text-white' : 'text-gray-500'}`}>BS</span>
          </div>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* Profile Link */}
        <Link to="/profile" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-medstore-teal transition">
          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-medstore-teal">
            <User size={16} />
          </div>
          <span className="hidden sm:inline-block">{user?.name}</span>
        </Link>
      </div>
    </header>
  );
};

export default TopNav;
