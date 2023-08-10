import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AudioPlayerService } from 'src/app/audio-player.service';
import { StylingService } from 'src/app/styling.service';
import { playlist } from 'src/app/playlistData';
import { Audio } from './audio.model';

@Component({
  selector: 'app-audio-library',
  templateUrl: './audio-library.component.html',
  styleUrls: ['./audio-library.component.css'],
})
export class AudioLibraryComponent implements OnDestroy, OnInit, AfterViewInit {
  screen: number;
  playlist: Audio[] = playlist;
  hideWavesurfer: boolean = false;
  musicRendered: boolean = false;
  currentSongIndex: number;
  drawingSurfer: boolean = false;
  isPlaying: boolean = false;
  @ViewChild('bigWavesurfer') bigWavesurferEl: any;

  constructor(
    private styleService: StylingService,
    private audioService: AudioPlayerService
  ) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((screen) => {
      this.screen = screen;
    });
    this.audioService.songRendered$.subscribe((rendered) => {
      this.musicRendered = rendered;
    });
    this.audioService.drawingSurfer$.subscribe((drawing) => {
      this.drawingSurfer = drawing;
    });
    this.audioService.isPlaying$.subscribe((playing) => {
      this.isPlaying = playing;
    });
    this.audioService.currentSongIndex$.subscribe((index) => {
      this.currentSongIndex = index;
    });
  }

  ngAfterViewInit(): void {
    this.audioService.toggleInLibrary(true);
    this.audioService.fillBigCont(this.bigWavesurferEl.nativeElement);
    this.audioService.changeSurferCont(true);
  }

  ngOnDestroy(): void {
    console.log('destroyed');
    this.audioService.toggleInLibrary(false);
    this.audioService.changeSurferCont(false);
  }

  incrementSong(next: boolean): void {
    this.audioService.incrementSong(next);
  }

  playPauseSong(): void {
    this.audioService.playPause();
  }
}
