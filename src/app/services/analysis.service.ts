import { Injectable } from '@angular/core';

export interface Kline {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TradeSetupResult {
    state: 'bullish' | 'bearish' | null;
    daily: {
        price: number;
        ema50: number;
        trend: 'bullish' | 'bearish' | 'neutral';
    };
    fourHour: {
        trend: 'bullish' | 'bearish' | 'neutral';
    };
    hourly: {
        price: number;
        ema50: number;
        touched: boolean;
        rsi: number;
        volume: {
            average: number;
            current: number;
            status: 'high' | 'low' | 'normal';
        };
        atr: number;
        adx: {
            value: number;
            strength: 'strong' | 'weak' | 'normal';
        };
        patterns: string[];
        divergence: 'bullish' | 'bearish' | null;
        stopLoss: number;
        takeProfit: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AnalysisService {

    constructor() { }

    calculateEMA(prices: number[], period: number): number[] {
        const k = 2 / (period + 1);
        const emaArray: number[] = [];
        let ema = prices[0];

        if (prices.length < period) {
            return [];
        }

        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        ema = sum / period;
        emaArray.push(ema);

        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * k) + (ema * (1 - k));
            emaArray.push(ema);
        }

        return emaArray;
    }

    calculateRSI(prices: number[], period: number = 14): number[] {
        if (prices.length < period + 1) {
            return [];
        }

        const gains: number[] = [];
        const losses: number[] = [];

        for (let i = 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) {
                gains.push(diff);
                losses.push(0);
            } else {
                gains.push(0);
                losses.push(Math.abs(diff));
            }
        }

        const rsiArray: number[] = [];
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        // First RSI
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        let rsi = 100 - (100 / (1 + rs));
        rsiArray.push(rsi);

        // Subsequent RSIs (Wilder's Smoothing)
        for (let i = period; i < gains.length; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

            rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi = 100 - (100 / (1 + rs));
            rsiArray.push(rsi);
        }

        return rsiArray;
    }

    calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
        if (highs.length < period + 1) return [];

        const trs: number[] = [];
        // First TR is High - Low
        trs.push(highs[0] - lows[0]);

        for (let i = 1; i < highs.length; i++) {
            const high = highs[i];
            const low = lows[i];
            const prevClose = closes[i - 1];

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trs.push(tr);
        }

        // Calculate ATR
        const atrArray: number[] = [];
        // First ATR is SMA of TRs
        let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
        atrArray.push(atr);

        // Subsequent ATRs (Wilder's Smoothing)
        for (let i = period; i < trs.length; i++) {
            atr = ((atr * (period - 1)) + trs[i]) / period;
            atrArray.push(atr);
        }

