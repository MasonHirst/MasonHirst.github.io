import {
  Component,
  OnInit,
  SimpleChanges,
  OnChanges,
  Input,
} from '@angular/core';
import { Modal } from 'bootstrap'
import { StateGuesserService } from './state-guesser.service';

@Component({
  selector: 'app-state-guesser',
  templateUrl: './state-guesser.component.html',
  styleUrls: ['./state-guesser.component.css'],
})
export class StateGuesserComponent implements OnChanges, OnInit {
  @Input() ids: any;
  @Input() enableTooltip: boolean;
  @Input() toolTipObject: any;
  @Input() colors: any = {
    unfill: '#b6b6b6',
    fill: '#518a38',
  };
  change: any;
  statelist: {};

  // timer variables
  stopWatch: any;
  timer: number = 0;

  // game variables
  directedState: { code: string; name: string };

  // summary variables
  summary: any;

  constructor(private gameService: StateGuesserService) {}
  ngOnInit(): void {
    this.statelist = this.gameService.getStates();
    this.gameService.directedStateChange.subscribe((state) => {
      this.directedState = state;
    });
  }

  toggleTimer(start: boolean) {
    if (start) {
      this.stopWatch = setInterval(() => {
        this.timer++;
      }, 10);
    } else {
      clearInterval(this.stopWatch);
    }
  }

  onStartGame() {
    this.summary = null
    this.timer = 0;
    this.gameService.startNewGame();
    this.toggleTimer(true);
  }

  onClickState(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const dataId = targetElement.getAttribute('data-id');
    const dataName = targetElement.getAttribute('data-name');
    if (!this.directedState) return;
    this.gameService.makeGuess(dataId, dataName);
    if (this.gameService.isGameOver()) {
      this.summary = {
        ...this.gameService.getGameSummary(),
        time: this.getTimerValue()
      }
      this.toggleTimer(false);
      const summaryModal = new Modal(document.getElementById('summary-modal'))
      summaryModal.show()
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
    if (!this.directedState) return;
    document.getElementById(id).style['stroke-width'] = '3.5';
    document.getElementById(id).style.stroke = '#FF0000';
    // document.getElementById(id).style.fill = '#FF0000';
  }
  mouseLeave(ttid, e, id) {
    document.getElementById(id).style['stroke-width'] = '0.98';
    document.getElementById(id).style.stroke = '#000000';
    // document.getElementById(id).style.fill = '#e2e2e2';
  }

  getTimerValue() {
    if (this.timer > 0) {
      const decisecond = Math.floor(this.timer % 100)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((this.timer / 100) % 60)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((this.timer / 100 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const hours = Math.floor((this.timer / 100 / 60 / 60) % 24)
        .toString()
        .padStart(2, '0');
      if (+hours > 0) {
        return `${hours}:${minutes}:${seconds}.${decisecond}`;
      } else {
        return `${minutes}:${seconds}.${decisecond}`;
      }
    } else {
      return '00:00:00';
    }
  }
}
