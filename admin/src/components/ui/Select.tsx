'use client';

import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', children, ...rest }, ref) => (
  <select
    ref={ref}
    className={`px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    {...rest}
  >
    {children}
  </select>
));

Select.displayName = 'Select';