        return atrArray;
    }

    calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
        if (highs.length < period * 2) return [];

        const trs: number[] = [];
        const plusDMs: number[] = [];
        const minusDMs: number[] = [];

        // Initial calculations
        for (let i = 1; i < highs.length; i++) {
            const high = highs[i];
            const low = lows[i];
            const prevClose = closes[i - 1];
            const prevHigh = highs[i - 1];
            const prevLow = lows[i - 1];

            // TR
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trs.push(tr);

            // +DM, -DM
            const upMove = high - prevHigh;
            const downMove = prevLow - low;

            if (upMove > downMove && upMove > 0) plusDMs.push(upMove);
            else plusDMs.push(0);

            if (downMove > upMove && downMove > 0) minusDMs.push(downMove);
            else minusDMs.push(0);
        }

        // Smoothed TR, +DM, -DM
        let smoothTR = trs.slice(0, period).reduce((a, b) => a + b, 0);
        let smoothPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
        let smoothMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

        const adxArray: number[] = [];
        const dxArray: number[] = [];

        // Calculate first DX
        let plusDI = (smoothPlusDM / smoothTR) * 100;
        let minusDI = (smoothMinusDM / smoothTR) * 100;
        let dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
        dxArray.push(dx);

        // Calculate subsequent values
        for (let i = period; i < trs.length; i++) {
            smoothTR = smoothTR - (smoothTR / period) + trs[i];
            smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDMs[i];
            smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDMs[i];

            plusDI = (smoothPlusDM / smoothTR) * 100;
            minusDI = (smoothMinusDM / smoothTR) * 100;
            dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
            dxArray.push(dx);
        }

        // Calculate ADX (SMA of DX)
        if (dxArray.length < period) return [];

        let adx = dxArray.slice(0, period).reduce((a, b) => a + b, 0) / period;
        adxArray.push(adx);

        for (let i = period; i < dxArray.length; i++) {
            adx = ((adx * (period - 1)) + dxArray[i]) / period;
            adxArray.push(adx);
        }

        return adxArray;
    }

    detectPatterns(kline: Kline): string[] {
        const patterns: string[] = [];
        const body = Math.abs(kline.close - kline.open);
        const range = kline.high - kline.low;
        const upperWick = kline.high - Math.max(kline.open, kline.close);
        const lowerWick = Math.min(kline.open, kline.close) - kline.low;

        // Pinbar (Hammer/Shooting Star)
        // Body is small (top 30% or bottom 30% of range)
        // Long wick on one side
        if (range > 0) {
            const isSmallBody = body < range * 0.3;

            // Bullish Pinbar (Hammer) - Long lower wick
            if (isSmallBody && lowerWick > range * 0.6) {
                patterns.push('Bullish Pinbar');
            }
            // Bearish Pinbar (Shooting Star) - Long upper wick
            if (isSmallBody && upperWick > range * 0.6) {
                patterns.push('Bearish Pinbar');
            }
        }

        return patterns;
    }

    detectDivergence(prices: number[], rsi: number[], period: number = 10): 'bullish' | 'bearish' | null {
        if (prices.length < period || rsi.length < period) return null;

        // Simple divergence check looking at recent local min/max
        // This is a simplified version. Real divergence requires finding pivot points.

        // Look back 'period' candles
        const recentPrices = prices.slice(-period);
        const recentRSI = rsi.slice(-period);

        const currentPrice = recentPrices[recentPrices.length - 1];
        const currentRSIVal = recentRSI[recentRSI.length - 1];

        const minPrice = Math.min(...recentPrices.slice(0, -1));
        const minPriceIndex = recentPrices.indexOf(minPrice);
        const rsiAtMinPrice = recentRSI[minPriceIndex];

        // Bullish Divergence: Price Lower Low, RSI Higher Low
        if (currentPrice < minPrice && currentRSIVal > rsiAtMinPrice) {
            return 'bullish';
        }

        const maxPrice = Math.max(...recentPrices.slice(0, -1));
        const maxPriceIndex = recentPrices.indexOf(maxPrice);
        const rsiAtMaxPrice = recentRSI[maxPriceIndex];

        // Bearish Divergence: Price Higher High, RSI Lower High
        if (currentPrice > maxPrice && currentRSIVal < rsiAtMaxPrice) {
            return 'bearish';
        }

        return null;
    }

    checkTradeSetup(dailyKlines: Kline[], hourlyKlines: Kline[], fourHourKlines: Kline[]): TradeSetupResult | null {
        if (dailyKlines.length < 55 || hourlyKlines.length < 55 || fourHourKlines.length < 55) {
            return null;
        }

        const dailyCloses = dailyKlines.map(k => k.close);
        const hourlyCloses = hourlyKlines.map(k => k.close);
        const hourlyHighs = hourlyKlines.map(k => k.high);
        const hourlyLows = hourlyKlines.map(k => k.low);
        const hourlyVolumes = hourlyKlines.map(k => k.volume);
        const fourHourCloses = fourHourKlines.map(k => k.close);

        const dailyEMA50 = this.calculateEMA(dailyCloses, 50);
        const fourHourEMA50 = this.calculateEMA(fourHourCloses, 50);
        const hourlyEMA50 = this.calculateEMA(hourlyCloses, 50);
        const hourlyRSI = this.calculateRSI(hourlyCloses, 14);
        const hourlyATR = this.calculateATR(hourlyHighs, hourlyLows, hourlyCloses, 14);
        const hourlyADX = this.calculateADX(hourlyHighs, hourlyLows, hourlyCloses, 14);

        if (dailyEMA50.length < 2 || hourlyEMA50.length < 1 || hourlyRSI.length < 1 || hourlyATR.length < 1 || fourHourEMA50.length < 2) {
            return null;
        }

        const currentDailyEMA = dailyEMA50[dailyEMA50.length - 1];
        const prevDailyEMA = dailyEMA50[dailyEMA50.length - 2];
        const currentPrice = dailyCloses[dailyCloses.length - 1];

        // 1. Check Daily Trend
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (currentPrice > currentDailyEMA && currentDailyEMA > prevDailyEMA) {
            trend = 'bullish';
        } else if (currentPrice < currentDailyEMA && currentDailyEMA < prevDailyEMA) {
            trend = 'bearish';
        }

        // 2. Check 4H Trend
        const current4HEMA = fourHourEMA50[fourHourEMA50.length - 1];
        const prev4HEMA = fourHourEMA50[fourHourEMA50.length - 2];
        const current4HPrice = fourHourCloses[fourHourCloses.length - 1];

        let trend4h: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (current4HPrice > current4HEMA && current4HEMA > prev4HEMA) {
            trend4h = 'bullish';
        } else if (current4HPrice < current4HEMA && current4HEMA < prev4HEMA) {
            trend4h = 'bearish';
        }

        // 3. Check 1h Retracement to EMA50
        const lastHourlyKline = hourlyKlines[hourlyKlines.length - 1];
        const currentHourlyEMA = hourlyEMA50[hourlyEMA50.length - 1];
        const currentRSI = hourlyRSI[hourlyRSI.length - 1];
        const currentATR = hourlyATR[hourlyATR.length - 1];
        const currentADX = hourlyADX.length > 0 ? hourlyADX[hourlyADX.length - 1] : 0;

        // Touch condition: Low <= EMA <= High
        const touchedEMA = lastHourlyKline.low <= currentHourlyEMA && lastHourlyKline.high >= currentHourlyEMA;

        // Volume Analysis
        const volPeriod = 20;
        const recentVolumes = hourlyVolumes.slice(-volPeriod);
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const currentVolume = lastHourlyKline.volume;
        let volStatus: 'high' | 'low' | 'normal' = 'normal';
        if (currentVolume > avgVolume * 1.5) volStatus = 'high';
        else if (currentVolume < avgVolume * 0.5) volStatus = 'low';

        // Patterns & Divergence
        const patterns = this.detectPatterns(lastHourlyKline);
        const divergence = this.detectDivergence(hourlyCloses, hourlyRSI);

        let state: 'bullish' | 'bearish' | null = null;
        let stopLoss = 0;
        let takeProfit = 0;

        // Strict Rule: Daily AND 4H must match
        const trendsAligned = (trend === 'bullish' && trend4h === 'bullish') || (trend === 'bearish' && trend4h === 'bearish');

        if (trendsAligned && touchedEMA) {
            if (trend === 'bullish') {
                state = 'bullish';
                stopLoss = lastHourlyKline.low - currentATR;
                takeProfit = lastHourlyKline.close + (2 * (lastHourlyKline.close - stopLoss));
            } else {
                state = 'bearish';
                stopLoss = lastHourlyKline.high + currentATR;
                takeProfit = lastHourlyKline.close - (2 * (stopLoss - lastHourlyKline.close));
            }
        }

        return {
            state: state,
            daily: {
                price: currentPrice,
                ema50: currentDailyEMA,
                trend: trend
            },
            fourHour: {
                trend: trend4h
            },
            hourly: {
                price: lastHourlyKline.close,
                ema50: currentHourlyEMA,
                touched: touchedEMA,
                rsi: currentRSI,
                volume: {
                    average: avgVolume,
                    current: currentVolume,
                    status: volStatus
                },
                atr: currentATR,
                adx: {
                    value: currentADX,
                    strength: currentADX > 25 ? 'strong' : (currentADX < 20 ? 'weak' : 'normal')
                },
                patterns: patterns,
                divergence: divergence,
                stopLoss: stopLoss,
                takeProfit: takeProfit
            }
        };
    }
}
