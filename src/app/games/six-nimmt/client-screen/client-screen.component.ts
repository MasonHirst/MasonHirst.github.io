import { Component, OnDestroy, OnInit } from '@angular/core';
import { SixNimmtService } from '../six-nimmt.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-client-screen',
  templateUrl: './client-screen.component.html',
  styleUrls: ['./client-screen.component.css'],
})
export class ClientScreenComponent implements OnInit, OnDestroy {
  gameData: any;
  gameCode: string = '';
  myToken: string = localStorage.getItem('userToken');

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.nimmtService
      .checkGameExists(location.href.split('/').pop())
      .then((res) => {
        if (res) {
          this.nimmtService.sendSocketMessage('join-game', {
            isHost: false,
            playerName: localStorage.getItem('playerName'),
          });
        }
      });

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
    });
    this.route.params.subscribe((params) => {
      this.gameCode = params['gameCode'];
    });
  }

  needToPick() {
    return this.gameData?.players[localStorage.getItem('userToken')]
      ?.needsToPickRow;
  }

  getMyPlayer() {
    const me = this.gameData?.players[this.myToken];
    return me || 'Error getting player name';
  }

  ngOnDestroy(): void {}
}
