import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MidiaDTO } from '../../models/cliente/midia.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MidiaService {
  private baseUrl = `${environment.apiUrl}/midias`;

  constructor(private http: HttpClient) {}

  listMidias(clientId?: string, contractId?: string): Observable<MidiaDTO[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (contractId) params = params.set('contractId', contractId);

    return this.http.get<MidiaDTO[]>(this.baseUrl, { params });
  }

  removeMidias(midiaId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${midiaId}`);
  }

  saveMidias(
    arquivos: File[],
    clientId?: string,
    contractId?: string
  ): Observable<void> {
    const formData = new FormData();
    arquivos.forEach((arquivo) => formData.append('arquivos', arquivo));

    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (contractId) params = params.set('contractId', contractId);

    return this.http.post<void>(this.baseUrl, formData, {
      params,
      withCredentials: true, // mantém cookies/sessão se necessário
    });
  }
  
}
