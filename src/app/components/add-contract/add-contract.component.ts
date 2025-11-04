import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
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
import { from } from 'rxjs';

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
  codMunicipio?: string;
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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly cepService = inject(CepService);
  private readonly salesService = inject(SalesService);
  private readonly midiaService = inject(MidiaService);

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
      codMunicipio: '',
    },
    discount: 0,
    signature: '',
    observation: '',
  };

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
  selectedResidence: string | null = null;
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

  constructor(public messageService: MessageService) {}

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
    // Popover do PrimeNG possui toggle/show/hide
    popover.toggle(event);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Encontrar primeiro slot vazio; caso não exista, criar um novo slot
    let targetIndex = this.images.findIndex((img) => img === null);
    if (targetIndex === -1) {
      targetIndex = this.images.length;
      this.images.push(null);
      this.imagePreviews.push(null);
    }

    this.images[targetIndex] = file;

    // Gerar preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews[targetIndex] = reader.result as string;
    };
    reader.readAsDataURL(file);

    // limpar input file (com try/catch dentro do callback)
    setTimeout(() => {
      try {
        if (input && input instanceof HTMLInputElement) {
          // apenas se tiver algo
          if (input.value) {
            // somente string vazia é permitida
            input.value = '';
          }
        }
      } catch (err) {
        // fallback: substitui o nó do input para resetar
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
    // opcional: capturar data de assinatura digital
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

  formatToLocalDateString(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  submitContract(): void {
    // Debug rápido do estado antes das validações
    console.log('[submitContract] estado atual:', {
      selectedPlan: this.selectedPlan,
      selectedInstallment: this.selectedInstallment,
      selectDateOfExpirationCicle: this.selectDateOfExpirationCicle,
      clientIdFromRoute: this.clientId,
      clientIdFromForm: this.contractFormData.clientId,
      selectedResidence: this.selectedResidence,
      dateOfStart: this.dateOfStart,
      dateOfAssignment: this.dateOfAssignment,
      dateSignature: this.dateSignature,
      dateOfMemberShipExpiration: this.dateOfMemberShipExpiration,
    });

    // 1) Validações
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

    if (!this.clientId && !this.contractFormData.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ClientId ausente.',
      });
      return;
    }

    // 2) sellerId (ajuste conforme AuthService real)
    const sellerIdFromAuth =
      this.contractFormData.sellerId && this.contractFormData.sellerId.length > 0
        ? this.contractFormData.sellerId
        : '';

    // 3) Converter datas
    const dateStartLocal = this.formatToLocalDateString(
      this.dateOfStart ?? this.contractFormData.dateStart
    );
    const dateAssignmentLocal = this.formatToLocalDateString(
      this.dateOfAssignment ?? this.contractFormData.dateOfAssignment
    );
    const dateSignatureLocal = this.formatToLocalDateString(
      this.dateSignature ?? this.contractFormData.dateSignature
    );
    const dateExpiredLocal = this.formatToLocalDateString(
      this.dateOfMemberShipExpiration ?? this.contractFormData.dateExpired
    );

    // 4) Montar payload
    const salePayload: any = {
      ...this.contractFormData,
      sellerId: sellerIdFromAuth ?? '',
      clientId: this.contractFormData.clientId || this.clientId || '',
      codePlan: Number(this.selectedPlan),
      numberParcels: Number(this.selectedInstallment),
      dateStart: dateStartLocal ?? null,
      dateOfAssignment: dateAssignmentLocal ?? null,
      dateSignature: dateSignatureLocal ?? null,
      dateExpired: dateExpiredLocal ?? null,
      cicleFatId: Number(selectedCycle.id),
      cicleBillingDayBase: Number(selectedCycle.dia),
      cicleBillingExpired: Number(selectedCycle.vencimento),
      typeResidence: this.selectedResidence,
      signatureBase64: this.formData.signaturePad || null,
      images: [],
    };

    console.log('[submitContract] payload montado:', salePayload);

    // 5) Upload de imagens (se houver) e criação da venda
    const filesToUpload = this.images.filter((i): i is File => !!i);
    if (filesToUpload.length > 0) {
      this.midiaService
        .saveMidias(filesToUpload, salePayload.clientId)
        .subscribe({
          next: (res: any) => {
            const mediaIdsOrUrls = Array.isArray(res)
              ? res.map((r: any) => r.id ?? r.url ?? r)
              : [];
            salePayload.images = mediaIdsOrUrls;

            this.createSaleRequest(salePayload);
          },
          error: (err) => {
            console.error('Erro ao fazer upload das imagens', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Falha ao enviar imagens.',
            });
          },
        });
    } else {
      this.createSaleRequest(salePayload);
    }
  }

  // extrai pra função para reutilizar e logar payload antes de enviar
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
}