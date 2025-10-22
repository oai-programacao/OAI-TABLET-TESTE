import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { Attendance } from '../../models/attendance/attendance.dto';
import { DialogModule } from 'primeng/dialog';

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
  styleUrl: './attendances-client.component.scss',
})
export class AttendancesClientComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  clientId!: string;
  attendances: Attendance[] = [];

  client: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id;
    }

    // Mock de dados
    this.attendances = [
      {
        id: '1',
        seller: { id: 's1', name: 'João Vendedor' },
        client: {
          id: this.clientId,
          name: 'Maria Silva',
          codigoRbx: 'RBX-3322',
        },
        openDate: '2025-10-22',
        openHour: '14:35',
        initiative: 'Cliente',
        mode: 'WhatsApp',
        typeClient: 'Titular',
        contract: 'CT-90876',
        flow: 'Financeiro',
        subject: '2ª via de boleto',
        codeAttendanceRbx: 5001,
      },
      {
        id: '2',
        seller: { id: 's2', name: 'Ana Vendedora' },
        client: {
          id: this.clientId,
          name: 'Maria Silva',
          codigoRbx: 'RBX-3322',
        },
        openDate: '2025-10-20',
        openHour: '09:12',
        initiative: 'Loja',
        mode: 'Telefone',
        typeClient: 'Dependente',
        contract: 'CT-90876',
        flow: 'Comercial',
        subject: 'Alteração de plano',
        codeAttendanceRbx: 5002,
      },
    ];

    // Dados para o header
    if (this.attendances.length > 0) {
      this.client = {
        name: this.attendances[0].client.name,
        contract: this.attendances[0].contract,
        openDate: this.attendances[0].openDate,
        openHour: this.attendances[0].openHour,
        codeAttendanceRbx: this.attendances[0].codeAttendanceRbx,
      };
    }
  }

  backToClient() {
    this.router.navigate(['info', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['home']);
  }


  selectedAttendance: any; // Atendimento selecionado para o Dialog
  displayDialog: boolean = false;

  verDetalhes(att: any) {
    // Aqui você pode buscar informações adicionais se precisar
    // Por exemplo, chamar API para pegar descrição completa e PDFs
    this.selectedAttendance = att;
    
    // Se seu atendimento tiver PDFs, garanta que seja um array:
    if (!this.selectedAttendance.medias) {
      this.selectedAttendance.medias = []; // exemplo: [{name: 'doc.pdf', url: '/files/doc.pdf'}]
    }

    this.displayDialog = true;
  }
}
