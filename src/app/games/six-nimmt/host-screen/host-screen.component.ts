import { Component, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../six-nimmt.service';

@Component({
  selector: 'app-host-screen',
  templateUrl: './host-screen.component.html',
  styleUrls: ['./host-screen.component.css'],
})
export class HostScreenComponent implements OnInit {
  readonly gameData = this.nimmtService.gameData;

  // Lock the view to 'table' while the animation queue is running so we never
  // switch away from GameTableComponent mid-animation.
  readonly view = computed(() => {
    if (this.nimmtService.isAnimating()) return 'table';
    const state = this.gameData()?.gameState;
    if (state === 'WAITING_FOR_PLAYERS') return 'join';
    if (state === 'GAME_REVIEW') return 'review';
    return 'table';
  });

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const gameCode = this.route.snapshot.params['gameCode'];
    this.nimmtService.sendSocketMessage('join-game', { gameCode, isHost: true });
  }
}
