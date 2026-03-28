// ─── Enums / Literals ──────────────────────────────────────────────────────
 
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
 
export type FormResult = "W" | "D" | "L";
 
export type EventProbabilityIconType = "globe" | "flag" | "card";
 
// ─── Sub-types ─────────────────────────────────────────────────────────────
 
export interface Competition {
  id: string;
  name: string;
  season: number;
}
 
export interface Team {
  id: string;
  name: string;
  shortName: string;
  badgeUrl: string;
  primaryColor: string;
  secondaryColor: string;
}
 
export interface FullTimeOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
}
 
export interface Odds {
  provider: string;
  updatedAt: string; // ISO 8601
  fullTime: FullTimeOdds;
}
 
export interface WinProbability {
  home: number;  // 0–100 (%)
  draw: number;
  away: number;
}
 
export interface EventProbability {
  key: string;
  label: string;
  probability: number; // 0–100 (%)
  iconType: EventProbabilityIconType;
}
 
export interface TeamStats {
  attack: number;    // 0–100
  defense: number;
  momentum: number;
  possession: number; // 0–100 (%)
}
 
export interface Comparison {
  home: TeamStats;
  away: TeamStats;
}
 
export interface RecentForm {
  home: FormResult[];  // last 5 matches, most recent first
  away: FormResult[];
}
 
export interface AiAnalysis {
  favoredTeam: "home" | "away" | "draw";
  favoredTeamName: string;
  confidence: number; // 0–100 (%)
  summary: string;
}
 
// ─── Root ──────────────────────────────────────────────────────────────────
 
export interface Match {
  id: string;
  competition: Competition;
  status: MatchStatus;
  datetime: string; // ISO 8601 with timezone
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  winProbability: WinProbability;
  eventProbabilities: EventProbability[];
  comparison: Comparison;
  recentForm: RecentForm;
  aiAnalysis: AiAnalysis;
}
 
export interface MatchResponse {
  match: Match;
}