import { AttendancesService } from './../../services/attendances/attendance.service';
import { SignaturePadComponent } from './../../shared/components/signature-pad/signature-pad.component';
import { CommonModule } from "@angular/common"
import { type AfterViewInit, Component, type ElementRef, inject, type OnInit, ViewChild } from "@angular/core"
import { DomSanitizer, type SafeResourceUrl } from "@angular/platform-browser"
import { ActivatedRoute, Router } from "@angular/router"
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms"

// 🔹 PrimeNG
import { ButtonModule } from "primeng/button"
import { CalendarModule } from "primeng/calendar"
import { CheckboxModule } from "primeng/checkbox"
import { ConfirmDialogModule } from "primeng/confirmdialog"
import { DialogModule } from "primeng/dialog"
import { DividerModule } from "primeng/divider"
import { InputGroupModule } from "primeng/inputgroup"
import { InputGroupAddonModule } from "primeng/inputgroupaddon"
import { PopoverModule } from "primeng/popover"
import { ProgressSpinnerModule } from "primeng/progressspinner"
import { SelectModule } from "primeng/select"
import { StepperModule } from "primeng/stepper"
import { ToastModule } from "primeng/toast"
import { TooltipModule } from "primeng/tooltip"
import { InputTextModule } from "primeng/inputtext"
import { IftaLabel } from "primeng/iftalabel"

// 🔹 Services and Models
import { ConfirmationService, MessageService } from "primeng/api"
import type { Cliente as ClientData } from "../../models/cliente/cliente.dto"
import type { Contract } from "../../models/contract/contract.dto"
import { ClientService } from "../../services/clients/client.service"
import { ContractsService } from "../../services/contracts/contracts.service"
import { SearchclientService } from "../../services/searchclient/searchclient.service"
import {
  ActionsContractsService,
  type CreateTransferConsentPayload,
} from "../../services/actionsToContract/actions-contracts.service"
import { AuthService } from "../../core/auth.service"

// 🔹 Componente customizado
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component"

// 🔹 Máscara de input
import { NgxMaskDirective } from "ngx-mask"

// 🔹 Biblioteca de assinatura
import SignaturePad from "signature_pad"
import { concatMap } from "rxjs/internal/operators/concatMap"
import { ReportsService } from "../../services/reports/reports.service"
import { TableModule } from 'primeng/table';
import { CheckComponent } from "../../shared/components/check-component/check-component.component";

