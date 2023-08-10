import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { AudioPlayerService } from 'src/app/audio-player.service';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.css'],
})
export class AudioPlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('waveform') waveformEl: any;
  @ViewChild('waveformSmallCont') waveFormCont: any
  isPlaying: boolean = false;
  songRendered: boolean = false;
  hideWavesurfer: boolean = false;

  constructor(private audioService: AudioPlayerService) {}

  ngOnInit(): void {
    this.audioService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = isPlaying;
    });
    this.audioService.songRendered$.subscribe((rendered) => {
      this.songRendered = rendered;
    })

  }

  ngAfterViewInit(): void {
    this.audioService.fillSmallCont(this.waveFormCont.nativeElement);
    this.audioService.initWaveSurfer(this.waveformEl.nativeElement);
  }

  incrementSong(next: boolean) {
    this.audioService.incrementSong(next, true);
  }

  playPauseSong() {
    this.audioService.playPause();
  }
}
