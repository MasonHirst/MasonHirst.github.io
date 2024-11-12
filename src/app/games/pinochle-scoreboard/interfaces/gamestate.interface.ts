import { Team } from './team.interface';

export interface GameState {
  teams: Team[];
  currentBid: number;
  bidWinningTeam: number;
  trumpSuit: string;
  roundNumber: number;
  gameIsActive: boolean;
  gameStartTime: number;
}