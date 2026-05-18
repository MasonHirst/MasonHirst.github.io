import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { SixNimmtService } from './six-nimmt.service';

@Component({
  selector: 'app-six-nimmt',
  templateUrl: './six-nimmt.component.html',
  styleUrls: ['./six-nimmt.component.css'],
})
export class SixNimmtComponent {
  // Form state — playerName persists across reloads via localStorage.
  playerName = localStorage.getItem('playerName') ?? '';
  gameCode = '';
  rejoinHostCode = '';
  formError = '';
  joinPending = false;
  hostPending = false;

  // Rejoin-as-host is an edge case (host refreshed/disconnected), tucked behind a toggle.
  readonly rejoinHostOpen = signal(false);

  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  // Uppercase + 4-char clamp as the user types so the code stays in the canonical form.
  onCodeChange(value: string, target: 'join' | 'rejoin') {
    const clean = (value ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (target === 'join') this.gameCode = clean;
    else this.rejoinHostCode = clean;
  }

  toggleRejoinHost() {
    this.rejoinHostOpen.update(v => !v);
    this.formError = '';
  }

  async handleJoin() {
    this.formError = '';
    const name = this.playerName.trim();
    if (!name) return this.formError = 'Please enter a player name.';
    if (name.length > 15) return this.formError = 'Player name must be 15 characters or less.';
    if (this.gameCode.length !== 4) return this.formError = 'Please enter the 4-letter game code.';

    this.joinPending = true;
    try {
      const exists = await this.nimmtService.checkGameExists(this.gameCode);
      if (!exists) {
        this.formError = `No game found with code ${this.gameCode}.`;
        return;
      }
      localStorage.setItem('playerName', name);
      this.nimmtService.sendSocketMessage('join-game', {
        gameCode: this.gameCode,
        isHost: false,
        playerName: name,
      });
    } finally {
      this.joinPending = false;
    }
  }

  async handleRejoinAsHost() {
    this.formError = '';
    if (this.rejoinHostCode.length !== 4) return this.formError = 'Please enter the 4-letter game code.';

    this.joinPending = true;
    try {
      const exists = await this.nimmtService.checkGameExists(this.rejoinHostCode);
      if (!exists) {
        this.formError = `No game found with code ${this.rejoinHostCode}.`;
        return;
      }
      this.nimmtService.sendSocketMessage('join-game', {
        gameCode: this.rejoinHostCode,
        isHost: true,
        // playerName is unused for hosts but the server signature still accepts it.
        playerName: this.playerName.trim(),
      });
    } finally {
      this.joinPending = false;
    }
  }

  handleHostNewGame() {
    this.formError = '';
    this.hostPending = true;
    axios.post('/api/nimmt/create', {})
      .then(({ data, status }) => {
        if (status !== 200 || !data?.code) {
          this.formError = 'Could not create a game — please try again.';
          return;
        }
        this.router.navigate([`/games/6-nimmt!/host/${data.code}`]);
      })
      .catch(() => this.formError = 'Could not create a game — please try again.')
      .finally(() => this.hostPending = false);
  }
}
