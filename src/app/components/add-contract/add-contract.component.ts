import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { FormsModule, NgForm,  NgModelGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
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
import { AuthService } from '../../core/auth.service';
import { ConsentTermAdesionRequest, ReportsService } from '../../services/reports/reports.service';


export interface ContractFormData {
  salesId?: number;
  sellerId: string;
  clientId: string;
  codePlan: number;
  dateStart: string;
  dateSignature: string;
  dateOfAssignment?: string;
  dateExpired: string;
  adesion: number;
  numberParcels: number;
  parcels: Parcel[];
  address: Address;
  discount: number;
  signature: string;
  imagesOne?: string;
  observation?: string;
  situationDescription?: string;
  descountFixe?: number;
  vigencia?: number;
  cicleFatId?: number;
  cicleBillingDayBase?: number;
  cicleBillingExpired?: number;
}

export interface Parcel {
  description: string;
  dueDate: string;
  price: number;
}

export interface Address {
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  type?: string;
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
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
  providers: [MessageService],
})
export class AddContractComponent implements OnInit {
  @ViewChild('pop') pop!: Popover;



 @ViewChild('contractForm') contractForm!: NgForm;
  @ViewChild('step1Group') step1Group!: NgModelGroup;
  @ViewChild('step2Group') step2Group!: NgModelGroup;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly cepService = inject(CepService);
  private readonly salesService = inject(SalesService);
  private readonly midiaService = inject(MidiaService);
  private readonly authService = inject(AuthService);
  private readonly reportsService = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);
 

   modalVisible: boolean = false;
  phone: string = '';

  onHide(): void {
    this.modalVisible = false;
    this.phone = '';
  }

  pdfUrl: SafeResourceUrl | null = null;
  isLoading = false;

  public activeStep: number = 1;

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
  };

  // Flags para controlar se cada step foi completado
