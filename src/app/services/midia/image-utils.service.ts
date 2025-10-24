// src/app/shared/utils/image-utils.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageUtilsService {

  async resizeImage(
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => (img.src = e.target.result);
      reader.onerror = reject;
      img.onerror = reject;

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject('Erro ao criar blob');
            const resizedFile = new File([blob], file.name, { type: file.type });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      reader.readAsDataURL(file);
    });
  }
}
