import { Component, Input, OnInit } from '@angular/core';
import { GameState } from '../../interfaces/gamestate.interface';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { Modal } from 'bootstrap';
import { GameSettings } from '../../interfaces/gamesettings.interface';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { getDefaultPinochleFormats } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.css'],
})
export class GameStatusComponent implements OnInit {
  @Input() gameState: GameState = null;
  @Input() gameFormat: GameFormat = null;
  @Input() currentPage: string = null;
  @Input() onlySettingsButton: boolean = false;
  gameSettings: GameSettings;
  defaultGameFormats: GameFormat[];
  selectedPoints: { [key: string]: 'default' | 'custom' } = {};
  invalidCustomTricksMessage: string = '';

  constructor(private gameStateService: PinochleStateService) {}

  ngOnInit(): void {
    this.defaultGameFormats = getDefaultPinochleFormats();
    this.gameSettings = this.gameStateService?.getGameSettings();
    this.gameStateService.gameSettingsEmit.subscribe((newVal) => {
      this.gameSettings = newVal;
    });

    this.refreshGameSettings();
  }

  refreshGameSettings(): void {
    this.gameSettings = this.gameStateService?.getGameSettings();
    this.defaultGameFormats.forEach(format => {
      const customVal = this.gameSettings?.customTrickPoints?.[format.label];
      this.selectedPoints[format.label] = customVal ? 'custom' : 'default';
    })
  }

  saveNewGameSettings(): void {
    this.defaultGameFormats.forEach(format => {
      this.onCustomInputBlur(format);
    })
    if (!this.checkSettingsValid()) {
      return;
    }
    this.gameStateService?.updateGameSettings(this.gameSettings);
    this.toggleSettingsModal(false);
  }

  resetCustomPoints(formatLabel: string): void {
    this.gameSettings.customTrickPoints[formatLabel] = null;
  }

  onDropdownChange(formatLabel: string, defaultValue: number): void {
    if (this.selectedPoints[formatLabel] === 'custom') {
      // Pre-fill custom input if empty
      if (!this.gameSettings.customTrickPoints[formatLabel]) {
        this.gameSettings.customTrickPoints[formatLabel] = defaultValue;
      }
    }
    if (this.selectedPoints[formatLabel] === 'default') {
      this.gameSettings.customTrickPoints[formatLabel] = null;
    }
  }

  onCustomInputBlur(format: GameFormat): void {
    const { label, possibleTrickPoints } = format;
    const customValue = this.gameSettings.customTrickPoints[label];
  
    if (!customValue || customValue === possibleTrickPoints) {
      // Reset to default if input is empty or matches default
      this.selectedPoints[label] = 'default';
      this.gameSettings.customTrickPoints[label] = null;
    }
  }

  checkSettingsValid(): boolean {
    let valid: boolean = true;
    this.defaultGameFormats.forEach(format => {
      const input = this.gameSettings.customTrickPoints[format.label]
      const isCustom = this.selectedPoints[format.label] === 'custom';
      if (isCustom && (input <= 0 || input > 100000)) {
        valid = false;
        this.invalidCustomTricksMessage = 'The allowed range for trick points is between 1 and 100,000.'
      }
    });
    return valid;
  }

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

  toggleSettingsModal(open: boolean = true): void {
    const modalElement = document.getElementById('pinochle-settings-modal');
    if (!modalElement) {
      console.error('Modal element not found!');
      return;
    }
    const settingsModal = Modal.getOrCreateInstance(modalElement);
    if (open) {
      settingsModal.show();
    } else {
      settingsModal.hide();
    }
  }

  getTeamSubInfo(team: Team, isName: boolean = false): string | number {
    if (!team?.name) {
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
