import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MinesweeperService } from './minesweeper.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  providers: [MinesweeperService],
})
export class GamesComponent implements OnInit {
  inGame = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.inGame = this.isGameRoute(e.urlAfterRedirects);
    });
  }

  ngOnInit(): void {
    this.inGame = this.isGameRoute(this.router.url);
  }

  private isGameRoute(url: string): boolean {
    return url.includes('/host/') || url.includes('/client/');
  }
}
