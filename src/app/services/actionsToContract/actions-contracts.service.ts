import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

export interface CreateTransferConsentPayload {
  sellerId: string;
  newClientId: string;
  signers: {
    name: string;
    phone: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class ActionsContractsService {
  apiUrl = environment.apiUrl + '/autentique';

  constructor(private http: HttpClient, private authService: AuthService) { }

  sendAlterDateAutentique(
    payload: any,
    clientId: string,
    contractId: string
  ): Observable<string> {
    const sellerId = this.authService.getSellerId();
    const finalPayload = {
      ...payload,
      sellerId,
    };

    const url = `${this.apiUrl}/create-consent-document/${clientId}/${contractId}`;
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType: 'text' as 'json', // Mantenha 'text' se a API realmente retorna texto
    };
    const finalOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType: 'text' as 'text', // O 'as text' é só para o compilador
    };
    return this.http.post(url, finalPayload, finalOptions);
  }

  sendTransferOwnershipAutentique(
    payload: any,
    clientId: string,
    contractId: string
  ): Observable<string> {
    const sellerId = this.authService.getSellerId();

    const finalPayload = {
      ...payload,
      sellerId,
    };

    const url = `${this.apiUrl}/create-consent-document/${clientId}/${contractId}`;

    return this.http.post(url, finalPayload, { responseType: 'text' });
  }

  sendTransferConsentAutentique(
    payload: CreateTransferConsentPayload,
    oldClientId: string,
    contractId: string
  ): Observable<string> {
    const url = `${this.apiUrl}/create-consent-document-transfer/${oldClientId}/${contractId}`;
    return this.http.post(url, payload, { responseType: 'text' });
  }

  sendUpgradeConsentAutentique(
    payload: any,
    contractId: string,
    clientId: string
  ): Observable<string> {
    const sellerId = this.authService.getSellerId();
    const finalPayload = {
      ...payload,
      sellerId,
    };

    const url = `${this.apiUrl}/create-consent-document-upgradePlan/${clientId}/${contractId}`;

    return this.http.post(url, finalPayload, { responseType: 'text' });
  }

  sendAddressChangeAutentique(
    payload: any,
    clientId: string,
    contractId: string
  ): Observable<any> {
    const sellerId = this.authService.getSellerId();
    const finalPayload = { ...payload, sellerId };

    const url = `${this.apiUrl}/create-consent-document-update-address/${clientId}/${contractId}`;
    return this.http.post(url, finalPayload, { responseType: 'text' });
  }

  sendContractSalesAutentique(payload: any, clientId: string): Observable<any> {
    const url = `${this.apiUrl}/create-contract-sale/${clientId}`;
    return this.http.post(url, payload, { responseType: 'text' });
  }

  sendContractSuspensionAutentique(payload: any, clientId: string, contractId: string): Observable<any> {
    const url = `${this.apiUrl}/create-consent-document-suspension/${clientId}/${contractId}`;
    return this.http.post(url, payload, { responseType: 'text' });
  }

  sendCancelSuspensionAutentique(payload: any, clientId: string, contractId: string): Observable<any> {
    const url = `${this.apiUrl}/create-consent-document-cancel-suspension/${clientId}/${contractId}`;
    return this.http.post(url, payload, { responseType: 'text' });
  }
}
