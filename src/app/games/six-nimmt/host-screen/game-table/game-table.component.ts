import {
  Component,
  computed,
  effect,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
})
export class GameTableComponent implements OnInit, OnDestroy {
  // ── Local display state (drives the template during animation) ──────────
  readonly localStacks = signal<any[][]>([]);
  readonly localPlayers = signal<Record<string, any>>({});
  // Token of the player whose card is currently being animated
  readonly activeToken = signal<string | null>(null);
  // Token/name of the player the stacking sequence is paused waiting on (pick-a-row)
  readonly pausedForToken = signal<string | null>(null);
  readonly pausedForName = signal<string | null>(null);
  // Whether to show player cards face-up (flips true just before stacking begins)
  readonly cardsRevealed = signal(false);
  // Card numbers whose flight animation has completed and are visually "settled" in their slot.
  // Used to keep the slot's dashed placeholder visible until the card actually arrives.
  readonly settledCards = signal<Set<number>>(new Set());

  readonly gameData = this.nimmtService.gameData;
  readonly isAnimating = this.nimmtService.isAnimating;

  readonly gameState = computed(() => this.gameData()?.gameState);

  readonly sortedPlayers = computed(() => {
    const players = Object.values<any>(this.localPlayers());
    if (this.gameState() === 'STACKING_CARDS' || this.isAnimating()) {
      return players.sort((a, b) => (a.selectedCard?.number ?? 0) - (b.selectedCard?.number ?? 0));
    }
    return players.sort(
      (a, b) => this.nimmtService.getTotalScore(a) - this.nimmtService.getTotalScore(b),
    );
  });

  private subs = new Subscription();
  private pendingFinalState: any = null;
  private pendingPausedPlayer: any = null;
  private moveQueue: any[] = [];

