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

  getContractsActivesByClient(clientId: string): Observable<Contract[]>{
    return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/actives`)
  }

  getContractsActivesAndWaitByClient(clientId: string): Observable<Contract[]>{
    return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/actives-waiting`)
  }

  getAllContractsByClient(clientId: string): Observable<Contract[]> {
     return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/all`)
  }


  getContractsBlockedsByClient(clientId: string): Observable<Contract[]> {
     return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/blockeds`)
  }

  getContractsTransfersByClient(clientId: string): Observable<Contract[]> {
     return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/transfers`)
  }

}
