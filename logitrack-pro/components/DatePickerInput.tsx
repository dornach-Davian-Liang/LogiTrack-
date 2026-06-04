import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  max?: string; // ISO date string
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

/**
 * Enhanced Date Picker Component
 * - Displays dates in YYYY/MM/DD format
 * - Supports manual input with validation
 * - Includes calendar popup for selection
 * - Better UI/UX for date selection
 */
export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  max,
  disabled = false,
  placeholder = 'YYYY/MM/DD',
  label,
  required = false,
  error,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  /**
   * Convert Date object to ISO string using LOCAL time (not UTC)
   * This fixes timezone issues where selecting Jan 2 shows Jan 1
   */
  const getLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize display value when component mounts or value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateForDisplay(value));
      setCurrentMonth(new Date(value + 'T00:00:00'));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Auto close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  /**
   * Parse user input (YYYY/MM/DD format)
   */
  const parseInputDate = (input: string): string | null => {
    const normalized = input.trim();

    // Try parsing as YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
      const parts = normalized.split('/');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return getLocalISO(date); // YYYY-MM-DD
      }
    }

    // Try parsing as MM/DD/YYYY (backward compatibility)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
      const parts = normalized.split('/');
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return getLocalISO(date); // YYYY-MM-DD
      }
    }

    return null;
  };

  /**
   * Format ISO date (YYYY-MM-DD) for display (YYYY/MM/DD)
   */
  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${year}/${month}/${day}`;
  };

  /**
   * Handle manual input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    const parsed = parseInputDate(input);
    if (parsed) {
      // Validate against max date
      if (max && parsed > max) {
        return; // Don't update if it exceeds max
      }
      onChange(parsed);
      setCurrentMonth(new Date(parsed + 'T00:00:00'));
    }
  };

  /**
   * Handle calendar date selection
   */
  const handleCalendarSelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isoDate = getLocalISO(selected);

    if (max && isoDate > max) {
      return; // Don't select if it exceeds max
    }

    onChange(isoDate);
    setDisplayValue(formatDateForDisplay(isoDate));
    setShowCalendar(false);
  };

  /**
   * Navigate to previous month
   */
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  /**
   * Handle clear button
   */
  const handleClear = () => {
    setDisplayValue('');
    onChange('');
  };

  /**
   * Generate calendar days
   */
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days from previous month to fill the grid
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    let date = new Date(startDate);

    // Generate 6 rows of 7 days
    for (let i = 0; i < 42; i++) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative">
      {label && (
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${error ? 'text-red-600' : ''}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={calendarRef}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onClick={() => !disabled && setShowCalendar(true)}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
              } ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            <Calendar
              className={`absolute right-3 top-2.5 h-5 w-5 ${
                disabled ? 'text-gray-300' : 'text-gray-400 cursor-pointer'
              }`}
              onClick={() => !disabled && setShowCalendar(!showCalendar)}
            />
          </div>

          {displayValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 transition"
              title="Clear date"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Calendar Popup */}
        {showCalendar && !disabled && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-72">
            {/* Header with Month/Year and Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <span>←</span>
              </button>

              <h3 className="text-center font-semibold text-gray-800 flex-1">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <span>→</span>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-xs font-semibold text-gray-500 text-center h-6">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = day.getTime() === today.getTime();
                const isSelected = value === getLocalISO(day);
                const isDisabledDate = max && getLocalISO(day) > max;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isDisabledDate && handleCalendarSelect(day.getDate())}
                    disabled={isDisabledDate}
                    className={`h-8 text-sm rounded transition ${
                      !isCurrentMonth
                        ? 'text-gray-300 bg-transparent'
                        : isSelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : isToday
                            ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-300'
                            : isDisabledDate
                              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  const todayStr = getLocalISO(today);
                  if (!max || todayStr <= max) {
                    handleCalendarSelect(today.getDate());
                  }
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
