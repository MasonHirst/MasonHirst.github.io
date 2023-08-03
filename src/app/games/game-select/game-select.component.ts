import { Component } from '@angular/core';
import { GameLink } from './game-link.model';

@Component({
  selector: 'app-game-select',
  templateUrl: './game-select.component.html',
  styleUrls: ['./game-select.component.css'],
})
export class GameSelectComponent {
  gameLinks: GameLink[] = [
    new GameLink(
      'Minesweeper',
      'minesweeper',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1691083736/Screenshot_2023-08-03_at_11.23.55_AM_wnvsz0.png'
    ),
    new GameLink(
      'Guess the state',
      'state-guesser',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1691083736/Screenshot_2023-08-03_at_11.27.58_AM_cnprva.png'
    ),
  ];
}
