import { Component, OnDestroy } from '@angular/core';
import { PinochleStateService } from './services/pinochle-state.service';

@Component({
  selector: 'app-pinochle-scoreboard',
  templateUrl: './pinochle-scoreboard.component.html',
  styleUrls: ['./pinochle-scoreboard.component.css']
})
export class PinochleScoreboardComponent implements OnDestroy {
  constructor( private gameStateService: PinochleStateService ) {}
  
  ngOnDestroy(): void {
    this.gameStateService?.onDestroyAction();
  }
}