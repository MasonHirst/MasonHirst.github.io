import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-poke-detail',
  templateUrl: './poke-detail.component.html',
  styleUrls: ['./poke-detail.component.css'],
})
export class PokeDetailComponent implements OnInit {
  @Input() poke: any = null;

  constructor() {}

  ngOnInit(): void {}

  weightToLbs(weight: number) {
    return Math.round(weight * 0.220462);
  }
  formatId(id: number) {
    return '#' + id.toString().padStart(4, '0');
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
}
