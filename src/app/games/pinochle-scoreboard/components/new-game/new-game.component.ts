import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
})
export class NewGameComponent implements OnInit {
  teams: Team[] = [];
  gameFormat: GameFormat;

  get formatLabel(): string {
    return this.gameFormat?.label;
  }

  constructor(
    private router: Router,
    private location: Location,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Get game format from service
    this.teams = this.gameStateService.getCurrentGameState()?.teams;
    this.gameFormat = this.gameStateService.getGameFormat();

    if (!this.teams || !this.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
  }

  goBack() {
    this.location.back();
  }

  startGame() {
    try {
      let namesArray = [];
      this.teams.forEach((team) => {
        if (!team.name.trim()) {
          throw new Error('Name for each team is required');
        }
        if (namesArray.includes(team.name)) {
          throw new Error('Multiple teams cannot have the same name');
        }
        namesArray.push(team.name);
      });

      // Initialize the game state with team names
      this.gameStateService.setTeamsData(this.teams);

      // Navigate to the bidding stage
      this.router.navigate(['/games/pinochle-scoreboard/bidding']);
    } catch (error) {
      console.error('Error in new-game.component.ts: ', error);
    }
  }
}
