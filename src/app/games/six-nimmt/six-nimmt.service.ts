import { effect, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { generate as shortId } from 'shortid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

const SELF_HOSTED_URL = 'wss://portfolio.masonhirst.com';

@Injectable({ providedIn: 'root' })
export class SixNimmtService {
  private socket: any;

  readonly gameData = signal<any>(null);
  readonly countdown = signal<number | null>(null);
  // True while the client is playing through a stacking-sequence animation.
  // HostScreenComponent uses this to avoid switching views mid-animation.
  readonly isAnimating = signal(false);

  // One-shot events for the animation queue — not state, so Subject not Signal.
  readonly stackingSequence$ = new Subject<any>();
  readonly stackingContinuation$ = new Subject<any>();

  // Captured payload of the most recently played round, consumed by the self-contained
  // replay modal. `snapshot` is the pre-stacking gameData; `moves` is appended across
  // the original sequence + any pick-a-row continuations.
  readonly lastReplay = signal<{
    snapshot: any;
    moves: any[];
    finalGameState: any;
  } | null>(null);

  constructor(private router: Router) {
    if (!localStorage.getItem('userToken')) {
      localStorage.setItem('userToken', shortId());
    }

    // Rehydrate the replay from sessionStorage so a host page-reload doesn't lose the
    // ability to replay the most recent round. Scoped by gameCode so a different game
    // in the same tab doesn't see another room's replay. Done BEFORE the persistence
    // effect is declared below; we just call set() directly so the value is in place
    // when the host-screen first reads `lastReplay()`.
    const initialCode = this.codeFromUrl();
    if (initialCode) {
      const stored = sessionStorage.getItem(this.replayStorageKey(initialCode));
      if (stored) {
        try {
          this.lastReplay.set(JSON.parse(stored));
        } catch {
          sessionStorage.removeItem(this.replayStorageKey(initialCode));
        }
      }
    }

    // Mirror lastReplay → sessionStorage so it survives a host reload. Keyed by the
    // current gameCode (which doesn't change once the host is on /host/XYZW); on
    // clear (null) we remove the entry rather than store the literal "null".
    effect(() => {
      const code = this.codeFromUrl();
      if (!code) return;
      const value = this.lastReplay();
      const key = this.replayStorageKey(code);
      if (value === null) {
        sessionStorage.removeItem(key);
      } else {
        try {
          sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Quota exceeded or similar — replay-on-reload is a nice-to-have, not critical.
        }
      }
    });

    const { protocol, hostname } = document.location;
    const scheme = protocol === 'https:' ? 'wss' : 'ws';
    let serverUrl = `${scheme}://${hostname}`;
    if (!environment.production) {
      serverUrl += ':8080';
    } else if (hostname.includes('github.io') || hostname.includes('masonhirst.com')) {
      serverUrl = SELF_HOSTED_URL;
    }

    this.socket = io(`${serverUrl}?token=${this.userToken}`);

    this.socket.on('connect', () => {
      const code = this.codeFromUrl();
      if (!code) return;
      this.checkGameExists(code);
      // Rejoin the socket room on every (re)connect so game-updated events reach this client.
      // ngOnInit only runs once on component mount; a reconnect needs an explicit rejoin.
      const path = location.pathname;
      if (path.includes('/host/')) {
        this.socket.emit('join-game', { gameCode: code, userToken: this.userToken, isHost: true });
      } else if (path.includes('/client/')) {
        const playerName = localStorage.getItem('playerName') ?? '';
        // Skip the auto-join when there's no saved nickname (invite link opened on a
        // fresh browser / incognito). ClientScreenComponent will render its nickname
        // prompt and fire the join emit once the user submits a name. Otherwise the
        // server would reject with `no-player-name` and the message handler below
        // would bounce them to the landing page before they ever see the prompt.
        if (playerName) {
          this.socket.emit('join-game', { gameCode: code, userToken: this.userToken, isHost: false, playerName });
        }
      }
    });

    this.socket.on('message', (message: any) => {
      if (message.type !== 'not-allowing-join') return;
      if (message.message === 'no-player-name') {
        return this.router.navigate(['/games/6-nimmt!']);
      }
      Swal.fire({
        title: 'Unable to join this game',
        text: 'This game is full or has already started.',
        confirmButtonText: 'Back to 6 Nimmt!',
        confirmButtonColor: '#9c4fd7',
        allowOutsideClick: false,
      }).then(result => {
        if (result.isConfirmed) this.router.navigate(['/games/6-nimmt!']);
      });
    });

    this.socket.on('someone-joined-game', (data: any) => {
      this.gameData.set(data);
      const path = location.href.split('/').pop();
      if (path === '6-nimmt!') {
        if (data?.players[this.userToken]) {
          this.router.navigate([`/games/6-nimmt!/client/${data.code}`]);
        } else if (data?.hosts.includes(this.userToken)) {
          this.router.navigate([`/games/6-nimmt!/host/${data.code}`]);
        }
      }
    });

    this.socket.on('game-updated', (data: any) => {
      // Always update gameData — clients (players) need live updates (e.g. needsToPickRow).
      // GameTableComponent guards its local display state via an effect() gated on isAnimating,
      // so its display won't snap to the new state mid-animation.
      this.gameData.set(data);
    });

    this.socket.on('counting-down', (value: number | null) => {
      this.countdown.set(value);
    });

    this.socket.on('kicked-from-game', () => {
      this.router.navigate(['/games/6-nimmt!']);
      Swal.fire({
        title: 'You were kicked from the game.',
        text: 'Darn!',
        imageUrl: 'https://media3.giphy.com/media/10hzvF9FTulLxK/200w.gif',
        imageWidth: 'min(90vw, 400px)',
        confirmButtonText: 'How rude!',
        showCancelButton: true,
        cancelButtonText: 'I deserved it',
        reverseButtons: true,
      });
    });

    this.socket.on('stacking-sequence', (data: any) => {
      // Snapshot the pre-stacking gameData BEFORE forwarding the event. At this point
      // gameData is still the end-of-PICKING_CARDS state (game-updated hasn't fired yet),
      // which is exactly what the replay needs as its starting frame.
      const preRoundData = this.gameData();
      if (preRoundData) {
        this.lastReplay.set({
          snapshot: JSON.parse(JSON.stringify(preRoundData)),
          moves: [...(data.moves ?? [])],
          finalGameState: data.finalGameState ?? null,
        });
      }
      this.isAnimating.set(true);
      this.stackingSequence$.next(data);
    });

    this.socket.on('stacking-sequence-continuation', (data: any) => {
      // Pick-a-row resumed: append the continuation's moves so the replay plays
      // straight through as one continuous sequence.
      this.lastReplay.update(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          moves: [...prev.moves, ...(data.moves ?? [])],
          finalGameState: data.finalGameState ?? prev.finalGameState,
        };
      });
      this.stackingContinuation$.next(data);
    });

    // Clear lastReplay when a new round is dealt (every player resets to 10 cards in
    // PICKING_CARDS). Importantly: we only clear on the TRANSITION into a fresh-deal
    // state from a non-fresh state — not whenever we observe a fresh-deal state.
    // Why: on the very first trick of any round, gameData is still in its pre-stacking
    // (hands=10) form at the moment `lastReplay.set(...)` fires inside the stacking-sequence
    // handler. If this effect re-ran in that window and used a steady-state check, it
    // would clear the replay we'd just captured. The transition check sidesteps that
    // because `wasFreshDeal` is still true from before the trick started.
    let wasFreshDeal = false;
    effect(() => {
      const data = this.gameData();
      if (!data) return;
      const players = Object.values<any>(data.players ?? {});
      if (players.length === 0) return;
      const isPickingFresh =
        data.gameState === 'PICKING_CARDS' &&
        players.every(p => (p.cards?.length ?? 0) === 10);

      if (isPickingFresh && !wasFreshDeal && this.lastReplay()) {
        this.lastReplay.set(null);
      }
      wasFreshDeal = isPickingFresh;
    }, { allowSignalWrites: true });
  }

  sendSocketMessage(type: string, body: any = {}) {
    body.userToken = this.userToken;
    if (!body.gameCode) body.gameCode = this.codeFromUrl();
    this.socket.emit(type, body);
  }

  async checkGameExists(gameCode?: string): Promise<boolean> {
    const code = gameCode ?? this.codeFromUrl();
    if (!code || code.length !== 4) return false;
    try {
      const { status, data } = await axios.get(`/api/nimmt/check-game-code/${code}`);
      if (status !== 200 || !data?.code) {
        this.router.navigate(['/games/6-nimmt!']);
        return false;
      }
      this.gameData.set(data);
      return true;
    } catch {
      return false;
    }
  }

  // Called by GameTableComponent once the stacking animation completes.
  finishAnimation(finalGameState: any) {
    this.isAnimating.set(false);
    if (finalGameState) this.gameData.set(finalGameState);
  }

  get userToken(): string {
    return localStorage.getItem('userToken') ?? '';
  }

  isFirstPlayer(): boolean {
    const players = this.gameData()?.players;
    if (!players) return false;
    return Object.values<any>(players)[0]?.userToken === this.userToken;
  }

  getRoundScore(player: any): number {
    return (player?.pointCards ?? []).reduce((s: number, c: any) => s + c.bullHeads, 0);
  }

  getTotalScore(player: any): number {
    return (player?.roundScores ?? []).reduce(
      (s: number, round: any[]) => s + round.reduce((rs, c) => rs + c.bullHeads, 0),
      0,
    );
  }

  private codeFromUrl(): string {
    return location.pathname.split('/').pop() ?? '';
  }

  private replayStorageKey(code: string): string {
    return `nimmt-replay-${code}`;
  }
}
