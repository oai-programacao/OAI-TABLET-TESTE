import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper'; 
import { CalendarModule } from 'primeng/calendar';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select'; 
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TableModule } from 'primeng/table';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReportsService } from '../../services/reports/reports.service';

import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';

import { provideNgxMask } from 'ngx-mask';
import { CancelSimulationDTO } from '../../models/contract/cancel-contract.dto';
import { ContractsService } from '../../services/contracts/contracts.service';
import { BankSlipService } from '../../services/bankSlip/bank-slip.service';

import { DatePickerModule } from 'primeng/datepicker';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';

import { TooltipModule } from 'primeng/tooltip';

export interface StatusFidelidade {
    situacao: 'ISENTO' | 'CUMPRIDA' | 'VIGENTE';
    mesesRestantes: number;
  }

@Component({
  selector: 'app-cancel-contract',
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    StepperModule,
    CalendarModule,
    DividerModule,
    SelectModule, 
    DialogModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    TableModule,
    IftaLabelModule,
    CardBaseComponent,
    DatePickerModule,
    SignaturePadComponent,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './cancel-contract.component.html',
  styleUrl: './cancel-contract.component.scss',
  providers: [MessageService, provideNgxMask(), ConfirmationService],
})


export class CancelContractComponent implements OnInit {

  @ViewChild('signaturePadInDialog') signaturePadInDialog!: SignaturePadComponent;
  @ViewChild(SignaturePadComponent) signaturePadComponent!: SignaturePadComponent;
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

 
  // --- INJEÇÕES ---
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly contractService = inject(ContractsService);
  private readonly reportsService = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bankSlipService = inject(BankSlipService);

// --- DADOS ---
  contract: any = {
    id: 'uuid-do-contrato',
    codeContractRbx: '',
    liquidPrice: 0.0,
    loyalty: false,
    dateExpired: null,  
    situationDescription: ''
  };


  minDate: Date = new Date(); 
  activeStep: number = 1;
  isLoading: boolean = false;
  isRedirecting: boolean = false;

  // Step 1
  simulationResult: CancelSimulationDTO | null = null;
  dataRescisao: Date | null = new Date();
  selectedCancelReason: { label: string; value: string; idRbx?: number } | null = null;
  selectedInstallments: number = 1;
  isSimulating: boolean = false;

  // Step 2 (Controle de Fluxo)
 tipoCancelamento: 'WITH_DEBT' | 'NO_DEBT' | null = null; 
 
  // Step 3 (Pagamento Loja)
  modalPagamentoVisible: boolean = false;
  formaPagamentoSelecionada: any = null;
  boletoGeradoUrl: string | null = null;
  loadingBoleto: boolean = false;
  

  // Step 4 (PDF e Assinatura)
  isLoadingPreview: boolean = false;
  pdfBlob: Blob | null = null;
  pdfSrc: SafeResourceUrl | null = null;
  pdfFile: File | null = null; 

  signDialogVisible: boolean = false;
  signatureVisibleFlag: boolean = false;
  capturedSignature: string | null = null;

  fotoCapturadaFile: File | null = null;
  thumbnailPreview: string | ArrayBuffer | null = null;
   isPreviewDialogVisible: boolean = false;
  step4CapturedPhotos: Array<{ file: File; preview: string }> = [];
  dialogMudancaFluxoVisible: boolean = false;

  loadingMessage: string = 'Processando, por favor aguarde...';
  
  // Listas
  formasPagamento = [
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Débito', value: 'DEBITO' },
    { label: 'PIX', value: 'PIX' }
  ];

