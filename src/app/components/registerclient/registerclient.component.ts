import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registerclient',
  imports: [
    CardBaseComponent,
    CommonModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule,
    DatePickerModule,
    FormsModule,
    SelectModule,
  ],
  templateUrl: './registerclient.component.html',
  styleUrl: './registerclient.component.scss',
})
export class RegisterclientComponent {

  constructor(private router: Router) {}

  dateOfBirth: Date | null = null;
  selectedOption: boolean = false;
  clientLocation: string | null = null;


  selectedClientType: 'PF' | 'PJ' | null = null;

  clientTypes = [
    { label: 'Pessoa Física', value: 'PF' },
    { label: 'Pessoa Jurídica', value: 'PJ' },
  ];

  goBack() {
    this.router.navigate(['/search']);
  }
  
}
