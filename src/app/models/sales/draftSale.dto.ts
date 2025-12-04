import { ContractFormData } from "./sales.dto";

export interface DraftSaleResponse extends ContractFormData {
  draftId: string;
  codeplan: string;
  installments: number;
  expirationCycle: string;
  contractType: boolean;
  startDate: string;
  signatureDate: string;
  expirationDate: string;
  residenceType: string;
}
