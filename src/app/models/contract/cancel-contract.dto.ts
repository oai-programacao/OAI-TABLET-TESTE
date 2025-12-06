export interface CancelSimulationDTO{
    valorMulta: number;
    valorProporcional: number;
    valorTotal: number;
    isIsentoMulta: boolean;
    mensagemCalculo: string;
}

export interface BoletoInfo {
  numeroDocumento: number;
  link: string;
  vencimento: string;
  valor: number;
}

export interface ContractDataCancelResponse {
  contractId: string;
  clientId: string;
  newStatus: string; 
  cancelReason: string;
  protocolo: string;
  boletosGerados: BoletoInfo[];
}