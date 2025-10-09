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
import { MidiaService } from '../../services/midia/midia.service';

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
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly midiaService = inject(MidiaService);

  clientId: string | undefined;
  cliente: Cliente | undefined;

  images: {
    src: string;
    alt: string;
    type?: 'frente' | 'verso';
    midiaId?: string;
  }[] = [
    { ...this.defaultImage },
    { ...this.defaultImage },
    { ...this.defaultImage },
    { ...this.defaultImage },
  ];

  selectedType?: 'frente' | 'verso';
  selectedIndex: number | null = null;
  selectedFiles: File[] = []; // arquivos ainda não enviados

  previewVisible = false;
  previewImage: string | null = null;

  responsiveOptions: any[] = [
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '821px', numVisible: 2, numScroll: 1 },
    { breakpoint: '600px', numVisible: 1, numScroll: 1 },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.clientId = params.get('clientId') ?? undefined;
    });

    if (this.clientId) {
      this.loadImages();
    }
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

  allSlotsOccupied(): boolean {
    return this.images
      .slice(0, 2) // pega apenas os índices 0 e 1
      .every((img) => img.src !== this.defaultImage.src);
  }

  loadImages() {
    this.midiaService.listMidias(this.clientId).subscribe({
      next: (midias) => {
        midias.forEach((m, i) => {
          if (i < this.images.length) {
            this.images[i] = { src: m.urlFile, alt: m.nameFile, midiaId: m.id };
          }
        });
      },
      error: (err) => console.error(err),
    });
  }

  removeImage(index: number) {
    const midiaId = this.images[index].midiaId;

    // Sempre reseta o preview
    this.images[index].src = '/OAILogo.png';
    this.images[index].midiaId = undefined;

    if (!midiaId) {
      // Imagem só estava local, nada a excluir no backend
      return;
    }

    // Se existe no backend, chama o serviço para remover
    this.midiaService.removeMidias(midiaId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Imagem removida do servidor',
        });
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao excluir imagem do servidor',
        }),
    });
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // salvar preview local
    const reader = new FileReader();
    reader.onload = () => (this.images[index].src = reader.result as string);
    reader.readAsDataURL(file);

    // guardar arquivo localmente
    this.selectedFiles[index] = file;
  }

  saveImages() {
    if (!this.clientId) return;

    // filtra apenas os arquivos selecionados
    const filesToUpload = this.selectedFiles.filter((f) => !!f);

    if (!filesToUpload.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhum arquivo',
        detail: 'Selecione pelo menos uma imagem antes de salvar',
      });
      return;
    }

    this.midiaService.saveMidias(filesToUpload, this.clientId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Upload concluído',
        });
        this.selectedFiles = [];
        this.loadImages();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao enviar',
        });
      },
    });
  }
}
