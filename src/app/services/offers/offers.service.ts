import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OfferProjection } from '../../models/offer/offer-projection.model';
import { map } from 'rxjs';
import { PaginationDTO } from '../../models/page/pagination.dto';

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl + '/offers';

  getOffersSales(
    city?: string,
    typeOfOs?: string,
    period?: string,
    page: number = 0,
    size: number = 10
  ) {
    let params = new HttpParams().set('page', page).set('size', size);

    if (city) params = params.set('city', city);
    if (period) params = params.set('period', period);

    if (typeOfOs) {
      params = params.set('typeOfOs', typeOfOs);
    }
    
    else {
      params = params.set('typeOfOs', 'INSTALLATION,TECHNICAL_VISIT');
    }

    return this.http
      .get<any>(`${this.baseUrl}/new-installation`, { params })
      .pipe(
        map((pageData) => ({
          content: pageData.content.map((o: any) => ({
            ...o,
            typeOfOs: this.mapTypeOfOs(o.typeOfOs),
            period: this.mapPeriod(o.period),
            city: this.mapCity(o.city),
          })),
          totalElements: pageData.page.totalElements,
          totalPages: pageData.page.totalPages,
          size: pageData.page.size,
          number: pageData.page.number,
        }))
      );
  }

  // maps

  private mapTypeOfOs(value: string): string {
    const map: any = {
      INSTALLATION: 'Instalação',
      MAINTENANCE: 'Manutenção',
      CHANGE_OF_ADDRESS: 'Troca de Endereço',
      CHANGE_OF_TECHNOLOGY: 'Troca de Tecnologia',
      PROJECTS: 'Projetos',
      KIT_REMOVAL: 'Remoção de Kit',
      TECHNICAL_VIABILITY: 'Viabilidade Técnica',
      TECHNICAL_VISIT: 'Visita Técnica',
      INTERNAL: 'Interno',
    };

    return map[value] ?? value;
  }

  private mapPeriod(value: string): string {
    const map: any = {
      MORNING: 'Manhã',
      AFTERNOON: 'Tarde',
      NIGHT: 'Noite',
    };

    return map[value] ?? value;
  }

  private mapCity(value: string): string {
    const map: any = {
      ASSIS: 'Assis',
      CANDIDO_MOTA: 'Cândido Mota',
      PALMITAL: 'Palmital',
      OSCAR_BRESSANE: 'Oscar Bressane',
      IBIRAREMA: 'Ibirarema',
      ECHAPORA: 'Echaporã',
      PLATINA: 'Platina',
      ANDIRA: 'Andirá',
    };

    return map[value] ?? value;
  }
}
