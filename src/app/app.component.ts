import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import axios from 'axios';
import { filter, map, mergeMap } from 'rxjs';
import { environment } from 'src/environments/environment';
const selfHostedServerUrl = 'https://portfolio.masonhirst.com';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // This code block watches for navigation events, specifically when navigation completes
    // It looks for title data in the route snapshot and updates the title service,
    // So the title of the page changes when the user navigates to a new route.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute.firstChild;
        let lastRouteWithTitle = route;
        while (route?.firstChild) {
          route = route.firstChild;
          if (route.snapshot.data['title']) {
            lastRouteWithTitle = route;
          }
        }
        return lastRouteWithTitle;
      }),
      filter(route => !!route),
      mergeMap(route => route!.data)
    ).subscribe(data => {
      const title = data['title'];
      if (title) {
        this.titleService.setTitle(`Mason Hirst | ${title}`);
      }
    });
  }

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
