import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StateGuesserService {
  private states = {
    MA: 'Massachusetts',
    MN: 'Minnesota',
    MT: 'Montana',
    ND: 'North Dakota',
    HI: 'Hawaii',
    ID: 'Idaho',
    WA: 'Washington',
    AZ: 'Arizona',
    CA: 'California',
    CO: 'Colorado',
    NV: 'Nevada',
    NM: 'New Mexico',
    OR: 'Oregon',
    UT: 'Utah',
    WY: 'Wyoming',
    AR: 'Arkansas',
    IA: 'Iowa',
    KS: 'Kansas',
    MO: 'Missouri',
    NE: 'Nebraska',
    OK: 'Oklahoma',
    SD: 'South Dakota',
    LA: 'Louisiana',
    TX: 'Texas',
    CT: 'Connecticut',
    NH: 'New Hampshire',
    RI: 'Rhode Island',
    VT: 'Vermont',
    AL: 'Alabama',
    FL: 'Florida',
    GA: 'Georgia',
    MS: 'Mississippi',
    SC: 'South Carolina',
    IL: 'Illinois',
    IN: 'Indiana',
    KY: 'Kentucky',
    NC: 'North Carolina',
    OH: 'Ohio',
    TN: 'Tennessee',
    VA: 'Virginia',
    WI: 'Wisconsin',
    WV: 'West Virginia',
    DE: 'Delaware',
    MD: 'Maryland',
    NJ: 'New Jersey',
    NY: 'New York',
    PA: 'Pennsylvania',
    ME: 'Maine',
    MI: 'Michigan',
    AK: 'Alaska',
  };
  private allStatesArr = [];
  shuffledStatesChange = new EventEmitter<number>();
  private shuffledStates = [];
  private correctStates = [];
  private missedStates = [];
  directedStateChange = new EventEmitter<{ code: string; name: string }>();
  private directedState: { code: string; name: string };

  constructor() {
    Object.entries(this.states).forEach((id) => {
      const [key, value] = id;
      this.allStatesArr.push({ code: key, name: value });
    });
  }

  getStates() {
    return this.states;
  }

  startNewGame() {
    this.correctStates = [];
    this.missedStates = [];
    // reset all states to unfill color
    Object.keys(this.states).forEach((id) => {
      document.getElementById(id).style.fill = '#e2e2e2';
    });
    this.shuffledStates = this.shuffleStates(this.allStatesArr.slice());
    this.shuffledStatesChange.emit(
      50 - this.correctStates.length - this.missedStates.length
    );
    this.directedState = this.shuffledStates.pop();
    this.directedStateChange.emit(this.directedState);
  }

  makeGuess(code: string) {
    if (this.isAlreadyRevealed(code)) return;
    if (code === this.directedState.code) {
      this.correctStates.push(this.directedState);
      document.getElementById(this.directedState.code).style.fill = '#37915A';
      // reset the hover effects
      document.getElementById(code).style['stroke-width'] = '0.98';
      document.getElementById(code).style.stroke = '#000000';
    } else {
      this.missedStates.push(this.directedState);
      this.pulseColor(this.directedState.code, '#E87872')
    }
    this.shuffledStatesChange.emit(
      50 - this.correctStates.length - this.missedStates.length
    );
    this.directedState = this.shuffledStates.pop();
    this.directedStateChange.emit(this.directedState);
  }

  pulseColor(code: string, color: string) {
    document.getElementById(this.directedState.code).style.fill = color;
    let i = 0;
    const interval = setInterval(() => {
      if (i === 3) {
        clearInterval(interval);
        return;
      }
      document.getElementById(code).style.fill = '#e2e2e2';
      setTimeout(() => {
        document.getElementById(code).style.fill = color;
      }, 150);
      i++;
    }, 300);
  }

  isAlreadyRevealed(code: string) {
    let isMatch = false;
    this.correctStates.forEach((state) => {
      if (state.code === code) {
        isMatch = true;
      }
    });
    this.missedStates.forEach((state) => {
      if (state.code === code) {
        isMatch = true;
      }
    });
    return isMatch;
  }

  isGameOver() {
    if (this.correctStates.length + this.missedStates.length === 50) {
      this.directedState = null;
      this.directedStateChange.emit(this.directedState);
      return true;
    } else {
      return false;
    }
  }

  getGameSummary() {
    return {
      correct: this.correctStates,
      missed: this.missedStates,
    };
  }

  shuffleStates(states: any[]) {
    return states.sort(() => Math.random() - 0.5);
  }
}
