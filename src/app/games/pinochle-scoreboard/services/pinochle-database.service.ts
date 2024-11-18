import Dexie, { Table } from 'dexie';
import { GameData } from '../interfaces/gamedata.interface';

export class PinochleDatabase extends Dexie {
  gameData!: Table<GameData, string>;

  constructor() {
    super('masonhirst_pinochle_DB');
    this.version(1).stores({
      gameData: 'id',
    });
  }
}
