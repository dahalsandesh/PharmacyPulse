import React from 'react';
import { getBadgeColor } from '@/utils/stockStatus';

export const Badge = ({ children, color = 'gray', className = '', ...props }) => {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(color)} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
