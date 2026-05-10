import React from 'react';
import { ChevronDown } from 'lucide-react';

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string | number }[];
}

export const AppSelect: React.FC<AppSelectProps> = ({ options, className = '', ...props }) => {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`w-full appearance-none bg-stone-50 border border-stone-100 text-stone-700 rounded-[24px] py-4 pl-6 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-natural-primary/20 transition-all ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
        <ChevronDown size={18} />
      </div>
    </div>
  );
};
