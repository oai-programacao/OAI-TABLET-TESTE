import { NotificationPanelComponent } from './../../../components/notification-panel/notification-panel.component';
import { NotificationService } from '../../../services/notifications/notification.service';
import { AuthService } from './../../../core/auth.service';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-card-base',
  imports: [
    CardModule,
    CheckboxModule,
    FloatLabelModule,
    InputGroupAddonModule,
    InputGroupModule,
    IftaLabelModule,
    InputTextModule,
    CommonModule,
    ButtonModule,
    NotificationPanelComponent,
  ],
  templateUrl: './card-base.component.html',
  styleUrl: './card-base.component.scss',
})
export class CardBaseComponent implements OnInit {
  @Input() header: string = '';
  @Input() width: string = '';
  @Input() height: string = '';
  @Input() overflow: string = '';
  sellerId!: string;

  qtdNotificacoes: number = 0;
  temNotificacao = false;

   @ViewChild(NotificationPanelComponent, { static: false })
  painel!: NotificationPanelComponent;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.sellerId = this.authService.getSellerId() || '';
    if (this.sellerId) {
      this.buscarQtdNotificacoes();
    }
  }

  openNotifications() {
    this.painel.abrir();
    this.buscarQtdNotificacoes();
  }

  buscarQtdNotificacoes() {
    this.notificationService.countUnread(this.sellerId).subscribe({
      next: (count) => {
        this.qtdNotificacoes = count;
        this.temNotificacao = count > 0;
      },
      error: (err) => console.error('Erro ao buscar notificações não lidas', err),
    });
  }

}
