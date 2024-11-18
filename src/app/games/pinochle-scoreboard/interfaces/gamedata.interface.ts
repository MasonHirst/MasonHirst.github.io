import { GameFormat } from "./gameformat.interface";
import { GameSettings } from "./gamesettings.interface";
import { GameState } from "./gamestate.interface";

export interface GameData {
  id: string;
  currentGameState: GameState;
  gameIsActive: boolean;
  gameStartTime: number;
  gameFormat: GameFormat;
  roundHistory: GameState[];
}
