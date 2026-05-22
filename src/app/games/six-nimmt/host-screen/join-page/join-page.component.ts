import { Component, computed, signal } from '@angular/core';
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

  // Brief "Copied!" feedback after the host clicks the code block.
  readonly justCopied = signal(false);
  private copyResetTimer: any = null;

  constructor(private nimmtService: SixNimmtService) {}

  copyCode() {
    const code = this.gameData()?.code;
    if (!code) return;
    // Copy the full invite link so a friend can paste it into a browser and land
    // straight on the client screen — the client route handles prompting for a name
    // if they don't already have one saved locally.
    const link = `${location.origin}/games/6-nimmt!/client/${code}`;
    navigator.clipboard.writeText(link);

    this.justCopied.set(true);
    clearTimeout(this.copyResetTimer);
    this.copyResetTimer = setTimeout(() => this.justCopied.set(false), 1600);
  }

  kickPlayer(token: string) {
    this.nimmtService.sendSocketMessage('kick-player', { playerId: token });
  }

  startGame() {
    this.nimmtService.sendSocketMessage('start-fresh-game', {});
  }
}
