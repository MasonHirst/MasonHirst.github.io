import { Component } from '@angular/core';
import { Tab } from '../tab.model';
import { StylingService } from '../styling.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  activeTab: string = 'home';
  screen: number
  tabs: Tab[] = [
    new Tab('Home', 'home'),
    new Tab('Projects', 'projects'),
    new Tab('Resume', 'resume'),
    new Tab('Games', 'games')
  ]

  constructor(private styleService: StylingService,) {}

  ngOnInit() {
      this.styleService.screenSize$.subscribe((size) => {
        this.screen = size;
      })
  }
}
