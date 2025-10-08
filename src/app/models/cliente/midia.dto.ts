export interface MidiaDTO {
  id: string;       // UUID da mídia
  nameFile: string; // Nome do arquivo
  typeFile?: string; // Tipo de arquivo (opcional)
  urlFile: string;  // URL da imagem
  dataUpload?: string; // ISO date string opcional
}
