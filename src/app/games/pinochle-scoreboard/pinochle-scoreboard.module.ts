import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PinochleScoreboardRoutingModule } from './pinochle-scoreboard-routing.module';
import { NewGameComponent } from './components/new-game/new-game.component';
import { BiddingComponent } from './components/bidding/bidding.component';
import { MeldingComponent } from './components/melding/melding.component';
import { TrickTakingComponent } from './components/trick-taking/trick-taking.component';
import { RoundSummaryComponent } from './components/round-summary/round-summary.component';
import { NavButtonsComponent } from './components/nav-buttons/nav-buttons.component';
import { FormatSelectComponent } from './components/format-select/format-select.component';
import { GameStatusComponent } from './components/game-status/game-status.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { RoundSummaryTableComponent } from './components/round-summary-table/round-summary-table.component';
import { PastGamesModalComponent } from './components/modals/past-games-modal/past-games-modal.component';

@NgModule({
  declarations: [
    NewGameComponent,
    BiddingComponent,
    MeldingComponent,
    TrickTakingComponent,
    RoundSummaryComponent,
    NavButtonsComponent,
    FormatSelectComponent,
    GameStatusComponent,
    GameReviewComponent,
    RoundSummaryTableComponent,
    PastGamesModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    PinochleScoreboardRoutingModule, // Import routing module
  ]
})
export class PinochleScoreboardModule {}