import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Contract } from '../../models/contract/contract.dto';

// ✅ Interface para vendas arquivadas
export interface ArchivedSale {
  draftId: string;
  status: string;
  clientId: string;
  clientName: string;
  clientCpf?: string;
  clientPhone?: string;
  clientEmail?: string;
  leadSince?: string;
  codePlan?: number;
  planName?: string;
  observation?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    complement?: string;
  };
  archivedAt?: string;
  font?: string;
}

@Injectable({
  providedIn: 'root',
})

export class SalesService{
    private readonly urlApi = environment.apiUrl;
    private readonly http = inject(HttpClient);


    createSale(payload: any): Observable<any> {
        return this.http.post<any>(`${this.urlApi}/sales/newsale`, payload);
} 

  archiveSale(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlApi}/sales/archive`, payload);
  }
  getArchivedSales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlApi}/sales/archived`);
  }

  getArchivedSaleForConversion(clientId: string, draftId: string): Observable<any> {
    return this.http.get<any>(`${this.urlApi}/sales/archived/${clientId}/${draftId}`);
  }
   deleteArchivedSale(clientId: string, draftId: string): Observable<void> {
    return this.http.delete<void>(`${this.urlApi}/sales/archived/${clientId}/${draftId}`);
  }
}
