import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline,
  personOutline,
} from 'ionicons/icons';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';

import { Match } from '../../core/models/match.model';
import { BetsApiService } from '../../core/services/bets-api.service';
import { MatchCardComponent } from '../../shared/components/match-card/match-card.component';

interface HomeViewModel {
  selectedLeague: string;
  liveMatches: Match[];
  todayMatches: Match[];
}

interface LeagueOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    MatchCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private readonly selectedLeagueSubject = new BehaviorSubject<string>('All');
  readonly selectedLeague$ = this.selectedLeagueSubject.asObservable();

  private readonly liveMatches$ = this.betsApiService.getLiveMatches().pipe(shareReplay(1));
  private readonly todayMatches$ = this.betsApiService.getTodayMatches().pipe(shareReplay(1));

  readonly vm$ = combineLatest([this.selectedLeague$, this.liveMatches$, this.todayMatches$]).pipe(
    map(([selectedLeague, liveMatches, todayMatches]) => {
      const allMatches = [...liveMatches, ...todayMatches];
      const leagueSet = new Set(allMatches.map(match => match.league));
      const leagues: LeagueOption[] = [
        { id: 'All', label: 'Todos' },
        ...Array.from(leagueSet).map(league => ({ id: league, label: league })),
      ];

      return {
        leagues,
        selectedLeague,
        liveMatches: this.filterByLeague(liveMatches, selectedLeague),
        todayMatches: this.filterByLeague(todayMatches, selectedLeague),
      };
    }),
  );

  constructor(
    private readonly betsApiService: BetsApiService,
    private readonly router: Router,
  ) {
    addIcons({ sparklesOutline, personOutline });
  }

  selectLeague(league: string): void {
    this.selectedLeagueSubject.next(league);
  }

  openMatchDetails(match: Match): void {
    this.router.navigate(['/match', match.id]);
  }

  generateAiTip(): void {
    this.router.navigate(['/tabs/stats']);
  }

  trackByMatchId(_: number, match: Match): string {
    return match.id;
  }

  private filterByLeague(matches: Match[], league: string): Match[] {
    if (league === 'All') {
      return matches;
    }

    const normalizedLeague = this.normalizeText(league);

    return matches.filter((match) => this.normalizeText(match.league).includes(normalizedLeague));
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
