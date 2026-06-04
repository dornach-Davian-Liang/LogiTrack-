import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  required?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultExpanded = false,
  badge,
  required = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-visible mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
              {badge}
            </span>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 py-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <div className="space-y-0">{children}</div>;
};
