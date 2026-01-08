export interface ContractSuspenseDTO {
  id: string;
  contractId: string;
  codeContractRbx: string;
  startDate: string; 
  finishDate: string;
  processed: boolean;
  phone?: string;
}