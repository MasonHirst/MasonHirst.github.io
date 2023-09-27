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

  constructor(
    private nimmtService: SixNimmtService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.nimmtService
      .checkGameExists(location.href.split('/').pop())
      .then((res) => {
        if (res) {
          this.nimmtService.sendSocketMessage('join-game', { isHost: false });
        }
      });

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
    });
    this.route.params.subscribe((params) => {
      this.gameCode = params['gameCode'];
    });
  }

  ngOnDestroy(): void {}
}
