import {
  Component,
  OnInit,
  SimpleChanges,
  OnChanges,
  Input,
} from '@angular/core';
import { StateGuesserService } from './state-guesser.service';

@Component({
  selector: 'app-state-guesser',
  templateUrl: './state-guesser.component.html',
  styleUrls: ['./state-guesser.component.css'],
})
export class StateGuesserComponent implements OnChanges, OnInit {
  @Input()
  ids: any;
  @Input()
  enableTooltip: boolean;
  @Input()
  toolTipObject: any;
  @Input()
  colors: any = {
    unfill: '#b6b6b6',
    fill: '#518a38',
  };
  showToolTip: boolean;
  change: any;
  statelist: {};

  // game variables
  directedState: { code: string; name: string };

  constructor(private gameService: StateGuesserService) {}
  ngOnInit(): void {
    this.statelist = this.gameService.getStates();
    this.gameService.directedStateChange.subscribe((state) => {
      this.directedState = state;
    });
  }

  onStartGame() {
    this.gameService.startNewGame();
  }

  onClickState(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const dataId = targetElement.getAttribute('data-id');
    const dataName = targetElement.getAttribute('data-name');
    if (!this.directedState) return;
    this.gameService.makeGuess(dataId, dataName);
    if (this.gameService.isGameOver()) {
      alert('Game Over');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.setUnfillColor();
    this.change = JSON.parse(JSON.stringify(changes.ids));
    this.change.currentValue.forEach((data) => {
      document.getElementById(data.code).style.fill = this.colors.fill;
    });
  }
  // gets the colors from @input param and set all the bg color to given color
  setUnfillColor() {
    Object.keys(this.statelist).forEach((id) => {
      document.getElementById(id).style.fill = this.colors.unfill;
    });
  }

  mouseEnter(ttid, e, id) {
    document.getElementById(id).style['stroke-width'] = '3.5';
    document.getElementById(id).style.stroke = '#FF0000';
  }
  mouseLeave(ttid, e, id) {
    document.getElementById(id).style['stroke-width'] = '0.98';
    document.getElementById(id).style.stroke = '#000000';
  }
}
