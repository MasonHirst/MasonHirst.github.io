import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/data.service';
import { Project } from 'src/app/projects-page/project.model';
import { StylingService } from 'src/app/styling.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'],
})
export class ProjectComponent {
  proj: Project;
  screen: number;
  safeLiveSiteUrl: SafeResourceUrl;

  constructor(
    private styleService: StylingService,
    private activeRoute: ActivatedRoute,
    private dataService: DataService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.activeRoute.params.subscribe((params) => {
      this.proj = this.dataService.getProject(params.name)
      this.safeLiveSiteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.proj.liveLink);
    });

    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    });
  }
}
