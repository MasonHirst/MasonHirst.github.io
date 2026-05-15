import { Component, computed } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-join-page',
  templateUrl: './join-page.component.html',
  styleUrls: ['./join-page.component.css'],
})
export class JoinPageComponent {
  readonly gameData = this.nimmtService.gameData;
  readonly players = computed(() => Object.values<any>(this.gameData()?.players ?? {}));
  readonly canStart = computed(() => this.players().length >= 2);

  constructor(private nimmtService: SixNimmtService) {}

  copyCode() {
    const code = this.gameData()?.code;
    if (code) navigator.clipboard.writeText(code);
  }

  kickPlayer(token: string) {
    this.nimmtService.sendSocketMessage('kick-player', { playerId: token });
  }

  startGame() {
    this.nimmtService.sendSocketMessage('start-fresh-game', {});
  }
}
