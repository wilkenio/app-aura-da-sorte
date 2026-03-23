import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonContent,
  IonIcon,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldOutline, trendingUpOutline } from 'ionicons/icons';
import { map, switchMap } from 'rxjs';

import { Match } from '../../core/models/match.model';
import { ExtraMarkets, Odds } from '../../core/models/odds.model';
import { BetsApiService } from '../../core/services/bets-api.service';

interface MatchDetailsVm {
  event?: any; // BetsApiEventDetail
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
    IonContent,
    IonIcon,
    IonProgressBar,
  ],
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
})
export class MatchDetailsPage {
  readonly vm$ = this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((id) => this.betsApiService.getEventDetails(id)),
    map((event) => this.toViewModel(event)),
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

  private toViewModel(event?: any): MatchDetailsVm {
    // For now, use mock odds since event details don't include odds
    const odds = { home: 2.1, draw: 3.2, away: 3.1 };
    const bothTeamsScore = Number((1.55 + (odds.draw - 2.7) * 0.2).toFixed(2));

    return {
      event,
      odds,
      markets: {
        doubleChance: Number((Math.min(1.45, odds.home - 0.75)).toFixed(2)),
        bothTeamsScore,
        over25: Number((1.95 + (odds.home - 2) * 0.1).toFixed(2)),
        under25: Number((1.7 + (odds.away - 3) * -0.08).toFixed(2)),
      },
      aiProbability: 65,
      aiRecommendation: event?.home?.name ?? 'Mandante',
      aiExplanation: 'Analise indica maior consistencia do favorito em jogos recentes e bom rendimento no confronto direto.',
    };
  }
}
