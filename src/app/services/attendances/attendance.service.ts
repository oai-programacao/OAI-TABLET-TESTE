import { Attendance } from '../../models/attendance/attendance.dto';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationDTO } from '../../models/page/pagination.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AttendancesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/attendances';

  getAttendances(
    clientId: string,
    page = 0,
    size = 10
  ): Observable<PaginationDTO<Attendance>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginationDTO<Attendance>>(
      `${this.baseUrl}/${clientId}/listAttendances`,
      { params }
    );
  }

  getAttendanceDetails(attendanceId: string) {
    return this.http.get<Attendance>(`${this.baseUrl}/${attendanceId}/details`);
  }

  registerAttendanceDropDownUpgrade(payload: FormData): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/attendances/register_attendance`,
      payload,
      { responseType: 'text' as 'json' }
    );
  }

  createAttendance(any: any): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/create-attendance`,
      any,
      { responseType: 'text' as 'json' }
    );
  }



}
