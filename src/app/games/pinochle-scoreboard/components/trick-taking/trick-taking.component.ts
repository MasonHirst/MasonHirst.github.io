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

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.teams = this.gameStateService?.getCurrentGameState()?.teams;
    this.gameFormat = this.gameStateService?.getGameFormat();
    if (!Array.isArray(this.teams)) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    this.gameState = this.gameStateService.getCurrentGameState();
    this.nonBidWinnerTeamIndices =
      this.gameStateService.getNonBidWinnerIndices();
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

  goBack(): void {
    this.router.navigate(['/games/pinochle-scoreboard/melding']);
  }

  onTrickInputChange(): void {
    if (!this.gameStateService.getGameSettings()?.autoCalculate) {
      return;
    }
    const gameFormat = this.gameStateService.getGameFormat();
    const possibleTrickPoints = gameFormat.possibleTrickPoints;
    const isFiveHand = gameFormat.label === '5-hand';
    let filledScores = 0;
    let currentSum = 0;
    if (isFiveHand) {
      const primaryBidWinnerIndex = this.gameState.bidWinningTeamIndices[0];
      const primaryNonBidWinnerIndex = this.nonBidWinnerTeamIndices[0];
      const primaryBidScore = this.teams[primaryBidWinnerIndex].trickScore;
      const primaryNonBidScore =
        this.teams[primaryNonBidWinnerIndex].trickScore;

      if (isValidNumber(primaryBidScore)) {
        filledScores++;
        currentSum += primaryBidScore;
      }
      if (isValidNumber(primaryNonBidScore)) {
        filledScores++;
        currentSum += primaryNonBidScore;
      }
      if (filledScores == 1) {
        const remainingPoints = possibleTrickPoints - currentSum;
        if (!isValidNumber(primaryBidScore) && remainingPoints >= 0) {
          this.teams[primaryBidWinnerIndex].trickScore = remainingPoints;
        } else if (!isValidNumber(primaryNonBidScore) && remainingPoints >= 0) {
          this.teams[primaryNonBidWinnerIndex].trickScore = remainingPoints;
        }
      }
    } else {
      const trickScoresArr = this.teams.map((team) => team.trickScore);
      trickScoresArr.forEach((score) => {
        if (isValidNumber(score)) {
          filledScores++;
          currentSum += score;
        }
      });
      if (filledScores == trickScoresArr.length - 1) {
        const remainingPoints = possibleTrickPoints - currentSum;
        for (let i = 0; i < trickScoresArr.length; i++) {
          if (!isValidNumber(trickScoresArr[i]) && remainingPoints >= 0) {
            this.teams[i].trickScore = remainingPoints;
            break;
          }
        }
      }
    }
  }

  submitTricks() {
    try {
      if (this.gameFormat.label === '5-hand') {
        const primaryBidWinner =
          this.teams[this.gameState.bidWinningTeamIndices[0]];
        const primaryNonBidwinner = this.teams[this.nonBidWinnerTeamIndices[0]];
        if (
          !isValidNumber(primaryBidWinner.trickScore) ||
          !isValidNumber(primaryNonBidwinner.trickScore)
        ) {
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
          throw new Error('Trick score is required for each team or alliance');
        }
      });

      
      
      // Update the trick scores for each team in the game state
      this.gameStateService.setTeamsData(this.teams);

      // Navigate to the round summary or next stage
      this.router.navigate(['/games/pinochle-scoreboard/round-summary']);
    } catch (error) {
      console.error('Submit Tricks error: ', error);
    }
  }
}
