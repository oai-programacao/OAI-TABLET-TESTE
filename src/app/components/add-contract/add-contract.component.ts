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
import { firstValueFrom, forkJoin } from 'rxjs';
import { DateUtilsService } from '../../shared/utils/date.utils';
import {
  ConsentTermAdesionRequest,
  ConsentTermPermanentRequest,
  ReportsService,
} from '../../services/reports/reports.service';

import { AttendancesService } from '../../services/attendances/attendance.service';
import { ContractFormData } from '../../models/sales/sales.dto';
import { Address } from '../../models/sales/sales.dto';


export interface DraftSaleResponse extends ContractFormData {
  draftId: string;
  codeplan: string;
  installments: string;
  expirationCycle: string;
  contractType: string;
  startDate: string;      
  signatureDate: string;  
  expirationDate: string; 
  residenceType: string;
  images?: string[];
}

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
    ToastModule
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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly cepService = inject(CepService);
  private readonly salesService = inject(SalesService);
  private readonly midiaService = inject(MidiaService);
  private readonly authService = inject(AuthService);
  private readonly reportsService = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly attendanceService = inject(AttendancesService);
  private readonly actionsContractsService = inject(ActionsContractsService);

  private validateCurrentStep(): boolean {  
  if (this.activeStep === 2) {
    return this.step2Group?.valid ?? false;
  }
  return true;
}

  public pdfPreviewUrl: string | null = null;
  public pdfBlobFinal: Blob | null = null;

  public activeStep: number = 1;


  client!: Cliente;

  currentDraftId: string | null = null; 

  modalVisible: boolean = false;
  phone: string = '';

  step1Completed: boolean = false;
  step2Completed: boolean = false;

  pdfWasDownloaded: boolean = false;

  safePdfPreviewUrl: SafeResourceUrl | null = null;

  isArchiving: boolean = false;
  archivedDraftId: string | null = null;

  pdfDialogVisible = false;
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

  signDialogVisible = false;
  isPreviewDialogVisible: boolean = false;

  step4CapturedPhotos: Array<{ file: File; preview: string }> = [];

  signatureVisibleFlag = false;
  activeContractType: 'adesion' | 'permanence' = 'adesion';
  capturedSignatureAdesion: string | null = null;
  capturedSignaturePermanence: string | null = null;
  isLoadingSignature = false;

   draftId?: string;
  isLoadingDraft: boolean = false;

  isLoading = false;

  clientId: string | null = null;

  dateSignature: Date | null = null;
  dateOfStart: Date | null = null;
  dateOfAssignment: Date | null = null;
  dateOfMemberShipExpiration: Date | null = null;

  
  public contractFormData: ContractFormData = {
    sellerId: '',
    clientId: '',
    codePlan: 0,
    dateStart: '',
    dateSignature: '',
    dateExpired: '',
    adesion: 0,
    numberParcels: 0,
    parcels: [],
    address: {
      zipCode: '',
      state: '',
      city: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
    },
    discount: 0,
    signature: '',
    observation: '',
    dateOfAssignment: undefined,
    imagesOne: undefined,
    situationDescription: undefined,
    discountFixed: undefined,
    vigencia: 0,
    cicleFatId: 0,
    cicleBillingDayBase: 0,
    cicleBillingExpired: 0,
  };

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

  selectContract: string | null = null;
  selectedPlan: string | null = null;
  selectedInstallment: string | null = null;
  selectDateOfExpirationCicle: string | null = null;
  selectedResidence: string = '';
  typeOfResidenceOptions = [
    { label: 'Urbana', value: 'urbana' },
    { label: 'Rural', value: 'rural' },
  ];

  plans: { label: string; value: string }[] = [];
  typesOfContractOptions = [
    { label: 'Sem Fidelidade', value: '' },
    { label: 'Com Fidelidade', value: '12' },
  ];
  numbersOfInstallments = Array.from({ length: 24 }, (_, i) => ({
    label: `${i + 1}x`,
    value: `${i + 1}`,
  }));

  typesOfDateExpirationCicle = Array.from({ length: 31 }, (_, i) => ({
    id: `${i + 1}`,
    dia: `${i + 1}`,
    vencimento: `${i + 1}`,
    descricao: `${(i + 1).toString().padStart(2, '0')} a ${((i % 31) + 1)
      .toString()
      .padStart(2, '0')} / ${(i + 1).toString().padStart(2, '0')}`,
    value: `${i + 1}`,
  }));

  fullAddress = {
    logradouro: 'Avenida Brasil',
    numero: '1000',
    bairro: 'Centro',
    localidade: 'São Paulo',
  };

  constructor(public messageService: MessageService,  private dateUtils: DateUtilsService,) {
    this.clientId = this.route.snapshot.queryParamMap.get('clientId') ?? '';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.clientId = params['clientId'];
      this.draftId = params['draftId'];

      if (this.draftId) {
       this.loadDraft(this.clientId!, this.draftId);
      }
    });
    this.loadPlans();

    const fromQuery = this.route.snapshot.queryParamMap.get('clientId');
    this.clientId = fromQuery;

    if (this.clientId) {
      this.contractFormData.clientId = this.clientId;
    }
  }

  loadPlans() {
    this.planService.getPlans().subscribe({
      next: (data: Plan[]) => {
        this.plans = data.map((plan) => ({
          label: plan.nome,
          value: String(plan.codePlanRBX || ''),
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    let targetIndex = this.images.findIndex((img) => img === null);
    if (targetIndex === -1) {
      targetIndex = this.images.length;
      this.images.push(null);
      this.imagePreviews.push(null);
    }

    this.images[targetIndex] = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews[targetIndex] = reader.result as string;
    };
    reader.readAsDataURL(file);
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
    preview: this.thumbnailPreview as string
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

    this.dateSignature = new Date();

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

  submitContract(): void {
    if (!this.contractForm.valid) {
      alert('⚠️ Preencha todos os campos obrigatórios do formulário.');
      return;
    }

    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ClientId ausente na URL.',
      });
      return;
    }

    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'SellerId não encontrado para o usuário logado.',
      });
      return;
    }

    const selectedCycle = this.typesOfDateExpirationCicle.find(
      (c) => c.value === this.selectDateOfExpirationCicle
    );
    if (!selectedCycle) {
      this.messageService.add({
        severity: 'error',
        summary: 'Atenção',
        detail: 'Selecione o ciclo de faturamento.',
      });
      return;
    }

    if (!this.selectedPlan) {
      this.messageService.add({
        severity: 'error',
        summary: 'Atenção',
        detail: 'Selecione o plano.',
      });
      return;
    }

    if (!this.selectedInstallment) {
      this.messageService.add({
        severity: 'error',
        summary: 'Atenção',
        detail: 'Selecione o número de parcelas.',
      });
      return;
    }

    const payload = {
      sellerId,
      clientId: this.clientId,
      codePlan: Number(this.selectedPlan),
      dateStart: this.dateUtils.formatToLocalDateString(this.dateOfStart) || '',
      dateSignature:
        this.dateUtils.formatToLocalDateString(this.dateSignature) ||
        this.dateUtils.formatToLocalDateString(this.dateOfStart) ||
        '',
      dateExpired:
        this.dateUtils.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
      numberParcels: Number(this.selectedInstallment),
      adesion: Number(this.contractFormData.adesion) || 100.0,
      discount: 900.0,
      descountFixe: '35.00',
      address: {
        street: this.contractFormData.address.street || '',
        number: this.contractFormData.address.number || '',
        neighborhood: this.contractFormData.address.neighborhood || '',
        city: this.contractFormData.address.city || '',
        state: this.contractFormData.address.state || '',
        zipCode: this.contractFormData.address.zipCode || '',
        complement: this.contractFormData.address.complement || '',
      },
      signature: '',
      observation: this.contractFormData.observation || '',
      vigencia: String(this.contractFormData.vigencia || 12),
      cicleFatId: Number(selectedCycle.id),
      cicleBillingDayBase: Number(selectedCycle.dia),
      cicleBillingExpired: Number(selectedCycle.vencimento),
      draftId: this.currentDraftId || null,  
      residenceType: this.selectedResidence || ''  
    };

    const formData = new FormData();

    const saleDataBlob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });

    formData.append('saleData', saleDataBlob);

    this.images.forEach((imageFile, index) => {
  if (imageFile) {
    formData.append('contractImages', imageFile, `contract_${index + 1}.jpg`);
  }
});
      
    this.step4CapturedPhotos.forEach((photo, index) => {
  if (photo.file) {
    formData.append('saleImages', photo.file, `sale_${index + 1}.jpg`);
  }
});

    this.salesService.createSale(formData).subscribe({
      next: (sale) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Contrato Criado',
          detail: 'O contrato foi criado com sucesso.',
        });
        console.log('Resposta createSale:', sale);


        if (this.rawPdfAdesionUrl && this.rawPdfPermanentUrl) {
          this.registerAttendance(sale.id, sale.contractId);
        } else {

          setTimeout(() => {
            this.router.navigate(['/client-contracts', this.clientId]);
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Erro na criação da venda:', err);
        const detail = err?.error?.message ?? 'Erro ao criar a venda.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail,
        });
      },
    });
    
  }

  private registerAttendance(saleId: string, contractId: string): void {
    if (!this.clientId) {
      console.error('registerAttendance: ClientID está ausente.');
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do cliente não encontrado.',
      });
      return;
    }

    if (!contractId) {
      console.error('registerAttendance: ContractID está ausente.');
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do contrato não encontrado.',
      });
      return;
    }

    if (!this.rawPdfAdesionUrl || !this.rawPdfPermanentUrl) {
      console.error('registerAttendance: PDFs não foram gerados.');
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail:
          'Os contratos precisam ser gerados antes de criar o atendimento.',
      });
      return;
    }

    this.isLoading = true;

    Promise.all([
      fetch(this.rawPdfAdesionUrl).then((res) => res.blob()),
      fetch(this.rawPdfPermanentUrl).then((res) => res.blob()),
    ])
      .then(([adesionBlob, permanenceBlob]) => {

        const data = {
          event: 'sale',
          cliente: this.clientId,
          contrato: contractId,
        };

        const jsonBlob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });

        const formData = new FormData();
        formData.append('data', jsonBlob, 'data.json');

        formData.append('arquivo', adesionBlob, 'contrato_adesao.pdf');
        formData.append('arquivo', permanenceBlob, 'contrato_permanencia.pdf');

        this.attendanceService.registerAttendance(formData).subscribe({
          next: (response) => {
            this.isLoading = false;
            console.log('✅ Atendimento registrado com sucesso:', response);

            this.messageService.add({
              severity: 'success',
              summary: 'Atendimento Criado!',
              detail: `Atendimento ${response} registrado com sucesso!`,
            });

            setTimeout(() => {
              this.router.navigate(['/client-contracts', this.clientId]);
            }, 2000);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Falha ao registrar atendimento:', err);

            this.messageService.add({
              severity: 'warn',
              summary: 'Aviso',
              detail:
                'A venda foi criada, mas houve erro ao registrar o atendimento.',
            });

            setTimeout(() => {
              this.router.navigate(['/client-contracts', this.clientId]);
            }, 3000);
          },
        });
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Erro ao converter PDFs para Blob:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao processar os PDFs do contrato.',
        });
      });
  }

  abrirModal(): void {
    this.modalVisible = true;
  }

  goToStep(nextStep: number): void {
  if (this.activeStep === 2 && !this.validateCurrentStep()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios antes de avançar.',
    });
    return;
  }

  if (this.activeStep === 1) this.step1Completed = true;
  if (this.activeStep === 2) this.step2Completed = true;

  this.activeStep = nextStep;

  if (nextStep === 4 && !this.pdfPreviewUrl) {
    this.loadPdfPreview();
  }
}


  async sendToAutentiqueSubmit() {
   if(!this.phone){
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Por favor, insira um número de telefone válido.',
    });
    return;
   }
   if(!this.clientId){
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'ID do cliente não encontrado.',
    });
    return;
   }
  
   const sellerId = this.authService.getSellerId();
   if(!sellerId){
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'ID do vendedor não encontrado.',
    });
    return;
   }

   if (!this.selectedPlan) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Selecione o plano.',
    });
    return;
  }

  this.isLoading = true;

  try{

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
      this.dateUtils.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
      discount: this.contractFormData.discount.toString(),
      discountFixed: this.contractFormData.discountFixed?.toString() || '0',
      
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
      contractDueDay: adesionData.contractDueDay,
      discount: adesionData.discount,
      discountFixed: adesionData.discountFixed,
     
    };
    
    const mappedSigners = [
      {
        name: this.client?.name || 'Cliente',
        phone: '+55' + (this.phone || ''),
      },
    ];

    const payload = {
      sellerId: sellerId,
      adesionData: adesionData,
      permanenceData: permanenceData,
      signers: mappedSigners,
    };

    console.log('Enviando para o Autentique');

    this.actionsContractsService.sendContractSalesAutentique(payload, this.clientId).subscribe({
      next: (res: string) => {
        this.isLoading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
           detail: `${res}. Aguarde o cliente assinar, todo o processo será feito de forma automática.`,
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
  }catch (error) {
    this.isLoading = false;
    console.error('Erro ao enviar para Autentique:', error);

    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao processar envio.',
    });
  }
}

  ngAfterViewInit() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.clearPad();
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

  this.limparPreview?.();
  this.safePdfPreviewUrl = null;
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
      discount: this.contractFormData.discount.toString(),
      discountFixed: this.contractFormData.discountFixed?.toString() || '0',
      contractDueDay:
        this.dateUtils.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
      signatureBase64: null, 
    };
    const mergedPdfBlob = await firstValueFrom(
      this.reportsService.getContractDisplayPdf(this.clientId, contractData)
    );

    if (mergedPdfBlob.type !== 'application/pdf') {
      throw new Error('PDF inválido retornado pelo servidor');
    }

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

  async generateContractWithSignature(signatureBase64: string): Promise<void> {
  if (!this.clientId || this.isLoadingPreview) return;

  this.isLoadingPreview = true;
  this.previewLoadFailed = false;

  try {

    const contractData = {
      clientId: this.clientId,
      codePlanRBX: Number(this.selectedPlan),
      ...this.contractFormData.address,
      complement: this.contractFormData.address.complement || '',
      discount: this.contractFormData.discount.toString(),
      discountFixed: this.contractFormData.discountFixed?.toString() || '0',
      contractDueDay: this.dateUtils.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
      signatureBase64,
    };

    const [adesionBlob, permanenceBlob, mergedSignedBlob] = await firstValueFrom(
      forkJoin([
        this.reportsService.getContractAdesionPdf(this.clientId, contractData),
        this.reportsService.getContractPermanencePdf(this.clientId, contractData),
        this.reportsService.getContractDisplayPdf(this.clientId, contractData),
      ])
    );

    this.rawPdfAdesionUrl = URL.createObjectURL(adesionBlob);
    this.rawPdfPermanentUrl = URL.createObjectURL(permanenceBlob);
    this.safePdfAdesionUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfAdesionUrl);
    this.safePdfPermanentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfPermanentUrl);

