import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-game-room-handler',
  templateUrl: './game-room-handler.component.html',
  styleUrls: ['./game-room-handler.component.css']
})
export class GameRoomHandlerComponent {
  @Input() gameData: any;

}
