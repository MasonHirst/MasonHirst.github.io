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
import { AudioLibraryComponent } from './extras/audio-library/audio-library.component';
import { AudioPlayerComponent } from './extras/audio-library/audio-player/audio-player.component';
import { SongListComponent } from './extras/audio-library/song-list/song-list.component';
import { SoundAnimationComponent } from './extras/audio-library/audio-player/sound-animation/sound-animation.component';
import { MusicControlsComponent } from './extras/audio-library/audio-player/music-controls/music-controls.component';
import { SixNimmtComponent } from './games/six-nimmt/six-nimmt.component';
import { GameRoomHandlerComponent } from './games/game-room-handler/game-room-handler.component';
import { NimmtCardComponent } from './games/six-nimmt/nimmt-card/nimmt-card.component';
import { HostScreenComponent } from './games/six-nimmt/host-screen/host-screen.component';
import { ClientScreenComponent } from './games/six-nimmt/client-screen/client-screen.component';
import { JoinPageComponent } from './games/six-nimmt/host-screen/join-page/join-page.component';
import { GameTableComponent } from './games/six-nimmt/host-screen/game-table/game-table.component';
import { JoinedPageComponent } from './games/six-nimmt/client-screen/joined-page/joined-page.component';
import { CardSelectComponent } from './games/six-nimmt/client-screen/card-select/card-select.component';
import { PickARowComponent } from './games/six-nimmt/client-screen/card-select/pick-a-row/pick-a-row.component';

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
    AudioLibraryComponent,
    AudioPlayerComponent,
    SongListComponent,
    SoundAnimationComponent,
    MusicControlsComponent,
    SixNimmtComponent,
    GameRoomHandlerComponent,
    NimmtCardComponent,
    HostScreenComponent,
    ClientScreenComponent,
    JoinPageComponent,
    GameTableComponent,
    JoinedPageComponent,
    CardSelectComponent,
    PickARowComponent,
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
