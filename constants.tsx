
import { GameType, GameDefinition, BadgeRank } from './types';

export const GAMES: GameDefinition[] = [
  { id: '1', type: GameType.REACTION, description: 'Tap targets quickly', icon: '⚡' },
  { id: '2', type: GameType.MEMORY, description: 'Repeat color sequence', icon: '🧠' },
  { id: '3', type: GameType.MATH, description: 'Solve 5 problems', icon: '🔢' },
  { id: '4', type: GameType.AIM, description: 'Hit moving targets', icon: '🎯' },
  { id: '5', type: GameType.BALANCE, description: 'Drag slider to zone for 3s', icon: '⚖️' },
  { id: '6', type: GameType.COMBO, description: 'Tap rhythmically', icon: '🎵' },
  { id: '7', type: GameType.PATTERN, description: 'Swipe dots in order', icon: '✏️' },
  { id: '8', type: GameType.DODGE, description: 'Tap lanes to avoid blocks', icon: '🛡️' },
  { id: '9', type: GameType.SLIDER, description: 'Drag numbers into 1-5 order', icon: '↔️' },
  { id: '10', type: GameType.PUZZLE, description: 'Tap the matching icons', icon: '🧩' },
];

export const RANK_ORDER = [
  BadgeRank.KIDO,
  BadgeRank.SENIOR,
  BadgeRank.BEGINNER,
  BadgeRank.PRO,
  BadgeRank.LEGEND,
  BadgeRank.DEMONIC,
  BadgeRank.APOCALYPTIC
];

export const COLORS = {
  primary: '#f97316', // Orange-500
  secondary: '#3b82f6', // Blue-500
  success: '#22c55e', // Green-500
  error: '#ef4444', // Red-500
};
