import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpfCnpj',
  standalone: true,
})
export class CpfCnpjPipe implements PipeTransform {
  transform(value: any): string {
    if (value == null) return '';

    const cleanedValue = String(value).replace(/\D/g, '');

    if (cleanedValue.length === 11) {
      return cleanedValue.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
      );
    } else if (cleanedValue.length === 14) {
      return cleanedValue.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      );
    } else {
      return String(value);
    }
  }
}