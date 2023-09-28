import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-card-select',
  templateUrl: './card-select.component.html',
  styleUrls: ['./card-select.component.css'],
})
export class CardSelectComponent implements OnInit, OnDestroy {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken: string = localStorage.getItem('userToken');

  getMyCards() {
    return this.gameData?.players[this.myToken]?.cards || [];
  }

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit(): void {}

  handleCardClick(card: { number: number; bullHeads: number }) {
    if (this.gameData?.gameState !== 'PICKING_CARDS') return;
    this.nimmtService.sendSocketMessage('select-card', { card });
  }

  isSelected(card: { number: number; bullHeads: number }) {
    return (
      this.gameData?.players[this.myToken]?.selectedCard?.number === card.number
    );
  }

  showPickRowComponent() {
    return this.gameData?.players[this.myToken]?.needsToPickRow;
  }

  totalCardPoints() {
    return this.gameData.players[this.myToken].pointCards.reduce(
      (acc: number, card: any) => {
        return acc + card.bullHeads;
      },
      0
    );
  }

  ngOnDestroy(): void {}
}
