import { Component, OnInit } from '@angular/core';
import { ExperienceModel } from './experience.model';
import { Project } from '../projects-page/project.model';
import { StylingService } from '../styling.service';
import { DataService } from '../data.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements OnInit {
  experiences : ExperienceModel[]
  projects: Project[]
  screen: number

  constructor(private styleService: StylingService, private dataService: DataService) {}

  ngOnInit() {
    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    })

    this.projects = this.dataService.getProjects()
    this.experiences = this.dataService.getExperiences()
  }
}
