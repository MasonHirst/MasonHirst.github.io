import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-nimmt-card',
  templateUrl: './nimmt-card.component.html',
  styleUrls: ['./nimmt-card.component.css']
})
export class NimmtCardComponent {
  @Input() card: any;
  @Input() gameData: any;
  @Input() height: number;
  @Input() width: number;
  @Input() borderColor: string;
  @Input() selectable: boolean;
  @Input() selected: boolean;
}
