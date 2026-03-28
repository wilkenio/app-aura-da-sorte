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
import { forkJoin, map, switchMap } from 'rxjs';

import { ExtraMarkets, Odds } from '../../core/models/odds.model';
import { BetsApiService } from '../../core/services/bets-api.service';

interface ProximosMinutos {
  golProx10: number;
  escanteioProx5: number;
  cartaoProx10: number;
  substituicaoProx5: number;
  chuteGolProx3: number;
}

interface EstatisticasVivas {
  posseCasa: number;
  posseFora: number;
  golsCasa: number;
  golsFora: number;
}

interface MatchDetailsVm {
  event?: any; // BetsApiEventDetail
  odds: Odds;
  markets: ExtraMarkets;
  aiProbability: number;
  aiRecommendation: string;
  aiExplanation: string;
  aiNarrative: string;
  homeProbability: number;
  drawProbability: number;
  awayProbability: number;
  ambosMaramProb: number;
  maisGolsLinha: number;
  maisGolsProb: number;
  proximosMinutos: ProximosMinutos | null;
  estatisticasVivas: EstatisticasVivas | null;
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
    switchMap((id) =>
      forkJoin({
        event: this.betsApiService.getEventDetails(id),
        analysis: this.betsApiService.getMatchAnalysis(id),
      }),
    ),
    map(({ event, analysis }) => this.toViewModel(event, analysis)),
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

  private toViewModel(event?: any, analysis?: any): MatchDetailsVm {
    const odds = { home: 2.1, draw: 3.2, away: 3.1 };
    const bothTeamsScore = Number((1.55 + (odds.draw - 2.7) * 0.2).toFixed(2));

    const homeProbability: number = analysis?.resultado_final?.vencedor_casa_prob ?? 0;
    const awayProbability: number = analysis?.resultado_final?.vencedor_fora_prob ?? 0;
    const drawProbability: number = analysis?.resultado_final?.empate_prob ?? 0;

    const aiProbability = Math.max(homeProbability, awayProbability, drawProbability);
    const aiRecommendation =
      homeProbability >= awayProbability && homeProbability >= drawProbability
        ? (event?.home?.name ?? 'Mandante')
        : awayProbability >= drawProbability
          ? (event?.away?.name ?? 'Visitante')
          : 'Empate';

    const pm = analysis?.proximos_minutos;
    const ev = analysis?.estatisticas_ao_vivo;

    return {
      event,
      odds,
      markets: {
        doubleChance: Number((Math.min(1.45, odds.home - 0.75)).toFixed(2)),
        bothTeamsScore,
        over25: Number((1.95 + (odds.home - 2) * 0.1).toFixed(2)),
        under25: Number((1.7 + (odds.away - 3) * -0.08).toFixed(2)),
      },
      aiProbability: analysis ? Math.round(aiProbability) : 65,
      aiRecommendation: analysis ? aiRecommendation : (event?.home?.name ?? 'Mandante'),
      aiExplanation: analysis?.momentum?.texto ?? 'Analise indica maior consistencia do favorito em jogos recentes e bom rendimento no confronto direto.',
      aiNarrative: analysis?.narrativa_llm ?? '',
      homeProbability,
      drawProbability,
      awayProbability,
      ambosMaramProb: analysis?.resultado_final?.ambos_marcam_prob ?? 0,
      maisGolsLinha: analysis?.resultado_final?.mais_gols_linha ?? 0,
      maisGolsProb: analysis?.resultado_final?.mais_gols_prob ?? 0,
      proximosMinutos: pm ? {
        golProx10: pm.gol_prox_10_min,
        escanteioProx5: pm.escanteio_prox_5_min,
        cartaoProx10: pm.cartao_amarelo_prox_10_min,
        substituicaoProx5: pm.substituicao_prox_5_min,
        chuteGolProx3: pm.chute_gol_prox_3_min,
      } : null,
      estatisticasVivas: ev ? {
        posseCasa: ev.posse_casa,
        posseFora: ev.posse_fora,
        golsCasa: ev.gols_casa,
        golsFora: ev.gols_fora,
      } : null,
    };
  }
}
