import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';

import { NgModule } from '@angular/core';
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

import { ReportsService } from '../../services/reports/reports.service';

import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';

import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { CancelSimulationDTO } from '../../models/contract/cancel-contract.dto';
import { AuthService } from '../../core/auth.service';
import { ContractsService } from '../../services/contracts/contracts.service';

import { DatePickerModule } from 'primeng/datepicker';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';


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
    NgxMaskDirective,
    CardBaseComponent,
    NgxMaskPipe,
    DatePickerModule,
    SignaturePadComponent

  ],
  templateUrl: './cancel-contract.component.html',
  styleUrl: './cancel-contract.component.scss',
  providers: [MessageService, provideNgxMask()],
})
export class CancelContractComponent implements OnInit {

  @ViewChild('signaturePadInDialog') signaturePadInDialog!: SignaturePadComponent;

  // --- INJEÇÕES ---
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractService = inject(ContractsService);
  private readonly reportsService = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly service = inject(ReportsService);



// --- DADOS ---
  contract: any = {
    id: 'uuid-do-contrato',
    codeContractRbx: '',
    liquidPrice: 0.0,
  };
  minDate: Date = new Date(); 
  activeStep: number = 1;
  isLoading: boolean = false;

  // Step 1
  simulationResult: CancelSimulationDTO | null = null;
  dataRescisao: Date | null = new Date();
  selectedCancelReason: string = '';

  // Step 2 (Controle de Fluxo)
  tipoCancelamento: 'WITH_DEBT' | 'NO_DEBT' = 'WITH_DEBT'; 
 
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


  // Listas
  formasPagamento = [
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Débito', value: 'DEBITO' },
    { label: 'PIX', value: 'PIX' }
  ];

  cancellationReasons = [
    { label: 'Insatisfação com o Valor', value: 'Cliente insatisfeito e não quis realizar upgrade/downgrade' },
    { label: 'Insatisfação Técnica (Lentidão/Queda)', value: 'Cliente insatisfeito com a qualidade da internet' },
    { label: 'Mudança de Endereço', value: 'Cliente mudou de endereço e não deseja continuar conosco' },
    { label: 'Concorrência (Oferta Melhor)', value: 'Cliente recebeu uma oferta de outra operadora' },
    { label: 'Falecimento do Titular', value: 'Cliente faleceu' },
    { label: 'Não necessita mais do serviço', value: 'Cliente alegou não precisar mais do serviço' },
    { label: 'Outros', value: 'Cliente não quis especificar o motivo' }
  ];


