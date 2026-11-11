import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { GameCardComponent } from '../game-card/game-card.component';
import { IconComponent } from '../icon/icon.component';
import { formatAmerican, SPORTS } from '../../utils/format';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, GameCardComponent, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  error = false;
  summary: any = null;
  upcoming: any[] = [];
  totalGames = 0;
  totalPicks = 0;
  sportsWithGames = 0;
  nextGame: any = null;
  perf: any = null;

  /** Rendimiento en vivo del modelo NBA (predicción previa a cada partido contra el resultado). */
  get live() { return this.perf?.models?.nba_players_v2 || null; }
  get liveV1() { return this.perf?.models?.nba_possessions_v1 || null; }

  readonly sports = SPORTS;
  readonly formatAmerican = formatAmerican;

  ngOnInit() {
    this.load();
    this.api.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  load() {
    this.loading = true;
    this.error = false;
    forkJoin({
      summary: this.api.getDashboardSummary(),
      games: this.api.getGamePredictions(),
      perf: this.api.getNbaPerformance().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ summary, games, perf }: any) => {
        this.summary = summary;
        this.perf = perf;
        const list = (games.games || []).slice().sort((a: any, b: any) => (a.game_time || '').localeCompare(b.game_time || ''));
        this.upcoming = list.slice(0, 4);
        this.nextGame = list[0] || null;
        this.totalGames = list.length;
        this.sportsWithGames = new Set(list.map((g: any) => g.sport)).size;
        this.totalPicks = Object.values(summary.picks_today || {}).reduce((acc: number, s: any) => acc + (s.total || 0), 0);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el resumen:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  gamesFor(sportKey: string): number {
    return this.summary?.games_today?.[sportKey.toUpperCase()] || 0;
  }

  picksFor(sportKey: string): number {
    return this.summary?.picks_today?.[sportKey.toUpperCase()]?.total || 0;
  }
}
