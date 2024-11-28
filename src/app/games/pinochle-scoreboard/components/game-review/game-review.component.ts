import { Component, OnInit } from '@angular/core';
import { GameData } from '../../interfaces/gamedata.interface';
import { Team } from '../../interfaces/team.interface';
import { GameState } from '../../interfaces/gamestate.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameSettings } from '../../interfaces/gamesettings.interface';
import { getPinochleAddedScore } from 'src/app/games/games-helper-functions';

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
  }

  get teams(): Team[] {
    return this.gameData?.currentGameState?.teams;
  }

  get roundHistory(): GameState[] {
    return this.gameData?.roundHistory;
  }

  get isTie(): boolean {
    const highScore = this.getWinningTeamScore();
    const winnerName = this.getWinningTeam().name;
    let isTieScore = false;
    this.teams.forEach((team) => {
      if (
        getPinochleAddedScore(team) === highScore &&
        winnerName !== team.name
      ) {
        isTieScore = true;
      }
    });
    return isTieScore;
  }

  getWinningTeams(): Team[] {
    let winners = [];
    const highScore = this.getWinningTeamScore();
    this.teams.forEach((team) => {
      if (getPinochleAddedScore(team) === highScore) {
        winners.push(team);
      }
    });
    return winners;
  }

  getWinningTeam(): Team {
    return this.teams.reduce((prev, curr) =>
      curr.currentTotalScore + curr.roundSubTotal >
      prev.currentTotalScore + prev.roundSubTotal
        ? curr
        : prev
    );
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  getWinningTeamScore(): number {
    return getPinochleAddedScore(this.getWinningTeam());
  }

  exit(): void {
    this.router.navigate(['/games/pinochle-scoreboard']);
  }
}
