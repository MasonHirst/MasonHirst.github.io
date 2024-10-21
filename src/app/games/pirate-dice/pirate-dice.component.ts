import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { PirateDiceService } from './pirate-dice.service';

@Component({
  selector: 'app-pirate-dice',
  templateUrl: './pirate-dice.component.html',
  styleUrls: ['./pirate-dice.component.css']
})
export class PirateDiceComponent implements OnInit, OnDestroy {
  constructor(private pirateService: PirateDiceService, private router: Router) {}
  
  ngOnInit(): void {}

  handleCodeSubmit(data: {
    code: string;
    isHost: boolean;
    playerName: string;
  }) {
    const { code, isHost, playerName } = data;
    this.pirateService.checkGameExists(code).then((res) => {
      if (res) {
        this.pirateService.sendSocketMessage('join-game', {
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

  ngOnDestroy(): void {}
}
