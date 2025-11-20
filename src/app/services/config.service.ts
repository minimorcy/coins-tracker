import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private http: HttpClient) { }

  getConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(this.configUrl);
  }
}
