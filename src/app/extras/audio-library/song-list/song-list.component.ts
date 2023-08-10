import { Component, OnInit, ViewChild } from '@angular/core';
import { AudioPlayerService } from 'src/app/audio-player.service';
import { playList } from 'src/app/playlistData';

@Component({
  selector: 'app-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.css']
})
export class SongListComponent implements OnInit {
  playList = playList;

  constructor(private audioService: AudioPlayerService) {}

  ngOnInit(): void {
    
  }

  onNewSong(index: number) {
    this.audioService.newSong(index);
  }
}
