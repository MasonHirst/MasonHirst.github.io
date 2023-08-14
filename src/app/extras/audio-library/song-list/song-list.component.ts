import { Component, OnInit, ViewChild } from '@angular/core';
import { AudioPlayerService } from 'src/app/audio-player.service';
import { playlist } from 'src/app/playlistData';
import { Audio } from '../audio.model';
import { StylingService } from 'src/app/styling.service';

@Component({
  selector: 'app-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css']
})
export class SongListComponent implements OnInit {
  screen: number;
  playList: Audio[] = playlist;

  constructor(private audioService: AudioPlayerService, private styleService: StylingService) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe(screen => {
      this.screen = screen;
    });
  }

  onNewSong(index: number) {
    this.audioService.newSong(index);
  }
}
