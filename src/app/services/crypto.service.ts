import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {
    private http = inject(HttpClient);
    private configService = inject(ConfigService);
    private apiUrl = 'https://api.binance.com/api/v3/ticker/';

    private getDailyOpenPrices(symbols: string[]): Observable<Map<string, number>> {
        // Get the start of today in UTC (00:00:00)
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const startTime = startOfDay.getTime();

        if (symbols.length === 0) {
            return of(new Map());
        }

        // Fetch klines (candlestick data) for each symbol
        const requests = symbols.map(symbol => {
            const cleanSymbol = symbol.replace(/"/g, '');
            const url = `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=1d&startTime=${startTime}&limit=1`;
            return this.http.get<any>(url).pipe(
                map(response => {
                    if (response && response.length > 0) {
                        // Kline format: [openTime, open, high, low, close, ...]
                        return { symbol: cleanSymbol, openPrice: parseFloat(response[0][1]) };
                    }
                    return { symbol: cleanSymbol, openPrice: null };
                }),
                catchError(() => of({ symbol: cleanSymbol, openPrice: null }))
            );
        });

        return forkJoin(requests).pipe(
            map(results => {
                const priceMap = new Map<string, number>();
                results.forEach(result => {
                    if (result.openPrice !== null) {
                        priceMap.set(result.symbol, result.openPrice);
                    }
                });
                return priceMap;
            })
        );
    }

    getPrices(): Observable<any> {
        return this.configService.getConfig().pipe(
            switchMap(config => {
                const symbols = config.cryptocurrencies.map(crypto => `"${crypto.symbol}"`).join(',');
                if (!symbols) {
                    return of({});
                }
                const url = `${this.apiUrl}24hr?symbols=[${symbols}]`;

                // Get both 24hr data and daily open prices
                const symbolsArray = config.cryptocurrencies.map(crypto => crypto.symbol);

                return this.http.get<any>(url).pipe(
                    switchMap(response => {
                        return this.getDailyOpenPrices(symbolsArray).pipe(
                            map(dailyOpenPrices => {
                                const prices = response.map((crypto: any) => {
                                    const currentPrice = parseFloat(crypto.lastPrice);
                                    const openPrice = dailyOpenPrices.get(crypto.symbol);

                                    let dailyChange = null;
                                    let dailyChangePercent = null;

                                    if (openPrice && openPrice > 0) {
                                        dailyChange = currentPrice - openPrice;
                                        dailyChangePercent = ((currentPrice - openPrice) / openPrice) * 100;
                                    }

                                    return [
                                        crypto.symbol,
                                        {
                                            lastPrice: crypto.lastPrice,
                                            priceChange: crypto.priceChange,
                                            priceChangePercent: crypto.priceChangePercent,
                                            dailyChange: dailyChange?.toFixed(2) || 'N/A',
                                            dailyChangePercent: dailyChangePercent?.toFixed(2) || 'N/A'
                                        }
                                    ];
                                });
                                return prices;
                            })
                        );
                    })
                );
            }),
            catchError(error => {
                console.error('Error fetching crypto prices:', error);
                return of({}); // Return an empty object on error
            })
        );
    }
}
