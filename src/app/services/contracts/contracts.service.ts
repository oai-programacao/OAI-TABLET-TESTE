import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Contract } from '../../models/contract/contract.dto';

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  private readonly urlApi = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getContractsActivesByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/actives`
    );
  }

  getContractsActivesAndWaitByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/actives-waiting`
    );
  }

  getAllContractsByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/all`);
  }

  getContractsBlockedsByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/blockeds`
    );
  }

  getContractsTransfersByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/transfers`
    );
  }

  upgradeContract(contractId: string, payload: any): Observable<any> {
    return this.http.patch(`${this.urlApi}/contract/${contractId}/upgrade`, payload);
  }


  getContractById(contractId: string): Observable<Contract> {
    return this.http.get<Contract>(
      `${this.urlApi}/contract/${contractId}`
    )
  }

  changeBillingDate(payload: {
    clientId: string;
    contractNumber: string;
    billingCycleLabel: string;
    sellerId: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.urlApi}/automation/billing-date`,
      payload
    );
  }

   transferOwnership(oldContractId: string, newClientId: string): Observable<any> {
    const url = `${this.urlApi}/contract/${oldContractId}/transfer-ownership`;
    const payload = { newClientId };

    return this.http.post<any>(url, payload);
  }

 getTransferConsentPdf(oldContractId: string, newClientId: string): Observable<Blob> {
    const payload = { 
      oldContractId: oldContractId, 
      newClientId: newClientId 
    };

    const endpoint = `${this.urlApi}/consent-term/generate-transfer-term`;
    return this.http.post(endpoint, payload, { 
      responseType: 'blob' 
    });
  }

  finalizeAndSignTransfer(payload: any): Observable<Blob> {
    const endpoint = `${this.urlApi}/consent-term/finalize-transfer`;

    return this.http.post(endpoint, payload, { 
      responseType: 'blob' 
    });
  }

  changeAddressContract(payload: {
  clientId: string;
  contractNumber: string;
  sellerId: string;
  newZip: string | null;
  newNumber: string | null;
  newComplement: string | null;
  newState: string;
  newCity: string;
  newStreet: string;
  newNeighborhood: string;
  // observation?: string | null; // Só inclua se o backend realmente espera!
}): Observable<any> {
  return this.http.post<any>(
    `${this.urlApi}/automation/address-update`,
    payload
  );
}
}
