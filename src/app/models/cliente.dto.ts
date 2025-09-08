export interface ClienteDTO {
  tipoCliente: 'PF' | 'PJ';
  nome?: string;
  cpf?: string;
  rg?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  dataAbertura?: Date;
  endereco?: {
    cep?: string;
    rua?: string;
    numero?: string;
    cidade?: string;
    bairro?: string;
    complemento?: string;
  };
  contatos?: {
    celular?: string;
    telefone?: string;
    email?: string;
    segundoCelular?: string;
  };
}
