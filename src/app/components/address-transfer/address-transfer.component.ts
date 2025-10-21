import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
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

import { SignaturePadComponent } from '../signature-pad/signature-pad.component';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { PdfViewerModule } from 'ng2-pdf-viewer';

export interface AddressForm {
  cep: string | null;
  street: string;
  numberFromHome: string | null;
  complement: string;
  uf: string;
  neighborhood: string;
  city: string;
  observation: string;
  adesionValue: number | null;
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
    PdfViewerModule

  ],
  providers: [MessageService],
  templateUrl: './address-transfer.component.html',
  styleUrls: ['./address-transfer.component.scss'],
})
export class AddressTransferComponent implements OnInit, OnDestroy{
  addressNewFormValid = false;
  contract!: Contract;
  client!: Cliente;

  modalVisible: boolean = false;
 signatureVisibleFlag = false;

  phone: string = '';
  formIsValid: boolean = false;

  @ViewChild('addressNewNgForm') addressNewNgForm!: NgForm;
  @ViewChild(SignaturePadComponent) signaturePadComponent!: SignaturePadComponent;
  @ViewChild('signaturePadInDialog') signaturePadInDialog!: SignaturePadComponent;


  capturedSignature: string | null = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractsService = inject(ContractsService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly reportsService = inject(ReportsService);
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

  public addressNewForm: AddressForm = {
    cep: null,
    street: '',
    numberFromHome: null,
    complement: '',
    uf: '',
    neighborhood: '',
    city: '',
    observation: '',
    adesionValue: null,
  };

  public paymentForm = {
    title: '',
    dueDate: '',
    price: '',
  };

  constructor(
    private cepService: CepService,
    private sanitizer: DomSanitizer
  ) {
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
    if(this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
    }
  }

  loadPdfPreview(): void {
    if(this.isLoadingPreview) return;

    console.log('Carregando preview do PDF...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if(this.pdfPreviewUrl){
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const requestBody: ConsentTermAddressRequest = {
      zipCode: this.addressNewForm.cep ?? '',
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome ?? '',
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue ?? 0,
    };
    this.reportsService.getConsentTermAddressPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
          console.log('Preview carregado no iframe.');
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.messageService.add({
             severity: 'error',
             summary: 'Erro no Preview',
             detail: 'Não foi possível carregar o termo. Tente novamente.'
          });
          this.previewLoadFailed = true; // Sinaliza que falhou
          this.isLoadingPreview = false;
        }
      });
  }

  sendToAutomation(): void {
    if (!this.currentContract) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Dados do contrato original não encontrados!',
      });
      return;
    }

    this.isLoading = true;

    const sellerIdFromAuth = this.authService.getSellerId();

    const payload = {
      clientId: this.currentContract.clientId,
      sellerId: sellerIdFromAuth!.toString(),
      contractNumber: this.currentContract.codeContractRbx,
      newZip: this.addressNewForm.cep,
      newNumber: this.addressNewForm.numberFromHome,
      newComplement: this.addressNewForm.complement,
      newState: this.ufToNome(this.addressNewForm.uf),
      newCity: this.addressNewForm.city,
      newStreet: this.addressNewForm.street,
      newNeighborhood: this.addressNewForm.neighborhood,
      observation: this.addressNewForm.observation || null,
    };

    console.log('Payload enviado:', payload);

    console.log('UF digitado:', this.addressNewForm.uf);
    console.log('Nome convertido:', this.ufToNome(this.addressNewForm.uf));
    this.contractsService.changeAddressContract(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso!',
          detail: 'Automação iniciada!',
        });
        this.router.navigate([
          '/client-contracts',
          this.currentContract?.clientId,
        ]);
      },
      error: (err) => {
        this.isLoading = false;
        const detailMessage =
          err?.error?.message || 'Falha ao iniciar a automação.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: detailMessage,
        });
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

  ufToNome(uf: string): string {
    const mapa: Record<string, string> = {
      AC: 'Acre',
      AL: 'Alagoas',
      AP: 'Amapá',
      AM: 'Amazonas',
      BA: 'Bahia',
      CE: 'Ceará',
      DF: 'Distrito Federal',
      ES: 'Espírito Santo',
      GO: 'Goiás',
      MA: 'Maranhão',
      MT: 'Mato Grosso',
      MS: 'Mato Grosso do Sul',
      MG: 'Minas Gerais',
      PA: 'Pará',
      PB: 'Paraíba',
      PR: 'Paraná',
      PE: 'Pernambuco',
      PI: 'Piauí',
      RJ: 'Rio de Janeiro',
      RN: 'Rio Grande do Norte',
      RS: 'Rio Grande do Sul',
      RO: 'Rondônia',
      RR: 'Roraima',
      SC: 'Santa Catarina',
      SP: 'São Paulo',
      SE: 'Sergipe',
      TO: 'Tocantins',
    };
    return mapa[uf] || uf;
  }

  searchCEP(): void {
    if (!this.addressNewForm.cep) return;
    this.cepService
      .searchCEP(this.addressNewForm.cep)
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
      zipCode: this.addressNewForm.cep,
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome,
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue,
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
    const term = {
      newAddress: true,
      cep: this.addressNewForm.cep,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome,
      complement: this.addressNewForm.complement,
      city: this.addressNewForm.city,
      state: this.addressNewForm.uf,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue,
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
  this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Assinatura capturada!' });
}

savePad() {
    this.signaturePadComponent.savePad(); 
  }

  generateConsentTermWithSignature() {
    if (!this.capturedSignature) {
      alert('Capture a assinatura antes de gerar o termo.');
      return;
    }
    if (this.isLoadingPreview) return

    console.log('Gerando termo com assinatura...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if(this.pdfPreviewUrl){
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const requestBody = {
      zipCode: this.addressNewForm.cep ?? '',
      state: this.addressNewForm.uf,
      city: this.addressNewForm.city,
      street: this.addressNewForm.street,
      number: this.addressNewForm.numberFromHome ?? '',
      neighborhood: this.addressNewForm.neighborhood,
      complement: this.addressNewForm.complement,
      observation: this.addressNewForm.observation,
      adesionValue: this.addressNewForm.adesionValue ?? 0,
      signatureBase64: this.capturedSignature,
    };

    this.reportsService.getConsentTermAddressPdf (this.clientId, this.contractId, requestBody).subscribe({
      next:(blob) => {
        this.pdfPreviewUrl = window.URL.createObjectURL(blob);
        this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
        this.isLoadingPreview = false;
        console.log('Termo com assinatura carregado no iframe.');
        this.messageService.add({severity: 'success', summary: 'Sucesso', detail: 'Termo com assinatura gerado!' });
        this.signDialogVisible = false;
      },
      error: (err) => {
        console.error('Erro ao gerar termo com assinatura:', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar o termo final com assinatura.' });
          this.previewLoadFailed = true; 
          this.isLoadingPreview = false;
      }
    });
  }

  forceSignatureRedraw() {
    // força o Angular a recriar o componente após o dialog estar visível
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
  this.signatureVisibleFlag = true; // <<< ESSA LINHA É NECESSÁRIA
}
}

