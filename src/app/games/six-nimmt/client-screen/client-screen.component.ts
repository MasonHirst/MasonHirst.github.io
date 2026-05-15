import { Component, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../six-nimmt.service';

@Component({
  selector: 'app-client-screen',
  templateUrl: './client-screen.component.html',
  styleUrls: ['./client-screen.component.css'],
})
export class ClientScreenComponent implements OnInit {
  readonly gameData = this.nimmtService.gameData;

  readonly player = computed(() => {
    return this.gameData()?.players[this.nimmtService.userToken] ?? null;
  });

  readonly view = computed(() => {
    const state = this.gameData()?.gameState;
    if (state === 'WAITING_FOR_PLAYERS') return 'waiting';
    if (state === 'GAME_REVIEW') return 'review';
    return 'cards';
  });

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const gameCode = this.route.snapshot.params['gameCode'];
    const playerName = localStorage.getItem('playerName') ?? 'Player';
    this.nimmtService.sendSocketMessage('join-game', { gameCode, playerName, isHost: false });
  }

  getTotalScore(): number {
    return this.nimmtService.getTotalScore(this.player());
  }
}
