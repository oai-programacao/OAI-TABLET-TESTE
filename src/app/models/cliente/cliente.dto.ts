export interface Cliente {
  // PF
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string | Date;
  openingDate?: string | Date;

  // PJ
  socialName?: string;
  fantasyName?: string;
  cnpj?: string;
  ie?: string;

  // Endereço e contato
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  uf?: string;
  observation?: string;
  celular1?: string;
  celular2?: string;
  telefone?: string;
  email?: string;
  tipoCliente?: string;
  codigoRbx?: string;
  typeZone?: string;
  typeClient?: string;

  // Ranking (para cores)
  ranking?: 'A' | 'B' | 'C' | 'D' | 'E';
}