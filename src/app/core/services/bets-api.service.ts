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
  league?: { id?: string; name?: string; cc?: string };
  league_name?: string;
  home?: { name?: string; id?: string; image_id?: string; cc?: string };
  away?: { name?: string; id?: string; image_id?: string; cc?: string };
  home_name?: string;
  away_name?: string;
  ss?: string;
  timer?: { tm?: number; ts?: number; tt?: string; ta?: number; md?: number };
  scores?: { [key: string]: { home: string; away: string } };
  bet365_id?: string;
  stats?: { [key: string]: string[] };
  o_home?: { id?: string; name?: string; image_id?: string; cc?: string };
}

interface BetsApiResponse {
  results?: BetsApiEvent[];
}

interface AuraMatchAnalysis {
  status: string;
  match_id: string;
  momentum: {
    equipe_dominante: string;
    texto: string;
    valor: number;
  };
  estatisticas_ao_vivo: {
    posse_casa: number;
    posse_fora: number;
    gols_casa: number;
    gols_fora: number;
    ataque_casa: number;
    ataque_fora: number;
  };
  proximos_minutos: {
    gol_prox_10_min: number;
    escanteio_prox_5_min: number;
    cartao_amarelo_prox_10_min: number;
    substituicao_prox_5_min: number;
    falta_perigosa_prox_5_min: number;
    chute_gol_prox_3_min: number;
  };
  resultado_final: {
    vencedor_casa_prob: number;
    vencedor_fora_prob: number;
    empate_prob: number;
    ambos_marcam_prob: number;
    mais_gols_linha: number;
    mais_gols_prob: number;
  };
  narrativa_llm: string;
  signals: {
    x: number;
    y: number;
    ataques_perigosos_casa: number;
    escanteios_total: number;
  };
  timestamp: string;
}

interface BetsApiEventViewResponse {
  success: number;
  results: BetsApiEventDetail[];
}

interface BetsApiEventDetail extends BetsApiEvent {
  sport_id?: string;
  time_status?: string;
  ss?: string;
  timer?: { tm?: number; ts?: number; tt?: string; ta?: number; md?: number };
  scores?: { [key: string]: { home: string; away: string } };
  stats?: { [key: string]: string[] };
  extra?: { length?: number; numberofperiods?: string; periodlength?: string };
  events?: { id: string; text: string }[];
  has_lineup?: number;
  inplay_created_at?: string;
  inplay_updated_at?: string;
  confirmed_at?: string;
  bet365_id?: string;
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
  private readonly auraBaseUrl = environment.auraApiBaseUrl;

  constructor(
    private readonly apiService: ApiService,
    private readonly aiService: AiService,
    private readonly http: HttpClient,
  ) {}

  getLiveMatches(): Observable<Match[]> {
    if (environment.useMockData) {
      return this.loadMockMatches().pipe(map((matches: Match[]) => matches.filter((match: Match) => match.isLive)));
    }

    const url = `${this.auraBaseUrl}/matches/inplay`;

    return this.apiService.get<BetsApiResponse>(url).pipe(
      map((response: BetsApiResponse) => this.mapBetsApiMatches(response.results ?? [], true)),
      switchMap((matches: Match[]) => this.attachPredictions(matches)),
      catchError(() => this.loadMockMatches().pipe(map((matches: Match[]) => matches.filter((match: Match) => match.isLive)))),
    );
  }

  getTodayMatches(): Observable<Match[]> {
    if (environment.useMockData) {
      return this.loadMockMatches().pipe(map((matches: Match[]) => matches.filter((match: Match) => !match.isLive)));
    }

    const url = `${this.auraBaseUrl}/matches/upcoming`;

    return this.apiService.get<BetsApiResponse>(url).pipe(
      map((response: BetsApiResponse) => this.mapBetsApiMatches(response.results ?? [], false)),
      switchMap((matches: Match[]) => this.attachPredictions(matches)),
      catchError(() => this.loadMockMatches().pipe(map((matches: Match[]) => matches.filter((match: Match) => !match.isLive)))),
    );
  }

  getMatchAnalysis(matchId: string): Observable<AuraMatchAnalysis | undefined> {
    const url = `${this.auraBaseUrl}/matches/analyze/${matchId}`;
    return this.apiService.get<AuraMatchAnalysis>(url).pipe(
      catchError(() => of(undefined)),
    );
  }

  getMatchById(matchId: string): Observable<Match | undefined> {
    return this.loadMockMatches().pipe(map((matches) => matches.find((match) => match.id === matchId)));
  }

  getEventDetails(eventId: string): Observable<BetsApiEventDetail | undefined> {
    const url = `${this.apiBaseUrl}/event/view`;
    const params = { token: environment.betsApiToken, event_id: eventId };
    return this.apiService.get<BetsApiEventViewResponse>(url, params).pipe(
      map((response) => response.results?.[0]),
      catchError(() => of(undefined)),
    );
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
    return events
      .filter((event) => event.league?.cc !== null) // Filtrar apenas jogos reais (cc não nulo)
      .map((event) => {
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
