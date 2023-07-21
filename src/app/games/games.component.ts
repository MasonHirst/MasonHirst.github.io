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
    console.log(
      this.minesweeperHeight,
      this.minesweeperWidth,
      this.minesweeperBombs
    );
    let size: Minesweeper;
    switch (this.minesweeperDifficulty) {
      case 'easy':
        size = new Minesweeper(8, 8, 10);
        break;
      case 'medium':
        size = new Minesweeper(16, 16, 40);
        break;
      case 'hard':
        size = new Minesweeper(16, 24, 99);
        break;
      case 'expert':
        size = new Minesweeper(16, 30, 150);
      default:
        size = new Minesweeper(
          this.minesweeperHeight,
          this.minesweeperWidth,
          this.minesweeperBombs
        );
        break;
    }

    if (this.minesweeperDifficulty === 'custom') {
      size = new Minesweeper(
        this.minesweeperHeight,
        this.minesweeperWidth,
        this.minesweeperBombs
      );
    } else this.mineService.updateGameSize(new Minesweeper(16, 24, 50));
  }

  constructor(private mineService: MinesweeperService) {}

  ngOnInit() {}
}
