import React from 'react';
import { Search, Layers, Shield, Globe, SlidersHorizontal } from 'lucide-react';
import { GraphFilters } from '../../types/graph';

interface FilterPanelProps {
  filters: GraphFilters;
  onFilterChange: (newFilters: Partial<GraphFilters>) => void;
  onReset: () => void;
}

const NODE_TYPES = [
  'ALL',
  'Supplier',
  'Manufacturer',
  'Port',
  'Warehouse',
  'Distributor',
  'Product',
];

const RISK_LEVELS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-dark-800 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center gap-3 text-xs z-10 flex-shrink-0">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search entity name, city, or port..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors text-xs font-medium"
        />
      </div>

      {/* Node Type Filter */}
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-500" /> Type:
        </span>
        <select
          value={filters.nodeType || 'ALL'}
          onChange={(e) => onFilterChange({ nodeType: e.target.value })}
          className="bg-dark-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-500 font-medium cursor-pointer"
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'ALL' ? 'All Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Risk Level Filter */}
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-slate-500" /> Risk:
        </span>
        <select
          value={filters.riskLevel || 'ALL'}
          onChange={(e) => onFilterChange({ riskLevel: e.target.value })}
          className="bg-dark-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-500 font-medium cursor-pointer"
        >
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {r === 'ALL' ? 'All Risks' : r}
            </option>
          ))}
        </select>
      </div>

      {/* Region / Country Input */}
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-slate-500" /> Country:
        </span>
        <input
          type="text"
          value={filters.country || ''}
          onChange={(e) => onFilterChange({ country: e.target.value || undefined })}
          placeholder="e.g. Netherlands, China"
          className="w-36 px-2.5 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs font-medium"
        />
      </div>

      {/* Node Limit Slider */}
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Limit:
        </span>
        <select
          value={filters.limit || 1000}
          onChange={(e) => onFilterChange({ limit: Number(e.target.value) })}
          className="bg-dark-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500 font-mono font-medium cursor-pointer"
        >
          <option value={250}>250</option>
          <option value={500}>500</option>
          <option value={1000}>1,000</option>
          <option value={2000}>2,000</option>
          <option value={3000}>3,000</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-200 hover:underline transition-all"
      >
        Clear Filters
      </button>
    </div>
  );
};
