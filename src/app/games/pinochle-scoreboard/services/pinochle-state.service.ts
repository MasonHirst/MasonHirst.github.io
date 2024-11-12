import { Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';

@Injectable({
  providedIn: 'root'
})
export class PinochleStateService {
  private gameState: GameState;
  private gameFormat: string;

  constructor() { }

  setGameFormat(format: string) {
    this.gameFormat = format;
  }

  getGameFormat(): string {
    return this.gameFormat;
  }

  initializeGame(teams: Team[]) {
    this.gameState = {
      teams,
      currentBid: null,
      bidWinningTeam: null,
      trumpSuit: null,
      roundNumber: 1,
      gameIsActive: true,
      gameStartTime: Date.now(),
    }
  }

  getGameState(): GameState {
    return this.gameState;
  }
}
