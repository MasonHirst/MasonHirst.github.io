import { GameSettings } from "./gamesettings.interface";
import { GameState } from "./gamestate.interface";

export interface GameData {
  id: string;
  currentGameState: GameState;
  roundHistory: GameState[];
  gameSettings: GameSettings;
}
