import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * 可搜索的单选下拉组件
 * 支持按关键字过滤选项列表
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当前选中项的 label
  const selectedLabel = useMemo(() => {
    const opt = options.find(o => String(o.value) === String(value));
    return opt?.label || '';
  }, [options, value]);

  // 过滤选项
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const kw = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(kw));
  }, [options, search]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearch('');
      // 聚焦到搜索框
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('' as any);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display field */}
      <div
        onClick={handleInputClick}
        className={`mt-1 flex items-center w-full rounded-md border shadow-sm cursor-pointer min-h-[38px] px-3 py-1.5 text-sm
          ${disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 hover:border-indigo-400'}
          ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
      >
        <span className={`flex-1 truncate ${!selectedLabel ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedLabel || placeholder}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        <svg className="ml-1 w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value ? String(value) : ''}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1.5 px-2"
              autoFocus
            />
          </div>
          {/* Option list */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={String(opt.value)}
                  onClick={() => handleSelect(opt)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-indigo-50 hover:text-indigo-700
                    ${String(opt.value) === String(value) ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-gray-700'}`}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
