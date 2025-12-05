import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-card-leads',
  imports: [CommonModule, ButtonModule],
  templateUrl: './card-leads.component.html',
  styleUrl: './card-leads.component.scss',
})
export class CardLeadsComponent implements OnInit {
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
