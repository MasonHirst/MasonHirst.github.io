import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-nav-buttons',
  templateUrl: './nav-buttons.component.html',
  styleUrls: ['./nav-buttons.component.css'],
})
export class NavButtonsComponent {
  @Input() goBackLabel!: string;
  @Input() middleActionLabel?: string;
  @Input() goForwardLabel!: string;

  @Output() backClicked = new EventEmitter<void>();
  @Output() middleActionClicked = new EventEmitter<void>();
  @Output() forwardClicked = new EventEmitter<void>();

  onBackClicked(): void {
    this.backClicked.emit();
  }
  onMiddleActionClicked(): void {
    this.middleActionClicked.emit();
  }
  onForwardClicked(): void {
    this.forwardClicked.emit();
  }
}
