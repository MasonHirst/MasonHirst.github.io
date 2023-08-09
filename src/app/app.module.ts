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
import { ExtrasComponent } from './extras/extras.component';
import { PokeSearchComponent } from './extras/poke-search/poke-search.component';
import { SelectExtraComponent } from './extras/select-extra/select-extra.component';
import { PokeDetailComponent } from './extras/poke-search/poke-detail/poke-detail.component';
import { PianoComponent } from './extras/piano/piano.component';
import { WaveSurferComponent } from './extras/piano/wave-surfer/wave-surfer.component';

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
    StateGuesserComponent,
    ExtrasComponent,
    PokeSearchComponent,
    SelectExtraComponent,
    PokeDetailComponent,
    PianoComponent,
    WaveSurferComponent,
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
