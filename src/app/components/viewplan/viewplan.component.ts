import { Component, inject } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-viewplan',
  imports: [
    CardBaseComponent,
    CommonModule,
    DividerModule,
    ButtonModule,
  ],
  templateUrl: './viewplan.component.html',
  styleUrl: './viewplan.component.scss',
})
export class ViewplanComponent {
  router = inject(Router);

  planos = [
    { velocidade: '500 MEGA', preco: '79,90' },
    { velocidade: '600 MEGA', preco: '89,90' },
    { velocidade: '1 GIGA', preco: '199,90' },
  ];

  planosPopulares = [
    { velocidade: '250 MEGA', preco: '69,90' },
    { velocidade: '750 MEGA', preco: '99,00' },
  ];

  isPlanoPopular(plano: any): boolean {
    return this.planosPopulares.some((p) => p.velocidade === plano.velocidade);
  }

  backToPreviousPage() {
    this.router.navigate(['search']);
  }
}
