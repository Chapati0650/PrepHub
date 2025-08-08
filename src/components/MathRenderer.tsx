import React from 'react';

interface MathRendererProps {
  children: string;
  className?: string;
  inline?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ 
  children, 
  className = '', 
  inline = false 
}) => {
  return (
    <div 
      className={`${className}`}
      style={{ whiteSpace: 'pre-wrap' }}
    >
      {children}
    </div>
  );
};

export default MathRenderer;