  cancellationReasons = [
    { label: 'Insatisfação com o Valor', value: 'Cliente insatisfeito e não quis realizar upgrade/downgrade', idRbx: 8  },
    { label: 'Insatisfação Técnica (Lentidão/Queda)', value: 'Cliente insatisfeito com a qualidade da internet' },
    { label: 'Mudança de Endereço', value: 'Cliente mudou de endereço e não deseja continuar conosco', idRbx: 8 },
    { label: 'Troca de Provedor (Oferta Melhor)', value: 'Cliente recebeu uma oferta de outra operadora', idRbx: 2 },
    { label: 'Falecimento do Titular', value: 'Cliente faleceu', idRbx: 23 },
    { label: 'Não necessita mais do serviço', value: 'Cliente alegou não precisar mais do serviço', idRbx: 8 },
    { label: 'Outros', value: 'Cliente não quis especificar o motivo', idRbx: 8 },
    { label: 'Cancelamento - Não Instalado', value: 'Cliente Cancelou Pedido de Instalação', idRbx: 6 },
    { label: 'Finalizou a Faculdade e Mudou-se de Estado', value: 'Cliente mudou-se de estado após o término da Faculdade', idRbx: 8 }
  ];

  installmentOptions: any[] = [];

ngOnInit() {
    this.generateInstallmentOptions();
  
    this.installmentOptions = Array.from({ length: 3 }, (_, i) => ({
        label: `${i + 1}x ${i === 0 ? '' : ''}`,
        value: i + 1
    }));

    const contractId = this.route.snapshot.paramMap.get('contractId');

    if (contractId) {
        this.isLoading = true;

        this.contractService.getContractById(contractId).subscribe({
            next: (dadosContrato) => {
                this.contract = dadosContrato;

                if (this.contract.situationDescription === 'AGUARDANDO_INSTALACAO') {

                const motivoAutomatico = { 
                    label: 'Cancelamento - Não Instalado', 
                    value: 'Cliente Cancelou Pedido de Instalação', 
                    idRbx: 6 
                };


                this.cancellationReasons.push(motivoAutomatico);

                this.selectedCancelReason = motivoAutomatico;

                this.isLoading = false;
                this.isRedirecting = true;
                this.tipoCancelamento = 'NO_DEBT';

                setTimeout(() => {
                    this.activeStep = 4;
                    
                    this.carregarPreviewPdf();
                    
                    this.isRedirecting = false;
                }, 6000);

                return; 
            }


                console.log('🔍 Dados do Contrato Carregados:');
                console.log('Loyalty (Fidelidade):', this.contract.loyalty);
                console.log('Data Expiração:', this.contract.dateExpired);
                console.log('Cálculo Vigência:', this.statusFidelidade); 


                this.dataRescisao = null;
                this.selectedCancelReason = null;
                this.simulationResult = null;
                this.isLoading = false;
            },
            
            error: (err: any) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Falha ao carregar dados do contrato.'
                });
                this.isLoading = false;
            }
        });

    } else {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'ID do contrato não fornecido na URL.'
        });
    }
}


  // --- AÇÕES DO STEP 1 ---
simularValores() {
    if (!this.dataRescisao || !this.selectedCancelReason) {
        this.simulationResult = null; 
        return; 
    }

    console.log('📅 Data selecionada:', this.dataRescisao);
    console.log('📝 Motivo selecionado:', this.selectedCancelReason);
    console.log('🔢 Parcelas selecionadas:', this.selectedInstallments); 

    const valorProporcionalFront = this.calcularProporcional(this.dataRescisao);
    
    const MINIMUM_SPINNER_TIME = 700; 
    this.isLoading = true;            
    const startTime = Date.now();    

    this.isSimulating = true;

    this.contractService.simulateCancellation(
        this.contract.id, 
        this.dataRescisao, 
        valorProporcionalFront,
        this.selectedInstallments 
    ).subscribe({
        next: (res) => {
            this.simulationResult = res;

            const duration = Date.now() - startTime;
            const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);
           
            setTimeout(() => {
                this.isLoading = false;
            }, delay);
        },
        error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na simulação.' });
            const duration = Date.now() - startTime;
            const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

            setTimeout(() => {
                this.isLoading = false; 
            }, delay);
        }
    });
}

