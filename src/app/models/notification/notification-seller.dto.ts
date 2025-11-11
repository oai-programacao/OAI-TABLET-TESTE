export interface NotificationSeller {
  id: string;
  type: string;
  message: string;
  contractNumber: string;
  status: string;
  createdAt: string;
  readAt?: string;
}
