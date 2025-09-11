import { Component } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { StepperModule } from 'primeng/stepper';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-address-transfer',
  imports: [CardBaseComponent,
    StepperModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    TextareaModule,
    DividerModule,
    SelectModule
  ],
  templateUrl: './address-transfer.component.html',
  styleUrl: './address-transfer.component.scss'
})
export class AddressTransferComponent {

}
