
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameType, GameDefinition } from '../types';

interface GameEngineProps {
  game: GameDefinition;
  onFinish: (score: number, mistakes: number) => void;
  onCancel: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ game, onFinish, onCancel }) => {
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resultRP, setResultRP] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showResult = useCallback((finalScore: number, finalMistakes: number) => {
    setGameState('result');
    setIsTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setResultRP(finalScore);
  }, []);

  const addMistake = useCallback((reason?: string) => {
    setMistakes(prev => {
      const next = prev + 1;
      if (next >= 5) {
        showResult(0, 5);
      }
      return next;
    });
    setFeedback(reason || 'Mistake!');
    setTimeout(() => setFeedback(null), 800);
  }, [showResult]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(15);
    setMistakes(0);
    const autoStart = game.type !== GameType.MEMORY;
    setIsTimerActive(autoStart);
  };

  useEffect(() => {
    if (gameState === 'playing' && isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (game.type === GameType.DODGE || game.type === GameType.BALANCE) {
              // For balance, if we haven't finished, the result is based on current progress vs mistakes
              showResult(Math.max(0, 5 - mistakes), mistakes);
              return 0;
            }
            addMistake('Timeout!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isTimerActive, addMistake, game.type, showResult, mistakes]);

  const renderGameContent = () => {
    const commonProps = {
      onWin: (score?: number) => showResult(score ?? Math.max(1, 5 - mistakes), mistakes),
      onMistake: addMistake,
    };

    switch (game.type) {
      case GameType.REACTION:
        return <ReactionGame {...commonProps} />;
      case GameType.MATH:
        return <MathGame {...commonProps} />;
      case GameType.AIM:
        return <AimGame {...commonProps} />;
      case GameType.BALANCE:
        return <BalanceSlider {...commonProps} />;
      case GameType.COMBO:
        return <ComboGame {...commonProps} />;
      case GameType.MEMORY:
        return <MemoryGame {...commonProps} setTimerActive={setIsTimerActive} />;
      case GameType.DODGE:
        return <TapDodge onMistake={addMistake} />;
      case GameType.PUZZLE:
        return <QuickMatch {...commonProps} />;
      case GameType.SLIDER:
        return <NumberSlider {...commonProps} />;
      case GameType.PATTERN:
        return <TracePath {...commonProps} />;
      default:
        return <PlaceholderGame icon={game.icon} description={game.description} onWin={commonProps.onWin} />;
    }
  };

  if (gameState === 'result') {
    const isWin = resultRP > 0;
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-xl ${isWin ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
          {isWin ? '🎉' : '❌'}
        </div>
        <div className="text-center space-y-2">
          <h2 className={`text-4xl font-black ${isWin ? 'text-green-600' : 'text-red-600'}`}>
            {isWin ? 'VICTORY!' : 'FAILED'}
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest">
            {isWin ? `Earned ${resultRP} RP` : 'Scored 0 RP'}
          </p>
          <p className="text-xs text-gray-400 font-bold">Mistakes: {mistakes}/5</p>
        </div>
        <button 
          onClick={() => onFinish(resultRP, mistakes)}
          className={`w-full max-w-xs py-5 rounded-[32px] font-black text-xl shadow-lg transition-transform active:scale-95 ${isWin ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-gray-800 text-white shadow-gray-200'}`}
        >
          {isWin ? 'CONTINUE' : 'BACK TO MENU'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between border-b bg-white">
        <button onClick={onCancel} className="text-orange-600 font-black px-4 py-2 bg-orange-50 rounded-xl">EXIT</button>
        <div className="text-center">
          <h2 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">{game.type}</h2>
          <div className="flex gap-1.5 justify-center mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < mistakes ? 'bg-red-500' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTimerActive && gameState === 'playing' && (
            <span className="text-[10px] font-black text-blue-500 uppercase animate-pulse">PAUSED</span>
          )}
          <div className={`font-black text-xl w-12 text-right transition-colors ${!isTimerActive && gameState === 'playing' ? 'text-blue-500' : 'text-orange-500'}`}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-white">
        {feedback && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-red-500 font-black text-2xl animate-ping z-50 text-center w-full">
            {feedback}
          </div>
        )}
        {gameState === 'idle' ? (
          <div className="text-center space-y-8 p-6 w-full max-w-xs">
            <span className="text-9xl block drop-shadow-xl">{game.icon}</span>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-gray-900">{game.type}</h3>
              <p className="text-gray-400 font-bold uppercase tracking-tighter text-xs px-4">{game.description}</p>
            </div>
            <button 
              onClick={startGame}
              className="w-full bg-orange-500 text-white text-2xl py-6 rounded-[32px] font-black shadow-[0_12px_0_0_#ea580c] active:translate-y-2 active:shadow-[0_6px_0_0_#ea580c] transition-all"
            >
              START
            </button>
          </div>
        ) : renderGameContent()}
      </div>
    </div>
  );
};

// --- DODGE GAME ---
const TapDodge = ({ onMistake }: { onMistake: (r: string) => void }) => {
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState<{ id: number, lane: number, pos: number, hit: boolean }[]>([]);
  const nextId = useRef(0);
  const spawnTimer = useRef<number>(0);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      spawnTimer.current += 50;
      if (spawnTimer.current >= 700) { 
        const newLane = Math.floor(Math.random() * 3);
        setObstacles(prev => [...prev, { id: nextId.current++, lane: newLane, pos: -10, hit: false }]);
        spawnTimer.current = 0;
      }

      setObstacles(prev => {
        return prev.map(o => ({ ...o, pos: o.pos + 3.5 })).filter(o => {
          if (o.pos > 110) return false;
          if (!o.hit && o.pos > 80 && o.pos < 95 && o.lane === lane) {
            o.hit = true;
            onMistake('Hit Block!');
          }
          return true;
        });
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [lane, onMistake]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 select-none">
      <div className="flex-1 flex px-6 gap-2 relative overflow-hidden bg-slate-800">
        {[0, 1, 2].map(l => (
          <div key={l} onClick={() => setLane(l)} className={`flex-1 border-x border-slate-700/30 relative ${lane === l ? 'bg-slate-700/20' : ''}`}>
            {lane === l && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-14 h-14 bg-orange-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center z-10">
                <span className="text-2xl">👤</span>
              </div>
            )}
            {obstacles.filter(o => o.lane === l).map(o => (
              <div 
                key={o.id} 
                className={`absolute w-16 h-16 left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity ${o.hit ? 'opacity-20' : 'animate-pulse'}`} 
                style={{ top: `${o.pos}%` }}
              >
                <div className={`w-full h-full rounded-xl ${o.id % 2 === 0 ? 'bg-red-500 rounded-full' : 'bg-yellow-400 rotate-45'}`}>
                   <span className="text-white text-2xl font-black -rotate-45 block text-center mt-2">!</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="p-6 bg-slate-900 grid grid-cols-2 gap-4">
        <button onPointerDown={() => setLane(prev => Math.max(0, prev - 1))} className="bg-slate-800 text-white py-8 rounded-[32px] text-5xl font-black active:bg-orange-600 transition-all active:scale-95">←</button>
        <button onPointerDown={() => setLane(prev => Math.min(2, prev + 1))} className="bg-slate-800 text-white py-8 rounded-[32px] text-5xl font-black active:bg-orange-600 transition-all active:scale-95">→</button>
      </div>
    </div>
  );
};

// --- MEMORY TILES ---
const MemoryGame = ({ onWin, onMistake, setTimerActive }: { onWin: () => void; onMistake: (r: string) => void; setTimerActive: (a: boolean) => void }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [hasStartedTapping, setHasStartedTapping] = useState(false);

  const nextLevel = useCallback(() => {
    setIsShowing(true);
    setTimerActive(false); 
    setHasStartedTapping(false);
    
    const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(nextSeq);
    setUserInput([]);
    
    let i = 0;
    const interval = setInterval(() => {
      setActiveTile(nextSeq[i]);
      setTimeout(() => setActiveTile(null), 350);
      i++;
      if (i >= nextSeq.length) {
        clearInterval(interval);
        setTimeout(() => setIsShowing(false), 500);
      }
    }, 700);
  }, [sequence, setTimerActive]);

  useEffect(() => { if (sequence.length === 0) nextLevel(); }, [nextLevel, sequence.length]);

  const handleTileClick = (idx: number) => {
    if (isShowing) return;

    if (!hasStartedTapping) {
      setHasStartedTapping(true);
      setTimerActive(true); 
    }

    const nextInput = [...userInput, idx];
    setUserInput(nextInput);

    if (idx !== sequence[nextInput.length - 1]) {
      onMistake('Wrong Order!');
      setSequence([]);
      setTimerActive(false);
      setHasStartedTapping(false);
      return;
    }

    if (nextInput.length === sequence.length) {
      setTimerActive(false);
      if (sequence.length >= 5) {
        onWin();
      } else {
        setTimeout(() => nextLevel(), 600);
      }
    }
  };

  return (
    <div className="w-full max-w-xs flex flex-col items-center gap-10 bg-white">
      <div className="grid grid-cols-2 gap-6 w-full relative">
        {[0, 1, 2, 3].map(i => (
          <button 
            key={i} 
            onClick={() => handleTileClick(i)} 
            className={`h-36 rounded-[48px] border-[6px] transition-all relative ${
              activeTile === i ? 'bg-orange-500 border-orange-200 scale-105 z-20' : 'bg-gray-100 border-transparent'
            } active:bg-orange-200 active:scale-95`} 
          />
        ))}
      </div>
      <div className="text-center space-y-4">
        <div className={`p-4 rounded-3xl border-2 transition-colors ${isShowing ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
           <p className={`font-black uppercase text-xl ${isShowing ? 'text-blue-600' : 'text-orange-600'}`}>
            {isShowing ? 'Memorizing...' : hasStartedTapping ? 'Repeat!' : 'Start Level'}
           </p>
        </div>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
           Level {sequence.length} / 5
        </p>
      </div>
    </div>
  );
};

// --- BALANCE SLIDER ---
const BalanceSlider = ({ onWin, onMistake }: { onWin: (s?: number) => void; onMistake: (r: string) => void }) => {
  const [pos, setPos] = useState(50);
  const [target, setTarget] = useState(50);
  const [holdTime, setHoldTime] = useState(0); // Progress towards 3s goal
  const [outsideTime, setOutsideTime] = useState(0); // Consecutive time outside zone
  const lastPosRef = useRef(50);
  const velocityRef = useRef(1.4); // Faster movement
  const [trail, setTrail] = useState<number[]>([]);

  const BALL_RADIUS = 4;
  const ZONE_RADIUS = 12.5;
  const SAFE_MARGIN = ZONE_RADIUS - BALL_RADIUS; // Ball must be fully inside (8.5 unit diff)

  const isInside = Math.abs(pos - target) <= SAFE_MARGIN;

  useEffect(() => {
    // Target zone movement animation (faster than base)
    const moveLoop = setInterval(() => {
      setTarget(t => {
        let next = t + velocityRef.current;
        
        // Random slight speed variations for unpredictability
        if (Math.random() < 0.1) {
           const multiplier = (0.8 + Math.random() * 0.4); 
           velocityRef.current *= multiplier;
           // Keep speed within challenging but playable range
           if (Math.abs(velocityRef.current) > 2.8) velocityRef.current = Math.sign(velocityRef.current) * 2.8;
           if (Math.abs(velocityRef.current) < 1.2) velocityRef.current = Math.sign(velocityRef.current) * 1.2;
        }

        // Bounce back at boundaries
        if (next >= (100 - ZONE_RADIUS) || next <= ZONE_RADIUS) {
          velocityRef.current *= -1;
          next = t + velocityRef.current;
        }
        
        // Faint trail to help anticipation
        setTrail(prev => [next, ...prev.slice(0, 3)]);
        return next;
      });
    }, 16);

    // Gameplay check loop (runs every 100ms)
    const checkLoop = setInterval(() => {
      const distance = Math.abs(pos - target);
      const currentlyInside = distance <= SAFE_MARGIN;
      
      const speed = Math.abs(pos - lastPosRef.current);
      lastPosRef.current = pos;

      // Handle common mistakes
      if (speed > 25) {
        onMistake('Too Fast Adjust!');
      } else if (pos >= 98 || pos <= 2) {
        onMistake('Hit Edge!');
      }

      if (currentlyInside) {
        setOutsideTime(0); // Reset outside penalty counter
        setHoldTime(h => {
          const next = h + 100;
          if (next >= 3000) {
            // Victory reached. Final score is based on mistakes.
            onWin(); 
            return 3000;
          }
          return next;
        });
      } else {
        // Increment outside time counter for potential deductions
        setOutsideTime(o => {
          const next = o + 100;
          // Every 1.5 seconds outside deducts RP / counts as a mistake
          if (next >= 1500) {
             onMistake('Left zone too long!');
             return 0; // Reset counter after mistake triggered
          }
          return next;
        });
      }
    }, 100);

    return () => {
      clearInterval(moveLoop);
      clearInterval(checkLoop);
    };
  }, [pos, target, onWin, onMistake]);

  const progressText = `${(holdTime / 1000).toFixed(1)} / 3.0 s`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-10 bg-white select-none">
      <div className="text-center space-y-4">
        <div className={`text-6xl font-black tabular-nums transition-colors duration-200 ${isInside ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
          {progressText}
        </div>
        <div className="px-6 py-2 bg-gray-50 rounded-2xl border border-gray-100">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Cumulative Target</p>
        </div>
      </div>

      <div className="relative w-full h-48 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[52px] flex items-center px-4 overflow-hidden">
        {/* Trails for anticipation */}
        {trail.map((t, i) => (
          <div 
            key={i}
            className="absolute h-32 bg-orange-100/10 rounded-3xl pointer-events-none"
            style={{ 
              width: '25%', 
              left: `${t - 12.5}%`,
              opacity: (3 - i) / 10,
              transition: 'all 0.05s linear'
            }}
          />
        ))}

        {/* Dynamic Zone Area */}
        <div 
          className={`absolute h-40 rounded-[36px] border-[4px] shadow-xl transition-all duration-300 flex items-center justify-center ${
            isInside 
              ? 'bg-green-100/80 border-green-500 ring-4 ring-green-100' 
              : 'bg-red-50/50 border-red-300 opacity-60'
          }`} 
          style={{ width: '25%', left: `${target - 12.5}%` }}
        >
          {isInside && (
            <div className="text-green-600 text-xl font-black">ACTIVE</div>
          )}
        </div>
        
        {/* The Ball (Slider Thumb) */}
        <input 
          type="range" min="0" max="100" value={pos} 
          onChange={(e) => setPos(parseInt(e.target.value))}
          className={`w-full h-full appearance-none bg-transparent cursor-pointer z-30 
            [&::-webkit-slider-thumb]:w-14 [&::-webkit-slider-thumb]:h-14 
            [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-[4px] 
            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-2xl 
            [&::-webkit-slider-thumb]:active:scale-90 transition-transform 
            ${isInside ? '[&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:scale-110' : ''}`}
        />
      </div>

      <div className="text-center space-y-3 max-w-[240px]">
        <div className={`p-4 rounded-3xl border-2 transition-all duration-500 ${isInside ? 'bg-green-50 border-green-100 scale-105 shadow-md' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
          <p className={`font-black text-sm uppercase ${isInside ? 'text-green-600' : 'text-gray-400'}`}>
            {isInside ? '✅ Timer Running' : '❌ Timer Paused'}
          </p>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          The cumulative timer only runs when the ball is <span className="text-gray-900">fully inside</span> the moving green zone.
        </p>
      </div>
    </div>
  );
};

// --- QUICK MATCH ---
const QuickMatch = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const icons = ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨'];
  const [target, setTarget] = useState('');
  const [grid, setGrid] = useState<string[]>([]);
  const [solved, setSolved] = useState(0);

  const generate = useCallback(() => {
    const shuffled = [...icons].sort(() => Math.random() - 0.5);
    setGrid(shuffled);
    setTarget(shuffled[Math.floor(Math.random() * shuffled.length)]);
  }, []);

  useEffect(() => generate(), [generate]);

  const handleTap = (icon: string) => {
    if (icon === target) {
      setSolved(s => {
        if (s + 1 >= 5) onWin();
        else generate();
        return s + 1;
      });
    } else {
      onMistake('Wrong Match!');
      generate();
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 p-6 w-full max-w-xs">
      <div className="text-8xl bg-orange-50 w-32 h-32 flex items-center justify-center rounded-[40px] border-4 border-orange-100 shadow-inner">{target}</div>
      <div className="grid grid-cols-3 gap-3 w-full">
        {grid.map((icon, i) => (
          <button key={i} onClick={() => handleTap(icon)} className="aspect-square bg-white border-2 border-gray-100 rounded-[28px] text-4xl flex items-center justify-center active:scale-90 transition-all">{icon}</button>
        ))}
      </div>
    </div>
  );
};

// --- NUMBER SLIDER ---
const NumberSlider = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const [nums, setNums] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setNums([1, 2, 3, 4, 5].sort(() => Math.random() - 0.5));
  }, []);

  const handleTap = (idx: number) => {
    if (selected === null) setSelected(idx);
    else {
      if (selected === idx) { setSelected(null); return; }
      const newNums = [...nums];
      [newNums[selected], newNums[idx]] = [newNums[idx], newNums[selected]];
      setNums(newNums);
      setSelected(null);
      if (newNums.every((n, i) => n === i + 1)) onWin();
      else if (!(newNums[idx] === idx + 1 || newNums[selected] === selected + 1)) onMistake('Wrong Swap!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 w-full max-w-xs">
      {nums.map((n, i) => (
        <button key={i} onClick={() => handleTap(i)} className={`w-full py-6 rounded-[32px] text-5xl font-black border-4 transition-all ${selected === i ? 'bg-orange-500 text-white border-orange-200' : 'bg-gray-50 border-gray-100'}`}>{n}</button>
      ))}
    </div>
  );
};

// --- TRACE PATH ---
const TracePath = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const dots = [{ t: 20, l: 20 }, { t: 20, l: 80 }, { t: 80, l: 80 }, { t: 80, l: 20 }];
  const [progress, setProgress] = useState<number[]>([]);

  const handleDotEnter = (idx: number) => {
    if (progress.includes(idx)) return;
    if (idx === progress.length) {
      const next = [...progress, idx];
      setProgress(next);
      if (next.length === 4) onWin();
    } else {
      onMistake('Missed dot!');
      setProgress([]);
    }
  };

  return (
    <div className="w-80 h-80 relative bg-white rounded-[60px] border-4 border-dashed border-gray-100 shadow-inner overflow-hidden">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {progress.map((dotIdx, i) => i > 0 && <line key={i} x1={`${dots[progress[i-1]].l}%`} y1={`${dots[progress[i-1]].t}%`} x2={`${dots[dotIdx].l}%`} y2={`${dots[dotIdx].t}%`} stroke="#f97316" strokeWidth="12" strokeLinecap="round" />)}
      </svg>
      {dots.map((d, i) => (
        <div key={i} onPointerEnter={() => handleDotEnter(i)} className={`absolute w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-black transition-all ${progress.includes(i) ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-300'}`} style={{ top: `${d.t}%`, left: `${d.l}%`, transform: 'translate(-50%, -50%)' }}>{i + 1}</div>
      ))}
    </div>
  );
};

// --- REACTION GAME ---
const ReactionGame = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const [target, setTarget] = useState({ top: '50%', left: '50%' });
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawn = useCallback(() => {
    setActive(false);
    timer.current = setTimeout(() => {
      setTarget({ top: Math.random()*60+20+'%', left: Math.random()*60+20+'%' });
      setActive(true);
    }, Math.random()*1500+500);
  }, []);

  useEffect(() => { spawn(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [spawn]);

  const tap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!active) { onMistake('Too Early!'); spawn(); return; }
    setCount(c => { if (c + 1 >= 5) onWin(); else spawn(); return c + 1; });
  };

  return (
    <div className="w-full h-full relative bg-gray-50" onClick={() => onMistake('Missed!')}>
      {active && <div onClick={tap} className="absolute w-28 h-28 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white animate-in zoom-in text-white font-black" style={{ top: target.top, left: target.left, transform: 'translate(-50%, -50%)' }}>TAP!</div>}
    </div>
  );
};

// --- MATH GAME ---
const MathGame = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const [prob, setProb] = useState({ q: '', a: 0 });
  const [opts, setOpts] = useState<number[]>([]);
  const [count, setCount] = useState(0);

  const generate = useCallback(() => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        ans = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * a) + 1;
        ans = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        ans = a * b;
        break;
      case '÷':
      default:
        ans = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        a = ans * b; // Guarantees clean integer result
        break;
    }

    const s = new Set([ans]); 
    while (s.size < 4) s.add(ans + (Math.floor(Math.random() * 10) - 5));
    
    setProb({ q: `${a} ${op} ${b}`, a: ans }); 
    setOpts(Array.from(s).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => generate(), [generate]);

  const tap = (c: number) => {
    if (c === prob.a) {
      const nextCount = count + 1;
      setCount(nextCount);
      if (nextCount >= 5) onWin();
      else generate(); // Force new random problem generation immediately
    } else { 
      onMistake('Wrong Answer!'); 
      generate(); 
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 p-6 w-full max-w-xs">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Problem {count + 1}/5</p>
        <div className="text-7xl font-black py-12 bg-gray-50 rounded-[48px] border-4 border-orange-100 w-full text-center shadow-inner text-gray-800">
          {prob.q}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full">
        {opts.map((o, i) => (
          <button 
            key={i} 
            onClick={() => tap(o)} 
            className="bg-white border-2 border-gray-100 py-8 rounded-[32px] text-4xl font-bold active:bg-orange-500 active:text-white transition-all shadow-sm active:scale-95"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- AIM GAME ---
const AimGame = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const [tgt, setTgt] = useState({ top: 50, left: 50 });
  const [hits, setHits] = useState(0);
  const move = useCallback(() => setTgt({ top: Math.random()*70+15, left: Math.random()*70+15 }), []);
  const tap = (e: React.MouseEvent) => { e.stopPropagation(); setHits(h => { if (h+1>=10) onWin(); else move(); return h+1; }); };
  return (
    <div className="w-full h-full relative bg-gray-50" onClick={() => onMistake('Missed!')}>
      <div onClick={tap} className="absolute w-20 h-20 bg-red-600 rounded-full border-[10px] border-white animate-pulse" style={{ top: tgt.top+'%', left: tgt.left+'%', transform: 'translate(-50%, -50%)' }} />
    </div>
  );
};

// --- COMBO GAME ---
const ComboGame = ({ onWin, onMistake }: { onWin: () => void; onMistake: (r: string) => void }) => {
  const [active, setActive] = useState(0), [streak, setStreak] = useState(0);
  const tap = (i: number) => { if (i === active) { setStreak(s => { if (s+1>=15) onWin(); return s+1; }); setActive(Math.floor(Math.random()*4)); } else { onMistake('Broke Combo!'); setStreak(0); } };
  return (
    <div className="w-full max-w-xs grid grid-cols-2 gap-6">
      {[0, 1, 2, 3].map(i => <button key={i} onClick={() => tap(i)} className={`h-36 rounded-[48px] border-[6px] transition-all ${active === i ? 'bg-orange-500 border-orange-200 scale-105' : 'bg-gray-100'}`} />)}
      <div className="col-span-2 text-center text-4xl font-black text-orange-500">Combo: {streak}</div>
    </div>
  );
};

const PlaceholderGame = ({ icon, description, onWin }: { icon: string, description: string, onWin: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center space-y-8 bg-white rounded-3xl">
    <div className="text-9xl animate-bounce">{icon}</div>
    <button onClick={onWin} className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-xl">COMPLETE</button>
  </div>
);
