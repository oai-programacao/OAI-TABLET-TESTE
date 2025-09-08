import { Component, Input } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Message } from 'primeng/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-valid-forms',
  imports: [Message,CommonModule],
  template: `
    <div *ngIf="temErro()" class="messageerror">
      <p-message severity="error" variant="simple" size="small">{{ text }}</p-message>
    </div>
  `,
  styles: [`
    :host ::ng-deep .messageerror .p-message-text {
      font-size: 0.75rem;
      color: #e74c3c;
    }
  `]
})
export class MessagesValidFormsComponent {

  @Input() error?: string;
  @Input() control?: NgModel;
  @Input() text?: string;
  @Input() visible?: boolean;

  temErro(): boolean {
    if (this.visible !== undefined) {
      return this.visible;
    }
    return this.control?.errors?.[this.error!] && this.control?.touched;
  }

}


