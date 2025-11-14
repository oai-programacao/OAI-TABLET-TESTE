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

  registerAttendance(payload: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/register_attendance`,
      payload,
      { responseType: 'text' as 'json' }
    );
  }

  createAttendance(any: any): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/create-attendance`, any, {
      responseType: 'text' as 'json',
    });
  }

  getFilteredAttendances(
    clientId: string,
    status: string | null,
    page = 0,
    size = 5
  ) {
    let params = `?page=${page}&size=${size}`;
    if (status) params += `&status=${status}`;
    return this.http.get<PaginationDTO<Attendance>>(
      `${environment.apiUrl}/attendances/${clientId}/filter${params}`
    );
  }
}
