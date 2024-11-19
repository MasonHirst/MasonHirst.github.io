import { Component, Input } from '@angular/core';
import { GameState } from '../../interfaces/gamestate.interface';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.css'],
})
export class GameStatusComponent {
  @Input() gameState: GameState = null;
  @Input() gameFormat: GameFormat = null;
  @Input() currentPage: string = null;

  get trumpSuitIcon(): string {
    const suitIcons = {
      Hearts: '♥',
      Diamonds: '♦',
      Clubs: '♣',
      Spades: '♠',
    };
    return suitIcons[this.gameState?.trumpSuit];
  }

  get bidAmount(): number {
    return this.gameState?.currentBid;
  }

  get trumpSuit(): string {
    return this.gameState?.trumpSuit;
  }

  get teams(): Team[] {
    return this.gameState?.teams;
  }

  get showSecondRow(): boolean {
    return this.gameFormat?.teamCount > 2;
  }

  getTeamSubInfo(team: Team, isName: boolean = false): string | number {
    if (!team?.name) {
      console.log('no team');
      return null;
    }
    if (isName) {
      return team?.name;
    }
    switch (this.currentPage) {
      case 'trick-taking':
        return 'meld: ' + team.meldScore;
      default:
        return 'score: ' + team.currentTotalScore;
    }
  }

  get placeBidSectionTopMiddle(): boolean {
    return this.gameFormat?.teamCount === 2;
  }

  get showBidTrumpSection(): boolean {
    return this.currentPage !== 'bidding' && !!this.trumpSuit;
  }

  getBidWinningStatus(team: Team): string {
    if (!team?.name || !Array.isArray(this.gameState?.bidWinningTeamIndices)) {
      return null;
    }
    const teamIndex = this.teams?.findIndex((val) => val.name === team.name);
    if (teamIndex < 0) {
      console.error('getBidWinningStatus: could not find team by name');
      return null;
    }
    const indexWithinWinners =
      this.gameState?.bidWinningTeamIndices.indexOf(teamIndex);
    switch (indexWithinWinners) {
      case 0:
        return 'primary';
      case 1:
        return 'secondary';
      default:
        return null;
    }
  }

  get topRowHasBottomMargin(): boolean {
    const teamCount = this.gameFormat?.teamCount;
    if (teamCount < 3) {
      return false;
    }
    if (teamCount === 3 && !this.showBidTrumpSection) {
      return false;
    }
    return true;
  }

  get topRowTeams(): Team[] {
    return [this.slotOneTeam, this.slotTwoTeam, this.slotThreeTeam];
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

  get slotOneTeam(): Team {
    return this.teams?.[0] || null;
  }

  get slotTwoTeam(): Team {
    const { label } = this.gameFormat;
    const isThreeOrFiveHand = label === '3-hand' || label === '5-hand';
    return isThreeOrFiveHand ? this.teams?.[1] : null;
  }

  get slotThreeTeam(): Team {
    let teamData: Team;
    switch (this.gameFormat.label) {
      case '3-hand':
      case '5-hand':
        teamData = this.teams?.[2];
        break;
      default:
        teamData = this.teams?.[1];
        break;
    }
    return teamData || null;
  }

  get slotFourTeam(): Team {
    let teamData: Team = null;
    switch (this.gameFormat.label) {
      case '5-hand':
        teamData = this.teams[3];
        break;
      case '8-hand':
        teamData = this.teams[2];
        break;
    }
    return teamData;
  }
  get slotFiveTeam(): Team {
    let teamData: Team = null;
    switch (this.gameFormat.label) {
      case '5-hand':
        teamData = this.teams[4];
        break;
      case '8-hand':
        teamData = this.teams[3];
        break;
    }
    return teamData;
  }
}
