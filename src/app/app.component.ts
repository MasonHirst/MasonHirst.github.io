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
    // axios.defaults.baseURL = document.location.origin;
    axios.defaults.baseURL = 'http://192.168.1.196:8080'
    // axios.defaults.baseURL = 'http://192.168.12.196:8080'
  }
}
