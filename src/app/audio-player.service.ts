import { EventEmitter, Injectable, Output } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import { playlist } from './playlistData';
import { Audio } from './extras/audio-library/audio.model';

@Injectable({
  providedIn: 'root',
})
export class AudioPlayerService {
  private bigContEl: any;
  private smallContEl: any;
  private wavesurferEl: any;
  private wavesurfer: WaveSurfer;
  private currentSongIndex: number;
  @Output() currentSongIndex$: EventEmitter<number> = new EventEmitter();
  private currentSong: Audio = null;
  @Output() currentSong$: EventEmitter<Audio> = new EventEmitter();
  private autoRestartPlaylist: boolean = false;
  private songLoading: boolean = false;
  @Output() songLoading$: EventEmitter<boolean> = new EventEmitter();
  private isPlaying: boolean = false;
  @Output() isPlaying$: EventEmitter<boolean> = new EventEmitter();
  private songRendered: boolean = false;
  @Output() songRendered$: EventEmitter<boolean> = new EventEmitter();
  private drawingSurfer: boolean = false;
  @Output() drawingSurfer$: EventEmitter<boolean> = new EventEmitter();
  private inLibrary: boolean = false;
  @Output() inLibrary$: EventEmitter<boolean> = new EventEmitter();

  constructor() {}

  initWaveSurfer(surferRef: any): void {
    this.wavesurferEl = surferRef;
    this.wavesurfer = WaveSurfer.create({
      container: surferRef,
      waveColor: 'violet',
      progressColor: 'purple',
      height: 60,
      barHeight: 1,
      barWidth: 1.5,
      barGap: 2,
      barRadius: 5,
    });

    this.wavesurfer.on('ready', () => {
      this.wavesurfer.setOptions({
        barHeight: playlist[this.currentSongIndex].barHeight,
      })
      this.wavesurfer.play();
      if (!this.songRendered) {
        this.songRendered = true;
        this.songRendered$.emit(this.songRendered);
      }
    });

    this.wavesurfer.on('redraw', () => {
      this.wavesurferEl.style.opacity = 1;
      this.drawingSurfer = false;
      this.drawingSurfer$.emit(this.drawingSurfer);
    });

    this.wavesurfer.on('loading', (progress: number) => {
      if (progress === 100) {
        this.songLoading = false;
        this.songLoading$.emit(this.songLoading);
      } else {
        this.wavesurferEl.style.opacity = 0
        if (!this.drawingSurfer) {
          this.drawingSurfer = true;
          this.drawingSurfer$.emit(this.drawingSurfer);
        }
        if (!this.songLoading) {
          this.songLoading = true;
          this.songLoading$.emit(this.songLoading);
        }
      }
    });

    this.wavesurfer.on('finish', () => {
      this.incrementSong(true, false);
    });

    this.wavesurfer.on('play', () => {
      this.isPlaying = true;
      this.isPlaying$.emit(this.isPlaying);
    });
    this.wavesurfer.on('pause', () => {
      this.isPlaying = false;
      this.isPlaying$.emit(this.isPlaying);
    });
  }

  incrementSong(next: boolean, manual: boolean = true): void {
    if (!this.wavesurfer.getDecodedData()) return;
    if (next) {
      if (this.currentSongIndex === playlist.length - 1) {
        if (manual) {
          this.newSong(0);
        } else if (!manual && this.autoRestartPlaylist) {
          this.newSong(0);
        }
      } else {
        this.newSong(this.currentSongIndex + 1);
      }
    } else {
      if (this.wavesurfer.getCurrentTime() > 3) {
        this.wavesurfer.seekTo(0);
      } else {
        if (this.currentSongIndex === 0) {
          this.newSong(playlist.length - 1);
        } else {
          this.newSong(this.currentSongIndex - 1);
        }
      }
    }
  }

  getCurrentSongIndex(): number {
    return this.currentSongIndex;
  }

  getSurferStatuses(): any {
    return {
      isPlaying: this.isPlaying,
      songRendered: this.songRendered,
      drawingSurfer: this.drawingSurfer,
      songLoading: this.songLoading,
      currentSongIndex: this.currentSongIndex,
      currentSong: this.currentSong,
      autoRestartPlaylist: this.autoRestartPlaylist,
    };
  }

  newSong(index: number): void {
    this.wavesurfer.stop();
    this.wavesurfer.load(playlist[index].url);
    this.wavesurfer.setVolume(playlist[index].volumeFactor);
    this.currentSongIndex = index;
    this.currentSongIndex$.emit(this.currentSongIndex);
    this.currentSong = playlist[index];
    this.currentSong$.emit(this.currentSong);
  }

  getWaveSurferInstance(): WaveSurfer {
    return this.wavesurfer;
  }

  playPause(): void {
    if (!this.wavesurfer.getDecodedData()) {
      // play a random song from the array
      const randomIndex = Math.floor(Math.random() * playlist.length);
      if (this.inLibrary) {
        this.bigContEl.appendChild(this.wavesurferEl);
      }
      this.newSong(randomIndex);
    } else {
      this.wavesurfer.playPause();
    }
  }

  fillBigCont(containerRef: any): void {
    this.bigContEl = containerRef;
  }
  fillSmallCont(containerRef: any): void {
    this.smallContEl = containerRef;
  }

  changeSurferCont(inLibrary: boolean): void {
    if (inLibrary) {
      this.bigContEl.appendChild(this.wavesurferEl);
    } else {
      this.smallContEl.appendChild(this.wavesurferEl);
    }
  }

  toggleInLibrary(inLibrary: boolean): void {
    this.inLibrary = inLibrary;
    this.inLibrary$.emit(this.inLibrary);
  }
}
