import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../../environments/environment';

export interface Plan {
  id: number;
  nome: string;
  codePlanRBX: number;
  valor: number;
  status: 'A' | 'I';
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private baseUrl = environment.apiUrl + '/plans';

  private http = inject(HttpClient);

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.baseUrl);
  }

  isPlanActive(codePlanRBX: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/${codePlanRBX}/status`);
  }

}
