import { EventEmitter, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';
import shortId from 'shortid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
const selfHostedServerUrl = 'wss://portfolio.masonhirst.com';

@Injectable({
  providedIn: 'root',
})
export class SixNimmtService {
  private socket: any;
  private gameData: any;
  private urlGameCode: string = '';
  public gameDataEmit: EventEmitter<any> = new EventEmitter();
  public countdownEmit: EventEmitter<boolean> = new EventEmitter();
  successLog(message: string) {
    console.log('%c✅ ' + message, 'color: #04A57D; font-weight: bold;');
  }
  warnLog(message: string) {
    console.log('%c⚠️ ' + message, 'color: yellow; font-weight: bold;');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
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
    serverUrl = `${scheme}://${location.hostname}`;

    
    if (!environment.production) {
      serverUrl += ':8080';
    } else if (location.hostname.includes('github.io') || location.hostname.includes('masonhirst.com')) {
      console.log('Redirecting socket requests to https://portfolio.masonhirst.com')
      serverUrl = selfHostedServerUrl;
    }


    this.socket = io(serverUrl + '?token=' + token);
    const { socket } = this;
    socket.on('connect', () => {
      this.successLog('CONNECTED TO SOCKET SERVER');
      this.checkGameExists();
    });
    socket.on('disconnect', () => {
      this.warnLog('DISCONNECTED FROM SOCKET SERVER');
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

    });
    socket.on('game-updated', (data: any) => {
      // this.toastr.info(`<strong>${'Jackson'}</strong> took row <strong>${this.getRowString(
      //   0
      // )}</strong> for <strong>${21}</strong> points!<p>${'What a loser!'}</p>`)
      this.updateGameData(data);
    });
    socket.on('counting-down', (data: boolean) => {
      this.countdownEmit.emit(data);
    });
    socket.on('not-allowing-join', () => {
      console.error("server says you can't join!");
    });
    socket.on('kicked-from-game', () => {
      this.router.navigate(['/games/6-nimmt!']);
      Swal.fire({
        title: 'You were kicked from the game.',
        text: 'Darn!',
        imageUrl:
          'https://media3.giphy.com/media/10hzvF9FTulLxK/200w.gif?cid=6c09b952w7ierydhfl8vpv2nc05y907etoz28h5upeikbuld&ep=v1_gifs_search&rid=200w.gif&ct=g',
        imageWidth: 'min(90vw, 400px',
        confirmButtonText: 'How rude!',
        showCancelButton: true,
        cancelButtonText: 'I deserved it',
        reverseButtons: true,
      });
    });
    socket.on('player-took-row', (data: any) => {
      this.sendPlayerTookPointsToast(data);
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

  getRoundScore(player: any) {
    let total = 0;
    player?.pointCards.forEach((card: any) => {
      total += card.bullHeads;
    });
    return total;
  }

  getTotalScore(player: any) {
    let total = 0;
    player?.roundScores.forEach((round: any[]) => {
      round.forEach((score: any) => {
        total += score.bullHeads;
      });
    });
    return total;
  }

  sendPlayerTookPointsToast(data: any) {
    // console.log('sendPlayerTookPointsToast: ', data);
    const { playerName, takenRow, totalPoints, quip } = data;
    const toastString = `<strong>${playerName}</strong> took row <strong>${this.getRowString(
      takenRow
    )}</strong> for <strong>${totalPoints}</strong> points!<p>${quip}</p>`;

    if (totalPoints < 5) {
      this.toastr.info(toastString);
    } else if (totalPoints < 10) {
      this.toastr.warning(toastString);
    } else {
      this.toastr.error(toastString);
    }
  }

  getRowString(row: number) {
    switch (row) {
      case 0:
        return 'one';
      case 1:
        return 'two';
      case 2:
        return 'three';
      case 3:
        return 'four';
    }
  }
}
