import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';

GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.js';

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      header="Visualizador"
      [(visible)]="visible"
      [modal]="true"
      (onHide)="close()"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', height: '90vh' }"
    >

      <!-- PDF -->
      <div *ngIf="tipoMidia === 'pdf'" class="pdf-container">
        <canvas
          *ngFor="let page of pages"
          [attr.width]="viewportWidth"
          [attr.height]="page.height"
        ></canvas>
      </div>

      <!-- IMAGEM -->
      <div *ngIf="tipoMidia === 'imagem'" class="imagem-container">
        <img
          [src]="imagemUrl"
          alt="Visualização"
        />
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          label="Baixar"
          icon="pi pi-download"
          (click)="download()"
          class="p-button-success"
        ></button>
      </ng-template>

    </p-dialog>
  `,
  styles: [
    `
      .pdf-container {
        height: 100%;
        overflow-y: auto;
      }

      canvas {
        display: block;
        margin: 10px auto;
        border: 1px solid #ccc;
      }

      .imagem-container {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .imagem-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    `,
  ],
})
export class PdfViewerDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  // Controle de mídia
  @Input() tipoMidia: 'pdf' | 'imagem' | null = null;
  @Input() pdfUrl: string | null = null;
  @Input() imagemUrl: string | null = null;

  pages: { height: number; pageNum: number }[] = [];
  viewportWidth = 800;

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.tipoMidia === 'pdf' &&
      (changes['pdfUrl'] || changes['visible']) &&
      this.visible &&
      this.pdfUrl
    ) {
      this.loadPdf(this.pdfUrl);
    }
  }

  async loadPdf(url: string) {
    this.pages = [];

    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      this.viewportWidth = viewport.width;
      this.pages.push({ height: viewport.height, pageNum: i });

      setTimeout(() => this.renderPage(page, viewport, i), 0);
    }
  }

  async renderPage(page: any, viewport: any, pageNum: number) {
    const canvas: HTMLCanvasElement | null =
      document.querySelectorAll('canvas')[pageNum - 1];

    if (!canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context!, viewport }).promise;
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  download() {
    const url =
      this.tipoMidia === 'pdf' ? this.pdfUrl : this.imagemUrl;

    if (!url) return;

    const fileName = url.split('/').pop() || 'arquivo';

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  }
}
