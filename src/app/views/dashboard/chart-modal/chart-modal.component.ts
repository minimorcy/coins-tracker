import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ModalModule,
    ButtonDirective
} from '@coreui/angular';

declare const TradingView: any;

@Component({
    selector: 'app-chart-modal',
    templateUrl: './chart-modal.component.html',
    styleUrls: ['./chart-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, ModalModule, ButtonDirective]
})
export class ChartModalComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() visible: boolean = false;
    @Input() cryptoSymbol: string = '';
    @Input() cryptoName: string = '';
    @Input() currentPrice: string = '';
    @Output() visibleChange = new EventEmitter<boolean>();

    private scriptLoaded = false;

    constructor() { }

    ngOnInit(): void {
        this.loadTradingViewScript();
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
    }

    onVisibleChange(visible: boolean): void {
        this.visible = visible;
        this.visibleChange.emit(visible);

        if (visible && this.cryptoSymbol) {
            setTimeout(() => {
                this.initTradingViewWidget();
            }, 100);
        }
    }

    loadTradingViewScript(): void {
        if (this.scriptLoaded) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            this.scriptLoaded = true;
        };
        document.head.appendChild(script);
    }

    initTradingViewWidget(): void {
        if (typeof TradingView === 'undefined') {
            setTimeout(() => this.initTradingViewWidget(), 200);
            return;
        }

        // Clean symbol for Binance (remove quotes if any)
        let symbol = this.cryptoSymbol.replace(/"/g, '');
        // Ensure it has USDT suffix if not present (assuming USDT pairs for now based on config)
        if (!symbol.endsWith('USDT')) {
            symbol += 'USDT';
        }

        new TradingView.widget({
            "width": "100%",
            "height": 500,
            "symbol": "BINANCE:" + symbol,
            "interval": "60",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_widget",
            "studies": [
                "MAExp@tv-basicstudies",
                "RSI@tv-basicstudies"
            ],
            "studies_overrides": {
                "moving average exponential.length": 50,
                "rsi.length": 14
            }
        });
    }

    closeModal(): void {
        this.onVisibleChange(false);
    }
}
