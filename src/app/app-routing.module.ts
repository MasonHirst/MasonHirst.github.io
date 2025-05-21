import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ProjectsPageComponent } from './projects-page/projects-page.component';
import { WorkHistoryComponent } from './work-history/work-history.component';
import { GamesComponent } from './games/games.component';
import { ProjectComponent } from './projects-page/project/project.component';
import { MinesweeperComponent } from './games/minesweeper/minesweeper.component';
import { GameSelectComponent } from './games/game-select/game-select.component';
import { StateGuesserComponent } from './games/state-guesser/state-guesser.component';
import { ExtrasComponent } from './extras/extras.component';
import { PokeSearchComponent } from './extras/poke-search/poke-search.component';
import { SelectExtraComponent } from './extras/select-extra/select-extra.component';
import { AudioLibraryComponent } from './extras/audio-library/audio-library.component';
import { SixNimmtComponent } from './games/six-nimmt/six-nimmt.component';
import { HostScreenComponent } from './games/six-nimmt/host-screen/host-screen.component';
import { ClientScreenComponent } from './games/six-nimmt/client-screen/client-screen.component';
import { BankComponent } from './games/bank/bank.component';
import { ClientScreenComponent as BankClientScreen } from './games/bank/client-screen/client-screen.component';
import { HostScreenComponent as BankHostScreen } from './games/bank/host-screen/host-screen.component';

const routes: Routes = [
  { path: 'home', component: LandingPageComponent },
  {
    path: 'projects',
    component: ProjectsPageComponent,
    children: [
      { path: ':name', component: ProjectComponent },
      { path: '**', redirectTo: 'pokerface' }
    ],
  },
  { path: 'resume', component: WorkHistoryComponent },
  {
    path: 'games',
    component: GamesComponent,
    children: [
      { path: '', component: GameSelectComponent },
      { path: 'minesweeper', component: MinesweeperComponent },
      { path: 'state-guesser', component: StateGuesserComponent },
      {
        path: '6-nimmt!',
        children: [
          { path: '', component: SixNimmtComponent },
          {
            path: 'host/:gameCode',
            component: HostScreenComponent,
          },
          {
            path: 'client/:gameCode',
            component: ClientScreenComponent,
          },
        ],
      },
      {
        path: 'bank',
        children: [
          { path: '', component: BankComponent },
          { path: ':gameCode', component: BankClientScreen },
          { path: 'host/:gameCode', component: BankHostScreen },
          { path: '**', redirectTo: '' },
        ]
      },
      {
        path: 'pinochle-scoreboard',
        loadChildren: () => import('./games/pinochle-scoreboard/pinochle-scoreboard.module').then(m => m.PinochleScoreboardModule)
      },
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: 'extras',
    component: ExtrasComponent,
    children: [
      { path: '', component: SelectExtraComponent },
      { path: 'poké-search', component: PokeSearchComponent },
      { path: 'audio-library', component: AudioLibraryComponent },
      { path: '**', redirectTo: '' },
    ],
  },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
