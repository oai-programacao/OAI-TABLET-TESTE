import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../../models/cliente/cliente.dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
    
  private apiUrl = environment.apiUrl; 

  constructor(private http: HttpClient) {}

  getClientById(clientId: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/client/id/${clientId}`);
  }

  createClient(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/client/create`, cliente);
  }


  updateClient(clientId: string, clientData: Partial<Cliente>): Observable<Cliente> {
    const url = `${this.apiUrl}/client/update/${clientId}`;
    return this.http.patch<Cliente>(url, clientData);
}
}
