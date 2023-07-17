import { Component, OnInit } from '@angular/core';
import { Project } from './project.model';
import { DataService } from '../data.service';

@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.css'],
})
export class ProjectsPageComponent implements OnInit {
  projects: Project[]

  constructor(private dataService: DataService) {}
  
  ngOnInit() {
    this.projects = this.dataService.getProjects()
  }
}
