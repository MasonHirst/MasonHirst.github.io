import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameFormat } from './interfaces/gameformat.interface';
import { PinochleStateService } from './services/pinochle-state.service';

@Component({
  selector: 'app-pinochle-scoreboard',
  templateUrl: './pinochle-scoreboard.component.html',
  styleUrls: ['./pinochle-scoreboard.component.css']
})
export class PinochleScoreboardComponent implements OnInit {

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
  ]

  constructor(private router: Router, private route: ActivatedRoute, private gameStateService: PinochleStateService) {}

  ngOnInit(): void {
    // Don't think I need this
    // this.gameStateService.clearGameState();
  }

  startNewGame(format: GameFormat) {
    this.gameStateService.setGameFormat(format)
    // Navigate to the new-game component
    this.router.navigate(['new-game'], { relativeTo: this.route });
  }
}