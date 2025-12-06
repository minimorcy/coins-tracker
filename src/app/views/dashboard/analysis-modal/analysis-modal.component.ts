import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ModalComponent, ModalHeaderComponent, ModalBodyComponent, ModalFooterComponent,
    ModalTitleDirective, ButtonDirective, CardComponent, CardBodyComponent, RowComponent, ColComponent,
    AccordionModule
} from '@coreui/angular';
import { TradeSetupResult } from '../../../services/analysis.service';

@Component({
    selector: 'app-analysis-modal',
    standalone: true,
    imports: [
        CommonModule, ModalComponent, ModalHeaderComponent, ModalBodyComponent,
        ModalFooterComponent, ModalTitleDirective, ButtonDirective,
        CardComponent, CardBodyComponent, RowComponent, ColComponent
    ],
    templateUrl: './analysis-modal.component.html',
    styleUrls: ['./analysis-modal.component.scss']
})
export class AnalysisModalComponent {
    @Input() visible = false;
    @Input() cryptoName = '';
    @Input() analysisData: TradeSetupResult | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();

    handleVisibleChange(event: boolean) {
        this.visible = event;
        this.visibleChange.emit(event);
    }

    accordionVisible = false;

    toggleAccordion() {
        this.accordionVisible = !this.accordionVisible;
    }

    getTrendIcon(trend: string): string {
        if (trend === 'bullish') return '📈';
        if (trend === 'bearish') return '📉';
        return '➡️';
    }

    getDistanceToEma(): string {
        if (!this.analysisData) return '0';
        const distance = ((this.analysisData.hourly.price - this.analysisData.hourly.ema50) / this.analysisData.hourly.ema50 * 100);
        return distance.toFixed(2);
    }
}
