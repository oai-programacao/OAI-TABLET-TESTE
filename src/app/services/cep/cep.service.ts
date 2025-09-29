// src/app/services/cep.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  constructor(private http: HttpClient) {}

  searchCEP(cep: string): Observable<any> {
    const cepBruto = cep.trim();
    return this.http.get<any>(`https://viacep.com.br/ws/${cepBruto}/json/`);
  }
}
