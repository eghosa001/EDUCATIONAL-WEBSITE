'use client';

import { forwardRef } from 'react';

export const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...rest }, ref) => (
  <input ref={ref} className={`${inputClass} ${className}`} {...rest} />
));

Input.displayName = 'Input';
