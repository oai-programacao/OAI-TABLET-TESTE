import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-registerclient',
  imports: [
    CardBaseComponent,
    InputText,
    CommonModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule
  ],
  templateUrl: './registerclient.component.html',
  styleUrl: './registerclient.component.scss',
})
export class RegisterclientComponent {}
