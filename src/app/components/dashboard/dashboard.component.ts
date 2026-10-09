import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [ApiService]
})
export class DashboardComponent implements OnInit {
  dashboardData: any = null;
  totalGames = 0;
  totalPicks = 0;
  totalSports = 0;
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getDashboardSummary().subscribe({
      next: (data) => {
        this.dashboardData = data;
        
        let games = 0;
        let sports = 0;
        for (const [sport, count] of Object.entries(data.games_today || {})) {
          games += count as number;
          sports++;
        }
        this.totalGames = games;
        this.totalSports = sports;

        let picks = 0;
        for (const [sport, stats] of Object.entries(data.picks_today || {})) {
          picks += (stats as any).total;
        }
        this.totalPicks = picks;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
