import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PinochleStateService } from '../../services/pinochle-state.service';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
})
export class NewGameComponent implements OnInit {
  gameFormat: string;
  teams: { name: string }[] = [];

  constructor(private router: Router, private gameStateService: PinochleStateService) {}

  ngOnInit(): void {
    // Get game format from service
    this.gameFormat = this.gameStateService.getGameFormat();

    // Set up teams based on game format
    this.initializeTeams();
  }

  initializeTeams() {
    const formatTeams = {
      '3-hand': 3,
      '4-hand': 2,
      '5-hand': 5,
      '6-hand': 2,
      '8-hand': 4
    };
    const numTeams = formatTeams[this.gameFormat];

    this.teams = Array.from({ length: numTeams }, () => ({ name: '' }));
  }

  startGame() {
    try {
      this.teams.forEach(team => {
        if (!team.name.trim()) {
          throw new Error("Name for each team is required");
        }
      })
      
      const initializedTeams = this.teams.map(team => ({
        name: team.name,
        endingTotalScore: 0,
        meldScore: null,
        trickScore: null,
      }));
  
      // Initialize the game state with team names
      this.gameStateService.initializeGame(initializedTeams);
  
      // Navigate to the bidding stage
      this.router.navigate(['/games/pinochle-scoreboard/bidding']);
    } catch (error) {
      console.error('Error in new-game.component.ts: ', error)
    }
    
  }
}