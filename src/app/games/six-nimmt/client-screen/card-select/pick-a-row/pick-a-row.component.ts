import { Component, Input } from '@angular/core';
import Swal from 'sweetalert2';
import { SixNimmtService } from '../../../six-nimmt.service';

@Component({
  selector: 'app-pick-a-row',
  templateUrl: './pick-a-row.component.html',
  styleUrls: ['./pick-a-row.component.css']
})
export class PickARowComponent {
  @Input() gameData: any;
  myToken = localStorage.getItem('userToken');

  constructor(private nimmtService: SixNimmtService) {}

  handleSelectRow(rowIndex: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: `You will be selecting row ${rowIndex + 1} and will be unable to change your selection.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.nimmtService.sendSocketMessage('player-select-row', { rowIndex });
      }
    })
  }
  
  
}