@Component({
  selector: "app-transfer-ownership",
  standalone: true,
  imports: [
    // 🔹 Angular Core
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // 🔹 PrimeNG
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    DividerModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    IftaLabel,
    PopoverModule,
    ProgressSpinnerModule,
    SelectModule,
    StepperModule,
    ToastModule,
    TooltipModule,
    // 🔹 Máscara de input
    NgxMaskDirective,
    // 🔹 Componente customizado
    CardBaseComponent,
    SignaturePadComponent,
    TableModule,
    CheckComponent
],
  templateUrl: "./transfer-ownership.component.html",
  styleUrl: "./transfer-ownership.component.scss",
  providers: [ConfirmationService, MessageService],
})
export class TransferOwnershipComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;
  @ViewChild("signaturePadOld") signaturePadOld!: SignaturePadComponent;
  @ViewChild("signaturePadNew") signaturePadNew!: SignaturePadComponent;
  @ViewChild("cameraInput") cameraInput!: ElementRef<HTMLInputElement>

  // --- Injeção de Dependências ---
  private readonly messageService = inject(MessageService)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly contractService = inject(ContractsService)
  private readonly searchclientService = inject(SearchclientService)
  private readonly clientService = inject(ClientService)
  private readonly attendancesService = inject(AttendancesService)
  private readonly fb = inject(FormBuilder)
  private readonly actionsContractsService = inject(ActionsContractsService)
  private readonly sanitizer = inject(DomSanitizer)
  private readonly authService = inject(AuthService)
  private readonly reportsService = inject(ReportsService)

  clientId!: string
  contractId!: string
  toNewContractId!: string;
  toNewClientId!: string;
  phoneOldOwner!: string
  phoneNewOwner!: string
  contracts: Contract[] = []
  currentClient: ClientData | null = null
  isLoading = false

  selectedContractForTransfer: Contract | null = null
  isLoadingTransfer = false
  loadingMessage = ""
  documento = ""
  foundClient: { id: string; name: string } | null = null

  activeStep = 1

  pdfSrc: any
  isLoadingPdf = false
  consentAgreed = false
  autentiqueModalVisible = false

  capturedSignature: string | null = null;
  oldClientSignature: string | null = null;
  newClientSignature: string | null = null;

  signatureVisibleFlag = false;
  pdfDialogVisible = false;

  signatureOldBase64: string | null = null
  signatureNewBase64: string | null = null
  dialogAssinaturaCedente = false
  dialogAssinaturaCessionario = false
  isLoadingPreview = false
  previewLoadFailed = false
  safePdfPreviewUrl: SafeResourceUrl | null = null
  pdfPreviewUrl: string | null = null
  signDialogVisible = false;
  fotoCapturadaFile: File | null = null;
  isPreviewDialogVisible: boolean = false;
  thumbnailPreview: string | ArrayBuffer | null = null;
  event: string = "transfer_contract";

  finalization: boolean = false;
  result: any;
  tocarCheck: boolean = false;
  createNewClient: boolean = false;

  showPhoneDialog: boolean = false;
  phone: string = '';

  ngOnInit() {
    const clientId = this.route.snapshot.paramMap.get("clientId")
    const contractId = this.route.snapshot.paramMap.get("contractId")

    if (clientId && contractId) {
      this.clientId = clientId
      this.contractId = contractId
      this.loadInitialData(clientId, contractId)
    } else {
      this.isLoading = false
      this.showError("Erro Crítico", "Faltam os IDs do cliente ou do contrato na URL.")
    }
  }

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.canvas.nativeElement, {
      penColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgba(0, 0, 0, 0)'
    })
  }

  loadInitialData(clientId: string, contractId: string): void {
    this.isLoading = true
    this.loadingMessage = "A carregar dados do cliente e contrato..."

    this.clientService.getClientById(clientId).subscribe((client) => {
      this.currentClient = client
    })
    this.contractService.getContractById(contractId).subscribe((contract) => {
      this.selectedContractForTransfer = contract
      this.isLoading = false
    })
  }

  voltarParaCliente() {
    this.router.navigate(["/client-contracts", this.clientId])
  }

  // --- MÉTODOS DO FLUXO DE TRANSFERÊNCIA DE TITULARIDADE ---
  onSearchNewOwner(): void {
    const documentoParaBuscar = this.documento.replace(/\D/g, "")
    if (documentoParaBuscar.length < 11) {
      this.showWarning("Atenção", "Por favor, preencha o documento completo.")
      return
    }
    if (this.isTransferringToSameOwner(documentoParaBuscar)) {
      this.showWarning("Operação Inválida", "Não é possível transferir um contrato para o mesmo titular.")
      return
    }
    this.isLoadingTransfer = true
    this.loadingMessage = "A procurar e a sincronizar o cliente..."
    this.searchclientService.searchAndRegisterClient(documentoParaBuscar).subscribe({
      next: (response) => {
        this.isLoadingTransfer = false
        const client = response?.client
        console.log("--- DEBUG: RESPOSTA DA API ---")
        console.log("Objeto 'client' recebido:", client)
        if (client?.id) {
          const clientName = client?.name || client?.socialName || client?.fantasyName
          this.foundClient = { id: client.id, name: clientName }
          this.showInfo("Cliente Localizado", `O cliente ${clientName} está pronto para a transferência.`)
        } else {
          this.foundClient = null;
          this.createNewClient = true;
          this.showWarning(
            "Cliente não encontrado",
            "Nenhum cliente foi encontrado com este documento. Pode registá-lo.",
          )
        }
      },
      error: (err) => {
        this.isLoadingTransfer = false
        this.showError("Erro na Procura", err.error?.message || "Não foi possível procurar o cliente.")
      },
    })
  }

  private registerAttendance(pdfBlob: Blob): void {
    if (!this.clientId || !this.contractId) {
      console.error("registerAttendance: ClientID ou ContractID estão ausentes.");
      return;
    }
    if (!this.toNewClientId || !this.toNewContractId) {
      console.error("registerAttendance: newClientId ou newContractId ausentes.");
      return;
    }

    const data = {
      event: this.event as string,
      cliente: this.clientId,
      contrato: this.contractId,
      toNewClient: this.toNewClientId,
      toNewContract: this.toNewContractId
    };

    const formData = new FormData();
    formData.append("arquivo", pdfBlob, "transferencia_titularidade_asssinado.pdf");
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    this.attendancesService.registerAttendance(formData).subscribe({
      next: (response) => {
        this.showInfo(
          "Registro de Atendimento",
          "Atendimento registrado com sucesso no sistema."
        );
      },
      error: (err) => {
        console.error("Falha ao registrar atendimento:", err);
        this.showWarning(
          "Aviso",
          "A operação concluiu, mas houve erro ao registrar o atendimento."
        );
      }
    });
  }

  onConfirmTransfer(): void {
    const signatureOldData = this.signatureOldBase64
    const signatureNewData = this.signatureNewBase64

    if (!signatureOldData || signatureOldData.length <= 22) {
      this.showWarning("Ação Bloqueada", "A assinatura do titular antigo está vazia ou inválida.")
      return
    }

    if (!signatureNewData || signatureNewData.length <= 22) {
      this.showWarning("Ação Bloqueada", "A assinatura do novo titular está vazia ou inválida.")
      return
    }

    if (!this.selectedContractForTransfer || !this.foundClient) {
      this.showError("Erro de Dados", "Dados do contrato ou do novo titular ausentes.")
      return
    }

    this.isLoadingTransfer = true
    this.loadingMessage = "A processar a transferência de negócio..."

    const oldContractId = this.selectedContractForTransfer.id
    const newClientId = this.foundClient.id

    const payloadWhats = {
      newClientId: newClientId,
      phone2: this.phone
    }

    const signPayload = {
      oldContractId: oldContractId,
      newClientId: newClientId,
      signatureOld: signatureOldData,
      signatureNew: signatureNewData,
    }

    this.contractService
      .transferOwnership(oldContractId, payloadWhats)
      .pipe(
        concatMap((responseTransfer) => {
          this.toNewContractId = responseTransfer.id;
          this.toNewClientId = newClientId;
          this.loadingMessage = "A carimbar assinaturas no PDF final..."
          return this.contractService.finalizeAndSignTransfer(signPayload)
        }),

      )
      .subscribe({
        next: (signedPdfBlob: Blob) => {
          if (this.pdfSrc) {
            const oldUrl = this.pdfSrc.changingThisBreaksApplicationSecurity || this.pdfSrc
            if (typeof oldUrl === "string" && oldUrl.startsWith("blob:")) {
              URL.revokeObjectURL(oldUrl)
            }
          }

          const objectUrl = URL.createObjectURL(signedPdfBlob)
          this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl)

          this.activeStep = 4

          this.showSuccess("Sucesso!", "A transferência foi concluída e o PDF assinado.", 10000)
          this.isLoadingTransfer = false;
          this.result = {
            clientOldName: this.currentClient?.name,
            clientOldCpfCnpj: this.currentClient?.cpf || this.currentClient?.cnpj,
            oldContractCode: this.selectedContractForTransfer?.codeContractRbx,
            clientNewName: this.foundClient?.name
          };
          this.tocarCheck = true;
          this.signatureOldBase64 = null;
          this.signatureNewBase64 = null;
          this.finalization = true;

          this.registerAttendance(signedPdfBlob);
        },
        error: (err) => {
          const backendMessage =
            typeof err.error === "string" ? err.error : err.error?.message || "Não foi possível concluir a operação."

          this.showError(
            "Erro na Operação",
            `${backendMessage} (Verifique o contrato, a transferência pode ter sido concluída mesmo sem o PDF.)`,
            10000,
          )
          this.isLoadingTransfer = false

          this.activeStep = 1
        },
      })
  }

    openPhoneModal() {
    this.phone = '';
    this.showPhoneDialog = true;
  }

  confirmSendToClient() {
    this.showPhoneDialog = false;
    this.onConfirmTransfer();
  }

  triggerCameraInput(): void {
    if (this.cameraInput && this.cameraInput.nativeElement) {
      this.cameraInput.nativeElement.click()
    } else {
      this.showError("Erro", "O campo de captura de foto não foi inicializado.")
    }
  }

  // --- MÉTODOS PARA O MODAL AUTENTIQUE ---
  abrirModalAutentique(): void {
    this.autentiqueModalVisible = true
    this.phoneOldOwner = ""
    this.phoneNewOwner = ""
  }

  fecharModalAutentique(): void {
    this.autentiqueModalVisible = false
  }

  sendToAutentiqueSubmit(): void {
    if (!this.currentClient || !this.foundClient || !this.selectedContractForTransfer) {
      this.showError("Erro de Dados", "Não foi possível obter os dados completos dos titulares ou do contrato.")
      return
    }

    const sellerIdNumber = this.authService.getSellerId()
    if (!sellerIdNumber) {
      this.showError("Erro de Autenticação", "Não foi possível identificar o vendedor logado.")
      return
    }
    const sellerId: string = sellerIdNumber.toString()

    const payload: CreateTransferConsentPayload = {
      sellerId: sellerId,
      newClientId: this.foundClient.id,
      signers: [
        {
          name: this.currentClient.name || "",
          phone: "+55" + (this.phoneOldOwner || "").replace(/\D/g, ""),
        },
        {
          name: this.foundClient.name || "",
          phone: "+55" + (this.phoneNewOwner || "").replace(/\D/g, ""),
        },
      ],
    }

    this.isLoadingTransfer = true
    this.loadingMessage = "A enviar documento para assinatura..."
    this.fecharModalAutentique()

    this.actionsContractsService
      .sendTransferConsentAutentique(payload, this.clientId, this.selectedContractForTransfer.id)
      .subscribe({
        next: (res: string) => {
          this.isLoadingTransfer = false

          this.showSuccess("Sucesso!", res, 10000)

          this.activeStep = 4
        },
        error: (err) => {
          this.isLoadingTransfer = false

          const backendMessage =
            typeof err.error === "string"
              ? err.error
              : err?.error?.message || "Erro ao tentar enviar. Verifique com o Suporte!"

          this.showError("Erro no Envio", backendMessage, 10000)
        },
      })
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

  savePdf(): void {
    const pdfUrl = this.pdfPreviewUrl;
    if (!pdfUrl) {
      this.showWarning("Nenhum PDF", "Nenhum documento foi carregado para salvar.");
      return;
    }

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "termo_transferencia.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.showInfo("Download iniciado", "O termo de transferência está sendo baixado.");
  }


  goToPdfViewerStep(): void {
    if (!this.selectedContractForTransfer || !this.foundClient) {
      this.showWarning("Atenção", "Você precisa buscar e selecionar o novo titular antes de continuar.")
      return
    }

    this.activeStep = 3
    this.loadingMessage = "A carregar termo de transferência..."
    this.loadTransferPdf(this.selectedContractForTransfer.id, this.foundClient.id, "safePdfPreviewUrl")
  }

  loadPdfPreview(): void {
    if (!this.selectedContractForTransfer || !this.foundClient) {
      this.showWarning("Atenção", "Selecione o contrato e o cliente antes de tentar novamente.")
      return
    }

    this.loadingMessage = "A recarregar preview do PDF..."
    this.loadTransferPdf(this.selectedContractForTransfer.id, this.foundClient.id, "safePdfPreviewUrl")
  }

  private loadTransferPdf(
    oldContractId: string,
    newClientId: string,
    target: "pdfSrc" | "safePdfPreviewUrl" = "pdfSrc",
  ): void {
    this.isLoadingPdf = true
    this.loadingMessage = "A gerar termo de transferência..."

    this.contractService.getTransferConsentPdf(oldContractId, newClientId).subscribe({
      next: (pdfBlob: Blob) => {
        if (target === "safePdfPreviewUrl" && this.pdfPreviewUrl) {
          URL.revokeObjectURL(this.pdfPreviewUrl)
          this.pdfPreviewUrl = null
        }

        const objectUrl = URL.createObjectURL(pdfBlob)

        if (target === "safePdfPreviewUrl") {
          this.pdfPreviewUrl = objectUrl
        }
        ; (this as any)[target] = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl)
        this.isLoadingPdf = false
      },
      error: (err) => {
        const errorMessage = err.error?.message || "Falha ao gerar termo."
        this.showError("Erro ao Gerar PDF", errorMessage, 10000)
        this.isLoadingPdf = false
        this.previewLoadFailed = true
      },
    })
  }

  // --- MÉTODOS DE NAVEGAÇÃO E UTILITÁRIOS ---

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber

    if (stepNumber === 3 && !this.safePdfPreviewUrl) {
      this.loadPdfPreview()
    }
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(["info", this.clientId])
    } else {
      this.router.navigate(["/"])
    }
  }

  navigateToCreateClient() {
    this.router.navigate(["/register"])
  }

  public get arePhonesInvalid(): boolean {
    const cleanPhoneOld = (this.phoneOldOwner || "").replace(/\D/g, "")
    const cleanPhoneNew = (this.phoneNewOwner || "").replace(/\D/g, "")
    return cleanPhoneOld.length < 10 || cleanPhoneNew.length < 10
  }

  private isTransferringToSameOwner(documentoParaBuscar: string): boolean {
    if (!this.currentClient) return false
    const isInputCpf = documentoParaBuscar.length === 11
    const cpfAtual = this.currentClient.cpf?.replace(/\D/g, "")
    const cnpjAtual = this.currentClient.cnpj?.replace(/\D/g, "")
    return (isInputCpf && cpfAtual === documentoParaBuscar) || (!isInputCpf && cnpjAtual === documentoParaBuscar)
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    if (
      !/^\d$/.test(event.key) &&
      !["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab", "Enter"].includes(event.key)
    ) {
      event.preventDefault()
    }
  }

  formatarDocumento(value: string): void {
    if (!value) {
      this.documento = ""
      return
    }
    const unformattedValue = value.replace(/\D/g, "").substring(0, 14)
    if (unformattedValue.length <= 11) {
      this.documento = unformattedValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      this.documento = unformattedValue
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault()
    const pastedText = event.clipboardData?.getData("text/plain") || ""
    setTimeout(() => this.formatarDocumento(pastedText), 0)
  }

  private showSuccess(summary: string, detail: string, life = 3000) {
    this.messageService.add({ severity: "success", summary, detail, life })
  }

  private showError(summary: string, detail: string, life = 10000) {
    this.messageService.add({ severity: "error", summary, detail, life })
  }

  private showWarning(summary: string, detail: string, life = 5000) {
    this.messageService.add({ severity: "warn", summary, detail, life })
  }

  private showInfo(summary: string, detail: string, life = 3000) {
    this.messageService.add({ severity: "info", summary, detail, life })
  }

  // metodos de assinatura
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

  captureAndGenerate() {
    if (!this.signaturePadNew) {
      this.showError('Erro', 'Pad de assinatura não encontrado.');
      return;
    }

    const newSignature = this.signaturePadNew.getSignatureAsBase64?.();
    if (!newSignature) {
      this.showError('Atenção', 'Por favor, assine o termo antes de gerar o PDF.');
      return;
    }

    this.newClientSignature = newSignature;
    this.signatureNewBase64 = newSignature;

    if (!this.oldClientSignature) {
      this.showError('Atenção', 'Assinatura do cedente não encontrada. Refaça o processo.');
      return;
    }

    this.dialogAssinaturaCessionario = false;
    this.generateConsentTermWithSignature();
  }

  generateConsentTermWithSignature() {
    if (!this.oldClientSignature || !this.newClientSignature) {
      this.showError('Atenção', 'Ambas as assinaturas são obrigatórias.');
      return;
    }

    if (this.isLoadingPreview) return;

    console.log('Gerando termo final com assinaturas...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const requestBody = {
      oldContractId: this.contractId,
      newClientId: this.clientId,
      signatureOld: this.oldClientSignature,
      signatureNew: this.newClientSignature
    };

    console.log("Enviando para o backend:", requestBody);
    console.log("Tipo do oldContractId:", typeof this.contractId);
    console.log("Tipo do newClientId:", typeof this.clientId);

    this.reportsService.finalizeTransferAndSign(requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
          this.showSuccess('Sucesso', 'Termo de transferência assinado gerado com sucesso!');
          this.dialogAssinaturaCedente = false;
          this.dialogAssinaturaCessionario = false;
        },
        error: (err) => {
          console.error('Erro ao gerar termo assinado:', err);
          this.showError('Erro', 'Falha ao gerar o termo final com assinatura.');
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        },
      });
  }

  confirmOldSignature() {
    if (!this.signaturePadOld) {
      this.showError('Erro', 'Pad de assinatura não encontrado.');
      return;
    }

    const signature = this.signaturePadOld.getSignatureAsBase64?.();
    if (!signature) {
      this.showError('Atenção', 'Por favor, realize a assinatura antes de prosseguir.');
      return;
    }

    this.oldClientSignature = signature;
    this.signatureOldBase64 = signature;

    this.dialogAssinaturaCedente = false;

    setTimeout(() => {
      this.dialogAssinaturaCessionario = true;
    }, 300);
  }

  abrirAssinatura(): void {
    this.dialogAssinaturaCedente = true;
    this.signatureVisibleFlag = true;
  }

  formatCpfCnpj(value: string | null | undefined): string {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");

    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5");
    }

    return value;
  }
}
