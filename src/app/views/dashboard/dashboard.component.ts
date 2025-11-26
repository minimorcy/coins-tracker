import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import {
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    RowComponent,
    TableDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
} from '@coreui/angular';
import { ChartModalComponent } from './chart-modal/chart-modal.component';
import { CryptoService } from '../../services/crypto.service';
import { PortfolioService } from '../../services/portfolio.service';
import { ConfigService } from '../../services/config.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CryptoData {
    name: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    dailyChange: string;
    dailyChangePercent: string;
    holdings?: number;
    value?: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [CardComponent, CardBodyComponent, RowComponent, ColComponent, CardHeaderComponent, TableDirective, CommonModule, ButtonDirective, ChartModalComponent, FormsModule, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective]
})
export class DashboardComponent implements OnInit, OnDestroy {

    private cryptoService = inject(CryptoService);
    private portfolioService = inject(PortfolioService);
    private configService = inject(ConfigService);
    public cryptocurrencies: CryptoData[] = [];
    public totalPortfolioValue: number = 0;

    // Auto-refresh state
    public autoRefreshEnabled: boolean = true;
    private refreshSubscription: Subscription | null = null;
    private readonly REFRESH_INTERVAL = 30000; // 30 seconds

    // Chart modal state
    public chartModalVisible: boolean = false;
    public selectedCrypto: CryptoData | null = null;

    // Add coin state
    public newCoinSymbol: string = '';

    // Sorting and Filtering
    public searchTerm: string = '';
    public sortColumn: string = '';
    public sortDirection: 'asc' | 'desc' = 'asc';

    constructor() {
    }

    ngOnInit(): void {
        // Initial load
        this.refreshData();
        this.startAutoRefresh();

        // Subscribe to config changes to refresh data when list changes
        this.configService.getConfig().subscribe(() => {
            this.refreshData();
        });
    }

    ngOnDestroy(): void {
        this.stopAutoRefresh();
    }

    toggleAutoRefresh(): void {
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    private startAutoRefresh(): void {
        this.stopAutoRefresh(); // Clear existing subscription if any
        if (this.autoRefreshEnabled) {
            this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
                this.refreshData();
            });
        }
    }

    private stopAutoRefresh(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
            this.refreshSubscription = null;
        }
    }

    refreshData(): void {
        this.cryptoService.getPrices().subscribe({
            next: data => {
                this.cryptocurrencies = data.map(([symbol, { lastPrice, priceChange, priceChangePercent, dailyChange, dailyChangePercent }]: [string, any]) => {
                    const holdings = this.portfolioService.getHolding(symbol);
                    const price = parseFloat(lastPrice);

                    return {
                        name: symbol,
                        lastPrice: lastPrice,
                        priceChange: priceChange,
                        priceChangePercent: priceChangePercent,
                        dailyChange: dailyChange,
                        dailyChangePercent: dailyChangePercent,
                        holdings: holdings,
                        value: holdings * price
                    };
                });

                this.calculateTotalValue();
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

    onHoldingChange(crypto: CryptoData, event: any): void {
        // Stop propagation to prevent row click (opening chart)
        event.stopPropagation();
    }

    updateHolding(crypto: CryptoData, newAmount: number): void {
        this.portfolioService.updateHolding(crypto.name, newAmount);
        crypto.holdings = newAmount;
        crypto.value = newAmount * parseFloat(crypto.lastPrice);
        this.calculateTotalValue();
    }

    calculateTotalValue(): void {
        this.totalPortfolioValue = this.cryptocurrencies.reduce((acc, crypto) => acc + (crypto.value || 0), 0);
    }

    addCoin(): void {
        if (this.newCoinSymbol && this.newCoinSymbol.trim()) {
            this.configService.addCrypto(this.newCoinSymbol.trim());
            this.newCoinSymbol = '';
        }
    }

    removeCoin(crypto: CryptoData, event: Event): void {
        event.stopPropagation();
        if (confirm(`Are you sure you want to remove ${crypto.name}?`)) {
            this.configService.removeCrypto(crypto.name);
            // Also remove from portfolio if exists
            this.portfolioService.updateHolding(crypto.name, 0);
        }
    }

    get filteredCryptocurrencies(): CryptoData[] {
        let filtered = this.cryptocurrencies;

        // Filter by search term
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(term));
        }

        // Sort
        if (this.sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let valA: any = a[this.sortColumn as keyof CryptoData];
                let valB: any = b[this.sortColumn as keyof CryptoData];

                // Handle numeric strings
                if (this.sortColumn === 'lastPrice' ||
                    this.sortColumn === 'priceChange' ||
                    this.sortColumn === 'priceChangePercent' ||
                    this.sortColumn === 'dailyChange' ||
                    this.sortColumn === 'dailyChangePercent' ||
                    this.sortColumn === 'value' ||
                    this.sortColumn === 'holdings') {

                    valA = valA === 'N/A' ? -Infinity : parseFloat(valA || '0');
                    valB = valB === 'N/A' ? -Infinity : parseFloat(valB || '0');
                } else {
                    valA = valA?.toString().toLowerCase() || '';
                    valB = valB?.toString().toLowerCase() || '';
                }

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }

    sort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc'; // Default to desc for numbers usually
        }
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return '↕';
        return this.sortDirection === 'asc' ? '↑' : '↓';
    }
}
