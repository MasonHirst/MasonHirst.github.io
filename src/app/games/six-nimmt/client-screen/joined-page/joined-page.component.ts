import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-joined-page',
  templateUrl: './joined-page.component.html',
  styleUrls: ['./joined-page.component.css']
})
export class JoinedPageComponent implements OnInit {
  @Input() gameCode: string;
  @Input() gameData: any;
  
  urlGameCode: string = '';
  constructor(private activatedRoute: ActivatedRoute, private nimmtService: SixNimmtService) {}

  ngOnInit() {
    this.nimmtService.checkGameExists(location.href.split('/').pop())
    
    this.activatedRoute.params.subscribe((params) => {
      this.urlGameCode = params['gameCode'];
    });
  }
}
