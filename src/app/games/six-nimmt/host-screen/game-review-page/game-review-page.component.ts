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

  getRoundScores(score: any[]): number {
    let total = 0;
    score.forEach((s: { number: number; bullHeads: number }) => {
      total += s.bullHeads;
    });
    return total;
  }

  getTotalScore(player: any): number {
    return this.nimmtService.getTotalScore(player);
  }

  sendMessage(message: string) {
    this.nimmtService.sendSocketMessage(message);
  }

  navigateToGames() {
    this.router.navigate(['/games/6-nimmt!']);
  }

  isFirstPlayer(): boolean {
    return this.nimmtService.isFirstPlayer();
  }

  gameIsOver(): boolean {
    // if any player has 66 or more points, the game is over
    let gameOver = false;
    Object.values(this.gameData?.players).forEach((player: any) => {
      if (this.getTotalScore(player) >= 66) {
        gameOver = true;
      }
    });
    return gameOver;
  }

  getLosersStatement(): string {
    // if any player has 66 or more points, add their name to a string
    let losersArr = [];
    Object.values(this.gameData?.players).forEach((player: any) => {
      if (this.getTotalScore(player) >= 66) {
        losersArr.push(player.playerName);
      }
    });
    let losersStr = '';
    losersArr.forEach((loser, i) => {
      if (i === 0) {
        losersStr += loser;
      } else if (i === losersArr.length - 1) {
        losersStr += ' and ' + loser;
      } else {
        losersStr += ', ' + loser;
      }
    });
    return losersStr
  }

  ngOnDestroy(): void {}
}
