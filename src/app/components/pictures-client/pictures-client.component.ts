import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { Router, ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { Cliente } from '../../models/cliente/cliente.dto';

@Component({
  selector: 'app-upload-pictures',
  standalone: true,
  imports: [
    CommonModule,
    CardBaseComponent,
    ButtonModule,
    CarouselModule,
    ConfirmDialogModule,
    ToastModule,
    DividerModule,
    DialogModule,
  ],
  templateUrl: './pictures-client.component.html',
  styleUrl: './pictures-client.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class PicturesClientComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  defaultImage = { src: '/OAILogo.png', alt: 'Imagem padrão' };

  //Injeções
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  clientId: string | null = null;
  cliente: Cliente | undefined;

  images: { src: string; alt: string; type?: 'frente' | 'verso' }[] = [
    { ...this.defaultImage }, // 1º quadrado -> Frente
    { ...this.defaultImage }, // 2º quadrado -> Verso
    { ...this.defaultImage }, // 3º quadrado -> Extra
    { ...this.defaultImage }, // 4º quadrado -> Extra
  ];

  selectedType?: 'frente' | 'verso';
  selectedIndex: number | null = null;

  previewVisible = false;
  previewImage: string | null = null;

  responsiveOptions: any[] = [
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '821px', numVisible: 2, numScroll: 1 },
    { breakpoint: '600px', numVisible: 1, numScroll: 1 },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.clientId = params.get('clientId');
    });
  }

  // Slots extras (index > 1)
  selectSlot(index: number) {
    if (index <= 1) return; // evita os slots Frente/Verso

    this.selectedIndex = index;
    this.selectedType = undefined; // slots extras não usam label

    // reset do input antes de abrir
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  // Botões Frente/Verso
  openFileInput(type: 'frente' | 'verso') {
    const slotIndex = type === 'frente' ? 0 : 1;
    this.selectedIndex = slotIndex;
    this.selectedType = type; // garante o label

    // reset do input antes de abrir
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newImage = {
        src: reader.result as string,
        alt: this.selectedType
          ? this.selectedType === 'frente'
            ? 'Frente'
            : 'Verso'
          : 'Extra',
        type: this.selectedType,
      };

      if (this.selectedIndex !== null) {
        this.images[this.selectedIndex] = newImage;
      }

      // força update da view
      this.images = [...this.images];

      // reset
      this.selectedType = undefined;
      this.selectedIndex = null;
    };
    reader.readAsDataURL(input.files[0]);

    input.value = '';
  }
  removeImage(index: number) {
    this.images[index] = { ...this.defaultImage };
  }

  viewImage(image: { src: string; alt: string }) {
    if (image.src !== this.defaultImage.src) {
      this.previewImage = image.src;
      this.previewVisible = true;
    }
  }

  navigateBackToClientInfo() {
    if (this.clientId) this.router.navigate(['/info', this.clientId]);
  }

  goToHome() {
    this.router.navigate(['/search']);
  }

  confirm1(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja ir para a parte de contrato deste novo cliente?',
      header: 'Confirmação',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'danger' },
      acceptButtonProps: { label: 'Confirmar' },
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmado',
          detail: 'Você aceitou',
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelar',
          detail: 'Você rejeitou',
          life: 3000,
        });
      },
    });
  }
}