get statusFidelidade(): StatusFidelidade {
    if (this.contract?.situationDescription === 'AGUARDANDO_INSTALACAO') {
        return { situacao: 'ISENTO', mesesRestantes: 0 };
    }

  
    if (this.contract?.loyalty !== true) {
        return { situacao: 'ISENTO', mesesRestantes: 0 };
    }

    if (!this.contract?.dateExpired) {
        return { situacao: 'ISENTO', mesesRestantes: 0 };
    }
  
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataFim = new Date(this.contract.dateExpired);
    dataFim.setHours(0, 0, 0, 0);

    if (hoje >= dataFim) {
        return { situacao: 'CUMPRIDA', mesesRestantes: 0 };
    }


    let meses = (dataFim.getFullYear() - hoje.getFullYear()) * 12;
    meses -= hoje.getMonth();
    meses += dataFim.getMonth();


    const mesesFinais = meses <= 0 ? 0 : meses;

    return { situacao: 'VIGENTE', mesesRestantes: mesesFinais };
}

 get vigenciaRestante(): number {
    if (this.contract?.loyalty !== true) { 
        return 0; 
    }

    if (!this.contract?.dateExpired) return 0;

    const hoje = new Date();
    hoje.setHours(0,0,0,0); 
    
    const dataFim = new Date(this.contract.dateExpired);
    dataFim.setHours(0,0,0,0);

    if (hoje >= dataFim) return 0;

    let meses = (dataFim.getFullYear() - hoje.getFullYear()) * 12;
    meses -= hoje.getMonth();
    meses += dataFim.getMonth();

    return meses <= 0 ? 0 : meses;
}

  generateInstallmentOptions() {
    const maxInstallments = 12; 
    
    this.installmentOptions = Array.from({ length: maxInstallments }, (_, i) => {
      const value = i + 1;
      return { label: `${value}x`, value: value };
    });
  }


  // --- AÇÕES DO STEP 2: ESCOLHA DO FLUXO ---

  abrirModalPagamentoLoja() {
    this.modalPagamentoVisible = true;
    this.boletoGeradoUrl = null;
    this.formaPagamentoSelecionada = null;
  }

