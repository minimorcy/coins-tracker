import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ModalModule,
    ButtonDirective,
    ButtonGroupComponent
} from '@coreui/angular';
import { ChartService, ChartDataPoint } from '../../../services/chart.service';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

type TimeInterval = '1h' | '24h' | '7d' | '30d';

@Component({
    selector: 'app-chart-modal',
    templateUrl: './chart-modal.component.html',
    styleUrls: ['./chart-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, ModalModule, ButtonDirective, ButtonGroupComponent]
})
export class ChartModalComponent implements OnInit, AfterViewInit {
    @Input() visible: boolean = false;
    @Input() cryptoSymbol: string = '';
    @Input() cryptoName: string = '';
    @Input() currentPrice: string = '';
    @Output() visibleChange = new EventEmitter<boolean>();

    @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

    selectedInterval: TimeInterval = '24h';
    loading: boolean = false;
    chart: Chart | null = null;

    constructor(private chartService: ChartService) { }

    ngOnInit(): void {
        // Chart will be loaded when modal becomes visible
    }

    ngAfterViewInit(): void {
        // Chart will be loaded when modal becomes visible
    }

    onVisibleChange(visible: boolean): void {
        this.visible = visible;
        this.visibleChange.emit(visible);

        if (visible && this.cryptoSymbol) {
            // Wait for modal animation and DOM to be ready
            setTimeout(() => {
                if (this.chartCanvas) {
                    this.loadChartData();
                }
            }, 300);
        } else if (!visible && this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    selectInterval(interval: TimeInterval): void {
        this.selectedInterval = interval;
        this.loadChartData();
    }

    loadChartData(): void {
        if (!this.chartCanvas) {
            console.log('Chart canvas not available yet');
            return;
        }

        console.log('Loading chart data for:', this.cryptoSymbol, 'interval:', this.selectedInterval);
        this.loading = true;
        const config = this.chartService.getIntervalConfig(this.selectedInterval);

        this.chartService.getHistoricalData(this.cryptoSymbol, config.interval, config.limit)
            .subscribe({
                next: (data: ChartDataPoint[]) => {
                    console.log('Chart data received:', data.length, 'points');
                    this.loading = false;
                    this.renderChart(data);
                },
                error: (err) => {
                    console.error('Error loading chart data:', err);
                    this.loading = false;
                }
            });
    }

    renderChart(data: ChartDataPoint[]): void {
        console.log('renderChart called with', data.length, 'data points');

        if (!this.chartCanvas) {
            console.log('No canvas element');
            return;
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) {
            console.log('Could not get 2d context');
            return;
        }

        const labels = data.map(d => d.time);
        const prices = data.map(d => d.price);

        console.log('First price:', prices[0], 'Last price:', prices[prices.length - 1]);

        // Determine if price is going up or down for color
        const firstPrice = prices[0] || 0;
        const lastPrice = prices[prices.length - 1] || 0;
        const isPositive = lastPrice >= firstPrice;
        const lineColor = isPositive ? 'rgb(75, 192, 75)' : 'rgb(255, 99, 99)';

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: lineColor,
                    backgroundColor: isPositive ? 'rgba(75, 192, 75, 0.1)' : 'rgba(255, 99, 99, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return value !== null ? `$${value.toFixed(2)}` : '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: this.getTimeUnit(),
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'MMM dd'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            callback: (value) => {
                                return '$' + value;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    getTimeUnit(): 'minute' | 'hour' | 'day' {
        switch (this.selectedInterval) {
            case '1h':
                return 'minute';
            case '24h':
                return 'hour';
            case '7d':
            case '30d':
                return 'day';
            default:
                return 'hour';
        }
    }

    closeModal(): void {
        this.onVisibleChange(false);
    }
}