if (this.pdfPreviewUrl) URL.revokeObjectURL(this.pdfPreviewUrl);
    this.pdfPreviewUrl = URL.createObjectURL(mergedSignedBlob);
    this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.pdfPreviewUrl
    );

    this.capturedSignatureAdesion = signatureBase64;
    this.capturedSignaturePermanence = signatureBase64;
    this.formData.signaturePad = signatureBase64;
    this.dateSignature = new Date();

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Contratos assinados com sucesso!',
    });

    this.signDialogVisible = false;

  } catch (error) {
    console.error('Erro ao gerar contratos:', error);
    this.previewLoadFailed = true;

    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao gerar contratos.',
    });
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

  this.generateContractWithSignature(signatureBase64);
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
      detail: 'SellerId não encontrado.',
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
    dateStart: this.dateUtils.formatToLocalDateString(this.dateOfStart) || '',
    dateSignature:
      this.dateUtils.formatToLocalDateString(this.dateSignature) ||
      this.dateUtils.formatToLocalDateString(this.dateOfStart) ||
      '',
    dateExpired:
      this.dateUtils.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
    numberParcels: this.selectedInstallment ? Number(this.selectedInstallment) : null,
    adesion: this.contractFormData.adesion ? Number(this.contractFormData.adesion) : null,
    discount: this.contractFormData.discount || 0,
    descountFixe: this.contractFormData.discountFixed?.toString() || '0',
    vigencia: String(this.contractFormData.vigencia || 12),
    cicleFatId: selectedCycle ? Number(selectedCycle.id) : null,
    cicleBillingDayBase: selectedCycle ? Number(selectedCycle.dia) : null,
    cicleBillingExpired: selectedCycle ? Number(selectedCycle.vencimento) : null,
    
    address: {
     ...this.contractFormData.address,
    
    },
    
    observation: this.contractFormData.observation || '',
    signature: this.formData.signaturePad || '',
    residenceType: this.selectedResidence || null,
  };

  this.salesService.archiveSale(payload).subscribe({
    next: (response:any) => {
      this.isArchiving = false;
      this.archivedDraftId = response.draftId;

      console.log('✅ Rascunho arquivado:', response);

      this.messageService.add({
        severity: 'success',
        summary: 'Rascunho Salvo',
        detail: `${response.message}`,
        life: 5000,
      });
    },
    error: (err:any) => {
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


loadDraft(clientId: string | null, draftId: string | undefined): void {
  if (!clientId || !draftId) {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Erro', 
      detail: 'ClientId ou DraftId ausentes.' 
    });
    return;
  }

  this.isLoadingDraft = true;

  this.salesService.getArchivedSaleForConversion(clientId, draftId).subscribe({
    next: (draft: DraftSaleResponse) => {
      this.currentDraftId = draft.draftId;

      Object.assign(this.contractFormData, draft);
      
      this.selectedPlan = draft.codeplan || '';
      this.selectedInstallment = draft.installments || '';
      this.selectDateOfExpirationCicle = draft.expirationCycle || '';
      this.selectContract = draft.contractType || '';

      if (draft.startDate) {
        this.dateOfStart = this.dateUtils.parseDate(draft.startDate);
      }

      if (draft.signatureDate) { 
        this.dateOfAssignment = this.dateUtils.parseDate(draft.signatureDate);
      }

      if (draft.expirationDate) {
        this.dateOfMemberShipExpiration = this.dateUtils.parseDate(draft.expirationDate);
      }

      if (draft.residenceType) {
        this.selectedResidence = draft.residenceType;
      } else {
        this.selectedResidence = ''; 
      }

      this.messageService.add({ 
        severity: 'info', 
        summary: 'Rascunho Carregado', 
        detail: 'Dados preenchidos automaticamente.', 
        life: 5000 
      });
    },
    error: (err) => {
      console.error('❌ Erro ao carregar rascunho:', err);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erro', 
        detail: 'Falha ao carregar rascunho.' 
      });
    },
    complete: () => {
      this.isLoadingDraft = false;
    }
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

processarFotoCapturada(event: Event): void {
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

  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.thumbnailPreview = e.target.result;
    this.fotoCapturadaFile = file;
    this.isPreviewDialogVisible = true;
  };
  reader.readAsDataURL(file);
}

}
