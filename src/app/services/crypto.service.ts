import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private apiUrl = 'https://api.binance.com/api/v3/ticker/';

  getPrices(): Observable<any> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const symbols = config.cryptocurrencies.map(crypto => `"${crypto.symbol}"`).join(',');
        if (!symbols) {
          return of({});
        }
        const url = `${this.apiUrl}24hr?symbols=[${symbols}]`;
        return this.http.get<any>(url).pipe(
          map(response => {
            // const prices = Object.fromEntries(
            //     response.map((crypto: any) => [crypto.symbol, crypto.price])
            // );
            const prices = response.map((crypto: any) => [
                crypto.symbol, 
                {
                    lastPrice: crypto.lastPrice,
                    priceChange: crypto.priceChange,
                    priceChangePercent: crypto.priceChangePercent
                }
            ])
            return prices;
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching crypto prices:', error);
        return of({}); // Return an empty object on error
      })
    );
  }

//   get24hrChange(): Observable<any> {
//     return this.configService.getConfig().pipe(
//       switchMap(config => {
//         const symbols = config.cryptocurrencies.map(crypto => `"${crypto.symbol}"`).join(',');
//         if (!symbols) {
//           return of({});
//         }
//         const url = `${this.apiUrl}24hr?symbols=[${symbols}]`;
//         return this.http.get<any>(url).pipe(
//           map(response => {
//             const priceChange24hr = response.map((crypto: any) => [
//                 crypto.symbol, 
//                 {
//                     priceChange: crypto.priceChange,
//                     priceChangePercent: crypto.priceChangePercent
//                 }
//             ])
//             return priceChange24hr;
//           })
//         );
//       }),
//       catchError(error => {
//         console.error('Error fetching crypto prices:', error);
//         return of({}); // Return an empty object on error
//       })
//     );
//   }
}
