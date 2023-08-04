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
  ]
}
