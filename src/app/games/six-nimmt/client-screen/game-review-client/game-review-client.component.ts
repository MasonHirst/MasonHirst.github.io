import { Component, computed } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-review-client',
  templateUrl: './game-review-client.component.html',
  styleUrls: ['./game-review-client.component.css'],
})
export class GameReviewClientComponent {
  readonly isFirst = computed(() => this.nimmtService.isFirstPlayer());
  readonly playerCount = computed(() =>
    Object.keys(this.nimmtService.gameData()?.players ?? {}).length,
  );
  readonly canStart = computed(() => this.playerCount() >= 2);

  constructor(private nimmtService: SixNimmtService) {}

  nextRound() {
    this.nimmtService.sendSocketMessage('start-next-round', {});
  }
}
