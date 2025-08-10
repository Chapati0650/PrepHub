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
  // Much more selective math detection - only trigger on explicit math notation
  const containsMath = (text: string): boolean => {
    // Only consider it math if it has explicit math symbols or notation
    return /[\^_]|\\[a-zA-Z]+|sqrt\(|frac\{|\$.*\$|\\[()]/g.test(text);
  };

  // Convert only explicit math notation to LaTeX
  const convertToLatex = (text: string): string => {
    return text
      // Exponents: x^2 → x^{2}, but only when ^ is present
      .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}')
      // Subscripts: x_2 → x_{2}, but only when _ is present
      .replace(/([a-zA-Z0-9\)])\_{([a-zA-Z0-9]+)}/g, '$1_{$2}')
      // Fractions: a/b → \frac{a}{b} (for proper fraction display)
      .replace(/([a-zA-Z0-9\(\)\+\-\*]+)\/([a-zA-Z0-9\(\)\+\-\*]+)/g, '\\frac{$1}{$2}')
      // Square roots: sqrt(x) → \sqrt{x}
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      // Greek letters (only when standalone)
      .replace(/\bpi\b/g, '\\pi')
      .replace(/\balpha\b/g, '\\alpha')
      .replace(/\bbeta\b/g, '\\beta')
      .replace(/\bgamma\b/g, '\\gamma')
      .replace(/\bdelta\b/g, '\\delta')
      .replace(/\btheta\b/g, '\\theta')
      .replace(/\bsigma\b/g, '\\sigma')
      // Math operators
      .replace(/\+\-/g, '\\pm')
      .replace(/<=/g, '\\leq')
      .replace(/>=/g, '\\geq')
      .replace(/!=/g, '\\neq')
      .replace(/\binfinity\b/g, '\\infty')
      .replace(/degrees?/g, '^\\circ');
  };

  const hasMath = containsMath(children);

  // If no explicit math notation, render as plain text with preserved spacing
  if (!hasMath) {
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    );
  }

  // For text with math, split on explicit math delimiters or convert inline
  const processedText = convertToLatex(children);
  
  // Look for explicit math delimiters first
  if (processedText.includes('$') || processedText.includes('\\(')) {
    const parts = processedText.split(/(\$[^$]+\$|\\\([^)]+\\\))/);
    
    try {
      return (
        <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
          {parts.map((part, index) => {
            if (part.startsWith('$') && part.endsWith('$')) {
              return <InlineMath key={index} math={part.slice(1, -1)} />;
            } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
              return <InlineMath key={index} math={part.slice(2, -2)} />;
            } else {
              return <span key={index}>{part}</span>;
            }
          })}
        </div>
      );
    } catch (error) {
      console.warn('Math rendering error:', error);
      return <div className={className} style={{ whiteSpace: 'pre-wrap' }}>{children}</div>;
    }
  }

  // For inline math expressions (like x^2 in the middle of text)
  try {
    // Split text to identify math expressions vs regular text
    const mathPattern = /([a-zA-Z0-9]+[\^_][a-zA-Z0-9{}]+|sqrt\([^)]+\)|\\[a-zA-Z]+)/g;
    const parts = processedText.split(mathPattern);
    const matches = processedText.match(mathPattern) || [];
    
    let matchIndex = 0;
    
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, index) => {
          // Check if this part is a math expression
          if (index % 2 === 1) {
            const mathExpr = matches[matchIndex++];
            try {
              return <InlineMath key={index} math={mathExpr} />;
            } catch {
              return <span key={index}>{mathExpr}</span>;
            }
          } else {
            // Regular text - preserve exactly as is
            return <span key={index}>{part}</span>;
          }
        })}
      </div>
    );
  } catch (error) {
    console.warn('Math rendering error:', error);
    // Fallback to plain text with preserved spacing
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    );
  }
};

export default MathRenderer;