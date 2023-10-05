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
  public countdownEmit: EventEmitter<boolean> = new EventEmitter();

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.params.subscribe((params) => {
      this.urlGameCode = params['gameCode'];
    });
    if (!localStorage.getItem('userToken')) {
      localStorage.setItem('userToken', shortId());
    }
    const token = localStorage.getItem('userToken');

    let serverUrl: string;
    let scheme = 'ws';
    let location = document.location;
    if (location.protocol === 'https:') {
      scheme += 's';
    }
    serverUrl = `${scheme}://${location.hostname}:${location.port}`;
    // if the code is running in development mode, use the development server 8080
    if (location.hostname === 'localhost') {
      serverUrl = `${scheme}://${location.hostname}:8080`;
    }

    serverUrl = 'ws://192.168.1.196:8080';
    // serverUrl = 'ws://192.168.12.196:8080'

    this.socket = io(serverUrl + '?token=' + token);
    const { socket } = this;
    socket.on('connect', () => {
      console.log('------- CONNECTED TO SOCKET SERVER');
      this.checkGameExists();
    });
    socket.on('disconnect', () => {
      console.log('------- DISCONNECTED FROM SOCKET SERVER');
    });
    socket.on('message', (message: any) => {
      console.log('NEW MESSAGE FROM SERVER: ', message);
      if (message.type === 'not-allowing-join') {
        if (message.message === 'no-player-name') {
          return this.router.navigate(['/games/6-nimmt!']);
        }
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
      // console.log('someone-joined-game: ', data);
      this.updateGameData(data);
      if (location.href.split('/').pop() === '6-nimmt!') {
        if (data?.players[localStorage.getItem('userToken')]) {
          this.router.navigate([`/games/6-nimmt!/client/${data?.code}`]);
        } else if (data?.hosts.includes(localStorage.getItem('userToken'))) {
          this.router.navigate([`/games/6-nimmt!/host/${data?.code}`]);
        }
      }
    });
    socket.on('someone-left-game', (data: any) => {
      // console.log('someone left game: ', data);
    });
    socket.on('game-updated', (data: any) => {
      // console.log('game-updated: ', data);
      this.updateGameData(data);
    });
    socket.on('counting-down', (data: boolean) => {
      // console.log('counting down: ', data);
      this.countdownEmit.emit(data);
    });
    socket.on('not-allowing-join', () => {
      console.error("server says you can't join!");
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
      const codeToCheck =
        gameCode || this.urlGameCode || location.href.split('/').pop();
      if (codeToCheck.length !== 4) {
        return false;
      }
      const response = await axios.get(
        '/api/nimmt/check-game-code/' + codeToCheck
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

  isFirstPlayer() {
    if (this.gameData?.players) {
      const firstPlayerToken = Object.values(
        this.gameData?.players as Record<string, { userToken: string }>
      )[0]?.userToken;
      return firstPlayerToken === localStorage.getItem('userToken');
    } else return false;
  }
}
