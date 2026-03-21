import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Pill, Lock, Mail } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      toast.success('Login successful');

      if (res.data.user.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="PharmacyPulse Logo" className="w-16 h-16" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#1A1D23]">
          PharmacyPulse
        </h2>
        <p className="mt-2 text-center text-sm text-[#6B7280]">
          Modern Pharmacy Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-[#E5E3DE]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  className={`pl-10 block w-full rounded-md border text-sm px-3 py-2 outline-none transition-colors
                    ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#E5E3DE] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]'}`}
                  placeholder="admin@medstore.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  className={`pl-10 block w-full rounded-md border text-sm px-3 py-2 outline-none transition-colors
                    ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#E5E3DE] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]'}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <Button type="submit" fullWidth isLoading={isLoading} className="h-11">
                Sign in
              </Button>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              Demo: ram@medstore.com / admin123
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
