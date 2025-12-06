import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ModalModule, ButtonDirective
} from '@coreui/angular';

@Component({
    selector: 'app-guide-modal',
    standalone: true,
    imports: [
        CommonModule, ModalModule, ButtonDirective
    ],
    template: `
    <c-modal [visible]="visible" (visibleChange)="handleVisibleChange($event)" size="lg">
      <c-modal-header>
        <h5 cModalTitle>🎓 Guía Estrategia Cava (Híbrida)</h5>
      </c-modal-header>
      <c-modal-body>
        <div class="alert alert-info border-info bg-info-subtle mb-4">
          <h6 class="alert-heading fw-bold">¿Por qué funciona esta estrategia?</h6>
          <p class="mb-0">Esta estrategia se basa en operar <strong>A FAVOR</strong> de la fuerza. Buscamos activos fuertes (Stoch > 80) y entramos en retrocesos (RSI < 10).</p>
        </div>

        <div class="row g-4">
          <div class="col-md-4">
            <div class="p-3 border rounded h-100 bg-body-tertiary">
              <div class="fs-1 mb-2">🚦</div>
              <h6 class="fw-bold">1. MACD Diario</h6>
              <p class="small text-secondary mb-0">Es el <strong>Semáforo</strong>. Nos dice la dirección general. Si es alcista, solo buscamos compras.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-3 border rounded h-100 bg-body-tertiary">
              <div class="fs-1 mb-2">⛽</div>
              <h6 class="fw-bold">2. Stoch > 80</h6>
              <p class="small text-secondary mb-0">Es la <strong>Gasolina</strong>. > 80 indica <strong>Fuerza Extrema</strong>, no "venta". Queremos subirnos a este cohete.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-3 border rounded h-100 bg-body-tertiary">
              <div class="fs-1 mb-2">🎯</div>
              <h6 class="fw-bold">3. RSI 2</h6>
              <p class="small text-secondary mb-0">Es el <strong>Gatillo</strong>. Buscamos una caída rápida (RSI < 10) dentro de la tendencia fuerte para entrar.</p>
            </div>
          </div>
        </div>

        <hr class="my-4">

        <div class="p-3 rounded bg-light border">
          <h6 class="fw-bold mb-2">💡 Ejemplo Práctico</h6>
          <p class="small mb-0 fst-italic">
            "Imagina que Bitcoin está subiendo con fuerza (MACD Diario Alcista y Stoch > 80). De repente, cae un poco durante 2 horas. La gente se asusta, pero el RSI(2) baja a 5. ¡Esa es nuestra señal! Compramos porque sabemos que la fuerza de fondo (Stoch) sigue ahí."
          </p>
        </div>
      </c-modal-body>
      <c-modal-footer>
        <button (click)="handleVisibleChange(false)" cButton color="secondary">Cerrar</button>
      </c-modal-footer>
    </c-modal>
  `
})
export class GuideModalComponent {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    handleVisibleChange(event: boolean) {
        this.visible = event;
        this.visibleChange.emit(event);
    }
}
