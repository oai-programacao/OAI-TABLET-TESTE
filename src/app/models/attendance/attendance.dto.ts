import { Seller } from './../seller/seller.dto';
import { Cliente } from './../cliente/cliente.dto';

export interface Attendance {
  id: string;
  seller: Seller;
  client: Cliente;
  openDate: string;        
  openHour: string;        
  initiative: string;
  mode: string;
  typeClient: string;
  contract: string;
  flow: string;
  subject: string;
  codeAttendanceRbx: number;
}