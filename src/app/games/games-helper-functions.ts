
export function isValidNumber(val: number): boolean {
  return val !== null && !isNaN(val);
}

export function formatSubScore(val: number): string | number {
  return val >= 0 ? `+${val}` : val;
}

export function getDeepCopy(val: any): any {
  return !val ? null : JSON.parse(JSON.stringify(val));
}