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
  playerNameInput: string = localStorage.getItem('playerName') || '';

  constructor() {}

  handleSubmitForm(isHost: boolean = false) {
    if (this.playerNameInput !== localStorage.getItem('playerName')) {
      localStorage.setItem('playerName', this.playerNameInput);
    }
    if (!this.gameCodeInput) return alert('Please enter a game code');
    if (!this.playerNameInput && !isHost)
      return alert('Please enter a player name');
    if (this.playerNameInput.length > 20)
      return alert('Player name must be less than 20 characters');
    this.submitGameCode.emit({
      code: this.gameCodeInput,
      isHost,
      playerName: this.playerNameInput,
    });
  }

  handleHostGame() {
    this.submitHostGame.emit();
  }

  handleGameCodeChange(input: string) {
    this.gameCodeInput = input.toUpperCase();
  }
}
