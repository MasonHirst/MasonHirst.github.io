import { Component } from '@angular/core';
import axios from 'axios';
import { SixNimmtService } from './six-nimmt.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-six-nimmt',
  templateUrl: './six-nimmt.component.html',
  styleUrls: ['./six-nimmt.component.css'],
})
export class SixNimmtComponent {
  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  handleCodeSubmit(data: {
    code: string;
    isHost: boolean;
    playerName: string;
  }) {
    const { code, isHost, playerName } = data;

    axios
      .get(`/api/nimmt/check-game-code/${code}`)
      .then((res) => {
        console.log('res: ', res);
        const { status, data } = res;
        if (status !== 200 || !data.code) {
          return alert('This game was not found');
        }
        this.router.navigate([`/games/6-nimmt!/client/${data.code}`]);
        this.nimmtService.sendSocketMessage('join-game', {
          gameCode: code,
          isHost,
          playerName,
        });
      })
      .catch(console.error);
  }

  handleHostGame() {
    axios
      .post('/api/nimmt/create', {})
      .then(({ data, status }) => {
        if (status !== 200 || !data.code) {
          return alert('Something went wrong, please try again');
        }
        if (data?.gameState === 'WAITING-FOR-PLAYERS') {
          this.router.navigate([`/games/6-nimmt!/host/${data.code}`]);
        }
      })
      .catch(console.error);
  }
}
