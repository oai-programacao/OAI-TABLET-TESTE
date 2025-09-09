import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-add-contract',
  imports: [CardBaseComponent, StepperModule, ButtonModule],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
})
export class AddContractComponent {}
