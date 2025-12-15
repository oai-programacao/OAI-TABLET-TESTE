import { Address } from "./sales.dto";


export interface ArchivedSale {
  draftId: string;
  status: string;
  clientId: string;
  clientName: string;
  clientCpf?: string;
  clientPhone?: string;
  clientEmail?: string;
  leadSince?: string;
  codePlan?: number;
  planName?: string;
  observation?: string;
  address?: Address;
  archivedAt?: string;
  font?: string;
}

export interface DraftSaleResponse {
  draftId: string;
  sellerId: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  sellerName?: string;
  codePlan: number;
  namePlan: string;
  expirationCycle?: string;
  contractType?: string;
  adesion?: number;
  discountFixe?: number;
  discount?: number;
  vigencia?: number;
  dateStart?: string;
  dateSignature?: string;
  dateExpiredAdesion?: string;
  archivedAt?: string;
  observation?: string;
  address?: AddressResponse;
  residenceType?: string;
  typeTechnology?: string;
  numberParcels?: number;
  cicleFatId?: number;
  cicleBillingDayBase?: number;
  cicleBillingExpired?: number;
  clientType?: string;
  loyalty?: string;
}

export interface AddressResponse {
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
}


export interface DailyMetricsDto {
  newSalesCount: number;
  totalRevenue: number;
}
