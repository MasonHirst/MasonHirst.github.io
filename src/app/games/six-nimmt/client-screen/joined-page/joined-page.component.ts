import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-joined-page',
  templateUrl: './joined-page.component.html',
  styleUrls: ['./joined-page.component.css']
})
export class JoinedPageComponent implements OnInit {
  urlGameCode: string = '';
  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.urlGameCode = params['gameCode'];
    });
  }
}
