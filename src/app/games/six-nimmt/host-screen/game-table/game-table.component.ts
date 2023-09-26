import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css']
})
export class GameTableComponent implements OnInit, OnDestroy {
  @Input() gameCode: string;
  @Input() gameData: any;

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit(): void {
  }

  handleGoBack() {
    this.nimmtService.sendSocketMessage('update-game-state', {
      state: 'WAITING_FOR_PLAYERS',
    });
  }

  ngOnDestroy(): void {}
} 
