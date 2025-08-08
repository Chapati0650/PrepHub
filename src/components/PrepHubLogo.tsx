import React from 'react';

interface PrepHubLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PrepHubLogo: React.FC<PrepHubLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span className={`font-bold ${sizeClasses[size]} ${className}`}>
      PrepHub
    </span>
  );
};

export default PrepHubLogo;