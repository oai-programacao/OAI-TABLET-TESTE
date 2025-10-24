import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  imports: [
    ButtonModule
  ],
  templateUrl: './signature-pad.component.html',
  styleUrl: './signature-pad.component.scss'
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  signaturePad!: SignaturePad;
  signatureImg!: string;
  @Output() signatureData: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('canvas') canvasEl!: ElementRef<HTMLCanvasElement>;
 

  private resizeObserver!: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvasEl.nativeElement;

    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'white',
      penColor: 'black',
      minWidth: 1.8,
      maxWidth: 3,
    });

    // Resize handler
    this.resizeCanvas();

    // Observa mudanças na tela para redimensionar automaticamente
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(canvas);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  clearPad(): void {
    this.signaturePad.clear();
  }

  savePad(): void {
    const base64Data = this.signaturePad.toDataURL();
    this.signatureImg = base64Data;
    this.signatureData.emit(base64Data);

  }

  private resizeCanvas(): void {
    const canvas = this.canvasEl.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Salva a assinatura antes do resize (opcional)
    const data = this.signaturePad.toData();

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    // Restaura a assinatura após o resize
    this.signaturePad.clear();
    this.signaturePad.fromData(data);
  }


/**
 * Método público que o pai pode chamar para "puxar" a assinatura.
 */
public getSignatureAsBase64(): string | null {
    // <-- 2. USE 'this.signaturePad' AQUI
    if (!this.signaturePad || this.signaturePad.isEmpty()) { 
      return null; // Retorna nulo se estiver vazio
    }
    // Retorna a imagem da assinatura
    // <-- 2. USE 'this.signaturePad' AQUI
    return this.signaturePad.toDataURL('image/png');
  }
}