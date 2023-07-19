import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-minesweeper',
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.css'],
})
export class MinesweeperComponent implements OnInit {
  height: number = 12;
  width: number = 10;
  gameRows = [];

  onNewGame() {
    this.gameRows = [];
    for (let i = 0; i < this.height; i++) {
      let row = [];
      for (let k = 0; k < this.width; k++) {
        const value = Math.random() < 0.05 ? 'bomb' : '';
        row.push({
          value: value,
          revealed: false,
          flagged: false,
        });
      }
      this.gameRows.push(row);
    }

    for (let i = 0; i < this.height; i++) {
      for (let k = 0; k < this.width; k++) {
        const game = this.gameRows;
        if (game[i][k].value !== 'bomb') {
          const upRow = game[i - 1];
          const thisRow = game[i];
          const downRow = game[i + 1];
          let bombCount = 0;
          if (upRow) {
            if (upRow[k - 1] && upRow[k - 1].value === 'bomb') bombCount++;
            if (upRow[k].value === 'bomb') bombCount++;
            if (upRow[k + 1] && upRow[k + 1].value === 'bomb') bombCount++;
          }
          if (thisRow[k - 1] && thisRow[k - 1].value === 'bomb') bombCount++;
          if (thisRow[k + 1] && thisRow[k + 1].value === 'bomb') bombCount++;
          if (downRow) {
            if (downRow[k - 1] && downRow[k - 1].value === 'bomb') bombCount++;
            if (downRow[k].value === 'bomb') bombCount++;
            if (downRow[k + 1] && downRow[k + 1].value === 'bomb') bombCount++;
          }
          this.gameRows[i][k].value = bombCount > 0 ? bombCount : '';
        }
      }
    }
  }

  onRightClick(row: number, col: number, event: MouseEvent) {
    event.preventDefault()
    const cell = this.gameRows[row][col]
    cell.flagged = !cell.flagged

    if (this.checkWin()) {
      return alert('You win!')
    }
  }

  onClickCell(row: number, col: number) {
    const cell = this.gameRows[row][col];
    const game = this.gameRows;

    if (cell.flagged) {
      cell.flagged = false
      return
    }
    
    cell.revealed = true;
    
    if (this.checkWin()) {
      return alert('You win!')
    }
  
    if (cell.value === 'bomb') {
      alert('You lose!');
      for (let i = 0; i < this.gameRows.length; i++) {
        for (let k = 0; k < this.gameRows[i].length; k++) {
          game[i][k].revealed = true
        } 
      }
      return
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
    let win = true
    for (let i = 0; i < this.gameRows.length; i++) {
      for (let k = 0; k < this.gameRows[i].length; k++) {
        const cell = this.gameRows[i][k]
        if (cell.value === 'bomb' && !cell.flagged) {
          win = false
          break
        } else
        if (cell.value !== 'bomb' && !cell.revealed) {
          win = false
          break
        }
      }
    }
    return win
  }

  getNumberImg(val: number) {
    switch (val) {
      case 1:
        return 'num-1.png'
      case 2:
        return 'num-2.png'
      case 3:
        return 'num-3.png'
      case 4:
        return 'num-4.png'
      case 5:
        return 'num-5.png'
      case 6:
        return 'num-6.png'
      case 7:
        return 'num-7.png'
      default:
        return 'num-8.png'
  }
}
  

  constructor() {}

  ngOnInit(): void {}
}
