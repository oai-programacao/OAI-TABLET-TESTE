import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-card-base',
  imports: [
    CardModule,
    CheckboxModule,
    FloatLabelModule,
    InputGroupAddonModule,
    InputGroupModule,
    IftaLabelModule,
    InputTextModule,
    CommonModule,
    ButtonModule,
  ],
  templateUrl: './card-base.component.html',
  styleUrl: './card-base.component.scss',
})
export class CardBaseComponent {
  @Input() header: string = '';
  @Input() width: string = '';
  @Input() height: string = '';
  @Input() overflow: string = '';
}
