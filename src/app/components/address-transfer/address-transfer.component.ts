import { ImageUtilsService } from './../../services/midia/image-utils.service';
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
import { WebSocketService } from './../../services/webSocket/websocket.service';

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
import { NgxCurrencyDirective } from 'ngx-currency';

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
import { TableModule, Table } from 'primeng/table';
import { AttendancesService } from '../../services/attendances/attendance.service';
import { interval, Subject, of } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { OffersService } from '../../services/offers/offers.service';
import { OfferProjection } from '../../models/offer/offer-projection.model';
import { ButtonModule } from 'primeng/button';
import {
  BlockPeriodOffers,
  BlockPeriodOffersLabels,
  ViewBlockOffersDto,
} from '../../models/blockoffer/blockOffer.dto';
import { BlockOffersRequestService } from './../../services/blockOffer/blockoffer.service';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';

import { DateUtilsService } from '../../shared/utils/date.utils';

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
    TableModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    NgxCurrencyDirective,
  ],
  providers: [MessageService, AttendancesService, OffersService],
  templateUrl: './address-transfer.component.html',
  styleUrls: ['./address-transfer.component.scss'],
})
export class AddressTransferComponent implements OnInit, OnDestroy {
  @ViewChild('addressNewNgForm') addressNewNgForm!: NgForm;
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;
  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('osTable') osTable!: Table;
  @ViewChild('formNewOs') formNewOs!: NgForm;
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractsService = inject(ContractsService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly reportsService = inject(ReportsService);
  private readonly midiaService = inject(MidiaService);
  private readonly clientService = inject(ClientService);
  private readonly blockOfferService = inject(BlockOffersRequestService);
  private readonly offerService = inject(OffersService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly imageUtilsService = inject(ImageUtilsService);
  private originalAddressForm: AddressForm | null = null;
  private stopPolling$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  contract!: Contract;
  client!: Cliente;

  addressNewFormValid = false;
  modalVisible: boolean = false;
  signatureVisibleFlag = false;
  phone: string = '';
  formIsValid: boolean = false;
  finalization: boolean = false;
  isSubmitting: boolean = false;
  capturedSignature: string | null = null;
  pdfPreviewUrl: string | null = null;
  pdfBlobFinal: Blob | null = null;
  safePdfPreviewUrl: SafeResourceUrl | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;
  signDialogVisible = false;
  isLoadingSignature = false;
  isPreviewDialogVisible: boolean = false;
  result: any = null;
  pdfWasDownloaded: boolean = false;
  currentContract!: Contract;
  isLoading = false;
  displayDialog = false;
  isLoad = false;
  activeStep: number = 1;
  clientId!: string;
  contractId!: string;
  isEditingAddress = false;
  loadingMessage: string | null = null;
  event: string = 'update_address';
  avisoInvalido: boolean = true;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;
  isPdfViewerLoaded: boolean = false;
  step4CapturedPhotos: Array<{ file: File; preview: string }> = [];
  selectedInstallments: number = 1;
  installmentOptions: any[] = [];
  showPhoneDialog: boolean = false;

  dialogOs: boolean = false;
  dialogNewOs: boolean = false;
  loadingOs: boolean = false;
  offers: OfferProjection[] = [];
  photoFiles: File[] = [];
  totalRecords: number = 0;
  offerNothing: boolean = false;
  activeBlock: ViewBlockOffersDto | null = null;
  selectedOfferId: string | null = null;
  selectedOs: string | null = null;
  minDateValue: Date = new Date();
  selectedDate: Date | null = null;
  selectedCity: string = '';
  selectedNewOsCity: string = '';

  cities = [
    { label: 'Assis', value: 'ASSIS' },
    { label: 'Cândido Mota', value: 'CANDIDO_MOTA' },
    { label: 'Palmital', value: 'PALMITAL' },
    { label: 'Echaporã', value: 'ECHAPORA' },
    { label: 'Ibirarema', value: 'IBIRAREMA' },
    { label: 'Oscar Bressane', value: 'OSCAR_BRESSANE' },
    { label: 'Platina', value: 'PLATINA' },
    { label: 'Andirá', value: 'ANDIRA' },
  ];

  selectedTypeOs: string = '';
  typeOs = [{ label: 'Mudança de Endereço', value: 'CHANGE_OF_ADDRESS' }];

  selectedClientType: string = '';
  clientTypes = [
    { label: 'B2B', value: 'B2B' },
    { label: 'B2B ESPECIAL', value: 'B2B_SPECIAL' },
    { label: 'B2C', value: 'B2C' },
    { label: 'B2G', value: 'B2G' },
    { label: 'Interno', value: 'INTERN' },
    { label: 'Temporário', value: 'TEMPORARY' },
    { label: 'Condomínio', value: 'CONDOMINIUM' },
  ];

  selectedPeriodOs: string | null = null;
  periodsOs = [
    { label: 'Manhã', value: 'MORNING' },
    { label: 'Tarde', value: 'AFTERNOON' },
    { label: 'Noite', value: 'NIGHT' },
  ];

  selectedTypeNewOs: string = 'CHANGE_OF_ADDRESS';
  typeNewOs = [
    { label: 'Mud. de End. de Instalação', value: 'CHANGE_OF_ADDRESS' },
  ];

  paymentMethods = [
    { label: 'Dinheiro', value: 'Dinheiro' },
    { label: 'Cartão de Crédito', value: 'Cartão de Crédito' },
    { label: 'Pix', value: 'Pix' },
    { label: 'Boleto', value: 'Boleto' },
  ];

  addressNewForm: AddressForm = {
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

  paymentForm = {
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
    this.installmentOptions = Array.from({ length: 3 }, (_, i) => ({
      label: `${i + 1}x`,
      value: i + 1,
    }));

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

  ngAfterViewInit() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.clearPad();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
    }
  }

  onDialogShow() {
    this.startPolling();
  }

  onDialogHide() {
    this.stopPolling$.next();
  }

  startPolling() {
    interval(3000)
      .pipe(
        takeUntil(this.stopPolling$),
        switchMap(() => {
          if (!this.osTable) {
            return of({ content: [], totalElements: 0 });
          }

          const page = this.osTable.first! / this.osTable.rows!;
          const size = this.osTable.rows!;

          return this.offerService.getOffersChangeAddress(
            this.selectedCity,
            this.selectedTypeOs,
            this.selectedPeriodOs || '',
            page,
            size
          );
        })
      )
      .subscribe({
        next: (pageData: any) => {
          this.offers = pageData.content;
          this.totalRecords = pageData.totalElements;
        },
        error: (err) => console.error(err),
      });
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

  meuMetodoExtra(): void {
    this.formIsValid = true;
    this.avisoInvalido = false;
  }

  sendToAutentiqueSubmit() {
    if (!this.selectedOfferId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione uma oferta (agenda)!',
      });
      return;
    }

    const sellerId = this.authService.getSellerId();

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

    const payload = {
      term,
      signers: mappedSigners,
      clientId: this.clientId,
      sellerId: sellerId,
      phone: this.phone,
      offerId: this.selectedOfferId,
      numParcels: this.selectedInstallments || 1,
      clientType: this.selectedClientType,
    };

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

  async onFotoCapturada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      const resizedFile = await this.imageUtilsService.resizeImage(
        file,
        1280,
        1280,
        0.7
      );

      this.fotoCapturadaFile = resizedFile;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result ?? null;
        this.isPreviewDialogVisible = true;
      };

      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error('Erro ao redimensionar imagem', error);
    }
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;

