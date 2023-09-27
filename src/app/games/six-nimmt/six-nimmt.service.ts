import { EventEmitter, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';
import shortId from 'shortid';
import axios from 'axios';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SixNimmtService {
  private socket: any;
  private gameData: any;
  private urlGameCode: string = '';
  public gameDataEmit: EventEmitter<any> = new EventEmitter();

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.params.subscribe((params) => {
      this.urlGameCode = params['gameCode'];
    });
    if (!localStorage.getItem('userToken')) {
      localStorage.setItem('userToken', shortId());
    }
    const token = localStorage.getItem('userToken');

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
      if (message === 'not-allowing-join') {
        Swal.fire({
          title: 'Unable to join this game',
          text: 'This game is full or has already started.',
          confirmButtonText: 'Back to 6 Nimmt!',
          confirmButtonColor: '#9c4fd7',
          allowOutsideClick: false,
          customClass: {
            popup: '', // Add the custom CSS class to the 'popup' element
          },
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/games/6-nimmt!']);
          }
        });
      }
    });
    socket.on('someone-joined-game', (data: any) => {
      console.log('someone-joined-game: ', data);
      this.updateGameData(data);
    });
    socket.on('someone-left-game', (data: any) => {
      console.log('someone left game: ', data);
    });
    socket.on('game-updated', (data: any) => {
      console.log('game-updated: ', data);
      this.updateGameData(data);
    });
    socket.on('not-allowing-join', () => {
      console.log("server says I can't join");
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

  async checkGameExists(gameCode: string = null) {
    try {
      const response = await axios.get(
        '/api/nimmt/check-game-code/' + gameCode ||
          this.urlGameCode ||
          location.href.split('/').pop()
      );
      const { status, data } = response;
      if (status !== 200 || !data.code) {
        // Swal.fire({
        //   title: 'This game was not found',
        //   confirmButtonText: 'Back to 6 Nimmt! home page',
        //   confirmButtonColor: '#9c4fd7',
        //   allowOutsideClick: false,
        //   customClass: {
        //     popup: '', // Add the custom CSS class to the 'popup' element
        //   },
        // }).then((result) => {
        //   if (result.isConfirmed) {
        //     this.router.navigate(['/games/6-nimmt!']);
        //   }
        // });
        this.router.navigate(['/games/6-nimmt!']);
        return false;
      } else {
        this.gameData = data;
        this.gameDataEmit.emit(data);
        return true;
      }
    } catch (err) {
      throw new Error(`Failed to fetch data: ${err.message}`);
    }
  }
}
