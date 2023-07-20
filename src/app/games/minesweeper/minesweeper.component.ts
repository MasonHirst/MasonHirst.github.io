import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.css'],
})
export class MinesweeperComponent implements OnInit {
  settingsModal: boolean = false
  height: number = 25;
  width: number = 15;
  bombs: number = 5;
  gameRows = [];
  gameStarted: boolean = false;
  stopWatch: any;
  timer: number = 0;
  gameState: string = 'new'

  onNewGame() {
    this.gameState = 'new'
    this.gameStarted = false;
    this.toggleTimer(false);
    this.timer = 0;

    // Generate rows and columns based on height and width
    this.gameRows = [];
    for (let i = 0; i < this.height; i++) {
      let row = [];
      for (let k = 0; k < this.width; k++) {
        row.push({
          value: '',
          revealed: false,
          flagged: false,
          destroyed: false,
        });
      }
      this.gameRows.push(row);
    }

    // randomly place as many bombs as specified
    let bombsPlaced = 0;
    while (bombsPlaced < this.bombs) {
      const randomRow = Math.floor(Math.random() * this.height);
      const randomCol = Math.floor(Math.random() * this.width);
      if (this.gameRows[randomRow][randomCol].value !== 'bomb') {
        this.gameRows[randomRow][randomCol].value = 'bomb';
        bombsPlaced++;
      }
    }

    // loop through every cell
    for (let i = 0; i < this.height; i++) {
      for (let k = 0; k < this.width; k++) {
        const cell = this.gameRows[i][k];
        if (cell.value !== 'bomb') {
          // if cell isn't a bomb, determine how many bombs are touching
          cell.value = this.getBombCount(i, k);
        }
      }
    }
  }

  getBombCount(row: number, col: number) {
    let bombCount = 0;
    // go through every touching cell, make sure it exists, then check if it's a bomb
    for (let i = row - 1; i <= row + 1; i++) {
      for (let k = col - 1; k <= col + 1; k++) {
        if (
          i >= 0 &&
          i < this.height &&
          k >= 0 &&
          k < this.width &&
          !(i === row && k === col)
        ) {
          if (this.gameRows[i]?.[k]?.value === 'bomb') {
            bombCount++;
          }
        }
      }
    }
    return bombCount > 0 ? bombCount : '';
  }

  toggleTimer(start: boolean) {
    if (start) {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.stopWatch = setInterval(() => {
          this.timer++;
        }, 10);
      }
    } else {
      clearInterval(this.stopWatch);
    }
  }

  getTimerValue() {
    if (this.timer > 0) {
      const decisecond = Math.floor(this.timer % 100)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((this.timer / 100) % 60)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((this.timer / 100 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const hours = Math.floor((this.timer / 100 / 60 / 60) % 24)
        .toString()
        .padStart(2, '0');
      if (+hours > 0) {
        return `${hours}:${minutes}:${seconds}.${decisecond}`;
      } else {
        return `${minutes}:${seconds}.${decisecond}`;
      }
    } else {
      return '00:00:00';
    }
  }

  onRightClick(row: number, col: number, event: MouseEvent) {
    event.preventDefault();
    this.toggleTimer(true);
    const cell = this.gameRows[row][col];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;

    if (this.checkWin()) {
      this.gameState = 'win'
      return
    }
  }

  onClickCell(row: number, col: number) {
    if (this.gameState !== 'new') return
    this.toggleTimer(true);
    const cell = this.gameRows[row][col];
    const game = this.gameRows;

    if (cell.flagged) {
      cell.flagged = false;
      return;
    }

    cell.revealed = true;

    if (this.checkWin()) {
      this.gameState = 'win'
      return
    }


    if (cell.value === 'bomb') {
      this.toggleTimer(false);
      this.gameState = 'loss'
      cell.destroyed = true;
      for (let i = 0; i < this.gameRows.length; i++) {
        for (let k = 0; k < this.gameRows[i].length; k++) {
          if (cell.value === 'bomb' && cell.flagged) {
            game[i][k].revealed = false;
          } else {
            game[i][k].revealed = true;
          }
        }
      }
      return;
    } else if (!cell.value) {
      const neighbors = [
        { row: row - 1, col: col - 1 }, // Up left
        { row: row - 1, col: col }, // Up
        { row: row - 1, col: col + 1 }, // Up right
        { row: row + 1, col: col - 1 }, // Down left
        { row: row + 1, col: col }, // Down
        { row: row + 1, col: col + 1 }, // Down right
        { row: row, col: col - 1 }, // Left
        { row: row, col: col + 1 }, // Right
      ];

      for (const neighbor of neighbors) {
        const { row: neighborRow, col: neighborCol } = neighbor;
        if (
          neighborRow >= 0 &&
          neighborRow < game.length &&
          neighborCol >= 0 &&
          neighborCol < game[neighborRow].length &&
          !game[neighborRow][neighborCol].revealed
        ) {
          this.onClickCell(neighborRow, neighborCol);
        }
      }
    }
  }

  checkWin() {
    // player should win if every cell that is not a bomb has been opened, and all bombs are flagged
    let win = true;
    for (let i = 0; i < this.gameRows.length; i++) {
      for (let k = 0; k < this.gameRows[i].length; k++) {
        const cell = this.gameRows[i][k];
        if (cell.value === 'bomb' && !cell.flagged) {
          win = false;
          break;
        }
        if (cell.value !== 'bomb' && !cell.revealed) {
          win = false;
          break;
        }
      }
    }
    if (win) {
      this.gameState = 'win'
      this.toggleTimer(false);
      const bestTime = localStorage.getItem('mineSweeperBestTime')
      if (bestTime && this.timer < +bestTime) {
        localStorage.setItem('mineSweeperBestTime', JSON.stringify(this.timer))
      } else if (!bestTime) {
        localStorage.setItem('mineSweeperBestTime', JSON.stringify(this.timer))
      }
    }
    return win;
  }

  getNumberImg(val: number) {
    switch (val) {
      case 1:
        return 'num-1.png';
      case 2:
        return 'num-2.png';
      case 3:
        return 'num-3.png';
      case 4:
        return 'num-4.png';
      case 5:
        return 'num-5.png';
      case 6:
        return 'num-6.png';
      case 7:
        return 'num-7.png';
      default:
        return 'num-8.png';
    }
  }

  constructor() {}

  ngOnInit(): void {
    this.onNewGame();
  }
}