// --- AÇÃO DO BOTÃO "SEM DÉBITO" (STEP 2) ---
  selecionarFluxoLoja() {
    if (!this.simulationResult || !this.selectedCancelReason) {
      this.messageService.add({
        severity: 'warn', detail: 'Simulação e Motivo são obrigatórios.'
      });
      return;
    }

    const textoMotivo = this.selectedCancelReason.value;
    const idMotivo = this.selectedCancelReason.idRbx || 8;


    const MINIMUM_SPINNER_TIME = 700;
    this.isLoading = true; 
    const startTime = Date.now();
    
    
    this.tipoCancelamento = 'NO_DEBT';

    const requestPayload = {
        clientCodeRbx: 0, 
        contractRbxCode: 0, 
       cancelReason: textoMotivo,
       cancelReasonId: idMotivo,
        numberParcels: 1,
        parcels: [],
        proportionalValue: this.simulationResult.valorProporcional,
        pdfBytes: null
    };

    this.bankSlipService.generateSlip(this.contract.id, requestPayload)
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
             this.boletoGeradoUrl = res[0].link;
             this.activeStep = 3; 
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.messageService.add({severity:'error', 
            summary:'Erro', 
            detail:'Erro ao gerar boleto.'});
          this.isLoading = false;
        }
      });
  }


  selecionarFluxoComDebito(){
     if(!this.simulationResult){
      this.messageService.add({
        severity:'warn', detail: 'Simulação necessária.'
      })
      return;
    }
    this.tipoCancelamento = 'WITH_DEBT';

    this.carregarPreviewPdf();

    this.activeStep = 4;
  }


  // --- AÇÕES DO STEP 3 ---

 confirmarPagamentoEAvancar() {
    console.log('🚀 Avançando para Step 4 (Fluxo Loja)...');
    
    this.modalPagamentoVisible = false;
    
    this.tipoCancelamento = 'NO_DEBT'; 

    this.activeStep = 4;

    setTimeout(() => {
        this.carregarPreviewPdf();
    }, 100);
  } 
  
    gerarBoletoLoja() {
  if (!this.simulationResult) return;


  const MINIMUM_SPINNER_TIME = 700;
  this.isLoading = true; 
  const startTime = Date.now();

  const requestPayload = {
      clientCodeRbx: 0,
      contractRbxCode: 0,
      cancelReason: this.selectedCancelReason,
      numberParcels: this.selectedInstallments || 1, 
      proportionalValue: this.simulationResult.valorProporcional,
      pdfBytes: null
  };

  this.bankSlipService.generateSlip(this.contract.id, requestPayload)
    .subscribe({
      next: (res) => {
        if (res && res.length > 0) {
           this.boletoGeradoUrl = res[0].link;
        }
        const duration = Date.now() - startTime;
        const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

        setTimeout(() => {
          this.isLoading = false; 
        }, delay);
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao gerar boleto'});

        const duration = Date.now() - startTime;
        const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

        setTimeout(() => {
          this.isLoading = false; 
        }, delay);
      }
    });
}

  executarTrocaParaDivida(){
    this.isLoading = true;

    this.bankSlipService.cancelStoreSlip(this.contract.id).subscribe({
      next:() => {
        this.messageService.add({
          severity:'success',
          summary:'Sucesso',
          detail: 'Boleto cancelado. Gerando confissão de dívida...'
        });

        this.tipoCancelamento = 'WITH_DEBT';
        this.boletoGeradoUrl = null;
        this.pdfSrc = null;

        this.carregarPreviewPdf();

        this.activeStep = 4;

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Erro', 
            detail: 'Não foi possível cancelar o boleto automaticamente.' 
        });
      }
    });
  }

abrirDialogMudancaFluxo() {
    this.dialogMudancaFluxoVisible = true;
  }

confirmarTrocaParaDivida() {
    this.dialogMudancaFluxoVisible = false; 
    this.executarTrocaParaDivida(); 
  }

