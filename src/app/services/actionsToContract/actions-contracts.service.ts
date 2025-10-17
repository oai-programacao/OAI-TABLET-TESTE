import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ActionsContractsService {
  apiUrl = environment.apiUrl + '/autentique';

  constructor(private http: HttpClient, private authService: AuthService) {}

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

    return this.http.post(url, finalPayload, { responseType: 'text' });
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
}
