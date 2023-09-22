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

  handleCodeSubmit(data: { code: string; isHost: boolean }) {
    const { code, isHost } = data;
    this.nimmtService.sendSocketMessage('join-game', { gameCode: code, isHost });
  }

  handleHostGame() {
    axios
      .post('/api/nimmt/create', {})
      .then(({ data }) => {
        if (data.length === 4) {
          this.router.navigate([`/games/6-nimmt!/host/${data}`]);
        } else alert('Something went wrong with the game code.')
      })
      .catch(console.error);
  }
}
