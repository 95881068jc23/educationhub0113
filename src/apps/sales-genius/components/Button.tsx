import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-700 shadow-md hover:shadow-lg",
    secondary: "bg-navy-700 text-white hover:bg-navy-600 focus:ring-navy-500 shadow-sm",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-navy-50 hover:text-navy-900 hover:border-navy-300 focus:ring-navy-500",
    ghost: "text-slate-600 hover:bg-navy-50 hover:text-navy-900 focus:ring-navy-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} active:scale-95 transition-all duration-200`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};