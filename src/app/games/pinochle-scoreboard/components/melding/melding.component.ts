import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import { Location } from '@angular/common';
import {
  getTeamComboName5Hand,
  isValidNumber,
  showTeamInput5Hand,
} from 'src/app/games/games-helper-functions';
import { GameState } from '../../interfaces/gamestate.interface';

@Component({
  selector: 'app-melding',
  templateUrl: './melding.component.html',
  styleUrls: ['./melding.component.css'],
})
export class MeldingComponent implements OnInit {
  teams: Team[] = [];
  gameState: GameState = null;
  nonBidWinnerTeamIndices: number[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Get the teams from the game state service and initialize meld points for each team
    if (!this.gameStateService.getCurrentGameState()) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }

    const teams = this.gameStateService.getCurrentGameState()?.teams;
    if (Array.isArray(teams)) {
      this.teams = teams;
      this.gameState = this.gameStateService?.getCurrentGameState();
      if (this.gameState?.gameFormat?.label === '5-hand') {
        this.nonBidWinnerTeamIndices =
          this.gameStateService.getNonBidWinnerIndices();
      }
    }
  }

  submitMeld() {
    // Update the meld points for each team in the service
    try {
      if (this.gameState.gameFormat.label === '5-hand') {
        const primaryBidWinner =
          this.teams[this.gameState.bidWinningTeamIndices[0]];
        const primaryNonBidwinner = this.teams[this.nonBidWinnerTeamIndices[0]];
        if (
          !isValidNumber(primaryBidWinner.meldScore) ||
          !isValidNumber(primaryNonBidwinner.meldScore)
        ) {
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

      this.teams.forEach((team) => {
        if (!isValidNumber(team.meldScore)) {
          throw new Error('Meld score is required for each team');
        }
      });

      this.gameStateService.setTeamsData(this.teams);
      // Navigate to the next stage (e.g., trick-taking)
      this.router.navigate(['/games/pinochle-scoreboard/trick-taking']);
    } catch (error) {
      console.error('submitMeld error: ', error);
    }
  }

  goBack() {
    this.location.back();
  }

  showTeamMeldingInput(i: number): boolean {
    return showTeamInput5Hand(
      i,
      this.gameState?.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices
    );
  }

  getMeldingComboName(i: number): string {
    return getTeamComboName5Hand(
      i,
      this.gameState?.gameFormat,
      this.gameState?.bidWinningTeamIndices,
      this.nonBidWinnerTeamIndices,
      this.teams
    );
  }
}
