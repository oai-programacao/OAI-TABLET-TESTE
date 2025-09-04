import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-viewplan',
  imports: [CardBaseComponent, CommonModule, DividerModule],
  templateUrl: './viewplan.component.html',
  styleUrl: './viewplan.component.scss',
})
export class ViewplanComponent {
  planos = [
    { velocidade: '250 MEGA', preco: '69,90' },
    { velocidade: '500 MEGA', preco: '79,90' },
    { velocidade: '600 MEGA', preco: '89,90' },
    { velocidade: '750 MEGA', preco: '99,00' },
    { velocidade: '1 GIGA', preco: '199,90' },
  ];

  planosPopulares = [
    { velocidade: '250 MEGA', preco: '69,90' },
    { velocidade: '750 MEGA', preco: '99,00' },
  ];
}
