import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
})
export class GameTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() gameCode: string;
  @Input() gameData: any;

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.gameData) {
    }
  }

  nextGameState():void {
    this.nimmtService.sendSocketMessage('update-game-state');
  }
  
  ngOnDestroy(): void {}
}
