import React from 'react';
import { Database, Filter } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'filter' | 'database';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  message = 'No entities match the selected criteria.',
  actionText,
  onAction,
  icon = 'filter',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
      <div className="w-10 h-10 rounded-full bg-dark-600 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
        {icon === 'filter' ? <Filter className="w-5 h-5" /> : <Database className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-xs mb-4">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-dark-600 hover:bg-dark-500 text-slate-200 border border-slate-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
