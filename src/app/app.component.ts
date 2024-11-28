import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    const { protocol, hostname } = document.location;
    let baseUrl = protocol + '//' + hostname;
    if (!environment.production) {
      console.log('adding port 8080 to axios requests!')
      baseUrl += ':8080';
    }
    axios.defaults.baseURL = baseUrl; 
  }
}
