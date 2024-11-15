import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PinochleScoreboardRoutingModule } from './pinochle-scoreboard-routing.module';
import { NewGameComponent } from './components/new-game/new-game.component';
import { BiddingComponent } from './components/bidding/bidding.component';
import { MeldingComponent } from './components/melding/melding.component';
import { TrickTakingComponent } from './components/trick-taking/trick-taking.component';
import { RoundSummaryComponent } from './components/round-summary/round-summary.component';
import { ConfirmChoiceModalComponent } from './components/modals/confirm-choice-modal/confirm-choice-modal.component';
import { NavButtonsComponent } from './components/nav-buttons/nav-buttons.component';

@NgModule({
  declarations: [
    NewGameComponent,
    BiddingComponent,
    MeldingComponent,
    TrickTakingComponent,
    RoundSummaryComponent,
    ConfirmChoiceModalComponent,
    NavButtonsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    PinochleScoreboardRoutingModule, // Import routing module
  ]
})
export class PinochleScoreboardModule {}