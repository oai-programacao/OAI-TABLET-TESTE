import { ImageUtilsService } from './../../services/midia/image-utils.service';
import { WebSocketService } from './../../services/webSocket/websocket.service';
import { BlockOffersRequestService } from './../../services/blockOffer/blockoffer.service';
import {
  Component,
  inject,
  ViewChild,
  OnInit,
  ElementRef,
} from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { FormsModule, NgForm, NgModelGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { Cliente } from '../../models/cliente/cliente.dto';
import { SelectModule } from 'primeng/select';
import { NgxCurrencyDirective } from 'ngx-currency';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { Popover } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { NgxMaskDirective } from 'ngx-mask';
import { TextareaModule } from 'primeng/textarea';
import { GoogleMapsComponent } from '../../shared/components/google-maps/google-maps.component';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanService, Plan } from '../../services/plan/plan.service';
import { CepService, CepResponse } from '../../services/cep/cep.service';
import { SalesService } from '../../services/sales/sales.service';
import { MidiaService } from '../../services/midia/midia.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../core/auth.service';
import { ToastModule } from 'primeng/toast';
import { ActionsContractsService } from '../../services/actionsToContract/actions-contracts.service';
import { firstValueFrom, forkJoin, interval, of, Subject } from 'rxjs';
import { DateUtilsService } from '../../shared/utils/date.utils';
import {
  ConsentTermAdesionRequest,
  ConsentTermPermanentRequest,
  ReportsService,
} from '../../services/reports/reports.service';

import { AttendancesService } from '../../services/attendances/attendance.service';
import { ContractFormData } from '../../models/sales/sales.dto';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Table, TableModule } from 'primeng/table';
import { OfferProjection } from '../../models/offer/offer-projection.model';
import { OffersService } from '../../services/offers/offers.service';
import { TagModule } from 'primeng/tag';
import {
  BlockPeriodOffers,
  BlockPeriodOffersLabels,
  ViewBlockOffersDto,
} from '../../models/blockoffer/blockOffer.dto';
import { AppComponent } from '../../app.component';
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';
import { CheckComponent } from '../../shared/components/check-component/check-component.component';

