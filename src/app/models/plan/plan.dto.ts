export interface Plan {
  id: number;
  nome: string;
  codePlanRBX: number;
  valor: number;
  status: 'A' | 'I';
}