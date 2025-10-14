// reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConsentTermRequest {
  proportionalValue: number;
  newDateExpired: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Visualizar / baixar PDF do Termo de Consentimento
   */
  getConsentTermPdf(
    clientId: string,
    contractId: string,
    requestBody: ConsentTermRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/consent/term/${clientId}/${contractId}`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }
  
}
