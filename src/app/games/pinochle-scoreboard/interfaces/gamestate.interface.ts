import { GameFormat } from './gameformat.interface';
import { Team } from './team.interface';

export interface GameState {
  teams: Team[];
  currentBid: number;
  bidWinningTeamIndices: number[];
  trumpSuit: string;
  roundNumber: number;
}