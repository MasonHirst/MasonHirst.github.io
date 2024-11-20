export interface GameSettings {
  autoCalculate: boolean;
  customTrickPoints: {
    '3-hand': number,
    '4-hand': number,
    '5-hand': number,
    '6-hand': number,
    '8-hand': number,
  }
}
