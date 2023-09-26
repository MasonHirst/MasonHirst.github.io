import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-select',
  templateUrl: './card-select.component.html',
  styleUrls: ['./card-select.component.css']
})
export class CardSelectComponent implements OnInit, OnDestroy {
  @Input() gameData: any;
  @Input() gameCode: string;


  constructor() {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {}
}
