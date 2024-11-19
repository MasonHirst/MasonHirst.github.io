import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import { Location } from '@angular/common';
import { formatSubScore } from 'src/app/games/games-helper-functions';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-round-summary',
  templateUrl: './round-summary.component.html',
  styleUrls: ['./round-summary.component.css'],
})
export class RoundSummaryComponent implements OnInit {
  gameState: GameState;
  gameFormat: GameFormat;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService?.getCurrentGameState();
    this.gameFormat = this.gameStateService?.getGameFormat();
    if (!Array.isArray(this.gameState?.teams) || !this.gameFormat) {
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

  async endGame(): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will end the game',
      confirmButtonText: 'End Game',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      this.gameStateService?.setGameActiveStatus(false);
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
  }

  formatSubtotal(val: number): string | number {
    return formatSubScore(val);
  }
}
