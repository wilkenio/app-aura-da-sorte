import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldOutline, trendingUpOutline } from 'ionicons/icons';
import { map, switchMap } from 'rxjs';

import { Match } from '../../core/models/match.model';
import { ExtraMarkets, Odds } from '../../core/models/odds.model';
import { BetsApiService } from '../../core/services/bets-api.service';

interface MatchDetailsVm {
  match?: Match;
  odds: Odds;
  markets: ExtraMarkets;
  aiProbability: number;
  aiRecommendation: string;
  aiExplanation: string;
}

@Component({
  selector: 'app-match-details-page',
  standalone: true,
  imports: [
    CommonModule,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonProgressBar,
    IonToolbar,
  ],
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
})
export class MatchDetailsPage {
  readonly vm$ = this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((id) => this.betsApiService.getMatchById(id)),
    map((match) => this.toViewModel(match)),
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly betsApiService: BetsApiService,
  ) {
    addIcons({ shieldOutline, trendingUpOutline });
  }

  goBack(): void {
    this.router.navigate(['/tabs/home']);
  }

  private toViewModel(match?: Match): MatchDetailsVm {
    const odds = match?.odds ?? { home: 2.1, draw: 3.2, away: 3.1 };
    const bothTeamsScore = Number((1.55 + (odds.draw - 2.7) * 0.2).toFixed(2));

    return {
      match,
      odds,
      markets: {
        doubleChance: Number((Math.min(1.45, odds.home - 0.75)).toFixed(2)),
        bothTeamsScore,
        over25: Number((1.95 + (odds.home - 2) * 0.1).toFixed(2)),
        under25: Number((1.7 + (odds.away - 3) * -0.08).toFixed(2)),
      },
      aiProbability: match?.aiInsight?.probability ?? 65,
      aiRecommendation: match?.aiInsight?.recommendation ?? match?.homeTeam ?? 'Mandante',
      aiExplanation:
        match?.aiInsight?.explanation ??
        'Analise indica maior consistencia do favorito em jogos recentes e bom rendimento no confronto direto.',
    };
  }
}
