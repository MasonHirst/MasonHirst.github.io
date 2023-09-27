import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-card-select',
  templateUrl: './card-select.component.html',
  styleUrls: ['./card-select.component.css']
})
export class CardSelectComponent implements OnInit, OnDestroy {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken: string = localStorage.getItem('userToken');

  getMyCards() {
    return this.gameData?.players[this.myToken]?.cards || [];
  }


  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit(): void {
  }

  handleCardClick(card: any) {
    console.log(card)
    this.nimmtService.sendSocketMessage('select-card', { card })
  }

  ngOnDestroy(): void {}
}
