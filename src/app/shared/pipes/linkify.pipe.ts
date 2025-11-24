import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(texto: string): SafeHtml {
    if (!texto) return texto;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const convertido = texto.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(convertido);
  }
}
