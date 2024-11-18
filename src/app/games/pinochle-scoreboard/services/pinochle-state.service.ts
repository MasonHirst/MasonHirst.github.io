import { Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';
import { GameFormat } from '../interfaces/gameformat.interface';
import { getDeepCopy } from '../../games-helper-functions';
import { GameData } from '../interfaces/gamedata.interface';
import shortId from 'shortid';
import { GameSettings } from '../interfaces/gamesettings.interface';
import { PinochleDatabase } from './pinochle-database.service';

@Injectable({
  providedIn: 'root',
})
export class PinochleStateService {
  private gameData: GameData = null;
  private gameSettings: GameSettings = null;
  private db: PinochleDatabase;

  constructor() {
    this.db = new PinochleDatabase();
    this.gameSettings = {
      autoCalculate:
        JSON.parse(localStorage.getItem('masonhirst_pinochle_autoCalculate')) ||
        true,
    };
  }

  private async saveGameDataToDB(): Promise<void> {
    if (this.gameData) {
      await this.db.gameData.put(this.gameData);
    }
  }

  async getGamesFromDB(): Promise<GameData[]> {
    try {
      const allGames = await this.db.gameData.toArray();
      return allGames;
    } catch (error) {
      console.error('Error retrieving games from database:', error);
      return [];
    }
  }

  async startNewGameFormat(format: GameFormat): Promise<void> {
    const teams = Array.from({ length: format.teamCount }, () => ({
      name: '',
      meldScore: null,
      trickScore: null,
      roundSubTotal: null,
      currentTotalScore: 0,
    }));
    
    this.gameData = {
      id: shortId(),
      currentGameState: {
        teams,
        currentBid: null,
        bidWinningTeamIndices: null,
        trumpSuit: null,
        roundNumber: 1,
      },
      gameFormat: format,
      gameStartTime: Date.now(),
      gameIsActive: true,
      roundHistory: [],
    };
    await this.setAllPastGamesToNotActiveInDB();
  }

  getGameFormat(): GameFormat {
    return this.gameData?.gameFormat;
  }

  clearCurrentGameState(): void {
    this.gameData.currentGameState = null;
  }

  getCurrentGameState(): GameState {
    return getDeepCopy(this.gameData?.currentGameState);
  }

  getAllGameData(): GameData {
    return getDeepCopy(this.gameData);
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
    return getDeepCopy(this.gameSettings);
  }

  setSettingAutoCalculate(newVal: boolean): void {
    this.gameSettings.autoCalculate = newVal;
  }

  setGameData(data: GameData): void {
    this.gameData = data;
  }

  setTeamsData(teams: Team[]): void {
    this.gameData.currentGameState.teams = teams;
    this.saveGameDataToDB();
  }

  setCurrentGameState(newGameState: GameState): void {
    this.gameData.currentGameState = newGameState;
    this.saveGameDataToDB();
  }

  setWinningBid(teamIndices: number[], bidAmount: number, trumpSuit: string) {
    this.gameData.currentGameState.currentBid = bidAmount;
    this.gameData.currentGameState.bidWinningTeamIndices = teamIndices;
    this.gameData.currentGameState.trumpSuit = trumpSuit;
    this.saveGameDataToDB();
  }

  getCurrentBidAmount(): number {
    return this.gameData?.currentGameState.currentBid;
  }

  getBidWinningTeamIndices(): number[] {
    return this.gameData?.currentGameState.bidWinningTeamIndices;
  }

  saveRoundToHistory(): void {
    this.gameData.roundHistory.push(
      getDeepCopy(this.gameData.currentGameState)
    );
  }

  setGameActiveStatus(status: boolean): void {
    this.gameData.gameIsActive = status;
    this.saveGameDataToDB();
  }

  async setAllPastGamesToNotActiveInDB(): Promise<void> {
    try {
      const savedGames = await this.db.gameData.toArray();
      for (const game of savedGames) {
        game.gameIsActive = false;
      }
      await this.db.gameData.bulkPut(savedGames);

      // delete oldest games if there are more than 25
      if (savedGames.length > 25) {
        const sortedGames = savedGames.sort(
          (a, b) => a.gameStartTime - b.gameStartTime
        );
        const gamesToDelete = sortedGames.slice(0, savedGames.length - 25);
        const idsToDelete = gamesToDelete.map(game => game.id);
        await this.db.gameData.bulkDelete(idsToDelete);
  
        console.log(`Deleted ${idsToDelete.length} oldest games to maintain a limit of 25.`);
      }
    } catch (error) {
      console.error('Error setting past games to not active or deleting old games:', error);
    }
  }
}
