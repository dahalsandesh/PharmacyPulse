import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { Calendar, User, Building2, Menu, Bell, Check, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { formatDateTime } from '@/utils/formatters';

const TopNav = ({ toggleSidebar, isSidebarOpen }) => {
  const queryClient = useQueryClient();
  const { dateSystem, setDateSystem } = useSettingsStore();
  const { user } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const toggleDateSystem = () => {
    setDateSystem(dateSystem === 'AD' ? 'BS' : 'AD');
  };

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
    enabled: !!user,
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const readMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {/* Notifications Bell */}
        <div className="relative flex items-center" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-gray-500 hover:text-medstore-teal hover:bg-gray-100 rounded-full transition focus:outline-none focus:ring-2 focus:ring-medstore-teal"
            title={`${unreadCount} unread notifications`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => readAllMutation.mutate()}
                    className="text-xs text-medstore-teal hover:underline font-medium flex items-center"
                    disabled={readAllMutation.isPending}
                  >
                    <Check size={14} className="mr-1" /> Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No notifications yet.</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif._id} 
                      className={`p-3 rounded-lg flex items-start space-x-3 transition-colors ${notif.isRead ? 'bg-white opacity-70 hover:bg-gray-50' : 'bg-teal-50/50 border border-teal-100/50 hover:bg-teal-50'}`}
                    >
                      <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${notif.isRead ? 'bg-gray-300' : 'bg-medstore-teal'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm truncate pr-2 ${notif.isRead ? 'text-gray-700' : 'font-bold text-gray-900'}`}>{notif.title}</p>
                          <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{formatDateTime(notif.createdAt).split(',')[0]}</span>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                        {!notif.isRead && (
                          <button 
                            onClick={() => readMutation.mutate(notif._id)}
                            className="text-[10px] uppercase tracking-wider font-bold text-medstore-teal mt-2 hover:underline"
                            disabled={readMutation.isPending}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
