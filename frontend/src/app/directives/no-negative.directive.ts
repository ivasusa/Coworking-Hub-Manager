import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: 'input[type="number"][noNegative]',
  standalone: true,
})
export class NoNegativeDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const min = parseFloat(input.min);
    const floor = isNaN(min) ? 0 : min;
    if (input.value !== '' && parseFloat(input.value) < floor) {
      input.value = String(floor);
      input.dispatchEvent(new Event('input'));
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === '-') {
      event.preventDefault();
    }
  }
}
