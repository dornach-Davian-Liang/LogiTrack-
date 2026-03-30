import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';

interface Option {
  value: string | number;
  label: string;
  searchText?: string; // 用于搜索的文本
}

interface VirtualizedMultiSelectProps {
  label: string;
  options: Option[];
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxSelections?: number;
  itemHeight?: number; // 每个选项的高度
  listHeight?: number; // 列表显示高度
  showCount?: boolean; // 是否显示数量徽章（默认false，显示具体名称）
  onSearch?: (searchTerm: string) => Promise<void>; // ✅ 新增：异步搜索回调
  isSearching?: boolean; // ✅ 新增：搜索加载状态
}

/**
 * 高性能虚拟化多选组件
 * - 支持 40,000+ 选项不卡顿
 * - 虚拟滚动只渲染可见项
 * - 实时搜索过滤
 * - 键盘导航支持
 */
export const VirtualizedMultiSelect: React.FC<VirtualizedMultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  disabled = false,
  required = false,
  maxSelections,
  itemHeight = 36,
  listHeight = 500,
  showCount = false,
  onSearch, // ✅ 新增
  isSearching = false, // ✅ 新增
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ 新增：防抖定时器

  // 过滤选项（使用 useMemo 优化性能）
  // ✅ 优化：将已选选项置顶
  const filteredOptions = useMemo(() => {
    let result = options;
    
    // 如果有搜索词，先过滤
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = options.filter(option => {
        const searchText = option.searchText || option.label;
        return searchText.toLowerCase().includes(search);
      });
    }
    
    // 将已选项排在前面
    return result.sort((a, b) => {
      const aSelected = value.some(v => String(v) === String(a.value));
      const bSelected = value.some(v => String(v) === String(b.value));
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0; // 保持原有顺序
    });
  }, [options, searchTerm, value]);

  // 获取已选择的选项标签
  const selectedLabels = useMemo(() => {
    return value
      .map(v => options.find(opt => String(opt.value) === String(v))?.label)
      .filter(Boolean)
      .join(', ');
  }, [value, options]);

  // 处理选项点击
  const handleOptionClick = useCallback((optionValue: string | number) => {
    // ✅ 修复：使用字符串比较确保类型匹配
    const isSelected = value.some(v => String(v) === String(optionValue));
    
    if (isSelected) {
      // 取消选择
      onChange(value.filter(v => String(v) !== String(optionValue)));
    } else {
      // 添加选择
      if (maxSelections && value.length >= maxSelections) {
        alert(`最多只能选择 ${maxSelections} 个港口`);
        return;
      }
      onChange([...value, optionValue]);
    }
  }, [value, onChange, maxSelections]);

  // 清除所有选择
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // 关闭下拉菜单时重置搜索
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(0);
  }, []);

  // 打开下拉菜单时聚焦搜索框 + 触发初始搜索
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    // 如果提供了 onSearch 且当前没有选项，自动触发初始加载
    if (onSearch && options.length === 0) {
      onSearch('');
    }
  }, [onSearch, options.length]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          Math.min(prev + 1, filteredOptions.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[focusedIndex]) {
          handleOptionClick(filteredOptions[focusedIndex].value);
        }
        break;
    }
  }, [isOpen, filteredOptions, focusedIndex, handleOpen, handleClose, handleOptionClick]);

  // 渲染单个选项行（虚拟滚动使用）
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const option = filteredOptions[index];
    // ✅ 修复：使用字符串比较确保类型匹配
    const isSelected = value.some(v => String(v) === String(option.value));
    const isFocused = index === focusedIndex;

    return (
      <div
        style={style}
        className={`
          px-3 py-2 cursor-pointer flex items-center gap-2
          ${isFocused ? 'bg-blue-100' : 'hover:bg-gray-100'}
          ${isSelected ? 'bg-blue-50 font-medium' : ''}
        `}
        onClick={() => handleOptionClick(option.value)}
        onMouseEnter={() => setFocusedIndex(index)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}} // 由外层 div onClick 处理
          className="w-4 h-4"
        />
        <span className="flex-1 text-sm truncate">{option.label}</span>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 标签 */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 选择框 */}
      <div
        className={`
          w-full min-h-[42px] px-3 py-2 border rounded-md cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        `}
        onClick={() => !disabled && (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            ) : showCount ? (
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  {value.length} 个港口已选择
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-700 truncate" title={selectedLabels}>
                {selectedLabels.length > 60 ? selectedLabels.substring(0, 60) + '...' : selectedLabels}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="清除所有选择"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 下拉选项列表 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const newSearchTerm = e.target.value;
                setSearchTerm(newSearchTerm);
                setFocusedIndex(0);
                
                // ✅ 如果提供了onSearch回调，使用防抖调用
                if (onSearch) {
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    onSearch(newSearchTerm);
                  }, 500); // 500ms防抖
                }
              }}
              placeholder="搜索港口..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>
                {isSearching ? '搜索中...' : (
                  <>
                    {filteredOptions.length} 个港口
                    {searchTerm && ` (从 ${options.length} 个中筛选)`}
                  </>
                )}
              </span>
              {value.length > 0 && (
                <span className="text-blue-600 font-medium">
                  已选 {value.length} 个
                </span>
              )}
            </div>
          </div>

          {/* 虚拟滚动列表 */}
          {filteredOptions.length > 0 ? (
            <List
                height={listHeight}
              itemCount={filteredOptions.length}
              itemSize={itemHeight}
              width="100%"
              className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            >
              {Row}
            </List>
          ) : (
            <div className="p-4 text-center text-gray-500">
              没有找到匹配的港口
            </div>
          )}

          {/* 底部操作栏 */}
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                已选择 {value.length} 个港口
                {maxSelections && ` (最多 ${maxSelections} 个)`}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                清除全部
              </button>
            </div>
          )}
        </div>
      )}

      {/* 选中的港口标签（详细显示） */}
      {value.length > 0 && !isOpen && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.slice(0, 10).map((v) => {
            const option = options.find(opt => opt.value === v);
            if (!option) return null;
            
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleOptionClick(v)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {value.length > 10 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
              +{value.length - 10} 更多...
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualizedMultiSelect;
