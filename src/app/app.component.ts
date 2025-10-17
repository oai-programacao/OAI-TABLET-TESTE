import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastService } from './services/toastService/toast.service';
import { WebSocketService } from './services/webSocket/websocket.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, TableModule ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private toastService = inject(ToastService);
  private wsService = inject(WebSocketService);

  ngOnInit() {
    // Toda vez que o websocket emitir algo, mostra o toast
    this.wsService.messages$.subscribe(msg => {
      this.toastService.show(msg);
    });
  }
}
