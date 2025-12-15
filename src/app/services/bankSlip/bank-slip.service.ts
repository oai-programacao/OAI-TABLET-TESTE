import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoletoInfo } from '../../models/contract/cancel-contract.dto';  

@Injectable({
  providedIn: 'root'
})
export class BankSlipService{

    private readonly apiUrl = `${environment.apiUrl}/slip`;
    constructor(private http: HttpClient) {}

  generateSlip(contractId: string, payload: any): Observable<BoletoInfo[]> {
    return this.http.post<BoletoInfo[]>(
      `${this.apiUrl}/${contractId}/generate-slip`, 
      payload

    );
  }

  cancelStoreSlip(contractId: string): Observable<void> {
    return this.http.patch<void>(
        `${this.apiUrl}/${contractId}/cancel-slip`,
        { status: 'CANCELLED' } 
    );
}
}
  
