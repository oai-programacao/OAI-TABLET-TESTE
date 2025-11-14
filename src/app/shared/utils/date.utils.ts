
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  formatToLocalDateString(date: Date | null | undefined): string | null {
    if (!date) return null;

    try {
      const validDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(validDate.getTime())) {
        console.error('❌ Data inválida:', date);
        return null;
      }

      const day = validDate.getDate().toString().padStart(2, '0');
      const month = (validDate.getMonth() + 1).toString().padStart(2, '0');
      const year = validDate.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('❌ Erro ao formatar data:', error);
      return null;
    }
  }

  formatToISODateString(date: Date | null | undefined): string | null {
    if (!date) return null;

    try {
      const validDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(validDate.getTime())) {
        console.error('❌ Data inválida:', date);
        return null;
      }

      return validDate.toISOString().split('T')[0]; 
    } catch (error) {
      console.error('❌ Erro ao formatar data ISO:', error);
      return null;
    }
  }

  parseDate(dateValue: any): Date | null {
    if (!dateValue) {
      return null;
    }

    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      if (!trimmed) {
        return null;
      }
      if (trimmed.includes('-')) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);

          if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.error('❌ Data inválida:', trimmed);
            return null;
          }

          const date = new Date(year, month - 1, day);
          
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      console.warn('⚠️ Formato de data não reconhecido:', trimmed);
      return null;
    }

    console.error('❌ Tipo de data desconhecido:', typeof dateValue, dateValue);
    return null;
  }

  isValidDate(date: any): boolean {
    if (!date) return false;
    
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    const parsed = this.parseDate(date);
    return parsed !== null;
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  daysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  firstDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  lastDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}