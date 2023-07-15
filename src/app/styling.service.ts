import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StylingService {
  private screenSizeSubject: BehaviorSubject<number> = new BehaviorSubject<number>(window.innerWidth);

  screenSize$: Observable<number> = this.screenSizeSubject.asObservable();

  constructor() {
    window.addEventListener('resize', () => {
      this.screenSizeSubject.next(window.innerWidth);
    });
  }
}
