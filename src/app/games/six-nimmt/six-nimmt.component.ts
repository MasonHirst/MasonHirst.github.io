import { Component, OnDestroy, OnInit } from '@angular/core';
import axios from 'axios';
import { SixNimmtService } from './six-nimmt.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-six-nimmt',
  templateUrl: './six-nimmt.component.html',
  styleUrls: ['./six-nimmt.component.css'],
})
export class SixNimmtComponent implements OnInit, OnDestroy {
  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  ngOnInit(): void {

  }

  handleCodeSubmit(data: {
    code: string;
    isHost: boolean;
    playerName: string;
  }) {
    const { code, isHost, playerName } = data;
    this.nimmtService.checkGameExists(code).then((res) => {
      if (res) {
        this.router.navigate([`/games/6-nimmt!/${isHost ? 'host' : 'client'}/${data.code}`]);
        this.nimmtService.sendSocketMessage('join-game', {
          gameCode: code,
          isHost,
          playerName,
        });
      }
    });
  }

  handleHostGame() {
    axios
      .post('/api/nimmt/create', {})
      .then(({ data, status }) => {
        if (status !== 200 || !data.code) {
          return alert('Something went wrong, please try again');
        }
        if (data?.gameState === 'WAITING_FOR_PLAYERS') {
          this.router.navigate([`/games/6-nimmt!/host/${data.code}`]);
        }
      })
      .catch(console.error);
  }


  ngOnDestroy(): void {
  }
}
