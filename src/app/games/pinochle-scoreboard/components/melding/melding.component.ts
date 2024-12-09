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
const FIVE_HAND = '5-hand';

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
      if (this.gameFormat?.label === FIVE_HAND) {
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

  get bidWinners(): number[] {
    return this.gameState?.bidWinningTeamIndices;
  }

  submitMeld() {
    // Update the meld points for each team in the service
    try {
      if (this.gameFormat?.label === FIVE_HAND) {
        // const primaryBidWinner = this.teams[this.bidWinners[0]];
        // const primaryNonBidwinner = this.teams[this.nonBidWinnerTeamIndices[0]];

        this.teams.forEach((team, i) => {
          if (i !== this.bidWinners[1] && !isValidNumber(team.meldScore)) {
            this.setNotAllInputsFilledMessage(
              'Please enter a meld score for each alliance'
            );
            throw new Error(
              'Meld score is required for each temporary alliance (5-hand)'
            );
          }
        });

        // if (
        //   !isValidNumber(primaryBidWinner.meldScore) ||
        //   !isValidNumber(primaryNonBidwinner.meldScore)
        // ) {
        //   this.setNotAllInputsFilledMessage(
        //     'Please enter a meld score for each alliance'
        //   );
        //   throw new Error(
        //     'Meld score is required for each temporary alliance (5-hand)'
        //   );
        // }

        // this.teams.forEach((team, i) => {
        //   if (this.gameState.bidWinningTeamIndices.includes(i)) {
        //     team.meldScore = primaryBidWinner.meldScore;
        //   }
        //   if (this.nonBidWinnerTeamIndices.includes(i)) {
        //     team.meldScore = primaryNonBidwinner.meldScore;
        //   }
        // });
        this.teams[this.bidWinners[1]].meldScore =
          this.teams[this.bidWinners[0]].meldScore;
      }

      this.teams.forEach(({ meldScore }) => {
        if (!isValidNumber(meldScore)) {
          this.setNotAllInputsFilledMessage();
          throw new Error('Meld score is required for each team');
        }
        if (hasDecimal(meldScore)) {
          this.setNotAllInputsFilledMessage(
            `Please enter a whole number for each ${
              this.gameFormat?.label === FIVE_HAND ? 'alliance' : 'team'
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

  // showTeamMeldingInput(i: number): boolean {
  //   return showTeamInput5Hand(
  //     i,
  //     this.gameFormat,
  //     this.gameState?.bidWinningTeamIndices,
  //     this.nonBidWinnerTeamIndices
  //   );
  // }

  getMeldingComboName(i: number): string {
    if (i === this.gameState.bidWinningTeamIndices[0]) {
      return getTeamComboName5Hand(
        i,
        this.gameFormat,
        this.gameState?.bidWinningTeamIndices,
        this.nonBidWinnerTeamIndices,
        this.teams
      );
    } else {
      return this.teams[i]?.name;
    }
  }
}
