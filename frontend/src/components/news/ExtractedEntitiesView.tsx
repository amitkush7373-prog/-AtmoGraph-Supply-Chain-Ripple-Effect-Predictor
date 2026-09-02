import React from 'react';
import { Tag, MapPin, Building, Package, Calendar, AlertOctagon } from 'lucide-react';
import { ExtractedEntity } from '../../types/news';

interface ExtractedEntitiesViewProps {
  entities: ExtractedEntity[];
}

const ENTITY_LABEL_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  GPE: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    icon: <MapPin className="w-3 h-3 mr-1 text-cyan-400" />,
  },
  LOC: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: <MapPin className="w-3 h-3 mr-1 text-blue-400" />,
  },
  FAC: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: <Building className="w-3 h-3 mr-1 text-emerald-400" />,
  },
  ORG: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: <Building className="w-3 h-3 mr-1 text-purple-400" />,
  },
  PRODUCT: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: <Package className="w-3 h-3 mr-1 text-rose-400" />,
  },
  EVENT: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    icon: <AlertOctagon className="w-3 h-3 mr-1 text-orange-400" />,
  },
  DATE: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: <Calendar className="w-3 h-3 mr-1 text-amber-400" />,
  },
};

export const ExtractedEntitiesView: React.FC<ExtractedEntitiesViewProps> = ({ entities }) => {
  if (entities.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 bg-dark-900/60 rounded-lg border border-slate-800">
        No named entities extracted by spaCy NER.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
        <Tag className="w-3.5 h-3.5 text-brand-400" />
        <span>Extracted Entities via spaCy ({entities.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {entities.map((ent, idx) => {
          const config = ENTITY_LABEL_COLORS[ent.label] || {
            bg: 'bg-slate-500/10',
            text: 'text-slate-300',
            border: 'border-slate-500/30',
            icon: <Tag className="w-3 h-3 mr-1" />,
          };

          return (
            <div
              key={`${ent.text}-${idx}`}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${config.bg} ${config.text} ${config.border} shadow-sm`}
            >
              {config.icon}
              <span className="font-semibold text-slate-100 mr-1.5">{ent.text}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-dark-900/80 rounded text-slate-400">
                {ent.label}
              </span>
              {ent.normalized !== ent.text.toLowerCase() && (
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono italic">
                  → {ent.normalized}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
