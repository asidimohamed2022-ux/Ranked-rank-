
import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, UserStats, GameDefinition, BadgeRank, RANK_THRESHOLDS } from './types';
import { GAMES, RANK_ORDER } from './constants';
import BadgeDisplay from './components/BadgeDisplay';
import { GameEngine } from './components/GameEngine';

const STORAGE_KEY = 'ranked_mini_games_data_v3';

export const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      rp: 0,
      streak: 0,
      lastPlayed: null,
      dailyGamesPlayed: [],
      isRanked: false
    };
  });

  const [activeView, setActiveView] = useState<ViewType>('game');
  const [activeGame, setActiveGame] = useState<{ game: GameDefinition, ranked: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const now = new Date().toDateString();
    if (stats.lastPlayed !== now) {
      setStats(prev => {
        const lastDate = prev.lastPlayed ? new Date(prev.lastPlayed) : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const missedDay = lastDate && lastDate.toDateString() !== yesterday.toDateString();
        const rpPenalty = missedDay ? -10 : 0;
        const newStreak = missedDay ? 0 : prev.streak;

        return {
          ...prev,
          dailyGamesPlayed: [],
          lastPlayed: now,
          streak: newStreak,
          rp: Math.max(0, prev.rp + rpPenalty)
        };
      });
    }

    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [stats.lastPlayed]);

  const handleGameFinish = (earnedRP: number, mistakes: number) => {
    if (!activeGame) return;
    if (activeGame.ranked) {
      setStats(prev => {
        const newDaily = [...prev.dailyGamesPlayed, activeGame.game.id];
        let newRP = prev.rp + earnedRP;
        let newStreak = prev.streak;
        if (newDaily.length === 5) {
          newStreak += 1;
          if (newStreak % 365 === 0) newRP += 100;
          else if (newStreak % 30 === 0) newRP += 50;
          else if (newStreak % 7 === 0) newRP += 15;
        }
        return { ...prev, rp: newRP, dailyGamesPlayed: newDaily, streak: newStreak };
      });
    }
    setActiveGame(null);
  };

  const dailyRankedGames = useMemo(() => {
    const seed = stats.lastPlayed || new Date().toDateString();
    return [...GAMES].sort((a, b) => {
      const valA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const valB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (valA * seed.length) % 10 - (valB * seed.length) % 10;
    }).slice(0, 5);
  }, [stats.lastPlayed]);

  // Logic to determine current badge
  const currentRankIndex = [...RANK_ORDER].reverse().findIndex(rank => stats.rp >= RANK_THRESHOLDS[rank]);
  const currentRank = currentRankIndex === -1 ? BadgeRank.KIDO : RANK_ORDER[RANK_ORDER.length - 1 - currentRankIndex];

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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 space-y-10 z-[100]">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-8 border-orange-50 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
        </div>
        <h1 className="text-2xl font-black text-gray-900 uppercase">Preparing Games...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto bg-white relative">
      <main className="px-6 py-8">
        {activeView === 'game' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            <header className="space-y-1">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">MINI GAMES</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Train your skill daily</p>
            </header>

            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black uppercase tracking-widest">Daily Ranked</h2>
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black">
                  {stats.dailyGamesPlayed.length} / 5
                </div>
              </div>
              <div className="space-y-3">
                {dailyRankedGames.map((game, index) => {
                  const isPlayed = stats.dailyGamesPlayed.includes(game.id);
                  return (
                    <button
                      key={game.id}
                      disabled={isPlayed}
                      onClick={() => setActiveGame({ game, ranked: true })}
                      className={`w-full flex items-center p-5 rounded-[24px] border-2 transition-all ${
                        isPlayed ? 'bg-gray-50 opacity-40 border-transparent' : 'bg-white border-orange-100 shadow-sm active:scale-95'
                      }`}
                    >
                      <span className="text-3xl mr-5">{game.icon}</span>
                      <div className="flex-1 text-left">
                        <h3 className="font-black text-sm uppercase">Game {index + 1}: {game.type}</h3>
                      </div>
                      {isPlayed ? '✔️' : <div className="text-orange-500 font-black text-xs">PLAY</div>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black mb-5 uppercase tracking-widest">Training</h2>
              <div className="grid grid-cols-2 gap-4">
                {GAMES.map(game => (
                  <button key={game.id} onClick={() => setActiveGame({ game, ranked: false })} className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center gap-3 active:scale-95 transition-transform">
                    <span className="text-4xl">{game.icon}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{game.type}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === 'rank' && (
          <div className="space-y-12 animate-in fade-in duration-300 pb-12">
            <header className="text-center space-y-4">
              <h2 className="text-xl font-black uppercase tracking-[0.4em] text-gray-400">Progression</h2>
              <BadgeDisplay currentRP={stats.rp} size="lg" />
            </header>

            <section className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 ml-2">Badge Tiers</h2>
              <div className="space-y-4">
                {RANK_ORDER.map((rank) => {
                  const isUnlocked = stats.rp >= RANK_THRESHOLDS[rank];
                  const isCurrent = rank === currentRank;
                  const threshold = RANK_THRESHOLDS[rank];

                  return (
                    <div 
                      key={rank} 
                      className={`p-6 rounded-[32px] border-2 flex items-center gap-6 transition-all ${
                        isCurrent 
                          ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-100 shadow-lg' 
                          : isUnlocked 
                            ? 'border-orange-100 bg-white opacity-60' 
                            : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                        isUnlocked ? 'bg-white' : 'bg-gray-100'
                      }`}>
                        {isUnlocked ? getBadgeIcon(rank) : '❓'}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-black uppercase tracking-widest text-sm ${!isUnlocked && 'text-gray-300'}`}>
                          {isUnlocked ? rank : '❓ Locked Rank'}
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCurrent ? 'text-orange-500' : 'text-gray-400'}`}>
                          {isCurrent 
                            ? '✅ Current Badge' 
                            : isUnlocked 
                              ? '✅ Achieved' 
                              : `${threshold.toLocaleString()} RP needed`}
                        </p>
                      </div>

                      {isUnlocked && !isCurrent && (
                        <span className="text-orange-500 text-sm">✔️</span>
                      )}
                      {!isUnlocked && (
                        <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center text-[10px] font-black">🔒</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeView === 'streak' && (
          <div className="space-y-12 animate-in fade-in duration-300">
             <header className="text-center space-y-1">
              <h2 className="text-xl font-black uppercase tracking-[0.4em] text-gray-400">Consistency</h2>
            </header>
            <div className="bg-orange-500 p-12 rounded-[64px] text-white text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl -rotate-12 translate-x-12">🔥</div>
              <span className="text-8xl block mb-4 relative z-10">🔥</span>
              <h2 className="text-8xl font-black relative z-10 tabular-nums">{stats.streak}</h2>
              <p className="font-black uppercase tracking-[0.5em] text-[10px] opacity-80 relative z-10">Day Streak</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-[40px] text-center">
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Play every day to earn bonus RP!</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-24 safe-bottom z-50">
        {[
          { id: 'game', icon: '🎮' },
          { id: 'streak', icon: '🔥' },
          { id: 'rank', icon: '🏆' }
        ].map(v => (
          <button 
            key={v.id} 
            onClick={() => setActiveView(v.id as ViewType)} 
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${
              activeView === v.id ? 'text-orange-500' : 'text-gray-300'
            }`}
          >
            <span className="text-2xl">{v.icon}</span>
            <span className="font-black uppercase text-[8px] tracking-[0.3em]">{v.id}</span>
            {activeView === v.id && (
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 animate-bounce" />
            )}
          </button>
        ))}
      </nav>

      {activeGame && (
        <GameEngine game={activeGame.game} onFinish={handleGameFinish} onCancel={() => setActiveGame(null)} />
      )}
    </div>
  );
};
