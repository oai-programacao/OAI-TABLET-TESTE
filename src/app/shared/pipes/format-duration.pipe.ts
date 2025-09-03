import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration',
  standalone: true
})
export class FormatDurationPipe implements PipeTransform {

  transform(totalSeconds: number | undefined | null): string {
    // 1. Trata casos nulos, indefinidos, ou zero/negativos primeiro
    if (!totalSeconds || totalSeconds <= 0) {
      return ''; // Retorna '0s' para uma duração zerada ou inválida
    }

    // Definição de constantes para clareza
    const SECONDS_IN_DAY = 86400;
    const SECONDS_IN_HOUR = 3600;
    const SECONDS_IN_MINUTE = 60;

    // 2. Calcula cada unidade de tempo
    const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
    const hours = Math.floor((totalSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const seconds = totalSeconds % SECONDS_IN_MINUTE;

    // 3. Formata a string de saída com base na maior unidade de tempo encontrada
    if (days > 0) {
      // Se tivermos dias, mostramos dias e horas (se houver horas)
      const hourPart = hours > 0 ? ` ${hours}h` : '';
      return `${days}d${hourPart}`;
    }
    
    if (hours > 0) {
      // Se não houver dias mas houver horas, mostramos horas e minutos
      const minutePart = minutes > 0 ? ` ${minutes}m` : '';
      return `${hours}h${minutePart}`;
    }

    if (minutes > 0) {
      // Se não houver horas mas houver minutos, mostramos minutos e segundos
      const secondPart = seconds > 0 ? ` ${seconds}s` : '';
      return `${minutes}m${secondPart}`;
    }
    
    // Se a duração for menor que um minuto, mostramos apenas os segundos
    return `${seconds}s`;
  }
}