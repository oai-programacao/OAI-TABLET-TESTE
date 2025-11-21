import { ContractFormData } from "./sales.dto";

export interface DraftSaleResponse extends ContractFormData {
  draftId: string;
  codeplan: string;
  installments: string;
  expirationCycle: string;
  contractType: string;
  startDate: string;
  signatureDate: string;
  expirationDate: string;
  residenceType: string;
}
