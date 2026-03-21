import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#1A1D23] mb-1">{label}</label>}
      <input
        ref={ref}
        className={`w-full rounded-md border text-sm transition-colors
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#E5E3DE] focus:border-[#0D9488] focus:ring-[#0D9488]'}
          focus:ring-1 focus:outline-none px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
