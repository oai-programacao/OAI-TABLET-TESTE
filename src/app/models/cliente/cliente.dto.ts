export interface Cliente {
  // PF
  nome?: string;
  cpf?: string;
  rg?: string;
  nascimento?: string | Date;

  // PJ
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  ie?: string;

  // Endereço e contato
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  uf?: string;
  observacao?: string;
  celular1?: string;
  celular2?: string;
  telefone?: string;
  email?: string;
  tipoCliente?: string;

  // Ranking (para cores)
  ranking?: 'A' | 'B' | 'C' | 'D' | 'E';
}