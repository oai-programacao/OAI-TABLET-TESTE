// src/app/shared/utils/date.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {

  /**
   * ✅ Converte Date para string no formato dd/MM/yyyy
   * @param date - Date object ou null
   * @returns String formatada ou null
   */
  formatToLocalDateString(date: Date | null | undefined): string | null {
    if (!date) return null;

    try {
      // Garante que é um Date válido
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

  /**
   * ✅ Converte Date para string no formato ISO (yyyy-MM-dd)
   * @param date - Date object ou null
   * @returns String ISO ou null
   */
  formatToISODateString(date: Date | null | undefined): string | null {
    if (!date) return null;

    try {
      const validDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(validDate.getTime())) {
        console.error('❌ Data inválida:', date);
        return null;
      }

      return validDate.toISOString().split('T')[0]; // yyyy-MM-dd
    } catch (error) {
      console.error('❌ Erro ao formatar data ISO:', error);
      return null;
    }
  }

  /**
   * ✅ Converte string (dd/MM/yyyy ou yyyy-MM-dd) para Date
   * @param dateValue - String, Date ou qualquer valor
   * @returns Date object ou null
   */
  parseDate(dateValue: any): Date | null {
    if (!dateValue) {
      return null;
    }

    // Se já é Date válido
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // Se é número (timestamp)
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }

    // Se é string
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      if (!trimmed) {
        return null;
      }

      // Formato ISO: yyyy-MM-dd ou yyyy-MM-ddTHH:mm:ss
      if (trimmed.includes('-')) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Formato brasileiro: dd/MM/yyyy
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);

          // Valida
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.error('❌ Data inválida:', trimmed);
            return null;
          }

          // Cria date (mês é 0-indexed)
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

  /**
   * ✅ Valida se é uma data válida
   * @param date - Qualquer valor
   * @returns boolean
   */
  isValidDate(date: any): boolean {
    if (!date) return false;
    
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    const parsed = this.parseDate(date);
    return parsed !== null;
  }

  /**
   * ✅ Adiciona dias a uma data
   * @param date - Data base
   * @param days - Número de dias
   * @returns Nova data
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * ✅ Adiciona meses a uma data
   * @param date - Data base
   * @param months - Número de meses
   * @returns Nova data
   */
  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * ✅ Calcula diferença em dias entre duas datas
   * @param date1 - Data inicial
   * @param date2 - Data final
   * @returns Número de dias
   */
  daysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * ✅ Retorna data de hoje (sem hora)
   * @returns Date
   */
  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * ✅ Retorna primeiro dia do mês
   * @param date - Data de referência
   * @returns Date
   */
  firstDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * ✅ Retorna último dia do mês
   * @param date - Data de referência
   * @returns Date
   */
  lastDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}