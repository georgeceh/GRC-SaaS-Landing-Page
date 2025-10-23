import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-2xl overflow-hidden transition-all border border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;