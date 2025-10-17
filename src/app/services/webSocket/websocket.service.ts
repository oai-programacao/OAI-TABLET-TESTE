import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  public messages$ = new Subject<string>();

  constructor() {
    // Simulação de websocket recebendo mensagem a cada 5s
    setInterval(() => {
      this.messages$.next('Nova notificação do websocket!');
    }, 5000);
  }
}
