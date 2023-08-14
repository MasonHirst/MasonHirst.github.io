import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Audio } from '../../audio.model';
import { AudioPlayerService } from 'src/app/audio-player.service';
import { StylingService } from 'src/app/styling.service';

@Component({
  selector: 'app-music-controls',
  templateUrl: './music-controls.component.html',
  styleUrls: ['./music-controls.component.css'],
})
export class MusicControlsComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse: EventEmitter<void> = new EventEmitter<void>();
  isPlaying: boolean = false;
  isDrawing: boolean = false;
  currentSong: Audio = null;
  screen: number;

  constructor(private audioService: AudioPlayerService, private styleService: StylingService) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((screen) => {
      this.screen = screen;
    });
    this.audioService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = isPlaying;
    });
    this.audioService.drawingSurfer$.subscribe((drawing) => {
      this.isDrawing = drawing;
    });
    this.audioService.currentSong$.subscribe((song) => {
      this.currentSong = song;
    });
    this.isPlaying = this.audioService.getSurferStatuses().isPlaying;
    this.isDrawing = this.audioService.getSurferStatuses().drawingSurfer;
    this.currentSong = this.audioService.getSurferStatuses().currentSong;
  }

  incrementSong(next: boolean): void {
    if (this.isDrawing) return;
    this.audioService.incrementSong(next);
  }

  playPauseSong(): void {
    if (this.isDrawing) return;
    this.audioService.playPause();
  }
}
