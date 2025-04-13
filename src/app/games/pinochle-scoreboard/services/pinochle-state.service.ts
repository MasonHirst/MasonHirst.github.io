import { EventEmitter, Injectable } from '@angular/core';
import { GameState } from '../interfaces/gamestate.interface';
import { Team } from '../interfaces/team.interface';
import { GameFormat } from '../interfaces/gameformat.interface';
import {
  getDeepCopy,
  getDefaultPinochleSettings,
  isValidNumber,
} from '../../games-helper-functions';
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
  public gameSettingsEmit: EventEmitter<GameSettings> = new EventEmitter();
  private db: PinochleDatabase;
  public numberOfSavedGamesToKeep: number = 25;

  constructor() {
    this.db = new PinochleDatabase();
    const storedSettings = this.getSettingsFromLocalStorage();
    if (storedSettings) {
      this.gameSettings = storedSettings;
    } else {
      localStorage.setItem(
        'masonhirst_pinochle_settings',
        JSON.stringify(getDefaultPinochleSettings())
      );
      this.gameSettings = getDefaultPinochleSettings();
    }

    this.removeGamesWithNoCompleteRoundsFromDB();
  }

  getGameSettings(): GameSettings {
    return getDeepCopy(this.gameSettings);
  }

  private getSettingsFromLocalStorage(): GameSettings {
    const settings = JSON.parse(
      localStorage.getItem('masonhirst_pinochle_settings')
    );
    return settings;
  }

  updateGameSettings(newSettings: GameSettings): void {
    this.gameSettings = newSettings;
    localStorage.setItem(
      'masonhirst_pinochle_settings',
      JSON.stringify(newSettings)
    );
    this.gameSettingsEmit.emit(newSettings);
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
      didTakeTrick: null,
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
    await this.removeGamesWithNoCompleteRoundsFromDB();
  }

  getGameFormat(): GameFormat {
    return this.gameData?.gameFormat;
  }

  getCurrentGameState(): GameState {
    return getDeepCopy(this.gameData?.currentGameState);
  }

  getAllGameData(): GameData {
    return getDeepCopy(this.gameData);
  }

  getNonBidWinnerIndices(): number[] {
    let indeces: number[] = [];
    if (!this.gameData) {
      return null;
    }
    const { teams, bidWinningTeamIndices } = this.gameData?.currentGameState;
    teams?.forEach((team, i) => {
      if (!bidWinningTeamIndices.includes(i)) {
        indeces.push(i);
      }
    });
    return indeces;
  }

  setSettingAutoCalculate(newVal: boolean): void {
    this.gameSettings.autoCalculate = newVal;
  }

  setGameData(data: GameData): void {
    this.gameData = data;
  }

  setTeamsData(teams: Team[]): void {
    if (!this.gameData) {
      return;
    }
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

  getNumberOfSavedGamesToKeep(): number {
    return this.numberOfSavedGamesToKeep;
  }

  saveRoundToHistory(): void {
    this.gameData.roundHistory.push(
      getDeepCopy(this.gameData.currentGameState)
    );
    this.saveGameDataToDB();
  }

  setGameActiveStatus(status: boolean): void {
    this.gameData.gameIsActive = status;
    this.saveGameDataToDB();
  }

  resetCurrentGameStateForNewRound(): void {
    this.gameData.currentGameState.trumpSuit = null;
    this.gameData.currentGameState.bidWinningTeamIndices = null;
    this.gameData.currentGameState.currentBid = null;
    this.gameData.currentGameState.roundNumber++;
    this.gameData.currentGameState.teams.forEach((team) => {
      team.currentTotalScore += team.roundSubTotal;
      team.meldScore = null;
      team.trickScore = null;
      team.roundSubTotal = null;
      team.didTakeTrick = null;
    });
    this.saveGameDataToDB();
  }

  async setAllPastGamesToNotActiveInDB(): Promise<void> {
    try {
      const savedGames = await this.db.gameData.toArray();
      for (let game of savedGames) {
        if (game.gameIsActive === true) {
          //? Check for completed rounds that haven't been saved to roundHistory yet
          const { teams, currentBid } = game.currentGameState;
          let allTeamsMelded: boolean = true;
          let allTeamsTricked: boolean = true;
          let allTeamsHaveSubtotal: boolean = true;
          teams.forEach((team) => {
            if (!isValidNumber(team.meldScore)) {
              allTeamsMelded = false;
            }
          });
          teams.forEach((team) => {
            if (!isValidNumber(team.trickScore)) {
              allTeamsTricked = false;
            }
          });
          teams.forEach((team) => {
            if (!isValidNumber(team.roundSubTotal)) {
              allTeamsHaveSubtotal = false;
            }
          });
          if (
            currentBid &&
            allTeamsMelded &&
            allTeamsTricked &&
            allTeamsHaveSubtotal
          ) {
            //? Save the completed round to roundHistory
            const roundCopy = getDeepCopy(game.currentGameState);
            game.roundHistory.push(roundCopy);
            //? Reset the game's currentGameState
            game.currentGameState.trumpSuit = null;
            game.currentGameState.bidWinningTeamIndices = null;
            game.currentGameState.currentBid = null;
            game.currentGameState.roundNumber++;
            game.currentGameState.teams.forEach((team) => {
              team.currentTotalScore += team.roundSubTotal;
              team.meldScore = null;
              team.trickScore = null;
              team.roundSubTotal = null;
              team.didTakeTrick = null;
            });
          }
        }
        game.gameIsActive = false;
      }
      await this.db.gameData.bulkPut(savedGames);

      // delete oldest games if there are more than this.numberOfSavedGamesToKeep
      if (savedGames.length > this.numberOfSavedGamesToKeep) {
        const sortedGames = savedGames.sort(
          (a, b) => a.gameStartTime - b.gameStartTime
        );
        const gamesToDelete = sortedGames.slice(
          0,
          savedGames.length - this.numberOfSavedGamesToKeep
        );
        const idsToDelete = gamesToDelete.map((game) => game.id);
        await this.db.gameData.bulkDelete(idsToDelete);

        console.log(
          `Deleted ${idsToDelete.length} oldest games to maintain a limit of ${this.numberOfSavedGamesToKeep}.`
        );
      }
    } catch (error) {
      console.error(
        'Error setting past games to not active or deleting old games:',
        error
      );
    }
  }

  async removeGamesWithNoCompleteRoundsFromDB(): Promise<void> {
    try {
      const savedGames = await this.db.gameData.toArray();
      let idsToDelete = [];
      for (const game of savedGames) {
        if (!game?.roundHistory?.[0]?.roundNumber && !game.gameIsActive) {
          idsToDelete.push(game.id);
        }
      }
      if (idsToDelete.length > 0) {
        await this.db.gameData.bulkDelete(idsToDelete);
        console.log(
          `Deleted ${idsToDelete.length} games that didn't have any completed rounds.`
        );
      }
    } catch (error) {
      console.error('Error removing games with no complete rounds: ', error);
    }
  }

  async findSavedGameById(id: string): Promise<GameData> {
    const matchingGame = await this.db.gameData.get(id);
    return matchingGame;
  }
}
