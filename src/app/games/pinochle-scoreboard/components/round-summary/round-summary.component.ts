import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameState } from '../../interfaces/gamestate.interface';
import { Location } from '@angular/common';
import { formatSubScore, getDeepCopy } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-round-summary',
  templateUrl: './round-summary.component.html',
  styleUrls: ['./round-summary.component.css'],
})
export class RoundSummaryComponent implements OnInit {
  gameState: GameState;

  constructor(
    private router: Router,
    private location: Location,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameState = this.gameStateService.getCurrentGameState();

    if (!Array.isArray(this.gameState?.teams) || !this.gameState?.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }

    // Calculate total scores for each team after the round
    this.calculateTeamScores();
  }

  goBack(): void {
    this.location.back();
  }

  calculateTeamScores(): void {
    this.gameState?.teams.forEach((team, i) => {
      const isBidWinning = this.gameState?.bidWinningTeamIndeces?.includes(i);
      const pointsEarned =
        team.trickScore > 0 ? team.meldScore + team.trickScore : 0;

      if (isBidWinning && pointsEarned < this.gameState.currentBid) {
        team.roundSubTotal = -this.gameState?.currentBid;
      } else {
        team.roundSubTotal = pointsEarned; 
      }
      team.currentTotalScore += team.roundSubTotal;
    });
    this.gameStateService?.setTeamsData(this.gameState?.teams)
  }

  startNewRound(): void {
    this.gameStateService.saveRoundToHistory();
    
    this.gameState.trumpSuit = null;
    this.gameState.bidWinningTeamIndeces = null;
    this.gameState.currentBid = null;
    this.gameState.roundNumber++;
    this.gameState.teams.forEach(team => {
      team.meldScore = null;
      team.trickScore = null;
      team.roundSubTotal = null;
    })

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
