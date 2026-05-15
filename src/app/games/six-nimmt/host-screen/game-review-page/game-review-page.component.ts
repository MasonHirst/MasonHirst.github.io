import { Component, computed } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-review-page',
  templateUrl: './game-review-page.component.html',
  styleUrls: ['./game-review-page.component.css'],
})
export class GameReviewPageComponent {
  readonly gameData = this.nimmtService.gameData;

  readonly players = computed(() => {
    return Object.values<any>(this.gameData()?.players ?? {}).sort(
      (a, b) => this.nimmtService.getTotalScore(a) - this.nimmtService.getTotalScore(b),
    );
  });

  readonly rounds = computed(() => {
    const p = this.players();
    if (!p.length) return [];
    return Array.from({ length: p[0].roundScores.length }, (_, i) => i);
  });

  readonly gameOver = computed(() =>
    this.players().some(p => this.nimmtService.getTotalScore(p) >= 66),
  );

  constructor(private nimmtService: SixNimmtService) {}

  getRoundScore(player: any, round: number): number {
    return (player.roundScores[round] ?? []).reduce((s: number, c: any) => s + c.bullHeads, 0);
  }

  getTotalScore(player: any): number {
    return this.nimmtService.getTotalScore(player);
  }

  startNextRound() {
    this.nimmtService.sendSocketMessage('start-next-round', {});
  }

  startFreshGame() {
    this.nimmtService.sendSocketMessage('start-fresh-game', {});
  }

  endGame() {
    this.nimmtService.sendSocketMessage('end-game', {});
    window.location.href = '/games/6-nimmt!';
  }
}
