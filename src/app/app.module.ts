import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

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
import { HeaderComponent } from './header/header.component';
import { MinesweeperComponent } from './games/minesweeper/minesweeper.component';
import { GameSelectComponent } from './games/game-select/game-select.component';
import { StateGuesserComponent } from './games/state-guesser/state-guesser.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    ProjectsPageComponent,
    WorkHistoryComponent,
    FooterComponent,
    GamesComponent,
    ProjectComponent,
    HeaderComponent,
    MinesweeperComponent,
    GameSelectComponent,
    StateGuesserComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [StylingService, DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
