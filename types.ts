
export enum BadgeRank {
  KIDO = 'Kido',
  SENIOR = 'Senior',
  BEGINNER = 'Beginner',
  PRO = 'Pro',
  LEGEND = 'Legend',
  DEMONIC = 'Demonic',
  APOCALYPTIC = 'Apocalyptic'
}

export const RANK_THRESHOLDS: Record<BadgeRank, number> = {
  [BadgeRank.KIDO]: 0,
  [BadgeRank.SENIOR]: 325,
  [BadgeRank.BEGINNER]: 825,
  [BadgeRank.PRO]: 1225,
  [BadgeRank.LEGEND]: 2425,
  [BadgeRank.DEMONIC]: 4825,
  [BadgeRank.APOCALYPTIC]: 9999
};

export enum GameType {
  REACTION = 'Reaction Tap',
  MEMORY = 'Memory Tiles',
  MATH = 'Quick Math',
  AIM = 'Aim & Shoot',
  BALANCE = 'Balance Slider',
  COMBO = 'Tap Combo',
  PATTERN = 'Trace Path',
  DODGE = 'Tap Dodge',
  SLIDER = 'Number Slider',
  PUZZLE = 'Quick Match'
}

export interface GameDefinition {
  id: string;
  type: GameType;
  description: string;
  icon: string;
}

export type ViewType = 'game' | 'streak' | 'rank';

export interface UserStats {
  rp: number;
  streak: number;
  lastPlayed: string | null;
  dailyGamesPlayed: string[]; 
  isRanked: boolean;
}
