
export interface ContractFormData {
  salesId?: number;
  sellerId: string;
  clientId: string;
  offerId: string;
  codePlan: number;
  dateStart: string;
  dateSignature: string;
  dateExpired: string;
  adesion: number;
  numberParcels: number;
  parcels: Parcel[];
  address: Address;
  discount: number;
  signature: string;
  observation?: string;
  situationDescription?: string;
  discountFixed?: number;
  vigencia?: number;
  cicleFatId?: number;
  cicleBillingDayBase?: number;
  cicleBillingExpired?: number;
  termConsentSales?: File[] | null;
  clientType: string;
  phone: string;
  typeTechnology: string;
}

export interface Parcel {
  description: string;
  dueDate: string;
  price: number;
}

export interface Address {
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  residenceType?: string;
}






