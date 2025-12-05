import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ViewBlockOffersDto } from '../../models/blockoffer/blockOffer.dto';


@Injectable({
  providedIn: 'root'
})
export class BlockOffersRequestService {

  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/blocking-offers';

  getAllBlockOffers(): Observable<ViewBlockOffersDto[]> {
    return this.http.get<ViewBlockOffersDto[]>(`${this.apiUrl}`);
  }

}