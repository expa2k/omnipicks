import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { GameCardComponent } from '../game-card/game-card.component';
import { IconComponent } from '../icon/icon.component';
import { sportIcon, sportLabel } from '../../utils/format';

type Filter = 'all' | 'value' | 'high_confidence';

@Component({
  selector: 'app-picks-table',
  standalone: true,
  imports: [CommonModule, GameCardComponent, IconComponent],
  templateUrl: './picks-table.component.html',
  styleUrl: './picks-table.component.css',
})
export class PicksTableComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  games: any[] = [];
  filteredGames: any[] = [];
  loading = true;
  error = false;
  sport: string | undefined;
  activeFilter: Filter = 'all';
  search = '';
  date: string | null = null;
  isToday = true;
  sortBy: 'time' | 'gap' | 'reco' | 'prob' = 'time';
  showFinished = false;
  finished: any[] = [];

  readonly sorts = [
    { key: 'time', label: 'Hora' },
    { key: 'reco', label: 'Recomendación' },
    { key: 'gap', label: 'Diferencia con el mercado' },
    { key: 'prob', label: 'Más seguro' },
  ] as const;

  setSort(v: string) { this.sortBy = v as any; this.applyFilter(); }

  toggleFinished() {
    this.showFinished = !this.showFinished;
    if (this.showFinished && !this.finished.length) {
      this.api.getGamePredictions(this.sport, true).subscribe({
        next: (d: any) => (this.finished = (d.games || []).filter((g: any) => g.result || g.status === 'live')),
        error: () => (this.finished = []),
      });
    }
  }

  private gap(g: any): number {
    const sp = g.odds?.spread?.home_line;
    const m = g.prediction?.predicted_spread;
    return sp === null || sp === undefined || m === null || m === undefined ? -1 : Math.abs(sp - m);
  }
  private bestEdge(g: any): number {
    return Math.max(-1, ...(g.value_picks || []).filter((pk: any) => pk.tier === 'recomendado').map((pk: any) => pk.model_edge));
  }

  /** 'hoy' o 'mañana jueves 12' según el día que devuelve la API (hora del Este). */
  get dayLabel(): string {
    if (this.isToday || !this.date) return 'hoy';
    const d = new Date(this.date + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'value', label: 'Con recomendación' },
    { key: 'high_confidence', label: 'Diferencia grande' },
  ];

  get title() { return sportLabel(this.sport); }
  get icon() { return sportIcon(this.sport); }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.sport = params['sport'];
      this.fetch();
    });
    this.api.refresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.fetch());
  }

  fetch() {
    this.loading = true;
    this.error = false;
    this.finished = [];
    this.api.getGamePredictions(this.sport).subscribe({
      next: (data: any) => {
        this.games = data.games || [];
        this.date = data.date || null;
        this.isToday = data.is_today !== false;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.games = [];
        this.applyFilter();
        this.error = true;
        this.loading = false;
      },
    });
  }

  setFilter(f: Filter) {
    this.activeFilter = f;
    this.applyFilter();
  }

  onSearch(value: string) {
    this.search = value;
    this.applyFilter();
  }

  count(f: Filter): number {
    return this.games.filter(g => this.matches(g, f)).length;
  }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    const list = this.games.filter(g =>
      this.matches(g, this.activeFilter) &&
      (!q || `${g.home_team} ${g.away_team} ${g.league}`.toLowerCase().includes(q))
    );
    const prob = (g: any) => Math.max(g.prediction?.home_win_prob || 0, g.prediction?.away_win_prob || 0);
    const key: Record<string, (g: any) => number> = {
      time: g => -new Date(g.game_time || 0).getTime(), gap: g => this.gap(g), reco: g => this.bestEdge(g), prob,
    };
    this.filteredGames = list.slice().sort((a, b) => key[this.sortBy](b) - key[this.sortBy](a));
  }

  private matches(g: any, f: Filter): boolean {
    if (f === 'value') return (g.value_picks || []).some((pk: any) => pk.tier === 'recomendado');
    if (f === 'high_confidence') return this.gap(g) >= 5;
    return true;
  }
}
