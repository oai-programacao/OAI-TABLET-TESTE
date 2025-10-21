// reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConsentTermRequest {
  proportionalValue: number;
  newDateExpired: string;
}

export interface ConsentTermAddressRequest {
  zipCode: string | null;
  state: string | null;
  city: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  observation: string | null;
  adesionValue: number | null;
  signatureBase64?: string;
}


@Injectable({
  providedIn: 'root',
})
export class ReportsService {

  private baseUrl = environment.apiUrl + "/consent-term";

  constructor(private http: HttpClient) {}

  /**
   * Visualizar / baixar PDF do Termo de Consentimento
   */
  getConsentTermPdf(
    clientId: string,
    contractId: string,
    requestBody: ConsentTermRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/alter-date-expired/${clientId}/${contractId}`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }
  
  getConsentTermAddressPdf(
    clientId: string,
    contractId: string,
    requestBody: ConsentTermAddressRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/update-address/${clientId}/${contractId}`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }

  getConsentTermWithSignaturePdf(
    clientId: string,
    contractId: string,
    signatureDataUrl: string
  ): Observable<Blob> {
    const url = `${this.baseUrl}/with-signature/${clientId}/${contractId}`;
    const requestBody = { signature: signatureDataUrl };
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }
}


  
