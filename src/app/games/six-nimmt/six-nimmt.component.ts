import { Component } from '@angular/core';
import axios from 'axios';
import { SixNimmtService } from './six-nimmt.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-six-nimmt',
  templateUrl: './six-nimmt.component.html',
  styleUrls: ['./six-nimmt.component.css'],
})
export class SixNimmtComponent {
  constructor(private nimmtService: SixNimmtService, private router: Router) {}

  handleCodeSubmit(code: string) {
    console.log('gamecode: ', code);
  }

  handleHostGame() {
    axios.post('/api/nimmt/create', {}).then(({ data }) => {
      console.log('data: ', data);
      if (data.length === 4) {
        this.router.navigate([`/games/6-nimmt!/host/${data}`]);
      }
    });
    console.log('host game');
  }
}
