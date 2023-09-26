import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../six-nimmt.service';

@Component({
  selector: 'app-host-screen',
  templateUrl: './host-screen.component.html',
  styleUrls: ['./host-screen.component.css'],
})
export class HostScreenComponent implements OnInit {
  routeGameCode: string = '';
  gameData: any;

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
    });
  }
}
