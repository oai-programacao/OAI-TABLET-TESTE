import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { NgForm } from '@angular/forms';
import { LoginSeller } from '../../models/login/login-seller.dto';
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';
import { ToastModule } from 'primeng/toast';
import { WebSocketService } from '../../services/webSocket/websocket.service';

@Component({
  selector: 'app-login',
  imports: [
    ToastModule,
    CardModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    PasswordModule,
    FloatLabelModule,
    CheckboxModule,
    FormsModule,
    MessagesValidFormsComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly wsService = inject(WebSocketService);

  @ViewChild('loginForm') form!: NgForm;

  loginFailed: boolean = false;

  loginData: LoginSeller = {
    email: '',
    password: '',
  };

  ngOnInit() {}

  login(form: NgForm) {

    if (form.invalid) {
      console.log('form inválido', form);
      this.messageService.add({
        detail: 'E-mail ou senha inválidos',
        summary: 'ERRO',
        severity: 'error',
        icon: 'pi-thumbs-down-fill',
      });
      return;
    }

    localStorage.clear();

    const credentials: LoginSeller = { ...this.loginData };

    this.authService.login(credentials).subscribe({
      next: (response: any) => {
        console.log('login sucesso', response);

        this.wsService.initWebSocket();
        this.router.navigate(['search']);
        this.loginFailed = false;
        this.form.resetForm();
      },
      error: (error: any) => {
        console.log('login erro', error);
        this.loginFailed = true;
        const errorMsg = error?.error?.message || 'Falha ao efetuar login';
        this.messageService.add({
          detail: errorMsg,
          summary: 'ERRO',
          severity: 'error',
          icon: 'pi-thumbs-down-fill',
        });
      },
    });
  }

  get camposObrigatoriosInvalidos(): boolean {
    return !!((this.form?.submitted && this.form?.invalid) || this.loginFailed);
  }

}
