import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface Message {
  severity: string;
  summary: string;
  detail: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private message$: BehaviorSubject<Message> = new BehaviorSubject({
    severity: '',
    summary: '',
    detail: '',
  });

  constructor() {}

  setMessage(message: Message) {
    this.message$.next(message);
  }

  getMessage(): Observable<Message> {
    return this.message$;
  }
}