  ngOnInit() {
    const contractId = this.route.snapshot.paramMap.get('contractId');

    if (contractId) {
      this.isLoading = true;

      this.contractService.getContractById(contractId).subscribe({
        next: (dadosContrato) => {          
          this.contract = dadosContrato; 
          
          this.dataRescisao = null;
          this.selectedCancelReason = '';
          this.simulationResult = null; 

          
          this.isLoading = false;
        },
        error: (err) => {
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

    const valorProporcionalFront = this.calcularProporcional(this.dataRescisao);

    this.isLoading = true;

    this.contractService.simulateCancellation(
        this.contract.id, 
        this.dataRescisao, 
        valorProporcionalFront
    ).subscribe({
        next: (res) => {
            this.simulationResult = res;
            this.isLoading = false;
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na simulação.' });
            this.isLoading = false;
        }
    });
}

  get vigenciaRestante(): number {
    if (!this.contract?.loyalty) { 
        return 0; 
    }

    if (!this.contract?.dateExpired) return 0;

    const hoje = new Date();
    const dataFim = new Date(this.contract.dateExpired);

    if (hoje > dataFim) return 0;


    let meses = (dataFim.getFullYear() - hoje.getFullYear()) * 12;
    meses -= hoje.getMonth();
    meses += dataFim.getMonth();
    
    return meses <= 0 ? 0 : meses;
  }


  // --- AÇÕES DO STEP 2: ESCOLHA DO FLUXO ---

  abrirModalPagamentoLoja() {
    this.modalPagamentoVisible = true;
    this.boletoGeradoUrl = null;
    this.formaPagamentoSelecionada = null;
  }

// --- AÇÃO DO BOTÃO "SEM DÉBITO" (STEP 2) ---
  selecionarFluxoLoja() {
    if(!this.simulationResult){
      this.messageService.add({
        severity:'warn', detail: 'Simulação necessária.'
      })
      return;
    }

    this.isLoading = true; 
    this.tipoCancelamento = 'NO_DEBT';

    const requestPayload = {
        clientCodeRbx: 0, 
        contractRbxCode: 0, 
        cancelReason: this.selectedCancelReason,
        numberParcels: 1,
        parcels: [],
        proportionalValue: this.simulationResult.valorProporcional,
        pdfBytes: null
    };

    this.contractService.generateSlip(this.contract.id, requestPayload)
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
    this.tipoCancelamento = 'WITH_DEBT';

    this.carregarPreviewPdf();

    this.activeStep = 4;
  }

  // --- AÇÕES DO STEP 3 ---

  confirmarPagamentoEAvancar() {
    // O usuário confirmou que pagou. Agora vamos para a Assinatura.
    // Carregamos o PDF de "Termo de Quitação" (sem dívida)
    // this.carregarPreviewPdf(); 
    this.activeStep = 4; // Vai para o Step de Assinatura
  }

  
    gerarBoletoLoja() {
    if (!this.simulationResult) return;
    
    this.loadingBoleto = true;

    const requestPayload = {
        clientCodeRbx: 0,       
        contractRbxCode: 0,     
        cancelReason: this.selectedCancelReason,
        numberParcels: 1, 
        parcels: [],    
        proportionalValue: this.simulationResult.valorProporcional, 
        pdfBytes: null    
    };

    this.contractService.generateSlip(this.contract.id, requestPayload)
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
             this.boletoGeradoUrl = res[0].link;
          }
          this.loadingBoleto = false;
        },
        error: (err) => {
          this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao gerar boleto'});
          this.loadingBoleto = false;
        }
      });
  }
  // --- AÇÕES DO STEP 4 ---
  carregarPreviewPdf() {
    this.isLoadingPreview = true;

    if(this.pdfSrc){
      this.isLoadingPreview = false;
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

        this.isLoadingPreview = false;

        if(this.signDialogVisible){
          this.signDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Assinatura capturada com sucesso.'
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar preview do PDF.'
        });
        this.isLoadingPreview = false;
      }
    });
  }

  avancarParaConclusao() {
    if(!this.pdfBlob) {
      this.messageService.add({
        severity: 'warn', 
        summary: 'Atenção', 
        detail: 'O documento não foi gerado.'
      });
      return;
    }

   this.isLoading = true;

   const fileToSend = new File([this.pdfBlob], 'termo_cancelamento.pdf', { type: 'application/pdf' });

   const payload = {
    clientCodeRbx: 0,
    contractRbxCode: 0,
    cancelReason: this.selectedCancelReason,
    proportionalValue: this.simulationResult ? this.simulationResult.valorProporcional : 0.0,
    numberParcels: 1,
    parcels: [],
    pdfBytes: null
   };

   let request$;

   if(this.tipoCancelamento === 'NO_DEBT') {
      request$ = this.contractService.cancelNoDebt(this.contract.id, payload, fileToSend);
    } else {
      request$ = this.contractService.cancelWithDebt(this.contract.id, payload, fileToSend);
    }

   request$.subscribe({
    next: (res) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso', 
        detail: 'Cancelamento concluído com sucesso.'
      });
      this.router.navigate(['search']);
    },
    error: (err) => {
      this.messageService.add({
        severity: 'error',
        detail: 'Erro ao concluir o cancelamento.'
      });
      this.isLoading = false;
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

  // Hack para o Canvas renderizar corretamente dentro do Modal (display:none issues)
  forceSignatureRedraw() {
    this.signatureVisibleFlag = false;
    setTimeout(() => {
      this.signatureVisibleFlag = true;
    }, 30);
  }

  resetSignaturePad() {
    // Limpa o pad visualmente ao fechar, se necessário
    if (this.signaturePadInDialog) {
        this.signaturePadInDialog.clearPad(); // Ajuste conforme método do seu componente
    }
  }


  // Ação do botão "Confirmar" no Modal
  captureAndGenerate() {
    if (!this.signaturePadInDialog) return;

    // Pega o base64 do componente filho
    const signature = this.signaturePadInDialog.getSignatureAsBase64(); // Ajuste conforme método do seu componente

    if (!signature) {
        this.messageService.add({severity:'warn', detail:'Por favor, assine antes de confirmar.'});
        return;
    }

    this.capturedSignature = signature; // Salva na variável da classe
    this.carregarPreviewPdf(); // Recarrega o PDF enviando a assinatura
  }

  limparAssinaturaEGerarNovamente() {
      this.capturedSignature = null;
      this.carregarPreviewPdf(); // Gera o PDF limpo novamente
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
