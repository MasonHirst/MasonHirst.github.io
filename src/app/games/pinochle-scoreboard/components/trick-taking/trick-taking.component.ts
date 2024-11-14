import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';
import { Team } from '../../interfaces/team.interface';
import { getDeepCopy } from 'src/app/games/games-helper-functions';

@Component({
  selector: 'app-trick-taking',
  templateUrl: './trick-taking.component.html',
  styleUrls: ['./trick-taking.component.css'],
})
export class TrickTakingComponent implements OnInit {
  teams: Team[] = null;

  constructor(
    private router: Router,
    private gameStateService: PinochleStateService
  ) {}

  ngOnInit(): void {
    this.teams = getDeepCopy(this.gameStateService.getCurrentGameState()?.teams);
    
    if (!Array.isArray(this.teams)) {
      this.router.navigate(['/games/pinochle-scoreboard']);
    }

  }

  goBack() {
    // Navigate back to the melding phase
    this.router.navigate(['/games/pinochle-scoreboard/melding']);
  }

  submitTricks() {
    try {
      // Update the trick scores for each team in the game state
      this.gameStateService.setTeamsData(this.teams);
  
      // Navigate to the round summary or next stage
      this.router.navigate(['/games/pinochle-scoreboard/round-summary']);
    } catch (error) {
      console.error("Submit Tricks error: ", error);
    }
  }
}