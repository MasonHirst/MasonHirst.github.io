import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-room-handler',
  templateUrl: './game-room-handler.component.html',
  styleUrls: ['./game-room-handler.component.css']
})
export class GameRoomHandlerComponent {
  @Input() gameData: any;
  @Output() submitGameCode: EventEmitter<any> = new EventEmitter();
  @Output() submitHostGame: EventEmitter<void> = new EventEmitter();
  gameCodeInput: string = '';

  constructor() {}

  handleSubmitForm() {
    this.submitGameCode.emit(this.gameCodeInput);
  }

  handleHostGame() {
    this.submitHostGame.emit();
  }
  
}
