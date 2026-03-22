export interface Stats {
  winRate: number;
  favoriteTeam: string;
  totalBets: number;
  streak: number;
}

export interface BetHistoryItem {
  id: string;
  fixture: string;
  betType: string;
  odds: number;
  result: 'win' | 'loss';
}
