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
import { ConfirmPopupModule } from 'primeng/confirmpopup';

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
    ConfirmPopupModule,
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

    this.confirmationService.confirm({
      message: 'Deseja realmente remover esta imagem?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Sempre reseta o preview local
        this.images[index].src = '/OAILogo.png';
        this.images[index].midiaId = undefined;

        if (!midiaId) {
          // Imagem só estava local, nada a excluir no backend
          this.selectedFiles[index] = undefined!;
          return;
        }

        // Se existe no backend, chama o serviço para remover
        this.midiaService.removeMidias(midiaId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Imagem removida do servidor',
            });
            // também limpa o arquivo local
            this.selectedFiles[index] = undefined!;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao excluir imagem do servidor',
            });
          },
        });
      },
      reject: () => {
        // Usuário cancelou, nada acontece
      },
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

  async saveImages() {
    if (!this.clientId) return;

    // filtra apenas arquivos selecionados
    if (!this.selectedFiles.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhum arquivo',
        detail: 'Selecione pelo menos uma imagem antes de salvar',
      });
      return;
    }

    try {
      // Redimensiona/comprime todas as imagens
      const resizedFiles = await Promise.all(
        this.selectedFiles.map((file) => this.resizeImage(file))
      );

      this.midiaService.saveMidias(resizedFiles, this.clientId).subscribe({
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
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao processar imagens',
      });
    }
  }

  isFrenteEnabled(): boolean {
    return true; // sempre habilitado
  }

  isVersoEnabled(): boolean {
    return this.images[0].src !== this.defaultImage.src;
  }

  isExtraEnabled(index: number): boolean {
    if (index <= 1) return false; // não é extra
    // index 2 (primeiro extra) precisa de Frente e Verso
    if (index === 2) {
      return (
        this.images[0].src !== this.defaultImage.src &&
        this.images[1].src !== this.defaultImage.src
      );
    }
    // index 3 (segundo extra) precisa do slot extra 1
    if (index === 3) {
      return this.images[2].src !== this.defaultImage.src;
    }
    return true; // qualquer extra depois disso (se houver)
  }

  resizeImage(
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      img.onerror = reject;

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject('Erro ao criar blob');
            const resizedFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      reader.readAsDataURL(file);
    });
  }
}
