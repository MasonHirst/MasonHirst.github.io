import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import {
  getDeepCopy,
  hasDecimal,
  isValidNumber,
  scrollToElement,
} from 'src/app/games/games-helper-functions';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { Team } from '../../interfaces/team.interface';

@Component({
  selector: 'app-bidding',
  templateUrl: './bidding.component.html',
  styleUrls: ['./bidding.component.css'],
})
export class BiddingComponent implements OnInit {
  gameState: GameState = null;
  gameFormat: GameFormat = null;
  primaryWinningTeamIndex: number = null;
  secondaryWinningTeamIndex: number = null;
  noBidMessage: string = '';
  noWinnerMessage: string = '';
  noSecondaryWinnerMessage: string = '';
  noTrumpSuitMessage: string = '';
  suitOptions: string[] = ['Diamonds', 'Spades', 'Hearts', 'Clubs'];
  bidHasMultipled: boolean;
  multiplyByTen: boolean;

  suitIcons = {
    Hearts: '♥',
    Diamonds: '♦',
    Clubs: '♣',
    Spades: '♠',
  };

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Retrieve the list of teams from the game state service
    this.gameState = this.gameStateService.getCurrentGameState();
    this.gameFormat = this.gameStateService?.getGameFormat();
    this.multiplyByTen =
      this.gameStateService?.getGameSettings()?.multiplyByTen;
    this.gameStateService.gameSettingsEmit.subscribe(({ multiplyByTen }) => {
      this.multiplyByTen = multiplyByTen;
    });

    if (!this.gameState?.teams || !this.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    if (isValidNumber(this.gameState?.bidWinningTeamIndices?.[0])) {
      this.primaryWinningTeamIndex = this.gameState?.bidWinningTeamIndices?.[0];
    }
    if (isValidNumber(this.gameState?.bidWinningTeamIndices?.[1])) {
      this.secondaryWinningTeamIndex =
        this.gameState.bidWinningTeamIndices?.[1];
    }
  }

  getTrumpSuitColor(suit: string): string {
    switch (suit) {
      case 'Hearts':
      case 'Diamonds':
        return '#ff4500';
      default:
        return 'black';
    }
  }

  setNoBidMessage(
    val: string = 'If no team bids, please reshuffle and redeal'
  ): void {
    this.noBidMessage = val;
  }

  setNoWinnerMessage(val: string = 'Please select a bid winner'): void {
    this.noWinnerMessage = val;
  }

  setNoSecondaryWinnerMessage(
    val: string = "Please select the winner's ally"
  ): void {
    this.noSecondaryWinnerMessage = val;
  }

  setNoTrumpSuitMessage(val: string = 'Please select a trump suit'): void {
    this.noTrumpSuitMessage = val;
  }

  getDataForStatus(): GameState {
    return getDeepCopy(this.gameState);
  }

  get goBackLabel(): string {
    return this.gameState?.roundNumber == 1 ? 'Back' : null;
  }

  get shouldShowSecondaryWinnerChoice(): boolean {
    return (
      this.gameFormat?.label === '5-hand' &&
      isValidNumber(this.primaryWinningTeamIndex)
    );
  }

  get secondaryTeamChoices(): Team[] {
    const teams = this.gameState?.teams.filter(
      (team, i) => i !== this.primaryWinningTeamIndex
    );
    return teams;
  }

  onTrumpSuitSelectionChange(): void {
    this.setNoTrumpSuitMessage('');
  }

  onPrimaryWinningTeamChange(): void {
    this.setNoWinnerMessage('');
    this.secondaryWinningTeamIndex = null;
  }

  onSecondaryWinningTeamChange(): void {
    this.setNoSecondaryWinnerMessage('');
  }

  onTrumpSuitChange(): void {
    this.setNoTrumpSuitMessage('');
  }

  goBack() {
    this.router.navigate(['/games/pinochle-scoreboard/new-game']);
  }

  onBidAmountChange() {
    this.bidHasMultipled = false;
    // Display a message if bid amount is zero
    this.setNoBidMessage(
      this.gameState?.currentBid <= 0
        ? 'If no team bids, please reshuffle and redeal.'
        : ''
    );
  }

  onBidAmountBlur() {
    if (
      this.multiplyByTen &&
      isValidNumber(this.gameState?.currentBid) &&
      this.bidHasMultipled === false
    ) {
      this.gameState.currentBid = this.gameState.currentBid * 10;
      this.bidHasMultipled = true;
    }
  }

  submitBids() {
    try {
      const { currentBid } = this.gameState || {};
      if (!isValidNumber(currentBid) || currentBid <= 0) {
        this.setNoBidMessage();
        scrollToElement(document.getElementById('bid-amount-input-label'));
        throw new Error(
          'Bid amount is required. If bid is 0, please re-shuffle and re-deal.'
        );
      }
      if (currentBid > 999999) {
        this.setNoBidMessage('Please enter a bid less than 999,999');
        throw new Error('Bid amount must be less than 999,999');
      }
      if (hasDecimal(currentBid)) {
        this.setNoBidMessage('Please enter a whole number for the bid');
        throw new Error('Bid amount must be a whole number');
      }
      if (!isValidNumber(this.primaryWinningTeamIndex)) {
        this.setNoWinnerMessage();
        scrollToElement(document.getElementById('winning-team-select-label'));
        throw new Error('Must pick a team for the bid.');
      }
      if (
        this.gameFormat?.label === '5-hand' &&
        !isValidNumber(this.secondaryWinningTeamIndex)
      ) {
        this.setNoSecondaryWinnerMessage();
        scrollToElement(
          document.getElementById('select-secondary-select-label')
        );
        throw new Error('Must pick a secondary team for the bid.');
      }
      if (!this.gameState?.trumpSuit) {
        this.setNoTrumpSuitMessage();
        scrollToElement(document.getElementById('select-trump-suit-heading'));
        throw new Error('Must pick a declared trump suit.');
      }
      // Store the winning team and bid amount
      this.gameStateService.setWinningBid(
        [this.primaryWinningTeamIndex, this.secondaryWinningTeamIndex],
        currentBid,
        this.gameState?.trumpSuit
      );

      // Navigate to the next stage (e.g., melding)
      this.router.navigate(['/games/pinochle-scoreboard/melding']);
    } catch (error) {
      console.error('Error in SubmitBid: ', error);
    }
  }
}
