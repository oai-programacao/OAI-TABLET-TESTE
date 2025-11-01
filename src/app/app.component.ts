import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { WebSocketService } from './services/webSocket/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    ButtonModule,
    TableModule,
  ],
})
export class AppComponent implements OnInit {

  notificationCount: number = 10;

  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.wsService.initWebSocket();
    }
  }
}
