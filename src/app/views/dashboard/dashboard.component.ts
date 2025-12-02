import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription, interval, forkJoin } from 'rxjs';
import {
    CardComponent, CardBodyComponent, RowComponent, ColComponent, CardHeaderComponent,
    TableDirective, ButtonDirective, FormCheckComponent, FormCheckInputDirective,
    FormCheckLabelDirective, ModalComponent, ModalHeaderComponent, ModalBodyComponent,
    ModalFooterComponent, ModalTitleDirective, FormLabelDirective, FormControlDirective,
    FormSelectDirective
} from '@coreui/angular';
import { ChartModalComponent } from './chart-modal/chart-modal.component';
import { CryptoService } from '../../services/crypto.service';
import { PortfolioService } from '../../services/portfolio.service';
import { ConfigService } from '../../services/config.service';
import { MarketService, GlobalData } from '../../services/market.service';
import { AlertService, PriceAlert } from '../../services/alert.service';
import { AnalysisService, TradeSetupResult } from '../../services/analysis.service';
import { NewsFeedComponent } from './news-feed/news-feed.component';
import { AnalysisModalComponent } from './analysis-modal/analysis-modal.component';
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
    tradeSetup?: TradeSetupResult | null;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [
        CardComponent, CardBodyComponent, RowComponent, ColComponent, CardHeaderComponent,
        TableDirective, CommonModule, ButtonDirective, ChartModalComponent, FormsModule,
        FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, NewsFeedComponent,
        ModalComponent, ModalHeaderComponent, ModalBodyComponent, ModalFooterComponent,
        ModalTitleDirective, FormLabelDirective, FormControlDirective, FormSelectDirective,
        AnalysisModalComponent
    ]
})
export class DashboardComponent implements OnInit, OnDestroy {

    private cryptoService = inject(CryptoService);
    private portfolioService = inject(PortfolioService);
    private configService = inject(ConfigService);
    private marketService = inject(MarketService);
    private alertService = inject(AlertService);
    private analysisService = inject(AnalysisService);
    public cryptocurrencies: CryptoData[] = [];
    public totalPortfolioValue: number = 0;
    public globalData: GlobalData | null = null;

    // Alert Modal state
    public alertModalVisible: boolean = false;
    public alertCrypto: CryptoData | null = null;
    public alertTargetPrice: number | null = null;
    public alertCondition: 'above' | 'below' = 'above';

    // Auto-refresh state
    public autoRefreshEnabled: boolean = true;
    private refreshSubscription: Subscription | null = null;
    private readonly REFRESH_INTERVAL = 30000; // 30 seconds

    // Chart modal state
    public chartModalVisible: boolean = false;
    public selectedCrypto: CryptoData | null = null;

    // Analysis modal state
    public analysisModalVisible: boolean = false;
    public selectedAnalysisCryptoName: string = '';
    public selectedAnalysisData: TradeSetupResult | null = null;

    // Add coin state
    public newCoinSymbol: string = '';

    // Sorting and Filtering
    public searchTerm: string = '';
    public sortColumn: string = '';
    public sortDirection: 'asc' | 'desc' = 'asc';
    public showPortfolioOnly: boolean = false;

    // Feature flags
    public showPortfolioFeatures: boolean = false;

    constructor() {
    }

    ngOnInit(): void {
        // Initial load
        this.refreshData();
        this.fetchGlobalData();
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

    fetchGlobalData(): void {
        this.marketService.getGlobalData().subscribe(data => {
            this.globalData = data;
        });
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
                this.checkAlerts();
                this.checkTradeSetups();
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

    openAnalysisModal(crypto: CryptoData, event: Event): void {
        event.stopPropagation();
        this.selectedAnalysisCryptoName = crypto.name;
        this.selectedAnalysisData = crypto.tradeSetup || null;
        this.analysisModalVisible = true;
    }

    onAnalysisModalVisibleChange(visible: boolean): void {
        this.analysisModalVisible = visible;
        if (!visible) {
            this.selectedAnalysisData = null;
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

    // Alerts
    openAlertModal(crypto: CryptoData, event: Event): void {
        event.stopPropagation();
        this.alertCrypto = crypto;
        this.alertTargetPrice = parseFloat(crypto.lastPrice);
        this.alertCondition = 'above';
        this.alertModalVisible = true;
    }

    saveAlert(): void {
        if (this.alertCrypto && this.alertTargetPrice) {
            this.alertService.addAlert({
                symbol: this.alertCrypto.name,
                targetPrice: this.alertTargetPrice,
                condition: this.alertCondition,
                active: true
            });
            this.alertModalVisible = false;
            alert(`Alert set for ${this.alertCrypto.name} at $${this.alertTargetPrice}`);
        }
    }

    checkAlerts(): void {
        const alerts = this.alertService.getAlerts().filter(a => a.active);
        alerts.forEach(alert => {
            const crypto = this.cryptocurrencies.find(c => c.name === alert.symbol);
            if (crypto) {
                const currentPrice = parseFloat(crypto.lastPrice);
                if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                    this.notifyAlert(alert, currentPrice);
                } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                    this.notifyAlert(alert, currentPrice);
                }
            }
        });
    }

    notifyAlert(alert: PriceAlert, currentPrice: number): void {
        // Simple notification for now
        // In a real app, use a Toast service or Push Notifications
        console.log(`ALERT: ${alert.symbol} is ${alert.condition} ${alert.targetPrice} (Current: ${currentPrice})`);
        // Disable alert after triggering to avoid spam
        this.alertService.toggleAlert(alert.symbol, alert.targetPrice);
    }

    get filteredCryptocurrencies(): CryptoData[] {
        let filtered = this.cryptocurrencies;

        // Filter by portfolio only
        if (this.showPortfolioOnly) {
            filtered = filtered.filter(c => (c.holdings || 0) > 0);
        }

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
    checkTradeSetups(): void {
        this.cryptocurrencies.forEach(crypto => {
            // Fetch Daily, 4H, and Hourly data
            // We need enough data for EMA50, so let's fetch 100 candles
            const daily$ = this.cryptoService.getHistoricalData(crypto.name, '1d', 100);
            const fourHour$ = this.cryptoService.getHistoricalData(crypto.name, '4h', 100);
            const hourly$ = this.cryptoService.getHistoricalData(crypto.name, '1h', 100);

            forkJoin([daily$, hourly$, fourHour$]).subscribe({
                next: ([daily, hourly, fourHour]) => {
                    crypto.tradeSetup = this.analysisService.checkTradeSetup(daily, hourly, fourHour);
                },
                error: (err) => console.error(`Error checking setup for ${crypto.name}`, err)
            });
        });
    }
}
