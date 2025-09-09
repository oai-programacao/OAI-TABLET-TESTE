import { Component, inject } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-pictures',
  standalone: true,
  imports: [CommonModule, CardBaseComponent, ButtonModule, CarouselModule, ConfirmDialogModule, ToastModule, DividerModule],
  templateUrl: './upload-pictures.component.html',
  styleUrl: './upload-pictures.component.scss', 
  providers: [ConfirmationService, MessageService]
})
export class UploadPicturesComponent {
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  // router = inject(Router)
  images = [
    { src: '/OAILogo.png', alt: 'Foto Frente' },
    { src: '/OAILogo.png', alt: 'Foto Verso' },
    { src: '/OAILogo.png', alt: 'Extra 1' },
    { src: '/OAILogo.png', alt: 'Extra 2' },
    { src: '/OAILogo.png', alt: 'Extra 3' },
    { src: '/OAILogo.png', alt: 'Extra 4' }
  ];

  responsiveOptions: any[];

  constructor() {
    // Definimos as regras de responsividade aqui
   this.responsiveOptions = [
    {
        // Regra para TABLET HORIZONTAL (ex: iPad Air com 1180px de largura)
        // Se a tela for menor que 1200px, mostra 4 itens.
        breakpoint: '1199px', 
        numVisible: 4,
        numScroll: 1
    },
    {
        // Regra para TABLET VERTICAL (iPad Air com 820px de largura)
        // Se a tela for menor que 821px, mostra 2 itens.
        breakpoint: '821px',
        numVisible: 2,
        numScroll: 1
    },
    {
        // Regra para CELULARES
        // Se a tela for menor que 600px, mostra 1 item.
        breakpoint: '600px',
        numVisible: 1,
        numScroll: 1
    }
];
  }

  confirm1(event: Event) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Deseja ir para a parte de contrato deste novo cliente?',
            header: 'Confirmação',
            closable: true,
            closeOnEscape: true,
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'danger',
            },
            acceptButtonProps: {
                label: 'Confirmar',
            },
            accept: () => {
              // this.router.navigate(['plans'])
                this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted' });
            },
            reject: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Cancelar',
                    detail: 'You have rejected',
                    life: 3000,
                });
            },
        });
    }


  
}
