import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from './../../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchclientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchAndRegisterClient(documento: string): Observable<any> {
  

    return this.http.post(
      this.apiUrl + 'client/rbx/searchAndRegister',
      { documento }
    );
  }

  
}
