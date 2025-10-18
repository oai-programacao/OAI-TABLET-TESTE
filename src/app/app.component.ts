import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastService } from './services/toastService/toast.service';
import { WebSocketService } from './services/webSocket/websocket.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, TableModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  // constructor(
  //   private toastService: ToastService,
  //   private ws: WebSocketService,
  //   private http: HttpClient // ✅ adicionado
  // ) {
  //   this.ws.messages$.subscribe(msg => {
  //     this.toastService.show(msg, 'contrato.json', 4000);
  //   });
  // }

  ngOnInit() {
  }

}
