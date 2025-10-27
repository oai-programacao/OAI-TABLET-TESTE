import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { Attendance } from '../../models/attendance/attendance.dto';
import { DialogModule } from 'primeng/dialog';
import { AttendancesService } from '../../services/attendances/attendance.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-attendances-client',
  standalone: true,
  imports: [
    CommonModule,
    CardBaseComponent,
    ButtonModule,
    TableModule,
    DialogModule,
  ],
  templateUrl: './attendances-client.component.html',
  styleUrls: ['./attendances-client.component.scss'],
})
export class AttendancesClientComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private attendancesService = inject(AttendancesService);
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
    medias: [],
  };

  // PDF dialog
  pdfDialogVisible = false;
  pdfSrc: string | ArrayBuffer | null = null;
  currentFilePath: string | null = null;

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
          this.totalElements = res.totalElements;
        },
        error: (err) => console.error('Erro ao carregar atendimentos', err),
      });
  }

  onPageChange(event: any) {
    const page = event.first / event.rows;
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
    this.attendancesService.getAttendanceDetails(att.id).subscribe({
      next: (res) => {
        this.selectedAttendance = res;
        if (!this.selectedAttendance.medias) {
          this.selectedAttendance.medias = [];
        }
        this.displayDialog = true;
      },
      error: (err) => console.error('Erro ao carregar detalhes', err),
    });
  }

  pdfUrl: string | null = null; // <-- declara aqui

  openPdf(filePath: string) {
    const fileName = filePath.split(
      '/home/oai/imagesDocuments/contratosassinados/'
    )[1];
    this.currentFilePath = filePath;
    this.pdfUrl = environment.apiUrl + `/pdf/${fileName}`; // <-- usa pdfUrl
    this.pdfDialogVisible = true;
  }

  downloadPdf(filePath: string) {
    const fileName = filePath.split(
      '/home/oai/imagesDocuments/contratosassinados/'
    )[1];
    const apiUrl = environment.apiUrl + `/pdf/${fileName}`;

    this.http.get(apiUrl, { responseType: 'blob' }).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
