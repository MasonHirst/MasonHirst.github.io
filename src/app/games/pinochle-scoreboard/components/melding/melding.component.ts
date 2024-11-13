import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import { Location } from '@angular/common';
import { isValidNumber } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-melding',
  templateUrl: './melding.component.html',
  styleUrls: ['./melding.component.css'],
})
export class MeldingComponent implements OnInit {
  teams: Team[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    // Get the teams from the game state service and initialize meld points for each team
    if (!this.gameStateService.getGameState()) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }
    this.teams = [...this.gameStateService.getGameState()?.teams];
  }

  submitMeld() {
    // Update the meld points for each team in the service
    try {
      this.teams.forEach((team) => {
        if (!isValidNumber(team.meldScore)) {
          throw new Error('Meld score is required for each team');
        }
      });
      this.gameStateService.setMeldPoints(this.teams);
      // Navigate to the next stage (e.g., trick-taking)
      this.router.navigate(['/games/pinochle-scoreboard/trick-taking']);
    } catch (error) {
      console.error('submitMeld error: ', error);
    }
  }

  goBack() {
    this.location.back();
  }
}
