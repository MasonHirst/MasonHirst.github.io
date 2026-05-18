import {
  AfterViewInit,
  Component,
  computed,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import gsap from 'gsap';

/**
 * Self-contained replay player. Renders its own table + player panels from a
 * captured snapshot and plays the moves queue using its own GSAP animation loop.
 * Does NOT touch the live game's signals, services, or DOM IDs — all element IDs
 * are prefixed with `replay-` so they cannot collide with the live game-table.
 */
@Component({
  selector: 'app-replay-modal',
  templateUrl: './replay-modal.component.html',
  styleUrls: ['./replay-modal.component.css'],
})
export class ReplayModalComponent implements AfterViewInit, OnDestroy {
  // Pre-stacking gameData snapshot: tableStacks + players (with selectedCard set)
  @Input() snapshot: any = null;
  // Ordered moves array — already stitched across pick-a-row continuations by the service
  @Input() moves: any[] = [];

  @Output() closed = new EventEmitter<void>();

  // Local display state — independent of the live game's localStacks/localPlayers
  readonly localStacks = signal<any[][]>([]);
  readonly localPlayers = signal<Record<string, any>>({});
  readonly activeToken = signal<string | null>(null);
  readonly cardsRevealed = signal(false);
  readonly settledCards = signal<Set<number>>(new Set());

  // Fixed slot count per stack row — matches the live game's 5-card cap
  readonly slotIndices = [0, 1, 2, 3, 4];

  // Players are displayed in card-played order. Order is captured once at startup (from
  // selectedCard.number in the snapshot) and held stable for the rest of the replay so
  // that tiles don't reshuffle as each player's selectedCard gets nulled out mid-flight.
  readonly sortedPlayers = computed(() => {
    const players = Object.values<any>(this.localPlayers());
    if (this.playOrderTokens.length) {
      const order = new Map(this.playOrderTokens.map((t, i) => [t, i] as const));
      return players.sort((a, b) => {
        const ai = order.get(a.userToken) ?? Number.MAX_SAFE_INTEGER;
        const bi = order.get(b.userToken) ?? Number.MAX_SAFE_INTEGER;
        return ai - bi;
      });
    }
    return players.sort(
      (a, b) => (a.selectedCard?.number ?? 0) - (b.selectedCard?.number ?? 0),
    );
  });

  private moveQueue: any[] = [];
  private cleanedUp = false;
  private pendingTimeouts: any[] = [];
  // Locked play order captured at modal mount — see sortedPlayers comment.
  private playOrderTokens: string[] = [];

  ngAfterViewInit() {
    // Seed local state from the snapshot. Snapshot's tableStacks + players are
    // exactly the state at the START of the round being replayed.
    if (!this.snapshot) {
      this.close();
      return;
    }
    this.localStacks.set(
      (this.snapshot.tableStacks ?? []).map((s: any[]) => [...s]),
    );
    this.localPlayers.set(
      JSON.parse(JSON.stringify(this.snapshot.players ?? {})),
    );
    // Lock the play order from the snapshot — every player still has selectedCard set
    // here, but they get nulled out as the replay animates each card to its stack.
    this.playOrderTokens = Object.values<any>(this.localPlayers())
      .filter((p: any) => p.selectedCard)
      .sort((a: any, b: any) => a.selectedCard.number - b.selectedCard.number)
      .map((p: any) => p.userToken);
    // Cards already on the table are visually settled from the start; incoming
    // played cards are added as their flights complete.
    const settled = new Set<number>();
    (this.snapshot.tableStacks ?? []).forEach((s: any[]) =>
      s.forEach((c: any) => settled.add(c.number)),
    );
    this.settledCards.set(settled);

    this.cardsRevealed.set(false);
    this.moveQueue = [...(this.moves ?? [])];

    // Brief "deal" pause, then flip cards face-up, then start the queue.
    this.scheduleTimeout(() => {
      if (this.cleanedUp) return;
      this.cardsRevealed.set(true);
      this.scheduleTimeout(() => this.processNextMove(), 1000);
    }, 200);
  }

  ngOnDestroy() {
    this.cleanedUp = true;
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];
    // Remove any orphaned sweep clones / popups that might linger if the modal
    // is closed mid-animation.
    document
      .querySelectorAll<HTMLElement>('.replay-sweep-clone')
      .forEach(el => el.remove());
  }

  close() {
    this.closed.emit();
  }

  // ── Animation loop ──────────────────────────────────────────────────────

  private processNextMove() {
    if (this.cleanedUp) return;
    if (this.moveQueue.length === 0) {
      this.activeToken.set(null);
      // Hold on the final frame so the closing "+N" popup (if any) finishes,
      // then emit closed. User can also close manually via the X button.
      this.scheduleTimeout(() => {
        if (!this.cleanedUp) this.close();
      }, 1800);
      return;
    }
    const move = this.moveQueue.shift();
    this.animateMove(move).then(() => this.processNextMove());
  }

  private animateMove(move: any): Promise<void> {
    return new Promise(resolve => {
      if (this.cleanedUp) {
        resolve();
        return;
      }
      this.activeToken.set(move.playerToken);

      // 1. Source rect — player slot in the REPLAY DOM
      const slotEl = document.getElementById(
        `replay-player-slot-${move.playerToken}`,
      );
      const fromRect = slotEl?.getBoundingClientRect() ?? null;

      // 2. Clone old row cards now for the sweep (before localStacks mutates them away)
      let sweepClones: HTMLElement[] = [];
      if (move.tookRow) {
        sweepClones = this.cloneStackCards(move.stackIndex);
      }

      // 3. Update display: clear played card from slot, push it onto stack
      this.localPlayers.update(players => ({
        ...players,
        [move.playerToken]: {
          ...players[move.playerToken],
          selectedCard: null,
          cardIsStacked: true,
        },
      }));
      this.localStacks.update(stacks => {
        const next = stacks.map(s => [...s]);
        next[move.stackIndex] = [
          move.card,
          ...(move.tookRow ? [] : next[move.stackIndex]),
        ];
        return next;
      });

      // 4. After Angular renders the card at its new stack location, FLIP it
      this.scheduleTimeout(() => {
        if (this.cleanedUp) {
          resolve();
          return;
        }
        const cardEl = document.getElementById(`replay-card-${move.card.number}`);
        const flightDuration = 1.1;
        const sweepStartDelayMs = move.tookRow
          ? flightDuration * 1000 * 0.75
          : 0;

        // Kick off the sweep in parallel (~75% through the flight)
        let sweepPromise: Promise<void> = Promise.resolve();
        if (move.tookRow) {
          sweepPromise = new Promise<void>(res => {
            this.scheduleTimeout(() => {
              if (this.cleanedUp) {
                res();
                return;
              }
              this.animateSweep(sweepClones, move).then(res);
            }, sweepStartDelayMs);
          });
        }

        const flightPromise = new Promise<void>(res => {
          if (cardEl && fromRect) {
            const toRect = cardEl.getBoundingClientRect();
            const dx = fromRect.left - toRect.left;
            const dy = fromRect.top - toRect.top;

            gsap.set(cardEl, { x: dx, y: dy, zIndex: 100 });
            gsap.to(cardEl, {
              x: 0,
              y: 0,
              duration: flightDuration,
              ease: 'sine.inOut',
              onComplete: () => {
                gsap.set(cardEl, { clearProps: 'all' });
                // Mark this card as settled so its slot drops the dashed outline
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
            // Brief pause between non-row moves so the eye can track each one
            this.scheduleTimeout(resolve, 400);
          }
        });
      }, 0);
    });
  }

  // ── Row-take sweep + "+N" popup ─────────────────────────────────────────

  private cloneStackCards(stackIndex: number): HTMLElement[] {
    const stackEl = document.getElementById(`replay-stack-row-${stackIndex}`);
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
        zIndex: '1010',
        pointerEvents: 'none',
        margin: '0',
      });
      clone.classList.add('replay-sweep-clone');
      document.body.appendChild(clone);
      clones.push(clone);
    });
    return clones;
  }

  private animateSweep(clones: HTMLElement[], move: any): Promise<void> {
    return new Promise(resolve => {
      if (this.cleanedUp || clones.length === 0) {
        this.flashScore(move);
        this.scheduleTimeout(resolve, 350);
        return;
      }

      // Flash the row briefly
      const stackEl = document.getElementById(
        `replay-stack-row-${move.stackIndex}`,
      );
      if (stackEl) {
        stackEl.classList.add('row-flash');
        this.scheduleTimeout(
          () => stackEl.classList.remove('row-flash'),
          600,
        );
      }

      const panelEl = document.getElementById(
        `replay-player-panel-${move.playerToken}`,
      );
      const panelRect = panelEl?.getBoundingClientRect();
      const targetX = panelRect ? panelRect.left + panelRect.width / 2 : -280;
      const targetY = panelRect ? panelRect.top + panelRect.height / 2 : 0;

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
        rotation: () => (Math.random() - 0.5) * 30,
        duration: motionDuration,
        stagger,
        ease: 'sine.inOut',
        onComplete: () => {
          clones.forEach(c => c.remove());
          this.flashScore(move);
          this.scheduleTimeout(resolve, 350);
        },
      });

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
    const panelEl = document.getElementById(
      `replay-player-panel-${move.playerToken}`,
    );
    if (!panelEl) return;

    panelEl.classList.add('score-flash');
    this.scheduleTimeout(
      () => panelEl.classList.remove('score-flash'),
      700,
    );

    // Body-appended position:fixed popup, coords computed from the panel's rect.
    // Decoupled from the panel so no parent transform can drag it sideways.
    const rect = panelEl.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'score-popup replay-sweep-clone';
    popup.textContent = `+${move.pointsEarned}`;
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(popup);

    gsap.set(popup, { xPercent: -50, yPercent: -50 });

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

  // ── Tracked timeouts (cleared on destroy) ───────────────────────────────

  private scheduleTimeout(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.pendingTimeouts = this.pendingTimeouts.filter(x => x !== id);
      fn();
    }, ms);
    this.pendingTimeouts.push(id);
  }

  // ── Template helpers ────────────────────────────────────────────────────

  trackByToken(_i: number, player: any): string {
    return player.userToken;
  }

  // Stack 0 is the most-recently-placed card; display order is reversed so slot 0
  // is the oldest card in the row.
  stacksForDisplay(stack: any[]): any[] {
    return [...stack].reverse();
  }

  getSlotCard(stack: any[], idx: number): any {
    return this.stacksForDisplay(stack)[idx] ?? null;
  }

  isSlotSettled(stack: any[], idx: number): boolean {
    const card = this.getSlotCard(stack, idx);
    return !!card && this.settledCards().has(card.number);
  }

  getRoundScore(player: any): number {
    return (player?.pointCards ?? []).reduce(
      (s: number, c: any) => s + (c?.bullHeads ?? 0),
      0,
    );
  }

  getTotalScore(player: any): number {
    return (player?.roundScores ?? []).reduce(
      (s: number, round: any[]) =>
        s + round.reduce((rs, c) => rs + (c?.bullHeads ?? 0), 0),
      0,
    );
  }
}
