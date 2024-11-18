import { Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';
import { GameFormat } from '../interfaces/gameformat.interface';
import { getDeepCopy } from '../../games-helper-functions';
import { GameData } from '../interfaces/gamedata.interface';
import shortId from 'shortid';
import { GameSettings } from '../interfaces/gamesettings.interface';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class PinochleStateService {
  private gameData: GameData = null;
  private gameSettings: GameSettings = null;
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
    this.gameSettings = {
      autoCalculate:
        JSON.parse(localStorage.getItem('masonhirst_pinochle_autoCalculate')) ||
        true,
    };
  }

  private async initDB(): Promise<IDBPDatabase> {
    return await openDB('masonhirst_pinochle_DB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('gameData')) {
          db.createObjectStore('gameData', { keyPath: 'id' });
        }
      },
    });
  }

  private async saveGameDataToDB(): Promise<void> {
    // Save the current gameData to IndexedDB
    const db = await this.dbPromise;
    if (this.gameData) {
      await db.put('gameData', getDeepCopy(this.gameData));
    }
  }

  async getGamesFromDB(): Promise<any[]> {
    const db = await this.dbPromise;
    const allGames = await db.getAll('gameData');
    return allGames;
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
    await this.saveGameDataToDB();
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
  }

  async setAllPastGamesToNotActiveInDB(): Promise<void> {
    const db = await this.dbPromise; // Wait for the database to initialize
    const allGames = await db.getAll('gameData'); // Retrieve all games from the database
  
    // Iterate through each game and update its gameIsActive property
    for (const game of allGames) {
      if (game.gameIsActive) {
        game.gameIsActive = false; // Set gameIsActive to false
        await db.put('gameData', game); // Update the record in the database
      }
    }
  }

  public async onDestroyAction(): Promise<void> {
    // close IndexedDB connection
    const db = await this.dbPromise;
    db.close();
  }
}
