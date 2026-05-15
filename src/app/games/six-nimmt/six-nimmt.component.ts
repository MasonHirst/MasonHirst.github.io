import { Component } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { SixNimmtService } from './six-nimmt.service';

@Component({
  selector: 'app-six-nimmt',
  templateUrl: './six-nimmt.component.html',
  styleUrls: ['./six-nimmt.component.css'],
})
export class SixNimmtComponent {
  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  handleCodeSubmit(data: { code: string; isHost: boolean; playerName: string }) {
    this.nimmtService.checkGameExists(data.code).then(exists => {
      if (exists) {
        localStorage.setItem('playerName', data.playerName);
        this.nimmtService.sendSocketMessage('join-game', {
          gameCode: data.code,
          isHost: data.isHost,
          playerName: data.playerName,
        });
      }
    });
  }

  handleHostGame() {
    axios.post('/api/nimmt/create', {}).then(({ data, status }) => {
      if (status !== 200 || !data?.code) return alert('Something went wrong, please try again');
      this.router.navigate([`/games/6-nimmt!/host/${data.code}`]);
    }).catch(console.error);
  }
}