@Component({
  selector: 'app-add-contract',
  standalone: true,
  imports: [
    CardBaseComponent,
    StepperModule,
    ButtonModule,
    FormsModule,
    CommonModule,
    InputGroupModule,
    IftaLabelModule,
    InputGroupAddonModule,
    InputTextModule,
    SelectModule,
    NgxCurrencyDirective,
    DatePickerModule,
    DividerModule,
    Popover,
    DialogModule,
    NgxMaskDirective,
    TextareaModule,
    GoogleMapsComponent,
    SignaturePadComponent,
    ProgressSpinnerModule,
    ToastModule,
    TableModule,
    TagModule,
    MessagesValidFormsComponent,
    CheckComponent,
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
  providers: [MessageService, AttendancesService],
})
export class AddContractComponent implements OnInit {
  @ViewChild('pop') pop!: Popover;
  @ViewChild('contractForm') contractForm!: NgForm;
  @ViewChild('step1Group') step1Group!: NgModelGroup;
  @ViewChild('step2Group') step2Group!: NgModelGroup;
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;
  @ViewChild('osTable') osTable!: Table;
  @ViewChild('formNewOs') formNewOs!: NgForm;

  private readonly router = inject(Router);
  private readonly app = inject(AppComponent);
  private readonly offerService = inject(OffersService);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly cepService = inject(CepService);
  private readonly salesService = inject(SalesService);
  private readonly midiaService = inject(MidiaService);
  private readonly authService = inject(AuthService);
  private readonly reportsService = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly blockOfferService = inject(BlockOffersRequestService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly imageUtilsService = inject(ImageUtilsService);
  private stopPolling$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  minDate!: Date;

  client!: Cliente;
  clientId: string | null = null;
  draftId?: string;

  loadingOs = false;
  offers: OfferProjection[] = [];
  totalRecords: number = 0;

  modalVisible: boolean = false;
  pdfDialogVisible = false;
  signDialogVisible = false;
  isPreviewDialogVisible: boolean = false;
  dialogOs: boolean = false;
  dialogNewOs: boolean = false;
  offerNothing: boolean = false;
  activeBlock: ViewBlockOffersDto | null = null;

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

  selectedClientType: string = '';
  clientTypes = [
    { label: 'B2B', value: 'B2B' },
    { label: 'B2B ESPECIAL', value: 'B2B ESPECIAL' },
    { label: 'B2C', value: 'B2C' },
    { label: 'B2G', value: 'B2G' },
    { label: 'Interno', value: 'Interno' },
    { label: 'Temporário', value: 'Temporário' },
    { label: 'Condomínio', value: 'Condomínio' },
  ];

  selectedTechnology: string = '';
  technologyTypes = [
    { label: 'Fibra', value: 'FIBER_OPTIC' },
    { label: 'Rádio', value: 'RADIO' },
  ];

  selectedTypeOs: string = '';
  typeOs = [
    { label: 'Instalação', value: 'INSTALLATION' },
    { label: 'Visita Técnica', value: 'TECHNICAL_VISIT' },
  ];

  selectedPeriodOs: string = '';
  selectedNewPeriodOs: string = '';
  periodsOs = [
    { label: 'Manhã', value: 'MORNING' },
    { label: 'Tarde', value: 'AFTERNOON' },
    { label: 'Noite', value: 'NIGHT' },
  ];

  selectedTypeNewOs: string = '';
  typeNewOs = [{ label: 'Nova Instalação', value: 'INSTALLATION' }];
  selectedDateNewOs: string | null = null;
  pdfPreviewUrl: string | null = null;
  pdfBlobFinal: Blob | null = null;
  private adesionBlob!: Blob;
  private permanenceBlob!: Blob;
  private mergedContractBlob!: Blob;
  activeStep: number = 1;
  isSubmitting = false;
  phone: string = '';
  phoneAutentique: string = '';
  step1Completed: boolean = false;
  step2Completed: boolean = false;
  pdfWasDownloaded: boolean = false;
  safePdfPreviewUrl: SafeResourceUrl | null = null;
  isArchiving: boolean = false;
  archivedDraftId: string | null = null;
  pdfUrl: string | null = null;
  pdfMode: 'adesion' | 'permanence' = 'adesion';
  avisoInvalido: boolean = true;
  safePdfAdesionUrl?: SafeResourceUrl;
  safePdfPermanentUrl?: SafeResourceUrl;
  rawPdfAdesionUrl: string | null = null;
  rawPdfPermanentUrl: string | null = null;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;
  capturedPhotos: Array<{ file: File; preview: string }> = [];
  images: (File | null)[] = [null, null, null];
  imagePreviews: (string | null)[] = [null, null, null];
  previewVisible = false;
  previewImage: string | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;
  isPdfViewerLoaded: boolean = false;
  step4CapturedPhotos: Array<{ file: File; preview: string }> = [];
  signatureVisibleFlag = false;
  activeContractType: 'adesion' | 'permanence' = 'adesion';
  capturedSignatureAdesion: string | null = null;
  capturedSignaturePermanence: string | null = null;
  isLoadingSignature = false;
  isLoadingDraft: boolean = false;
  isLoading = false;
  dateSignature: Date | null = null;
  dateOfStart: Date | null = null;
  dateOfMemberShipExpiration: Date | null = null;
  refreshInterval: any;

  selectedOfferId: string | null = null;
  minDateValue: Date = new Date();

  showPhoneDialog: boolean = false;
  tocarCheck: boolean = false;

  public contractFormData: ContractFormData = {
    sellerId: '',
    clientId: '',
    offerId: '',
    codePlan: 0,
    dateStart: '',
    dateSignature: '',
    dateExpired: '',
    adesion: 0,
    numberParcels: 0,
    address: {
      zipCode: '',
      state: '',
      city: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
    },
    signature: '',
    observation: '',
    termConsentSales: undefined,
    discountFixe: undefined,
    vigencia: 0,
    cicleFatId: 0,
    cicleBillingDayBase: 0,
    cicleBillingExpired: 0,
    clientType: '',
    phone: '',
    typeTechnology: '',
  };

  ngAfterViewInit() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.clearPad();
    }
  }

  ngOnInit(): void {
    const clientId = this.route.snapshot.queryParamMap.get('clientId');
    const draftId = this.route.snapshot.queryParamMap.get('draftId');

    if (clientId) {
      this.clientId = clientId;
      this.contractFormData.clientId = clientId;
    }

    if (draftId) {
      this.draftId = draftId;
      this.loadDraft(draftId);
    }

    this.loadPlans();

    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);
  }

  // Novo método para carregar rascunho
  private loadDraft(draftId: string): void {
    this.salesService.convertAndDeleteDraft(draftId).subscribe({
      next: (saleData) => this.loadDraftData(saleData),
      error: (err) => console.error('❌ Erro ao carregar rascunho', err),
    });
  }

  ngOnDestroy() {
    this.stopPolling$.next();
    this.stopPolling$.complete();
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

          return this.offerService.getOffersSales(
            this.selectedCity,
            this.selectedTypeOs,
            this.selectedPeriodOs,
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

  onHide(): void {
    this.modalVisible = false;
    this.phone = '';
  }

  get isStep1Valid(): boolean {
    return this.step1Group?.valid ?? false;
  }

  get isStep2Valid(): boolean {
    return this.step2Group?.valid ?? false;
  }

  get areSteps1And2Valid(): boolean {
    return this.isStep1Valid && this.isStep2Valid;
  }

  formData = {
    signaturePad: '',
  };

  showMapDialog = false;
  center: google.maps.LatLngLiteral = { lat: -23.55052, lng: -46.633308 };
  zoom = 15;

  selectedResidence: string = '';
  typeOfResidenceOptions = [
    { label: 'Urbana', value: 'urbana' },
    { label: 'Rural', value: 'rural' },
  ];

  selectContract: boolean | null = null;
  typesOfContractOptions = [
    { label: 'Sem Fidelidade', value: false },
    { label: 'Com Fidelidade', value: true },
  ];

  selectedInstallment: string | null = null;
  numbersOfInstallments = [
    ...Array.from({ length: 24 }, (_, i) => ({
      label: `${i + 1}x`,
      value: `${i + 1}`,
    })),
  ];

  selectDateOfExpirationCicle: string | null = null;
  typesOfDateExpirationCicle = Array.from({ length: 31 }, (_, i) => ({
    id: `${i + 1}`,
    dia: `${i + 1}`,
    vencimento: `${i + 1}`,
    descricao: `${(i + 1).toString().padStart(2, '0')} a ${((i % 31) + 1)
      .toString()
      .padStart(2, '0')} / ${(i + 1).toString().padStart(2, '0')}`,
    value: `${i + 1}`,
  }));

  selectedPlan: string | null = null;
  plans: { label: string; value: string }[] = [];

  constructor(
    public messageService: MessageService,
    private dateUtils: DateUtilsService
  ) {
    this.clientId = this.route.snapshot.queryParamMap.get('clientId') ?? '';
  }

  loadPlans() {
    this.planService.getPlans().subscribe({
      next: (data: Plan[]) => {
        this.plans = data.map((plan) => ({
          label: `${plan.codePlanRBX} - ${plan.nome}`,
          value: String(plan.codePlanRBX || ''),
          code: String(plan.codePlanRBX || ''),
          name: plan.nome,
          status: plan.status,
          disabled: plan.status === 'I',
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar planos:', err);
      },
    });
  }

  toggle(popover: Popover, event: Event) {
    popover.toggle(event);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    // 🔍 acha o primeiro slot vazio
    let targetIndex = this.images.findIndex((img) => img === null);

    if (targetIndex === -1) {
      targetIndex = this.images.length;
      this.images.push(null);
      this.imagePreviews.push(null);
    }

    try {
      const resizedFile = await this.imageUtilsService.resizeImage(
        file,
        1280,
        1280,
        0.7
      );

      this.images[targetIndex] = resizedFile;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews[targetIndex] = reader.result as string;
      };
      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error('Erro ao processar imagem', error);
    }
  }

  salvarImagens() {
    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do cliente não encontrado.',
      });
      return;
    }

    const filesToUpload = this.images.filter((img): img is File => !!img);
    if (filesToUpload.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhuma imagem selecionada',
      });
      return;
    }

    this.midiaService.saveMidias(filesToUpload, this.clientId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Imagens enviadas com sucesso!',
        });
        this.images = [null, null, null];
        this.imagePreviews = [null, null, null];
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao enviar imagens',
        });
      },
    });
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

    this.images.push(this.fotoCapturadaFile);
    this.imagePreviews.push(this.thumbnailPreview as string);

    this.messageService.add({
      severity: 'success',
      summary: 'Foto Adicionada',
      detail: `Foto ${this.step4CapturedPhotos.length} salva!`,
    });

    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
  }

  removerFotoStep4(index: number): void {
    const removed = this.step4CapturedPhotos[index];

    this.step4CapturedPhotos.splice(index, 1);

    const imgIndex = this.images.findIndex((f) => f === removed.file);
    if (imgIndex !== -1) {
      this.images.splice(imgIndex, 1);
      this.imagePreviews.splice(imgIndex, 1);
    }

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

  removeImage(index: number) {
    this.images[index] = null;
    this.imagePreviews[index] = null;
  }

  viewImage(image: string) {
    this.previewImage = image;
    this.previewVisible = true;
  }

  onSignatureData(signatureData: string): void {
    this.formData.signaturePad = signatureData;

    this.messageService.add({
      severity: 'success',
      summary: 'Assinatura Capturada',
      detail: 'A assinatura foi capturada com sucesso.',
    });
  }

  backToSearch() {
    this.router.navigate(['search']);
  }

  searchCEP(): void {
    if (!this.contractFormData.address.zipCode) return;

    this.cepService.searchCEP(this.contractFormData.address.zipCode).subscribe({
      next: (res: CepResponse) => {
        if ((res as any).erro) {
          this.messageService.add({
            severity: 'error',
            summary: 'CEP não encontrado',
            detail: 'O CEP informado não foi encontrado.',
          });
          return;
        }

        this.contractFormData.address.street = res.logradouro || '';
        this.contractFormData.address.neighborhood = res.bairro || '';
        this.contractFormData.address.city = res.localidade || '';
        this.contractFormData.address.state = res.uf || '';
        this.contractFormData.address.complement = res.complemento || '';
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  async makeAsale(): Promise<void> {
    if (this.selectedOfferId === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Oferta não selecionada',
        detail: 'Por favor, selecione uma oferta antes de continuar.',
      });
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      if (!this.adesionBlob || !this.permanenceBlob) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Contratos não assinados',
          detail:
            'Por favor, gere e assine os contratos antes de criar a venda.',
        });
        return;
      }

      const sellerId = this.authService.getSellerId();
      const selectedCycle = this.typesOfDateExpirationCicle.find(
        (c) => c.value === this.selectDateOfExpirationCicle
      );

      const payload = {
        salesId: null,
        sellerId,
        clientId: this.clientId,
        offerId: this.selectedOfferId,
        codePlan: Number(this.selectedPlan),
        dateStart:
          this.dateUtils.formatToLocalDateString(this.dateOfStart) || '',
        dateSignature:
          this.dateUtils.formatToLocalDateString(this.dateSignature) || '',
        dateExpiredAdesion:
          this.dateUtils.formatToLocalDateString(
            this.dateOfMemberShipExpiration
          ) || '',
        adesion: Number(this.contractFormData.adesion),
        numberParcels: this.selectedInstallment,
        address: { ...this.contractFormData.address },
        observation: this.contractFormData.observation || '',
        discountFixe: this.contractFormData.discountFixe || 0.0,
        vigencia: Number(this.contractFormData.vigencia || 12),
        cicleFatId: Number(selectedCycle!.id),
        cicleBillingDayBase: Number(selectedCycle!.dia),
        cicleBillingExpired: Number(selectedCycle!.vencimento),
        draftId: this.draftId || null,
        residenceType: this.selectedResidence || '',
        clientType: this.selectedClientType || '',
        phone: this.contractFormData.phone || '',
        typeTechnology: this.selectedTechnology || '',
        loyalty: this.selectContract,
      };

      const formData = new FormData();
      formData.append('dto', JSON.stringify(payload));
      if (!this.selectContract) {
        formData.append(
          'termConsentFiles',
          this.adesionBlob,
          'contrato_adesao.pdf'
        );
      } else {
        formData.append(
          'termConsentFiles',
          this.adesionBlob,
          'contrato_adesao.pdf'
        );
        formData.append(
          'termConsentFiles',
          this.permanenceBlob,
          'contrato_permanencia.pdf'
        );
      }

      if (this.images?.length) {
        this.images
          .filter((file): file is File => !!file)
          .forEach((file) => formData.append('contractImages', file));
      }

      await firstValueFrom(this.salesService.createSale(formData));

      this.messageService.add({
        severity: 'success',
        summary: 'Venda Realizada',
        detail: 'A venda foi criada com sucesso.',
      });
      this.isSubmitting = false;

      this.router.navigate([`/attendances/${this.clientId}`]).then(() => {
        setTimeout(() => {
          this.app.triggerLottie('/saleSuccess.json', 5000);
        }, 200);
      });
    } catch (err: any) {
      const detail = err?.error?.message ?? 'Erro ao criar a venda.';
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail,
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  abrirModal(): void {
    this.modalVisible = true;
  }

  goToStep(step: number) {
    const invalidFields: string[] = [];

    // --- Step 1 ---
    if (this.activeStep === 1) {
      if (!this.selectedPlan) invalidFields.push('Plano de Internet');
      if (!this.contractFormData.adesion) invalidFields.push('Preço da Adesão');
      if (!this.dateOfStart) invalidFields.push('Data de Início');
      if (!this.dateSignature) invalidFields.push('Data de Assinatura');
      if (!this.dateOfMemberShipExpiration)
        invalidFields.push('Data de Vencimento da Adesão');
      if (!this.selectDateOfExpirationCicle)
        invalidFields.push('Dia de Vencimento');
      if (this.selectContract == null) invalidFields.push('Tipo de Contrato');
      if (!this.selectedClientType) invalidFields.push('Tipo de Cliente');
      if (!this.selectedTechnology) invalidFields.push('Tipo de Tecnologia');
      if (!this.selectedInstallment)
        invalidFields.push('Número de Parcelas Adesão');

      this.step1Completed = invalidFields.length === 0;
    }

    // --- Step 2 ---
    if (this.activeStep === 2) {
      if (!this.contractFormData.address.zipCode) invalidFields.push('CEP');
      if (!this.contractFormData.address.street)
        invalidFields.push('Logradouro');
      if (!this.contractFormData.address.number)
        invalidFields.push('Número do Prédio');
      if (!this.contractFormData.address.neighborhood)
        invalidFields.push('Bairro');
      if (!this.contractFormData.address.city) invalidFields.push('Cidade');
      if (!this.contractFormData.address.state) invalidFields.push('UF');
      if (!this.selectedOfferId)
        invalidFields.push('Selecione uma Oferta para Instalação');
      if (!this.selectedResidence) invalidFields.push('Tipo de Residência');

      this.step2Completed = invalidFields.length === 0;
    }

    if (invalidFields.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obrigatórios',
        detail: `Preencha os seguintes campos: ${invalidFields.join(', ')}`,
        life: 8000,
      });
      return; // bloqueia avanço
    }

    // Avança para o Step solicitado
    this.activeStep = step;

    // --- Step 4: gerar preview do PDF ---
    if (step === 4) {
      if (this.step1Completed && this.step2Completed) {
        this.loadPdfPreview();
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Passos incompletos',
          detail:
            'Complete os passos anteriores para gerar o preview do contrato.',
          life: 8000,
        });
      }
    }
  }

  // Mapeamento de nomes de controles para labels amigáveis
  getFieldLabel(controlName: string): string {
    const labels: any = {
      plans: 'Plano de Internet',
      descount: 'Desconto de Adesão',
      dateOfStart: 'Data de Início',
      dateSignature: 'Data de Assinatura',
      cicloFaturamento: 'Dia de Vencimento',
      tipoContrato: 'Tipo de Contrato',
      clientTypes: 'Tipo de Cliente',
      typeTechnology: 'Tipo de Tecnologia',
      cep: 'CEP',
      street: 'Logradouro',
      streetNumber: 'Número do Prédio',
      neighborhood: 'Bairro',
      cityaddress: 'Cidade',
      state: 'UF',
    };
    return labels[controlName] || controlName;
  }

  async sendToAutentiqueSubmit() {
    if (!this.phoneAutentique) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Por favor, insira um número de telefone válido.',
      });
      return;
    }
    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do cliente não encontrado.',
      });
      return;
    }

    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Você está deslogado. Faça login novamente.',
      });
      return;
    }

    this.isLoading = true;

    try {
      const adesionData: ConsentTermAdesionRequest = {
        clientId: this.clientId,
        codePlanRBX: Number(this.selectedPlan),
        street: this.contractFormData.address.street,
        number: this.contractFormData.address.number,
        neighborhood: this.contractFormData.address.neighborhood,
        city: this.contractFormData.address.city,
        state: this.contractFormData.address.state,
        zipCode: this.contractFormData.address.zipCode,
        contractDueDay:
          this.dateUtils.formatToLocalDateString(
            this.dateOfMemberShipExpiration
          ) || '',
        adesion: this.contractFormData.adesion.toString() || '0',
        discountFixe: this.contractFormData.discountFixe?.toString() || '0',
      };

      const permanenceData: ConsentTermPermanentRequest = {
        clientId: this.clientId,
        codePlanRBX: Number(this.selectedPlan),
        street: adesionData.street,
        number: adesionData.number,
        neighborhood: adesionData.neighborhood,
        city: adesionData.city,
        state: adesionData.state,
        zipCode: adesionData.zipCode,
        adesion: this.contractFormData.adesion.toString() || '0',
        contractDueDay: adesionData.contractDueDay,
        discountFixe: adesionData.discountFixe,
      };

      const mappedSigners = [
        {
          name: this.client?.name || 'Cliente',
          phone: '+55' + (this.phoneAutentique || ''),
        },
      ];

      const payload = {
        signers: mappedSigners,
        adesionData: adesionData,
        permanenceData: permanenceData,
        sellerId: sellerId,
        offerId: this.selectedOfferId,
        clientId: this.clientId,
        codePlan: Number(this.selectedPlan),
        dateStart: this.dateUtils.formatToLocalDateString(this.dateOfStart),
        dateSignature: this.dateUtils.formatToLocalDateString(
          this.dateSignature
        ),
        dateExpiredAdesion: this.dateUtils.formatToLocalDateString(
          this.dateOfMemberShipExpiration
        ),
        adesion: Number(this.contractFormData.adesion),
        numberParcels: Number(this.selectedInstallment),
        address: { ...this.contractFormData.address },
        observation: this.contractFormData.observation || '',
        discountFixe: this.contractFormData.discountFixe,
        vigencia: Number(this.contractFormData.vigencia || 12),
        cicleFatId: Number(
          this.typesOfDateExpirationCicle.find(
            (c) => c.value === this.selectDateOfExpirationCicle
          )!.id
        ),
        cicleBillingDayBase: Number(
          this.typesOfDateExpirationCicle.find(
            (c) => c.value === this.selectDateOfExpirationCicle
          )!.dia
        ),
        cicleBillingExpired: Number(
          this.typesOfDateExpirationCicle.find(
            (c) => c.value === this.selectDateOfExpirationCicle
          )!.vencimento
        ),
        residenceType: this.selectedResidence || '',
        clientType: this.selectedClientType || '',
        phone: this.phoneAutentique || '',
        typeTechnology: this.selectedTechnology || '',
        loyalty: this.selectContract,
      };

      console.log('📤 Enviando payload para Autentique:', payload);

      this.actionsContractsService
        .sendContractSalesAutentique(payload, this.clientId)
        .subscribe({
          next: (res: string) => {
            this.isLoading = false;

            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `${res}. Aguarde o cliente assinar, todo o processo será feito de forma automática.`,
              life: 10000,
            });
            this.tocarCheck = true;
            setTimeout(() => (this.tocarCheck = false), 300);
            this.modalVisible = false;
          },
          error: (err) => {
            const backendMessage =
              (typeof err.error === 'string'
                ? err.error
                : err?.error?.message) ||
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
    } catch (error) {
      this.isLoading = false;
      console.error('Erro ao enviar para Autentique:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao processar envio.',
      });
    }
  }

  clearSignature() {
    this.signaturePadComponent.clearPad();
  }
  get capturedSignature(): string | null {
    if (this.activeContractType === 'adesion') {
      return this.capturedSignatureAdesion;
    } else {
      return this.capturedSignaturePermanence;
    }
  }

  forceSignatureRedraw() {
    setTimeout(() => {
      this.signatureVisibleFlag = false;
      setTimeout(() => {
        this.signatureVisibleFlag = true;
      });
    }, 30);
  }

  onFotoCapturada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fotoCapturadaFile = file;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Arquivo Inválido',
        detail: 'Selecione uma imagem.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.thumbnailPreview = e.target.result;
      this.fotoCapturadaFile = file;
      this.isPreviewDialogVisible = true;
    };
    reader.readAsDataURL(file);
  }

  savePdf(): void {
    if (!this.pdfPreviewUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Erro',
        detail: 'PDF não disponível para download.',
      });
      return;
    }

    const fileName = `contratos_${this.clientId}}.pdf`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      window.open(this.pdfPreviewUrl, '_blank');

      this.messageService.add({
        severity: 'info',
        summary: 'iOS',
        detail: 'Toque em "Compartilhar" e depois em "Salvar em Arquivos"',
        life: 5000,
      });
    } else {
      const link = document.createElement('a');
      link.href = this.pdfPreviewUrl;
      link.download = fileName;
      link.click();

      this.messageService.add({
        severity: 'success',
        summary: 'Download',
        detail: 'PDF baixado com sucesso!',
      });
    }

    this.pdfWasDownloaded = true;
  }

  abrirAssinatura() {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true;
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
    this.isPreviewDialogVisible = false;
  }

  async loadPdfPreview(): Promise<void> {
    if (this.isLoadingPreview || !this.clientId) return;

    const MINIMUM_SPINNER_TIME = 700;
    const startTime = Date.now();

    this.isLoadingPreview = true;
    this.safePdfPreviewUrl = null;

    // Limpa previews antigos
    this.limparPreview?.();

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    try {
      const contractData = {
        clientId: this.clientId,
        codePlanRBX: Number(this.selectedPlan),
        ...this.contractFormData.address,
        complement: this.contractFormData.address.complement || '',
        discountFixe: this.contractFormData.discountFixe?.toString() || '0',
        adesion: this.contractFormData.adesion?.toString() || '0',
        contractDueDay:
          this.dateUtils.formatToLocalDateString(
            this.dateOfMemberShipExpiration
          ) || '',
        signatureBase64: this.capturedSignatureAdesion || null,
      };

      let mergedPdfBlob: Blob = null as any;

      if (!this.selectContract) {
        mergedPdfBlob = await firstValueFrom(
          this.reportsService.getContractAdesionPdf(this.clientId, contractData)
        );
      } else {
        mergedPdfBlob = await firstValueFrom(
          this.reportsService.getContractDisplayPdf(this.clientId, contractData)
        );
      }

      if (mergedPdfBlob.type !== 'application/pdf') {
        throw new Error('PDF inválido retornado pelo servidor');
      }

      // Cria URL para o preview
      this.pdfPreviewUrl = URL.createObjectURL(mergedPdfBlob);
      this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.pdfPreviewUrl
      );
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      this.previewLoadFailed = true;

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao gerar preview dos contratos.',
      });
    } finally {
      const duration = Date.now() - startTime;
      const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);
      setTimeout(() => (this.isLoadingPreview = false), delay);
    }
  }

  async generateContractWithSignature(signatureBase64: string): Promise<{
    adesionBlob: Blob;
    permanenceBlob: Blob;
    mergedSignedBlob: Blob;
  }> {
    if (!this.clientId || this.isLoadingPreview)
      return Promise.reject('Cliente não definido ou carregando');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    try {
      const contractData = {
        clientId: this.clientId,
        codePlanRBX: Number(this.selectedPlan),
        ...this.contractFormData.address,
        complement: this.contractFormData.address.complement || '',
        adesion: this.contractFormData.adesion?.toString() || '0',
        discountFixe: this.contractFormData.discountFixe?.toString() || '0',
        contractDueDay:
          this.dateUtils.formatToLocalDateString(
            this.dateOfMemberShipExpiration
          ) || '',
        signatureBase64,
      };

      let adesionBlob: Blob;
      let permanenceBlob: Blob;
      let mergedSignedBlob: Blob;

      if (!this.selectContract) {
        adesionBlob = await firstValueFrom(
          this.reportsService.getContractAdesionPdf(this.clientId, contractData)
        );
        permanenceBlob = adesionBlob;
        mergedSignedBlob = adesionBlob;

        this.rawPdfAdesionUrl = URL.createObjectURL(adesionBlob);
        this.safePdfAdesionUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.rawPdfAdesionUrl
        );
        if (this.pdfPreviewUrl) URL.revokeObjectURL(this.pdfPreviewUrl);
        this.pdfPreviewUrl = URL.createObjectURL(mergedSignedBlob);
        this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.pdfPreviewUrl
        );
        this.capturedSignatureAdesion = signatureBase64;
        this.formData.signaturePad = signatureBase64;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Contrato assinado com sucesso!',
        });
        this.signDialogVisible = false;
      } else {
        [adesionBlob, permanenceBlob, mergedSignedBlob] = await firstValueFrom(
          forkJoin([
            this.reportsService.getContractAdesionPdf(
              this.clientId,
              contractData
            ),
            this.reportsService.getContractPermanencePdf(
              this.clientId,
              contractData
            ),
            this.reportsService.getContractDisplayPdf(
              this.clientId,
              contractData
            ),
          ])
        );

        this.rawPdfAdesionUrl = URL.createObjectURL(adesionBlob);
        this.rawPdfPermanentUrl = URL.createObjectURL(permanenceBlob);
        this.safePdfAdesionUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.rawPdfAdesionUrl
        );
        this.safePdfPermanentUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(
            this.rawPdfPermanentUrl
          );
        if (this.pdfPreviewUrl) URL.revokeObjectURL(this.pdfPreviewUrl);
        this.pdfPreviewUrl = URL.createObjectURL(mergedSignedBlob);
        this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.pdfPreviewUrl
        );

        this.capturedSignatureAdesion = signatureBase64;
        this.capturedSignaturePermanence = signatureBase64;
        this.formData.signaturePad = signatureBase64;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Contratos assinados com sucesso!',
        });
        this.signDialogVisible = false;
      }

      return { adesionBlob, permanenceBlob, mergedSignedBlob };
    } catch (error) {
      console.error('Erro ao gerar contratos:', error);
      this.previewLoadFailed = true;
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao gerar contratos.',
      });
      throw error;
    } finally {
      this.isLoadingPreview = false;
    }
  }

  captureAndGenerate(): void {
    if (this.isLoadingPreview) return;

    const signatureBase64 = this.signaturePadInDialog.getSignatureAsBase64();

    if (!signatureBase64) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, assine no campo antes de gerar os contratos.',
      });
      return;
    }

    this.generateContractWithSignature(signatureBase64).then(
      ({ adesionBlob, permanenceBlob, mergedSignedBlob }) => {
        this.adesionBlob = adesionBlob;
        this.permanenceBlob = permanenceBlob;
        this.mergedContractBlob = mergedSignedBlob;

        this.capturedSignatureAdesion = signatureBase64;
      }
    );
  }

  archiveSaleDraft(): void {
    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ClientId ausente.',
      });
      return;
    }

    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Você está deslogado. Faça login novamente.',
      });
      return;
    }

    this.isArchiving = true;

    const selectedCycle = this.typesOfDateExpirationCicle.find(
      (c) => c.value === this.selectDateOfExpirationCicle
    );

    const payload = {
      sellerId,
      clientId: this.clientId,
      codePlan: this.selectedPlan ? Number(this.selectedPlan) : null,
      dateStart: this.dateUtils.formatToLocalDateString(this.dateOfStart),
      dateSignature: this.dateUtils.formatToLocalDateString(this.dateSignature),
      dateExpiredAdesion: this.dateUtils.formatToLocalDateString(
        this.dateOfMemberShipExpiration
      ),
      adesion: this.contractFormData.adesion
        ? Number(this.contractFormData.adesion)
        : null,
      numberParcels: this.selectedInstallment
        ? Number(this.selectedInstallment)
        : null,
      address: {
        ...this.contractFormData.address,
      },
      observation: this.contractFormData.observation || '',
      typeTechnology: this.selectedTechnology || '',
      discountFixe: this.contractFormData.discountFixe?.toString() || '0',
      vigencia: String(this.contractFormData.vigencia || 12),
      cicleFatId: selectedCycle ? Number(selectedCycle.id) : null,
      cicleBillingDayBase: selectedCycle ? Number(selectedCycle.dia) : null,
      cicleBillingExpired: selectedCycle
        ? Number(selectedCycle.vencimento)
        : null,
      residenceType: this.selectedResidence || '',
      clientType: this.selectedClientType || '',
      loyalty: this.selectContract,
      signature: this.formData.signaturePad || '',
    };

    this.salesService.archiveSale(payload).subscribe({
      next: (response: any) => {
        this.isArchiving = false;
        this.archivedDraftId = response.draftId;

        console.log('Rascunho arquivado:', response);

        this.messageService.add({
          severity: 'success',
          summary: 'Rascunho Salvo',
          detail: `${response.message}`,
          life: 2000,
        });

        setTimeout(() => {
          this.router.navigate(['/waiting-leads']);
        }, 2000);
      },
      error: (err: any) => {
        this.isArchiving = false;

        console.error('Erro ao arquivar rascunho:', err);

        const detail = err?.error?.message ?? 'Erro ao salvar rascunho.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail,
        });
      },
    });
  }

  handleCapturaFoto(): void {
    if (this.step4CapturedPhotos.length > 0) {
      this.isPreviewDialogVisible = true;
      return;
    }

    if (this.cameraInput?.nativeElement) {
      this.cameraInput.nativeElement.click();
    }
  }

  async processarFotoCapturada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Arquivo Inválido',
        detail: 'Selecione uma imagem.',
      });
      return;
    }

    try {
      const resizedFile = await this.imageUtilsService.resizeImage(
        file,
        1280,
        1280,
        0.7
      );

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.thumbnailPreview = e.target.result;
        this.fotoCapturadaFile = resizedFile;
        this.isPreviewDialogVisible = true;
      };
      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao processar a imagem.',
      });
    }
  }

  private validateCurrentStep(): boolean {
    if (this.activeStep === 2) {
      return this.step2Group?.valid ?? false;
    }
    return true;
  }

  openDialogOs(): void {
    this.dialogOs = true;
  }

  loadOffers(event: any) {
    this.loadingOs = true;

    const page = event.first / event.rows;
    const size = event.rows;

    this.offerService
      .getOffersSales(
        this.selectedCity,
        this.selectedTypeOs,
        this.selectedPeriodOs,
        page,
        size
      )
      .subscribe({
        next: (pageData) => {
          this.offers = pageData.content;
          this.totalRecords = pageData.totalElements; // necessário para a paginação do p-table
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
    this.selectedPeriodOs = '';
    this.selectedCity = '';
    this.selectedTypeOs = '';
    this.osTable.reset();
  }

  solicitarOs() {
    if (
      !this.selectedTypeNewOs ||
      !this.selectedNewOsCity ||
      !this.selectedPeriodOs ||
      !this.selectedDateNewOs
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
      date: this.selectedDateNewOs,
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

  //carrega uma venda arquivada do banco de dados e preenche os formulários.
  private loadDraftData(saleData: any): void {
    if (!saleData) return;

    // Campos básicos
    this.contractFormData.clientId = saleData.clientId;
    this.contractFormData.adesion = saleData.adesion;
    this.contractFormData.address = saleData.address || {};
    this.contractFormData.observation = saleData.observation || '';
    this.contractFormData.discountFixe = saleData.discountFixe || 0;
    this.contractFormData.vigencia = saleData.vigencia || 12;

    // Datas
    this.dateOfStart = this.dateUtils.parseDate(saleData.dateStart);
    this.dateSignature = this.dateUtils.parseDate(saleData.dateSignature);
    this.dateOfMemberShipExpiration = this.dateUtils.parseDate(
      saleData.dateExpiredAdesion
    );

    // Seleções
    this.selectedPlan = saleData.codePlan ? String(saleData.codePlan) : null;
    this.selectedInstallment =
      saleData.numberParcels != null ? String(saleData.numberParcels) : null;

    this.selectedTechnology = saleData.typeTechnology || '';
    this.selectedResidence = saleData.residenceType || '';
    this.selectedClientType = saleData.clientType || '';
    this.selectContract = saleData.loyalty;
    this.selectDateOfExpirationCicle =
      saleData.cicleFatId != null ? String(saleData.cicleFatId) : null;
  }

  openPhoneModal() {
    this.showPhoneDialog = true;
  }

  confirmSendToClient() {
    this.showPhoneDialog = false;
    this.makeAsale();
  }

  enderecoMaps = {
    logradouro: '',
    numero: '',
    bairro: '',
    localidade: '',
  };

  abrirMapa(): void {
    const a = this.contractFormData.address;

    if (!a || !a.street || !a.city) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Endereço incompleto',
        detail: 'Preencha CEP, logradouro e número antes de abrir o mapa.',
      });
      return;
    }

    this.enderecoMaps = {
      logradouro: a.street,
      numero: a.number || '',
      bairro: a.neighborhood,
      localidade: `${a.city} - ${a.state}`,
    };

    this.showMapDialog = true;
  }
}
