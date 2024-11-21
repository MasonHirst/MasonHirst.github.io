import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameData } from '../../interfaces/gamedata.interface';
import Swal from 'sweetalert2';
import { getDefaultPinochleFormats, isValidNumber } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-format-select',
  templateUrl: './format-select.component.html',
  styleUrls: ['./format-select.component.css'],
})
export class FormatSelectComponent implements OnInit {
  public gameFormats: GameFormat[] = getDefaultPinochleFormats();

  gamesFromIndexedDB: GameData[];

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.getGamesFromIndexedDB();
  }

  resumeGameFromDB(game: GameData): void {
    if (!game) {
      return;
    }
    this.gameStateService?.setGameData(game);
    const { teams, currentBid } = game.currentGameState;
    let allTeamsMelded: boolean = true;
    let allTeamsTricked: boolean = true;
    teams.forEach((team) => {
      if (!isValidNumber(team.meldScore)) {
        allTeamsMelded = false;
      }
    });
    teams.forEach((team) => {
      if (!isValidNumber(team.trickScore)) {
        allTeamsTricked = false;
      }
    });
    if (!!currentBid && allTeamsMelded && allTeamsTricked) {
      this.router.navigate(['/games/pinochle-scoreboard/round-summary']);
    } else if (!!currentBid && allTeamsMelded) {
      this.router.navigate(['/games/pinochle-scoreboard/trick-taking']);
    } else if (!!currentBid) {
      this.router.navigate(['/games/pinochle-scoreboard/melding']);
    } else {
      this.router.navigate(['/games/pinochle-scoreboard/bidding']);
    }
  }

  async getGamesFromIndexedDB(): Promise<void> {
    this.gamesFromIndexedDB = await this.gameStateService?.getGamesFromDB();

    if (this.gamesFromIndexedDB?.length) {
      const activeGame = this.gamesFromIndexedDB.find(
        (game) => game.gameIsActive
      );

      if (activeGame) {
        const result = await Swal.fire({
          title: 'Continue game?',
          text: 'You have a game in progress. Would you like to continue?',
          confirmButtonText: 'Continue game',
          showCancelButton: true,
          cancelButtonText: 'Close',
          reverseButtons: true,
        });
        if (result.isConfirmed) {
          this.resumeGameFromDB(activeGame);
        }
      }
    }
  }

  async startNewGame(format: GameFormat) {
    const activeGame = this.gamesFromIndexedDB?.find(
      (game: GameData) => game?.gameIsActive
    );
    if (activeGame) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You have a game in progress. If you start a new game, your saved game will be ended.',
        confirmButtonText: 'Start anyway',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      });
      if (!result.isConfirmed) {
        return;
      }
    }

    this.gameStateService.startNewGameFormat(format);
    // Navigate to the new-game component
    this.router.navigate(['/games/pinochle-scoreboard/new-game']);
  }
}
