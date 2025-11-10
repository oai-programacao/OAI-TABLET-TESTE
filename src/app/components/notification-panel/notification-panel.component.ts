import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-panel',
  imports: [CardBaseComponent, CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss'
})
export class NotificationPanelComponent {
  notifications = [
    { message: 'Sua fatura de novembro fechou.', date: 'Hoje' },
    { message: 'Uma nova atualização de segurança foi aplicada.', date: 'Ontem' },
    { message: 'Manutenção programada para 12/11.', date: '08/11/2025' }
  ];
}
