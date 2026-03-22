import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  trophyOutline,
  radioButtonOnOutline,
  flameOutline,
  trendingUpOutline,
  checkmarkOutline,
  closeOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { combineLatest, map } from 'rxjs';

import { StatsService } from '../../core/services/stats.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage {
  readonly vm$ = combineLatest([
    this.statsService.getStats(),
    this.statsService.getHistory(),
  ]).pipe(
    map(([stats, history]) => ({
      stats,
      history,
      insightLead: 'Voce acerta',
      insightHighlight: `${stats.winRate + 15}%`,
      insightTail: `das apostas em jogos do ${stats.favoriteTeam} como mandante. Continue focando nesse padrao!`,
    })),
  );

  constructor(
    private readonly statsService: StatsService,
    private readonly router: Router,
    private readonly location: Location,
  ) {
    addIcons({
      arrowBackOutline,
      trophyOutline,
      radioButtonOnOutline,
      flameOutline,
      trendingUpOutline,
      checkmarkOutline,
      closeOutline,
      sparklesOutline,
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/tabs/home');
  }

  trackByHistoryId(_: number, item: { id: string }): string {
    return item.id;
  }
}
