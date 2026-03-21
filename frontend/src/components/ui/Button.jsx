import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  fullWidth = false,
  isLoading = false,
  ...props 
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-[#0D9488] hover:bg-[#0F766E] text-white focus:ring-[#0D9488]',
    secondary: 'bg-white border border-[#E5E3DE] hover:bg-gray-50 text-[#1A1D23] focus:ring-gray-200',
    danger: 'bg-[#EF4444] hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'text-[#6B7280] hover:text-[#1A1D23] hover:bg-gray-100 focus:ring-gray-200',
    ghostTeal: 'text-[#0D9488] border border-transparent hover:border-[#0D9488] hover:bg-teal-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `
    ${baseStyle}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button className={classes} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
