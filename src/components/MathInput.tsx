import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  showPreview?: boolean;
}

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your question...",
  className = "",
  label,
  showPreview = true
}) => {
  const [showMathPreview, setShowMathPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const mathExamples = [
    { input: 'x^2', description: 'Exponents' },
    { input: 'x_1', description: 'Subscripts' },
    { input: 'sqrt(x)', description: 'Square root' },
    { input: '3/4', description: 'Proper fractions' },
    { input: '(x+1)/(x-1)', description: 'Complex fractions' },
    { input: 'pi', description: 'Greek letters (pi, alpha, beta, etc.)' },
    { input: 'x <= 5', description: 'Less than or equal' },
    { input: 'x >= 3', description: 'Greater than or equal' },
    { input: 'x != 0', description: 'Not equal' },
    { input: '+-', description: 'Plus/minus' },
    { input: '90 degrees', description: 'Degree symbol' },
    { input: 'a/36', description: 'Simple fractions' }
  ];

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex items-center space-x-2">
            {showPreview && (
              <button
                type="button"
                onClick={() => setShowMathPreview(!showMathPreview)}
                className="flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showMathPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showMathPreview ? 'Hide' : 'Show'} Preview
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Math Help
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          rows={4}
          placeholder={placeholder}
        />

        {/* Math Preview */}
        {showPreview && showMathPreview && value.trim() && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Math Preview:</span>
            </div>
            <div className="bg-white p-3 rounded border">
              <MathRenderer>{value}</MathRenderer>
            </div>
          </div>
        )}

        {/* Math Help */}
        {showHelp && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Math Notation Guide:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {mathExamples.map((example, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <code className="text-blue-700 font-mono">{example.input}</code>
                  <span className="text-gray-600 text-right">{example.description}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <strong>Tips:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use ^ for exponents: x^2, x^{10}</li>
                <li>Use _ for subscripts: x_1, a_{n+1}</li>
                <li>Wrap complex expressions in {'{}'}: x^{2+3}</li>
                <li>Use parentheses for functions: sqrt(x+1)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathInput;