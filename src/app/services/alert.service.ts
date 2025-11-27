import { Injectable } from '@angular/core';

export interface PriceAlert {
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private readonly STORAGE_KEY = 'crypto_price_alerts';
    private alerts: PriceAlert[] = [];

    constructor() {
        this.loadAlerts();
    }

    private loadAlerts() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.alerts = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing alerts', e);
            }
        }
    }

    private saveAlerts() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.alerts));
    }

    getAlerts(): PriceAlert[] {
        return this.alerts;
    }

    addAlert(alert: PriceAlert) {
        this.alerts.push(alert);
        this.saveAlerts();
    }

    removeAlert(symbol: string, targetPrice: number) {
        this.alerts = this.alerts.filter(a => !(a.symbol === symbol && a.targetPrice === targetPrice));
        this.saveAlerts();
    }

    toggleAlert(symbol: string, targetPrice: number) {
        const alert = this.alerts.find(a => a.symbol === symbol && a.targetPrice === targetPrice);
        if (alert) {
            alert.active = !alert.active;
            this.saveAlerts();
        }
    }
}
