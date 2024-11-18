import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { GameData } from '../../interfaces/gamedata.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-format-select',
  templateUrl: './format-select.component.html',
  styleUrls: ['./format-select.component.css'],
})
export class FormatSelectComponent implements OnInit {
  public gameFormats: GameFormat[] = [
    {
      label: '3-hand',
      description: '3 teams of 1 player',
      teamCount: 3,
      possibleTrickPoints: 250,
    },
    {
      label: '4-hand',
      description: '2 teams of 2 players',
      teamCount: 2,
      possibleTrickPoints: 250,
    },
    {
      label: '5-hand',
      description: '5 teams of 1 player',
      teamCount: 5,
      possibleTrickPoints: 500,
    },
    {
      label: '6-hand',
      description: '2 teams of 3 players',
      teamCount: 2,
      possibleTrickPoints: 500,
    },
    {
      label: '8-hand',
      description: '4 teams of 2 players',
      teamCount: 4,
      possibleTrickPoints: 500,
    },
  ];

  gamesFromIndexedDB: GameData[];

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.getGamesFromIndexedDB();
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
          this.gameStateService?.setGameData(activeGame);
          this.router.navigate(['/games/pinochle-scoreboard/bidding']);
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
