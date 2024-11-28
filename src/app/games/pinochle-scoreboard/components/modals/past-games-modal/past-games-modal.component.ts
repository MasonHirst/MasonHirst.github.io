import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameData } from '../../../interfaces/gamedata.interface';
import {
  formatTimestampForPinochle,
  getPinochleAddedScore,
} from 'src/app/games/games-helper-functions';
import { Team } from '../../../interfaces/team.interface';

@Component({
  selector: 'app-past-games-modal',
  templateUrl: './past-games-modal.component.html',
  styleUrl: './past-games-modal.component.css',
})
export class PastGamesModalComponent {
  @Input() savedGames!: GameData[];
  @Output() gameSelected = new EventEmitter<GameData>();

  getFormattedDate(timeStamp: number): string {
    return formatTimestampForPinochle(timeStamp);
  }

  getTeamNames(game: GameData): string {
    let namesString = '';
    game?.currentGameState?.teams?.forEach((team: Team, i) => {
      namesString += team.name;
      if (i < game?.currentGameState?.teams?.length - 1) {
        namesString += ', ';
      }
    });
    return namesString;
  }

  get orderedSavedGames(): GameData[] {
    return [...(this.savedGames || [])].sort(
      (a, b) => b.gameStartTime - a.gameStartTime
    );
  }

  getWinningTeam(game: GameData): Team {
    const lastRound = game?.roundHistory?.[game?.roundHistory?.length - 1];
    return lastRound?.teams.reduce((prev, curr) => {
      return getPinochleAddedScore(curr) > getPinochleAddedScore(prev)
        ? curr
        : prev;
    });
  }

  openPastGameReview(game: GameData): void {
    this.gameSelected.emit(game);
  }

  getWinningTeams(game: GameData): Team[] {
    let winners = [];
    const highScore = getPinochleAddedScore(this.getWinningTeam(game));
    const teams = game?.roundHistory?.[game?.roundHistory?.length - 1]?.teams;
    teams.forEach((team) => {
      if (getPinochleAddedScore(team) === highScore) {
        winners.push(team);
      }
    });
    return winners;
  }
}
