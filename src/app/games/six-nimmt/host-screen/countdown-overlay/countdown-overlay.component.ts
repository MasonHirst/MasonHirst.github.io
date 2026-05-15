import { Component, computed, effect, signal } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-countdown-overlay',
  templateUrl: './countdown-overlay.component.html',
  styleUrls: ['./countdown-overlay.component.css'],
})
export class CountdownOverlayComponent {
  readonly countdown = this.nimmtService.countdown;
  readonly visible = computed(() => this.countdown() !== null);
  // Briefly set to false then back to true on each tick so Angular removes and
  // re-adds the number element, which restarts the CSS animation cleanly.
  readonly showNumber = signal(true);

  constructor(private nimmtService: SixNimmtService) {
    effect(() => {
      if (this.countdown() !== null) {
        this.showNumber.set(false);
        setTimeout(() => this.showNumber.set(true), 16);
      }
    }, { allowSignalWrites: true });
  }
}