cancelarBoletoAtual() {
  this.isLoading = true;

  this.bankSlipService.cancelStoreSlip(this.contract.id).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Cancelado',
        detail: 'Boleto cancelado com sucesso.'
    });

    this.boletoGeradoUrl = null;

    this.dialogMudancaFluxoVisible = false;

    this.isLoading = false;
},
  error: (err) => {
    console.error(err);
    this.isLoading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível cancelar o boleto.'
  });
}
  });
}


  // --- AÇÕES DO STEP 4 ---

  carregarPreviewPdf() {
   if (this.isLoading) return;

 
    const MINIMUM_SPINNER_TIME = 700;
    this.isLoading = true; 
    const startTime = Date.now();



    if (this.pdfSrc && typeof this.pdfSrc === 'string') {
        URL.revokeObjectURL(this.pdfSrc); 
    }

    this.pdfSrc = null;
    this.pdfBlob = null;

    const payload = {
      clientCodeRbx: 0,
      contractRbxCode: 0,
      cancelReason: this.selectedCancelReason,
      numberParcels: 1,
      parcels: [],
      proportionalValue: this.simulationResult ? this.simulationResult.valorProporcional : 0.0,
      pdfBytes: null,
      signatureBase64: this.capturedSignature
    };
    
    const request$ = this.tipoCancelamento === 'NO_DEBT' 
      ? this.reportsService.getPdfCancelNoDebt(this.contract.id, payload)
      : this.reportsService.getPdfCancelWithDebt(this.contract.id, payload);

    request$.subscribe({
      next: (blob: Blob) => {
        this.pdfBlob = blob;
        const objectUrl = URL.createObjectURL(blob);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);


        if(this.signDialogVisible){
          this.signDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Assinatura capturada com sucesso.'
          });
        }
            const duration = Date.now() - startTime;
            const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

            setTimeout(() => {
                this.isLoading = false;
            }, delay);
        },
        error: (err) => {
            console.error(err);
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao carregar preview do PDF.'
            });

            const duration = Date.now() - startTime;
            const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

            setTimeout(() => {
                this.isLoading = false;
            }, delay);
        }
    });
}

  avancarParaConclusao() {
    if (!this.pdfBlob) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'O documento não foi gerado.' });
        return;
    }

    if (!this.selectedCancelReason || !this.selectedCancelReason.value) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um motivo de cancelamento.' });
        return;
    }

    const MINIMUM_SPINNER_TIME = 700;
    this.isLoading = true;
    const startTime = Date.now();

    const fileToSend = new File([this.pdfBlob], 'termo_cancelamento.pdf', { type: 'application/pdf' });
    const photoFiles: File[] = [];

    if (this.step4CapturedPhotos && this.step4CapturedPhotos.length > 0) {
        this.step4CapturedPhotos.forEach(photo => {
            if (photo.file) photoFiles.push(photo.file);
        });
    }
    const idParaEnvio = this.selectedCancelReason.idRbx || 8;
    const textoParaEnvio = this.selectedCancelReason.value;

    console.log('🔍 DEBUG ENVIO REAL:');
    console.log('Texto:', textoParaEnvio);
    console.log('ID:', idParaEnvio);

    const payload = {
        clientCodeRbx: 0,
        contractRbxCode: 0,
        cancelReason: textoParaEnvio,    
        cancelReasonId: idParaEnvio,     
        proportionalValue: this.simulationResult ? this.simulationResult.valorProporcional : 0.0,
        numberParcels: this.selectedInstallments || 1,
        parcels: [],
        pdfBytes: null
    };

   
    let request$;
    if (this.tipoCancelamento === 'NO_DEBT') {
        request$ = this.contractService.cancelNoDebt(this.contract.id, payload, fileToSend, photoFiles);
    } else {
        request$ = this.contractService.cancelWithDebt(this.contract.id, payload, fileToSend, photoFiles);
    }

    request$.subscribe({
        next: (res) => {
            const duration = Date.now() - startTime;
            const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

            setTimeout(() => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'success', summary: 'Sucesso', detail: 'Cancelamento concluído com sucesso!', life: 3000
                });
            setTimeout(() => {
            if (this.contract?.clientId) {
        this.router.navigate([`/attendances/${this.contract.clientId}`]);
        } else {
        console.error('ERRO: clientId não encontrado no contrato para redirecionar');
        this.router.navigate(['search']);
    }
}, 1500);
            }, delay);
        },
        error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.messageService.add({ severity: 'error', detail: 'Erro ao concluir o cancelamento.' });
        }
    });
}
  savePdf() {
    if (!this.pdfBlob) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nenhum PDF disponível para download.'
      });
      return;
    }

    const downloadUrl = URL.createObjectURL(this.pdfBlob);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    window.open(downloadUrl, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = downloadUrl;

    link.download = this.tipoCancelamento === 'NO_DEBT'
      ? 'termo_cancelamento_sem_debito.pdf'
      : 'termo_cancelamento_com_debito.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// --- LÓGICA DO MODAL DE ASSINATURA ---

  abrirAssinatura() {
    this.signDialogVisible = true;
    this.forceSignatureRedraw();
  }


  forceSignatureRedraw() {
    this.signatureVisibleFlag = false;
    setTimeout(() => {
      this.signatureVisibleFlag = true;
    }, 30);
  }

  resetSignaturePad() {
    if (this.signaturePadInDialog) {
        this.signaturePadInDialog.clearPad(); 
    }
  }


  captureAndGenerate() {
    if (!this.signaturePadInDialog) return;

    const signature = this.signaturePadInDialog.getSignatureAsBase64(); 

    if (!signature) {
        this.messageService.add({severity:'warn', detail:'Por favor, assine antes de confirmar.'});
        return;
    }

    this.capturedSignature = signature; 
    this.signDialogVisible = false;

    this.carregarPreviewPdf(); 
  }

  limparAssinaturaEGerarNovamente() {
      this.capturedSignature = null;
      this.carregarPreviewPdf(); 
  }

  voltarDoStep4() {
    if (this.tipoCancelamento === 'NO_DEBT') {
        this.activeStep = 2; 
    } else {
        this.activeStep = 2;
    }
  }

   backToSearch() {
    this.router.navigate(['search']);
  }

  
  onFotoCapturada(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fotoCapturadaFile = file;
      const reader = new FileReader();

      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result ?? null;

        this.isPreviewDialogVisible = true;
      };

      reader.readAsDataURL(file);
    }
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;

    this.isPreviewDialogVisible = false;
  }
  
  cancelarCaptura() {
    this.limparPreview(); 
}

   salvarFotoContratoCapturada(): void {
    if (!this.fotoCapturadaFile || !this.thumbnailPreview) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhuma foto',
        detail: 'Tire uma foto antes de salvar.',
      });
      return;
    }

    this.step4CapturedPhotos.push({
      file: this.fotoCapturadaFile,
      preview: this.thumbnailPreview as string,
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Foto Adicionada',
      detail: `Foto ${this.step4CapturedPhotos.length} salva!`,
    });

    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
  }

    removerFotoStep4(index: number): void {
    this.step4CapturedPhotos.splice(index, 1);

    this.messageService.add({
      severity: 'info',
      summary: 'Foto Removida',
      detail: 'Foto excluída da galeria.',
    });
  }

