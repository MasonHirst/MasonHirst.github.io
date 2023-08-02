import { Component, OnInit } from '@angular/core';
import { Minesweeper } from './minesweeper.model';
import { MinesweeperService } from '../minesweeper.service';

@Component({
  selector: 'app-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.css'],
})
export class MinesweeperComponent implements OnInit {
  settingsModal: boolean = false;
  gameSize: Minesweeper;
  gameRows = [];
  gameStarted: boolean = false;
  stopWatch: any;
  timer: number = 0;
  gameState: string = 'new';

  onNewGame() {
    this.gameState = 'new';
    this.gameStarted = false;
    this.toggleTimer(false);
    this.timer = 0;

    // Generate rows and columns based on height and width
    this.gameRows = [];
    for (let i = 0; i < this.gameSize.height; i++) {
      let row = [];
      for (let k = 0; k < this.gameSize.width; k++) {
        row.push({
          value: '',
          revealed: false,
          flagged: false,
          question: false,
          destroyed: false,
        });
      }
      this.gameRows.push(row);
    }

    // randomly place as many bombs as specified
    let bombsPlaced = 0;
    while (bombsPlaced < this.gameSize.bombs) {
      const randomRow = Math.floor(Math.random() * this.gameSize.height);
      const randomCol = Math.floor(Math.random() * this.gameSize.width);
      if (this.gameRows[randomRow][randomCol].value !== 'bomb') {
        this.gameRows[randomRow][randomCol].value = 'bomb';
        bombsPlaced++;
      }
    }

    // loop through every cell
    for (let i = 0; i < this.gameSize.height; i++) {
      for (let k = 0; k < this.gameSize.width; k++) {
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
          i < this.gameSize.height &&
          k >= 0 &&
          k < this.gameSize.width &&
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

  getTimerValue(timer: number) {
    if (timer > 0) {
      const decisecond = Math.floor(timer % 100)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((timer / 100) % 60)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((timer / 100 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const hours = Math.floor((timer / 100 / 60 / 60) % 24)
        .toString()
        .padStart(2, '0');
      if (+hours > 0) {
        return `${hours}:${minutes}:${seconds}.${decisecond}`;
      } else {
        return `${minutes}:${seconds}.${decisecond}`;
      }
    } else {
      return '00:00.00';
    }
  }

  onRightClick(row: number, col: number, event: any) {
    if (event) event.preventDefault();
    this.toggleTimer(true);
    const cell = this.gameRows[row][col];
    if (cell.revealed) return;

    if (cell.flagged) {
      if (cell.question) {
        cell.question = false;
        cell.flagged = false;
      } else {
        cell.flagged = false;
        cell.question = true;
      }
    } else if (cell.question) {
      cell.question = false;
    } else {
      cell.flagged = true;
      cell.question = false;
    }

    if (this.checkWin()) {
      this.gameState = 'win';
      return;
    }
  }

  onClickCell(row: number, col: number) {
    if (this.isLongClick) return;
    if (this.gameState !== 'new') return;
    this.toggleTimer(true);
    const cell = this.gameRows[row][col];
    const game = this.gameRows;

    if (!cell.flagged && !cell.question) {
      cell.revealed = true;
    } else {
      return;
    }

    if (this.checkWin()) {
      this.gameState = 'win';
      return;
    }

    if (cell.value === 'bomb') {
      this.toggleTimer(false);
      this.gameState = 'loss';
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

  clickHoldTimeout: any;
  clickHoldThreshold: number = 220;
  isLongClick: boolean;

  onMouseDown(row: number, col: number) {
    this.isLongClick = false;
    this.clickHoldTimeout = setTimeout(() => {
      this.onRightClick(row, col, 0);
      this.isLongClick = true;
    }, this.clickHoldThreshold);
  }

  onMouseUp() {
    clearTimeout(this.clickHoldTimeout);
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
      this.gameState = 'win';
      this.toggleTimer(false);
      const { easy, intermediate, hard, expert } = JSON.parse(
        localStorage.getItem('mineSweeperBestTimes')
      );

      switch (this.minesweeperDifficulty) {
        case 'easy':
          if (!easy || this.timer < easy) {
            localStorage.setItem(
              'mineSweeperBestTimes',
              JSON.stringify({
                easy: this.timer,
                intermediate,
                hard,
                expert,
              })
            );
          }
          break;
        case 'intermediate':
          if (!intermediate || this.timer < intermediate) {
            localStorage.setItem(
              'mineSweeperBestTimes',
              JSON.stringify({
                easy,
                intermediate: this.timer,
                hard,
                expert,
              })
            );
          }
          break;
        case 'hard':
          if (!hard || this.timer < hard) {
            localStorage.setItem(
              'mineSweeperBestTimes',
              JSON.stringify({
                easy,
                intermediate,
                hard: this.timer,
                expert,
              })
            );
          }
          break;
        case 'expert':
          if (!expert || this.timer < expert) {
            localStorage.setItem(
              'mineSweeperBestTimes',
              JSON.stringify({
                easy,
                intermediate,
                hard,
                expert: this.timer,
              })
            );
          }
          break;
      }
    }
    return win;
  }

  constructor(private mineService: MinesweeperService) {}

  ngOnInit(): void {
    if (
      !localStorage.getItem('mineSweeperBestTimes') ||
      localStorage.getItem('mineSweeperBestTimes').length < 15
    ) {
      localStorage.setItem(
        'mineSweeperBestTimes',
        JSON.stringify({
          easy: null,
          intermediate: null,
          hard: null,
          expert: null,
        })
      );
    }
    this.gameSize = this.mineService.getGameSize();
    this.mineService.gameSizeChanged.subscribe((size) => {
      this.gameSize = size;
      this.onNewGame();
    });
    this.onNewGame();
  }

  minesweeperDifficulty: string = 'intermediate';
  minesweeperHeight: number = 5;
  minesweeperWidth: number = 5;
  minesweeperBombs: number = 4;
  changeSizeError: string = '';
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
        size = new Minesweeper(16, 24, 80);
        break;
      case 'expert':
        size = new Minesweeper(20, 35, 140);
        break;
      case 'custom':
        if (!this.checkCustomSize()) return;
        size = new Minesweeper(
          this.minesweeperHeight,
          this.minesweeperWidth,
          this.minesweeperBombs
        );
        break;
    }
    this.changeSizeError = '';
    this.mineService.updateGameSize(size);
  }

  getBestTime(level: string) {
    const times = JSON.parse(localStorage.getItem('mineSweeperBestTimes'));
    if (times[level]) {
      return this.getTimerValue(times[level]);
    } else return 'Incomplete'
  }

  checkCustomSize() {
    const { minesweeperHeight, minesweeperWidth, minesweeperBombs } = this;
    if (
      minesweeperHeight === undefined ||
      minesweeperWidth === undefined ||
      minesweeperBombs === undefined
    ) {
      this.changeSizeError = 'Please fill out all fields';
      return false;
    } else if (this.minesweeperHeight < 1 || this.minesweeperWidth < 1) {
      this.changeSizeError = 'Height and width must be greater than 0';
      return false;
    } else if (this.minesweeperBombs < 0) {
      this.changeSizeError = 'Bomb count cannot be negative';
      return false;
    } else if (
      this.minesweeperBombs >
      this.minesweeperHeight * this.minesweeperWidth
    ) {
      const total = minesweeperHeight * minesweeperWidth;
      this.changeSizeError = `There ${total > 1 ? 'are' : 'is'} only ${
        minesweeperWidth * minesweeperHeight
      } square${
        total > 1 ? 's' : ''
      } in a ${minesweeperWidth} x ${minesweeperHeight} grid`;
      return false;
    } else {
      return true;
    }
  }
}
