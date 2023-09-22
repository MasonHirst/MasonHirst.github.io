import { EventEmitter, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class SixNimmtService {
  private socket: any;
  private gameData: any;
  private urlGameCode: string = '';
  public gameDataEmit: EventEmitter<any> = new EventEmitter();

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.urlGameCode = params['gameCode'];
    });
    if (!localStorage.getItem('userToken')) {
      localStorage.setItem('userToken', uuidv4());
    }
    const token = localStorage.getItem('userToken');
    console.log('token: ', token);

    this.socket = io('ws://localhost:8080?token=' + token);
    const { socket } = this;
    socket.on('connect', () => {
      console.log('------- CONNECTED TO SOCKET SERVER');
    });
    socket.on('disconnect', () => {
      console.log('------- DISCONNECTED FROM SOCKET SERVER');
    });
    socket.on('message', (message: any) => {
      console.log('NEW MESSAGE FROM SERVER: ', message);
    });
    socket.on('host-joined-game', (data: any) => {
      console.log('host-joined-game: ', data);
      this.updateGameData(data);
    });
  }

  connect() {
    this.socket.connect();
  }
  disconnectSocket() {
    this.socket.disconnect();
  }

  sendSocketMessage(type: string, body: any = {}) {
    body.userToken = localStorage.getItem('userToken');
    if (!body?.gameCode) {
      body.gameCode = this?.urlGameCode || location.href.split('/').pop();
    }
    this.socket.emit(type, body);
  }

  updateGameData(data: any) {
    this.gameData = data;
    this.gameDataEmit.emit(data);
  }
}
