import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { BetHistoryItem, Stats } from '../models/stats.model';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  getStats(): Observable<Stats> {
    return of({
      favoriteTeam: 'Flamengo',
      winRate: 67,
      totalBets: 23,
      streak: 5,
    });
  }

  getHistory(): Observable<BetHistoryItem[]> {
    return of([
      { id: 'h1', fixture: 'Flamengo x Palmeiras', betType: 'Flamengo', odds: 2.1, result: 'win' },
      { id: 'h2', fixture: 'Corinthians x Gremio', betType: 'Empate', odds: 3.4, result: 'loss' },
      { id: 'h3', fixture: 'Internacional x Vasco', betType: 'Internacional', odds: 1.75, result: 'win' },
      { id: 'h4', fixture: 'Santos x Botafogo', betType: 'Ambas Marcam', odds: 1.9, result: 'win' },
      { id: 'h5', fixture: 'Atletico-MG x Cruzeiro', betType: 'Atletico-MG', odds: 2.4, result: 'loss' },
    ]);
  }

  getInsight(): Observable<string> {
    return of('Voce acerta 82% das apostas em jogos do Flamengo como mandante. Continue focando nesse padrao.');
  }
}
