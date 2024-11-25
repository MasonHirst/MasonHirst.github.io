import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewGameComponent } from './components/new-game/new-game.component';
import { BiddingComponent } from './components/bidding/bidding.component';
import { MeldingComponent } from './components/melding/melding.component';
import { TrickTakingComponent } from './components/trick-taking/trick-taking.component';
import { RoundSummaryComponent } from './components/round-summary/round-summary.component';
import { PinochleScoreboardComponent } from './pinochle-scoreboard.component';
import { FormatSelectComponent } from './components/format-select/format-select.component';
import { GameReviewComponent } from './components/game-review/game-review.component';

const routes: Routes = [
  {
    path: '',
    component: PinochleScoreboardComponent,
    children: [
      { path: '', component: FormatSelectComponent },
      { path: 'new-game', component: NewGameComponent },
      { path: 'bidding', component: BiddingComponent },
      { path: 'melding', component: MeldingComponent },
      { path: 'trick-taking', component: TrickTakingComponent },
      { path: 'round-summary', component: RoundSummaryComponent },
      { path: 'game-review', component: GameReviewComponent },
      { path: '**', redirectTo: '' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PinochleScoreboardRoutingModule {}
