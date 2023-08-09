import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import WaveSurfer from 'wavesurfer.js';

@Component({
  selector: 'app-wave-surfer',
  templateUrl: './wave-surfer.component.html',
  styleUrls: ['./wave-surfer.component.css'],
})
export class WaveSurferComponent implements AfterViewInit {
  @ViewChild('waveform') private waveformElement: ElementRef;
  @Input() audioUrl: string;
  private wavesurfer: WaveSurfer;

  ngAfterViewInit(): void {
    this.wavesurfer = WaveSurfer.create({
      container: this.waveformElement.nativeElement,
      waveColor: 'violet',
      progressColor: 'purple',
      // barWidth: 2
    });
    this.wavesurfer.load(this.audioUrl);
  }

  playPause() {
    this.wavesurfer.playPause();
  }
}
