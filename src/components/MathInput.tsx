import React from 'react';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your question...",
  className = "",
  label
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
        rows={4}
        placeholder={placeholder}
      />
    </div>
  );
};

export default MathInput;