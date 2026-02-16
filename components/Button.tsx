import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center px-6 py-3.5 rounded-full font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none tracking-tight";
  
  const variants = {
    primary: "bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_10px_30px_-5px_rgba(250,204,21,0.4)] active:scale-[0.97]",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md active:scale-[0.97]",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-[0.97]",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 animate-spin">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : icon ? (
        <span className="mr-2.5">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};