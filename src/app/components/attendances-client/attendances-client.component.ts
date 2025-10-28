import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { Attendance } from '../../models/attendance/attendance.dto';
import { DialogModule } from 'primeng/dialog';
import { AttendancesService } from '../../services/attendances/attendance.service';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { PdfViewerDialogComponent } from '../../shared/components/pdf-viewer/pdf-viewer-dialog';

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
  ],
  templateUrl: './attendances-client.component.html',
  styleUrl: './attendances-client.component.scss',
})
export class AttendancesClientComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private attendancesService = inject(AttendancesService);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  clientId!: string;
  attendances: Attendance[] = [];
  client: any;
  displayDialog = false;

  totalElements = 0;

  selectedAttendance: Attendance = {
    id: '',
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
    codeAttendanceRbx: 0,
    medias: [], // array vazio garante que não será undefined
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id;
      this.loadAttendances(0, 5);
    }
  }

  loadAttendances(page = 0, size = 5) {
    this.attendancesService
      .getAttendances(this.clientId, page, size)
      .subscribe({
        next: (res) => {
          this.attendances = res.content;
          this.totalElements = res.totalElements; // <- informa ao PrimeNG quantos registros existem

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

  // Evento chamado pelo paginator do PrimeNG
  onPageChange(event: any) {
    const page = event.first / event.rows; // calcula o número da página
    const size = event.rows;
    this.loadAttendances(page, size);
  }

  backToClient() {
    this.router.navigate(['info', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['home']);
  }

  verDetalhes(att: Attendance) {
    // Chamar API para pegar detalhes completos, incluindo mídias
    this.attendancesService.getAttendanceDetails(att.id).subscribe({
      next: (res) => {
        console.log('Detalhes do atendimento:', res.medias);
        this.selectedAttendance = res;

        if (!this.selectedAttendance.medias) {
          this.selectedAttendance.medias = [];
        }

        this.displayDialog = true;
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes do atendimento', err);
      },
    });
  }

  // Variáveis para o dialog do PDF
  pdfDialogVisible = false;
  pdfUrl: string | null = null;

  openPdf(filePath: string) {
    const fileName = filePath.split(
      '/home/oai/imagesDocuments/contratosassinados/'
    )[1];
    this.pdfUrl = `${environment.apiUrl}/pdf/${fileName}`;
    this.pdfDialogVisible = true;
  }

}
