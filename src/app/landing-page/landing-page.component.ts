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

  filterRelevantExps(exps: ExperienceModel[]) {
    return exps.filter((exp) => exp.relevant)
  }

  constructor(private styleService: StylingService, private dataService: DataService) {}


  ngOnInit() {
    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    })

    this.projects = this.dataService.getProjects()
    this.experiences = this.dataService.getExperiences()
  }

  calcWorkCardMargin(index: number) {
    if (this.screen >= 700) {
      return index * 25 + 'px'
    } else if (this.screen >= 400) {
      if (index % 2 !== 0) {
        return '10px'
      } else {
        return '-10px'
      }
    } else {
      return '0px'
    }
  }
}
