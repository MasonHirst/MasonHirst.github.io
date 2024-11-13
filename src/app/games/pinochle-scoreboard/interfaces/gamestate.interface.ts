import { GameFormat } from './gameformat.interface';
import { Team } from './team.interface';

export interface GameState {
  teams: Team[];
  currentBid: number;
  bidWinningTeamIndeces: number[];
  trumpSuit: string;
  roundNumber: number;
  gameIsActive: boolean;
  gameStartTime: number;
  gameFormat: GameFormat;
}