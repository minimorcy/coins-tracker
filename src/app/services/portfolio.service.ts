import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private readonly STORAGE_KEY = 'crypto_holdings';
    private holdings: Map<string, number> = new Map();

    constructor() {
        this.loadHoldings();
    }

    private loadHoldings(): void {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.holdings = new Map(Object.entries(parsed));
            } catch (e) {
                console.error('Error parsing holdings from localStorage', e);
            }
        }
    }

    private saveHoldings(): void {
        const obj = Object.fromEntries(this.holdings);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    }

    getHoldings(): Map<string, number> {
        return this.holdings;
    }

    getHolding(symbol: string): number {
        return this.holdings.get(symbol) || 0;
    }

    updateHolding(symbol: string, amount: number): void {
        if (amount <= 0) {
            this.holdings.delete(symbol);
        } else {
            this.holdings.set(symbol, amount);
        }
        this.saveHoldings();
    }
}
