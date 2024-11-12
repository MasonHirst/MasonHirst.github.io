import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameFormat } from './interfaces/gameformat.interface';
import { PinochleStateService } from './services/pinochle-state.service';

@Component({
  selector: 'app-pinochle-scoreboard',
  templateUrl: './pinochle-scoreboard.component.html',
  styleUrls: ['./pinochle-scoreboard.component.css']
})
export class PinochleScoreboardComponent {

  public gameFormats: GameFormat[] = [
    {
      label: '3-hand',
      description: '3 teams of 1 player',
    },
    {
      label: '4-hand',
      description: '2 teams of 2 players',
    },
    {
      label: '5-hand',
      description: '5 teams of 1 player',
    },
    {
      label: '6-hand',
      description: '2 teams of 3 players',
    },
    {
      label: '8-hand',
      description: '4 teams of 2 players',
    },
  ]

  constructor(private router: Router, private route: ActivatedRoute, private gameStateService: PinochleStateService) {}

  startNewGame(format: GameFormat) {
    this.gameStateService.setGameFormat(format.label)
    // Navigate to the new-game component
    this.router.navigate(['new-game'], { relativeTo: this.route });
  }
}