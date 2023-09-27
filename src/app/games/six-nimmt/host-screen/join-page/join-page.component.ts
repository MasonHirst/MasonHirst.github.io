import { Component, Input, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-join-page',
  templateUrl: './join-page.component.html',
  styleUrls: ['./join-page.component.css'],
})
export class JoinPageComponent implements OnInit {
  @Input() gameCode: string;
  @Input() gameData: any;

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit() {
    
  }

  updateGameState(state: string = null) {
    this.nimmtService.sendSocketMessage('update-game-state');
  }

  getPlayersList() {
    return Object.values(this.gameData.players);
  }

  copyGameCode() {
    navigator.clipboard.writeText(this.gameCode);
  }
}
