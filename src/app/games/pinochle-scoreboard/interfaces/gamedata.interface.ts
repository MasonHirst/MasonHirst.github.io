import { GameState } from "./gamestate.interface";

export interface GameData {
  id: string;
  currentGameState: GameState;
  roundHistory: GameState[];
  gameSettings: {
    autoCalculate: boolean;
  };
}
