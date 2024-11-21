import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import {
  getDeepCopy,
  getTeamComboName5Hand,
  hasDecimal,
  isValidNumber,
  showTeamInput5Hand,
} from 'src/app/games/games-helper-functions';
import { GameState } from '../../interfaces/gamestate.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';

@Component({
  selector: 'app-melding',
  templateUrl: './melding.component.html',
  styleUrls: ['./melding.component.css'],
})
export class MeldingComponent implements OnInit {
  teams: Team[] = [];
  gameState: GameState = null;
  gameFormat: GameFormat = null;
  nonBidWinnerTeamIndices: number[] = [];
  notAllInputsFilledMessage: string;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    const teams = this.gameStateService?.getCurrentGameState()?.teams;
    this.gameFormat = this.gameStateService?.getGameFormat();
    this.gameState = this.gameStateService?.getCurrentGameState();
    if (
      !this.gameState ||
      !this.gameFormat ||
      !teams?.[0]?.name ||
      !this.gameState?.currentBid
    ) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }

    if (Array.isArray(teams)) {
      this.teams = teams;
      if (this.gameFormat?.label === '5-hand') {
        this.nonBidWinnerTeamIndices =
          this.gameStateService.getNonBidWinnerIndices();
      }
    }
  }

  onMeldInputChange(): void {
    this.setNotAllInputsFilledMessage('');
  }

  setNotAllInputsFilledMessage(
    val: string = 'Please enter a meld score for each team'
  ) {
    this.notAllInputsFilledMessage = val;
  }

  submitMeld() {
    // Update the meld points for each team in the service
    try {
      if (this.gameFormat?.label === '5-hand') {
        const primaryBidWinner =
          this.teams[this.gameState.bidWinningTeamIndices[0]];
        const primaryNonBidwinner = this.teams[this.nonBidWinnerTeamIndices[0]];
        if (
          !isValidNumber(primaryBidWinner.meldScore) ||
          !isValidNumber(primaryNonBidwinner.meldScore)
        ) {
          this.setNotAllInputsFilledMessage(
            'Please enter a meld score for each alliance'
          );
          throw new Error(
            'Meld score is required for each temporary alliance (5-hand)'
          );
        }
        this.teams.forEach((team, i) => {
          if (this.gameState.bidWinningTeamIndices.includes(i)) {
            team.meldScore = primaryBidWinner.meldScore;
          }
          if (this.nonBidWinnerTeamIndices.includes(i)) {
            team.meldScore = primaryNonBidwinner.meldScore;
          }
        });
      }

      this.teams.forEach(({ meldScore }) => {
        if (!isValidNumber(meldScore)) {
          this.setNotAllInputsFilledMessage();
          throw new Error('Meld score is required for each team');
        }
        if (hasDecimal(meldScore)) {
          this.setNotAllInputsFilledMessage(
            `Please enter a whole number for each ${
              this.gameFormat?.label === '5-hand' ? 'alliance' : 'team'
            }`
          );
          throw new Error('Meld amount must be a whole number');
        }
        if (meldScore < 0 || meldScore > 100000) {
          this.setNotAllInputsFilledMessage(
            'Allowed range for meld scores is between 0 and 100,000'
          );
          throw new Error(
            'Allowed range for meld scores is between 0 and 100,000'
          );
        }
      });

      this.gameStateService.setTeamsData(this.teams);
      // Navigate to the next stage (e.g., trick-taking)
      this.router.navigate(['/games/pinochle-scoreboard/trick-taking']);
    } catch (error) {
      console.error('submitMeld error: ', error);
    }
  }

  getDataForStatus(): GameState {
    return getDeepCopy(this.gameState);
  }

  goBack(): void {
    this.router.navigate(['/games/pinochle-scoreboard/bidding']);
  }

  showTeamMeldingInput(i: number): boolean {
    return showTeamInput5Hand(
      i,
      this.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices
    );
  }

  getMeldingComboName(i: number): string {
    return getTeamComboName5Hand(
      i,
      this.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices,
      this.teams
    );
  }
}
