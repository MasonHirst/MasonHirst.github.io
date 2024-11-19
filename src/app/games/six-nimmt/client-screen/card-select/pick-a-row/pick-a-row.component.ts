import { Component, Input, OnChanges } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-pick-a-row',
  templateUrl: './pick-a-row.component.html',
  styleUrls: ['./pick-a-row.component.css'],
})
export class PickARowComponent implements OnChanges {
  @Input() gameData: any;
  @Input() gameCode: string;
  myToken = localStorage.getItem('userToken');
  canPickRow: boolean = true;

  constructor() {}

  ngOnChanges(changes: any) {
    if (changes.gameCode) {
      this.canPickRow = true;
    }
  }

  handleSelectRow(rowIndex: number) {
    if (!this.canPickRow) return;
    this.canPickRow = false;
    axios
      .post('/api/nimmt/player/choose-row', {
        gameCode: this.gameCode,
        rowIndex,
        userToken: this.myToken,
      })
      .then(({ data }) => {})
      .catch((err) => {
        console.error(err);
      });
  }
}
