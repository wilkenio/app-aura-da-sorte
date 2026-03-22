import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, switchMap, forkJoin } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Match, MatchScore } from '../models/match.model';
import { Odds } from '../models/odds.model';
import { ApiService } from './api.service';
import { AiService } from './ai.service';

interface BetsApiEvent {
  id?: string | number;
  time?: string | number;
  league?: { name?: string };
  league_name?: string;
  home?: { name?: string };
  away?: { name?: string };
  home_name?: string;
  away_name?: string;
  ss?: string;
  timer?: { tm?: number; ts?: number; tt?: string };
}

interface BetsApiResponse {
  results?: BetsApiEvent[];
}

interface MockDataResponse {
  matches: Match[];
  teams: Array<{ id: string; name: string }>;
  odds: Array<{ matchId: string } & Odds>;
}

@Injectable({
  providedIn: 'root',
})
export class BetsApiService {
  private readonly apiBaseUrl = environment.betsApiBaseUrl;

  constructor(
    private readonly apiService: ApiService,
    private readonly aiService: AiService,
    private readonly http: HttpClient,
  ) {}

  getLiveMatches(): Observable<Match[]> {
    if (environment.useMockData) {
      return this.loadMockMatches().pipe(map((matches) => matches.filter((match) => match.isLive)));
    }

    const url = `${this.apiBaseUrl}/v1/events/inplay`;
    const params = {
      token: environment.betsApiToken,
      sport_id: 1,
    };

    return this.apiService.get<BetsApiResponse>(url, params).pipe(
      map((response) => this.mapBetsApiMatches(response.results ?? [], true)),
      switchMap((matches) => this.attachPredictions(matches)),
      catchError(() => this.loadMockMatches().pipe(map((matches) => matches.filter((match) => match.isLive)))),
    );
  }

  getTodayMatches(): Observable<Match[]> {
    if (environment.useMockData) {
      return this.loadMockMatches().pipe(map((matches) => matches.filter((match) => !match.isLive)));
    }

    const url = `${this.apiBaseUrl}/v1/events/upcoming`;
    const params = {
      token: environment.betsApiToken,
      sport_id: 1,
      day: 'today',
    };

    return this.apiService.get<BetsApiResponse>(url, params).pipe(
      map((response) => this.mapBetsApiMatches(response.results ?? [], false)),
      switchMap((matches) => this.attachPredictions(matches)),
      catchError(() => this.loadMockMatches().pipe(map((matches) => matches.filter((match) => !match.isLive)))),
    );
  }

  getMatchById(matchId: string): Observable<Match | undefined> {
    return this.loadMockMatches().pipe(map((matches) => matches.find((match) => match.id === matchId)));
  }

  private loadMockMatches(): Observable<Match[]> {
    return this.http.get<MockDataResponse>('assets/mocks/matches.json').pipe(
      switchMap((mockData) => {
        const oddsMap = new Map(mockData.odds.map((odd) => [odd.matchId, odd]));
        const matchesWithOdds = mockData.matches.map((match) => ({
          ...match,
          odds: oddsMap.get(match.id)
            ? {
                home: oddsMap.get(match.id)!.home,
                draw: oddsMap.get(match.id)!.draw,
                away: oddsMap.get(match.id)!.away,
              }
            : match.odds,
        }));

        return this.attachPredictions(matchesWithOdds);
      }),
    );
  }

  private mapBetsApiMatches(events: BetsApiEvent[], isLive: boolean): Match[] {
    return events.map((event) => {
      const score = this.extractScore(event.ss);

      return {
        id: String(event.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        homeTeam: event.home?.name ?? event.home_name ?? 'Home Team',
        awayTeam: event.away?.name ?? event.away_name ?? 'Away Team',
        league: event.league?.name ?? event.league_name ?? 'Football',
        startTime: this.formatStartTime(event.time),
        isLive,
        score,
        statusLabel: isLive
          ? `Ao Vivo ${event.timer?.tm ?? ''}'`.trim()
          : this.formatStartTime(event.time),
      };
    });
  }

  private extractScore(scoreString?: string): MatchScore | undefined {
    if (!scoreString) {
      return undefined;
    }

    const [home, away] = scoreString.split('-').map((value) => Number.parseInt(value, 10));

    if (Number.isNaN(home) || Number.isNaN(away)) {
      return undefined;
    }

    return { home, away };
  }

  private formatStartTime(rawTime?: string | number): string {
    if (!rawTime) {
      return '--:--';
    }

    const date = new Date(Number(rawTime) * 1000);

    if (Number.isNaN(date.getTime())) {
      return String(rawTime);
    }

    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private attachPredictions(matches: Match[]): Observable<Match[]> {
    if (!matches.length) {
      return of(matches);
    }

    const predictionRequests = matches.map((match) =>
      this.aiService.getPrediction(match).pipe(
        map((prediction) => ({
          ...match,
          aiInsight: prediction,
        })),
      ),
    );

    return forkJoin(predictionRequests);
  }
}
