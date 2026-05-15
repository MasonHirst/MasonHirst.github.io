import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-nimmt-card',
  templateUrl: './nimmt-card.component.html',
  styleUrls: ['./nimmt-card.component.css'],
})
export class NimmtCardComponent {
  @Input() card: any = null;
  @Input() height: number = 120;
  @Input() selectable: boolean = false;
  @Input() selected: boolean = false;
  // When true the card back is shown (used during PICKING_CARDS to hide selected cards on host)
  @Input() faceDown: boolean = false;
  @Output() cardClick = new EventEmitter<void>();

  get width() { return Math.round(this.height * 0.65); }

  get bullHeads(): number[] {
    return Array(this.card?.bullHeads ?? 0).fill(0);
  }

  // Mini-bull size in the corner — shrinks as penalty count grows so 5/7 fit cleanly.
  get miniBullSize(): number {
    const count = this.card?.bullHeads ?? 1;
    if (count >= 5) return Math.round(this.height * 0.07);
    if (count >= 3) return Math.round(this.height * 0.085);
    return Math.round(this.height * 0.11);
  }

  // Max columns per row in the corner bull layout. With 7 bulls we want 4+3, with 5 we want 3+2.
  get miniBullColumns(): number {
    const count = this.card?.bullHeads ?? 1;
    if (count >= 7) return 4;
    if (count >= 5) return 3;
    return count;
  }

  // Container width = exactly N bulls + (N-1) gaps. Forces flex-wrap to break at the right
  // point and lets `justify-content: center` center each wrapped row independently.
  get cornerBullsWidth(): number {
    const cols = this.miniBullColumns;
    const gap = 2;
    return cols * this.miniBullSize + (cols - 1) * gap;
  }

  handleClick() {
    console.log('[NimmtCard] handleClick — selectable:', this.selectable, 'card:', this.card?.number);
    if (this.selectable) this.cardClick.emit();
  }
}
