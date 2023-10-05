import { Component, Input, OnChanges } from '@angular/core';
import Swal from 'sweetalert2';
import { SixNimmtService } from '../../../six-nimmt.service';
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

  constructor(private nimmtService: SixNimmtService) {}

  ngOnChanges(changes: any) {
    if (changes.gameCode) {
      this.canPickRow = true;
    }
  }

  handleSelectRow(rowIndex: number) {
    if (!this.canPickRow) return;
    this.canPickRow = false;
    // this.nimmtService.sendSocketMessage('player-select-row', { rowIndex });

    axios
      .post('/api/nimmt/player/choose-row', {
        gameCode: this.gameCode,
        rowIndex,
        userToken: this.myToken,
      })
      .then(({ data }) => {
        console.log('data', data);
      })
      .catch((err) => {
        console.error(err);
      });

    // Swal.fire({
    //   title: 'Are you sure?',
    //   text: `You will be selecting row ${rowIndex + 1} and will be unable to change your selection.`,
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonText: 'Yes',
    //   cancelButtonText: 'Cancel',
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     this.nimmtService.sendSocketMessage('player-select-row', { rowIndex });
    //   }
    // })
  }
}
