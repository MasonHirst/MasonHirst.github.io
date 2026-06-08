import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../six-nimmt.service';

@Component({
  selector: 'app-host-screen',
  templateUrl: './host-screen.component.html',
  styleUrls: ['./host-screen.component.css'],
})
export class HostScreenComponent implements OnInit {
  readonly gameData = this.nimmtService.gameData;
  readonly isAnimating = this.nimmtService.isAnimating;
  readonly lastReplay = this.nimmtService.lastReplay;
  readonly countdown = this.nimmtService.countdown;

  // Lock the view to 'table' while animating or while the host has not yet clicked
  // "View Round Results" after the final-round animation.
  readonly view = computed(() => {
    if (this.nimmtService.isAnimating()) return 'table';
    if (this.nimmtService.pendingReview()) return 'table';
    const state = this.gameData()?.gameState;
    if (state === 'WAITING_FOR_PLAYERS') return 'join';
    if (state === 'GAME_REVIEW') return 'review';
    return 'table';
  });

  // Replay modal open/close state — host-screen-local so it doesn't pollute the service.
  readonly replayOpen = signal(false);

  // Brief gate after a countdown finishes. The server emits `counting-down: null` and then
  // runs the stacking phase as two separate socket events — between them the client sees
  // `countdown === null && !isAnimating`, which would otherwise paint the replay button
  // for a frame. The gate suppresses the button until isAnimating takes over (success)
  // or this timer expires (e.g. the deselect-cancel race, where stacking never starts).
  private readonly countdownSettling = signal(false);
  private settlingTimer: any = null;
  private prevCountdown: number | null = null;

  // Replay button is shown only when:
  //  - There IS a previous round to replay
  //  - The game is currently in PICKING_CARDS (between rounds)
  //  - No animation is running
  //  - No countdown is currently ticking (otherwise the live game is mid-transition)
  //  - The brief countdown-to-stacking handoff window has settled
  //  - The modal isn't already open
  readonly canShowReplayButton = computed(() => {
    if (this.replayOpen()) return false;
    if (this.isAnimating()) return false;
    if (this.countdown() !== null) return false;
    if (this.countdownSettling()) return false;
    if (!this.lastReplay()) return false;
    const state = this.gameData()?.gameState;
    // Show between rounds (PICKING_CARDS) and after the final round while the
    // host is deciding whether to replay before proceeding to the review screen.
    return state === 'PICKING_CARDS' || this.nimmtService.pendingReview();
  });

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute,
  ) {
    // If the live game starts stacking while the replay modal is open, close it.
    // (Shouldn't happen under normal flow now that the server defers countdown while
    // host-busy, but stays as a safety net for any edge case where state changes.)
    effect(() => {
      if (this.isAnimating() && this.replayOpen()) {
        this.closeReplay();
      }
    }, { allowSignalWrites: true });

    // Detect the countdown's non-null → null transition and open the settling gate.
    // 700ms is generous for the server's stacking-sequence event to arrive after the
    // counting-down:null event; in practice they're tens of ms apart.
    effect(() => {
      const cd = this.countdown();
      if (cd === null && this.prevCountdown !== null) {
        this.countdownSettling.set(true);
        clearTimeout(this.settlingTimer);
        this.settlingTimer = setTimeout(() => this.countdownSettling.set(false), 700);
      }
      this.prevCountdown = cd;
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const gameCode = this.route.snapshot.params['gameCode'];
    this.nimmtService.sendSocketMessage('join-game', { gameCode, isHost: true });
  }

  openReplay() {
    if (!this.lastReplay()) return;
    // Tell the server to hold off on starting any countdown until the replay closes —
    // otherwise the 3-2-1 plays silently behind the replay overlay and the host
    // audience misses it.
    this.nimmtService.sendSocketMessage('host-busy', { busy: true });
    this.replayOpen.set(true);
  }

  closeReplay() {
    this.replayOpen.set(false);
    this.nimmtService.sendSocketMessage('host-busy', { busy: false });
  }
}
