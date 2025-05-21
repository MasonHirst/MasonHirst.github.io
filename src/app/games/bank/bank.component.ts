import { Component } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { SixNimmtService } from '../six-nimmt/six-nimmt.service';

@Component({
  selector: 'app-bank',
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.css'
})
export class BankComponent {
  constructor(private bankService: SixNimmtService, private router: Router) {}

  handleHostGame() {
    axios
      .post('/api/game/create', { game: '6-nimmt' })
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
}
