import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
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
      header="Visualizador de PDF"
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', height: '90vh' }"
    >
      <div class="pdf-container">
        <canvas
          *ngFor="let page of pages"
          [attr.width]="viewportWidth"
          [attr.height]="page.height"
          #canvas
        ></canvas>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          label="Fechar"
          icon="pi pi-times"
          (click)="visible = false"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .pdf-container {
      height: 100%;
      overflow-y: auto;
    }
    canvas {
      display: block;
      margin: 10px auto;
      border: 1px solid #ccc;
    }
  `],
})
export class PdfViewerDialogComponent implements OnChanges {
   @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() pdfUrl: string | null = null;
  
  pages: { height: number; pageNum: number }[] = [];
  viewportWidth = 800;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pdfUrl'] && this.pdfUrl) {
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
    const canvas: HTMLCanvasElement | null = document.querySelectorAll('canvas')[pageNum - 1];
    if (!canvas) return;
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context!, viewport }).promise;
  }
}
