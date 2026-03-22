import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Match, AiInsight } from '../models/match.model';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  getPrediction(match: Match): Observable<AiInsight> {
    const seed = this.hash(`${match.homeTeam}-${match.awayTeam}-${match.id}`);
    const homeBias = match.isLive ? 8 : 3;
    const probability = 45 + (seed % 31) + homeBias;
    const boundedProbability = Math.max(52, Math.min(86, probability));
    const recommendation = boundedProbability >= 60 ? match.homeTeam : match.awayTeam;

    const explanation = recommendation === match.homeTeam
      ? `${match.homeTeam} tem melhor consistencia recente e melhor aproveitamento como mandante.`
      : `${match.awayTeam} mostra transicao ofensiva mais eficiente e cria mais chances fora de casa.`;

    return of({
      recommendation,
      probability: boundedProbability,
      explanation,
    });
  }

  private hash(value: string): number {
    return value.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
  }
}