tirarOutraFoto(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
    setTimeout(() => {
      if (this.cameraInput?.nativeElement) {
        this.cameraInput.nativeElement.click();
        console.log('📷 Câmera reaberta');
      }
    }, 100);
  }

  // --- LÓGICA DE CÁLCULO PROPORCIONAL (NO FRONTEND) ---
  private calcularProporcional(dataRescisao: Date): number {

    console.log('--- DEBUG PROPORCIONAL FRONT ---');
    console.log('Contrato:', this.contract);
    console.log('Preço Líquido:', this.contract?.liquidPrice);
    console.log('Dia Base:', this.contract?.cicleBillingDayBase);

    if (!this.contract || !this.contract.liquidPrice || !this.contract.cicleBillingDayBase) {
      console.warn('Dados do contrato incompletos para cálculo (Preço ou Dia Base faltando).');
      return 0.0;
    }

    const valorMensal = this.contract.liquidPrice;
    const diaBaseCiclo = this.contract.cicleBillingDayBase; 
    const diaCancelamento = dataRescisao.getDate(); 

    const diasNoMes = 30;
    const valorPorDia = valorMensal / diasNoMes;

    let diasUtilizados = 0;

    if (diaCancelamento >= diaBaseCiclo) {
      diasUtilizados = (diaCancelamento - diaBaseCiclo) + 1; 
    } else {
      diasUtilizados = (diasNoMes - diaBaseCiclo) + diaCancelamento + 1;
    }

    if (diasUtilizados > 30) diasUtilizados = 30;

    const total = valorPorDia * diasUtilizados;

    console.log(`🧮 Cálculo Proporcional:
      - Dia Base: ${diaBaseCiclo}
      - Dia Cancelamento: ${diaCancelamento}
      - Dias Utilizados: ${diasUtilizados}
      - Valor Dia: ${valorPorDia.toFixed(2)}
      - Total: ${total.toFixed(2)}`);

    return parseFloat(total.toFixed(2));
  }
}
