import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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
  // Convert common math notation to LaTeX
  const convertToLatex = (text: string): string => {
    return text
      // Exponents: x^2 → x^{2}, x^10 → x^{10}
      .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}')
      // Subscripts: x_2 → x_{2}
      .replace(/([a-zA-Z0-9\)])\_{([a-zA-Z0-9]+)}/g, '$1_{$2}')
      // Fractions: 1/2 → \frac{1}{2} (only for simple cases)
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
      // Square roots: sqrt(x) → \sqrt{x}
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      // Absolute value: |x| → |x| (already correct)
      // Greek letters
      .replace(/\balpha\b/g, '\\alpha')
      .replace(/\bbeta\b/g, '\\beta')
      .replace(/\bgamma\b/g, '\\gamma')
      .replace(/\bdelta\b/g, '\\delta')
      .replace(/\btheta\b/g, '\\theta')
      .replace(/\bpi\b/g, '\\pi')
      .replace(/\bsigma\b/g, '\\sigma')
      // Infinity
      .replace(/\binfinity\b/g, '\\infty')
      // Plus/minus
      .replace(/\+\-/g, '\\pm')
      // Degree symbol
      .replace(/degrees?/g, '^\\circ')
      // Less than or equal to
      .replace(/<=/g, '\\leq')
      // Greater than or equal to
      .replace(/>=/g, '\\geq')
      // Not equal to
      .replace(/!=/g, '\\neq');
  };

  // Check if the text contains LaTeX or math symbols
  const containsMath = (text: string): boolean => {
    return /[\^_{}\\]|sqrt|frac|alpha|beta|gamma|delta|theta|pi|sigma|infty|pm|leq|geq|neq/.test(text);
  };

  const processedText = convertToLatex(children);
  const hasMath = containsMath(processedText);

  // If no math detected, render as plain text
  if (!hasMath) {
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'normal' }}>
        {children}
      </div>
    );
  }

  // Split text into math and non-math parts
  const parts = processedText.split(/(\$[^$]+\$|\\\([^)]+\\\))/);
  
  try {
    if (inline) {
      return (
        <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
          {parts.map((part, index) => {
            if (part.startsWith('$') && part.endsWith('$')) {
              return <InlineMath key={index} math={part.slice(1, -1)} />;
            } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
              return <InlineMath key={index} math={part.slice(2, -2)} />;
            } else {
              return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
            }
          })}
        </span>
      );
    }

    // For block math, try to render the entire text as LaTeX if it looks like math
    if (processedText.includes('^') || processedText.includes('_') || processedText.includes('\\')) {
      return (
        <div className={`${className} math-renderer`} style={{ whiteSpace: 'pre-wrap' }}>
          <InlineMath math={processedText} />
        </div>
      );
    }

    // Fallback to mixed rendering
    return (
      <div className={`${className} math-renderer`} style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, index) => {
          if (part.startsWith('$') && part.endsWith('$')) {
            return <BlockMath key={index} math={part.slice(1, -1)} />;
          } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
            return <InlineMath key={index} math={part.slice(2, -2)} />;
          } else {
            return <span key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'normal' }}>{part}</span>;
          }
        })}
      </div>
    );
  } catch (error) {
    console.warn('Math rendering error:', error);
    // Fallback to plain text if LaTeX fails
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'normal' }}>
        {children}
      </div>
    );
  }
};

export default MathRenderer;