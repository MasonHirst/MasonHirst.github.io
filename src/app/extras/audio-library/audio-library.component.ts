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
  drawingSurfer: boolean = false;
  audioPullup: boolean = false;
  currentSong: Audio = null;
  @ViewChild('bigWavesurfer') bigWavesurferEl: any;

  constructor(
    private styleService: StylingService,
    private audioService: AudioPlayerService
  ) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((screen) => {
      this.screen = screen;
    });
    this.audioService.drawingSurfer$.subscribe((drawing) => {
      this.drawingSurfer = drawing;
    });
    this.audioService.currentSong$.subscribe((song) => {
      this.currentSong = song;
    });
    this.currentSong = this.audioService.getSurferStatuses().currentSong
  }

  ngAfterViewInit(): void {
    this.audioService.toggleInLibrary(true);
    this.audioService.fillBigCont(this.bigWavesurferEl.nativeElement);
    this.audioService.changeSurferCont(true);
  }

  ngOnDestroy(): void {
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
