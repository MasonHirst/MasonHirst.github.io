import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';
const selfHostedServerUrl = 'https://portfolio.masonhirst.com';

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
      console.log('Adding port 8080 to axios requests!')
      baseUrl += ':8080';
    } else if (hostname.includes('github.io') || hostname.includes('masonhirst.com')) {
      console.log('Redirecting requests to https://portfolio.masonhirst.com')
      baseUrl = selfHostedServerUrl;
    }
    axios.defaults.baseURL = baseUrl; 
  }
}
