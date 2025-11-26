import { Component, OnInit, inject } from '@angular/core';
import {
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    RowComponent,
    TableDirective
} from '@coreui/angular';
import { ChartModalComponent } from './chart-modal/chart-modal.component';
import { CryptoService } from '../../services/crypto.service';
import { CommonModule } from '@angular/common';

export interface CryptoData {
    name: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    dailyChange: string;
    dailyChangePercent: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [CardComponent, CardBodyComponent, RowComponent, ColComponent, CardHeaderComponent, TableDirective, CommonModule, ButtonDirective, ChartModalComponent]
})
export class DashboardComponent implements OnInit {

    private cryptoService = inject(CryptoService);
    public cryptocurrencies: CryptoData[] = [];

    // Chart modal state
    public chartModalVisible: boolean = false;
    public selectedCrypto: CryptoData | null = null;

    constructor() {
    }

    ngOnInit(): void {
        this.refreshData();
    }

    refreshData(): void {
        this.cryptoService.getPrices().subscribe({
            next: data => {
                this.cryptocurrencies = data.map(([symbol, { lastPrice, priceChange, priceChangePercent, dailyChange, dailyChangePercent }]: [string, any]) => ({
                    name: symbol,
                    lastPrice: lastPrice,
                    priceChange: priceChange,
                    priceChangePercent: priceChangePercent,
                    dailyChange: dailyChange,
                    dailyChangePercent: dailyChangePercent
                }));

                console.log(this.cryptocurrencies);
            },
            error: err => {
                console.error('Error in DashboardComponent:', err);
            }
        });
    }

    openChart(crypto: CryptoData): void {
        this.selectedCrypto = crypto;
        this.chartModalVisible = true;
    }

    onChartModalVisibleChange(visible: boolean): void {
        this.chartModalVisible = visible;
        if (!visible) {
            this.selectedCrypto = null;
        }
    }

    getPerformanceBadge(crypto: CryptoData): { emoji: string, label: string, class: string } | null {
        const dailyPercent = crypto.dailyChangePercent !== 'N/A' ? +crypto.dailyChangePercent : null;

        if (dailyPercent === null) return null;

        if (dailyPercent > 5) {
            return { emoji: '🔥', label: 'Hot', class: 'badge-hot' };
        } else if (dailyPercent >= 2) {
            return { emoji: '📈', label: 'Rising', class: 'badge-rising' };
        } else if (dailyPercent <= -5) {
            return { emoji: '❄️', label: 'Cold', class: 'badge-cold' };
        } else if (dailyPercent <= -2) {
            return { emoji: '📉', label: 'Falling', class: 'badge-falling' };
        }

        return null;
    }

    getArrow(value: string): string {
        if (value === 'N/A') return '';
        const numValue = +value;
        return numValue >= 0 ? '↑' : '↓';
    }
}
