import { Component, OnInit, inject } from '@angular/core';
import {
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  RowComponent,
  TableDirective
} from '@coreui/angular';
import { CryptoService } from '../../services/crypto.service';
import { CommonModule } from '@angular/common';

export interface CryptoData {
  name: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
}

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CardComponent, CardBodyComponent, RowComponent, ColComponent, CardHeaderComponent, TableDirective, CommonModule]
})
export class DashboardComponent implements OnInit {

  private cryptoService = inject(CryptoService);
  public cryptocurrencies: CryptoData[] = [];

  constructor() {
  }

  ngOnInit(): void {
    this.cryptoService.getPrices().subscribe({
      next: data => {
        this.cryptocurrencies = data.map(([symbol, { lastPrice, priceChange, priceChangePercent }] : [string, any]) => ({
            name: symbol,
            lastPrice: lastPrice,
            priceChange: priceChange,
            priceChangePercent: priceChangePercent
        }));

        console.log(this.cryptocurrencies);
      },
      error: err => {
        console.error('Error in DashboardComponent:', err);
      }
    });
  }

}

