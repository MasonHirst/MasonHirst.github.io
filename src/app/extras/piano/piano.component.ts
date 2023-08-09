import { Component } from '@angular/core';
import { Audio } from '../audio-library/audio.model';

@Component({
  selector: 'app-piano',
  templateUrl: './piano.component.html',
  styleUrls: ['./piano.component.css']
})
export class PianoComponent {
  songsArr: Audio[] = [
    new Audio(
      'https://res.cloudinary.com/dk9vsivmu/video/upload/v1691555468/Softer_Christofori_s_Dream_-_cover_by_Mason_Hirst_lvnr7g.mp3',
      'Christofori\'s Dream',
      '5:39',
      'cover',
      'Mason Hirst',
      ''
    )
  ]

}
