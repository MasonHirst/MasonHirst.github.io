import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-game-review-page',
  templateUrl: './game-review-page.component.html',
  styleUrls: ['./game-review-page.component.css'],
})
export class GameReviewPageComponent implements OnInit, OnDestroy {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken: string = localStorage.getItem('userToken');

  constructor() {}

  ngOnInit(): void {}

  getPlayers() {
    return Object.values(this.gameData?.players);
  }

  getRoundScores(score) {
    let total = 0;
    score.forEach((s) => {
      total += s.bullHeads;
    });
    return total;
  }

  ngOnDestroy(): void {}
}
