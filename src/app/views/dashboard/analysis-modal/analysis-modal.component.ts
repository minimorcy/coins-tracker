import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ModalComponent, ModalHeaderComponent, ModalBodyComponent, ModalFooterComponent,
    ModalTitleDirective, ButtonDirective, CardComponent, CardBodyComponent, RowComponent, ColComponent
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
}
