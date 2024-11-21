import { GameFormat } from './pinochle-scoreboard/interfaces/gameformat.interface';
import { GameSettings } from './pinochle-scoreboard/interfaces/gamesettings.interface';
import { Team } from './pinochle-scoreboard/interfaces/team.interface';

export function isValidNumber(val: number): boolean {
  return val !== null && !isNaN(val);
}

export function formatSubScore(val: number): string | number {
  return val >= 0 ? `+${val}` : val;
}

export function getDeepCopy(val: any): any {
  return !val ? null : JSON.parse(JSON.stringify(val));
}

export function showTeamInput5Hand(
  i: number,
  gameFormat: GameFormat,
  bidWinnerIndices: number[],
  nonBidWinnerIndices: number[]
): boolean {
  if (gameFormat?.label !== '5-hand') {
    return true;
  }
  return bidWinnerIndices[0] == i || nonBidWinnerIndices[0] == i;
}

export function hasDecimal(num: number): boolean {
  return num.toString().includes('.');
}

export function getTeamComboName5Hand(
  i: number,
  gameFormat: GameFormat,
  bidWinnerIndices: number[],
  nonBidWinnerIndices: number[],
  teams: Team[]
): string {
  if (gameFormat?.label !== '5-hand') {
    return teams[i]?.name;
  }
  if (bidWinnerIndices[0] == i) {
    return (
      teams[bidWinnerIndices[0]].name + ' & ' + teams[bidWinnerIndices[1]]?.name
    );
  } else {
    let comboName: string = '';
    nonBidWinnerIndices.forEach((index) => {
      comboName += comboName.length
        ? ' & ' + teams[index].name
        : teams[index].name;
    });
    return comboName;
  }
}

export function getDefaultPinochleSettings(): GameSettings {
  return {
    autoCalculate: true,
    customTrickPoints: {
      '3-hand': null,
      '4-hand': null,
      '5-hand': null,
      '6-hand': null,
      '8-hand': null,
    },
  };
}

export function getDefaultPinochleFormats(): GameFormat[] {
  return [
    {
      label: '3-hand',
      description: '3 teams of 1 player',
      teamCount: 3,
      possibleTrickPoints: 250,
    },
    {
      label: '4-hand',
      description: '2 teams of 2 players',
      teamCount: 2,
      possibleTrickPoints: 250,
    },
    {
      label: '5-hand',
      description: '5 teams of 1 player',
      teamCount: 5,
      possibleTrickPoints: 500,
    },
    {
      label: '6-hand',
      description: '2 teams of 3 players',
      teamCount: 2,
      possibleTrickPoints: 500,
    },
    {
      label: '8-hand',
      description: '4 teams of 2 players',
      teamCount: 4,
      possibleTrickPoints: 500,
    },
  ];
}
