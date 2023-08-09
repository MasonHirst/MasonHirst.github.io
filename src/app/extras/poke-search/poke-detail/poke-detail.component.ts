import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StylingService } from 'src/app/styling.service';

@Component({
  selector: 'app-poke-detail',
  templateUrl: './poke-detail.component.html',
  styleUrls: ['./poke-detail.component.css'],
})
export class PokeDetailComponent implements OnInit {
  screen: number;
  @Input() poke: any = null;
  @Input() imgLoading: boolean = false;
  // I need an event that will emit when the image is loaded
  @Output() imgLoaded: EventEmitter<void> = new EventEmitter();
  @Output() increment: EventEmitter<boolean> = new EventEmitter();

  constructor(private styleService: StylingService) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((screen) => {
      this.screen = screen;
    });
  }

  weightToLbs(weight: number) {
    return Math.round(weight * 0.220462);
  }
  formatId(id: number) {
    return '#' + id.toString().padStart(4, '0');
  }

  totalStats() {
    return this.poke.stats.reduce((acc: number, stat: any) => {
      return acc + stat.base_stat;
    }, 0);
  }

  formatHeight(height: number) {
    const multiplier = 3.93701;
    const heightInInches = Math.round(height * multiplier);
    const feet = Math.floor(heightInInches / 12);
    const inches = heightInInches % 12;
    return `${feet}' ${inches}"`;
  }

  formatStatName(name: string) {
    return name.replace('-', ' ');
  }

  formatCategoryName(name: string) {
    return name.replace(' Pokémon', '');
  }

  onImgLoad(event: any) {
    if (event) {
      this.imgLoaded.emit();
    }
  }
}
