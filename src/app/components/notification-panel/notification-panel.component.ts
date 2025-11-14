import { ButtonModule } from 'primeng/button';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { NotificationService } from '../../services/notifications/notification.service';
import { NotificationSeller } from '../../models/notification/notification-seller.dto';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  @Input() sellerId!: string;
  @Output() notificacoesAtualizadas = new EventEmitter<void>();
  visivel = false;
  notificacoes: NotificationSeller[] = [];
  carregando = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    if (this.sellerId) {
      this.carregarNotificacoes();
    }
  }

  abrir() {
    this.visivel = true;
    this.carregarNotificacoes();
  }

  fechar() {
    this.visivel = false;
    this.notificacoesAtualizadas.emit();
  }

  carregarNotificacoes() {
    this.carregando = true;
    this.notificationService.getBySeller(this.sellerId).subscribe({
      next: (data) => {
        this.notificacoes = data;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao buscar notificações', err);
        this.carregando = false;
      },
    });
  }

  marcarComoLida(id: string) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const not = this.notificacoes.find((n) => n.id === id);
        if (not) not.status = 'READ';
        this.notificacoesAtualizadas.emit(); // avisa o card-base que o número mudou
      },
      error: (err) => console.error('Erro ao marcar notificação como lida', err),
    });
  }
}
