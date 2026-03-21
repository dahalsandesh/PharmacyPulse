import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, Building2, Mail, Shield, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

const Profile = () => {
  const { user } = useAuthStore();
  
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 md:p-8 rounded-xl border border-medstore-border card-shadow mt-2 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center text-medstore-teal shrink-0 shadow-sm relative">
          <span className="text-4xl font-bold uppercase">{user.name?.charAt(0) || 'U'}</span>
          <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
            <ShieldCheck size={16} className={user.role === 'superadmin' ? 'text-purple-600' : 'text-medstore-teal'} />
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center text-gray-500 mt-1">
                <Mail size={16} className="mr-2 shrink-0" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge color={user.role === 'superadmin' ? 'purple' : 'teal'} className="uppercase tracking-wider px-3 py-1">
                {user.role}
              </Badge>
              {user.isActive && <Badge color="green" className="uppercase tracking-wider px-3 py-1">Active</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */ }
        <div className="bg-white p-6 rounded-xl border border-medstore-border card-shadow">
          <div className="flex items-center mb-5">
            <User className="text-gray-400 mr-3" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
          </div>
          
          <dl className="space-y-4 text-sm divide-y divide-gray-100">
            <div className="pt-2 flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-gray-500 font-medium w-1/3">Full Name</dt>
              <dd className="text-gray-900 mt-1 sm:mt-0 font-medium">{user.name}</dd>
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-gray-500 font-medium w-1/3">Email Address</dt>
              <dd className="text-gray-900 mt-1 sm:mt-0 font-medium">{user.email}</dd>
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-gray-500 font-medium w-1/3">System Role</dt>
              <dd className="text-gray-900 mt-1 sm:mt-0 font-medium capitalize">{user.role}</dd>
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-gray-500 font-medium w-1/3">Security</dt>
              <dd className="mt-1 sm:mt-0">
                <Button variant="outline" size="sm" className="h-8">Change Password</Button>
              </dd>
            </div>
          </dl>
        </div>

        {/* Pharmacy Details */ }
        {user.pharmacyId && (
          <div className="bg-white p-6 rounded-xl border border-medstore-border card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-0 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-5">
                <Building2 className="text-medstore-teal mr-3" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Organization Info</h2>
              </div>
              
              <dl className="space-y-4 text-sm divide-y divide-gray-100">
                <div className="pt-2 flex flex-col sm:flex-row sm:justify-between">
                  <dt className="text-gray-500 font-medium w-1/3">Pharmacy Name</dt>
                  <dd className="text-gray-900 mt-1 sm:mt-0 font-medium">{user.pharmacyId.name}</dd>
                </div>
                <div className="pt-3 flex flex-col sm:flex-row justify-between">
                  <dt className="flex items-center text-gray-500 font-medium"><MapPin size={14} className="mr-2" /> Address</dt>
                  <dd className="text-gray-900 font-medium text-right sm:text-left">{user.pharmacyId.address || '—'}</dd>
                </div>
                <div className="pt-3 flex flex-col sm:flex-row justify-between">
                  <dt className="flex items-center text-gray-500 font-medium"><Phone size={14} className="mr-2" /> Phone</dt>
                  <dd className="text-gray-900 font-medium">{user.pharmacyId.phone || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
