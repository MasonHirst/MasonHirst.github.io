import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ProjectsPageComponent } from './projects-page/projects-page.component';
import { WorkHistoryComponent } from './work-history/work-history.component';
import { FooterComponent } from './footer/footer.component';
import { StylingService } from './styling.service';
import { GamesComponent } from './games/games.component';
import { ProjectComponent } from './projects-page/project/project.component';
import { DataService } from './data.service';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    ProjectsPageComponent,
    WorkHistoryComponent,
    FooterComponent,
    GamesComponent,
    ProjectComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [StylingService, DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
