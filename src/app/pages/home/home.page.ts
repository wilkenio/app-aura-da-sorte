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
  footballOutline,
  sparklesOutline,
  personOutline,
  flameOutline,
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
  readonly leagues = ['Brasileirao Serie A', 'Serie B', 'Libertadores', 'Champions League'];

  private readonly selectedLeagueSubject = new BehaviorSubject<string>(this.leagues[0]);
  readonly selectedLeague$ = this.selectedLeagueSubject.asObservable();

  private readonly liveMatches$ = this.betsApiService.getLiveMatches().pipe(shareReplay(1));
  private readonly todayMatches$ = this.betsApiService.getTodayMatches().pipe(shareReplay(1));

  readonly vm$ = combineLatest([this.selectedLeague$, this.liveMatches$, this.todayMatches$]).pipe(
    map(([selectedLeague, liveMatches, todayMatches]) => ({
      selectedLeague,
      liveMatches: this.filterByLeague(liveMatches, selectedLeague),
      todayMatches: this.filterByLeague(todayMatches, selectedLeague),
    })),
  );

  constructor(
    private readonly betsApiService: BetsApiService,
    private readonly router: Router,
  ) {
    addIcons({ footballOutline, sparklesOutline, personOutline, flameOutline });
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
    if (league === 'Brasileirao Serie A') {
      return matches;
    }

    return matches.filter((match) => match.league.toLowerCase().includes(league.toLowerCase()));
  }
}
