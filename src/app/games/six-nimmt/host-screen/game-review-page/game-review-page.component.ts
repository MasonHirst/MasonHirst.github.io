import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-review-page',
  templateUrl: './game-review-page.component.html',
  styleUrls: ['./game-review-page.component.css'],
})
export class GameReviewPageComponent implements OnInit, OnDestroy {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken: string = localStorage.getItem('userToken');

  constructor(private router: Router, private nimmtService: SixNimmtService) {}

  ngOnInit(): void {}

  getPlayers(orderedByScore: boolean = false) {
    if (orderedByScore) {
      return Object.values(this.gameData?.players).sort((a: any, b: any) => {
        return this.getTotalScore(a) - this.getTotalScore(b);
      });
    }
    return Object.values(this.gameData?.players);
  }

  getRoundScores(score: any[]) {
    let total = 0;
    score.forEach((s: { number: number; bullHeads: number }) => {
      total += s.bullHeads;
    });
    return total;
  }

  getTotalScore(player: any) {
    let total = 0;
    player?.roundScores.forEach((round: any[]) => {
      total += this.getRoundScores(round);
    });
    return total;
  }

  sendMessage(message: string) {
    this.nimmtService.sendSocketMessage(message);
  }
  
  navigateToGames() {
    this.router.navigate(['/games/6-nimmt!']);
  }

  isFirstPlayer() {
    return this.nimmtService.isFirstPlayer();
  }

  ngOnDestroy(): void {}
}