step1Completed: boolean = false;
step2Completed: boolean = false;


 // ✅ Getters de validação
  get isStep1Valid(): boolean {
    return this.step1Group?.valid ?? false;
  }

  get isStep2Valid(): boolean {
    return this.step2Group?.valid ?? false;
  }

  get areSteps1And2Valid(): boolean {
    return this.isStep1Valid && this.isStep2Valid;
  }

  clientId: string | null = null;

  // Datas no template como Date; converteremos no submit
  dateSignature: Date | null = null; // opcional
  dateOfStart: Date | null = null;
  dateOfAssignment: Date | null = null;
  dateOfMemberShipExpiration: Date | null = null;

  formData = {
    signaturePad: '',
  };

  // Google Maps
  showMapDialog = false;
  center: google.maps.LatLngLiteral = { lat: -23.55052, lng: -46.633308 };
  zoom = 15;

  // Dropdowns e selects
  selectContract: string | null = null;
  selectedPlan: string | null = null;
  selectedInstallment: string | null = null;
  selectDateOfExpirationCicle: string | null = null;
  selectedResidence: Address | null = null;
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
    descricao: `${(i + 1).toString().padStart(2, '0')} a ${(i % 31 + 1)
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

  // Imagens
  images: (File | null)[] = [null, null, null];
  imagePreviews: (string | null)[] = [null, null, null];
  previewVisible = false;
  previewImage: string | null = null;

  constructor(public messageService: MessageService) {
     this.clientId = this.route.snapshot.queryParamMap.get('clientId') ?? '';
  }

  ngOnInit(): void {
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
          value: plan.codePlanRBX.toString(),
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

    setTimeout(() => {
      try {
        if (input && input instanceof HTMLInputElement) {

          if (input.value) {

            input.value = '';
          }
        }
      } catch (err) {

        try {
          const newInput = input.cloneNode() as HTMLInputElement;
          input.parentNode?.replaceChild(newInput, input);
        } catch (innerErr) {
          console.warn('Falha ao limpar input file:', innerErr);
        }
      }
    }, 0);
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

  formatToLocalDateString(
    date: Date | string | null | undefined
    ): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
     const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  submitContract(): void {
    if(!this.contractForm.valid) {
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

  // Validar ciclo e plano
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
  dateStart: this.formatToLocalDateString(this.dateOfStart) || '',
  dateSignature: this.formatToLocalDateString(this.dateSignature) || this.formatToLocalDateString(this.dateOfStart) || '',
  dateExpired: this.formatToLocalDateString(this.dateOfMemberShipExpiration) || '',
  numberParcels: Number(this.selectedInstallment),
  adesion: Number(this.contractFormData.adesion) || 100.00,
  discount: 900.00,
  descountFixe: "35.00",
  address: {
    street: this.contractFormData.address.street || '',
    number: this.contractFormData.address.number || '',
    neighborhood: this.contractFormData.address.neighborhood || '',
    city: this.contractFormData.address.city || '',
    state: this.contractFormData.address.state || '',
    zipCode: this.contractFormData.address.zipCode || '',
    complement: this.contractFormData.address.complement || ''
  },
  signature: this.formData.signaturePad || '',
  imagesOne: this.images[0] ? URL.createObjectURL(this.images[0]) : '',
  observation: this.contractFormData.observation || '',
  vigencia: String(this.contractFormData.vigencia || 12),
  cicleFatId: Number(selectedCycle.id),
  cicleBillingDayBase: Number(selectedCycle.dia),
  cicleBillingExpired: Number(selectedCycle.vencimento)
};

  console.log(JSON.stringify(payload, null, 2));


  console.log('Payload final para envio:', payload);

  this.salesService.createSale(payload).subscribe({
    next: (res) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Contrato Criado',
        detail: 'O contrato foi criado com sucesso.',
      });
      console.log('Resposta createSale:', res);
    },
    error: (err) => {
      console.error('Erro na criação da venda:', err);
      const detail = err?.error?.message ?? 'Erro ao criar a venda.';
      this.messageService.add({ severity: 'error', summary: 'Erro', detail });
    },
  });
}



  private createSaleRequest(payload: any) {
    console.log('Payload pra enviar:', payload);
    this.salesService.createSale(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Contrato Criado',
          detail: 'O contrato foi criado com sucesso.',
        });
        console.log('Resposta createSale:', res);
      },
      error: (err) => {
        console.error('Erro na criação da venda:', err);
        const detail = err?.error?.message ?? 'Erro ao criar a venda.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      },
    });
  }

  avisoInvalido: boolean = true;

  abrirModal(): void {
   this.modalVisible = true;
  }

  goToStep(nextStep: number){
    let currentGroup: NgModelGroup | null = null;

    if(this.activeStep === 1) {
      currentGroup = this.step1Group;
    } else if (this.activeStep === 2) {
      currentGroup = this.step2Group;
  }

  if(currentGroup){
    Object.values(currentGroup.control.controls).forEach(control => {
      control.markAsTouched();
    });

     // Aguarda ciclo de detecção
    setTimeout(() => {
      if (currentGroup!.valid) {
        // Marca step como completo
        if (this.activeStep === 1) {
          this.step1Completed = true;
        } else if (this.activeStep === 2) {
          this.step2Completed = true;
        }
        
        // Navega
        this.activeStep = nextStep;
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Campos obrigatórios',
          detail: 'Preencha corretamente antes de avançar.',
        });
      }
    });
  } else {
    // Steps sem validação (como step 3) navegam diretamente
    this.activeStep = nextStep;
  }
  }


  sendToAutentiqueSubmit() {
    //   const term: ConsentTermAddressRequest = {
    //     zipCode: this.addressNewForm.zipCode,
    //     state: this.addressNewForm.uf,
    //     city: this.addressNewForm.city,
    //     street: this.addressNewForm.street,
    //     number: this.addressNewForm.numberFromHome,
    //     neighborhood: this.addressNewForm.neighborhood,
    //     complement: this.addressNewForm.complement,
    //     observation: this.addressNewForm.observation,
    //     adesionValue: this.addressNewForm.adesionValue,
    //     paymentForm: this.addressNewForm.paymentForm,
    //   };
  
    //   const mappedSigners = [
    //     {
    //       name: this.client?.name || 'Cliente',
    //       phone: '+55' + (this.phone || ''),
    //     },
    //   ];
  
    //   const payload = { term, signers: mappedSigners };
  
    //   this.actionsContractsService
    //     .sendAddressChangeAutentique(payload, this.clientId, this.contractId)
    //     .subscribe({
    //       next: (res: string) => {
    //         this.messageService.add({
    //           severity: 'success',
    //           summary: 'Sucesso!',
    //           detail: `${res}.
    //           Aguarde o cliente assinar, todo o processo será feito de forma automática.
    //           Consulte nos atendimentos do cliente se foi feito de fato.`,
    //           life: 10000,
    //         });
    //         this.modalVisible = false;
    //       },
    //       error: (err) => {
    //         const backendMessage =
    //           (typeof err.error === 'string' ? err.error : err?.error?.message) ||
    //           'Erro ao tentar enviar para o número, verifique com o Suporte!';
    //         if (backendMessage.includes('Aguarde 4 minutos antes')) {
    //           this.messageService.add({
    //             severity: 'error',
    //             summary: 'Atenção',
    //             detail: backendMessage,
    //           });
    //         }
    //       },
    //     });
    // }
}
}