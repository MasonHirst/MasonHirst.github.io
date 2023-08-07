import {
  Component,
  OnInit,
  SimpleChanges,
  OnChanges,
  Input,
} from '@angular/core';
import { Modal } from 'bootstrap';
import { StateGuesserService } from './state-guesser.service';
import { StylingService } from 'src/app/styling.service';

@Component({
  selector: 'app-state-guesser',
  templateUrl: './state-guesser.component.html',
  styleUrls: ['./state-guesser.component.css'],
})
export class StateGuesserComponent implements OnChanges, OnInit {
  screen: number;
  
  @Input() ids: any;
  @Input() colors: any = {
    unfill: '#b6b6b6',
    fill: '#518a38',
  };
  change: any;
  statelist: {};
  remainingStates: number = null;

  // timer variables
  stopWatch: any;
  timer: number = 0;

  // game variables
  directedState: { code: string; name: string };

  // summary variables
  summary: any;

  constructor(private gameService: StateGuesserService, private styleService: StylingService) {}

  ngOnInit(): void {
    this.styleService.screenSize$.subscribe((size) => {
      this.screen = size;
    });
    this.statelist = this.gameService.getStates();
    this.gameService.directedStateChange.subscribe((state) => {
      this.directedState = state;
    });

    this.gameService.shuffledStatesChange.subscribe((guesses) => {
      this.remainingStates = guesses;
    });

    if (!localStorage.getItem('stateGuesserHighScores')) {
      localStorage.setItem(
        'stateGuesserHighScores',
        JSON.stringify({
          highScore: null,
          perfectTime: null,
        })
      );
    }
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
    this.toggleTimer(false);
    this.summary = null;
    this.timer = 0;
    this.gameService.startNewGame();
    this.toggleTimer(true);
  }

  onClickState(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const dataId = targetElement.getAttribute('data-id');
    // const dataName = targetElement.getAttribute('data-name');
    if (!this.directedState) return;
    this.gameService.makeGuess(dataId);

    if (this.gameService.isGameOver()) {
      this.handleGameOver();
    }
  }

  handleGameOver() {
    this.toggleTimer(false);
    const summaryModal = new Modal(document.getElementById('summary-modal'));
    summaryModal.show();

    // high scores logic
    let { highScore, perfectTime } = JSON.parse(
      localStorage.getItem('stateGuesserHighScores')
    );

    if (highScore === null || this.calculateScore() > highScore) {
      highScore = this.calculateScore();
    }
    if (perfectTime === null || this.timer < perfectTime) {
      perfectTime = this.timer;
    }

    localStorage.setItem(
      'stateGuesserHighScores',
      JSON.stringify({
        highScore,
        perfectTime,
      })
    );
  }

  calculateScore(): number {
    const percentageWeight = 12;
    const maxTimeScore = 500;
    const score = this.gameService.getGameSummary().correct.length;

    const correctGuessesPercentage = score * 2;
    const correctGuessesScore = correctGuessesPercentage * percentageWeight;
    let timeScore = maxTimeScore - this.timer / 50;
    if (timeScore < 0) {
      timeScore = 0;
    }
    let totalScore = Math.floor(correctGuessesScore + timeScore);
    if (score < 1) {
      totalScore = 0;
    } else if (score < 49) {
      totalScore += 100;
    }

    this.summary = {
      ...this.gameService.getGameSummary(),
      score: totalScore,
      time: this.getTimerValue(this.timer),
    };
    return totalScore
  }

  getBestTime(level: string) {
    const times = JSON.parse(localStorage.getItem('stateGuesserHighScores'));
    if (times[level]) {
      if (level === 'perfectTime') {
        return this.getTimerValue(times[level]);
      } else if (level === 'highScore') {
        return times[level];
      }
    } else return 'Incomplete';
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

  mouseEnter(ttid, e, id: string) {
    if (!this.directedState) return;
    if (this.gameService.isAlreadyRevealed(id)) return;
    document.getElementById(id).style['stroke-width'] = '3.5';
    document.getElementById(id).style.stroke = '#FF0000';
  }
  mouseLeave(ttid, e, id: string) {
    document.getElementById(id).style['stroke-width'] = '0.98';
    document.getElementById(id).style.stroke = '#000000';
  }

  getTimerValue(timer: number) {
    if (timer > 0) {
      const decisecond = Math.floor(timer % 100)
        .toString()
        .padStart(2, '0');
      const seconds = Math.floor((timer / 100) % 60)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((timer / 100 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const hours = Math.floor((timer / 100 / 60 / 60) % 24)
        .toString()
        .padStart(2, '0');
      if (+hours > 0) {
        return `${hours}:${minutes}:${seconds}.${decisecond}`;
      } else if (+minutes > 0) {
        return `${minutes}:${seconds}.${decisecond}`;
      } else {
        return `${seconds}.${decisecond}`;
      }
    } else {
      return '00:00.00';
    }
  }
}
