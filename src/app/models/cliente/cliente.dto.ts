import { MidiaDTO } from './midia.dto';

export interface Cliente {
  id?: string;
  // PF
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string | Date;
  openingDate?: string | Date;

  // PJ
  socialName?: string;
  fantasyName?: string;
  typeContribuinte?: string;
  cnpj?: string;
  ie?: string;

  // Endereço e contato
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  bairro?: string;
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
  active?: boolean;

  // Ranking (para cores)
  ranking?: 'A' | 'B' | 'C' | 'D' | 'E';

  midias?: MidiaDTO[]; 
}