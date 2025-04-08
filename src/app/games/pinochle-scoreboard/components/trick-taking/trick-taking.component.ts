import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import {
  getDeepCopy,
  getTeamComboName5Hand,
  hasDecimal,
  isBoolean,
  isValidNumber,
  showTeamInput5Hand,
} from 'src/app/games/games-helper-functions';
import { GameState } from '../../interfaces/gamestate.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import Swal from 'sweetalert2';
import { GameSettings } from '../../interfaces/gamesettings.interface';

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
  noDidTakeTrickMessage: string;
  gameSettings: GameSettings;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService?.getCurrentGameState();
    this.teams = this.gameState?.teams;
    if (!isValidNumber(this.teams?.[0]?.meldScore)) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    this.gameFormat = this.gameStateService?.getGameFormat();
    this.nonBidWinnerTeamIndices =
      this.gameStateService.getNonBidWinnerIndices();
    this.gameSettings = this.gameStateService.getGameSettings();
    this.gameStateService.gameSettingsEmit.subscribe((newVal) => {
      this.gameSettings = newVal;
    });
  }

  setNoTrickPointsMessage(
    val: string = 'Please enter a tricking score for each team'
  ) {
    this.noTrickPointsMessage = val;
  }

  setNoDidTakeTrickMessage(
    val: string = 'Please indicate if this team won a trick'
  ) {
    this.noDidTakeTrickMessage = val;
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

  get showCustomFlag(): boolean {
    return isValidNumber(
      this.gameSettings?.customTrickPoints[this.gameFormat?.label]
    );
  }

  get primaryBidWinnerIndex(): number {
    return this.gameState.bidWinningTeamIndices[0];
  }
  get primaryNonBidWinnerIndex(): number {
    return this.nonBidWinnerTeamIndices[0];
  }

  get showCalculateButtons(): boolean {
    const { label, teamCount } = this.gameFormat || {};
    // Only show buttons for 3-hand and 8-hand
    return label !== '5-hand' && teamCount > 2;
  }

  get primaryBidWinner(): Team {
    return this.teams[this.gameState.bidWinningTeamIndices[0]];
  }

  get primaryNonBidwinner(): Team {
    return this.teams[this.nonBidWinnerTeamIndices[0]];
  }

  goBack(): void {
    this.router.navigate(['/games/pinochle-scoreboard/melding']);
  }

  get bidWinners(): number[] {
    return this.gameState.bidWinningTeamIndices;
  }

  get pointsNeededToReachBid(): number {
    const pointsNeeded = this.gameState?.currentBid - this.teams[this.bidWinners[0]]?.meldScore
    return pointsNeeded;
  }

  resetForTrickPointsChange(i: number): void {
    this.setNoTrickPointsMessage('');
    this.teams[i].didTakeTrick = null;
  }

  onTrickInputChange(teamIndex: number, isBlurEvent: boolean = false): void {
    this.resetForTrickPointsChange(teamIndex);
    if (!isValidNumber(this.teams?.[teamIndex]?.trickScore)) {
      return;
    }
    if (!this.gameSettings?.autoCalculate) {
      return;
    }
    const inputPoints = this.teams?.[teamIndex]?.trickScore;
    let otherInputIndex: number;
    if (this.gameFormat?.label === '5-hand') {
      otherInputIndex =
        teamIndex === this.primaryBidWinnerIndex
          ? this.primaryNonBidWinnerIndex
          : this.primaryBidWinnerIndex;
    } else {
      otherInputIndex = teamIndex === 0 ? 1 : 0;
    }
    if (inputPoints > this.possibleTricks) {
      return;
    }
    if (isBlurEvent) {
      const otherTeamPoints = this.teams[otherInputIndex].trickScore;
      this.teams[teamIndex].trickScore = this.possibleTricks - otherTeamPoints;
      this.teams[teamIndex].didTakeTrick = null;
    } else {
      this.teams[otherInputIndex].trickScore =
        this.possibleTricks - inputPoints;
      this.teams[otherInputIndex].didTakeTrick = null;
    }
    this.setNoDidTakeTrickMessage('');
  }

  get trickSubTotal(): number {
    let tricksTotal: number = 0;
    if (this.gameFormat?.label === '5-hand') {
      tricksTotal += this.teams?.[this.nonBidWinnerTeamIndices[0]]?.trickScore;
      tricksTotal +=
        this.teams?.[this.bidWinners?.[0]]?.trickScore;
    } else {
      this.teams?.forEach((team) => {
        tricksTotal += team.trickScore;
      });
    }
    return tricksTotal;
  }

  get possibleTricks(): number {
    const { label, possibleTrickPoints: defaultTricks } = this.gameFormat || {};
    const customVal = this.gameSettings?.customTrickPoints?.[label];
    return isValidNumber(customVal) && customVal > 0
      ? customVal
      : defaultTricks;
  }

  isEligibleForAutoCalculateButton(teamIndex: number): boolean {
    // only for 3-hand and 8-hand formats
    let otherTeamsAllFilled: boolean = true;
    let otherTeamsTotal: number = 0;
    this.teams?.forEach((team, i) => {
      if (teamIndex !== i) {
        if (!isValidNumber(team.trickScore)) {
          otherTeamsAllFilled = false;
        } else {
          otherTeamsTotal += team.trickScore;
        }
      }
    });
    const thisTeamScore = this.teams?.[teamIndex]?.trickScore;
    if (
      isValidNumber(thisTeamScore) &&
      otherTeamsTotal + thisTeamScore === this.possibleTricks
    ) {
      return false;
    }
    const caseOneValid: boolean =
      otherTeamsTotal === this.possibleTricks && !isValidNumber(thisTeamScore);
    const caseTwoValid: boolean =
      otherTeamsAllFilled && otherTeamsTotal <= this.possibleTricks;
    return caseOneValid || caseTwoValid;
  }

  calculateTrickPoints(teamIndex: number): void {
    let otherTeamsTotal: number = 0;
    this.teams?.forEach((team, i) => {
      if (teamIndex !== i) {
        otherTeamsTotal += team.trickScore;
      }
    });
    this.teams[teamIndex].trickScore = this.possibleTricks - otherTeamsTotal;
    this.teams[teamIndex].didTakeTrick = null;
    this.setNoDidTakeTrickMessage('');
  }

  async submitTricks(): Promise<void> {
    try {
      this.setNoDidTakeTrickMessage('');
      if (this.gameFormat?.label === '5-hand') {
        if (
          !isValidNumber(this.primaryBidWinner.trickScore) ||
          !isValidNumber(this.primaryNonBidwinner.trickScore)
        ) {
          this.setNoTrickPointsMessage(
            'Please enter a tricking score for each alliance'
          );
          throw new Error(
            'Tricking score is required for each temporary alliance (5-hand)'
          );
        }

        if (this.primaryBidWinner.trickScore > 0) {
          this.teams[this.primaryBidWinnerIndex].didTakeTrick = true;
        }
        if (this.primaryNonBidwinner.trickScore > 0) {
          this.teams[this.primaryNonBidWinnerIndex].didTakeTrick = true;
        }

        this.teams.forEach((team, i) => {
          if (this.gameState.bidWinningTeamIndices.includes(i)) {
            team.trickScore = this.primaryBidWinner.trickScore;
            team.didTakeTrick = this.primaryBidWinner.didTakeTrick;
          }
          if (this.nonBidWinnerTeamIndices.includes(i)) {
            team.trickScore = this.primaryNonBidwinner.trickScore;
            team.didTakeTrick = this.primaryNonBidwinner.didTakeTrick;
          }
        });
      } else {
        this.teams.forEach((team) => {
          if (team.trickScore > 0) {
            team.didTakeTrick = true;
          }
        });
      }

      this.teams.forEach(({ trickScore, didTakeTrick }) => {
        if (!isValidNumber(trickScore)) {
          this.setNoTrickPointsMessage();
          throw new Error('Trick score is required for each team or alliance');
        }
        if (hasDecimal(trickScore)) {
          this.setNoTrickPointsMessage(
            `Please enter a whole number for each ${
              this.gameFormat?.label === '5-hand' ? 'alliance' : 'team'
            }`
          );
          throw new Error('Trick amount must be a whole number');
        }
        if (!isBoolean(didTakeTrick)) {
          this.setNoDidTakeTrickMessage();
          throw new Error('Did take trick must be a boolean');
        }
        if (trickScore < 0 || trickScore > 100000) {
          this.setNoTrickPointsMessage(
            'Allowed range for trick scores is between 0 and 100,000'
          );
          throw new Error(
            'Allowed range for trick scores is between 0 and 100,000'
          );
        }
      });

      let trickPointsSum: number = this.teams.reduce(
        (accumulator, currentValue) => accumulator + currentValue?.trickScore,
        0
      );

      if (this.gameFormat?.label === '5-hand') {
        trickPointsSum =
          this.teams[this.nonBidWinnerTeamIndices[0]].trickScore +
          this.teams[this.gameState.bidWinningTeamIndices[0]].trickScore;
      }

      if (trickPointsSum !== this.possibleTricks) {
        const result = await Swal.fire({
          title: 'Total does not match game format!',
          text: `The sum of all team's tricking points is ${trickPointsSum}. It should be ${this.possibleTricks}.`,
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
