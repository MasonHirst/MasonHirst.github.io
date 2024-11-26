import { Component, OnInit } from '@angular/core';
import { GameData } from '../../interfaces/gamedata.interface';
import { Team } from '../../interfaces/team.interface';
import { GameState } from '../../interfaces/gamestate.interface';
import { ActivatedRoute, Router } from '@angular/router';
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
  savedGameId!: string;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.gameSettings = this.gameStateService?.getGameSettings();
    this.savedGameId = this.route.snapshot.paramMap.get('id')!;
    if (this.savedGameId) {
      const game = await this.gameStateService.findSavedGameById(
        this.savedGameId
      );
      if (!game) {
        return console.error('Found no game with this ID');
      }
      this.gameData = game;
    } 
    // else {
    //   this.gameData = this.gameStateService?.getAllGameData();
    //   this.gameStateService.gameSettingsEmit.subscribe((newVal) => {
    //     this.gameSettings = newVal;
    //   });
    //   if (!Array.isArray(this.gameData?.roundHistory?.[0]?.teams)) {
    //     // this.router.navigate(['/games/pinochle-scoreboard']);
    //   }
    // }
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
    this.router.navigate(['/games/pinochle-scoreboard']);
  }
}
