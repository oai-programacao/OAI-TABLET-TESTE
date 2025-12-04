import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

import { StepperModule } from 'primeng/stepper';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { Divider } from 'primeng/divider';
import { Dialog } from 'primeng/dialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { IftaLabel } from 'primeng/iftalabel';
import { MessageService } from 'primeng/api';

import { MessageModule } from 'primeng/message';

import { NgxMaskDirective } from 'ngx-mask';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';

import { Contract } from '../../models/contract/contract.dto';
import { Cliente } from '../../models/cliente/cliente.dto';
import { AuthService } from '../../core/auth.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { CepResponse, CepService } from '../../services/cep/cep.service';
import { ConsentTermAddressRequest } from '../../services/reports/reports.service';
import { ActionsContractsService } from '../../services/actionsToContract/actions-contracts.service';
import { ReportsService } from '../../services/reports/reports.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MidiaService } from '../../services/midia/midia.service';

import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { ClientService } from '../../services/clients/client.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from "primeng/table";
import { AttendancesService } from '../../services/attendances/attendance.service';
import { finalize } from 'rxjs/operators';

export interface AddressForm {
  zipCode: string | null;
  street: string;
  numberFromHome: string | null;
  complement: string;
  uf: string;
  neighborhood: string;
  city: string;
  observation: string;
  adesionValue: number | null;
  paymentForm: string | null;
}

@Component({
  selector: 'app-address-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardBaseComponent,
    StepperModule,
    InputText,
    Button,
    Textarea,
    Divider,
    Dialog,
    InputGroup,
    InputGroupAddon,
    IftaLabel,
    NgxMaskDirective,
    MessagesValidFormsComponent,
    NgxMaskDirective,
    InputNumberModule,
    SignaturePadComponent,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    DialogModule,
    DropdownModule,
    SelectModule,
    TooltipModule,
    TableModule

  ],
  providers: [MessageService, AttendancesService],
  templateUrl: './address-transfer.component.html',
  styleUrls: ['./address-transfer.component.scss'],
})
export class AddressTransferComponent implements OnInit, OnDestroy {
  addressNewFormValid = false;
  contract!: Contract;
  client!: Cliente;

  modalVisible: boolean = false;
  signatureVisibleFlag = false;

  phone: string = '';
  formIsValid: boolean = false;

  finalization: boolean = false;

  isSubmitting: boolean = false;

  @ViewChild('addressNewNgForm') addressNewNgForm!: NgForm;
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;
  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;

