import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationSeller } from '../../models/notification/notification-seller.dto';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly baseUrl = environment.apiUrl + '/notifications';

  constructor(private http: HttpClient) {}

  getBySeller(sellerId: string): Observable<NotificationSeller[]> {
    return this.http.get<NotificationSeller[]>(
      `${this.baseUrl}/seller/${sellerId}`
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  countUnread(sellerId: string): Observable<number> {
    return this.http.get<number>(
      `${this.baseUrl}/seller/${sellerId}/unread-count`
    );
  }
}
