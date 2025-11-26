import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface CryptoConfig {
    symbol: string;
    id: string;
}

export interface AppConfig {
    cryptocurrencies: CryptoConfig[];
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    private configUrl = 'assets/config.json';
    private readonly STORAGE_KEY = 'user_crypto_list';
    private configSubject = new BehaviorSubject<AppConfig>({ cryptocurrencies: [] });

    constructor(private http: HttpClient) {
        this.loadInitialConfig();
    }

    private loadInitialConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.configSubject.next(config);
            } catch (e) {
                console.error('Error parsing saved config', e);
                this.fetchDefaultConfig();
            }
        } else {
            this.fetchDefaultConfig();
        }
    }

    private fetchDefaultConfig() {
        this.http.get<AppConfig>(this.configUrl).subscribe({
            next: (config) => {
                this.configSubject.next(config);
                this.saveToStorage(config);
            },
            error: (err) => console.error('Error loading default config', err)
        });
    }

    private saveToStorage(config: AppConfig) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    }

    getConfig(): Observable<AppConfig> {
        return this.configSubject.asObservable();
    }

    addCrypto(symbol: string) {
        const current = this.configSubject.value;
        const upperSymbol = symbol.toUpperCase();

        // Check if exists
        if (current.cryptocurrencies.some(c => c.symbol === upperSymbol)) return;

        const newConfig = {
            ...current,
            cryptocurrencies: [...current.cryptocurrencies, { symbol: upperSymbol, id: upperSymbol.toLowerCase() }]
        };
        this.configSubject.next(newConfig);
        this.saveToStorage(newConfig);
    }

    removeCrypto(symbol: string) {
        const current = this.configSubject.value;
        const newConfig = {
            ...current,
            cryptocurrencies: current.cryptocurrencies.filter(c => c.symbol !== symbol)
        };
        this.configSubject.next(newConfig);
        this.saveToStorage(newConfig);
    }
}
