export interface ImageItem {
  src: string;
  alt: string;
  type?: 'frente' | 'verso';
  midiaId?: string; // UUID do backend
}
