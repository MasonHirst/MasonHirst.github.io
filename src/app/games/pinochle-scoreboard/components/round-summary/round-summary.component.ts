import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import { formatSubScore, isValidNumber } from 'src/app/games/games-helper-functions';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import Swal from 'sweetalert2';
import { GameSettings } from '../../interfaces/gamesettings.interface';

@Component({
  selector: 'app-round-summary',
  templateUrl: './round-summary.component.html',
  styleUrls: ['./round-summary.component.css'],
})
export class RoundSummaryComponent implements OnInit {
  gameState: GameState;
  gameFormat: GameFormat;
  gameSettings: GameSettings;
  roundHistory: GameState[];

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService?.getCurrentGameState();
    this.gameFormat = this.gameStateService?.getGameFormat();
    this.roundHistory = this.gameStateService?.getAllGameData()?.roundHistory;
    this.gameSettings = this.gameStateService?.getGameSettings();
    this.gameStateService.gameSettingsEmit.subscribe((newVal) => {
      this.gameSettings = newVal;
    });
    
    if (
      !Array.isArray(this.gameState?.teams) ||
      !this.gameFormat ||
      !this.gameState?.currentBid ||
      !isValidNumber(this.gameState?.teams?.[0]?.trickScore) ||
      !isValidNumber(this.gameState?.teams?.[0]?.meldScore)
    ) {
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
      // if didTakeTrick is false, they don't get meld points
      const pointsEarned = team.didTakeTrick ? team.meldScore + team.trickScore : 0;

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
    this.gameStateService?.resetCurrentGameStateForNewRound();
    this.router.navigate(['/games/pinochle-scoreboard/bidding']);
  }

  async endGame(): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will end the game.',
      confirmButtonText: 'End Game',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      this.gameStateService?.setGameActiveStatus(false);
      this.gameStateService?.saveRoundToHistory();
      this.gameStateService?.resetCurrentGameStateForNewRound();
      this.router.navigate([
        `/games/pinochle-scoreboard/game-review/${
          this.gameStateService.getAllGameData().id
        }`,
      ]);
    }
  }

  formatSubtotal(val: number): string | number {
    return formatSubScore(val);
  }
}
