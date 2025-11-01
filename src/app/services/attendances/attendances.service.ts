import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AttendancesService {
  private readonly urlApi = environment.apiUrl;
  private readonly http = inject(HttpClient);

  registerAttendance(payload: FormData): Observable<string> {
    return this.http.post<string>(
      `${this.urlApi}/attendances/register_attendance`,
      payload,
      { responseType: "text" as "json" }
    );
  }
}
