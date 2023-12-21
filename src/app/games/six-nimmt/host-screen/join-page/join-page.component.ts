import { Component, Input, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-join-page',
  templateUrl: './join-page.component.html',
  styleUrls: ['./join-page.component.css'],
})
export class JoinPageComponent implements OnInit {
  @Input() gameCode: string;
  @Input() gameData: any;

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit() {}

  startFreshGame() {
    this.nimmtService.sendSocketMessage('start-fresh-game');
  }

  getPlayersList() {
    return Object.values(this.gameData.players);
  }

  async copyGameCode() {
    try {
      await navigator.clipboard.writeText(this.gameCode);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  kickPlayer(player: any) {
    Swal.fire({
      title: `Are you sure you want to kick <strong>${player.playerName}</strong>?`,
      text: 'This will remove them from the game',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Kick',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.nimmtService.sendSocketMessage('kick-player', {
          playerId: player.userToken,
        });
      }
    });
  }

  canStartGame() {
    return Object.values(this.gameData?.players).length >= 2;
  }
}
