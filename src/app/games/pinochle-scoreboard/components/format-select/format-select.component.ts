import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameData } from '../../interfaces/gamedata.interface';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import {
  formatTimestampForPinochle,
  getDefaultPinochleFormats,
  isValidNumber,
} from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-format-select',
  templateUrl: './format-select.component.html',
  styleUrls: ['./format-select.component.css'],
})
export class FormatSelectComponent implements OnInit {
  public gameFormats: GameFormat[] = getDefaultPinochleFormats();
  public activeSavedGame: GameData;
  public pastEndedGames: GameData[];
  public gamesFromIndexedDB: GameData[];

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.getGamesFromIndexedDB();
  }

  get formattedTimeForSavedGame(): string {
    return formatTimestampForPinochle(this.activeSavedGame?.gameStartTime);
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

      this.pastEndedGames = this.gamesFromIndexedDB.filter(
        (game) => !game.gameIsActive
      );

      if (activeGame) {
        this.activeSavedGame = activeGame;
      } else {
        this.activeSavedGame = null;
      }
    }
  }

  continueSavedActiveGame(): void {
    if (!this.activeSavedGame?.gameFormat?.label) {
      return console.error('No valid game to resume!');
    }
    this.resumeGameFromDB(this.activeSavedGame);
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

  togglePastGamesModal(open: boolean = true): void {
    const modalElement = document.getElementById('pinochle-past-games-modal');
    if (!modalElement) {
      console.error('Modal element not found!');
      return;
    }
    const settingsModal = Modal.getOrCreateInstance(modalElement);
    if (open) {
      settingsModal.show();
    } else {
      settingsModal.hide();
    }
  }

  handleOpenSavedGame(game: GameData): void {
    this.togglePastGamesModal(false);
    this.router.navigate(['/games/pinochle-scoreboard/game-review', game.id]);
  }
}
