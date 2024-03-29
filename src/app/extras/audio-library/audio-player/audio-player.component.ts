import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { AudioPlayerService } from 'src/app/audio-player.service';
import { Audio } from '../audio.model';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.css'],
})
export class AudioPlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('waveform') waveformEl: any;
  @ViewChild('waveformSmallCont') waveFormCont: any
  isPlaying: boolean = false;
  currentSong: Audio;
  songRendered: boolean = false;
  drawingSurfer: boolean = false;
  audioPullout: boolean = false;
  inLibrary: boolean = false;

  constructor(private audioService: AudioPlayerService) {}

  ngOnInit(): void {
    this.audioService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = isPlaying;
    });
    this.audioService.songRendered$.subscribe((rendered) => {
      this.songRendered = rendered;
    })
    this.audioService.inLibrary$.subscribe((inLibrary) => {
      this.inLibrary = inLibrary;
    })
    this.audioService.currentSong$.subscribe((song) => {
      this.currentSong = song;
    })
    this.audioService.drawingSurfer$.subscribe((drawing) => {
      this.drawingSurfer = drawing;
    })
  }

  ngAfterViewInit(): void {
    this.audioService.fillSmallCont(this.waveFormCont.nativeElement);
    this.audioService.initWaveSurfer(this.waveformEl.nativeElement);
  }
}
