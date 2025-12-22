// reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoletoInfo, ContractDataCancelResponse } from '../../models/contract/cancel-contract.dto';

export interface ConsentTermRequest {
  proportionalValue: number;
  newDateExpired: string;
  signatureBase64?: string;
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
  paymentForm: null | string;
}

export interface ContractSuspenseRequest {
  contractId: string;
  activationDate: string;
  startDate: string;
  duration: number;
  signatureBase64: string | null;
}

export interface CreateConsentDocumentSuspension {
  proportional: number | null;
  dateInitialSuspension: string;
  dateFinishSuspension: string;
  duration: number;
}


export interface CancelSuspenseContractRequest {
  contractId: string;
  startSuspension: string;
  proportional: number;
  signatureBase64: string | null;
}

export interface ConsentTermPermanentRequest {
  clientId: string;
  codePlanRBX: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  discountFixe: string;
  contractDueDay: string;
  signatureBase64?: string;
}

export interface ConsentTermAdesionRequest {
  clientId: string;
  codePlanRBX: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  discountFixe: string;
  contractDueDay: string;
  signatureBase64?: string;
}

export interface ConsentTermPlanChangeRequest {
  currentPlan: string;
  newPlan: string;
  signatureBase64?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {

  private baseUrl = environment.apiUrl + "/consent-term";

  constructor(private http: HttpClient) { }

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

  getConsentTermSuspensionContractPdf(requestBody: ContractSuspenseRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/suspension-contract`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }

  getConsentTermCancelSuspensionContractPdf(requestBody: CancelSuspenseContractRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/cancel-suspension-contract`;
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

  getPlanChange(body: any): Observable<Blob> {
    return this.http.post<Blob>(
      `${this.baseUrl}/plan-change`,
      body,
      { responseType: 'blob' as 'json' }
    );
  }

  finalizeTransferAndSign(requestBody: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/finalize-transfer`, requestBody, {
      responseType: 'blob'
    });
  }

  getContractPermanencePdf(
    clientId: string,
    requestBody: ConsentTermPermanentRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/permanence/${clientId}`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }

  getContractAdesionPdf(
    clientId: string,
    requestBody: ConsentTermAdesionRequest
  ): Observable<Blob> {
    const url = `${this.baseUrl}/adesion/${clientId}`;
    return this.http.post(url, requestBody, { responseType: 'blob' });
  }

  getContractDisplayPdf(
    clientId: string,
    contractData: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/display-contract/${clientId}`, contractData, {
      responseType: 'blob'
    });
  }

  getPdfCancelNoDebt(
    contractId: string,
    requestBody: any
  ): Observable<Blob> {
    const url = `${this.baseUrl}/no-debt/${contractId}`;
    return this.http.post(url, requestBody, {
      responseType: 'blob'
    });
  }

  getPdfCancelWithDebt(
    contractId: string,
    requestBody: any
  ): Observable<Blob> {
    const url = `${this.baseUrl}/with-debt/${contractId}`;
    return this.http.post(url, requestBody, {
      responseType: 'blob'
    });
  }
}