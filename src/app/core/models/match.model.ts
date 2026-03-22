import { Odds } from './odds.model';

export interface MatchScore {
  home: number;
  away: number;
}

export interface AiInsight {
  recommendation: string;
  probability: number;
  explanation: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  isLive: boolean;
  score?: MatchScore;
  odds?: Odds;
  statusLabel?: string;
  aiInsight?: AiInsight;
}
