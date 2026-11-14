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

  /** Panel "en vivo": NBA o NFL. */
  perfNfl: any = null;
  perfSoccer: any = null;
  perfMlb: any = null;
  panelSport: 'nba' | 'nfl' | 'soccer' | 'mlb' = 'nba';
  readonly sportTitle: Record<string, string> = { nba: 'NBA', nfl: 'NFL', soccer: 'de fútbol', mlb: 'MLB' };
  get panelPerf() { return this.panelSport === 'nfl' ? this.perfNfl : this.panelSport === 'soccer' ? this.perfSoccer : this.panelSport === 'mlb' ? this.perfMlb : this.perf; }
  get pLive() { return this.panelPerf?.models?.[this.panelPerf?.main_model || 'nba_players_v2'] || null; }
  get pLiveV1() { return this.panelSport === 'nba' ? this.liveV1 : null; }

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
      perfNfl: this.api.getPerformance('nfl').pipe(catchError(() => of(null))),
      perfSoccer: this.api.getPerformance('soccer').pipe(catchError(() => of(null))),
      perfMlb: this.api.getPerformance('mlb').pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ summary, games, perf, perfNfl, perfSoccer, perfMlb }: any) => {
        this.perfSoccer = perfSoccer;
        this.perfMlb = perfMlb;
        this.summary = summary;
        this.perf = perf;
        this.perfNfl = perfNfl;
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
