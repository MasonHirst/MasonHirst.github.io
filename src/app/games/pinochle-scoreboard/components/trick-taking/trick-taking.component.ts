import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import {
  getDeepCopy,
  getTeamComboName5Hand,
  isValidNumber,
  showTeamInput5Hand,
} from 'src/app/games/games-helper-functions';
import { GameState } from '../../interfaces/gamestate.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trick-taking',
  templateUrl: './trick-taking.component.html',
  styleUrls: ['./trick-taking.component.css'],
})
export class TrickTakingComponent implements OnInit {
  teams: Team[] = null;
  gameState: GameState = null;
  gameFormat: GameFormat = null;
  private nonBidWinnerTeamIndices: number[] = null;
  noTrickPointsMessage: string;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService?.getCurrentGameState();
    this.teams = this.gameState?.teams;
    this.gameFormat = this.gameStateService?.getGameFormat();
    if (!Array.isArray(this.teams)) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    this.nonBidWinnerTeamIndices =
      this.gameStateService.getNonBidWinnerIndices();
  }

  setNoTrickPointsMessage(
    val: string = 'Please enter a tricking score for each team'
  ) {
    this.noTrickPointsMessage = val;
  }

  showTeamInput(i: number): boolean {
    return showTeamInput5Hand(
      i,
      this.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices
    );
  }

  getTeamComboName(i: number): string {
    return getTeamComboName5Hand(
      i,
      this.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices,
      this.teams
    );
  }

  getDataForStatus(): GameState {
    return getDeepCopy(this.gameState);
  }

  get primaryBidWinnerIndex(): number {
    return this.gameState.bidWinningTeamIndices[0];
  }
  get primaryNonBidWinnerIndex(): number {
    return this.nonBidWinnerTeamIndices[0];
  }

  get showCalculateButtons(): boolean {
    const { label, teamCount } = this.gameFormat;
    // Only show buttons for 3-hand and 8-hand
    return label !== '5-hand' && teamCount > 2;
  }

  goBack(): void {
    this.router.navigate(['/games/pinochle-scoreboard/melding']);
  }

  onTrickInputChange(teamIndex: number, isBlurEvent: boolean = false): void {
    this.setNoTrickPointsMessage('');
    if (!this.gameStateService.getGameSettings()?.autoCalculate) {
      return;
    }
    const inputPoints = this.teams?.[teamIndex]?.trickScore;
    const possibleTrickPoints = this.gameFormat.possibleTrickPoints;
    let otherInputIndex: number;
    if (this.gameFormat?.label === '5-hand') {
      otherInputIndex =
        teamIndex === this.primaryBidWinnerIndex
          ? this.primaryNonBidWinnerIndex
          : this.primaryBidWinnerIndex;
    } else {
      otherInputIndex = teamIndex === 0 ? 1 : 0;
    }
    if (inputPoints > possibleTrickPoints) {
      return;
    }
    if (isBlurEvent) {
      const otherTeamPoints = this.teams[otherInputIndex].trickScore;
      this.teams[teamIndex].trickScore = possibleTrickPoints - otherTeamPoints;
    } else {
      this.teams[otherInputIndex].trickScore =
        possibleTrickPoints - inputPoints;
    }

    //   if (isFiveHand) {
    // const primaryBidWinnerIndex = this.gameState.bidWinningTeamIndices[0];
    // const primaryNonBidWinnerIndex = this.nonBidWinnerTeamIndices[0];
    // const primaryBidScore = this.teams[primaryBidWinnerIndex].trickScore;
    // const primaryNonBidScore =
    //   this.teams[primaryNonBidWinnerIndex].trickScore;
    // if (isValidNumber(primaryBidScore)) {
    //   filledScores++;
    //   currentSum += primaryBidScore;
    // }
    // if (isValidNumber(primaryNonBidScore)) {
    //   filledScores++;
    //   currentSum += primaryNonBidScore;
    // }
    // if (filledScores == 1) {
    //   const remainingPoints = possibleTrickPoints - currentSum;
    //   if (!isValidNumber(primaryBidScore) && remainingPoints >= 0) {
    //     this.teams[primaryBidWinnerIndex].trickScore = remainingPoints;
    //   } else if (!isValidNumber(primaryNonBidScore) && remainingPoints >= 0) {
    //     this.teams[primaryNonBidWinnerIndex].trickScore = remainingPoints;
    //   }
    // }
    //   } else {
    //     const trickScoresArr = this.teams.map((team) => team.trickScore);
    //     trickScoresArr.forEach((score) => {
    //       if (isValidNumber(score)) {
    //         filledScores++;
    //         currentSum += score;
    //       }
    //     });
    //     if (filledScores == trickScoresArr.length - 1) {
    //       const remainingPoints = possibleTrickPoints - currentSum;
    //       for (let i = 0; i < trickScoresArr.length; i++) {
    //         if (!isValidNumber(trickScoresArr[i]) && remainingPoints >= 0) {
    //           this.teams[i].trickScore = remainingPoints;
    //           break;
    //         }
    //       }
    //     }
    //   }
  }

  // autoCalculateForTwoInputs(teamIndex: number, isFiveHand: boolean): void {
  //   const inputPoints = this.teams?.[teamIndex]?.trickScore;
  //   const possibleTrickPoints = this.gameFormat.possibleTrickPoints;
  //   let otherInputIndex: number;
  //   if (isFiveHand) {
  //     otherInputIndex =
  //       teamIndex === this.primaryBidWinnerIndex
  //         ? this.primaryNonBidWinnerIndex
  //         : this.primaryBidWinnerIndex;
  //   } else {
  //     otherInputIndex = teamIndex === 0 ? 1 : 0;
  //   }
  //   if (inputPoints > possibleTrickPoints) {
  //     return;
  //   }
  //   this.teams[otherInputIndex].trickScore = possibleTrickPoints - inputPoints;
  // }

  isEligibleForAutoCalculate(teamIndex: number): boolean {
    if (!this.gameStateService.getGameSettings()?.autoCalculate) {
      return false;
    }
    const { label, teamCount } = this.gameFormat;
    const isFiveHand = label === '5-hand';

    if (teamCount === 2) {
      const otherInputIndex = teamIndex === 0 ? 1 : 0;
      return !!this.teams?.[otherInputIndex]?.trickScore;
    } else if (isFiveHand) {
      const otherInputIndex =
        teamIndex === this.primaryBidWinnerIndex
          ? this.primaryNonBidWinnerIndex
          : this.primaryBidWinnerIndex;
      return !!this.teams?.[otherInputIndex]?.trickScore;
    } else {
      // write this
    }
  }

  async submitTricks(): Promise<void> {
    try {
      if (this.gameFormat.label === '5-hand') {
        const primaryBidWinner =
          this.teams[this.gameState.bidWinningTeamIndices[0]];
        const primaryNonBidwinner = this.teams[this.nonBidWinnerTeamIndices[0]];
        if (
          !isValidNumber(primaryBidWinner.trickScore) ||
          !isValidNumber(primaryNonBidwinner.trickScore)
        ) {
          this.setNoTrickPointsMessage(
            'Please enter a tricking score for each alliance'
          );
          throw new Error(
            'Tricking score is required for each temporary alliance (5-hand)'
          );
        }
        this.teams.forEach((team, i) => {
          if (this.gameState.bidWinningTeamIndices.includes(i)) {
            team.trickScore = primaryBidWinner.trickScore;
          }
          if (this.nonBidWinnerTeamIndices.includes(i)) {
            team.trickScore = primaryNonBidwinner.trickScore;
          }
        });
      }

      this.teams.forEach((team) => {
        if (!isValidNumber(team.trickScore)) {
          this.setNoTrickPointsMessage();
          throw new Error('Trick score is required for each team or alliance');
        }
      });

      const trickPointsSum = this.teams.reduce(
        (accumulator, currentValue) => accumulator + currentValue?.trickScore,
        0
      );

      if (trickPointsSum !== this.gameFormat?.possibleTrickPoints) {
        const result = await Swal.fire({
          title: 'Total does not match game format!',
          text: `The sum of all team's tricking points is ${trickPointsSum}. It should be ${this.gameFormat?.possibleTrickPoints}`,
          confirmButtonText: 'Save Anyway',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          reverseButtons: true,
        });
        if (!result.isConfirmed) {
          return;
        }
      }
      // Update the trick scores for each team in the game state
      this.gameStateService.setTeamsData(this.teams);

      // Navigate to the round summary or next stage
      this.router.navigate(['/games/pinochle-scoreboard/round-summary']);
    } catch (error) {
      console.error('Submit Tricks error: ', error);
    }
  }
}
