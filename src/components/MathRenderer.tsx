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
  // Convert math notation to LaTeX
  const convertToLatex = (text: string): string => {
    return text
      // Handle fractions with parentheses: (a/6) → \frac{a}{6}
      .replace(/\(([^)]+)\/([^)]+)\)/g, '\\frac{$1}{$2}')
      // Handle simple fractions: a/6 → \frac{a}{6} (but be careful not to break URLs or dates)
      .replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)(?![a-zA-Z0-9])/g, '\\frac{$1}{$2}')
      // Exponents: x^2 → x^{2}
      .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}')
      .replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}')
      // Subscripts: x_2 → x_{2}
      .replace(/([a-zA-Z0-9\)])_([a-zA-Z0-9]+)/g, '$1_{$2}')
      .replace(/([a-zA-Z0-9\)])_\{([^}]+)\}/g, '$1_{$2}')
      // Square roots: sqrt(x) → \sqrt{x}
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      // Greek letters
      .replace(/\bpi\b/g, '\\pi')
      .replace(/\balpha\b/g, '\\alpha')
      .replace(/\bbeta\b/g, '\\beta')
      .replace(/\bgamma\b/g, '\\gamma')
      .replace(/\bdelta\b/g, '\\delta')
      .replace(/\btheta\b/g, '\\theta')
      // Math operators
      .replace(/\+\-/g, '\\pm')
      .replace(/<=/g, '\\leq')
      .replace(/>=/g, '\\geq')
      .replace(/!=/g, '\\neq')
      .replace(/degrees?/g, '^\\circ');
  };

  // Check if text contains math notation
  const containsMath = (text: string): boolean => {
    return /\([^)]*\/[^)]*\)|[a-zA-Z0-9]+\/[a-zA-Z0-9]+|[\^_]|sqrt\(|\\[a-zA-Z]+|\bpi\b|\balpha\b|\bbeta\b|\bgamma\b|\bdelta\b|\btheta\b|<=[>=]|!=/g.test(text);
  };

  // If no math notation detected, render as plain text
  if (!containsMath(children)) {
    return (
      <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {children}
      </span>
    );
  }

  try {
    // Split text into math and non-math parts
    const mathPattern = /(\([^)]*\/[^)]*\)|[a-zA-Z0-9]+\/[a-zA-Z0-9]+(?![a-zA-Z0-9])|[a-zA-Z0-9\)]+[\^_][a-zA-Z0-9{}]+|sqrt\([^)]+\)|\\[a-zA-Z]+|\bpi\b|\balpha\b|\bbeta\b|\bgamma\b|\bdelta\b|\btheta\b|<=[>=]|!=[>=]|\+\-|degrees?)/g;
    
    const parts = children.split(mathPattern);
    const mathMatches = children.match(mathPattern) || [];
    
    let mathIndex = 0;
    
    return (
      <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, index) => {
          // Odd indices are the captured math expressions
          if (index % 2 === 1) {
            const mathExpr = mathMatches[mathIndex++];
            if (mathExpr) {
              try {
                const latexExpr = convertToLatex(mathExpr);
                return <InlineMath key={index} math={latexExpr} />;
              } catch (error) {
                console.warn('Math rendering error for:', mathExpr, error);
                return <span key={index}>{mathExpr}</span>;
              }
            }
          }
          // Even indices are regular text - preserve exactly as typed
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  } catch (error) {
    console.warn('Math rendering error:', error);
    // Fallback to plain text with preserved spacing
    return (
      <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
        {children}
      </span>
    );
  }
};

export default MathRenderer;