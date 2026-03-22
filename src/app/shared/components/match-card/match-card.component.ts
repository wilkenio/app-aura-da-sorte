import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonChip, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';

import { Match } from '../../../core/models/match.model';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonChip, IonIcon],
  templateUrl: './match-card.component.html',
  styleUrls: ['./match-card.component.scss'],
})
export class MatchCardComponent {
  @Input({ required: true }) match!: Match;
  @Input() compact = false;
  @Input() showAi = true;

  @Output() cardClick = new EventEmitter<Match>();

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  onCardClick(): void {
    this.cardClick.emit(this.match);
  }

  get aiText(): string {
    if (!this.match.aiInsight) {
      return 'IA analisando este confronto...';
    }

    return `IA recomenda: ${this.match.aiInsight.recommendation} (${this.match.aiInsight.probability}%)`;
  }
}
