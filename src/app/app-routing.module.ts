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

const routes: Routes = [
  { path: 'home', component: LandingPageComponent },
  {
    path: 'projects',
    component: ProjectsPageComponent,
    children: [
      { path: ':name', component: ProjectComponent },
      { path: '**', redirectTo: 'pokerface' },
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
