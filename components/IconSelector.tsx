

import React, { useMemo } from 'react';
import { TRIBE_ICONS } from '../constants';

interface IconSelectorProps {
  selectedIcon: string;
  onSelect: (iconKey: string) => void;
  usedIcons: string[];
}

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelect, usedIcons }) => {
    const availableIcons = useMemo(() => {
        return Object.entries(TRIBE_ICONS).filter(([key]) => !usedIcons.includes(key));
    }, [usedIcons]);

    if (availableIcons.length === 0) {
        return (
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Choose Your Tribe's Icon</label>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-center text-red-500 italic">All icons are currently in use.</p>
                </div>
            </div>
        )
    }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Choose Your Tribe's Icon</label>
      <div className="flex justify-center items-center flex-wrap gap-4 p-3 bg-slate-700/50 rounded-lg">
        {availableIcons.map(([key, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`w-16 h-16 flex items-center justify-center rounded-full transition-all duration-200 ${
              selectedIcon === key 
              ? 'bg-amber-600 text-white ring-2 ring-offset-2 ring-offset-slate-800 ring-amber-500' 
              : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
              {icon}
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconSelector;
