import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import { Location } from '@angular/common';
import { formatSubScore } from 'src/app/games/games-helper-functions';
import { Team } from '../../interfaces/team.interface';

@Component({
  selector: 'app-round-summary',
  templateUrl: './round-summary.component.html',
  styleUrls: ['./round-summary.component.css'],
})
export class RoundSummaryComponent implements OnInit {
  gameState: GameState;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService?.getCurrentGameState();
    if (!Array.isArray(this.gameState?.teams) || !this.gameState?.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    this.calculateTeamScores();
  }

  get getBidWinningTeamName(): string {
    return this.gameState?.teams[this.gameState.bidWinningTeamIndices[0]].name;
  }

  get nextRoundButtonText(): string {
    return `Start Round ${this.gameState.roundNumber + 1}`;
  }

  getTotalScoreWithRoundTotal(team: Team): number {
    return team.roundSubTotal + team.currentTotalScore;
  }

  goBack(): void {
    this.router.navigate(['/games/pinochle-scoreboard/trick-taking']);
  }

  calculateTeamScores(): void {
    this.gameState?.teams.forEach((team, i) => {
      const isBidWinning = this.gameState?.bidWinningTeamIndices?.includes(i);
      const pointsEarned =
        team.trickScore > 0 ? team.meldScore + team.trickScore : 0;

      if (isBidWinning && pointsEarned < this.gameState.currentBid) {
        team.roundSubTotal = -this.gameState?.currentBid;
      } else {
        team.roundSubTotal = pointsEarned;
      }
    });
    this.gameStateService?.setTeamsData(this.gameState?.teams);
  }

  startNewRound(): void {
    this.gameStateService.saveRoundToHistory();
    this.gameState.trumpSuit = null;
    this.gameState.bidWinningTeamIndices = null;
    this.gameState.currentBid = null;
    this.gameState.roundNumber++;
    this.gameState.teams.forEach((team) => {
      team.currentTotalScore += team.roundSubTotal;
      team.meldScore = null;
      team.trickScore = null;
      team.roundSubTotal = null;
    });

    this.gameStateService.setCurrentGameState(this.gameState);
    this.router.navigate(['/games/pinochle-scoreboard/bidding']);
  }

  endGame(): void {
    this.gameState.gameIsActive = false;
    this.router.navigate(['/games']);
  }

  formatSubtotal(val: number): string | number {
    return formatSubScore(val);
  }
}
