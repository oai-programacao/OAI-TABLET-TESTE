import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Contract } from '../../models/contract/contract.dto';

@Injectable({
  providedIn: 'root',
})

export class SalesService{
    private readonly urlApi = environment.apiUrl;
    private readonly http = inject(HttpClient);


    createSale(payload: any): Observable<any> {
        return this.http.post<any>(`${this.urlApi}/sales/newsale`, payload);
}
}
