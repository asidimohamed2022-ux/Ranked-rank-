
import React from 'react';
import { BadgeRank, RANK_THRESHOLDS } from '../types';
import { RANK_ORDER } from '../constants';

interface BadgeDisplayProps {
  currentRP: number;
  size?: 'sm' | 'lg';
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ currentRP, size = 'lg' }) => {
  const currentRankIndex = [...RANK_ORDER].reverse().findIndex(rank => currentRP >= RANK_THRESHOLDS[rank]);
  const currentRank = currentRankIndex === -1 ? BadgeRank.KIDO : RANK_ORDER[RANK_ORDER.length - 1 - currentRankIndex];
  
  const nextRankIndex = RANK_ORDER.indexOf(currentRank) + 1;
  const nextRank = nextRankIndex < RANK_ORDER.length ? RANK_ORDER[nextRankIndex] : null;
  
  const minRP = RANK_THRESHOLDS[currentRank];
  const maxRP = nextRank ? RANK_THRESHOLDS[nextRank] : 15000;
  
  const progress = Math.min(100, Math.max(0, ((currentRP - minRP) / (maxRP - minRP)) * 100));
  const rpToNext = nextRank ? RANK_THRESHOLDS[nextRank] - currentRP : 0;

  const radius = size === 'lg' ? 45 : 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const svgSize = size === 'lg' ? 128 : 80;

  const getBadgeIcon = (rank: BadgeRank) => {
    switch (rank) {
      case BadgeRank.KIDO: return '🐣';
      case BadgeRank.SENIOR: return '🏹';
      case BadgeRank.BEGINNER: return '🛡️';
      case BadgeRank.PRO: return '⚔️';
      case BadgeRank.LEGEND: return '🏆';
      case BadgeRank.DEMONIC: return '🔥';
      case BadgeRank.APOCALYPTIC: return '👑';
      default: return '❓';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg className="absolute w-full h-full -rotate-90">
          <circle cx={svgSize/2} cy={svgSize/2} r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={size === 'lg' ? 8 : 4} />
          <circle
            cx={svgSize/2}
            cy={svgSize/2}
            r={radius}
            fill="transparent"
            stroke="#f97316"
            strokeWidth={size === 'lg' ? 8 : 4}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        <div className={`z-10 bg-white rounded-full p-2 shadow-xl border-2 border-orange-100 flex flex-col items-center justify-center ${size === 'lg' ? 'w-24 h-24' : 'w-14 h-14'}`}>
          <span className={size === 'lg' ? 'text-5xl' : 'text-3xl animate-pulse'}>
            {getBadgeIcon(currentRank)}
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        {size === 'lg' && (
          <div className="space-y-1">
            <p className="text-4xl font-black text-gray-900 tracking-tighter">{currentRP} RP</p>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Current Score</p>
          </div>
        )}
        {nextRank && (
          <div className="mt-4 px-6 py-2 bg-orange-50 rounded-2xl border border-orange-100">
             <p className={`${size === 'lg' ? 'text-xs' : 'text-[10px]'} text-orange-600 font-black uppercase tracking-widest`}>
              {rpToNext} RP left to unlock {size === 'lg' ? 'next rank' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeDisplay;
