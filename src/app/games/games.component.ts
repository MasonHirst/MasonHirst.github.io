import { Component, OnInit } from '@angular/core';
import { MinesweeperService } from './minesweeper.service';
import { Minesweeper } from './minesweeper/minesweeper.model';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  providers: [MinesweeperService],
})
export class GamesComponent implements OnInit {
  minesweeperDifficulty: string = 'hard';
  minesweeperHeight: number;
  minesweeperWidth: number;
  minesweeperBombs: number;
  onChangeMinesweeperSize() {
    let size: Minesweeper;
    switch (this.minesweeperDifficulty) {
      case 'easy':
        size = new Minesweeper(10, 10, 12);
        break;
      case 'intermediate':
        size = new Minesweeper(16, 16, 40);
        break;
      case 'hard':
        size = new Minesweeper(16, 24, 85);
        break;
      case 'expert':
        console.log('match')
        size = new Minesweeper(20, 35, 150);
      default:
        size = new Minesweeper(
          this.minesweeperHeight,
          this.minesweeperWidth,
          this.minesweeperBombs
        );
        break;
    }
    this.mineService.updateGameSize(size);
  }

  constructor(private mineService: MinesweeperService) {}

  ngOnInit() {}
}
