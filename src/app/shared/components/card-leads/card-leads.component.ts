import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-card-leads',
  imports: [CommonModule, ButtonModule, ConfirmDialog],
  templateUrl: './card-leads.component.html',
  styleUrl: './card-leads.component.scss',
  providers: [ConfirmationService, MessageService],
  standalone: true,
})
export class CardLeadsComponent implements OnInit {
  constructor(private confirmationService: ConfirmationService) {}

  @Input() data: any;
  @Output() onConvert = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onCall = new EventEmitter<void>();
  @Output() onEmail = new EventEmitter<void>();

  expirationDate?: Date;

  ngOnInit() {
    if (this.data?.archivedAt) {
      const baseDate = new Date(this.data.archivedAt);
      this.expirationDate = new Date(baseDate.setDate(baseDate.getDate() + 7));
    }
  }

  confirmDelete() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta venda arquivada?',
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '👍',
      rejectLabel: '👎',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteSale();
      },
    });
  }

  convertSale(): void {
    this.onConvert.emit();
  }

  deleteSale(): void {
    this.onDelete.emit();
  }

  callClient(): void {
    this.onCall.emit();
  }

  sendEmail(): void {
    this.onEmail.emit();
  }
}
