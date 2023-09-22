import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class SixNimmtService {
  private socket: any;

  constructor() {
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
      console.log(message)

    })

    // setTimeout(() => {
    //   console.log('disconnecting');
    //   this.disconnectSocket();
    // }, 2000);
  }

  connect() {
    this.socket.connect();
  }
  disconnectSocket() {
    this.socket.disconnect();
  }

  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
