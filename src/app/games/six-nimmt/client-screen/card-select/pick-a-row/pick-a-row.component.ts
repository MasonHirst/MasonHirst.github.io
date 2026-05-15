import { Component, Input } from '@angular/core';
import axios from 'axios';
import { SixNimmtService } from '../../../six-nimmt.service';

@Component({
  selector: 'app-pick-a-row',
  templateUrl: './pick-a-row.component.html',
  styleUrls: ['./pick-a-row.component.css'],
})
export class PickARowComponent {
  @Input() stacks: any[][] = [];

  submitting = false;

  constructor(private nimmtService: SixNimmtService) {}

  stackCost(stack: any[]): number {
    return stack.reduce((s, c) => s + c.bullHeads, 0);
  }

  minCost(): number {
    return Math.min(...this.stacks.map(s => this.stackCost(s)));
  }

  async pickRow(index: number) {
    if (this.submitting) return;
    this.submitting = true;
    try {
      await axios.post('/api/nimmt/player/choose-row', {
        gameCode: this.nimmtService.gameData()?.code,
        userToken: this.nimmtService.userToken,
        rowIndex: index,
      });
    } catch (err) {
      console.error(err);
      this.submitting = false;
    }
  }
}
