import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { DailyMetricsDto, DraftSaleResponse } from '../../models/sales/draftSale.dto';



@Injectable({
  providedIn: 'root',
})
export class SalesService {

  private readonly urlApi = environment.apiUrl + "/sales";
  private readonly http = inject(HttpClient);

  createSale(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.urlApi}/new-sale`, formData);
  }

  archiveSale(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlApi}/archive`, payload);
  }

  getArchivedSales(): Observable<DraftSaleResponse[]> {
    return this.http.get<DraftSaleResponse[]>(`${this.urlApi}/archived`);
  }

  deleteArchivedSale(draftId: string): Observable<any> {
    return this.http.delete<any>(`${this.urlApi}/archived/${draftId}`);
  }

  getTodayMetrics(sellerId: string): Observable<DailyMetricsDto> {
    return this.http.get<DailyMetricsDto>(
      `${this.urlApi}/sales/metrics/today/${sellerId}`
    );
  }


}
