import { Component, OnInit } from '@angular/core';
import { Project } from './project.model';
import { DataService } from '../data.service';
import { StylingService } from '../styling.service';

@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.css'],
})
export class ProjectsPageComponent implements OnInit {
  screen: number;
  projects: Project[];

  constructor(
    private dataService: DataService,
    private styleService: StylingService
  ) {}

  ngOnInit() {
    this.projects = this.dataService.getProjects();
    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    });
  }
}
