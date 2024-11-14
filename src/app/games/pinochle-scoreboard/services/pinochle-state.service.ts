import { Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';
import { GameFormat } from '../interfaces/gameformat.interface';
import { getDeepCopy } from '../../games-helper-functions';
import { GameData } from '../interfaces/gamedata.interface';
import shortId from 'shortid';
import { GameSettings } from '../interfaces/gamesettings.interface';

@Injectable({
  providedIn: 'root',
})
export class PinochleStateService {
  private gameData: GameData = null;

  constructor() {}

  setGameFormat(format: GameFormat) {
    const teams = Array.from({ length: format.teamCount }, () => ({
      name: '',
      meldScore: null,
      trickScore: null,
      roundSubTotal: null,
      currentTotalScore: 0,
    }));
    this.initializeGame(teams, format);
  }

  getGameFormat(): GameFormat {
    return this.gameData?.currentGameState?.gameFormat;
  }

  initializeGame(teams: Team[], format: GameFormat) {
    this.gameData = {
      id: shortId(),
      currentGameState: {
        teams,
        currentBid: null,
        bidWinningTeamIndices: null,
        trumpSuit: null,
        roundNumber: 1,
        gameIsActive: true,
        gameStartTime: Date.now(),
        gameFormat: format,
      },
      roundHistory: [],
      gameSettings: {
        autoCalculate:
          JSON.parse(
            localStorage.getItem('masonhirst_pinochle_autoCalculate')
          ) || true,
      },
    };
  }

  clearCurrentGameState(): void {
    this.gameData.currentGameState = null;
  }

  getCurrentGameState(): GameState {
    return getDeepCopy(this.gameData?.currentGameState);
  }

  getNonBidWinnerIndices(): number[] {
    let indeces: number[] = [];
    const { teams, bidWinningTeamIndices } = this.gameData?.currentGameState;
    teams?.forEach((team, i) => {
      if (!bidWinningTeamIndices.includes(i)) {
       indeces.push(i);
      }
    });
    return indeces;
  }
 
  getGameSettings(): GameSettings {
    return getDeepCopy(this.gameData?.gameSettings);
  }

  setTeamsData(teams: Team[]): void {
    this.gameData.currentGameState.teams = teams;
  }

  setCurrentGameState(newGameState: GameState): void {
    this.gameData.currentGameState = newGameState;
  }

  setWinningBid(teamIndices: number[], bidAmount: number, trumpSuit: string) {
    this.gameData.currentGameState.currentBid = bidAmount;
    this.gameData.currentGameState.bidWinningTeamIndices = teamIndices;
    this.gameData.currentGameState.trumpSuit = trumpSuit;
  }

  getCurrentBidAmount(): number {
    return this.gameData?.currentGameState.currentBid;
  }

  getBidWinningTeamIndices(): number[] {
    return this.gameData?.currentGameState.bidWinningTeamIndices;
  }

  saveRoundToHistory(): void {
    console.log('about to save data: ', this.gameData.currentGameState);
    this.gameData.roundHistory.push(getDeepCopy(this.gameData.currentGameState));
  }
}
