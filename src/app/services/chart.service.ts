import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ChartDataPoint {
    time: Date;
    price: number;
}

@Injectable({
    providedIn: 'root'
})
export class ChartService {
    private http = inject(HttpClient);
    private apiUrl = 'https://api.binance.com/api/v3/klines';

    getHistoricalData(symbol: string, interval: string, limit: number = 100): Observable<ChartDataPoint[]> {
        const url = `${this.apiUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        return this.http.get<any[]>(url).pipe(
            map(response => {
                // Binance klines format: [openTime, open, high, low, close, volume, closeTime, ...]
                return response.map(candle => ({
                    time: new Date(candle[0]),
                    price: parseFloat(candle[4]) // close price
                }));
            }),
            catchError(error => {
                console.error('Error fetching chart data:', error);
                return of([]);
            })
        );
    }

    // Helper method to get interval string based on time period
    getIntervalConfig(period: '1h' | '24h' | '7d' | '30d'): { interval: string, limit: number } {
        switch (period) {
            case '1h':
                return { interval: '1m', limit: 60 }; // 60 minutes
            case '24h':
                return { interval: '15m', limit: 96 }; // 96 * 15min = 24h
            case '7d':
                return { interval: '1h', limit: 168 }; // 168 hours = 7 days
            case '30d':
                return { interval: '4h', limit: 180 }; // 180 * 4h = 30 days
            default:
                return { interval: '1h', limit: 24 };
        }
    }
}
