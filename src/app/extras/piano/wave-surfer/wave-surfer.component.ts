import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';


@Component({
  selector: 'app-wave-surfer',
  templateUrl: './wave-surfer.component.html',
  styleUrls: ['./wave-surfer.component.css']
})
export class WaveSurferComponent implements OnInit, AfterViewInit {
@ViewChild('waveform') private waveformElement: ElementRef;

  private wavesurfer: WaveSurfer;

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    // Initialize WaveSurfer
    this.wavesurfer = WaveSurfer.create({
      container: this.waveformElement.nativeElement,
      waveColor: 'violet',
      progressColor: 'purple',
      // responsive: true
    });

    // Load an audio file
    this.wavesurfer.load('https://drive.google.com/file/d/185hqdYYIcaQrn2UN0ovGVNmRnyFlQmXo/preview');
  }

  
}
