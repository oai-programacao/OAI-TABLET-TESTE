import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

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

import { SignaturePadComponent } from '../signature-pad/signature-pad.component';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';

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
  paymentMethod: string | null;
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
  ],
  providers: [MessageService],
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

  @ViewChild('addressNewNgForm') addressNewNgForm!: NgForm;
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;

  capturedSignature: string | null = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractsService = inject(ContractsService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly reportsService = inject(ReportsService);
  private readonly midiaService = inject(MidiaService);
  public pdfPreviewUrl: string | null = null;

  safePdfPreviewUrl: SafeResourceUrl | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;

  // --- CONTROLE DO DIALOG DE ASSINATURA ---
  signDialogVisible = false;
  isLoadingSignature = false; // Loading para o botão dentro do dialog
  // --------------------------------------

  public currentContract!: Contract;
  public isLoading = false;
  public displayDialog = false;
  public isLoad = false;

  public activeStep: number = 1;
  public clientId!: string;
  public contractId!: string;

  public isEditingAddress = false;
  private originalAddressForm: AddressForm | null = null;

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
    paymentMethod: null,
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
        paymentMethod: null,
      };
      this.originalAddressForm = { ...this.addressNewForm };
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

    console.log('Carregando preview do PDF...');
    this.isLoadingPreview = true;
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
      paymentMethod: this.addressNewForm.paymentMethod,
    };
    this.reportsService
      .getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
          console.log('Preview carregado no iframe.');
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro no Preview',
            detail: 'Não foi possível carregar o termo. Tente novamente.',
          });
          this.previewLoadFailed = true; // Sinaliza que falhou
          this.isLoadingPreview = false;
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
      paymentMethod: this.addressNewForm.paymentMethod,
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
      paymentMethod: this.addressNewForm.paymentMethod,
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
        next: (res) => {
          // Mensagem personalizada independentemente do backend
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Aguarde o cliente assinar, todo o processo será feito de forma automática.
            Consulte nos atendimentos do cliente se foi feito de fato.`,
            life: 10000,
          }); 
        },
        error: (err) => {
          const backendMessage =
            typeof err.error === 'string'
              ? err.error
              : 'Erro ao tentar enviar para o Autentique!';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: backendMessage,
            life: 10000,
          });
        },
      });
  }

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber;
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

  onSignatureCaptured(base64Data: string) {
    this.capturedSignature = base64Data;
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Assinatura capturada!',
    });
  }

  savePad() {
    this.signaturePadComponent.savePad();
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
      paymentMethod: this.addressNewForm.paymentMethod,
    };

    this.reportsService
      .getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
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
    }, 50);
  }

  resetSignaturePad() {
    this.capturedSignature = null;
  }

  abrirAssinatura() {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true;
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
      };

      reader.readAsDataURL(file);
    }
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
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

    // Se o usuário clicou em "Cancelar" (voltando para false)
    if (!this.isEditingAddress && this.originalAddressForm) {
      // Restaura os dados originais
      this.addressNewForm = { ...this.originalAddressForm };
    }
  }

  paymentMethods = [
    { label: 'Dinheiro', value: 'cash' },
    { label: 'Cartão de Crédito', value: 'credit_card' },
    { label: 'Pix', value: 'pix' },
    { label: 'Boleto', value: 'boleto' },
  ];
}
