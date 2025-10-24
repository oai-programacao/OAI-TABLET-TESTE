import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input, textarea, p-inputText, p-textarea',
  standalone: true, // Angular 19+ suporta diretivas standalone
})
export class NoEmojiDirective {
  private emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const nativeEl = this.el.nativeElement;

    if (nativeEl.tagName === 'INPUT' || nativeEl.tagName === 'TEXTAREA') {
      nativeEl.value = nativeEl.value.replace(this.emojiRegex, '');
    } else {
      const inputChild = nativeEl.querySelector('input, textarea');
      if (inputChild) {
        inputChild.value = inputChild.value.replace(this.emojiRegex, '');
        inputChild.dispatchEvent(new Event('input')); // para ngModel / FormControl atualizar
      }
    }
  }
}
