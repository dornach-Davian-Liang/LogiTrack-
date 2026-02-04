import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select...',
  label,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const handleToggle = (optionValue: string | number) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className="min-h-[38px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer bg-white hover:border-indigo-500 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(option.value, e)}
                  className="hover:text-indigo-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 ${
                    value.includes(option.value) ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(option.value);
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
