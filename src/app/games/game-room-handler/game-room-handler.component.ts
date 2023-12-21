import { Component, EventEmitter, Input, Output } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-game-room-handler',
  templateUrl: './game-room-handler.component.html',
  styleUrls: ['./game-room-handler.component.css'],
})
export class GameRoomHandlerComponent {
  @Input() gameInfo: any;
  @Output() submitGameCode: EventEmitter<any> = new EventEmitter();
  @Output() submitHostGame: EventEmitter<void> = new EventEmitter();
  gameCodeInput: string = '';
  playerNameInput: string = localStorage.getItem('playerName') || '';
  playerNameInputError: string = '';
  enableJoinBtn: boolean = false;
  hostingOptionsOpen: boolean = false;

  constructor() {}

  handleSubmitForm(isHost: boolean = false) {
    if (this.playerNameInput !== localStorage.getItem('playerName')) {
      localStorage.setItem('playerName', this.playerNameInput);
    }
    if (!this.gameCodeInput) return alert('Please enter a game code');
    if (!this.playerNameInput && !isHost)
      return this.playerNameInputError = "Please enter a player name"
    if (this.playerNameInput.length > 15)
      return this.playerNameInputError = "Player name must be 15 characters or less"
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
    if (this.gameCodeInput.length === 4) {
      axios
        .get(`/api/games/${this.gameCodeInput}`)
        .then(({ data }) => {
          this.enableJoinBtn = data;
        })
        .catch((err) => {
          console.error(err);
        });
    } else this.enableJoinBtn = false;
  }
}
