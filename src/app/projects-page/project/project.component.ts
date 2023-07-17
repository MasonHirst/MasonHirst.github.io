import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/data.service';
import { Project } from 'src/app/projects-page/project.model';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent {
  proj: Project
  constructor(private activeRoute: ActivatedRoute, private dataService: DataService ) {}

  ngOnInit() {
    this.activeRoute.params.subscribe((params) => {
      this.proj = this.dataService.getProject(params.name)
    })
  }
  
}
