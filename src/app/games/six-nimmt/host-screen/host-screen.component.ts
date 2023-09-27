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
  countdown: number = 5;
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
          this.nimmtService.sendSocketMessage('join-game', { isHost: true });
        }
      });

    this.route.params.subscribe((params) => {
      this.routeGameCode = params['gameCode'];
    });

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
      if (
        Object.values(data.players).every(
          (player: any) => player.selectedCard
        ) &&
        data.gameState === 'PICKING_CARDS'
      ) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        this.startCountdown();
      } else {
        clearInterval(this.countdownInterval);
        this.countdown = 5;
        this.countingDown = false;
      }
    });
  }

  startCountdown(): void {
    this.countdown = 5;
    this.countingDown = true;
    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown === 0) {
        // The countdown has reached 0, execute your code here
        this.executeOnCountdownEnd();
        this.countingDown = false;
        clearInterval(this.countdownInterval); // Stop the countdown
      }
    }, 1000); // Decrease the countdown every 1 second
  }

  executeOnCountdownEnd(): void {
    console.log('Countdown has ended. Performing some action.');
  }

  getData() {
    this.nimmtService.sendSocketMessage('get-game');
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
  }
}
