import { EventEmitter, Injectable } from '@angular/core';
import { Minesweeper } from './minesweeper/minesweeper.model';

@Injectable({
  providedIn: 'root'
})
export class MinesweeperService {
  gameSizeChanged = new EventEmitter<Minesweeper>()
  private gameSize: Minesweeper = new Minesweeper(16, 24, 50)

  constructor() { }

  updateGameSize(size: Minesweeper) {
    if (JSON.stringify(this.gameSize) === JSON.stringify(size)) return
    this.gameSize = size
    this.gameSizeChanged.emit(this.gameSize)
  }

  getGameSize() {
    return this.gameSize
  }
}
