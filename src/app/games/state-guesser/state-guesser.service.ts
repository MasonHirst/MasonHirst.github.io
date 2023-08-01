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
  private allStatesArr = []
  private shuffledStates = []
  private correctStates = []
  private missedStates = []
  directedStateChange = new EventEmitter<{code: string, name: string}>()
  private directedState: {code: string, name: string}

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
    this.correctStates = []
    this.missedStates = []
    // reset all states to unfill color
    Object.keys(this.states).forEach((id) => {
      document.getElementById(id).style.fill = '#e2e2e2';
    })
    this.shuffledStates = this.shuffleStates(this.allStatesArr.slice())
    this.directedState = this.shuffledStates.pop()
    this.directedStateChange.emit(this.directedState)
  }

  makeGuess(stateCode: string, stateName: string) {
    if (stateCode === this.directedState.code) {
      this.correctStates.push({code: stateCode, name: stateName})
      document.getElementById(this.directedState.code).style.fill = '#7872E8';
    } else {
      this.missedStates.push({code: stateCode, name: stateName})
      document.getElementById(this.directedState.code).style.fill = '#E87872';
    }
    this.directedState = this.shuffledStates.pop()
    this.directedStateChange.emit(this.directedState)
  }
  
  isGameOver() {
    if (this.shuffledStates.length === 0) {
      this.directedState = null
      return true
    } else {
      return false
    }
  }

  shuffleStates(states: any[]) {
    return states.sort(() => Math.random() - 0.5);
  }
}
