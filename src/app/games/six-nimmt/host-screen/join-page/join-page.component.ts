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
    axios
      .get(`/api/nimmt/check-game-code/${this.gameCode}`)
      .then((res) => {
        const { status, data } = res;
        if (status !== 200 || !data.id) {
          Swal.fire({
            title: 'This game was not found',
            confirmButtonText: 'Back to 6 Nimmt! home page',
            confirmButtonColor: '#9c4fd7',
            allowOutsideClick: false,
            customClass: {
              popup: '', // Add the custom CSS class to the 'popup' element
            },
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/games/6-nimmt!']);
            }
          });
        } else {
          this.nimmtService.updateGameData(data);
          this.nimmtService.sendSocketMessage('join-game', { isHost: true });
        }
      })
      .catch(console.error);

    this.nimmtService.gameDataEmit.subscribe((data) => {
      this.gameData = data;
    });
  }
}
