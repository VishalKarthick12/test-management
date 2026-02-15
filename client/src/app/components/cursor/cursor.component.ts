import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-cursor',
  template: `
    <div class="cursor-dot" [style.left.px]="cursorX" [style.top.px]="cursorY"></div>
    <div class="cursor-outline" [style.left.px]="outlineX" [style.top.px]="outlineY"></div>
  `,
  styles: [`
    .cursor-dot {
      width: 8px;
      height: 8px;
      background-color: #4f46e5;
      border-radius: 50%;
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
    }
    .cursor-outline {
      width: 40px;
      height: 40px;
      border: 2px solid rgba(79, 70, 229, 0.5);
      border-radius: 50%;
      position: fixed;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      transition: width 0.2s, height 0.2s, background-color 0.2s;
    }
  `]
})
export class CursorComponent implements OnInit {
  cursorX = 0;
  cursorY = 0;
  outlineX = 0;
  outlineY = 0;

  ngOnInit() {
    this.animate();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.cursorX = e.clientX;
    this.cursorY = e.clientY;
  }

  animate() {
    const distX = this.cursorX - this.outlineX;
    const distY = this.cursorY - this.outlineY;

    this.outlineX += distX * 0.15;
    this.outlineY += distY * 0.15;

    requestAnimationFrame(() => this.animate());
  }
}
