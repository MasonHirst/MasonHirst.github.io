import { Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';
import { GameFormat } from '../interfaces/gameformat.interface';

@Injectable({
  providedIn: 'root'
})
export class PinochleStateService {
  private gameState: GameState;

  constructor() { }

  setGameFormat(format: GameFormat) {
    const teams = Array.from({ length: format.teamCount }, () => (
      {
        name: '',
        endingTotalScore: 0,
        meldScore: null,
        trickScore: null,
      }
    ));
    this.initializeGame(teams, format)
  }

  getGameFormat(): GameFormat {
    return this.gameState?.gameFormat;
  }

  initializeGame(teams: Team[], format: GameFormat) {
    this.gameState = {
      teams,
      currentBid: null,
      bidWinningTeamIndeces: null,
      trumpSuit: null,
      roundNumber: 1,
      gameIsActive: true,
      gameStartTime: Date.now(),
      gameFormat: format,
    }
  }

  clearGameState(): void {
    this.gameState = null;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  setTeamsData(teams: Team[]): void {
    this.gameState.teams = teams;
  }

  setWinningBid(teamIndeces: number[], bidAmount: number) {
    this.gameState.currentBid = bidAmount;
    this.gameState.bidWinningTeamIndeces = teamIndeces;
  }

  getCurrentBidAmount() {
    return this.gameState.currentBid;
  }

  getBidWinningTeamIndeces() {
    return this.gameState.bidWinningTeamIndeces;
  }

  setMeldPoints(teams: Team[]) {
    this.gameState.teams = teams
  }
}
