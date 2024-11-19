import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-review-client',
  templateUrl: './game-review-client.component.html',
  styleUrls: ['./game-review-client.component.css'],
})
export class GameReviewClientComponent {
  constructor(private router: Router, private nimmtService: SixNimmtService) {}

  navigateToGames() {
    this.router.navigate(['/games/6-nimmt!']);
  }

  sendMessage(message: string) {
    this.nimmtService.sendSocketMessage(message);
  }

  isFirstPlayer() {
    return this.nimmtService.isFirstPlayer();
  }
}
