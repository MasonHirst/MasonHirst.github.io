import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import { GameFormat } from '../../interfaces/gameformat.interface';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
})
export class NewGameComponent implements OnInit {
  teams: Team[] = [];
  gameFormat: GameFormat;
  noNameMessage: string = '';

  setNoNameMessage(val: string = 'Please enter a name for each team'): void {
    this.noNameMessage = val;
  }

  onNameInputChange(): void {
    this.setNoNameMessage('');
  }

  get formatLabel(): string {
    return this.gameFormat?.label;
  }

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Get game format from service
    this.teams = this.gameStateService?.getCurrentGameState()?.teams;
    this.gameFormat = this.gameStateService?.getGameFormat();

    if (!this.teams || !this.gameFormat) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
  }

  goBack() {
    this.router.navigate(['/games/pinochle-scoreboard']);
  }

  startGame() {
    try {
      let namesArray = [];
      this.teams.forEach((team) => {
        if (!team.name.trim()) {
          this.setNoNameMessage();
          throw new Error('Name for each team is required');
        }
        if (namesArray.includes(team.name)) {
          this.setNoNameMessage('Each team name must be unique');
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
