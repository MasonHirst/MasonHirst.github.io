import { Component, Input, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-join-page',
  templateUrl: './join-page.component.html',
  styleUrls: ['./join-page.component.css']
})
export class JoinPageComponent implements OnInit {

  @Input() gameCode: string

  constructor(private nimmtService: SixNimmtService) {}

  ngOnInit() {}
}