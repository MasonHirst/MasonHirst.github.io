import { Component, OnInit } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    const { protocol, hostname } = document.location;
    axios.defaults.baseURL = protocol + '//' + hostname + ':8080';
    // axios.defaults.baseURL = 'http://10.0.0.251:8080'
    // axios.defaults.baseURL = 'http://192.168.12.196:8080'
    // axios.defaults.baseURL = 'http://10.254.1.50:8080'
  }
}
