import { UpdateCenterSubscribeDTO } from './../../models/centersubscribe/centerSubscribe.dto';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateCenterSubscribeDTO } from '../../models/centersubscribe/createCenterSubscribe.dto';

@Injectable({
  providedIn: 'root',
})
export class CenterSubscribeService {
  private apiUrl = environment.apiUrl + '/centersubscribe';

  constructor(private http: HttpClient) {}

  createCredentials(payload: CreateCenterSubscribeDTO) {
    return this.http.post<any>(`${this.apiUrl}/create-credentials`, payload);
  }

  updateCredentials(payload: UpdateCenterSubscribeDTO) {
    return this.http.post<UpdateCenterSubscribeDTO>(
      `${this.apiUrl}/update-credentials`,
      payload,
      { responseType: 'text' as 'json' }
    );
  }

  getCredentialsByClient(clientId: string) {
    return this.http.get<UpdateCenterSubscribeDTO>(
      `${this.apiUrl}/authentications/${clientId}`
    );
  }
}
