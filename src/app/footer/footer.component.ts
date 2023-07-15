import { Component, OnInit } from '@angular/core';
import { StylingService } from '../styling.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements OnInit {
  emailLink: string = 'mhirstdev@gmail.com';
  screenSize: number;

  constructor(private styleService: StylingService) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((size: number) => {
      this.screenSize = size;
    });
  }

  onCopyEmail() {
    navigator.clipboard.writeText(this.emailLink);
    this.emailLink = 'copied email to clipboard!';
    setTimeout(() => {
      this.emailLink = 'mhirstdev@gmail.com';
    }, 1400);
  }
}

