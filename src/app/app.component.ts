import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StylingService } from './styling.service';
import { Tab } from './tab.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  activeTab: string = 'home';
  screen: number
  tabs: Tab[] = [
    new Tab('Home', 'home'),
    new Tab('Projects', 'projects'),
    new Tab('Resume', 'resume'),
  ]

  constructor(private router: Router, private styleService: StylingService) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Extract the updated URL extension
        const urlExtension = event.urlAfterRedirects.split('/').pop();
        this.activeTab = urlExtension;
      })
    
      this.styleService.screenSize$.subscribe((size) => {
        this.screen = size;
      })
  }
}
