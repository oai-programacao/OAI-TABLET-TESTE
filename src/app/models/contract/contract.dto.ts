export interface Contract {
    id: string;
    situationDescription: string;
    zipCode: string;
    state: string;
    city: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string | null;
    codMunicipio: string | null;
    adesion: number | null;
    brutePrice: number | null;
    liquidPrice: number | null;
    cancelReason: string | null;
    codeContractRbx: string;
    dateExpired: string | null;
    dateSignature: string | null;
    dateStart: string | null;
    descountFixe: number | null;
    imagesOne: string | null;
    numberParcels: number | null;
    observation: string | null;
    signature: string | null;
    transferToCodeRbx: string | null;
    clientId: string;
    clientName: string;
    planId: number;
    planName: string;
    codePlanRbx: number;
    sellerId: string | null;
    saleId: string | null;
    cicleFatId: number | null;
    cicleBillingDayBase: number | null;
    cicleBillingExpired: number | null;
    vigencia: number | null;
    suspensionScheduled: number | null;
    loyalty: boolean | null;
}

export interface RequestDateTransfer {
    clientId: string;
    contrato: string;
    proportionalValue: number;
    newDate: string;
    paymentMethod: string | null;
    fluxo: string;
    assunto: string;
    phone?: string;
    pdfBytes: string;
}

export interface RequestContractSuspendDTO {
    dateInitialSuspension: string;
    duration: number
}
