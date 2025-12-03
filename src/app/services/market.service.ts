import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GlobalData {
    total_market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    market_cap_percentage: { [key: string]: number };
    market_cap_change_percentage_24h_usd: number;
}

@Injectable({
    providedIn: 'root'
})
export class MarketService {
    private http = inject(HttpClient);
    private apiUrl = 'https://api.coingecko.com/api/v3/global';

    getGlobalData(): Observable<GlobalData | null> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching global market data:', error);
                return of(null);
            })
        );
    }

    getFearAndGreedIndex(): Observable<FearAndGreedData | null> {
        return this.http.get<any>('https://api.alternative.me/fng/?limit=1').pipe(
            map(response => {
                if (response.data && response.data.length > 0) {
                    return response.data[0];
                }
                return null;
            }),
            catchError(error => {
                console.error('Error fetching Fear and Greed Index:', error);
                return of(null);
            })
        );
    }
}

export interface FearAndGreedData {
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
}
