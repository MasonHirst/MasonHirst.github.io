import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SixNimmtService } from '../../six-nimmt.service';

@Component({
  selector: 'app-game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css'],
})
export class GameTableComponent implements OnInit, OnDestroy {
  @Input() gameCode: string;
  @Input() gameData: any;

  constructor(
    private nimmtService: SixNimmtService,
  ) {}

  ngOnInit(): void {}

  showPlayerCard(player: any) {
    if (
      this.gameData?.gameState === 'STACKING_CARDS' &&
      player?.selectedCard &&
      this.cardIsNotStacked(player?.selectedCard)
    ) {
      return true;
    }
  }

  cardIsNotStacked(selectedCard: any) {
    let notIncluded = true;
    this.gameData?.tableStacks.forEach((stack: any[]) => {
      stack.forEach((stackCard) => {
        if (stackCard.number === selectedCard.number) {
          notIncluded = false;
        }
      });
    });
    return notIncluded;
  }

  getPlayers() {
    if (this.gameData?.gameState === 'STACKING_CARDS') {
      return Object.values(this.gameData?.players).sort((a: any, b: any) => {
        return a?.selectedCard?.number - b?.selectedCard?.number;
      });
    } else {
      return Object.values(this.gameData?.players).sort((a: any, b: any) => {
        return this.getScoreboardScore(a) - this.getScoreboardScore(b);
      });
    }
  }

  showGameState() {
    switch (this.gameData?.gameState) {
      case 'PICKING_CARDS':
        return 'Pick your cards!';
      case 'STACKING_CARDS':
        return 'Stacking cards';
    }
  }

  showPlayerNeedsToPick(player: any) {
    return player.needsToPickRow && this.cardIsNotStacked(player.selectedCard);
  }

  getScoreboardScore(player: any): number {
    return this.nimmtService.getTotalScore(player);
  }

  getRoundScores(player: any): number {
    return this.nimmtService.getRoundScore(player);
  }

  ngOnDestroy(): void {}
}
