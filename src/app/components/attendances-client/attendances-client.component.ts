import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { Attendance } from '../../models/attendance/attendance.dto';
import { DialogModule } from 'primeng/dialog';
import { AttendancesService } from '../../services/attendances/attendance.service';
import { environment } from '../../../environments/environment';
import { PdfViewerDialogComponent } from '../../shared/components/pdf-viewer/pdf-viewer-dialog';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { CheckComponent } from '../../shared/components/check-component/check-component.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-attendances-client',
  standalone: true,
  imports: [
    CommonModule,
    CardBaseComponent,
    ButtonModule,
    TableModule,
    DialogModule,
    PdfViewerDialogComponent,
    PopoverModule,
    FormsModule,
    SelectModule,
    ToastModule,
    CheckComponent,
    ConfirmDialogModule,
  ],
  templateUrl: './attendances-client.component.html',
  styleUrl: './attendances-client.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class AttendancesClientComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private attendancesService = inject(AttendancesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  clientId!: string;
  attendances: Attendance[] = [];
  client: any;
  displayDialog = false;
  tocarCheck = false;

  totalElements = 0;
  selectedStatus: string | null = null;

  selectedAttendance: Attendance = {
    id: '',
    status: '',
    clientName: '',
    sellerName: '',
    openDate: '',
    openHour: '',
    initiative: '',
    mode: '',
    typeClient: '',
    contract: '',
    flow: '',
    type: '',
    topic: '',
    subject: '',
    solution: '',
    codeAttendanceRbx: 0,
    medias: [],
  };

  statusOptions = [
    { label: 'TODOS', value: null },
    { label: 'ABERTO', value: 'OPEN' },
    { label: 'CANCELADO', value: 'CANCELLED' },
    { label: 'FINALIZADO', value: 'COMPLETED' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id;
      this.loadAttendances(0, 5, this.selectedStatus);
    }
  }

  // Método unificado para carregar atendimentos com paginação e filtro
  loadAttendances(page = 0, size = 5, status: string | null = null) {
    this.attendancesService
      .getFilteredAttendances(this.clientId, status, page, size)
      .subscribe({
        next: (res) => {
          this.attendances = res.content;
          this.totalElements = res.totalElements;

          if (this.attendances.length > 0) {
            const first = this.attendances[0];
            this.client = {
              name: first.sellerName,
              contract: first.contract,
              openDate: first.openDate,
              openHour: first.openHour,
              codeAttendanceRbx: first.codeAttendanceRbx,
            };
          }
        },
        error: (err) => console.error('Erro ao carregar atendimentos', err),
      });
  }

  // Paginação da tabela respeitando o filtro atual
  onPageChange(event: any) {
    const page = event.first / event.rows;
    const size = event.rows;
    this.loadAttendances(page, size, this.selectedStatus);
  }

  applyFilters(): void {
    // Sempre carrega a primeira página com o filtro selecionado
    this.loadAttendances(0, 5, this.selectedStatus);
  }

  clearFilters(): void {
    this.selectedStatus = null;
    this.loadAttendances(0, 5, null);
  }

  verDetalhes(att: Attendance) {
    this.attendancesService.getAttendanceDetails(att.id).subscribe({
      next: (res) => {
        this.selectedAttendance = res;
        if (!this.selectedAttendance.medias) {
          this.selectedAttendance.medias = [];
        }
        this.displayDialog = true;
      },
      error: (err) =>
        console.error('Erro ao carregar detalhes do atendimento', err),
    });
  }

  // Dialog PDF
  pdfDialogVisible = false;
  pdfUrl: string | null = null;

  openPdf(filePath: string) {
    const fileName = filePath.split(
      '/home/oai/imagesDocuments/contratosassinados/'
    )[1];
    this.pdfUrl = `${environment.apiUrl}/pdf/${fileName}`;
    this.pdfDialogVisible = true;
  }

  backToClient() {
    this.router.navigate(['info', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['home']);
  }

  confirmCancel(attendance: Attendance) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja cancelar este atendimento?',
      header: 'Confirmar Cancelamento',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary' },

      accept: () => {
        this.cancelAttendance(attendance);
      },
    });
  }

  cancelAttendance(att: Attendance) {
    if (att.status !== 'OPEN') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Somente atendimentos com status OPEN podem ser cancelados.',
      });
      return;
    }

    this.attendancesService.cancelAttendance(att.id).subscribe({
      next: (res) => {
        this.tocarCheck = true;
        setTimeout(() => (this.tocarCheck = false), 10);
        this.loadAttendances();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'danger',
          summary: 'Atenção',
          detail: 'Não foi possível realizar o cancelamento do Atendimento',
        });
      },
    });
  }
}
