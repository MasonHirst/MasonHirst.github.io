import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sound-animation',
  templateUrl: './sound-animation.component.html',
  styleUrls: ['./sound-animation.component.css']
})
export class SoundAnimationComponent {
  @Input() isPlaying: boolean;
}
