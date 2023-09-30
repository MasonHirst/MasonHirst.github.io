import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../six-nimmt.service';

@Component({
  selector: 'app-host-screen',
  templateUrl: './host-screen.component.html',
  styleUrls: ['./host-screen.component.css'],
})
export class HostScreenComponent implements OnInit, OnDestroy {
  routeGameCode: string = '';
  gameData: any;
  countdown: number = 3;
  countingDown: boolean = false;
  countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private nimmtService: SixNimmtService
  ) {}

  ngOnInit(): void {
    this.nimmtService
      .checkGameExists(this.routeGameCode || location.href.split('/').pop())
      .then((res) => {
        if (res) {
          this.nimmtService.sendSocketMessage('join-game', { isHost: true })
        }
      });

    this.route.params.subscribe((params) => {
      this.routeGameCode = params['gameCode'];
    });

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
    });

    this.nimmtService.countdownEmit.subscribe((counting: boolean) => {
      this.countingDown = counting;
      if (counting) {
        this.countdown = 3;
        this.countdownInterval = setInterval(() => {
          this.countdown--;
          if (this.countdown === 0) {
            this.countingDown = false;
            clearInterval(this.countdownInterval);
          }
        }, 1000);
      } else {
        clearInterval(this.countdownInterval);
      }
    })
  }

  getData() {
    this.nimmtService.sendSocketMessage('get-game');
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
  }
}
