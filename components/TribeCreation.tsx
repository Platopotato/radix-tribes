
import React, { useState, useMemo } from 'react';
import { TribeStats, User } from '../types';
import { MAX_STAT_POINTS, MIN_STAT_VALUE, TRIBE_ICONS } from '../constants';
import StatAllocator from './StatAllocator';
import IconSelector from './IconSelector';
import Card from './ui/Card';
import Button from './ui/Button';

type TribeCreationData = {
    playerName: string;
    tribeName: string;
    icon: string;
    stats: TribeStats;
};

interface TribeCreationProps {
  onTribeCreate: (tribe: TribeCreationData) => void;
  user: User;
  usedIcons: string[];
}

const TribeCreation: React.FC<TribeCreationProps> = ({ onTribeCreate, user, usedIcons }) => {
  const [playerName, setPlayerName] = useState(user.username);
  const [tribeName, setTribeName] = useState('');
  
  const getInitialIcon = () => {
    const allIcons = Object.keys(TRIBE_ICONS);
    const availableIcons = allIcons.filter(icon => !usedIcons.includes(icon));
    return availableIcons.length > 0 ? availableIcons[0] : (allIcons[0] || 'skull');
  };

  const [selectedIcon, setSelectedIcon] = useState<string>(getInitialIcon);
  const [stats, setStats] = useState<TribeStats>({
    charisma: MIN_STAT_VALUE,
    intelligence: MIN_STAT_VALUE,
    leadership: MIN_STAT_VALUE,
    strength: MIN_STAT_VALUE,
  });

  const totalPointsUsed = useMemo(() => {
    return Object.values(stats).reduce((sum, value) => sum + value, 0);
  }, [stats]);

  const remainingPoints = MAX_STAT_POINTS - totalPointsUsed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allIcons = Object.keys(TRIBE_ICONS);
    const availableIcons = allIcons.filter(icon => !usedIcons.includes(icon));
    if (availableIcons.length === 0) {
        alert('All available tribe icons are currently in use. Please contact the administrator.');
        return;
    }

    if (remainingPoints !== 0 || !playerName || !tribeName) {
      alert('Please fill out all fields and allocate all stat points.');
      return;
    }

    const newTribeData: TribeCreationData = {
      playerName,
      tribeName,
      icon: selectedIcon,
      stats,
    };
    onTribeCreate(newTribeData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
      <Card title="Found a New Tribe" className="max-w-2xl w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-slate-400 text-center">The old world is gone, {user.username}. Lead your survivors to a new dawn.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label htmlFor="tribeName" className="block text-sm font-medium text-slate-300 mb-1">Tribe Name</label>
              <input
                type="text"
                id="tribeName"
                value={tribeName}
                onChange={(e) => setTribeName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
          </div>

          <IconSelector selectedIcon={selectedIcon} onSelect={setSelectedIcon} usedIcons={usedIcons} />
          
          <StatAllocator stats={stats} setStats={setStats} remainingPoints={remainingPoints} />

          <Button type="submit" disabled={remainingPoints !== 0 || !playerName || !tribeName} className="w-full">
            Begin Survival
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default TribeCreation;
