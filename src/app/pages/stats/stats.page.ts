import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
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
    this.statsService.getInsight(),
  ]).pipe(
    map(([stats, history, insight]) => ({
      stats,
      history,
      insight,
      insightHighlight: `${stats.winRate + 15}%`,
    })),
  );

  constructor(private readonly statsService: StatsService) {
    addIcons({
      trophyOutline,
      radioButtonOnOutline,
      flameOutline,
      trendingUpOutline,
      checkmarkOutline,
      closeOutline,
      sparklesOutline,
    });
  }

  trackByHistoryId(_: number, item: { id: string }): string {
    return item.id;
  }
}