    this.isPreviewDialogVisible = false;
  }

  toggleEditingAddress(): void {
    this.isEditingAddress = !this.isEditingAddress;

    if (!this.isEditingAddress && this.originalAddressForm) {
      this.addressNewForm = { ...this.originalAddressForm };
    }
  }

  onPaymentMethodChange() {
    if (this.addressNewForm.paymentForm !== 'Boleto') {
      this.selectedInstallments = 1;
    }
  }

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

  onPdfViewerLoad(): void {
    console.log('O Iframe do PDF está 100% carregado e pronto.');
    this.isPdfViewerLoaded = true;
  }

  public get isAddressDataChanged(): boolean {
    if (!this.originalAddressForm) {
      return false;
    }

    if (this.addressNewForm.adesionValue == null || this.addressNewForm.adesionValue === 0) {
      return false;
    }

    if (!this.selectedOfferId) { 
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
        detail:
          'O termo de transferência precisa ser gerado e assinado antes de continuar!',
      });
      return;
    }

    if (!this.selectedOfferId) { 
      this.messageService.add({
        severity: 'warn',
        summary: 'Oferta não selecionada',
        detail: 'Por favor, selecione e reserve uma oferta de viabilidade antes de continuar.',
      });
      return;
    }

    this.isLoading = true;
    this.isSubmitting = true;

    try {
      const pdfFile = new File(
        [this.pdfBlobFinal],
        'termo_mudanca_endereco.pdf',
        { type: 'application/pdf' }
      );

      const photoFiles: File[] = [];

      if (this.step4CapturedPhotos && this.step4CapturedPhotos.length > 0) {
        this.step4CapturedPhotos.forEach((photo) => {
          if (photo.file) {
            photoFiles.push(photo.file);
          }
        });
      } else if (this.fotoCapturadaFile) {
        photoFiles.push(this.fotoCapturadaFile);
      }

      const payload = {
        clientId: this.currentContract.clientId,
        contractId: this.currentContract.id,
        offerId: this.selectedOfferId,
        adesion: this.addressNewForm.adesionValue || 0,
        numParcels: this.selectedInstallments || 1,
        clientType: this.selectedClientType,
        observation: this.addressNewForm.observation || '',
        phone: this.phone || '',
        address: {
          cep: this.addressNewForm.zipCode,
          uf: this.addressNewForm.uf,
          cidade: this.addressNewForm.city,
          rua: this.addressNewForm.street,
          numero: this.addressNewForm.numberFromHome,
          bairro: this.addressNewForm.neighborhood,
          complemento: this.addressNewForm.complement,
        },
      };

      console.log('Payload enviado:', payload);

      this.contractsService
        .updateAddressContract(
          this.currentContract.id,
          payload,
          pdfFile,
          photoFiles
        )
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: 'Endereço atualizado!',
            });

            const enderecoCompleto = `${this.addressNewForm.street}, ${this.addressNewForm.numberFromHome} - ${this.addressNewForm.neighborhood}`;
            const cidadeUF = `${this.addressNewForm.city}/${this.addressNewForm.uf}`;
            const enderecoFinalizado = `${enderecoCompleto} | ${cidadeUF}`;

            console.log('RESPOSTA BACKEND:', response);

            this.result = {
              clientName:
                this.client?.name ||
                this.client?.socialName ||
                'Cliente Indisponível',
              clientCpf: this.formatCpfCnpj(
                this.client?.cpf || this.client?.cnpj || 'N/A'
              ),
              contrato:
                this.currentContract?.codeContractRbx ||
                this.currentContract?.id,
              novoEndereco: enderecoFinalizado,
              cidade: `${this.addressNewForm.city}/${this.addressNewForm.uf}`,

              adesionValue: this.addressNewForm.adesionValue || 0,

              documentoRbx:
                response?.numeroDocumento ||
                response?.protocolo ||
                'Processado',
              linkBoleto: response?.linkBoleto,
              linksBoletos: response?.linksBoletos || [],
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
      console.error('Erro ao processar PDF', error);
      this.isLoading = false;
      this.isSubmitting = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao processar o arquivo PDF.',
      });
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

  extrairLink(textoCompleto: string): string {
    if (!textoCompleto) return '';

    // Se vier no formato "Doc: ... - Link: http...", pegamos a segunda parte
    if (textoCompleto.includes('Link: ')) {
      return textoCompleto.split('Link: ')[1].trim();
    }

    // Se já vier o link limpo (http...), retorna ele mesmo
    return textoCompleto;
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
      this.router.navigate(['info', this.clientId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  loadClientData() {
    this.clientService.getClientById(this.clientId).subscribe({
      next: (clientData: Cliente) => {
        this.client = clientData;
      },
      error: (err) => {
        console.error('Erro ao carregar dados do cliente:', err);
      },
    });
  }

  openDialogOs(): void {
    this.dialogOs = true;
  }

  loadOffers(event: any) {
    this.loadingOs = true;

    const page = event.first / event.rows;
    const size = event.rows;

    this.offerService
      .getOffersChangeAddress(
        this.selectedCity,
        this.selectedTypeOs,
        this.selectedPeriodOs || '',
        page,
        size
      )
      .subscribe({
        next: (pageData) => {
          this.offers = pageData.content;
          this.totalRecords = pageData.totalElements;
          this.loadingOs = false;
        },
        error: () => (this.loadingOs = false),
      });
  }

  reloadTable() {
    this.osTable.reset();
  }

  onDialogNewOs() {
    this.loadExistingBlocks();
  }

  private loadExistingBlocks(): void {
    this.blockOfferService
      .getAllBlockOffers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blocks) => {
          if (blocks && blocks.length > 0) {
            this.activeBlock = blocks[0];
            const releaseDate = this.parsePtBrDate(
              this.activeBlock.initialDate
            );
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (releaseDate && releaseDate > today) {
              this.minDateValue = releaseDate;
            } else {
              this.minDateValue = today;
            }
          }
        },
        error: (err) =>
          console.error('Erro ao carregar blocos existentes:', err),
      });
  }

  getOfferBlockPeriodLabel(period: BlockPeriodOffers): string {
    return BlockPeriodOffersLabels[period] || 'Período Desconhecido';
  }

  private toComparableFormat(dateStr: string): string | null {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const parts = dateStr.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(
      2,
      '0'
    )}`;
  }

  private parsePtBrDate(dateStr: string): Date | null {
    const comparableFormat = this.toComparableFormat(dateStr);
    return comparableFormat ? new Date(comparableFormat + 'T00:00:00') : null;
  }

  clearFiltersOs() {
    this.selectedPeriodOs = null;
    this.selectedCity = '';
    this.selectedTypeOs = '';
    this.osTable.reset();
  }

  RequestOs(): void {
    const payload: any = {
      typeOfOs: this.typeNewOs,
      city: this.selectedNewOsCity,
      period: this.selectedPeriodOs,
      date: this.selectedDate,
    };
  }

  solicitarOs() {
    if (
      !this.selectedTypeNewOs ||
      !this.selectedNewOsCity ||
      !this.selectedPeriodOs ||
      !this.selectedDate
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obrigatórios',
        detail: 'Preencha todos os campos antes de solicitar.',
      });
      return;
    }

    const payload = {
      typeOfOs: this.selectedTypeNewOs,
      city: this.selectedNewOsCity,
      period: this.selectedPeriodOs,
      date: this.selectedDate,
    };

    this.webSocketService.sendOfferRequest(payload);
    this.dialogNewOs = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Solicitação enviada',
      detail: 'Sua OS foi enviada para análise!',
    });

    this.formNewOs.resetForm();
  }


  toggleReservation(offer: any) {
    if (!offer.reserved) {
      this.reserveOffer(offer);
    } else {
      this.unreserveOffer(offer);
    }
  }

  reserveOffer(offer: any): void {
    if (this.selectedOfferId && this.selectedOfferId !== offer.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Reserva não permitida',
        detail:
          'Você já possui uma OS reservada. Libere-a antes de reservar outra.',
      });
      return;
    }

    if (offer.reserved) {
      this.messageService.add({
        severity: 'warn',
        summary: 'OS indisponível',
        detail: 'Esta OS já está reservada.',
      });
      return;
    }

    const sellerId = this.authService.getSellerId()!;

    this.offerService.reserveOffer(offer.id, sellerId).subscribe({
      next: (updatedOffer: any) => {
        Object.assign(offer, updatedOffer);
        this.selectedOfferId = offer.id;
      },
      error: (err) => {
        if (err.status === 409) {
          this.messageService.add({
            severity: 'warn',
            summary: 'OS indisponível',
            detail: 'Esta OS já foi reservada por outro vendedor.',
          });
        }
      },
    });
  }

  unreserveOffer(offer: any) {
    const sellerId = this.authService.getSellerId()!;

    this.offerService.unreserveOffer(offer.id, sellerId).subscribe({
      next: () => {
        offer.reserved = false;
        offer.reservedBy = null;
        offer.reservedAt = null;
        offer.reservedUntil = null;
        this.selectedOfferId = null;
      },
      error: (err) => {
        if (err.status === 403) {
          this.messageService.add({
            severity: 'error',
            summary: 'Ação não permitida',
            detail: 'Você não pode remover a reserva de outro vendedor.',
          });
        }
      },
    });
  }

 openPhoneModal() {
    this.phone = '';
    this.showPhoneDialog = true;
  }
   confirmSendToClient() {
    this.showPhoneDialog = false;
    this.onConfirmAddressChange();
  }
}
