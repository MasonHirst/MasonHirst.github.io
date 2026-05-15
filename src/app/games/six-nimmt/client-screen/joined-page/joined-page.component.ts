import { Component, computed } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-joined-page',
  templateUrl: './joined-page.component.html',
  styleUrls: ['./joined-page.component.css'],
})
export class JoinedPageComponent {
  readonly isFirst = computed(() => this.nimmtService.isFirstPlayer());
  readonly playerCount = computed(() =>
    Object.keys(this.nimmtService.gameData()?.players ?? {}).length,
  );
  readonly canStart = computed(() => this.playerCount() >= 2);

  constructor(private nimmtService: SixNimmtService) {}

  startGame() {
    this.nimmtService.sendSocketMessage('start-fresh-game', {});
  }
}
