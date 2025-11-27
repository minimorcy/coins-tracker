import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardBodyComponent, CardHeaderComponent, RowComponent, ColComponent, ButtonDirective } from '@coreui/angular';
import { NewsService, NewsArticle } from '../../../services/news.service';

@Component({
    selector: 'app-news-feed',
    templateUrl: './news-feed.component.html',
    styleUrls: ['./news-feed.component.scss'],
    standalone: true,
    imports: [CommonModule, CardComponent, CardBodyComponent, CardHeaderComponent, RowComponent, ColComponent, ButtonDirective]
})
export class NewsFeedComponent implements OnInit {
    private newsService = inject(NewsService);
    public articles: NewsArticle[] = [];
    public loading: boolean = false;

    ngOnInit(): void {
        this.loadNews();
    }

    loadNews(): void {
        this.loading = true;
        this.newsService.getNews().subscribe(articles => {
            this.articles = articles.slice(0, 6); // Show top 6 articles
            this.loading = false;
        });
    }
}
