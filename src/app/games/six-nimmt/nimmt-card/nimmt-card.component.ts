import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-nimmt-card',
  templateUrl: './nimmt-card.component.html',
  styleUrls: ['./nimmt-card.component.css'],
})
export class NimmtCardComponent implements OnInit {
  @Input() card: any = {};
  @Input() gameData: any = {};
  @Input() cardIndex: number;
  @Input() height: number = 200;
  @Input() borderColor: string = 'black';
  @Input() borderWidth: number = 2;
  @Input() backgroundColor: string = 'white';
  @Input() selectable: boolean = true;
  @Input() selected: boolean = false;
  @Output() cardClick: EventEmitter<void> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  handleCardClick() {
    if (!this.selectable) return;
    this.cardClick.emit();
  }

  showPlayerName() {
    if (!this.gameData?.players) return;
    let nameToShow = null;
    Object.values(this.gameData.players).forEach((player: any) => {
      if (
        player.selectedCard &&
        player.selectedCard.number === this.card.number
      ) {
        nameToShow = player.playerName;
      }
    });
    return nameToShow;
  }
}
