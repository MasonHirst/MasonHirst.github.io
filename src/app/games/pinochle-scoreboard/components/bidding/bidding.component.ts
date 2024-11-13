import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import { Location } from '@angular/common';
import { Team } from '../../interfaces/team.interface';
import { isValidNumber } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-bidding',
  templateUrl: './bidding.component.html',
  styleUrls: ['./bidding.component.css'],
})
export class BiddingComponent implements OnInit {
  gameState: GameState = null;
  primaryWinningTeamIndex: number = null;
  secondaryWinningTeamIndex: number = null;
  noBidMessage: string = '';

  constructor(
    private router: Router,
    private location: Location,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Retrieve the list of teams from the game state service
    this.gameState = { ...this.gameStateService.getGameState() };

    if (!this.gameState?.teams || !this.gameState?.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    if (!isNaN(this.gameState.bidWinningTeamIndeces?.[0])) {
      this.primaryWinningTeamIndex = this.gameState.bidWinningTeamIndeces?.[0];
    }
    if (!isNaN(this.gameState.bidWinningTeamIndeces?.[1])) {
      this.secondaryWinningTeamIndex =
        this.gameState.bidWinningTeamIndeces?.[1];
    }
  }

  get shouldShowSecondaryWinnerChoice(): boolean {
    return (
      this.gameState?.gameFormat?.label === '5-hand' &&
      isValidNumber(this.primaryWinningTeamIndex)
    );
  }

  onPrimaryWinningTeamChange(): void {
    this.secondaryWinningTeamIndex = null;
  }

  goBack() {
    this.location.back();
  }

  onBidAmountChange() {
    // Display a message if bid amount is zero
    this.noBidMessage =
      this.gameState?.currentBid === 0
        ? 'If no team bids, please reshuffle and redeal.'
        : '';
  }

  submitBids() {
    try {
      if (
        !isValidNumber(this.gameState?.currentBid) ||
        this.gameState?.currentBid == 0
      ) {
        throw new Error(
          'Bid amount is required. If bid is 0, please re-shuffle and re-deal.'
        );
      }
      if (!isValidNumber(this.primaryWinningTeamIndex)) {
        throw new Error('Must pick a team for the bid.');
      }
      if (
        this.gameState?.gameFormat?.label === '5-hand' &&
        !isValidNumber(this.secondaryWinningTeamIndex)
      ) {
        throw new Error('Must pick a secondary team for the bid.');
      }
      // Store the winning team and bid amount
      this.gameStateService.setWinningBid(
        [this.primaryWinningTeamIndex, this.secondaryWinningTeamIndex],
        this.gameState?.currentBid
      );

      // Navigate to the next stage (e.g., melding)
      this.router.navigate(['/games/pinochle-scoreboard/melding']);
    } catch (error) {
      console.error('Error in SubmitBid: ', error);
    }
  }
}
