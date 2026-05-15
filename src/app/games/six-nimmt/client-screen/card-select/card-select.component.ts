import { Component, computed } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-card-select',
  templateUrl: './card-select.component.html',
  styleUrls: ['./card-select.component.css'],
})
export class CardSelectComponent {
  readonly gameData = this.nimmtService.gameData;

  readonly player = computed(() =>
    this.gameData()?.players[this.nimmtService.userToken] ?? null,
  );

  readonly hand = computed(() => this.player()?.cards ?? []);

  readonly selectedCard = computed(() => this.player()?.selectedCard ?? null);

  readonly isPicking = computed(() => this.gameData()?.gameState === 'PICKING_CARDS');

  readonly needsToPickRow = computed(
    () => this.player()?.needsToPickRow && !this.player()?.cardIsStacked,
  );

  readonly stacks = computed(() => this.gameData()?.tableStacks ?? []);

  readonly roundScore = computed(() => this.nimmtService.getRoundScore(this.player()));

  constructor(private nimmtService: SixNimmtService) {}

  selectCard(card: any) {
    console.log('[CardSelect] selectCard — isPicking:', this.isPicking(), 'card:', card?.number);
    if (!this.isPicking()) return;
    this.nimmtService.sendSocketMessage('select-card', { card });
  }

  isSelected(card: any): boolean {
    return this.selectedCard()?.number === card.number;
  }
}
