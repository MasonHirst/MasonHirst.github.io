import { EventEmitter, Injectable } from '@angular/core';
import { Minesweeper } from './minesweeper/minesweeper.model';

@Injectable({
  providedIn: 'root'
})
export class MinesweeperService {
  gameSizeChanged = new EventEmitter<Minesweeper>()
  private gameSize: Minesweeper = new Minesweeper(16, 16, 40) // start in intermediate mode

  constructor() { }

  updateGameSize(size: Minesweeper) {
    this.gameSize = size
    this.gameSizeChanged.emit(this.gameSize)
  }

  getGameSize() {
    return this.gameSize
  }
}
