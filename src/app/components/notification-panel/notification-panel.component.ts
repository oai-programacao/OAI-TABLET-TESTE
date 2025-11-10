import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  visivel = false;

  notificacoes = [
    { titulo: 'Pedido confirmado', mensagem: 'Seu pedido #123 foi confirmado.' },
    { titulo: 'Novo cliente', mensagem: 'Um novo cliente se cadastrou.' },
  ];

  abrir() { this.visivel = true; }
  fechar() { this.visivel = false; }
}
