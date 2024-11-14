import { GameFormat } from './pinochle-scoreboard/interfaces/gameformat.interface';
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
