import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface ClientCredentials {
  username: string;
  password: string;
  email: string;
  centralUrl: string;
}

@Component({
  standalone: true,
  selector: 'app-center-subscriber',
  imports: [
    ButtonModule,
    CommonModule,
    CardBaseComponent,
    InputTextModule,
    PasswordModule,
    FormsModule,
    ToastModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './center-subscriber.component.html',
  styleUrl: './center-subscriber.component.scss',
  providers: [MessageService],
})
export class CenterSubscriberComponent implements OnInit {
  clientId: string | null = null;
  showEditMode = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('clientId');
    // Aqui você carregaria as credenciais reais da API
  }

  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: `${label} copiado com sucesso`,
        life: 2000,
      });
    });
  }

  navigateToInfoClient() {
    this.router.navigate(['/info', this.clientId]);
  }

  openExternalLink() {
    window.open('https://sistema.oai.com.br/app_login/index.php', '_blank');
  }
}
