'use client';

import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...rest }, ref) => (
  <textarea
    ref={ref}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${className}`}
    {...rest}
  />
));

Textarea.displayName = 'Textarea';
