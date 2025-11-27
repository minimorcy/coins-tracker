import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NewsArticle {
    id: string;
    title: string;
    body: string;
    imageurl: string;
    url: string;
    source: string;
    published_on: number;
}

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    private http = inject(HttpClient);
    private apiUrl = 'https://min-api.cryptocompare.com/data/v2/news/?lang=ES';

    getNews(): Observable<NewsArticle[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => response.Data.map((item: any) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                imageurl: item.imageurl,
                url: item.url,
                source: item.source_info.name,
                published_on: item.published_on
            }))),
            catchError(error => {
                console.error('Error fetching news:', error);
                return of([]);
            })
        );
    }
}