  capturedSignature: string | null = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractsService = inject(ContractsService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly reportsService = inject(ReportsService);
  private readonly midiaService = inject(MidiaService);
  private readonly attendancesService = inject(AttendancesService);
  private readonly clientService = inject(ClientService);
  public pdfPreviewUrl: string | null = null;
  public pdfBlobFinal: Blob | null = null;


  safePdfPreviewUrl: SafeResourceUrl | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;

  signDialogVisible = false;
  isLoadingSignature = false;

  isPreviewDialogVisible: boolean = false;

  result: any = null;

  pdfWasDownloaded: boolean = false;

  public currentContract!: Contract;
  public isLoading = false;
  public displayDialog = false;
  public isLoad = false;

  public activeStep: number = 1;
  public clientId!: string;
  public contractId!: string;

  public isEditingAddress = false;
  private originalAddressForm: AddressForm | null = null;


  public loadingMessage: string | null = null;

  private showWarning(summary: string, detail: string, life?: number): void {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  private showInfo(summary: string, detail: string, life: number = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  public addressNewForm: AddressForm = {
    zipCode: null,
    street: '',
    numberFromHome: null,
    complement: '',
    uf: '',
    neighborhood: '',
    city: '',
    observation: '',
    adesionValue: null,
    paymentForm: null,
  };

  public paymentForm = {
    title: '',
    dueDate: '',
    price: '',
  };

  constructor(private cepService: CepService, private sanitizer: DomSanitizer) {
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras.state && navigation.extras.state['contractData']) {
      this.currentContract = navigation.extras.state[
        'contractData'
      ] as Contract;
      console.log('Dados do contrato recebidos:', this.currentContract);

      if (this.currentContract?.observation) {
        this.addressNewForm.observation = this.currentContract.observation;
      }
    }
  }

  event: string = "update_address";

  ngOnInit(): void {
    if (!this.currentContract) {
      const saved = sessionStorage.getItem('contractData');
      if (saved) {
        this.currentContract = JSON.parse(saved);
      }
    }

    if (this.currentContract) {
      this.clientId = this.currentContract.clientId;
      this.contractId = this.currentContract.id.toString();

      this.addressNewForm = {
        zipCode: this.currentContract.zipCode || null,
        street: this.currentContract.street || '',
        numberFromHome: this.currentContract.number || null,
        complement: this.currentContract.complement || '',
        uf: this.currentContract.state || '',
        city: this.currentContract.city || '',
        neighborhood: this.currentContract.neighborhood || '',
        observation: this.currentContract.observation || '',
        adesionValue: null,
        paymentForm: null,
      };
      this.originalAddressForm = { ...this.addressNewForm };

      this.loadClientData();
      return;
    }

    const clientIdFromRoute =
      this.route.snapshot.queryParamMap.get('fromClient');
    const contractIdFromRoute =
      this.route.snapshot.queryParamMap.get('contractId');
    if (clientIdFromRoute && contractIdFromRoute) {
      this.clientId = clientIdFromRoute;
      this.contractId = contractIdFromRoute;

      return;
    }

    console.error(
      'Não foram recebidos dados do contrato. O usuário pode ter atualizado a página ou acessou a URL incorretamente.'
    );
    this.router.navigate(['/contracts']);
  }

  get isAddressValid(): boolean {
    return this.addressNewNgForm?.valid ?? false;
  }

  ngOnDestroy(): void {
    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
    }
  }

  loadPdfPreview(): void {
    if (this.isLoadingPreview) return;

    console.log('Aguarde enquanto o PDF é gerado...');

    const MINIMUM_SPINNER_TIME = 700;

    this.isLoadingPreview = true;
    const startTime = Date.now();

    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    this.capturedSignature = null;
    this.limparPreview();

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const requestBody: ConsentTermAddressRequest = {
      zipCode: this.addressNewForm.zipCode ?? '',
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome ?? '',
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue ?? 0,
      paymentForm: this.addressNewForm.paymentForm,
    };

    this.reportsService
      .getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);

          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          setTimeout(() => {
            this.isLoadingPreview = false;
          }, delay);
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro no Preview',
            detail: 'Não foi possível carregar o termo. Tente novamente.',
          });
          this.previewLoadFailed = true;
          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          setTimeout(() => {
            this.isLoadingPreview = false;
          }, delay);
        },
      });
  }

  btnToBack(): void {
    const clientId =
      this.currentContract?.clientId ||
      this.route.snapshot.queryParamMap.get('fromClient');
    if (clientId) {
      this.router.navigate(['/client-contracts', clientId]);
    } else {
      this.router.navigate(['/search']);
    }
  }

  openDialog(): void {
    this.displayDialog = true;
  }

  closeDialog(): void {
    this.displayDialog = false;
  }

  searchCEP(): void {
    if (!this.addressNewForm.zipCode) return;
    this.cepService
      .searchCEP(this.addressNewForm.zipCode)
      .subscribe((res: CepResponse) => {
        if (res.erro) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'CEP não encontrado.',
          });
          return;
        }
        this.addressNewForm.street = res.logradouro || '';
        this.addressNewForm.neighborhood = res.bairro || '';
        this.addressNewForm.city = res.localidade || '';
        this.addressNewForm.uf = res.uf || '';
        this.addressNewForm.complement = res.complemento || '';
      });
  }

  getConsentTermAddressPdf() {
    const requestBody: ConsentTermAddressRequest = {
      zipCode: this.addressNewForm.zipCode,
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome,
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue,
      paymentForm: this.addressNewForm.paymentForm,
    };

    this.isLoading = true;
    this.reportsService
      .getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.isLoading = false;
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
        },
      });
  }

  abrirModal(): void {
    this.modalVisible = true;
  }

  onHide(): void {
    this.modalVisible = false;
    this.phone = '';
  }

  avisoInvalido: boolean = true;

  meuMetodoExtra(): void {
    this.formIsValid = true;
    this.avisoInvalido = false;
  }

  sendToAutentiqueSubmit() {
    const term: ConsentTermAddressRequest = {
      zipCode: this.addressNewForm.zipCode,
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome,
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue,
      paymentForm: this.addressNewForm.paymentForm,
    };

    const mappedSigners = [
      {
        name: this.client?.name || 'Cliente',
        phone: '+55' + (this.phone || ''),
      },
    ];

    const payload = { term, signers: mappedSigners };

    this.actionsContractsService
      .sendAddressChangeAutentique(payload, this.clientId, this.contractId)
      .subscribe({
        next: (res: string) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: `${res}.
            Aguarde o cliente assinar, todo o processo será feito de forma automática.
            Consulte nos atendimentos do cliente se foi feito de fato.`,
            life: 10000,
          });
          this.modalVisible = false;
        },
        error: (err) => {
          const backendMessage =
            (typeof err.error === 'string' ? err.error : err?.error?.message) ||
            'Erro ao tentar enviar para o número, verifique com o Suporte!';
          if (backendMessage.includes('Aguarde 4 minutos antes')) {
            this.messageService.add({
              severity: 'error',
              summary: 'Atenção',
              detail: backendMessage,
            });
          }
        },
      });
  }

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber;

    if (stepNumber === 3 && !this.safePdfPreviewUrl) {
      this.loadPdfPreview();
    }
  }

  ngAfterViewInit() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.clearPad();
    }
  }

  clearSignature() {
    this.signaturePadComponent.clearPad();
    this.capturedSignature = null;
  }

  generateConsentTermWithSignature() {
    if (!this.capturedSignature) {
      alert('Capture a assinatura antes de gerar o termo.');
      return;
    }
    if (this.isLoadingPreview) return;

    console.log('Gerando termo com assinatura...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const requestBody = {
      zipCode: this.addressNewForm.zipCode ?? '',
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome ?? '',
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue ?? 0,
      signatureBase64: this.capturedSignature,
      paymentForm: this.addressNewForm.paymentForm,
    };

    this.reportsService
      .getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfBlobFinal = blob;
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
          console.log('Termo com assinatura carregado no iframe.');
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Termo com assinatura gerado!',
          });
          this.signDialogVisible = false;
        },
        error: (err) => {
          console.error('Erro ao gerar termo com assinatura:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao gerar o termo final com assinatura.',
          });
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        },
      });
  }

  forceSignatureRedraw() {
    setTimeout(() => {
      this.signatureVisibleFlag = false;
      setTimeout(() => {
        this.signatureVisibleFlag = true;
      });
    }, 30);
  }

  resetSignaturePad() {
    this.capturedSignature = null;
  }

  abrirAssinatura() {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true;
  }

  captureAndGenerate(): void {
    if (this.isLoadingPreview) return;

    const signatureBase64 = this.signaturePadInDialog.getSignatureAsBase64();

    if (!signatureBase64) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, assine no campo antes de gerar o termo.',
      });
      return;
    }

    this.capturedSignature = signatureBase64;
    this.generateConsentTermWithSignature();
  }

  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;

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

  salvarFotoCapturada() {
    if (!this.fotoCapturadaFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhuma foto',
        detail: 'Tire uma foto antes de salvar.',
      });
      return;
    }

    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do cliente não encontrado para associar a foto.',
      });
      return;
    }

    const filesToUpload: File[] = [this.fotoCapturadaFile];
    this.midiaService.saveMidias(filesToUpload, this.clientId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Foto salva com sucesso!',
        });

        this.limparPreview();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar a foto',
        });
        console.error(err);
      },
    });
  }

  toggleEditingAddress(): void {
    this.isEditingAddress = !this.isEditingAddress;

    if (!this.isEditingAddress && this.originalAddressForm) {
      this.addressNewForm = { ...this.originalAddressForm };
    }
  }

  paymentMethods = [
    { label: 'Dinheiro', value: 'Dinheiro' },
    { label: 'Cartão de Crédito', value: 'Cartão de Crédito' },
    { label: 'Pix', value: 'Pix' },
    { label: 'Boleto', value: 'Boleto' },
  ];

  savePdf() {
    if (!this.pdfPreviewUrl) {
      console.error('URL do PDF não disponível para salvar.');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      window.open(this.pdfPreviewUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = this.pdfPreviewUrl;
      link.download = 'termo_de_consentimento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.pdfWasDownloaded = true;
    }
  }

  isPdfViewerLoaded: boolean = false;

  onPdfViewerLoad(): void {
    console.log('O Iframe do PDF está 100% carregado e pronto.');
    this.isPdfViewerLoaded = true;
  }

  public get isAddressDataChanged(): boolean {
    if (!this.originalAddressForm) {
      return false;
    }
    return (
      this.addressNewForm.zipCode !== this.originalAddressForm.zipCode ||
      this.addressNewForm.street !== this.originalAddressForm.street ||
      this.addressNewForm.numberFromHome !==
      this.originalAddressForm.numberFromHome ||
      this.addressNewForm.complement !== this.originalAddressForm.complement ||
      this.addressNewForm.uf !== this.originalAddressForm.uf ||
      this.addressNewForm.neighborhood !==
      this.originalAddressForm.neighborhood ||
      this.addressNewForm.city !== this.originalAddressForm.city ||
      this.addressNewForm.observation !== this.originalAddressForm.observation
    );
  }

  async onConfirmAddressChange() {
    if (!this.currentContract) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Dados do contrato original não encontrados!',
      });
      return;
    }
    if (!this.pdfBlobFinal) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'O termo de transferência precisa ser gerado e assinado antes de continuar!',
      });
      return;
    }

    this.isLoading = true;
    this.isSubmitting = true;

    try {
      // 2. Converter PDF para Base64
      let pdfBase64Clean = '';
      if (this.pdfBlobFinal) {
        const fullBase64 = await this.blobToBase64(this.pdfBlobFinal);
        // Remove o prefixo "data:application/pdf;base64," se existir
        pdfBase64Clean = fullBase64.includes(',') ? fullBase64.split(',')[1] : fullBase64;
      }

      const payload = {
        clientId: this.currentContract.clientId,
        contractId: this.currentContract.id,
        adesion: this.addressNewForm.adesionValue || 0,
        pdfBytes: pdfBase64Clean,
        address: {
          cep: this.addressNewForm.zipCode,
          uf: this.addressNewForm.uf,
          cidade: this.addressNewForm.city,
          rua: this.addressNewForm.street,
          numero: this.addressNewForm.numberFromHome,
          bairro: this.addressNewForm.neighborhood,
          complemento: this.addressNewForm.complement,
        }
      };

      this.contractsService.updateAddressContract(this.currentContract.id, payload).pipe(
        finalize(() => {
          this.isLoading = false;
          this.isSubmitting = false;
        })
      ).subscribe({
        next: (response: any) => {

          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: 'Endereço atualizado!',
          });
          if (this.pdfBlobFinal) {
            this.registerAttendance(this.pdfBlobFinal, response.linkBoleto);
          } else {
            console.warn("PDF não encontrado, o atendimento não será registrado.");
          }

          const enderecoCompleto = `${this.addressNewForm.street}, ${this.addressNewForm.numberFromHome} - ${this.addressNewForm.neighborhood}`;
          const cidadeUF = `${this.addressNewForm.city}/${this.addressNewForm.uf}`;
          const enderecoFinalizado = `${enderecoCompleto} | ${cidadeUF}`;

          this.result = {
            clientName: this.client?.name || this.client?.socialName || 'Cliente Indisponível',
            clientCpf: this.formatCpfCnpj(this.client?.cpf || this.client?.cnpj || 'N/A'),
            contrato: this.currentContract?.codeContractRbx || this.currentContract?.id,
            novoEndereco: enderecoFinalizado,
            cidade: `${this.addressNewForm.city}/${this.addressNewForm.uf}`,

            adesionValue: this.addressNewForm.adesionValue || 0,

            documentoRbx: response?.numeroDocumento || response?.protocolo || 'Processado',
            linkBoleto: response?.linkBoleto
          };

          console.log('Final Result Object:', this.result);
          this.finalization = true;
        },
        error: (err) => {
          this.isLoading = false;
          const detailMessage =
            err?.error?.message || 'Falha ao atualizar o endereço.';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: detailMessage,
          });
        },
      });
    } catch (error) {
      console.error("Erro ao processar PDF", error);
      this.isLoading = false;
      this.isSubmitting = false;
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao processar o arquivo PDF.' });
    }
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  private registerAttendance(pdfBlob: Blob, linkBoleto: string): void {
    if (!this.clientId || !this.contractId) {
      console.error("registerAttendance: ClientID ou ContractID estão ausentes.");
      return;
    }
    const data = {
      event: this.event as string,
      cliente: this.clientId,
      contrato: this.contractId,
      linkBoleto: linkBoleto
    };

    const jsonBlob = new Blob([JSON.stringify(data)], { type: "application/json" });

    const formData = new FormData();
    formData.append('data', jsonBlob, 'data.json');
    formData.append('arquivo', pdfBlob, 'termo_transferencia_assinado.pdf');

    this.attendancesService.registerAttendance(formData).subscribe({
      next: (response) => {
        console.log("Atendimento registrado com sucesso:", response);
        this.showInfo("Registro de Atendimento", "Atendimento registrado com sucesso no sistema.");
      },
      error: (err) => {
        console.error("Falha ao registrar atendimento:", err);
        this.showWarning("Aviso", "A transferência foi concluída, mas houve um erro ao registrar o atendimento no histórico.");
      }
    });
  }

  formatCpfCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF → 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ → 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  getBoletoUrl(numero: string | number): string {
    return `${numero}`;
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(["info", this.clientId])
    } else {
      this.router.navigate(["/"])
    }
  }

  loadClientData() {
    this.clientService.getClientById(this.clientId).subscribe({
      next: (clientData: Cliente) => {
        this.client = clientData;
      },
      error: (err) => {
        console.error("Erro ao carregar dados do cliente:", err);
      }
    });
  }
}