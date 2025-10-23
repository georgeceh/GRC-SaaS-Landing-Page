import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  isInvalid?: boolean;
}

const Input: React.FC<InputProps> = ({ icon, isInvalid, ...props }) => {
  const baseClasses = `
    w-full px-5 py-3.5 rounded-xl border-2 bg-[#0d111c]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d111c]
    transition-colors
    disabled:bg-slate-700
    text-slate-200
    placeholder:text-slate-500
  `;

  const validationClasses = isInvalid
    ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
    : 'border-slate-700 focus:ring-green-500 focus:border-green-500';

  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`
          ${baseClasses}
          ${validationClasses}
          ${icon ? 'pl-12' : ''}
        `}
      />
    </div>
  );
};

export default Input;