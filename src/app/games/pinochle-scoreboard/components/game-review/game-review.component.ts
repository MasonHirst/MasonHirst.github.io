import { Component, OnInit } from '@angular/core';
import { GameData } from '../../interfaces/gamedata.interface';
import { Team } from '../../interfaces/team.interface';
import { GameState } from '../../interfaces/gamestate.interface';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameSettings } from '../../interfaces/gamesettings.interface';

@Component({
  selector: 'app-game-review',
  templateUrl: './game-review.component.html',
  styleUrls: ['./game-review.component.css'],
})
export class GameReviewComponent implements OnInit {
  gameData: GameData;
  gameSettings: GameSettings;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.gameData = this.gameStateService?.getAllGameData();
    this.gameSettings = this.gameStateService?.getGameSettings();
    this.gameStateService.gameSettingsEmit.subscribe((newVal) => {
      this.gameSettings = newVal;
    });
    if (!Array.isArray(this.gameData?.roundHistory?.[0]?.teams)) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
  }

  get teams(): Team[] {
    return this.gameData?.currentGameState?.teams;
  }

  get roundHistory(): GameState[] {
    return this.gameData?.roundHistory;
  }

  getWinningTeam(): Team {
    return this.teams.reduce((prev, curr) =>
      curr.currentTotalScore > prev.currentTotalScore ? curr : prev
    );
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  exit(): void {
    this.router.navigate(['/games']);
  }

  playAgain(): void {
    this.router.navigate(['/games/pinochle-scoreboard']);
  }
}
