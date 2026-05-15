import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { generate as shortId } from 'shortid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
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

  constructor(private router: Router, private toastr: ToastrService) {
    if (!localStorage.getItem('userToken')) {
      localStorage.setItem('userToken', shortId());
    }

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
        this.socket.emit('join-game', { gameCode: code, userToken: this.userToken, isHost: false, playerName });
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
      this.isAnimating.set(true);
      this.stackingSequence$.next(data);
    });

    this.socket.on('stacking-sequence-continuation', (data: any) => {
      this.stackingContinuation$.next(data);
    });
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

  showToast(data: any) {
    const { playerName, takenRow, totalPoints, quip } = data;
    const msg = `<strong>${playerName}</strong> took row <strong>${this.getRowString(takenRow)}</strong> for <strong>${totalPoints}</strong> pts!<p>${quip}</p>`;
    if (totalPoints < 5) this.toastr.info(msg);
    else if (totalPoints < 10) this.toastr.warning(msg);
    else this.toastr.error(msg);
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

  getRowString(row: number): string {
    return (['one', 'two', 'three', 'four'] as const)[row] ?? '';
  }

  private codeFromUrl(): string {
    return location.pathname.split('/').pop() ?? '';
  }
}
