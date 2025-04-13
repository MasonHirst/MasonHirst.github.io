import { Component, Input } from '@angular/core';
import { GameState } from '../../interfaces/gamestate.interface';
import {
  formatSubScore,
  getPinochleAddedScore,
} from 'src/app/games/games-helper-functions';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { GameSettings } from '../../interfaces/gamesettings.interface';

@Component({
  selector: 'app-round-summary-table',
  templateUrl: './round-summary-table.component.html',
  styleUrl: './round-summary-table.component.css',
})
export class RoundSummaryTableComponent {
  @Input() gameState!: GameState;
  @Input() gameFormat!: GameFormat;
  @Input() gameSettings!: GameSettings;

  constructor() {}

  get trumpSuitIcon(): string {
    const suitIcons = {
      Hearts: '♥',
      Diamonds: '♦',
      Clubs: '♣',
      Spades: '♠',
    };
    return suitIcons[this.gameState?.trumpSuit];
  }

  get trumpSuitColor(): string {
    switch (this.gameState?.trumpSuit) {
      case 'Hearts':
      case 'Diamonds':
        return '#ff4500';
      default:
        return 'black';
    }
  }

  get bidWasAchieved(): boolean {
    const { teams, bidWinningTeamIndices, currentBid } = this.gameState || {};
    return teams?.[bidWinningTeamIndices[0]]?.roundSubTotal >= currentBid;
  }

  get showZeroPointTrickAsterisk(): boolean {
    const shouldShow = this.gameState?.teams.some(
      (team) => team.didTakeTrick === true && team.trickScore === 0
    );
    return shouldShow;
  }

  formatSubtotal(val: number): string | number {
    return formatSubScore(val);
  }

  isFiveHandPrimaryBidWinner(i: number): boolean {
    return (
      this.gameState?.bidWinningTeamIndices?.includes(i) &&
      this.gameFormat.label === '5-hand' &&
      this.gameState?.bidWinningTeamIndices?.[0] === i
    );
  }

  getTotalScoreWithRoundTotal(team: Team): number {
    return team.roundSubTotal + team.currentTotalScore;
  }

  isHighestScoreTeam(i: number): boolean {
    const { teams } = this.gameState || {};
    if (!teams) {
      return false;
    }
    const highestScoreIndex = teams.reduce((highestIndex, team, index) => {
      const teamScore = team.roundSubTotal + team.currentTotalScore;
      const highestScore =
        teams[highestIndex].roundSubTotal +
        teams[highestIndex].currentTotalScore;
      return teamScore > highestScore ? index : highestIndex;
    }, 0);

    const highestTeamScore = getPinochleAddedScore(teams[highestScoreIndex]);
    const thisTeamScore = getPinochleAddedScore(teams[i]);
    return highestTeamScore === thisTeamScore;
  }
}
