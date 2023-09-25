import { Component, Input, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-page',
  templateUrl: './join-page.component.html',
  styleUrls: ['./join-page.component.css'],
})
export class JoinPageComponent implements OnInit {
  @Input() gameCode: string;
  gameData: any;

  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  ngOnInit() {
    this.nimmtService.checkGameExists(this.gameCode).then((res) => {
      if (res) {
        this.nimmtService.sendSocketMessage('join-game', { isHost: true });
      }
    });

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
    });
  }
}
