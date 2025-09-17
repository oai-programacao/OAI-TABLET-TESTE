import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [
    CardModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    PasswordModule,
    FloatLabelModule,
    CheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  form!: FormGroup;

  constructor(){

  }


  ngOnInit() {
    this.form = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.minLength(6)]
    })
  }

  login(){
    const email = this.form.value.email;
    const password = this.form.value.password;
    if(this.form.invalid){
     this.messageService.add({
      detail: 'Email ou senha inválidos',
      summary: 'Error',
      severity: 'error'
     })
    }
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.router.navigate(['search']);
        console.log('Foi', response);
      },
      error: (err) => {
        console.log(err)
      }
    })
  }




}
