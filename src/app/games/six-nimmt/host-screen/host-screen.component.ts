import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-host-screen',
  templateUrl: './host-screen.component.html',
  styleUrls: ['./host-screen.component.css'],
})
export class HostScreenComponent implements OnInit {
  routeGameCode: string = '';
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.routeGameCode = params['gameCode'];
    });
  }
}
