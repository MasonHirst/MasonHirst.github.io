import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Tab } from '../tab.model';
import { StylingService } from '../styling.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  activeTab: string = 'home';
  screen: number = 0;
  inGame = false;
  tabs: Tab[] = [
    new Tab('Home', 'home'),
    new Tab('Projects', 'projects'),
    new Tab('Resume', 'resume'),
    new Tab('Games', 'games'),
    new Tab('Extras', 'extras')
  ]

  constructor(private styleService: StylingService, private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.inGame = this.isGameRoute(e.urlAfterRedirects);
    });
  }

  ngOnInit() {
    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    });
    this.inGame = this.isGameRoute(this.router.url);
  }

  private isGameRoute(url: string): boolean {
    return url.includes('/host/') || url.includes('/client/');
  }
}
