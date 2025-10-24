import { environment } from '../../../environments/environment';
import SockJS from "sockjs-client";

export const wsStompConfig = {
  webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws-connect`),
  reconnectDelay: 0,        // desliga reconexão automática
  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
};