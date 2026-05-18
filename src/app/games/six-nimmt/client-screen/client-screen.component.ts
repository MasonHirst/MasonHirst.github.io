import { Component, computed, OnInit, signal } from '@angular/core';
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

  // First-visit name prompt: shown when the client URL is opened directly via
  // an invite link and no nickname is saved in localStorage.
  readonly needsName = signal(false);
  nameInput = '';
  nameError = '';

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const saved = (localStorage.getItem('playerName') ?? '').trim();
    if (saved) {
      this.joinWithName(saved);
    } else {
      this.needsName.set(true);
    }
  }

  submitName() {
    const name = this.nameInput.trim();
    if (!name) return this.nameError = 'Please enter a player name.';
    if (name.length > 15) return this.nameError = 'Player name must be 15 characters or less.';
    localStorage.setItem('playerName', name);
    this.needsName.set(false);
    this.joinWithName(name);
  }

  private joinWithName(playerName: string) {
    const gameCode = this.route.snapshot.params['gameCode'];
    this.nimmtService.sendSocketMessage('join-game', { gameCode, playerName, isHost: false });
  }

  getTotalScore(): number {
    return this.nimmtService.getTotalScore(this.player());
  }
}
