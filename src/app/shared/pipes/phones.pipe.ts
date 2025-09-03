import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phones',
  standalone: true,
})
export class PhonesPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const cleanedValue = value.replace(/\D/g, '');

    if (cleanedValue.length === 10) {
      return cleanedValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanedValue.length === 11) {
      return cleanedValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      return value;
    }
  }
}