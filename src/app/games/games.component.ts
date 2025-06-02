import { Component, OnInit } from '@angular/core';
import { MinesweeperService } from './minesweeper.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  providers: [MinesweeperService],
})
export class GamesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
