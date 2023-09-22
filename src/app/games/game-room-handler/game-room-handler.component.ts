import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-room-handler',
  templateUrl: './game-room-handler.component.html',
  styleUrls: ['./game-room-handler.component.css'],
})
export class GameRoomHandlerComponent {
  @Input() gameData: any;
  @Output() submitGameCode: EventEmitter<any> = new EventEmitter();
  @Output() submitHostGame: EventEmitter<void> = new EventEmitter();
  gameCodeInput: string = '';
  playerNameInput: string = '';

  constructor() {}

  handleSubmitForm(isHost: boolean = false) {
    this.submitGameCode.emit({ code: this.gameCodeInput, isHost, playerName: this.playerNameInput });
  }

  handleHostGame() {
    this.submitHostGame.emit();
  }
}
