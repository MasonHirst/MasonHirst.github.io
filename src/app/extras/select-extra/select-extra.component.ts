import { Component } from '@angular/core';
import { PreviewCard } from 'src/app/preview-card.model';

@Component({
  selector: 'app-select-extra',
  templateUrl: './select-extra.component.html',
  styleUrls: ['./select-extra.component.css']
})
export class SelectExtraComponent {
  extrasLinks: PreviewCard[] = [
    new PreviewCard(
      'Pokédex',
      'poké-search',
      'https://res.cloudinary.com/dk9vsivmu/image/upload/v1691112498/charizard-bg_dirfra.jpg'
    ),
    new PreviewCard(
      'Audio Library',
      'audio-library',
      // 'https://images.unsplash.com/photo-1546058256-47154de4046c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fHBpYW5vfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60'
      'https://images.unsplash.com/photo-1583267986680-b8baf7fa05e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJnYiUyMHBpYW5vfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60'
    ),
  ]
}
