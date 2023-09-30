import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-card-select',
  templateUrl: './card-select.component.html',
  styleUrls: ['./card-select.component.css'],
})
export class CardSelectComponent implements OnInit, OnDestroy, OnChanges {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken: string = localStorage.getItem('userToken');
  submittedLastCard: boolean = false;

  getMyCards() {
    return this.gameData?.players[this.myToken]?.cards || [];
  }

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.gameData.currentValue) {
      if (
        this.gameData?.players[this.myToken].cards.length === 1 &&
        this.gameData?.gameState === 'PICKING_CARDS' &&
        !this.submittedLastCard
      ) {
        this.nimmtService.sendSocketMessage('select-card', {
          card: this.gameData?.players[this.myToken].cards[0],
        });
        this.submittedLastCard = true;
      }
    }
  }

  handleCardClick(card: { number: number; bullHeads: number }) {
    if (this.gameData?.gameState !== 'PICKING_CARDS') return;
    if (this.gameData?.players[this.myToken]?.cards.length === 1) return;
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

  determineCardHeight(height: number) {
    const width = window.innerWidth;
    if (width > 600) return height;
    else if (width > 500) return height * 0.9;
    else if (width > 400) return height * 0.8;
    else return height * 0.6;
  }

  ngOnDestroy(): void {}
}