  constructor(private nimmtService: SixNimmtService) {
    // Keep local display state in sync with live gameData when not animating.
    // allowSignalWrites is required in Angular 18 when an effect writes to signals.
    effect(() => {
      if (!this.isAnimating()) {
        const data = this.gameData();
        if (data) {
          this.localStacks.set(data.tableStacks ? data.tableStacks.map((s: any[]) => [...s]) : []);
          this.localPlayers.set({ ...data.players });
          this.cardsRevealed.set(data.gameState === 'STACKING_CARDS');
          // All currently-displayed cards are visually settled when no animation is running.
          const settled = new Set<number>();
          (data.tableStacks ?? []).forEach((s: any[]) =>
            s.forEach((c: any) => settled.add(c.number)),
          );
          this.settledCards.set(settled);
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.subs.add(
      this.nimmtService.stackingSequence$.subscribe(result => {
        // Capture current panel positions BEFORE startSequence writes signals that trigger
        // the sortedPlayers reorder, then FLIP-animate from old → new.
        this.flipPanelReorder();
        this.startSequence(result.moves, result.finalGameState, true, result.pausedForPlayer);
      }),
    );
    // Continuation: pick-a-row resolved — don't re-snapshot stale gameData, don't re-reveal cards
    this.subs.add(
      this.nimmtService.stackingContinuation$.subscribe(result => {
        this.startSequence(result.moves, result.finalGameState, false, result.pausedForPlayer);
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // ── Animation entry point ───────────────────────────────────────────────

  private startSequence(moves: any[], finalGameState: any, isFirst: boolean, pausedForPlayer: any) {
    this.pendingFinalState = finalGameState;
    this.moveQueue = [...moves];
    // Continuation arrived (or no pause this time) — clear any stale pause indicator
    // before processing the queue. Will be re-set in processNextMove if still paused.
    this.pausedForToken.set(null);
    this.pausedForName.set(null);
    this.pendingPausedPlayer = pausedForPlayer ?? null;

    if (isFirst) {
      // Snapshot live game state and run the card-reveal flip before processing
      const data = this.gameData();
      if (data) {
        this.localStacks.set(data.tableStacks.map((s: any[]) => [...s]));
        this.localPlayers.set(JSON.parse(JSON.stringify(data.players)));
        // Cards already on the table at sequence start are settled. Incoming cards
        // get added to this set only when their flight completes.
        const settled = new Set<number>();
        data.tableStacks.forEach((s: any[]) => s.forEach((c: any) => settled.add(c.number)));
        this.settledCards.set(settled);
      }
      this.cardsRevealed.set(false);
      setTimeout(() => {
        this.cardsRevealed.set(true);
        setTimeout(() => this.processNextMove(), 500);
      }, 200);
    } else {
      // Continuation after pick-a-row: local state is already mid-sequence, cards already revealed
      this.processNextMove();
    }
  }

  private processNextMove() {
    if (this.moveQueue.length === 0) {
      this.activeToken.set(null);
      // If paused waiting for a player to pick a row, keep animating flag true
      // until stacking-sequence-continuation arrives, and surface the indicator.
      if (this.pendingFinalState !== null) {
        // After the final round, hold on the table for a beat so the closing score popup
        // can finish playing and players can take in the result before the review screen
        // takes over. Mid-game transitions stay snappy.
        const isFinalRound = this.pendingFinalState?.gameState === 'GAME_REVIEW';
        const transitionDelay = isFinalRound ? 3000 : 0;

        // Mid-game: FLIP-animate the panels reordering back to score order.
        // Final round: skip the FLIP — the table view is about to unmount anyway.
        if (!isFinalRound) {
          this.flipPanelReorder();
        }

        const finalState = this.pendingFinalState;
        setTimeout(() => {
          this.nimmtService.finishAnimation(finalState);
          // Server uses this to kick off the next countdown when players were auto-selected
          // (1-card last round). For normal rounds nothing happens server-side.
          this.nimmtService.sendSocketMessage('animation-complete', {});
        }, transitionDelay);
      } else if (this.pendingPausedPlayer) {
        this.pausedForToken.set(this.pendingPausedPlayer.playerToken);
        this.pausedForName.set(this.pendingPausedPlayer.playerName);
      }
      return;
    }
    const move = this.moveQueue.shift();
    this.animateMove(move).then(() => this.processNextMove());
  }

  // ── Single-card animation ───────────────────────────────────────────────

  private animateMove(move: any): Promise<void> {
    return new Promise(resolve => {
      this.activeToken.set(move.playerToken);

      // 1. Capture source rect while card is still in the player slot
      const slotEl = document.getElementById(`player-slot-${move.playerToken}`);
      const fromRect = slotEl?.getBoundingClientRect() ?? null;

      // 2. Clone the old row cards NOW (before DOM update) for the sweep animation
      let sweepClones: HTMLElement[] = [];
      if (move.tookRow) {
        sweepClones = this.cloneStackCards(move.stackIndex);
      }

      // 3. Update display state: remove card from player slot, add to stack
      this.localPlayers.update(players => ({
        ...players,
        [move.playerToken]: { ...players[move.playerToken], selectedCard: null, cardIsStacked: true },
      }));
      this.localStacks.update(stacks => {
        const next = stacks.map(s => [...s]);
        next[move.stackIndex] = [move.card, ...( move.tookRow ? [] : next[move.stackIndex])];
        return next;
      });

      // 4. After Angular renders the card in its new stack position, GSAP FLIP it
      setTimeout(() => {
        const cardEl = document.getElementById(`card-${move.card.number}`);
        const flightDuration = 1.1;
        // Kick off the sweep while the played card is ~75% through its flight, so
        // the row-take "drain" visually overlaps with the new card settling in.
        const sweepStartDelayMs = move.tookRow ? flightDuration * 1000 * 0.75 : 0;

        // Start the sweep on a timer so it runs in parallel with the card flight.
        let sweepPromise: Promise<void> = Promise.resolve();
        if (move.tookRow) {
          sweepPromise = new Promise<void>(res => {
            setTimeout(() => {
              this.animateSweep(sweepClones, move).then(res);
            }, sweepStartDelayMs);
          });
        }

        const flightPromise = new Promise<void>(res => {
          if (cardEl && fromRect) {
            const toRect = cardEl.getBoundingClientRect();
            const dx = fromRect.left - toRect.left;
            const dy = fromRect.top - toRect.top;

            // Instantly position at source, then tween to destination
            gsap.set(cardEl, { x: dx, y: dy, zIndex: 100 });
            gsap.to(cardEl, {
              x: 0,
              y: 0,
              duration: flightDuration,
              ease: 'sine.inOut',
              onComplete: () => {
                gsap.set(cardEl, { clearProps: 'all' });
                // Card has visually arrived — slot can now drop its dashed placeholder.
                this.settledCards.update(prev => {
                  const next = new Set(prev);
                  next.add(move.card.number);
                  return next;
                });
                res();
              },
            });
          } else {
            res();
          }
        });

        Promise.all([flightPromise, sweepPromise]).then(() => {
          if (move.tookRow) {
            resolve();
          } else {
            // Pause between moves so the eye can track each card
            setTimeout(resolve, 100);
          }
        });
      }, 0);
    });
  }

  // ── Row-take sweep animation ────────────────────────────────────────────

  private cloneStackCards(stackIndex: number): HTMLElement[] {
    const stackEl = document.getElementById(`stack-row-${stackIndex}`);
    if (!stackEl) return [];
    const cardEls = stackEl.querySelectorAll<HTMLElement>('app-nimmt-card');
    const clones: HTMLElement[] = [];
    cardEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: '999',
        pointerEvents: 'none',
        margin: '0',
      });
      document.body.appendChild(clone);
      clones.push(clone);
    });
    return clones;
  }

  private animateSweep(clones: HTMLElement[], move: any): Promise<void> {
    return new Promise(resolve => {
      if (clones.length === 0) {
        this.flashScore(move);
        setTimeout(resolve, 400);
        return;
      }

      // Highlight the stack row briefly
      const stackEl = document.getElementById(`stack-row-${move.stackIndex}`);
      if (stackEl) {
        stackEl.classList.add('row-flash');
        setTimeout(() => stackEl.classList.remove('row-flash'), 600);
      }

      // Destination: the center of the player panel that took the row.
      const panelEl = document.getElementById(`player-panel-${move.playerToken}`);
      const panelRect = panelEl?.getBoundingClientRect();
      const targetX = panelRect ? panelRect.left + panelRect.width / 2 : -280;
      const targetY = panelRect ? panelRect.top + panelRect.height / 2 : 0;

      // Motion tween: each clone computes its own delta toward the panel center,
      // so the staggered group "scrunches" onto a single point. Uses sine.inOut to
      // match the flight easing — gentle ramp at both ends, no slam at the panel.
      const motionDuration = 1.0;
      const stagger = 0.07;

      gsap.to(clones, {
        x: (_i, el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return targetX - (r.left + r.width / 2);
        },
        y: (_i, el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return targetY - (r.top + r.height / 2);
        },
        scale: 0.18,
        rotation: (_i) => (Math.random() - 0.5) * 30,
        duration: motionDuration,
        stagger,
        ease: 'sine.inOut',
        onComplete: () => {
          clones.forEach(c => c.remove());
          this.flashScore(move);
          // Hold a beat after the popup appears before next move.
          setTimeout(resolve, 350);
        },
      });

      // Fade tween: held opaque for the first ~65% of the motion, then drops to 0
      // exactly as the clones arrive at the panel. Prevents the "faded before arrival" look.
      gsap.to(clones, {
        opacity: 0,
        duration: 0.4,
        delay: motionDuration * 0.6,
        stagger,
        ease: 'power1.in',
      });
    });
  }

  private flashScore(move: any) {
    this.nimmtService.showToast({
      playerName: move.playerName,
      takenRow: move.stackIndex,
      totalPoints: move.pointsEarned,
      quip: move.quip,
    });
    const panelEl = document.getElementById(`player-panel-${move.playerToken}`);
    if (!panelEl) return;

    panelEl.classList.add('score-flash');
    setTimeout(() => panelEl.classList.remove('score-flash'), 700);

    // Floating yellow "+N" that pops over the panel as the swept cards arrive.
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${move.pointsEarned}`;
    panelEl.appendChild(popup);

    gsap.fromTo(
      popup,
      { scale: 0.2, opacity: 0, y: 18, rotation: -8 },
      {
        scale: 1.5,
        opacity: 1,
        y: -14,
        rotation: 0,
        duration: 0.45,
        ease: 'back.out(2.2)',
        onComplete: () => {
          // Brief hover at full size before drifting up and fading
          gsap.to(popup, {
            opacity: 0,
            y: -56,
            scale: 1.2,
            duration: 0.7,
            delay: 0.7,
            ease: 'power2.in',
            onComplete: () => popup.remove(),
          });
        },
      },
    );
  }

  // ── Template helpers ────────────────────────────────────────────────────

  getRoundScore(player: any): number {
    return this.nimmtService.getRoundScore(player);
  }

  getTotalScore(player: any): number {
    return this.nimmtService.getTotalScore(player);
  }

  showGameState(): string {
    if (this.pausedForToken()) {
      return `Waiting for ${this.pausedForName()} to pick a row…`;
    }
    switch (this.gameState()) {
      case 'PICKING_CARDS': return 'Pick your cards!';
      case 'STACKING_CARDS': return 'Cards are in…';
      default: return '';
    }
  }

  stacksForDisplay(stack: any[]): any[] {
    return [...stack].reverse();
  }

  // Fixed 5 slots per row — the 6th card triggers a row take, so 5 is the visible cap.
  readonly slotIndices = [0, 1, 2, 3, 4];

  // Returns the card occupying slot `idx` (0 = oldest, 4 = newest), or null if empty.
  getSlotCard(stack: any[], idx: number): any {
    return this.stacksForDisplay(stack)[idx] ?? null;
  }

  // True only once a card has visually arrived (flight tween completed). Lets the slot
  // keep its dashed placeholder visible while the incoming card is mid-flight.
  isSlotSettled(stack: any[], idx: number): boolean {
    const card = this.getSlotCard(stack, idx);
    return !!card && this.settledCards().has(card.number);
  }

  // Track-by for the *ngFor over sortedPlayers — keeps the same DOM node per player
  // through reorders so the FLIP animation has stable elements to animate.
  trackByToken(_i: number, player: any): string {
    return player.userToken;
  }

  // FLIP-animate the player panels when their sort order changes. Records each panel's
  // current rect synchronously (before any signal write triggers the reorder), then on the
  // next tick reads the new rect, sets an inverse transform, and tweens it to zero.
  private flipPanelReorder() {
    const oldRects = new Map<string, DOMRect>();
    document
      .querySelectorAll<HTMLElement>('[id^="player-panel-"]')
      .forEach(el => {
        const token = el.id.replace('player-panel-', '');
        oldRects.set(token, el.getBoundingClientRect());
      });

    if (oldRects.size === 0) return;

    setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('[id^="player-panel-"]')
        .forEach(el => {
          const token = el.id.replace('player-panel-', '');
          const oldRect = oldRects.get(token);
          if (!oldRect) return;
          const newRect = el.getBoundingClientRect();
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

          gsap.set(el, { x: dx, y: dy });
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
          });
        });
    }, 0);
  }
}
